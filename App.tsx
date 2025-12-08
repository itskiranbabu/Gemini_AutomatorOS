
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { PromptBuilder } from './components/PromptBuilder';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { Dashboard } from './components/Dashboard';
import { TemplateLibrary } from './components/TemplateLibrary';
import { RunDetail } from './components/RunDetail';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { Settings } from './components/Settings';
import { WorkflowList } from './components/WorkflowList';
import { AuthPage } from './components/AuthPage';
import { RunModal } from './components/RunModal';
import { Workflow, PromptResponse, Template, WorkflowNode, RunLog, WorkflowEdge } from './types';
import { Check, Plus, Loader2, RotateCcw, LogOut, Sparkles } from 'lucide-react';
import { executeWorkflow } from './lib/workflowEngine';
import { AutomatorProvider, useAutomator } from './store/AutomatorContext';
import { ToastProvider, useToast } from './store/ToastContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { optimizeWorkflow } from './services/geminiService';

function AutomatorDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const { 
    workflows, runs, integrations, 
    addWorkflow, updateWorkflow, deleteWorkflow,
    toggleIntegration, updateRun, resetData 
  } = useAutomator();
  const { addToast } = useToast();
  const { signOut, user, isGuest } = useAuth();
  
  // Builder State
  const [currentWorkflow, setCurrentWorkflow] = useState<PromptResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // UI State
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  
  // Run Modal State
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [workflowToRun, setWorkflowToRun] = useState<Workflow | null>(null);

  // Derived state: Get the active run for the current workflow to visualize it
  const currentActiveRun = currentWorkflow?.id 
      ? runs.find(r => r.workflowId === currentWorkflow.id && r.status === 'running') 
      : null;

  // 1. AI Generation Handler
  const handleWorkflowGenerated = (data: PromptResponse) => {
    setCurrentWorkflow(data); // New flow, no ID yet
    setActiveView('builder');
    addToast('success', 'Workflow drafted successfully!');
  };

  // 2. Template Selection Handler
  const handleTemplateSelect = (template: Template) => {
      const wf: PromptResponse = {
          name: template.name,
          nodes: template.nodes,
          edges: template.edges,
          explanation: template.description
      };
      setCurrentWorkflow(wf);
      setActiveView('builder');
      addToast('info', `Loaded template: ${template.name}`);
  }

  // 3. Save Workflow (Create or Update)
  const handleSaveWorkflow = () => {
    if (!currentWorkflow) return;
    
    if (currentWorkflow.id) {
        // Edit Mode: Update existing
        const existing = workflows.find(w => w.id === currentWorkflow.id);
        if (existing) {
            updateWorkflow({
                ...existing,
                name: currentWorkflow.name,
                description: currentWorkflow.explanation,
                nodes: currentWorkflow.nodes,
                edges: currentWorkflow.edges,
            });
            addToast('success', 'Workflow updated successfully');
        }
    } else {
        // Create Mode
        const newWorkflow: Workflow = {
            id: `wf-${Date.now()}`,
            name: currentWorkflow.name,
            description: currentWorkflow.explanation,
            status: 'active',
            createdAt: new Date().toISOString(),
            nodes: currentWorkflow.nodes,
            edges: currentWorkflow.edges,
            stats: { runs: 0, successRate: 100 }
        };
        addWorkflow(newWorkflow);
        addToast('success', 'New workflow created and activated');
    }
    
    setActiveView('workflows');
    setCurrentWorkflow(null);
  };

  // 4. Delete Workflow
  const handleDeleteWorkflow = (id: string) => {
      if (confirm('Are you sure you want to delete this workflow? This cannot be undone.')) {
          deleteWorkflow(id);
          addToast('info', 'Workflow deleted');
      }
  };

  // 5. Update Workflow nodes in Builder
  const handleUpdateNodes = (updatedNodes: WorkflowNode[]) => {
      if (currentWorkflow) {
          setCurrentWorkflow({
              ...currentWorkflow,
              nodes: updatedNodes
          });
      }
  };
  
  // 6. Update Edges in Builder
  const handleUpdateEdges = (updatedEdges: WorkflowEdge[]) => {
      if (currentWorkflow) {
          setCurrentWorkflow({
              ...currentWorkflow,
              edges: updatedEdges
          });
      }
  };

  // 7. Initiate Run (Opens Modal)
  const handleInitiateRun = (workflow: Workflow) => {
      setWorkflowToRun(workflow);
      setRunModalOpen(true);
  };

  // 8. Execute Run (Called from Modal)
  const handleExecuteRun = async (payload: any) => {
    setRunModalOpen(false);
    if (!workflowToRun) return;

    addToast('loading', `Starting ${workflowToRun.name}...`, 2000);

    try {
        await executeWorkflow(
            workflowToRun.id,
            workflowToRun.name,
            workflowToRun.nodes,
            workflowToRun.edges,
            (updatedRunLog) => {
                // Update runs state in real-time via context
                updateRun(updatedRunLog);
                
                // Handle Completion Toasts
                if (updatedRunLog.status === 'success') {
                  addToast('success', `Run completed: ${workflowToRun.name}`, 3000);
                } else if (updatedRunLog.status === 'failed') {
                  addToast('error', `Run failed: ${workflowToRun.name}`, 5000);
                }
            },
            payload
        );
    } catch (e) {
        console.error("Workflow failed to start", e);
        addToast('error', 'Failed to start workflow');
    }
  };

  // Handle run inside builder (Simulate/Test)
  const handleTestRunInBuilder = () => {
      if (currentWorkflow) {
          // Construct a temporary workflow object to run
          const tempWf: Workflow = {
              id: currentWorkflow.id || `temp-${Date.now()}`,
              name: currentWorkflow.name,
              description: currentWorkflow.explanation,
              status: 'draft',
              createdAt: new Date().toISOString(),
              nodes: currentWorkflow.nodes,
              edges: currentWorkflow.edges,
              stats: { runs: 0, successRate: 0 }
          };
          handleInitiateRun(tempWf);
      }
  };

  const handleOptimize = async () => {
      if (!currentWorkflow) return;
      setIsOptimizing(true);
      addToast('loading', 'AI is analyzing your workflow...', 2000);
      try {
          const optimized = await optimizeWorkflow(currentWorkflow);
          if (optimized) {
              setCurrentWorkflow({
                  ...currentWorkflow, // Keep ID
                  ...optimized
              });
              addToast('success', 'Workflow optimized!');
          } else {
              addToast('error', 'Could not optimize workflow.');
          }
      } catch (e) {
          addToast('error', 'Optimization failed.');
      } finally {
          setIsOptimizing(false);
      }
  };

  const handleRunClick = (runId: string) => {
      setSelectedRunId(runId);
      setActiveView('run_detail');
  }

  // 9. Integration Toggle
  const handleToggleIntegration = (id: string) => {
    setConnectingId(id);
    // Simulate OAuth Delay
    setTimeout(() => {
      toggleIntegration(id);
      setConnectingId(null);
      
      const integration = integrations.find(i => i.id === id);
      const isNowConnected = !integration?.connected; // Toggled value
      
      if (isNowConnected) addToast('success', `Connected to ${integration?.name}`);
      else addToast('info', `Disconnected from ${integration?.name}`);

    }, 800);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard runs={runs} workflows={workflows} onViewRun={handleRunClick} />;
        
      case 'create':
        return <PromptBuilder onSuccess={handleWorkflowGenerated} />;
      
      case 'templates':
        return <TemplateLibrary onSelectTemplate={handleTemplateSelect} />;

      case 'workflows':
          return (
            <WorkflowList 
                workflows={workflows} 
                onSelect={(wf) => {
                    setCurrentWorkflow({
                        id: wf.id,
                        name: wf.name,
                        nodes: wf.nodes,
                        edges: wf.edges,
                        explanation: wf.description
                    });
                    setActiveView('builder');
                }}
                onRun={handleInitiateRun}
                onDelete={handleDeleteWorkflow}
            />
          );

      case 'docs':
        return <ArchitectureDocs />;
        
      case 'settings':
        return (
          <div className="relative">
             <div className="absolute top-0 right-0 flex space-x-2">
                <button 
                  onClick={() => {
                      resetData();
                      addToast('info', 'Data reset to defaults');
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-900/20 text-red-400 rounded-lg border border-red-900/50 hover:bg-red-900/30 transition-colors text-xs"
                >
                  <RotateCcw size={14} />
                  <span>Reset Demo Data</span>
                </button>
                <button 
                  onClick={() => {
                      signOut();
                      addToast('info', 'Signed out');
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors text-xs"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
             </div>
             <Settings />
          </div>
        );

      case 'runs':
         return (
             <div className="max-w-6xl mx-auto">
                 <h2 className="text-2xl font-bold text-white mb-6">Execution History</h2>
                 <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                     <table className="w-full text-left">
                         <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase font-semibold">
                             <tr>
                                 <th className="px-6 py-4">Status</th>
                                 <th className="px-6 py-4">Workflow</th>
                                 <th className="px-6 py-4">Started</th>
                                 <th className="px-6 py-4">Duration</th>
                                 <th className="px-6 py-4 text-right">Actions</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-800">
                             {runs.length === 0 ? (
                               <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No runs recorded yet.</td></tr>
                             ) : runs.map(run => (
                                 <tr key={run.id} className="hover:bg-slate-800/50 transition-colors group">
                                     <td className="px-6 py-4">
                                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                             run.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
                                             run.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400 animate-pulse'
                                         }`}>
                                             {run.status === 'success' && <Check size={12} className="mr-1" />}
                                             {run.status === 'running' && <Loader2 size={12} className="mr-1 animate-spin" />}
                                             {run.status}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 font-medium text-slate-200">{run.workflowName}</td>
                                     <td className="px-6 py-4 text-slate-400 text-sm">
                                        {run.startedAt.includes('T') ? new Date(run.startedAt).toLocaleString() : run.startedAt}
                                     </td>
                                     <td className="px-6 py-4 text-slate-400 text-sm font-mono">{run.duration}</td>
                                     <td className="px-6 py-4 text-right">
                                         <button 
                                            onClick={() => handleRunClick(run.id)}
                                            className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-opacity"
                                         >
                                             View Logs
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
         );

      case 'run_detail':
          return selectedRunId ? (
            <RunDetail 
                runId={selectedRunId} 
                onBack={() => setActiveView('runs')} 
            />
          ) : (
             setActiveView('runs'), null
          );
        
      case 'builder':
        if (!currentWorkflow) return <div className="text-center text-slate-500 mt-20">No active workflow.</div>;
        return (
          <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                        {currentWorkflow.name}
                        {currentWorkflow.id && <span className="ml-3 text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full font-normal">Editing</span>}
                    </h2>
                    <p className="text-slate-400 text-sm max-w-3xl">{currentWorkflow.explanation}</p>
                </div>
                <div className="flex items-center space-x-3">
                     <button
                        onClick={handleOptimize}
                        disabled={isOptimizing}
                        className="flex items-center space-x-2 bg-slate-800 hover:bg-brand-900/20 text-slate-300 hover:text-brand-400 border border-slate-700 hover:border-brand-500/50 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                     >
                        {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span>Optimize with AI</span>
                     </button>
                     <div className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {currentWorkflow.id ? 'Active Mode' : 'Draft Mode'}
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                <WorkflowCanvas 
                    nodes={currentWorkflow.nodes} 
                    edges={currentWorkflow.edges} 
                    onSave={handleSaveWorkflow}
                    onSimulate={handleTestRunInBuilder}
                    onUpdateNodes={handleUpdateNodes}
                    onUpdateEdges={handleUpdateEdges}
                    activeRun={currentActiveRun}
                />
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Connected Apps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {integrations.map(integration => {
                    const isConnecting = connectingId === integration.id;
                    return (
                        <div key={integration.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex flex-col items-center text-center hover:border-brand-500/30 transition-colors group relative overflow-hidden">
                             {isConnecting && (
                               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                                 <Loader2 className="animate-spin text-brand-400" size={24} />
                               </div>
                             )}

                             <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${integration.connected ? 'bg-brand-500/20' : 'bg-slate-800'}`}>
                                <span className={`text-2xl font-bold ${integration.connected ? 'text-brand-400' : 'text-slate-300'}`}>{integration.name[0]}</span>
                             </div>
                             <h3 className="font-semibold text-white">{integration.name}</h3>
                             <p className="text-xs text-slate-500 mb-4">{integration.category}</p>
                             
                             {integration.connected ? (
                                 <button 
                                    onClick={() => handleToggleIntegration(integration.id)}
                                    className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center space-x-1 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all group/btn"
                                 >
                                     <Check size={12} className="group-hover/btn:hidden" />
                                     <span className="group-hover/btn:hidden">Connected</span>
                                     <span className="hidden group-hover/btn:inline">Disconnect</span>
                                 </button>
                             ) : (
                                <button 
                                    onClick={() => handleToggleIntegration(integration.id)}
                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full flex items-center space-x-1 transition-colors"
                                >
                                    <Plus size={12} />
                                    <span>Connect</span>
                                </button>
                             )}
                        </div>
                    )
                })}
            </div>
          </div>
        );

      default:
        return (
             <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p>Section under construction</p>
                <button onClick={() => setActiveView('dashboard')} className="mt-4 text-brand-400 hover:underline">Go Home</button>
            </div>
        );
    }
  };

  return (
    <Layout activeView={activeView} onChangeView={setActiveView}>
      {renderContent()}
      
      {/* Run Configuration Modal */}
      <RunModal 
        isOpen={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        onRun={handleExecuteRun}
        workflowName={workflowToRun?.name || 'Workflow'}
      />
    </Layout>
  );
}

function AppContent() {
    const { session, isGuest, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-dark-950 text-brand-400">
                <Loader2 size={32} className="animate-spin" />
            </div>
        )
    }

    if (!session && !isGuest) {
        return <AuthPage />;
    }

    return (
        <AutomatorProvider>
            <AutomatorDashboard />
        </AutomatorProvider>
    );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
