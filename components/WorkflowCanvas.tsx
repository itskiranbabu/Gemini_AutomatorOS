
import React, { useEffect, useState, useRef } from 'react';
import { WorkflowNode, WorkflowEdge, NodeType, RunLog } from '../types';
import { Zap, Mail, MessageSquare, ShoppingCart, Database, Brain, Play, Save, Settings2, Loader2, CheckCircle2, XCircle, GitFork, Plus, Trash2, X } from 'lucide-react';
import { NodeConfigPanel } from './NodeConfigPanel';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onSave?: () => void;
  onSimulate?: () => void;
  readOnly?: boolean;
  onUpdateNodes?: (nodes: WorkflowNode[]) => void;
  onUpdateEdges?: (edges: WorkflowEdge[]) => void;
  activeRun?: RunLog | null;
}

const getIcon = (service: string, type: NodeType) => {
  if (type === NodeType.CONDITION) return GitFork;
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

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
    nodes, edges, onSave, onSimulate, readOnly, onUpdateNodes, onUpdateEdges, activeRun 
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Dragging State
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connecting State
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // -- Handlers --

  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    if (onUpdateNodes) {
      const newNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
      onUpdateNodes(newNodes);
    }
    setSelectedNodeId(null);
  };

  const handleNodeDelete = (nodeId: string) => {
    if (onUpdateNodes && onUpdateEdges) {
        // Remove node
        const newNodes = nodes.filter(n => n.id !== nodeId);
        onUpdateNodes(newNodes);
        
        // Remove connected edges
        const newEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        onUpdateEdges(newEdges);
    }
    setSelectedNodeId(null);
  };

  const handleEdgeDelete = () => {
      if (selectedEdgeId && onUpdateEdges) {
          onUpdateEdges(edges.filter(e => e.id !== selectedEdgeId));
          setSelectedEdgeId(null);
      }
  };

  // Dragging Logic
  const handleMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
      if (readOnly) return;
      e.stopPropagation();
      
      // Calculate offset from node top-left
      // We need the container rect to normalize
      // But simplifying: assume node.x/y matches page coords roughly or just use delta
      // Best approach for absolute layout:
      
      setDraggingNodeId(node.id);
      setSelectedNodeId(node.id);
      setDragOffset({
          x: e.nativeEvent.offsetX, // Offset within the node div
          y: e.nativeEvent.offsetY
      });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      // Track mouse for connection line
      if (connectingSourceId || draggingNodeId) {
         if (containerRef.current) {
             const rect = containerRef.current.getBoundingClientRect();
             const x = e.clientX - rect.left;
             const y = e.clientY - rect.top;
             setMousePos({ x, y });

             // Handle Node Drag
             if (draggingNodeId && onUpdateNodes) {
                 const newX = x - dragOffset.x;
                 const newY = y - dragOffset.y;
                 // Snap grid? optional
                 
                 const updatedNodes = nodes.map(n => 
                     n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n
                 );
                 onUpdateNodes(updatedNodes);
             }
         }
      }
  };

  const handleMouseUp = () => {
      setDraggingNodeId(null);
      setConnectingSourceId(null);
  };

  // Connection Logic
  const handleConnectorMouseDown = (e: React.MouseEvent, nodeId: string) => {
      if (readOnly) return;
      e.stopPropagation();
      setConnectingSourceId(nodeId);
      // Initialize mousePos immediately
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
  };

  const handleConnectorMouseUp = (e: React.MouseEvent, targetNodeId: string) => {
      if (readOnly || !connectingSourceId) return;
      e.stopPropagation();

      if (connectingSourceId === targetNodeId) return; // No self loops

      // Check if exists
      const exists = edges.some(e => e.source === connectingSourceId && e.target === targetNodeId);
      if (!exists && onUpdateEdges) {
          const newEdge: WorkflowEdge = {
              id: `e-${Date.now()}`,
              source: connectingSourceId,
              target: targetNodeId
          };
          onUpdateEdges([...edges, newEdge]);
      }
      setConnectingSourceId(null);
  };

  const handleAddNode = () => {
      if (readOnly || !onUpdateNodes) return;
      const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          type: NodeType.ACTION,
          service: 'system',
          label: 'New Action',
          x: 100,
          y: 100,
          config: {}
      };
      onUpdateNodes([...nodes, newNode]);
      setSelectedNodeId(newNode.id);
  };

  // --- Render Helpers ---

  const getNodeStatus = (nodeId: string): 'pending' | 'running' | 'success' | 'failed' | 'idle' => {
      if (!activeRun) return 'idle';
      const step = activeRun.steps.find(s => s.nodeId === nodeId);
      if (step) return step.status;
      return 'idle';
  };

  return (
    <div 
        className="relative w-full h-full bg-slate-900/30 rounded-xl overflow-hidden border border-slate-800/50 shadow-inner flex flex-col"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={containerRef}
    >
      
      <div className="flex-1 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        {/* Toolbar */}
        {!readOnly && (
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
             <button onClick={handleAddNode} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors shadow-lg">
                <Plus size={16} className="text-brand-400" />
                <span>Add Node</span>
            </button>
            {activeRun?.status === 'running' ? (
                <div className="bg-slate-800 border border-slate-700 text-brand-400 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 animate-pulse">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Executing...</span>
                </div>
            ) : (
                <button onClick={onSimulate} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                    <Play size={16} className="text-emerald-400" />
                    <span>Run</span>
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
          className="w-full h-full relative overflow-auto cursor-grab active:cursor-grabbing"
          onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }} 
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '100%', minHeight: '100%', overflow: 'visible' }}>
            {/* Render Existing Edges */}
            {edges.map((edge) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const x1 = sourceNode.x + 256; // width of node 
              const y1 = sourceNode.y + 40; 
              const x2 = targetNode.x;       
              const y2 = targetNode.y + 40;
              const controlPointOffset = Math.abs(x2 - x1) / 2;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              const isFlowing = getNodeStatus(sourceNode.id) === 'success';
              const isSelected = selectedEdgeId === edge.id;

              return (
                <g key={edge.id} onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); }} className="pointer-events-auto cursor-pointer">
                  {/* Invisible wide path for easier clicking */}
                  <path
                    d={`M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`}
                    stroke="transparent"
                    strokeWidth="15"
                    fill="none"
                  />
                  {/* Visible path */}
                  <path
                    d={`M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`}
                    stroke={isSelected ? '#38bdf8' : "#334155"}
                    strokeWidth={isSelected ? "3" : "2"}
                    fill="none"
                  />
                   {/* Flow Animation */}
                  <path
                    d={`M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`}
                    stroke={isFlowing ? '#38bdf8' : 'transparent'}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="10,10"
                    className={isFlowing ? 'animate-dash' : ''}
                    opacity={isFlowing ? 1 : 0}
                  />
                  {edge.label && (
                      <g transform={`translate(${midX}, ${midY})`}>
                          <rect x="-20" y="-10" width="40" height="20" rx="4" fill="#0f172a" stroke="#334155" />
                          <text y="4" textAnchor="middle" fontSize="10" fill={edge.label === 'true' ? '#10b981' : edge.label === 'false' ? '#ef4444' : '#94a3b8'} fontWeight="bold">
                              {edge.label.toUpperCase()}
                          </text>
                      </g>
                  )}
                  {isSelected && (
                      <g transform={`translate(${midX}, ${midY})`}>
                          <circle r="12" fill="#ef4444" className="cursor-pointer hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); handleEdgeDelete(); }} />
                          <X size={12} x="-6" y="-6" stroke="white" strokeWidth="3" />
                      </g>
                  )}
                </g>
              );
            })}

            {/* Render Dragging Connection Line */}
            {connectingSourceId && (
                <path 
                    d={`M ${nodes.find(n => n.id === connectingSourceId)!.x + 256} ${nodes.find(n => n.id === connectingSourceId)!.y + 40} L ${mousePos.x} ${mousePos.y}`}
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                />
            )}
          </svg>

          {/* Nodes Layer */}
          <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {nodes.map((node, index) => {
              const Icon = getIcon(node.service, node.type);
              const status = getNodeStatus(node.id);
              const isSelected = selectedNodeId === node.id;
              
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
                  onMouseDown={(e) => handleMouseDown(e, node)}
                  className={`absolute w-64 rounded-xl border bg-slate-900 backdrop-blur-md p-4 transition-shadow duration-200 node-enter group cursor-grab active:cursor-grabbing 
                    ${isSelected ? 'ring-2 ring-brand-400 border-transparent z-50' : 'hover:border-brand-500/50 z-10'} 
                    ${statusBorder} ${statusRing}`}
                  style={{ 
                    left: node.x, 
                    top: node.y,
                    transform: status === 'running' || isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  {/* Node Header */}
                  <div className="flex items-center justify-between mb-3 pointer-events-none">
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
                  <div className="pointer-events-none">
                    <h4 className="font-semibold text-slate-200 text-sm mb-1">{node.label}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{node.description || `Execute ${node.service} action`}</p>
                  </div>

                  {/* Config Hint */}
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 group-hover:text-brand-400 transition-colors pointer-events-none">
                    <span className="flex items-center"><Settings2 size={12} className="mr-1"/> {readOnly ? 'View Config' : 'Configure'}</span>
                  </div>
                  
                  {/* --- Connectors --- */}
                  
                  {/* Input Connector (Drop Target) */}
                  <div 
                    className={`absolute top-1/2 -left-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-brand-500/20 transition-all cursor-crosshair group/connector`}
                    onMouseUp={(e) => handleConnectorMouseUp(e, node.id)}
                  >
                      <div className={`w-3 h-3 rounded-full border-2 border-slate-900 transition-colors ${status === 'success' || status === 'running' ? 'bg-brand-400' : 'bg-slate-400 group-hover/connector:bg-brand-400'}`}></div>
                  </div>

                  {/* Output Connector (Drag Source) */}
                  <div 
                    className={`absolute top-1/2 -right-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-brand-500/20 transition-all cursor-crosshair group/connector`}
                    onMouseDown={(e) => handleConnectorMouseDown(e, node.id)}
                  >
                       <div className={`w-3 h-3 rounded-full border-2 border-slate-900 transition-colors ${status === 'success' ? 'bg-brand-400' : 'bg-slate-400 group-hover/connector:bg-brand-400'}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Config Panel Overlay */}
      {selectedNodeId && !readOnly && (
        <NodeConfigPanel 
          node={nodes.find(n => n.id === selectedNodeId) || null} 
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
