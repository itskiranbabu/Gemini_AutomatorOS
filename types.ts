

export enum NodeType {
  TRIGGER = 'TRIGGER',
  ACTION = 'ACTION',
  CONDITION = 'CONDITION',
  AI = 'AI',
  SCRIPT = 'SCRIPT',
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  service: string; // e.g., 'gmail', 'slack', 'shopify', 'system', 'script'
  label: string;
  description?: string;
  config: Record<string, any>;
  x: number; // For visualization
  y: number; // For visualization
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'paused';
  createdAt: string;
  lastRun?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  stats: {
    runs: number;
    successRate: number;
  };
}

export interface RunStep {
  id: string;
  nodeId: string;
  nodeLabel: string;
  status: 'success' | 'failed' | 'pending';
  startTime: string;
  endTime?: string;
  duration?: string;
  input: any;
  output: any;
  logs: string[]; // Mocking Temporal event history lines
}

export interface RunLog {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  duration: string;
  steps: RunStep[];
}

export interface Integration {
  id: string;
  name: string;
  icon: string; // lucide icon name
  category: string;
  connected: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  popularity: number; // 1-5 stars
}

export interface PromptResponse {
  id?: string; // Optional: If present, we are editing an existing workflow
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  explanation: string;
}

export interface UserProfile {
  workspaceName: string;
  email: string;
  plan: string;
  avatarInitials: string;
}