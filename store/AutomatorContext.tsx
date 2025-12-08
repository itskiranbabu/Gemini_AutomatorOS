
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Workflow, RunLog, Integration, UserProfile, AuditLogEntry, WorkflowVersion } from '../types';
import { MOCK_WORKFLOWS, MOCK_RUNS, INTEGRATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface AutomatorContextType {
  workflows: Workflow[];
  runs: RunLog[];
  integrations: Integration[];
  profile: UserProfile;
  auditLogs: AuditLogEntry[];
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  addRun: (run: RunLog) => void;
  updateRun: (run: RunLog) => void;
  toggleIntegration: (id: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  resetData: () => void;
  isLoading: boolean;
}

const AutomatorContext = createContext<AutomatorContextType | undefined>(undefined);

export const AutomatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    workspaceName: 'Acme Corp Automation',
    email: 'admin@acme.com',
    plan: 'Pro Plan',
    avatarInitials: 'JD'
  });

  const logAction = (action: string, entityId?: string, entityName?: string, details?: string) => {
      const entry: AuditLogEntry = {
          id: `log-${Date.now()}`,
          action,
          entityId,
          entityName,
          user: profile.email,
          timestamp: new Date().toISOString(),
          details
      };
      setAuditLogs(prev => [entry, ...prev]);
  };

  // Load Initial Data & Setup Realtime Subscription
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Load Profile from LocalStorage
      const savedProfile = localStorage.getItem('automator_profile');
      if (savedProfile) {
          try { setProfile(JSON.parse(savedProfile)); } catch {}
      }

      // 1. Try Supabase
      if (supabase) {
        try {
          // Fetch Workflows
          const { data: wfData, error: wfError } = await supabase
            .from('workflows')
            .select('*')
            .order('created_at', { ascending: false });

          if (!wfError && wfData) {
            const mappedWorkflows: Workflow[] = wfData.map((row: any) => ({
              id: row.id,
              name: row.name,
              description: row.description || '',
              status: row.is_active ? 'active' : 'paused',
              createdAt: row.created_at,
              nodes: row.definition?.nodes || [],
              edges: row.definition?.edges || [],
              history: row.definition?.history || [],
              stats: { runs: 0, successRate: 0 }
            }));
            setWorkflows(mappedWorkflows);
          } else {
             setWorkflows(loadLocalWorkflows());
          }

          // Fetch Runs
          const { data: runData, error: runError } = await supabase
            .from('runs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(50);
            
          if (!runError && runData) {
              const mappedRuns: RunLog[] = runData.map((row: any) => mapRunFromDB(row, workflows));
              setRuns(mappedRuns);
          } else {
              setRuns(loadLocalRuns());
          }

          // --- REALTIME SUBSCRIPTION ---
          const channel = supabase.channel('realtime_changes')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'runs' },
              (payload) => {
                // Handle new runs (INSERT)
                if (payload.eventType === 'INSERT') {
                    const newRun = mapRunFromDB(payload.new, workflows);
                    setRuns(prev => [newRun, ...prev]);
                }
                // Handle run updates (UPDATE) - e.g. steps completing
                if (payload.eventType === 'UPDATE') {
                    const updatedRun = mapRunFromDB(payload.new, workflows);
                    setRuns(prev => prev.map(r => r.id === updatedRun.id ? updatedRun : r));
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };

        } catch (e) {
          console.error("Supabase load failed, falling back to local", e);
          setWorkflows(loadLocalWorkflows());
          setRuns(loadLocalRuns());
        }
      } else {
        // 2. Fallback to LocalStorage
        setWorkflows(loadLocalWorkflows());
        setRuns(loadLocalRuns());
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Helper to map DB row to RunLog
  const mapRunFromDB = (row: any, currentWorkflows: Workflow[]): RunLog => {
      // Try to find name in current workflows, fallback to what's in DB or ID
      const wf = currentWorkflows.find(w => w.id === row.workflow_id);
      return {
          id: row.id,
          workflowId: row.workflow_id,
          workflowName: wf?.name || 'Unknown Workflow', 
          status: row.status,
          startedAt: row.started_at,
          duration: row.duration || '0s',
          steps: row.logs || []
      };
  };

  // Helpers for LocalStorage Fallback
  const loadLocalWorkflows = () => {
    try {
        const saved = localStorage.getItem('automator_workflows');
        return saved ? JSON.parse(saved) : MOCK_WORKFLOWS;
    } catch { return MOCK_WORKFLOWS; }
  };
  const loadLocalRuns = () => {
      try {
        const saved = localStorage.getItem('automator_runs');
        return saved ? JSON.parse(saved) : MOCK_RUNS;
      } catch { return MOCK_RUNS; }
  };

  // --- Actions ---

  const addWorkflow = async (wf: Workflow) => {
    setWorkflows(prev => [wf, ...prev]);
    logAction('WORKFLOW_CREATED', wf.id, wf.name);

    if (supabase) {
        await supabase.from('workflows').insert({
            id: wf.id,
            name: wf.name,
            description: wf.description,
            definition: { nodes: wf.nodes, edges: wf.edges, history: [] },
            is_active: wf.status === 'active',
            created_at: wf.createdAt
        });
    } else {
        localStorage.setItem('automator_workflows', JSON.stringify([wf, ...workflows]));
    }
  };
  
  const updateWorkflow = async (wf: Workflow) => {
    // 1. Find existing to create snapshot
    const existing = workflows.find(w => w.id === wf.id);
    let newHistory = existing?.history || [];
    
    if (existing) {
        const version: WorkflowVersion = {
            id: `v-${Date.now()}`,
            versionNumber: (newHistory.length) + 1,
            createdAt: new Date().toISOString(),
            nodes: existing.nodes,
            edges: existing.edges,
            name: existing.name
        };
        newHistory = [version, ...newHistory].slice(0, 10); // Keep last 10 versions
    }

    const updatedWf = { ...wf, history: newHistory };
    setWorkflows(prev => prev.map(w => w.id === wf.id ? updatedWf : w));
    
    logAction('WORKFLOW_UPDATED', wf.id, wf.name, `Version ${newHistory.length + 1}`);

    if (supabase) {
         await supabase.from('workflows').update({
            name: wf.name,
            description: wf.description,
            definition: { nodes: wf.nodes, edges: wf.edges, history: newHistory },
            is_active: wf.status === 'active'
        }).eq('id', wf.id);
    } else {
        const updated = workflows.map(w => w.id === wf.id ? updatedWf : w);
        localStorage.setItem('automator_workflows', JSON.stringify(updated));
    }
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    logAction('WORKFLOW_DELETED', id);

    if (supabase) {
        await supabase.from('workflows').delete().eq('id', id);
    } else {
        const filtered = workflows.filter(w => w.id !== id);
        localStorage.setItem('automator_workflows', JSON.stringify(filtered));
    }
  };

  const addRun = async (run: RunLog) => {
    setRuns(prev => [run, ...prev]);
    if (supabase) {
        await supabase.from('runs').insert({
            id: run.id,
            workflow_id: run.workflowId,
            status: run.status,
            started_at: run.startedAt,
            logs: run.steps
        });
    } else {
        localStorage.setItem('automator_runs', JSON.stringify([run, ...runs]));
    }
  };

  const updateRun = async (run: RunLog) => {
    // Optimistic UI Update (fallback if Realtime is slow)
    setRuns(prev => {
        const index = prev.findIndex(r => r.id === run.id);
        if (index === -1) return [run, ...prev];
        const newRuns = [...prev];
        newRuns[index] = run;
        return newRuns;
    });

    if (supabase) {
        await supabase.from('runs').upsert({
            id: run.id,
            workflow_id: run.workflowId,
            status: run.status,
            logs: run.steps,
            duration: run.duration,
            completed_at: run.status !== 'running' ? new Date().toISOString() : null
        });
    } else {
        // Local persist
        const saved = localStorage.getItem('automator_runs');
        const runs = saved ? JSON.parse(saved) : [];
        const index = runs.findIndex((r: RunLog) => r.id === run.id);
        if (index >= 0) runs[index] = run;
        else runs.unshift(run);
        localStorage.setItem('automator_runs', JSON.stringify(runs));
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
    const integ = integrations.find(i => i.id === id);
    logAction('INTEGRATION_TOGGLED', id, integ?.name);
    localStorage.setItem('automator_integrations', JSON.stringify(integrations));
  };
  
  const updateProfile = (updates: Partial<UserProfile>) => {
      setProfile(prev => {
          const newProfile = { ...prev, ...updates };
          localStorage.setItem('automator_profile', JSON.stringify(newProfile));
          return newProfile;
      });
      logAction('PROFILE_UPDATED');
  };

  const resetData = () => {
    if (confirm("Reset local demo data?")) {
        setWorkflows(MOCK_WORKFLOWS);
        setRuns(MOCK_RUNS);
        localStorage.clear();
        logAction('SYSTEM_RESET');
        window.location.reload();
    }
  };

  return (
    <AutomatorContext.Provider value={{
      workflows, runs, integrations, profile, auditLogs,
      addWorkflow, updateWorkflow, deleteWorkflow,
      addRun, updateRun,
      toggleIntegration, updateProfile, resetData,
      isLoading
    }}>
      {children}
    </AutomatorContext.Provider>
  );
};

export const useAutomator = () => {
  const context = useContext(AutomatorContext);
  if (!context) throw new Error('useAutomator must be used within AutomatorProvider');
  return context;
};
