
import { Integration, Workflow, RunLog, Template, NodeType } from './types';

// Helper to generate dynamic past dates
const timeAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();

export const INTEGRATIONS: Integration[] = [
  { id: 'gmail', name: 'Gmail', icon: 'Mail', category: 'Communication', connected: true },
  { id: 'slack', name: 'Slack', icon: 'MessageSquare', category: 'Communication', connected: true },
  { id: 'shopify', name: 'Shopify', icon: 'ShoppingCart', category: 'E-commerce', connected: false },
  { id: 'sheets', name: 'Google Sheets', icon: 'Sheet', category: 'Data', connected: true },
  { id: 'notion', name: 'Notion', icon: 'CheckSquare', category: 'Productivity', connected: false },
  { id: 'github', name: 'GitHub', icon: 'Github', category: 'Engineering', connected: true },
  { id: 'stripe', name: 'Stripe', icon: 'CreditCard', category: 'Finance', connected: false },
  { id: 'hubspot', name: 'HubSpot', icon: 'Users', category: 'CRM', connected: false },
];

export const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'New Lead to Slack',
    description: 'Notifies the sales channel when a Typeform is submitted.',
    status: 'active',
    createdAt: timeAgo(10000),
    nodes: [
        { id: '1', type: NodeType.TRIGGER, service: 'typeform', label: 'New Submission', x: 100, y: 200, config: {} },
        { id: '2', type: NodeType.ACTION, service: 'slack', label: 'Send Message', x: 400, y: 200, config: { channel: '#sales' } }
    ], 
    edges: [{ id: 'e1', source: '1', target: '2' }],
    stats: { runs: 1240, successRate: 99.2 }
  },
  {
    id: 'wf-2',
    name: 'Weekly Report Generator',
    description: 'Compiles data from Sheets and emails a summary via Gemini.',
    status: 'paused',
    createdAt: timeAgo(20000),
    nodes: [
        { id: '1', type: NodeType.TRIGGER, service: 'system', label: 'Every Friday', x: 100, y: 200, config: {} },
        { id: '2', type: NodeType.ACTION, service: 'sheets', label: 'Get Rows', x: 350, y: 200, config: {} },
        { id: '3', type: NodeType.AI, service: 'gemini', label: 'Summarize', x: 600, y: 200, config: {} },
        { id: '4', type: NodeType.ACTION, service: 'gmail', label: 'Send Email', x: 850, y: 200, config: {} }
    ],
    edges: [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
        { id: 'e3', source: '3', target: '4' }
    ],
    stats: { runs: 45, successRate: 88.5 }
  },
  {
      id: 'wf-3',
      name: 'High Value Order Router',
      description: 'Checks order value. If > 100, alerts VIP channel, else logs to standard sheet.',
      status: 'active',
      createdAt: timeAgo(100),
      nodes: [
          { id: '1', type: NodeType.TRIGGER, service: 'shopify', label: 'New Order', x: 50, y: 250, config: {} },
          { id: '2', type: NodeType.CONDITION, service: 'system', label: 'Value > $100', x: 300, y: 250, config: { variable: 'totalValue', operator: '>', threshold: 100 } },
          { id: '3', type: NodeType.ACTION, service: 'slack', label: 'Alert VIP Channel', x: 600, y: 150, config: { channel: '#vip-orders' } },
          { id: '4', type: NodeType.ACTION, service: 'sheets', label: 'Log Standard Order', x: 600, y: 350, config: {} }
      ],
      edges: [
          { id: 'e1', source: '1', target: '2' },
          { id: 'e2', source: '2', target: '3', label: 'true' },
          { id: 'e3', source: '2', target: '4', label: 'false' }
      ],
      stats: { runs: 12, successRate: 100 }
  }
];

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tmpl-1',
    name: 'Abandoned Cart Recovery',
    description: 'When a Shopify cart is abandoned, wait 1 hour, then send a recovery email via Gmail.',
    category: 'E-commerce',
    popularity: 5,
    nodes: [
      { id: '1', type: NodeType.TRIGGER, service: 'shopify', label: 'Cart Abandoned', x: 100, y: 200, config: {} },
      { id: '2', type: NodeType.ACTION, service: 'system', label: 'Wait 1 Hour', x: 350, y: 200, config: {} },
      { id: '3', type: NodeType.ACTION, service: 'gmail', label: 'Send Email', x: 600, y: 200, config: {} }
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' }
    ]
  },
  {
    id: 'tmpl-2',
    name: 'Meeting Summarizer',
    description: 'Transcribe Zoom recording, summarize with Gemini, post to Notion.',
    category: 'Productivity',
    popularity: 4,
    nodes: [
      { id: '1', type: NodeType.TRIGGER, service: 'zoom', label: 'New Recording', x: 100, y: 200, config: {} },
      { id: '2', type: NodeType.AI, service: 'gemini', label: 'Summarize Text', x: 350, y: 200, config: {} },
      { id: '3', type: NodeType.ACTION, service: 'notion', label: 'Create Page', x: 600, y: 200, config: {} }
    ],
    edges: [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '3' }
    ]
  },
  {
    id: 'tmpl-3',
    name: 'Slack to Linear Issue',
    description: 'Create a Linear issue from a Slack message reaction.',
    category: 'Engineering',
    popularity: 4,
    nodes: [],
    edges: []
  },
  {
    id: 'tmpl-4',
    name: 'Invoice Processing',
    description: 'Extract data from PDF invoice in Gmail and add to Quickbooks.',
    category: 'Finance',
    popularity: 5,
    nodes: [],
    edges: []
  }
];

