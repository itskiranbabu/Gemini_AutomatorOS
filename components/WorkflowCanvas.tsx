
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WorkflowNode, WorkflowEdge, NodeType, RunLog } from '../types';
import { Zap, Mail, MessageSquare, ShoppingCart, Database, Brain, Play, Save, Settings2, Loader2, CheckCircle2, XCircle, GitFork, Plus, Trash2, X, FileCode, Globe, Download, MousePointer2, ZoomIn, ZoomOut, Maximize, Eraser } from 'lucide-react';
import { NodeConfigPanel } from './NodeConfigPanel';
import { useToast } from '../store/ToastContext';

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
  if (type === NodeType.SCRIPT) return FileCode;
  const s = service.toLowerCase();
  if (s === 'http' || s === 'webhook') return Globe;
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
    case NodeType.SCRIPT: return 'border-pink-500 shadow-pink-500/20';
    default: return 'border-slate-600';
  }
};

const getNodeBg = (type: NodeType) => {
   switch (type) {
    case NodeType.TRIGGER: return 'from-brand-500/20 to-brand-600/5';
    case NodeType.ACTION: return 'from-indigo-500/20 to-indigo-600/5';
    case NodeType.CONDITION: return 'from-amber-500/20 to-amber-600/5';
    case NodeType.AI: return 'from-purple-500/20 to-purple-600/5';
    case NodeType.SCRIPT: return 'from-pink-500/20 to-pink-600/5';
    default: return 'from-slate-700/50 to-slate-800/50';
  }
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
    nodes, edges, onSave, onSimulate, readOnly, onUpdateNodes, onUpdateEdges, activeRun 
}) => {
  const { addToast } = useToast();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Viewport State (Zoom & Pan)
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Dragging State
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 }); // World coordinates
  const [nodeStartPos, setNodeStartPos] = useState({ x: 0, y: 0 }); 

  // Connecting State
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // World coordinates

  // -- Coordinate Helpers --
  const screenToWorld = (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
          x: (screenX - rect.left - viewport.x) / viewport.zoom,
          y: (screenY - rect.top - viewport.y) / viewport.zoom
      };
  };

  // -- Handlers --

  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    if (onUpdateNodes) {
      const newNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
      onUpdateNodes(newNodes);
    }
    setSelectedNodeId(null);
  };

  const handleNodeDelete = useCallback((nodeId: string) => {
    if (onUpdateNodes && onUpdateEdges && !readOnly) {
        const newNodes = nodes.filter(n => n.id !== nodeId);
        onUpdateNodes(newNodes);
        
        const newEdges = edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        onUpdateEdges(newEdges);
        setSelectedNodeId(null);
    }
  }, [nodes, edges, onUpdateNodes, onUpdateEdges, readOnly]);

  const handleEdgeDelete = useCallback(() => {
      if (selectedEdgeId && onUpdateEdges && !readOnly) {
          onUpdateEdges(edges.filter(e => e.id !== selectedEdgeId));
          setSelectedEdgeId(null);
      }
  }, [selectedEdgeId, edges, onUpdateEdges, readOnly]);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (readOnly) return;
          
          // Delete / Backspace
          if (e.key === 'Delete' || e.key === 'Backspace') {
              // Don't delete if editing text
              if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
              
              if (selectedNodeId) handleNodeDelete(selectedNodeId);
              if (selectedEdgeId) handleEdgeDelete();
          }

          // Save
          if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault();
              if (onSave) onSave();
          }

          // Pan (Spacebar) handled via keydown/keyup tracking usually, 
          // but we'll use a simpler modifier key check in mouse events for now or explicit mode.
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, handleNodeDelete, handleEdgeDelete, onSave, readOnly]);


  // Zoom Logic
  const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          const zoomSensitivity = 0.001;
          const delta = -e.deltaY * zoomSensitivity;
          const newZoom = Math.min(Math.max(viewport.zoom + delta, 0.1), 3);
          
          // Zoom towards mouse pointer logic could go here, for now center zoom or simpler
          setViewport(prev => ({ ...prev, zoom: newZoom }));
      } else {
          // Pan
          setViewport(prev => ({
              ...prev,
              x: prev.x - e.deltaX,
              y: prev.y - e.deltaY
          }));
      }
  };


  const handleMouseDown = (e: React.MouseEvent, node?: WorkflowNode) => {
      if (e.button === 1 || e.nativeEvent.buttons === 4 || (e.code === 'Space')) {
           // Middle mouse or Space pan
           e.preventDefault();
           setIsPanning(true);
           return;
      }
      
      // Pan with spacebar held
      if (e.shiftKey) { 
          setIsPanning(true);
          return;
      }

      const worldPos = screenToWorld(e.clientX, e.clientY);

      if (node && !readOnly) {
        e.stopPropagation();
        setDraggingNodeId(node.id);
        setSelectedNodeId(node.id);
        setDragStartPos(worldPos);
        setNodeStartPos({ x: node.x, y: node.y });
      } else {
          // Clicked on canvas background
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
          setIsPanning(true); // Default to pan on bg drag
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      
      if (isPanning) {
           setViewport(prev => ({
               ...prev,
               x: prev.x + e.movementX,
               y: prev.y + e.movementY
           }));
           return;
      }

      if (connectingSourceId) {
           setMousePos(worldPos);
      }

      if (draggingNodeId && onUpdateNodes) {
           const dx = worldPos.x - dragStartPos.x;
           const dy = worldPos.y - dragStartPos.y;
           
           const newX = nodeStartPos.x + dx;
           const newY = nodeStartPos.y + dy;

           // Snap to grid (20px)
           const snappedX = Math.round(newX / 20) * 20;
           const snappedY = Math.round(newY / 20) * 20;
           
           const updatedNodes = nodes.map(n => 
               n.id === draggingNodeId ? { ...n, x: snappedX, y: snappedY } : n
           );
           onUpdateNodes(updatedNodes);
      }
  };

  const handleMouseUp = () => {
      setDraggingNodeId(null);
      setConnectingSourceId(null);
      setIsPanning(false);
  };

  // Connection Logic
  const handleConnectorMouseDown = (e: React.MouseEvent, nodeId: string) => {
      if (readOnly) return;
      e.stopPropagation();
      setConnectingSourceId(nodeId);
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setMousePos(worldPos);
  };

  const handleConnectorMouseUp = (e: React.MouseEvent, targetNodeId: string) => {
      if (readOnly || !connectingSourceId) return;
      e.stopPropagation();

      if (connectingSourceId === targetNodeId) return; // No self loops

      const exists = edges.some(e => e.source === connectingSourceId && e.target === targetNodeId);
      
      if (!exists && onUpdateEdges) {
          const sourceNode = nodes.find(n => n.id === connectingSourceId);
          let label: string | undefined = undefined;

          if (sourceNode?.type === NodeType.CONDITION) {
             const existingEdges = edges.filter(e => e.source === connectingSourceId);
             const hasTrue = existingEdges.some(e => e.label === 'true');
             label = hasTrue ? 'false' : 'true';
          }

          const newEdge: WorkflowEdge = {
              id: `e-${Date.now()}`,
              source: connectingSourceId,
              target: targetNodeId,
              label
          };
          onUpdateEdges([...edges, newEdge]);
      }
      setConnectingSourceId(null);
  };

  const handleAddNode = () => {
      if (readOnly || !onUpdateNodes) return;
      // Add to center of current viewport
      const centerX = (-viewport.x + (containerRef.current?.clientWidth || 800) / 2) / viewport.zoom;
      const centerY = (-viewport.y + (containerRef.current?.clientHeight || 600) / 2) / viewport.zoom;

      const newNode: WorkflowNode = {
          id: `node-${Date.now()}`,
          type: NodeType.ACTION,
          service: 'system',
          label: 'New Action',
          x: centerX - 128, // Center node width
          y: centerY - 40,
          config: {}
      };
      onUpdateNodes([...nodes, newNode]);
      setSelectedNodeId(newNode.id);
  };

  const handleClear = () => {
      if (confirm('Are you sure you want to clear the canvas?') && onUpdateNodes && onUpdateEdges) {
          onUpdateNodes([]);
          onUpdateEdges([]);
      }
  };

  const handleExport = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges, name: 'workflow' }, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "workflow.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addToast('success', 'Workflow exported to JSON');
  };

  const getNodeStatus = (nodeId: string): 'pending' | 'running' | 'success' | 'failed' | 'idle' => {
      if (!activeRun) return 'idle';
      const step = activeRun.steps.find(s => s.nodeId === nodeId);
      if (step) return step.status;
      return 'idle';
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950/50">
      
      {/* Toolbar */}
      {!readOnly && (
          <div className="absolute top-4 right-4 flex space-x-2 z-20">
             {/* Zoom Controls */}
             <div className="bg-slate-900 border border-slate-700 rounded-lg flex items-center mr-2 shadow-lg">
                <button onClick={() => setViewport(v => ({...v, zoom: Math.max(v.zoom - 0.2, 0.2)}))} className="p-2 text-slate-400 hover:text-white border-r border-slate-700">
                    <ZoomOut size={16} />
                </button>
                <span className="text-xs text-slate-400 w-12 text-center">{Math.round(viewport.zoom * 100)}%</span>
                <button onClick={() => setViewport(v => ({...v, zoom: Math.min(v.zoom + 0.2, 3)}))} className="p-2 text-slate-400 hover:text-white border-l border-slate-700">
                    <ZoomIn size={16} />
                </button>
                <button onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })} className="p-2 text-slate-400 hover:text-white border-l border-slate-700" title="Reset View">
                    <Maximize size={16} />
                </button>
             </div>

             <button onClick={handleExport} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors" title="Export JSON">
                <Download size={16} />
            </button>
             <button onClick={handleClear} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-400 px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors" title="Clear Canvas">
                <Eraser size={16} />
            </button>
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
              <span>{activeRun ? 'Save & Deploy' : 'Activate'}</span>
            </button>
          </div>
      )}
      
      {/* Hint */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none opacity-50">
          <div className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              <span className="font-bold">Space + Drag</span> to pan • <span className="font-bold">Scroll</span> to zoom • <span className="font-bold">Del</span> to remove
          </div>
      </div>

      <div 
        ref={containerRef}
        className={`w-full h-full relative overflow-hidden outline-none ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
        onWheel={handleWheel}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Transform Container */}
        <div 
            style={{ 
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: '0 0',
                width: '100%',
                height: '100%',
                position: 'absolute'
            }}
        >
            {/* Infinite Grid Background */}
            <div 
                className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] pointer-events-none opacity-10" 
                style={{ 
                    backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', 
                    backgroundSize: '24px 24px',
                }}
            ></div>

            <svg className="absolute top-[-5000px] left-[-5000px] w-[10000px] h-[10000px] overflow-visible pointer-events-none">
                <g transform="translate(5000, 5000)">
                    {/* Render Edges */}
                    {edges.map((edge) => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const x1 = sourceNode.x + 256; 
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
                        {/* Hitbox */}
                        <path
                            d={`M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`}
                            stroke="transparent"
                            strokeWidth="20"
                            fill="none"
                        />
                        {/* Path */}
                        <path
                            d={`M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`}
                            stroke={isSelected ? '#38bdf8' : "#334155"}
                            strokeWidth={isSelected ? "3" : "2"}
                            fill="none"
                        />
                        {/* Animation */}
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

                    {/* Dragging Line */}
                    {connectingSourceId && (
                        <path 
                            d={`M ${nodes.find(n => n.id === connectingSourceId)!.x + 256} ${nodes.find(n => n.id === connectingSourceId)!.y + 40} L ${mousePos.x} ${mousePos.y}`}
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            fill="none"
                        />
                    )}
                </g>
            </svg>

            {/* Nodes */}
            <div className="absolute top-0 left-0" style={{ transform: 'translate(5000px, 5000px)' }}>
                {nodes.map((node) => {
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
                        className={`absolute w-64 rounded-xl border bg-slate-900 backdrop-blur-md p-4 transition-shadow duration-200 group cursor-grab active:cursor-grabbing 
                            ${isSelected ? 'ring-2 ring-brand-400 border-transparent z-50' : 'hover:border-brand-500/50 z-10'} 
                            ${statusBorder} ${statusRing}`}
                        style={{ 
                            left: node.x, 
                            top: node.y,
                            // Counter-scale effects if needed, but here simple scale works
                        }}
                        >
                            {/* Node Content - same as before */}
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

                            <div className="pointer-events-none">
                                <h4 className="font-semibold text-slate-200 text-sm mb-1">{node.label}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2">{node.description || `Execute ${node.service} action`}</p>
                            </div>

                            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 group-hover:text-brand-400 transition-colors pointer-events-none">
                                <span className="flex items-center"><Settings2 size={12} className="mr-1"/> {readOnly ? 'View Config' : 'Configure'}</span>
                            </div>
                        
                            {/* Connectors */}
                            <div 
                                className={`absolute top-1/2 -left-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-brand-500/20 transition-all cursor-crosshair group/connector`}
                                onMouseUp={(e) => handleConnectorMouseUp(e, node.id)}
                            >
                                <div className={`w-3 h-3 rounded-full border-2 border-slate-900 transition-colors ${status === 'success' || status === 'running' ? 'bg-brand-400' : 'bg-slate-400 group-hover/connector:bg-brand-400'}`}></div>
                            </div>
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

      {/* Config Panel */}
      {selectedNodeId && !readOnly && (
        <NodeConfigPanel 
          node={nodes.find(n => n.id === selectedNodeId) || null} 
          nodes={nodes}
          edges={edges}
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
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  );
};
