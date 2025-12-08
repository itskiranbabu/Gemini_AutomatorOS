
import React from 'react';
import { X, Command, Delete, Save, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutRow = ({ icon: Icon, label, keys }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-none">
    <div className="flex items-center text-slate-300 gap-3">
       {Icon && <Icon size={16} className="text-brand-400" />}
       <span className="text-sm">{label}</span>
    </div>
    <div className="flex gap-1">
      {keys.map((k: string, i: number) => (
        <kbd key={i} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-400">
          {k}
        </kbd>
      ))}
    </div>
  </div>
);

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="font-semibold text-white">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 space-y-1">
            <ShortcutRow icon={Command} label="Global Search" keys={['Cmd', 'K']} />
            <ShortcutRow icon={Save} label="Save Workflow" keys={['Cmd', 'S']} />
            <ShortcutRow icon={Delete} label="Delete Selected" keys={['Del', 'Backspace']} />
            <ShortcutRow icon={Move} label="Pan Canvas" keys={['Space', 'Drag']} />
            <ShortcutRow icon={ZoomIn} label="Zoom In" keys={['Ctrl', 'Scroll Up']} />
            <ShortcutRow icon={ZoomOut} label="Zoom Out" keys={['Ctrl', 'Scroll Down']} />
        </div>
        
        <div className="p-4 bg-slate-950/50 text-center text-xs text-slate-500 rounded-b-xl">
            Press <kbd className="bg-slate-800 border border-slate-700 rounded px-1 text-[10px]">Esc</kbd> to close this dialog.
        </div>
      </div>
    </div>
  );
};
