
import React from 'react';
import { CheckCircle, XCircle, Clock, Terminal, ChevronRight, Loader2 } from 'lucide-react';
import { useAutomator } from '../store/AutomatorContext';

interface RunDetailProps {
  runId: string;
  onBack: () => void;
}

export const RunDetail: React.FC<RunDetailProps> = ({ runId, onBack }) => {
  const { runs } = useAutomator();
  const run = runs.find(r => r.id === runId);

  if (!run) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-10">
              <h2 className="text-xl text-white font-bold mb-2">Run not found</h2>
              <p className="text-slate-500 mb-4">The execution log you requested could not be found.</p>
              <button onClick={onBack} className="text-brand-400 hover:text-brand-300">Back to Runs</button>
          </div>
      )
  }

  // Format Date Helper
  const displayDate = run.startedAt.includes('T') 
    ? new Date(run.startedAt).toLocaleString() 
    : run.startedAt;

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <button onClick={onBack} className="text-slate-500 hover:text-white mb-4 text-sm flex items-center w-fit">
        <ChevronRight className="rotate-180 mr-1" size={16} />
        Back to Runs
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-1">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center space-x-2">
              <span>Run {run.id.slice(0, 8)}...</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  run.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                  run.status === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {run.status.toUpperCase()}
              </span>
            </h2>
            <p className="text-slate-400 text-sm">{run.workflowName}</p>
          </div>
          <div className="flex items-center space-x-6 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>{displayDate}</span>
            </div>
            <div>Duration: <span className="text-slate-200">{run.duration}</span></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Steps Visualizer */}
          <div className="w-1/3 border-r border-slate-800 p-4 overflow-y-auto bg-slate-950/30">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Execution Steps</h3>
            <div className="space-y-4">
              {run.steps.length === 0 ? (
                 <div className="text-slate-600 text-sm italic p-4 text-center">
                     {run.status === 'running' ? 'Initializing steps...' : 'No detailed logs available.'}
                 </div>
              ) : (
                run.steps.map((step, idx) => (
                  <div key={step.id} className="relative pl-6 pb-6 last:pb-0">
                    {/* Connector Line */}
                    {idx !== run.steps.length - 1 && (
                      <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-800"></div>
                    )}
                    
                    <div className="absolute left-0 top-1">
                        {step.status === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : 
                         step.status === 'pending' ? <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div> :
                         <XCircle size={20} className="text-red-500" />}
                    </div>

                    <div className={`bg-slate-800/50 border ${step.status === 'pending' ? 'border-blue-500/30' : 'border-slate-700/50'} rounded-lg p-3 transition-colors`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-slate-200 text-sm">{step.nodeLabel}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{step.duration}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate font-mono">
                         {step.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Data & Logs */}
          <div className="flex-1 flex flex-col bg-slate-950">
             {run.steps.length > 0 ? (
                 <>
                    <div className="p-4 border-b border-slate-800 bg-slate-900/20">
                        <div className="flex space-x-4 mb-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Input Payload</label>
                                <pre className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-blue-300 overflow-x-auto border border-slate-800 max-h-32">
                                    {JSON.stringify(run.steps[run.steps.length - 1].input, null, 2)}
                                </pre>
                            </div>
                             <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Output Payload</label>
                                <pre className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800 max-h-32">
                                    {JSON.stringify(run.steps[run.steps.length - 1].output, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
                         <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center"><Terminal size={14} className="mr-2"/> System Logs (Temporal History)</label>
                         <div className="space-y-1 text-slate-400">
                            {run.steps.flatMap(s => s.logs).map((log, i) => (
                                <div key={i} className="hover:bg-white/5 p-0.5 rounded px-2">
                                    <span className="text-slate-600 mr-2">{run.startedAt.includes('T') ? new Date(run.startedAt).toLocaleTimeString() : '00:00:00'}</span>
                                    {log}
                                </div>
                            ))}
                         </div>
                    </div>
                 </>
             ) : (
                <div className="flex items-center justify-center h-full text-slate-600">
                     {run.status === 'running' ? (
                         <div className="flex flex-col items-center">
                             <Loader2 className="animate-spin mb-2" />
                             <span>Waiting for worker...</span>
                         </div>
                     ) : 'Select a run to view details'}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
