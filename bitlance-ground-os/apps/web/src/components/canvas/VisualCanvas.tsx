import React, { useState, useRef, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid, 
  Plus, 
  Trash2, 
  Copy, 
  Play, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Phone, 
  MessageSquare, 
  Zap,
  Move
} from 'lucide-react';

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  color?: string;
  config?: Record<string, any>;
  status?: 'idle' | 'running' | 'success' | 'error';
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
}

const ICON_MAP: Record<string, any> = {
  TRIGGER: Clock,
  CONDITION: CheckCircle2,
  AI: Brain,
  VOICE: Phone,
  MESSAGE: MessageSquare,
  CRM_UPDATE: CheckCircle2,
  ANALYTICS: Zap,
  DELAY: Clock
};

interface VisualCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  onConnectionsChange?: (connections: WorkflowConnection[]) => void;
  onRunSimulation?: () => void;
  isSimulating?: boolean;
}

export default function VisualCanvas({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onNodesChange,
  onConnectionsChange,
  onRunSimulation,
  isSimulating = false
}: VisualCanvasProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.15, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Canvas Panning Handlers
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'canvas-bg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      if (onSelectNode) onSelectNode(null);
    }
  };

  const handleMouseMoveCanvas = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggedNodeId && onNodesChange) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      const newX = Math.round((clientX - rect.left - pan.x) / zoom - dragOffset.x);
      const newY = Math.round((clientY - rect.top - pan.y) / zoom - dragOffset.y);

      onNodesChange(
        nodes.map(n => (n.id === draggedNodeId ? { ...n, x: Math.max(10, newX), y: Math.max(10, newY) } : n))
      );
    }
  }, [isPanning, panStart, pan, draggedNodeId, dragOffset, zoom, nodes, onNodesChange]);

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.stopPropagation();
    setDraggedNodeId(node.id);
    if (onSelectNode) onSelectNode(node.id);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom;

    setDragOffset({
      x: mouseCanvasX - node.x,
      y: mouseCanvasY - node.y
    });
  };

  // Helper to get center handles for SVG bezier connection paths
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return {
      x: node.x + 85, // width / 2
      y: node.y + 40  // height / 2
    };
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '540px',
        background: '#090d16',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        userSelect: 'none'
      }}
    >
      {/* Top Floating Toolbar */}
      <div 
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          right: '16px',
          zIndex: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        {/* Status indicator */}
        <div 
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            padding: '8px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isSimulating ? '#10b981' : '#6366f1',
              boxShadow: isSimulating ? '0 0 10px #10b981' : '0 0 8px #6366f1'
            }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
            {isSimulating ? 'Executing Simulation...' : 'Workflow Canvas'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>
            ({nodes.length} nodes, {connections.length} links)
          </span>
        </div>

        {/* Action buttons */}
        <div 
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            padding: '6px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {onRunSimulation && (
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isSimulating ? '#059669' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isSimulating ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Play size={14} fill="#ffffff" />
              {isSimulating ? 'Simulating...' : 'Test Run Workflow'}
            </button>
          )}

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <ZoomIn size={16} />
          </button>

          <span style={{ fontSize: '0.75rem', color: '#cbd5e1', minWidth: '42px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <ZoomOut size={16} />
          </button>

          <button
            onClick={handleResetView}
            title="Reset View"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Maximize2 size={16} />
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
            style={{
              background: showGrid ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: 'none',
              color: showGrid ? '#818cf8' : '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={canvasRef}
        id="canvas-bg"
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onMouseLeave={handleMouseUpCanvas}
        style={{
          width: '100%',
          height: '100%',
          cursor: isPanning ? 'grabbing' : 'grab',
          position: 'relative'
        }}
      >
        {/* Pan and Zoom Scalable Viewport */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none'
          }}
        >
          {/* Canvas Grid Background Pattern */}
          {showGrid && (
            <div
              style={{
                position: 'absolute',
                width: '4000px',
                height: '4000px',
                left: '-1000px',
                top: '-1000px',
                backgroundImage: `
                  radial-gradient(circle, rgba(99, 102, 241, 0.15) 1.5px, transparent 1.5px)
                `,
                backgroundSize: '32px 32px',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* SVG Connection Lines */}
          <svg
            style={{
              position: 'absolute',
              width: '4000px',
              height: '4000px',
              left: '-1000px',
              top: '-1000px',
              overflow: 'visible',
              pointerEvents: 'none'
            }}
          >
            <defs>
              <linearGradient id="line-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {connections.map(conn => {
              const fromPos = getNodeCenter(conn.from);
              const toPos = getNodeCenter(conn.to);

              if (!fromPos.x || !toPos.x) return null;

              // Offset coordinates for svg offset container
              const x1 = fromPos.x + 1000;
              const y1 = fromPos.y + 1000;
              const x2 = toPos.x + 1000;
              const y2 = toPos.y + 1000;

              const dx = x2 - x1;
              const curveStrength = Math.min(Math.abs(dx) * 0.5, 120);

              const pathD = `M ${x1} ${y1} C ${x1 + curveStrength} ${y1}, ${x2 - curveStrength} ${y2}, ${x2} ${y2}`;

              return (
                <g key={conn.id}>
                  {/* Outer glow line */}
                  <path
                    d={pathD}
                    stroke="rgba(99, 102, 241, 0.25)"
                    strokeWidth="5"
                    fill="none"
                  />
                  {/* Inner path */}
                  <path
                    d={pathD}
                    stroke="url(#line-glow)"
                    strokeWidth="2.5"
                    fill="none"
                    filter="url(#glow)"
                  />
                  {/* Pulse signal dot animation */}
                  {isSimulating && (
                    <circle r="4" fill="#38bdf8">
                      <animateMotion path={pathD} dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node Components */}
          {nodes.map(node => {
            const Icon = ICON_MAP[node.type] || Zap;
            const color = node.color || '#6366f1';
            const isSelected = selectedNodeId === node.id;
            const isNodeRunning = node.status === 'running';

            return (
              <div
                key={node.id}
                onMouseDown={e => handleNodeMouseDown(e, node)}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: '170px',
                  pointerEvents: 'auto',
                  cursor: draggedNodeId === node.id ? 'grabbing' : 'grab',
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))' 
                    : 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: isSelected
                    ? `2px solid ${color}`
                    : `1px solid ${color}44`,
                  borderRadius: '14px',
                  padding: '12px 14px',
                  boxShadow: isSelected
                    ? `0 0 24px ${color}55, 0 10px 25px rgba(0,0,0,0.5)`
                    : `0 8px 20px rgba(0,0,0,0.3)`,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.1s ease',
                  transform: isNodeRunning ? 'scale(1.04)' : 'scale(1)',
                  zIndex: isSelected ? 10 : 2
                }}
              >
                {/* Node Top Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        background: `${color}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${color}44`
                      }}
                    >
                      <Icon size={14} color={color} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                      }}
                    >
                      {node.type}
                    </span>
                  </div>

                  <Move size={12} color="#64748b" style={{ opacity: 0.6 }} />
                </div>

                {/* Node Title */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#f8fafc',
                    lineHeight: '1.3',
                    marginBottom: '6px'
                  }}
                >
                  {node.label}
                </div>

                {/* Connection points (Input & Output Ports) */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: color,
                    border: '2px solid #0f172a',
                    boxShadow: `0 0 8px ${color}`
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: color,
                    border: '2px solid #0f172a',
                    boxShadow: `0 0 8px ${color}`
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
