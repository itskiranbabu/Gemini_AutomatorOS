
import { GoogleGenAI, Type } from "@google/genai";
import { NodeType, WorkflowNode, WorkflowEdge, PromptResponse } from '../types';

// Safe API Key access
const getApiKey = () => {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    // Fallback for Vercel/Next env injection if mapped differently
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_KEY) {
        return process.env.NEXT_PUBLIC_API_KEY;
    }
    return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// System instruction to guide Gemini to act as an Automation Architect
const SYSTEM_INSTRUCTION = `
You are AutomatorOS, an advanced AI automation architect. 
Your goal is to accept natural language requests from users (e.g., "When a new order comes in on Shopify, if value > 100 add to VIP sheet, else send email") 
and convert them into a structured JSON representation of a workflow.

Supported Services: Gmail, Slack, Shopify, Google Sheets, Notion, GitHub, Stripe, HubSpot, Twitter, Discord, OpenAI, Gemini, System (Delay, Filter).
Node Types: TRIGGER (starts flow), ACTION (performs task), CONDITION (logic/branching), AI (generative tasks).

Crucial Rules for Branching:
- If the user implies a choice (e.g., "if X then Y else Z"), use a CONDITION node.
- Edges coming OUT of a CONDITION node MUST have a label: "true" or "false".
- Ensure the workflow graph is connected.

Output Format: JSON only.
`;

export const generateWorkflowFromPrompt = async (userPrompt: string): Promise<PromptResponse | null> => {
  try {
    if (!apiKey) {
        console.error("Missing Gemini API Key");
        throw new Error("API Key not configured");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A short, descriptive name for the workflow" },
            explanation: { type: Type.STRING, description: "Brief explanation of what this workflow does" },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: [NodeType.TRIGGER, NodeType.ACTION, NodeType.CONDITION, NodeType.AI] },
                  service: { type: Type.STRING },
                  label: { type: Type.STRING, description: "Short label for the node, e.g., 'Check Value > 100'" },
                  description: { type: Type.STRING },
                  config: { 
                    type: Type.OBJECT, 
                    description: "Key-value pairs for basic config. For CONDITIONS, use 'variable', 'operator', 'threshold'.",
                    properties: {
                         anyKey: { type: Type.STRING }
                    }
                  }
                },
                required: ["id", "type", "service", "label"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  label: { type: Type.STRING, description: "Label for the edge, critical for branches (use 'true' or 'false')" }
                },
                required: ["id", "source", "target"]
              }
            }
          },
          required: ["name", "nodes", "edges"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const data = JSON.parse(text) as PromptResponse;
    
    // Post-process to add layout coordinates
    // We attempt a naive tree layout
    const layoutNodes = data.nodes.map((node, index) => {
        // Basic check for branching to adjust Y
        const isBranch = data.edges.filter(e => e.source === node.id).length > 1;
        return {
            ...node,
            x: 100 + (index * 250),
            y: 200 + (index % 2 === 0 ? 0 : 50) 
        };
    });

    return {
      ...data,
      nodes: layoutNodes
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const explainWorkflow = async (nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<string> => {
  try {
     if (!apiKey) return "API Key missing.";
     
     // Minimize token usage by stripping heavy config
     const context = {
         nodes: nodes.map(n => ({ id: n.id, label: n.label, service: n.service, type: n.type, config: n.type === NodeType.CONDITION ? n.config : undefined })),
         edges: edges.map(e => ({ source: e.source, target: e.target, label: e.label }))
     };

     const prompt = `
       You are an expert technical writer. Analyze this automation workflow graph structure and write a concise, natural language summary (max 2 sentences).
       
       Logic handling:
       - Identify the Trigger.
       - If there are Condition nodes (branches), explain the decision logic clearly (e.g., "If X, then do Y, otherwise do Z").
       - Mention the key actions performed.
       
       Input JSON Graph:
       ${JSON.stringify(context)}
     `;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
     });
     return response.text || "No explanation available.";
  } catch (e) {
    return "Failed to generate explanation.";
  }
};

// Optimizes a workflow definition
export const optimizeWorkflow = async (current: PromptResponse): Promise<PromptResponse | null> => {
    const prompt = `
      Review the following workflow JSON and optimize it. 
      Possible optimizations: consolidate steps, fix logic gaps, suggest error handling (though not strictly required in schema), or improve naming.
      Return the OPTIMIZED JSON structure fully.
      
      Current Workflow:
      ${JSON.stringify(current)}
    `;
    return generateWorkflowFromPrompt(prompt);
};

// Execute a real AI task within a workflow run
export const performAIAction = async (prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
    try {
        if (!apiKey) return "Error: Missing API Key. Please configure NEXT_PUBLIC_API_KEY.";
        
        // Use the specified model or default to flash
        const targetModel = model.includes('gemini') ? model : 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
            model: targetModel,
            contents: prompt
        });
        
        return response.text || "No output generated.";
    } catch (e: any) {
        console.error("AI Action Error:", e);
        return `Error generating content: ${e.message}`;
    }
};
