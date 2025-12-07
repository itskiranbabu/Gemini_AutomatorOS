import React from 'react';
import { MOCK_TEMPLATES } from '../constants';
import { Template } from '../types';
import { Copy, ArrowRight, Star } from 'lucide-react';

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Workflow Templates</h2>
        <p className="text-slate-400">Jumpstart your automation with production-ready patterns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_TEMPLATES.map((template) => (
          <div key={template.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-900/10 transition-all group flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300">
                {template.category}
              </span>
              <div className="flex items-center text-amber-400">
                <Star size={14} fill="currentColor" />
                <span className="text-xs ml-1 font-medium">{template.popularity}.0</span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-200 mb-2 group-hover:text-brand-400 transition-colors">
              {template.name}
            </h3>
            <p className="text-slate-400 text-sm mb-6 flex-1">
              {template.description}
            </p>

            <button 
              onClick={() => onSelectTemplate(template)}
              className="w-full py-2 bg-slate-800 hover:bg-brand-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
            >
              <span>Use Template</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};