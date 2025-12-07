
import React from 'react';
import { 
  LayoutDashboard, Zap, Activity, Settings, 
  PlusCircle, Command, Book, FileText, Library, Loader2
} from 'lucide-react';
import { useAutomator } from '../store/AutomatorContext';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onChangeView: (view: string) => void;
}

const NavItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-brand-600/10 text-brand-400 border-l-2 border-brand-500' 
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    <div className="flex items-center space-x-3">
        <Icon size={20} className={active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
        <span className="font-medium text-sm">{label}</span>
    </div>
    {badge}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onChangeView }) => {
  const { runs, profile } = useAutomator();
  const activeRunsCount = runs.filter(r => r.status === 'running').length;

  return (
    <div className="flex h-screen bg-dark-950 text-slate-200 selection:bg-brand-500/30">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-800/50 bg-dark-900/50 backdrop-blur-xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Zap className="text-white" size={18} fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            AutomatorOS
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          <NavItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            onClick={() => onChangeView('dashboard')} 
          />
          <NavItem 
            icon={Library} 
            label="Templates" 
            active={activeView === 'templates'} 
            onClick={() => onChangeView('templates')} 
          />
          <NavItem 
            icon={Zap} 
            label="Workflows" 
            active={activeView === 'workflows'} 
            onClick={() => onChangeView('workflows')} 
          />
           <NavItem 
            icon={FileText} 
            label="Runs & Logs" 
            active={activeView === 'runs'} 
            onClick={() => onChangeView('runs')}
            badge={activeRunsCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                    <Loader2 size={8} className="animate-spin mr-1"/>
                    {activeRunsCount}
                </span>
            )} 
          />
          <NavItem 
            icon={Activity} 
            label="Integrations" 
            active={activeView === 'integrations'} 
            onClick={() => onChangeView('integrations')} 
          />
           <div className="pt-4 mt-4 border-t border-slate-800/50">
             <NavItem 
                icon={Book} 
                label="Architecture / Docs" 
                active={activeView === 'docs'} 
                onClick={() => onChangeView('docs')} 
              />
              <NavItem 
                icon={Settings} 
                label="Settings" 
                active={activeView === 'settings'} 
                onClick={() => onChangeView('settings')} 
              />
           </div>
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                <span className="text-xs font-bold text-white">{profile.avatarInitials}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{profile.workspaceName}</p>
                <p className="text-xs text-slate-500 truncate">{profile.plan}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-dark-950/80 backdrop-blur z-10">
          <div className="flex items-center text-slate-500 text-sm">
            <Command size={14} className="mr-2" />
            <span>Cmd + K to search...</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
                onClick={() => onChangeView('create')}
                className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-900/20"
            >
              <PlusCircle size={16} />
              <span>New Workflow</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
};
