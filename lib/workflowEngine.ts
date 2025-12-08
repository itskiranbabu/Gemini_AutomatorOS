
import { WorkflowNode, WorkflowEdge, RunLog, RunStep, NodeType } from '../types';
import { performAIAction } from '../services/geminiService';

export interface ExecutionResult {
  runId: string;
  status: 'success' | 'failed';
  logs: RunStep[];
  duration: string;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Retry Logic ---
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

// Wrapper to retry a function with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, operationName: string, logs: string[]): Promise<T> {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            return await fn();
        } catch (error: any) {
            attempt++;
            const delay = BASE_DELAY * Math.pow(2, attempt - 1); // 1s, 2s, 4s...
            logs.push(`⚠️ Error in ${operationName}: ${error.message}. Retrying (${attempt}/${MAX_RETRIES}) in ${delay}ms...`);
            
            if (attempt >= MAX_RETRIES) {
                throw error;
            }
            await wait(delay);
        }
    }
    throw new Error("Unreachable");
}

// --- Data Mapping Logic ---
// Replaces {{variableName}} in configuration strings with actual values from input
const resolveConfig = (config: any, context: any): any => {
  if (typeof config === 'string') {
    // Regex to find {{ key }}
    return config.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const cleanKey = key.trim();
      const value = context[cleanKey];
      // If found, return stringified value. If not, keep original placeholder (or empty string)
      return value !== undefined ? String(value) : `{{${cleanKey}}}`;
    });
  } else if (Array.isArray(config)) {
    return config.map(item => resolveConfig(item, context));
  } else if (typeof config === 'object' && config !== null) {
    const resolved: any = {};
    for (const key in config) {
        resolved[key] = resolveConfig(config[key], context);
    }
    return resolved;
  }
  return config;
}


