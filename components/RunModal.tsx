
import React, { useState } from 'react';
import { X, Play, Loader2, Braces } from 'lucide-react';
import { Workflow } from '../types';

interface RunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (payload: any) => void;
  workflowName: string;
}

export const RunModal: React.FC<RunModalProps> = ({ isOpen, onClose, onRun, workflowName }) => {
  const [payloadStr, setPayloadStr] = useState('{\n  "email": "test@example.com",\n  "totalValue": 150,\n  "orderId": "ORD-123"\n}');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRun = () => {
    try {
      const payload = JSON.parse(payloadStr);
      setError('');
      onRun(payload);
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <div className="bg-brand-500/20 p-1.5 rounded-lg">
                <Play size={14} className="text-brand-400" />
            </div>
            Run Workflow
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-400 mb-4">
            Configure the initial input data for <strong className="text-slate-200">{workflowName}</strong>. This simulates a webhook payload or event trigger.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <Braces size={12} /> JSON Payload
            </label>
            <div className="relative">
                <textarea 
                    value={payloadStr}
                    onChange={(e) => setPayloadStr(e.target.value)}
                    className={`w-full h-48 bg-slate-950 border ${error ? 'border-red-500/50' : 'border-slate-700'} rounded-lg p-3 text-sm font-mono text-blue-300 focus:outline-none focus:border-brand-500 resize-none leading-relaxed custom-scrollbar`}
                    spellCheck={false}
                />
                {error && (
                    <div className="absolute bottom-3 right-3 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-900/50">
                        {error}
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-500">
                Variables like <code className="bg-slate-800 px-1 rounded text-emerald-400">{`{{email}}`}</code> in your workflow will be replaced by values from this JSON.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleRun}
            className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-brand-900/20 transition-all hover:scale-105 active:scale-95"
          >
            <Play size={16} fill="currentColor" />
            <span>Execute Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
