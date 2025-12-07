
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowUpRight, CheckCircle, XCircle, Clock, Activity, Loader2 } from 'lucide-react';
import { RunLog, Workflow } from '../types';

interface DashboardProps {
    runs: RunLog[];
    workflows: Workflow[];
    onViewRun: (runId: string) => void;
}

const StatCard = ({ title, value, subtext, icon: Icon, color, animate }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 backdrop-blur-sm shadow-lg relative overflow-hidden">
    {animate && (
        <div className="absolute top-0 right-0 p-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
        </div>
    )}
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={20} />
      </div>
      {subtext && (
        <div className="flex items-center space-x-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
          <span>{subtext}</span>
        </div>
      )}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-slate-500">{title}</div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ runs, workflows, onViewRun }) => {
  
  // Dynamic Stats Calculation
  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const activeWorkflows = workflows.filter(w => w.status === 'active').length;
    const successfulRuns = runs.filter(r => r.status === 'success').length;
    const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;
    
    // Check for currently running
    const activeExecutions = runs.filter(r => r.status === 'running').length;

    // Group runs by day for chart (Last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartMap = new Map<string, number>();
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = days[d.getDay()];
        if (!chartMap.has(key)) chartMap.set(key, 0); 
    }

    // Populate actuals
    runs.forEach(run => {
        // Try parsing ISO, fallback to text
        const date = new Date(run.startedAt);
        if (!isNaN(date.getTime())) {
             const key = days[date.getDay()];
             chartMap.set(key, (chartMap.get(key) || 0) + 1);
        }
    });

    const chartData = Array.from(chartMap.entries()).map(([name, runs]) => ({ name, runs }));
    
    return { totalRuns, activeWorkflows, successRate, chartData, activeExecutions };
  }, [runs, workflows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Active Operations" value={stats.activeExecutions} subtext={stats.activeExecutions > 0 ? "Processing now" : "Idle"} icon={Activity} color="bg-blue-500" animate={stats.activeExecutions > 0} />
        <StatCard title="Active Workflows" value={stats.activeWorkflows} subtext={`${workflows.length} total`} icon={Clock} color="bg-indigo-500" />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} subtext="Last 24h" icon={CheckCircle} color="bg-emerald-500" />
        <StatCard title="Failures" value={runs.filter(r => r.status === 'failed').length} subtext="Needs attention" icon={XCircle} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-96 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">Execution Volume</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="runs" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRuns)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-96 overflow-auto shadow-lg relative">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-white">Recent Runs</h3>
             {stats.activeExecutions > 0 && (
                 <span className="flex items-center text-xs text-blue-400">
                     <Loader2 size={12} className="animate-spin mr-1" /> Live
                 </span>
             )}
          </div>
          <div className="space-y-4">
            {runs.length === 0 ? (
                <div className="text-slate-500 text-sm text-center pt-10">No runs recorded yet.</div>
            ) : (
                runs.slice(0, 20).map((run) => (
                <div 
                    key={run.id} 
                    onClick={() => onViewRun(run.id)}
                    className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-all border cursor-pointer group ${
                        run.status === 'running' 
                            ? 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                            : 'border-transparent hover:border-slate-800'
                    }`}
                >
                    <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${run.status === 'success' ? 'bg-emerald-500' : run.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-red-500'}`}></div>
                    <div>
                        <div className="text-sm font-medium text-slate-200 truncate max-w-[120px]">{run.workflowName}</div>
                        <div className="text-xs text-slate-500">
                            {/* Simple Relative Time for "Alive" feel */}
                            {run.status === 'running' ? 'Running now...' : 
                                (run.startedAt.includes('T') ? new Date(run.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : run.startedAt)
                            }
                        </div>
                    </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${run.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : run.status === 'running' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                            {run.status}
                        </span>
                        {run.status !== 'running' && (
                            <div className="text-[10px] text-slate-600 mt-1">{run.duration}</div>
                        )}
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