// Simulates processing a single node
const processNode = async (node: WorkflowNode, input: any): Promise<{ output: any, logs: string[], duration: string }> => {
  const startTime = Date.now();
  const logs: string[] = [];
  let output = { ...input };

  // Resolve Configuration Variables
  // e.g. "Subject: Order {{orderId}}" -> "Subject: Order #123"
  const finalConfig = resolveConfig(node.config, input);

  // Simulate realistic "Thinking" or "Network" delay (1000ms - 3000ms) - Slowed down for visual effect
  // For AI nodes, the API call takes real time, so we reduce artificial delay.
  // Script nodes are instantaneous
  const isAI = node.service.toLowerCase().includes('gemini') || node.service.toLowerCase().includes('ai') || node.type === NodeType.AI;
  const isScript = node.type === NodeType.SCRIPT;
  const delay = isAI || isScript ? 500 : Math.floor(Math.random() * 1500) + 500;
  
  logs.push(`Event: ActivityTaskScheduled (${node.service}.${node.type})`);
  await wait(delay * 0.3); // Initial handshake
  logs.push(`Event: ActivityTaskStarted`);

  // Define the core work function for retries
  const doWork = async () => {
      // Simulate specific logic based on service/type
      if (node.type === NodeType.SCRIPT) {
          logs.push(`Executing custom script sandbox...`);
          try {
              const userCode = node.config.code || "return { status: 'noop' };";
              // Create a safe-ish function with input available
              // In a real env, this would be a V8 Isolate or WASM sandbox
              const scriptFn = new Function('input', userCode);
              
              const scriptResult = scriptFn(input);
              
              if (typeof scriptResult === 'object') {
                  output = { ...output, ...scriptResult };
              } else {
                  output = { ...output, result: scriptResult };
              }
              logs.push(`Script execution completed.`);
          } catch (e: any) {
              // Scripts usually shouldn't retry on logic errors, but for system stability simulation we might
              throw new Error(`Script Error: ${e.message}`);
          }
      } else {

        switch (node.service.toLowerCase()) {
            case 'gmail':
            if (node.type === NodeType.ACTION) {
                logs.push(`Connecting to SMTP server...`, `Authenticating...`);
                logs.push(`Sending email to: ${finalConfig.to || 'recipient'}`);
                logs.push(`Subject: ${finalConfig.subject || '(No Subject)'}`);
                // In a real app, this is where we'd use the resolved body
            }
            break;
            case 'slack':
            logs.push(`Resolving channel ID...`); 
            logs.push(`Posting message to ${finalConfig.channel || 'channel'}: "${finalConfig.message?.substring(0, 20)}..."`);
            break;
            case 'shopify':
            logs.push(`Fetching order data...`, `Rate limit check: OK`);
            // Mock intermittent failure for demo purposes
            if (Math.random() > 0.95) throw new Error("Shopify API Rate Limit Exceeded");
            output = { ...output, orderId: '#SH-' + Math.floor(Math.random() * 10000), totalValue: Math.floor(Math.random() * 500) }; 
            logs.push(`Order Value: $${output.totalValue}`);
            break;
            case 'gemini':
            case 'ai':
            case 'gpt':
            logs.push(`Building prompt context...`);
            
            const promptTemplate = finalConfig.prompt || "Summarize the input data.";
            const model = finalConfig.model || 'gemini-2.5-flash';
            
            // Context is already injected via resolveConfig if user used {{variables}}
            // We append raw JSON as a fallback context if the prompt is short
            let finalPrompt = promptTemplate;
            if (input && Object.keys(input).length > 0 && !promptTemplate.includes('{{')) {
                finalPrompt += `\n\n--- Input Data Context ---\n${JSON.stringify(input, null, 2)}`;
            }

            logs.push(`Sending request to ${model}...`);
            const aiResult = await performAIAction(finalPrompt, model);
            logs.push(`LLM Response received (${aiResult.length} chars).`);
            output = { ...output, aiResult };
            break;
            case 'system':
            if (node.label.toLowerCase().includes('wait')) {
                logs.push(`Timer started...`, `Timer fired.`);
            }
            // Logic for condition evaluation
            if (node.type === NodeType.CONDITION) {
                logs.push(`Evaluating condition logic...`);
                // Use resolved config (values are already interpolated)
                let result = true;
                
                // If the user mapped a variable into 'variable' field using {{}}, resolvedConfig handled it.
                // But usually 'variable' config is the key name, e.g. "totalValue"
                // So we check raw config for the key, then look up in input.
                
                // Hybrid approach: If config.variable exists in input, use it.
                const varName = node.config.variable;
                const val = input[varName] !== undefined ? input[varName] : parseFloat(varName) || 0;
                
                const threshold = parseFloat(finalConfig.threshold) || 0;
                const operator = finalConfig.operator || '>';
                
                if (operator === '>') result = val > threshold;
                else if (operator === '<') result = val < threshold;
                else if (operator === '==') result = val == threshold;
                else if (operator === '!=') result = val != threshold;
                else if (operator === 'contains') result = String(val).includes(String(threshold));
                
                logs.push(`Check: ${varName} (${val}) ${operator} ${threshold} = ${result}`);
                
                output = { ...output, conditionResult: result };
            }
            break;
            default:
            logs.push(`Executing generic handler for ${node.service}...`);
        }
      }
  };

  // Execute work with retries
  try {
      await withRetry(doWork, node.label, logs);
  } catch (e: any) {
      logs.push(`❌ Activity Failed after retries: ${e.message}`);
      throw e;
  }

  await wait(delay * 0.7); // Processing time
  logs.push(`Event: ActivityTaskCompleted`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
  return { output, logs, duration };
};

export const executeWorkflow = async (
  workflowId: string,
  workflowName: string,
  nodes: WorkflowNode[], 
  edges: WorkflowEdge[],
  onStepUpdate: (runLog: RunLog) => void,
  initialInput: any = { trigger: 'manual_execution' }
): Promise<RunLog> => {
  const runId = `run-${Date.now()}`;
  const startTime = new Date();

  let currentRunLog: RunLog = {
    id: runId,
    workflowId,
    workflowName,
    status: 'running',
    startedAt: startTime.toISOString(),
    duration: '0s',
    steps: []
  };

  // Initial update
  onStepUpdate(currentRunLog);

  // Topological sort or simple sequence following edges
  // For this demo, we assume a linear or tree structure starting from the Trigger
  // We find the node with no incoming edges (Trigger)
  const incomingEdges = new Set(edges.map(e => e.target));
  let currentNode = nodes.find(n => !incomingEdges.has(n.id));

  // Fallback if circular or complex: just take the first node
  if (!currentNode) currentNode = nodes[0];

  let stepInput = initialInput;
  
  while (currentNode) {
    // 1. Mark step as pending
    const stepId = `step-${Date.now()}`;
    const pendingStep: RunStep = {
      id: stepId,
      nodeId: currentNode.id,
      nodeLabel: currentNode.label,
      status: 'pending',
      startTime: new Date().toISOString(),
      input: stepInput,
      output: {},
      logs: []
    };

    currentRunLog = {
      ...currentRunLog,
      steps: [...currentRunLog.steps, pendingStep]
    };
    onStepUpdate(currentRunLog);

    let stepOutput = {};

    // 2. Execute Step
    try {
      const { output, logs, duration } = await processNode(currentNode, stepInput);
      stepOutput = output;
      
      // Update step to success
      const completedStep: RunStep = {
        ...pendingStep,
        status: 'success',
        endTime: new Date().toISOString(),
        duration,
        output,
        logs
      };

      currentRunLog = {
        ...currentRunLog,
        steps: currentRunLog.steps.map(s => s.id === stepId ? completedStep : s)
      };
      
      stepInput = { ...stepInput, ...output }; // Pass data forward
      onStepUpdate(currentRunLog);

    } catch (error) {
       // Fail run
       const failedStep: RunStep = {
        ...pendingStep,
        status: 'failed',
        endTime: new Date().toISOString(),
        logs: ['Error: Execution failed', `Details: ${error}`]
      };
      
      currentRunLog = {
        ...currentRunLog,
        status: 'failed',
        duration: ((Date.now() - startTime.getTime()) / 1000).toFixed(1) + 's',
        steps: currentRunLog.steps.map(s => s.id === stepId ? failedStep : s)
      };
      onStepUpdate(currentRunLog);
      return currentRunLog;
    }

    // 3. Find next node (Branching Logic)
    if (currentNode.type === NodeType.CONDITION) {
        // Look for edges based on result
        const result = (stepOutput as any).conditionResult;
        const targetLabel = result === true ? 'true' : 'false';
        
        // Try to find edge labeled explicitly, or fallback to any edge if not labeled
        let nextEdge = edges.find(e => e.source === currentNode!.id && e.label?.toLowerCase() === targetLabel);
        
        // Fallback: If no explicit 'true'/'false' edge, just take the first one (maybe single path)
        if (!nextEdge) {
             nextEdge = edges.find(e => e.source === currentNode!.id);
        }

        if (nextEdge) {
            currentNode = nodes.find(n => n.id === nextEdge.target);
        } else {
            currentNode = undefined;
        }

    } else {
        // Standard linear transition
        const nextEdge = edges.find(e => e.source === currentNode!.id);
        if (nextEdge) {
            currentNode = nodes.find(n => n.id === nextEdge.target);
        } else {
            currentNode = undefined; // End of flow
        }
    }
  }

  // Complete Run
  currentRunLog = {
    ...currentRunLog,
    status: 'success',
    duration: ((Date.now() - startTime.getTime()) / 1000).toFixed(1) + 's'
  };
  onStepUpdate(currentRunLog);

  return currentRunLog;
};
