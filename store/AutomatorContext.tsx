
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Workflow, RunLog, Integration } from '../types';
import { MOCK_WORKFLOWS, MOCK_RUNS, INTEGRATIONS } from '../constants';

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
}

const AutomatorContext = createContext<AutomatorContextType | undefined>(undefined);

export const AutomatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or Mocks
  const [workflows, setWorkflows] = useState<Workflow[]>(() => {
    try {
      const saved = localStorage.getItem('automator_workflows');
      return saved ? JSON.parse(saved) : MOCK_WORKFLOWS;
    } catch(e) { return MOCK_WORKFLOWS; }
  });

  const [runs, setRuns] = useState<RunLog[]>(() => {
    try {
      const saved = localStorage.getItem('automator_runs');
      return saved ? JSON.parse(saved) : MOCK_RUNS;
    } catch(e) { return MOCK_RUNS; }
  });

  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    try {
      const saved = localStorage.getItem('automator_integrations');
      return saved ? JSON.parse(saved) : INTEGRATIONS;
    } catch(e) { return INTEGRATIONS; }
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('automator_workflows', JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem('automator_runs', JSON.stringify(runs));
  }, [runs]);

  useEffect(() => {
    localStorage.setItem('automator_integrations', JSON.stringify(integrations));
  }, [integrations]);

  // Actions
  const addWorkflow = (wf: Workflow) => setWorkflows(prev => [wf, ...prev]);
  
  const updateWorkflow = (wf: Workflow) => {
    setWorkflows(prev => prev.map(w => w.id === wf.id ? wf : w));
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const addRun = (run: RunLog) => setRuns(prev => [run, ...prev]);

  const updateRun = (run: RunLog) => {
    setRuns(prev => {
        const index = prev.findIndex(r => r.id === run.id);
        if (index === -1) return [run, ...prev];
        const newRuns = [...prev];
        newRuns[index] = run;
        return newRuns;
    });
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  const resetData = () => {
    if (confirm("Reset all data to default demo state? This will clear your custom workflows.")) {
        setWorkflows(MOCK_WORKFLOWS);
        setRuns(MOCK_RUNS);
        setIntegrations(INTEGRATIONS);
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <AutomatorContext.Provider value={{
      workflows, runs, integrations,
      addWorkflow, updateWorkflow, deleteWorkflow,
      addRun, updateRun,
      toggleIntegration, resetData
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
