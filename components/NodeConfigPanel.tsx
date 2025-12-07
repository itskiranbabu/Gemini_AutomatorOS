import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Info } from 'lucide-react';
import { WorkflowNode } from '../types';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (updatedNode: WorkflowNode) => void;
  onDelete: (nodeId: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onClose, onUpdate, onDelete }) => {
  const [label, setLabel] = useState('');
  const [configStr, setConfigStr] = useState('');

  useEffect(() => {
    if (node) {
      setLabel(node.label);
      setConfigStr(JSON.stringify(node.config, null, 2));
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    try {
      const config = JSON.parse(configStr);
      onUpdate({ ...node, label, config });
    } catch (e) {
      alert("Invalid JSON in configuration");
    }
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
            <div className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400 capitalize cursor-not-allowed">
              {node.service}
            </div>
          </div>
        </div>

        {/* Configuration Editor */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="block text-xs font-bold text-slate-500 uppercase">Configuration (JSON)</label>
            <span className="text-[10px] text-brand-400 flex items-center gap-1">
              <Info size={10} /> Dynamic Inputs
            </span>
          </div>
          <div className="relative">
            <textarea 
              value={configStr}
              onChange={(e) => setConfigStr(e.target.value)}
              className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-blue-300 focus:outline-none focus:border-brand-500 resize-none leading-relaxed"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Define input parameters, API endpoints, or logical conditions here.
          </p>
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