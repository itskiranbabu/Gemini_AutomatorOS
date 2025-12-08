
import React, { useState, useEffect, useRef } from 'react';
import { Command, Search, ArrowRight, Zap, LayoutDashboard, Settings, FileText, PlusCircle, LogOut } from 'lucide-react';
import { useAutomator } from '../store/AutomatorContext';
import { useAuth } from '../store/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { workflows } = useAutomator();
  const { signOut } = useAuth();

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
        setQuery('');
        setActiveIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (action: () => void) => {
      action();
      onClose();
  };

  const sections = [
      {
          title: 'Navigation',
          items: [
              { icon: LayoutDashboard, label: 'Dashboard', action: () => onNavigate('dashboard') },
              { icon: Zap, label: 'My Workflows', action: () => onNavigate('workflows') },
              { icon: PlusCircle, label: 'Create New Workflow', action: () => onNavigate('create') },
              { icon: FileText, label: 'Run History', action: () => onNavigate('runs') },
              { icon: Settings, label: 'Settings', action: () => onNavigate('settings') },
          ]
      },
      {
          title: 'Recent Workflows',
          items: workflows.slice(0, 5).map(wf => ({
              icon: Zap,
              label: wf.name,
              action: () => {
                  // In a real app this would load the specific ID
                  onNavigate('workflows'); 
              }
          }))
      },
      {
          title: 'System',
          items: [
              { icon: LogOut, label: 'Sign Out', action: () => signOut() }
          ]
      }
  ];

  // Flatten for keyboard nav
  const flatItems = sections.flatMap(s => s.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())));

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex(prev => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
          e.preventDefault();
          if (flatItems[activeIndex]) {
              handleSelect(flatItems[activeIndex].action);
          }
      } else if (e.key === 'Escape') {
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-100">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 flex flex-col">
            <div className="flex items-center p-3 border-b border-slate-800">
                <Search className="text-slate-500 ml-2" size={20} />
                <input 
                    ref={inputRef}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 h-10 px-4 text-lg"
                    placeholder="Type a command or search..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                    onKeyDown={handleKeyDown}
                />
                <div className="flex items-center space-x-1 pr-2">
                     <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">ESC</span>
                </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2">
                {flatItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No results found</div>
                ) : (
                    flatItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelect(item.action)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                idx === activeIndex ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                            }`}
                            onMouseEnter={() => setActiveIndex(idx)}
                        >
                            <item.icon size={16} className={idx === activeIndex ? 'text-white' : 'text-slate-500'} />
                            <span className="flex-1 text-left">{item.label}</span>
                            {idx === activeIndex && <ArrowRight size={14} />}
                        </button>
                    ))
                )}
            </div>
            <div className="bg-slate-950 p-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between px-4">
                 <span>AutomatorOS v1.0.0</span>
                 <div className="flex space-x-3">
                     <span><strong>↑↓</strong> to navigate</span>
                     <span><strong>↵</strong> to select</span>
                 </div>
            </div>
        </div>
    </div>
  );
};
