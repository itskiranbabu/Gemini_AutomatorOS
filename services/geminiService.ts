import { GoogleGenAI, Type } from "@google/genai";
import { NodeType, WorkflowNode, WorkflowEdge, PromptResponse } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction to guide Gemini to act as an Automation Architect
const SYSTEM_INSTRUCTION = `
You are AutomatorOS, an advanced AI automation architect. 
Your goal is to accept natural language requests from users (e.g., "When a new order comes in on Shopify, add it to Sheets and message Slack") 
and convert them into a structured JSON representation of a workflow.

Supported Services: Gmail, Slack, Shopify, Google Sheets, Notion, GitHub, Stripe, HubSpot, Twitter, Discord, OpenAI, Gemini, System (Delay, Filter).
Node Types: TRIGGER (starts flow), ACTION (performs task), CONDITION (logic), AI (generative tasks).

Output Format: JSON only.
`;

export const generateWorkflowFromPrompt = async (userPrompt: string): Promise<PromptResponse | null> => {
  try {
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
                  label: { type: Type.STRING, description: "Short label for the node, e.g., 'New Email'" },
                  description: { type: Type.STRING },
                  config: { 
                    type: Type.OBJECT, 
                    description: "Key-value pairs for basic config, e.g., { 'channel': '#general' }",
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
                  label: { type: Type.STRING }
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
    
    // Post-process to add layout coordinates (simple auto-layout)
    // A real app would use Dagre or Elkjs. Here we simulate a simple horizontal layout.
    const layoutNodes = data.nodes.map((node, index) => ({
      ...node,
      x: 100 + (index * 250),
      y: 200 + (index % 2 === 0 ? 0 : 50) // Slight stagger for visual interest
    }));

    return {
      ...data,
      nodes: layoutNodes
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const explainWorkflow = async (nodes: WorkflowNode[]): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Explain this workflow structure in simple terms: ${JSON.stringify(nodes.map(n => ({ label: n.label, service: n.service })))}`,
     });
     return response.text || "No explanation available.";
  } catch (e) {
    return "Failed to generate explanation.";
  }
};
