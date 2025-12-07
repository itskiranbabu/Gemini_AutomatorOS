import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { generateWorkflowFromPrompt } from '../services/geminiService';
import { PromptResponse } from '../types';

interface PromptBuilderProps {
  onSuccess: (data: PromptResponse) => void;
}

export const PromptBuilder: React.FC<PromptBuilderProps> = ({ onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const result = await generateWorkflowFromPrompt(prompt);
      if (result) {
        onSuccess(result);
      } else {
        setError("Failed to generate workflow. Please try being more specific.");
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-20 text-center">
      <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-2xl mb-6 ring-1 ring-brand-500/30">
        <Sparkles className="text-brand-400" size={32} />
      </div>
      <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
        Describe your workflow. <br/> 
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">
          AI builds it instantly.
        </span>
      </h2>
      <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
        AutomatorOS transforms natural language into production-ready automation pipelines. Just type what you need.
      </p>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-slate-900 rounded-2xl border border-slate-700/50 p-2 flex items-center shadow-2xl">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., When I get a new lead in HubSpot, send a welcome email via Gmail and alert the team on Slack."
            className="flex-1 bg-transparent border-none text-white placeholder-slate-500 text-lg px-4 py-3 focus:ring-0 resize-none h-14 leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <button 
            disabled={loading || !prompt}
            onClick={handleGenerate}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200 shadow-lg shadow-brand-900/20"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-center text-red-400 space-x-2 bg-red-400/10 py-2 rounded-lg">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {[
          "Sync Shopify orders to Google Sheets",
          "Daily standup reminder on Slack",
          "Analyze incoming emails with AI"
        ].map((suggestion) => (
          <button 
            key={suggestion}
            onClick={() => setPrompt(suggestion)}
            className="px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 hover:border-brand-500/50 text-slate-400 hover:text-brand-300 text-sm transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
