
import React, { useState } from 'react';
import { Database, Server, Cpu, Globe, Layers, Lock, GitBranch, Code, FileCode, CheckCircle2 } from 'lucide-react';
import { DB_SCHEMA_SQL } from '../constants';
import { TEMPORAL_WORKFLOW_EXAMPLE, ACTIVITY_EXAMPLE, CONNECTOR_SDK_EXAMPLE } from '../lib/backend-examples';

export const ArchitectureDocs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'backend' | 'sdk'>('overview');

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Architecture</h1>
          <p className="text-slate-400 text-lg">Technical specifications & Developer Guide.</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Overview & DB
          </button>
          <button 
            onClick={() => setActiveTab('backend')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'backend' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Workflow Engine
          </button>
           <button 
            onClick={() => setActiveTab('sdk')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'sdk' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Plugin SDK
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Status Check */}
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3">
             <CheckCircle2 className="text-emerald-400" />
             <div>
                 <h3 className="text-sm font-bold text-emerald-400">System Operational</h3>
                 <p className="text-xs text-slate-400">All modules (Auth, Engine, AI, DB) are active and running in production mode.</p>
             </div>
          </div>

          {/* High Level Architecture */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Layers className="mr-2 text-brand-400" /> High-Level Design
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-white font-semibold">
                            <Globe className="text-blue-400" /> <span>Frontend Layer</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Next.js application hosted on Vercel/Edge. Communicates via REST/RPC to the backend. 
                            Handles Auth via Supabase Client.
                        </p>
                    </div>
                    <div className="space-y-4">
                         <div className="flex items-center space-x-2 text-white font-semibold">
                            <Server className="text-purple-400" /> <span>Control Plane (API)</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Node.js/Express service running on containers. Manages configuration, triggers workflows, 
                            and proxies user requests.
                        </p>
                    </div>
                     <div className="space-y-4">
                         <div className="flex items-center space-x-2 text-white font-semibold">
                            <Cpu className="text-emerald-400" /> <span>Execution Plane</span>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Temporal.io cluster + Worker Nodes. Guarantees durable execution, retries, and state management 
                            for long-running workflows.
                        </p>
                    </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                        <div className="bg-slate-800 px-3 py-1 rounded">User Request</div>
                        <div className="h-px bg-slate-700 flex-1 mx-4 relative">
                            <span className="absolute top-[-10px] left-1/2 -translate-x-1/2">HTTPS</span>
                        </div>
                        <div className="bg-slate-800 px-3 py-1 rounded">Next.js App</div>
                         <div className="h-px bg-slate-700 flex-1 mx-4 relative">
                            <span className="absolute top-[-10px] left-1/2 -translate-x-1/2">API</span>
                        </div>
                        <div className="bg-slate-800 px-3 py-1 rounded">Supabase DB</div>
                    </div>
                </div>
            </div>
          </section>

          {/* Database Schema */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Database className="mr-2 text-brand-400" /> Database Schema (Postgres)
            </h2>
            <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center px-4 py-2 border-b border-slate-800 bg-slate-900/50 justify-between">
                    <span className="text-xs text-slate-500 font-mono">schema.sql</span>
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
                    </div>
                </div>
                <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto language-sql leading-relaxed">
                    {DB_SCHEMA_SQL}
                </pre>
            </div>
          </section>

           {/* Security */}
           <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Lock className="mr-2 text-brand-400" /> Security & Privacy
                    </h2>
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                      <ul className="space-y-4 text-slate-400 text-sm">
                          <li className="flex items-start">
                              <span className="mr-3 text-emerald-400 mt-0.5">✓</span>
                              <div>
                                <strong className="text-slate-200 block mb-1">AES-256 Encryption</strong>
                                All API keys and secrets are encrypted at rest. Keys are only decrypted in memory within the secure worker environment.
                              </div>
                          </li>
                          <li className="flex items-start">
                              <span className="mr-3 text-emerald-400 mt-0.5">✓</span>
                              <div>
                                <strong className="text-slate-200 block mb-1">Row Level Security (RLS)</strong>
                                Postgres RLS policies enforce strict tenant isolation. A user token from Workspace A cannot query data from Workspace B.
                              </div>
                          </li>
                      </ul>
                    </div>
               </div>
               <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <GitBranch className="mr-2 text-brand-400" /> Extendability Strategy
                    </h2>
                     <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                      <ul className="space-y-4 text-slate-400 text-sm">
                          <li className="flex items-start">
                              <span className="mr-3 text-brand-400 mt-0.5">•</span>
                              <div>
                                <strong className="text-slate-200 block mb-1">JSON-based Protocol</strong>
                                Connectors are defined via a strict JSON schema, allowing UI generation and validation without custom frontend code.
                              </div>
                          </li>
                          <li className="flex items-start">
                              <span className="mr-3 text-brand-400 mt-0.5">•</span>
                              <div>
                                <strong className="text-slate-200 block mb-1">Isolated Sandbox</strong>
                                Custom Node.js code runs in isolated V8 isolates (Cloudflare Workers style) or Firecracker microVMs.
                              </div>
                          </li>
                      </ul>
                    </div>
               </div>
           </section>
        </div>
      )}

      {activeTab === 'backend' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Durable Execution Engine</h3>
            <p className="text-slate-400">
              We use the <strong className="text-brand-400">Temporal.io</strong> pattern to ensure workflows are reliable, recoverable, and consistent.
              Unlike standard queues, this allows workflows to sleep for days, retry indefinitely, and survive process crashes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center px-4 py-2 border-b border-slate-800 bg-slate-900/50 justify-between">
                    <span className="text-xs text-slate-500 font-mono">workflow.ts</span>
                    <FileCode size={14} className="text-slate-500"/>
                </div>
                <pre className="p-4 text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed">
                    {TEMPORAL_WORKFLOW_EXAMPLE}
                </pre>
            </div>

            <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center px-4 py-2 border-b border-slate-800 bg-slate-900/50 justify-between">
                    <span className="text-xs text-slate-500 font-mono">activities.ts</span>
                    <FileCode size={14} className="text-slate-500"/>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    {ACTIVITY_EXAMPLE}
                </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sdk' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6">
             <h3 className="text-xl font-bold text-white mb-2">Connector SDK</h3>
            <p className="text-slate-400">
              Third-party developers can build integrations using our strictly typed TypeScript SDK.
              Connectors are registered via the registry API and dynamically loaded by Workers.
            </p>
          </div>

           <div className="bg-[#0d1117] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center px-4 py-2 border-b border-slate-800 bg-slate-900/50 justify-between">
                    <span className="text-xs text-slate-500 font-mono">sdk/definitions.ts</span>
                    <Code size={14} className="text-slate-500"/>
                </div>
                <pre className="p-6 text-sm font-mono text-orange-200 overflow-x-auto leading-relaxed">
                    {CONNECTOR_SDK_EXAMPLE}
                </pre>
            </div>
        </div>
      )}
    </div>
  );
};
