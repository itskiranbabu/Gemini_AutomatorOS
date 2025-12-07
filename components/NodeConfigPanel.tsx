
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Info, Code } from 'lucide-react';
import { WorkflowNode } from '../types';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (updatedNode: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onClose, onUpdate, onDelete }) => {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonStr, setJsonStr] = useState('');

  useEffect(() => {
    if (node) {
      setLabel(node.label);
      setConfig(node.config || {});
      setJsonStr(JSON.stringify(node.config || {}, null, 2));
      // Default to form if simple, json if complex
      setMode('form');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    try {
      const finalConfig = mode === 'json' ? JSON.parse(jsonStr) : config;
      onUpdate({ ...node, label, config: finalConfig });
    } catch (e) {
      alert("Invalid JSON in configuration");
    }
  };

  const updateConfigField = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    setJsonStr(JSON.stringify(newConfig, null, 2));
  };

  // Helper to render form fields based on service type
  const renderFormFields = () => {
    const service = node.service.toLowerCase();

    // 1. Gmail / Email
    if (service.includes('gmail') || service.includes('mail')) {
      return (
        <>
          <InputField label="To Address" value={config.to} onChange={(v) => updateConfigField('to', v)} placeholder="recipient@example.com" />
          <InputField label="Subject" value={config.subject} onChange={(v) => updateConfigField('subject', v)} placeholder="New Alert" />
          <TextAreaField label="Body" value={config.body} onChange={(v) => updateConfigField('body', v)} placeholder="Hello..." />
        </>
      );
    }

    // 2. Slack / Discord
    if (service.includes('slack') || service.includes('discord')) {
      return (
        <>
          <InputField label="Channel" value={config.channel} onChange={(v) => updateConfigField('channel', v)} placeholder="#general" />
          <TextAreaField label="Message" value={config.message} onChange={(v) => updateConfigField('message', v)} placeholder="Hello Team..." />
        </>
      );
    }

    // 3. Shopify / E-commerce
    if (service.includes('shopify')) {
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
    if (service.includes('gemini') || service.includes('gpt') || service.includes('ai')) {
      return (
        <>
          <SelectField 
            label="Model" 
            value={config.model} 
            onChange={(v) => updateConfigField('model', v)} 
            options={['gemini-pro', 'gpt-4', 'claude-3']} 
          />
          <TextAreaField label="Prompt" value={config.prompt} onChange={(v) => updateConfigField('prompt', v)} placeholder="Summarize this..." />
        </>
      );
    }

    // Default Fallback
    return (
      <div className="text-center py-4 text-slate-500 text-sm bg-slate-800/30 rounded-lg">
        No smart fields available for {node.service}. <br/> Use JSON mode.
      </div>
    );
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-xl">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          Configure Node
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Basic Info */}
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
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service</label>
            <div className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 capitalize cursor-not-allowed flex items-center justify-between">
              <span>{node.service}</span>
              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">{node.type}</span>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Configuration</label>
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
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-4">
            {mode === 'form' ? renderFormFields() : (
                <div className="relative">
                    <textarea 
                    value={jsonStr}
                    onChange={(e) => setJsonStr(e.target.value)}
                    className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-blue-300 focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Directly edit the JSON configuration payload.</p>
                </div>
            )}
        </div>

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

// UI Helpers
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
