
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Workflow, RunLog, Integration } from '../types';
import { MOCK_WORKFLOWS, MOCK_RUNS, INTEGRATIONS } from '../constants';
import { supabase } from '../lib/supabaseClient';

interface AutomatorContextType {
  workflows: Workflow[];
  runs: RunLog[];
  integrations: Integration[];
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  addRun: (run: RunLog) => void;
  updateRun: (run: RunLog) => void;
  toggleIntegration: (id: string) => void;
  resetData: () => void;
  isLoading: boolean;
}

const AutomatorContext = createContext<AutomatorContextType | undefined>(undefined);

export const AutomatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // 1. Try Supabase
      if (supabase) {
        try {
          // Fetch Workflows
          const { data: wfData, error: wfError } = await supabase
            .from('workflows')
            .select('*')
            .order('created_at', { ascending: false });

          if (!wfError && wfData && wfData.length > 0) {
            const mappedWorkflows: Workflow[] = wfData.map((row: any) => ({
              id: row.id,
              name: row.name,
              description: row.description || '',
              status: row.is_active ? 'active' : 'paused',
              createdAt: row.created_at,
              nodes: row.definition?.nodes || [],
              edges: row.definition?.edges || [],
              stats: { runs: 0, successRate: 0 } // Calculate dynamic later
            }));
            setWorkflows(mappedWorkflows);
          } else {
             // Fallback if empty
             setWorkflows(loadLocalWorkflows());
          }

          // Fetch Runs
          const { data: runData, error: runError } = await supabase
            .from('runs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(50);
            
          if (!runError && runData && runData.length > 0) {
              const mappedRuns: RunLog[] = runData.map((row: any) => ({
                  id: row.id,
                  workflowId: row.workflow_id,
                  workflowName: 'Unknown Workflow', // Populate by join in real app
                  status: row.status,
                  startedAt: row.started_at,
                  duration: row.duration || '0s',
                  steps: row.logs || []
              }));
              // Enrich with workflow names
              const enrichedRuns = mappedRuns.map(r => {
                  const wf = workflows.find(w => w.id === r.workflowId) || 
                             wfData?.find((w: any) => w.id === r.workflowId);
                  return { ...r, workflowName: wf?.name || 'Deleted Workflow' };
              });
              setRuns(enrichedRuns);
          } else {
              setRuns(loadLocalRuns());
          }

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
    // Persist
    if (supabase) {
        await supabase.from('workflows').insert({
            id: wf.id,
            name: wf.name,
            definition: { nodes: wf.nodes, edges: wf.edges },
            is_active: wf.status === 'active',
            created_at: wf.createdAt
        });
    } else {
        localStorage.setItem('automator_workflows', JSON.stringify([wf, ...workflows]));
    }
  };
  
  const updateWorkflow = async (wf: Workflow) => {
    setWorkflows(prev => prev.map(w => w.id === wf.id ? wf : w));
    if (supabase) {
         await supabase.from('workflows').update({
            name: wf.name,
            definition: { nodes: wf.nodes, edges: wf.edges },
            is_active: wf.status === 'active'
        }).eq('id', wf.id);
    } else {
        const updated = workflows.map(w => w.id === wf.id ? wf : w);
        localStorage.setItem('automator_workflows', JSON.stringify(updated));
    }
  };

  const deleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
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
        // Note: Real-time updates usually handled by subscriptions or separate api
        // Here we just insert initial record
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
    setRuns(prev => {
        const index = prev.findIndex(r => r.id === run.id);
        if (index === -1) return [run, ...prev];
        const newRuns = [...prev];
        newRuns[index] = run;
        return newRuns;
    });

    if (supabase) {
        // Debounce or optimize this in prod
        await supabase.from('runs').upsert({
            id: run.id,
            workflow_id: run.workflowId,
            status: run.status,
            logs: run.steps,
            duration: run.duration,
            completed_at: run.status !== 'running' ? new Date().toISOString() : null
        });
    }
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
    // Usually auth/oauth tokens, storing mock status locally for now
    localStorage.setItem('automator_integrations', JSON.stringify(integrations));
  };

  const resetData = () => {
    if (confirm("Reset local demo data?")) {
        setWorkflows(MOCK_WORKFLOWS);
        setRuns(MOCK_RUNS);
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <AutomatorContext.Provider value={{
      workflows, runs, integrations,
      addWorkflow, updateWorkflow, deleteWorkflow,
      addRun, updateRun,
      toggleIntegration, resetData,
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
