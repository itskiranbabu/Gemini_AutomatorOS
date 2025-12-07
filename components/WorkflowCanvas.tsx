
import React, { useEffect, useState } from 'react';
import { WorkflowNode, WorkflowEdge, NodeType, RunLog } from '../types';
import { Zap, Mail, MessageSquare, ShoppingCart, Database, Brain, Play, Save, Settings2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { NodeConfigPanel } from './NodeConfigPanel';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onSave?: () => void;
  onSimulate?: () => void;
  readOnly?: boolean;
  onUpdateNodes?: (nodes: WorkflowNode[]) => void;
  activeRun?: RunLog | null; // For visualizing real-time execution
}

const getIcon = (service: string) => {
  const s = service.toLowerCase();
  if (s.includes('gmail') || s.includes('mail')) return Mail;
  if (s.includes('slack') || s.includes('discord')) return MessageSquare;
  if (s.includes('shopify') || s.includes('stripe')) return ShoppingCart;
  if (s.includes('sheet') || s.includes('airtable')) return Database;
  if (s.includes('gpt') || s.includes('gemini') || s.includes('ai')) return Brain;
  return Zap;
};

const getNodeColor = (type: NodeType) => {
  switch (type) {
    case NodeType.TRIGGER: return 'border-brand-500 shadow-brand-500/20';
    case NodeType.ACTION: return 'border-indigo-500 shadow-indigo-500/20';
    case NodeType.CONDITION: return 'border-amber-500 shadow-amber-500/20';
    case NodeType.AI: return 'border-purple-500 shadow-purple-500/20';
    default: return 'border-slate-600';
  }
};

const getNodeBg = (type: NodeType) => {
   switch (type) {
    case NodeType.TRIGGER: return 'from-brand-500/20 to-brand-600/5';
    case NodeType.ACTION: return 'from-indigo-500/20 to-indigo-600/5';
    case NodeType.CONDITION: return 'from-amber-500/20 to-amber-600/5';
    case NodeType.AI: return 'from-purple-500/20 to-purple-600/5';
    default: return 'from-slate-700/50 to-slate-800/50';
  }
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ nodes, edges, onSave, onSimulate, readOnly, onUpdateNodes, activeRun }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    if (onUpdateNodes) {
      const newNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
      onUpdateNodes(newNodes);
    }
    setSelectedNodeId(null);
  };

  const handleNodeDelete = (nodeId: string) => {
    if (onUpdateNodes) {
        const newNodes = nodes.filter(n => n.id !== nodeId);
        onUpdateNodes(newNodes);
    }
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Determine node status from activeRun
  const getNodeStatus = (nodeId: string): 'pending' | 'running' | 'success' | 'failed' | 'idle' => {
      if (!activeRun) return 'idle';
      const step = activeRun.steps.find(s => s.nodeId === nodeId);
      if (step) return step.status;
      return 'idle';
  };

  return (
    <div className="relative w-full h-full bg-slate-900/30 rounded-xl overflow-hidden border border-slate-800/50 shadow-inner flex">
      
      <div className="flex-1 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        {/* Toolbar */}
        {!readOnly && (
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            {activeRun?.status === 'running' ? (
                <div className="bg-slate-800 border border-slate-700 text-brand-400 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 animate-pulse">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Executing...</span>
                </div>
            ) : (
                <button onClick={onSimulate} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                    <Play size={16} className="text-slate-400" />
                    <span>Test Run</span>
                </button>
            )}
            <button onClick={onSave} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 shadow-lg shadow-brand-900/20">
              <Save size={16} />
              <span>{activeRun ? 'Save & Deploy' : 'Activate Workflow'}</span>
            </button>
          </div>
        )}

        {/* Canvas Area */}
        <div 
          className="w-full h-full relative overflow-auto p-20 flex items-center justify-center"
          onClick={() => setSelectedNodeId(null)} // Click background to deselect
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((edge) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const x1 = sourceNode.x + 200; 
              const y1 = sourceNode.y + 40; 
              const x2 = targetNode.x;       
              const y2 = targetNode.y + 40;
              const controlPointOffset = Math.abs(x2 - x1) / 2;

              // Check if edge is "active" (source node completed)
              const sourceStatus = getNodeStatus(sourceNode.id);
              const isFlowing = sourceStatus === 'success';

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`}
                    stroke="#334155"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={`M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`}
                    stroke={isFlowing ? '#38bdf8' : 'transparent'}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="10,10"
                    className={isFlowing ? 'animate-dash' : ''}
                    opacity={isFlowing ? 1 : 0}
                  />
                </g>
              );
            })}
          </svg>

          <div className="relative w-full h-full min-w-[800px] min-h-[600px]">
            {nodes.map((node, index) => {
              const Icon = getIcon(node.service);
              const status = getNodeStatus(node.id);
              const isSelected = selectedNodeId === node.id;
              
              // Dynamic Styling based on Status
              let statusBorder = getNodeColor(node.type);
              let statusRing = '';
              
              if (status === 'running') {
                  statusBorder = 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]';
                  statusRing = 'ring-2 ring-blue-500';
              } else if (status === 'success') {
                  statusBorder = 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
              } else if (status === 'failed') {
                  statusBorder = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
              }

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) setSelectedNodeId(node.id);
                  }}
                  className={`absolute w-64 rounded-xl border bg-slate-900 backdrop-blur-md p-4 transition-all duration-300 node-enter group cursor-pointer 
                    ${isSelected ? 'ring-2 ring-brand-400 border-transparent' : 'hover:border-brand-500/50'} 
                    ${statusBorder} ${statusRing}`}
                  style={{ 
                    left: node.x, 
                    top: node.y,
                    transform: status === 'running' || isSelected ? 'scale(1.02)' : 'scale(1)',
                    zIndex: isSelected ? 10 : 1
                  }}
                >
                  {/* Node Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getNodeBg(node.type)}`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        {status === 'running' && <Loader2 size={14} className="animate-spin text-blue-400"/>}
                        {status === 'success' && <CheckCircle2 size={14} className="text-emerald-400"/>}
                        {status === 'failed' && <XCircle size={14} className="text-red-400"/>}
                        <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                        {node.type}
                        </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm mb-1">{node.label}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{node.description || `Execute ${node.service} action`}</p>
                  </div>

                  {/* Config Hint */}
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 group-hover:text-brand-400 transition-colors">
                    <span className="flex items-center"><Settings2 size={12} className="mr-1"/> {readOnly ? 'View Config' : 'Configure'}</span>
                  </div>
                  
                  {/* Connectors */}
                  {index > 0 && (
                    <div className={`absolute top-1/2 -left-1.5 w-3 h-3 rounded-full border-2 border-slate-900 transition-colors ${status === 'success' || status === 'running' ? 'bg-brand-400' : 'bg-slate-400'}`}></div>
                  )}
                  {index < nodes.length - 1 && (
                    <div className={`absolute top-1/2 -right-1.5 w-3 h-3 rounded-full border-2 border-slate-900 transition-colors ${status === 'success' ? 'bg-brand-400' : 'bg-slate-400'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Config Panel Overlay */}
      {selectedNode && !readOnly && (
        <NodeConfigPanel 
          node={selectedNode} 
          onClose={() => setSelectedNodeId(null)} 
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
        />
      )}

      <style>{`
        .animate-dash {
          animation: dash 1s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>
    </div>
  );
};