export const MOCK_RUNS: RunLog[] = [
  { 
    id: 'run-1', 
    workflowId: 'wf-1', 
    workflowName: 'New Lead to Slack',
    status: 'success', 
    startedAt: timeAgo(15), // 15 mins ago
    duration: '1.2s', 
    steps: [
      {
        id: 's1', nodeId: 'n1', nodeLabel: 'New Typeform Submission', status: 'success', startTime: timeAgo(15), input: {}, output: { email: 'test@example.com' },
        logs: ['Event: WorkflowExecutionStarted', 'Event: ActivityTaskScheduled (TypeformTrigger)', 'Event: ActivityTaskCompleted']
      },
      {
        id: 's2', nodeId: 'n2', nodeLabel: 'Format Message', status: 'success', startTime: timeAgo(14.9), input: { email: 'test@example.com' }, output: { text: 'New lead: test@example.com' },
        logs: ['Event: ActivityTaskScheduled (FormatString)', 'Event: ActivityTaskCompleted']
      },
      {
        id: 's3', nodeId: 'n3', nodeLabel: 'Send to Slack', status: 'success', startTime: timeAgo(14.8), input: { channel: '#sales' }, output: { ok: true },
        logs: ['Event: ActivityTaskScheduled (SlackSend)', 'Event: ActivityTaskCompleted', 'Event: WorkflowExecutionCompleted']
      }
    ] 
  },
  { 
    id: 'run-2', 
    workflowId: 'wf-1', 
    workflowName: 'New Lead to Slack',
    status: 'success', 
    startedAt: timeAgo(60), 
    duration: '0.8s', 
    steps: [] 
  },
  { 
    id: 'run-3', 
    workflowId: 'wf-1', 
    workflowName: 'New Lead to Slack',
    status: 'failed', 
    startedAt: timeAgo(240), 
    duration: '5.1s', 
    steps: [] 
  },
  { 
    id: 'run-4', 
    workflowId: 'wf-2', 
    workflowName: 'Weekly Report Generator',
    status: 'success', 
    startedAt: timeAgo(1440), // 1 day ago
    duration: '12s', 
    steps: [] 
  },
];

export const DB_SCHEMA_SQL = `
-- Supabase / Postgres Schema

-- Workspaces: Tenant isolation
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users: Linked to Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  workspace_id UUID REFERENCES workspaces(id),
  role TEXT DEFAULT 'editor',
  email TEXT
);

-- Workflows: The core definition
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  definition JSONB NOT NULL, -- { nodes: [], edges: [] }
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runs: Execution history (Temporal pattern)
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id),
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  logs JSONB, -- Array of step results
  error_details TEXT
);

-- Connections: Oauth tokens (Encrypted)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  service_id TEXT NOT NULL, -- 'gmail', 'slack'
  encrypted_credentials TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see workflows in their workspace" ON workflows
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));
`;
