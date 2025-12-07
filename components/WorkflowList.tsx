
import React from 'react';
import { Workflow } from '../types';
import { Play, Edit, Trash2, Activity, Loader2 } from 'lucide-react';
import { useAutomator } from '../store/AutomatorContext';

interface WorkflowListProps {
  workflows: Workflow[];
  onSelect: (workflow: Workflow) => void;
  onRun: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({ workflows, onSelect, onRun, onDelete }) => {
  // We use the context hook to get access to all runs for dynamic stats calculation
  const { runs } = useAutomator();

  // Helper to calculate stats per workflow
  const getStats = (workflowId: string) => {
    const wfRuns = runs.filter(r => r.workflowId === workflowId);
    const total = wfRuns.length;
    if (total === 0) return { successRate: 0, lastRun: 'Never' };

    const success = wfRuns.filter(r => r.status === 'success').length;
    const successRate = Math.round((success / total) * 100);
    
    // Get last run time
    const lastRunObj = wfRuns.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
    const lastRunDate = new Date(lastRunObj.startedAt);
    
    // Simple relative time formatting
    const diffMs = Date.now() - lastRunDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let lastRunText = '';
    if (diffMins < 1) lastRunText = 'Just now';
    else if (diffMins < 60) lastRunText = `${diffMins}m ago`;
    else if (diffHours < 24) lastRunText = `${diffHours}h ago`;
    else lastRunText = `${diffDays}d ago`;

    return { successRate, lastRun: lastRunText };
  };

  if (workflows.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Workflows Yet</h3>
        <p className="text-slate-400">Create your first automation using the AI builder.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">My Workflows</h2>
           <p className="text-slate-400">Manage and monitor your active automations.</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Success Rate</th>
              <th className="px-6 py-4">Last Run</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {workflows.map((wf) => {
              // Real-time: Check if ANY run for this workflow is currently 'running'
              const isRunning = runs.some(r => r.workflowId === wf.id && r.status === 'running');
              const stats = getStats(wf.id);

              return (
              <tr key={wf.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400">
                       <Activity size={18} />
                    </div>
                    <div>
                        <div className="font-medium text-slate-200">{wf.name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{wf.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {isRunning ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                        <Loader2 size={10} className="mr-1 animate-spin" />
                        Running
                    </span>
                  ) : wf.status === 'active' ? (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                     </span>
                  ) : (
                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-400 border border-slate-700">
                        Paused
                     </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                     <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${stats.successRate}%` }}></div>
                     </div>
                     <span className="text-xs text-slate-400">{stats.successRate}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                    {stats.lastRun}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                        onClick={() => onRun(wf)}
                        disabled={isRunning}
                        className={`p-2 rounded-lg transition-colors border ${
                            isRunning 
                            ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed opacity-50' 
                            : 'bg-slate-800 hover:bg-emerald-600 hover:text-white border-slate-700 text-slate-300'
                        }`}
                        title="Trigger Run"
                    >
                        <Play size={16} fill={isRunning ? "currentColor" : "none"} />
                    </button>
                    <button 
                        onClick={() => onSelect(wf)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                        title="Edit Workflow"
                    >
                        <Edit size={16} />
                    </button>
                    <button 
                        onClick={() => onDelete(wf.id)}
                        className="p-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                        title="Delete Workflow"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};
