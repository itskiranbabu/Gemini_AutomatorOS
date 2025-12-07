
import { WorkflowNode, WorkflowEdge, RunLog, RunStep, NodeType } from '../types';
import { performAIAction } from '../services/geminiService';

export interface ExecutionResult {
  runId: string;
  status: 'success' | 'failed';
  logs: RunStep[];
  duration: string;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulates processing a single node
const processNode = async (node: WorkflowNode, input: any): Promise<{ output: any, logs: string[], duration: string }> => {
  const startTime = Date.now();
  const logs: string[] = [];
  let output = { ...input };

  // Simulate realistic "Thinking" or "Network" delay (1000ms - 3000ms) - Slowed down for visual effect
  // For AI nodes, the API call takes real time, so we reduce artificial delay.
  const isAI = node.service.toLowerCase().includes('gemini') || node.service.toLowerCase().includes('ai') || node.type === NodeType.AI;
  const delay = isAI ? 500 : Math.floor(Math.random() * 2000) + 1000;
  
  logs.push(`Event: ActivityTaskScheduled (${node.service}.${node.type})`);
  await wait(delay * 0.3); // Initial handshake
  logs.push(`Event: ActivityTaskStarted`);

  // Simulate specific logic based on service/type
  switch (node.service.toLowerCase()) {
    case 'gmail':
      if (node.type === NodeType.ACTION) logs.push(`Connecting to SMTP server...`, `Authenticating...`, `Email sent to ${node.config.to || 'recipient'}`);
      break;
    case 'slack':
      logs.push(`Resolving channel ID...`, `Posting message payload...`);
      break;
    case 'shopify':
      logs.push(`Fetching order data...`, `Rate limit check: OK`);
      output = { ...output, orderId: '#SH-' + Math.floor(Math.random() * 10000), totalValue: Math.floor(Math.random() * 500) }; // Add random value for branching test
      logs.push(`Order Value: $${output.totalValue}`);
      break;
    case 'gemini':
    case 'ai':
    case 'gpt':
      logs.push(`Building prompt context...`);
      
      const promptTemplate = node.config.prompt || "Summarize the input data.";
      const model = node.config.model || 'gemini-2.5-flash';
      
      // Simple variable substitution / Context Injection
      let finalPrompt = promptTemplate;
      if (input && Object.keys(input).length > 0) {
         finalPrompt += `\n\n--- Input Data Context ---\n${JSON.stringify(input, null, 2)}`;
      }

      try {
          logs.push(`Sending request to ${model}...`);
          const aiResult = await performAIAction(finalPrompt, model);
          logs.push(`LLM Response received (${aiResult.length} chars).`);
          output = { ...output, aiResult };
      } catch (err: any) {
          logs.push(`Error calling AI: ${err.message}`);
          throw err;
      }
      break;
    case 'system':
      if (node.label.toLowerCase().includes('wait')) {
        logs.push(`Timer started...`, `Timer fired.`);
      }
      // Logic for condition evaluation
      if (node.type === NodeType.CONDITION) {
          logs.push(`Evaluating condition logic...`);
          // Simple mock evaluation: check for specific keys in input or random
          // In a real app, we would parse `node.config.expression`
          let result = true;
          
          if (node.config.variable && input[node.config.variable]) {
              const val = input[node.config.variable];
              const threshold = node.config.threshold || 0;
              const operator = node.config.operator || '>';
              
              if (operator === '>') result = val > threshold;
              else if (operator === '<') result = val < threshold;
              else if (operator === '==') result = val == threshold;
              
              logs.push(`Check: ${node.config.variable} (${val}) ${operator} ${threshold} = ${result}`);
          } else {
             // Random fallback if no config
             result = Math.random() > 0.5;
             logs.push(`No explicit config. Random evaluation: ${result}`);
          }
          
          output = { ...output, conditionResult: result };
      }
      break;
    default:
      logs.push(`Executing generic handler for ${node.service}...`);
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
  onStepUpdate: (runLog: RunLog) => void
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

  let stepInput = { trigger: 'manual_execution' };
  
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
