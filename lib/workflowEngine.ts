
import { WorkflowNode, WorkflowEdge, RunLog, RunStep, NodeType } from '../types';

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

  // Simulate realistic "Thinking" or "Network" delay (500ms - 2000ms)
  const delay = Math.floor(Math.random() * 1500) + 500;
  
  logs.push(`Event: ActivityTaskScheduled (${node.service}.${node.type})`);
  await wait(delay / 2); // Initial handshake
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
      output = { ...output, orderId: '#SH-' + Math.floor(Math.random() * 10000) };
      break;
    case 'gemini':
    case 'ai':
      logs.push(`Sending prompt to LLM...`, `Tokens processed: ${Math.floor(Math.random() * 500)}`);
      output = { ...output, aiSummary: "This is a simulated AI summary of the content." };
      break;
    case 'system':
      if (node.label.toLowerCase().includes('wait')) {
        logs.push(`Timer started...`, `Timer fired.`);
      }
      break;
    default:
      logs.push(`Executing generic handler for ${node.service}...`);
  }

  await wait(delay / 2); // Processing time
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

    // 2. Execute Step
    try {
      const { output, logs, duration } = await processNode(currentNode, stepInput);
      
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
        logs: ['Error: Execution failed', 'Stack trace: ...']
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

    // 3. Find next node
    const nextEdge = edges.find(e => e.source === currentNode!.id);
    if (nextEdge) {
      currentNode = nodes.find(n => n.id === nextEdge.target);
    } else {
      currentNode = undefined; // End of flow
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
