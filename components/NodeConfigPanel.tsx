
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Info, Code, Braces, Play, Loader2, Beaker, Terminal } from 'lucide-react';
import { WorkflowNode, NodeType } from '../types';
import { processNode } from '../lib/workflowEngine';
import { getUpstreamNodes } from '../lib/workflowUtils';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  nodes: WorkflowNode[]; // Access to other nodes for variable suggestions
  edges?: any[]; // Pass edges to calculate graph
  onClose: () => void;
  onUpdate: (updatedNode: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, nodes, edges = [], onClose, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'test'>('config');
  
  // Config State
  const [label, setLabel] = useState('');
  const [service, setService] = useState('');
  const [type, setType] = useState<NodeType>(NodeType.ACTION);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [mode, setMode] = useState<'form' | 'json' | 'code'>('form');
  const [jsonStr, setJsonStr] = useState('');
  const [codeStr, setCodeStr] = useState('');
  const [showVars, setShowVars] = useState(false);

  // Test State
  const [testInput, setTestInput] = useState('{\n  "email": "test@example.com"\n}');
  const [testResult, setTestResult] = useState<{ output?: any, logs?: string[], error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (node) {
      setLabel(node.label);
      setService(node.service);
      setType(node.type);
      setConfig(node.config || {});
      setJsonStr(JSON.stringify(node.config || {}, null, 2));
      setCodeStr(node.config?.code || '// Write JavaScript here.\n// Access input via `input` object.\n// Return an object to merge with output.\n\nconst value = input.totalValue || 0;\nreturn { calculatedTax: value * 0.2 };');
      
      // Auto-switch to code mode for Script nodes
      if (node.type === NodeType.SCRIPT) {
          setMode('code');
      } else {
          setMode('form');
      }
      
      // Reset Test State
      setTestResult(null);
      setActiveTab('config');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    try {
      let finalConfig = config;
      if (mode === 'json') {
          finalConfig = JSON.parse(jsonStr);
      } else if (mode === 'code') {
          // Store code string in config
          finalConfig = { ...config, code: codeStr };
      }
      onUpdate({ 
          ...node, 
          label, 
          service,
          type,
          config: finalConfig 
      });
    } catch (e) {
      alert("Invalid configuration format");
    }
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
        const input = JSON.parse(testInput);
        
        // Prepare temporary node with current un-saved config for testing
        let tempConfig = config;
        if (mode === 'json') tempConfig = JSON.parse(jsonStr);
        if (mode === 'code') tempConfig = { ...config, code: codeStr };
        
        const tempNode = { ...node, label, service, type, config: tempConfig };
        
        const { output, logs } = await processNode(tempNode, input);
        setTestResult({ output, logs });
    } catch (e: any) {
        setTestResult({ error: e.message || 'Unknown Error', logs: [`Error: ${e.message}`] });
    } finally {
        setIsTesting(false);
    }
  };

  const updateConfigField = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setJsonStr(JSON.stringify(newConfig, null, 2));
  };

  // Helper to guess variables based on service type
  const getVarsForService = (svc: string) => {
      if (svc.includes('shopify')) return ['orderId', 'totalValue', 'customerEmail', 'items'];
      if (svc.includes('typeform')) return ['formId', 'answers', 'email'];
      if (svc.includes('github')) return ['repo', 'pr_number', 'branch'];
      if (svc.includes('gemini') || svc.includes('ai')) return ['aiResult', 'summary'];
      if (svc.includes('http')) return ['status', 'data'];
      return ['id', 'timestamp'];
  }

  // Generate available variables list based on GRAPH TRAVERSAL
  const upstreamNodes = getUpstreamNodes(nodes, edges, node.id);
  const availableVars = upstreamNodes.map(n => ({
      source: n.label,
      vars: getVarsForService(n.service)
  }));


  // Helper to render form fields based on service type
  const renderFormFields = () => {
    const s = service.toLowerCase();

    // 0. HTTP Request
    if (s === 'http') {
        return (
            <>
                <SelectField 
                    label="Method" 
                    value={config.method} 
                    onChange={(v) => updateConfigField('method', v)} 
                    options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH']} 
                />
                <InputField label="URL" value={config.url} onChange={(v) => updateConfigField('url', v)} placeholder="https://api.example.com/v1/resource" />
                {config.method !== 'GET' && config.method !== 'DELETE' && (
                    <TextAreaField label="JSON Body" value={config.body} onChange={(v) => updateConfigField('body', v)} placeholder='{ "key": "{{value}}" }' />
                )}
                <TextAreaField label="Headers (JSON)" value={config.headers} onChange={(v) => updateConfigField('headers', v)} placeholder='{ "Authorization": "Bearer key" }' />
            </>
        )
    }

    // 1. Gmail / Email
    if (s.includes('gmail') || s.includes('mail')) {
      return (
        <>
          <InputField label="To Address" value={config.to} onChange={(v) => updateConfigField('to', v)} placeholder="recipient@example.com" />
          <InputField label="Subject" value={config.subject} onChange={(v) => updateConfigField('subject', v)} placeholder="New Alert: {{orderId}}" />
          <TextAreaField label="Body" value={config.body} onChange={(v) => updateConfigField('body', v)} placeholder="Hello {{name}}, ..." />
        </>
      );
    }

    // 2. Slack / Discord
    if (s.includes('slack') || s.includes('discord')) {
      return (
        <>
          <InputField label="Channel" value={config.channel} onChange={(v) => updateConfigField('channel', v)} placeholder="#general" />
          <TextAreaField label="Message" value={config.message} onChange={(v) => updateConfigField('message', v)} placeholder="New Lead: {{email}}..." />
        </>
      );
    }

    // 3. Shopify / E-commerce
    if (s.includes('shopify')) {
      return (
        <>
          <SelectField 
            label="Resource" 
            value={config.resource} 
            onChange={(v) => updateConfigField('resource', v)} 
            options={['Orders', 'Products', 'Customers', 'Inventory']} 
          />
          <SelectField 
            label="Event" 
            value={config.event} 
            onChange={(v) => updateConfigField('event', v)} 
            options={['Created', 'Updated', 'Deleted', 'Paid', 'Fulfilled']} 
          />
        </>
      );
    }

    // 4. AI / Gemini
    if (s.includes('gemini') || s.includes('gpt') || s.includes('ai')) {
      return (
        <>
          <SelectField 
            label="Model" 
            value={config.model} 
            onChange={(v) => updateConfigField('model', v)} 
            options={['gemini-2.5-flash', 'gemini-pro', 'gpt-4']} 
          />
          <TextAreaField label="Prompt" value={config.prompt} onChange={(v) => updateConfigField('prompt', v)} placeholder="Summarize this text: {{body}}..." />
        </>
      );
    }
    
    // 5. Condition
    if (type === NodeType.CONDITION) {
        return (
            <>
                <InputField label="Variable" value={config.variable} onChange={(v) => updateConfigField('variable', v)} placeholder="e.g. totalValue" />
                <div className="grid grid-cols-2 gap-2">
                    <SelectField 
                        label="Operator" 
                        value={config.operator} 
                        onChange={(v) => updateConfigField('operator', v)} 
                        options={['>', '<', '==', '!=', 'contains']} 
                    />
                    <InputField label="Threshold" value={config.threshold} onChange={(v) => updateConfigField('threshold', v)} placeholder="100" />
                </div>
            </>
        )
    }

    // 6. Webhook (Trigger)
    if (s === 'webhook') {
        return (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Webhook URL</label>
                <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-slate-900 px-2 py-1.5 rounded text-xs text-blue-300 font-mono break-all border border-slate-700">
                        https://api.automator.os/hooks/wk_{node.id.slice(0,8)}
                    </code>
                    <button className="text-xs bg-slate-800 px-2 py-1.5 rounded text-slate-300 hover:text-white border border-slate-700 transition-colors">
                        Copy
                    </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                    Send a POST request to this URL to trigger this workflow.
                </p>
            </div>
        )
    }

    // Default Fallback
    return (
      <div className="text-center py-4 text-slate-500 text-sm bg-slate-800/30 rounded-lg">
        No smart fields available for {service}. <br/> Use JSON mode.
      </div>
    );
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-xl">
        <div className="flex justify-between items-center mb-3">
             <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                Node Editor
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
            </button>
        </div>
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button 
                onClick={() => setActiveTab('config')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'config' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Configuration
            </button>
            <button 
                 onClick={() => setActiveTab('test')}
                 className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'test' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Beaker size={12} /> Test Step
            </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* CONFIG TAB */}
        {activeTab === 'config' && (
            <>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Step Name</label>
                        <input 
                        type="text" 
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                            <select 
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value as NodeType);
                                    if (e.target.value === NodeType.SCRIPT) setMode('code');
                                    else setMode('form');
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                            >
                                {Object.values(NodeType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service</label>
                            <select 
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                            >
                                <option value="system">System</option>
                                <option value="http">HTTP Request</option>
                                <option value="webhook">Webhook (Trigger)</option>
                                <option value="gmail">Gmail</option>
                                <option value="slack">Slack</option>
                                <option value="shopify">Shopify</option>
                                <option value="sheets">Sheets</option>
                                <option value="gemini">Gemini AI</option>
                                <option value="script">Script (JS)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Configuration</label>
                    
                    {type === NodeType.SCRIPT ? (
                        <span className="text-[10px] font-mono text-pink-400">JavaScript Mode</span>
                    ) : (
                        <div className="flex bg-slate-800 rounded-lg p-0.5">
                            <button 
                                onClick={() => setMode('form')}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${mode === 'form' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Form
                            </button>
                            <button 
                                onClick={() => setMode('json')}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all flex items-center gap-1 ${mode === 'json' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Code size={10} /> JSON
                            </button>
                        </div>
                    )}
                </div>

                {/* Dynamic Fields */}
                <div className="space-y-4 h-full">
                    {mode === 'code' ? (
                        <div className="relative h-64 flex flex-col">
                            <textarea 
                                value={codeStr}
                                onChange={(e) => setCodeStr(e.target.value)}
                                className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-pink-300 focus:outline-none focus:border-pink-500 resize-none leading-relaxed custom-scrollbar"
                                spellCheck={false}
                            />
                            <p className="text-[10px] text-slate-500 mt-2">
                                Execute raw JS. Return an object to merge it into the workflow payload.
                            </p>
                        </div>
                    ) : mode === 'form' ? renderFormFields() : (
                        <div className="relative">
                            <textarea 
                            value={jsonStr}
                            onChange={(e) => setJsonStr(e.target.value)}
                            className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-blue-300 focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Directly edit the JSON configuration payload.</p>
                        </div>
                    )}

                    {/* Variable Helper */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
                        <button onClick={() => setShowVars(!showVars)} className="w-full flex justify-between items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors">
                            <span className="flex items-center"><Braces size={12} className="mr-1"/> Available Variables</span>
                            <Info size={12} />
                        </button>
                        {showVars && (
                            <div className="mt-2 text-[10px] space-y-2 animate-in slide-in-from-top-2">
                                {availableVars.map((group, i) => (
                                    <div key={i}>
                                        <div className="text-slate-500 font-medium mb-0.5">{group.source}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {group.vars.map(v => (
                                                <code key={v} className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700 select-all cursor-copy" title="Click to copy" onClick={() => {
                                                    navigator.clipboard.writeText(`{{${v}}}`);
                                                }}>
                                                    {`{{${v}}}`}
                                                </code>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {availableVars.length === 0 && <span className="text-slate-600">No predecessor variables found (connect nodes first).</span>}
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}

        {/* TEST TAB */}
        {activeTab === 'test' && (
            <div className="h-full flex flex-col space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mock Input (JSON)</label>
                    <textarea 
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-blue-300 focus:outline-none focus:border-brand-500 resize-none leading-relaxed custom-scrollbar"
                    />
                 </div>

                 <button 
                    onClick={handleRunTest}
                    disabled={isTesting}
                    className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-brand-900/20"
                 >
                    {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                    <span>Run Test Step</span>
                 </button>

                 <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <Terminal size={12} /> Result
                    </label>
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-auto custom-scrollbar">
                        {testResult ? (
                            <>
                                {testResult.error && (
                                    <div className="text-red-400 text-xs mb-2 border-b border-red-900/30 pb-2">
                                        <strong>Error:</strong> {testResult.error}
                                    </div>
                                )}
                                <div className="space-y-1">
                                    {testResult.logs?.map((log, i) => (
                                        <div key={i} className="text-[10px] font-mono text-slate-400 border-b border-slate-800/50 pb-0.5 mb-0.5">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                                {testResult.output && (
                                    <div className="mt-2 pt-2 border-t border-slate-800">
                                        <div className="text-[10px] text-emerald-500 font-bold mb-1">OUTPUT PAYLOAD:</div>
                                        <pre className="text-[10px] font-mono text-emerald-300">
                                            {JSON.stringify(testResult.output, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-slate-600 text-xs italic text-center mt-10">Run the test to see output</div>
                        )}
                    </div>
                 </div>
            </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl flex justify-between items-center">
        <button 
          onClick={() => onDelete(node.id)}
          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          title="Delete Node"
        >
          <Trash2 size={18} />
        </button>
        <button 
          onClick={handleSave}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-brand-900/20 transition-all"
        >
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};

// UI Helpers (Same as before)
const InputField = ({ label, value, onChange, placeholder }: any) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
    <input 
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors placeholder-slate-600"
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, placeholder }: any) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <textarea 
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors placeholder-slate-600 resize-none"
      />
    </div>
  );

const SelectField = ({ label, value, onChange, options }: any) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <select 
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
      >
          <option value="" disabled>Select {label}</option>
          {options.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
          ))}
      </select>
    </div>
);
