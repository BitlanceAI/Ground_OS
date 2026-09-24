import { useState, useEffect } from 'react';
import { GitBranch, Zap, Plus, Play, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import VisualCanvas, { WorkflowNode, WorkflowConnection } from '../../components/canvas/VisualCanvas';
import NodePalette from '../../components/canvas/NodePalette';
import NodeInspector from '../../components/canvas/NodeInspector';
import WorkflowExecutionSimulator, { SimulationLog } from '../../components/canvas/WorkflowExecutionSimulator';

const INITIAL_NODES: WorkflowNode[] = [
  { id: 'n1', type: 'TRIGGER', label: 'Inbound Webhook Lead', x: 60, y: 160, color: '#ec4899' },
  { id: 'n2', type: 'AI', label: 'Gemini Intent Scorer', x: 280, y: 160, color: '#6366f1' },
  { id: 'n3', type: 'CONDITION', label: 'High Intent Lead?', x: 500, y: 160, color: '#f59e0b' },
  { id: 'n4', type: 'VOICE', label: 'AI Voice Outreach', x: 720, y: 80, color: '#3b82f6' },
  { id: 'n5', type: 'MESSAGE', label: 'WhatsApp Nurture', x: 720, y: 240, color: '#10b981' }
];

const INITIAL_CONNECTIONS: WorkflowConnection[] = [
  { id: 'c1', from: 'n1', to: 'n2' },
  { id: 'c2', from: 'n2', to: 'n3' },
  { id: 'c3', from: 'n3', to: 'n4' },
  { id: 'c4', from: 'n3', to: 'n5' }
];

export default function AutomationBuilderPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Canvas state
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<WorkflowConnection[]>(INITIAL_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [logs, setLogs] = useState<SimulationLog[]>([]);

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const res = await api.workflows.list();
        if (res.success && res.data && res.data.length > 0) {
          setWorkflows(res.data);
          // If first workflow has nodes, map them into initial state
          if (res.data[0].nodes && res.data[0].nodes.length > 0) {
            setNodes(res.data[0].nodes.map((n: any, idx: number) => ({
              ...n,
              x: n.x || 60 + idx * 220,
              y: n.y || 160,
              color: n.color || (idx === 0 ? '#ec4899' : '#6366f1')
            })));
          }
        }
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWorkflows();
  }, []);

  // Node CRUD operations
  const handleAddNode = (type: string, label: string, color: string) => {
    const newNodeId = `node_${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.x + 220 : 100;
    const newY = lastNode ? lastNode.y : 160;

    const newNode: WorkflowNode = {
      id: newNodeId,
      type,
      label,
      x: newX,
      y: newY,
      color
    };

    setNodes(prev => [...prev, newNode]);

    // Automatically link to previous node if available
    if (lastNode) {
      setConnections(prev => [
        ...prev,
        { id: `c_${Date.now()}`, from: lastNode.id, to: newNodeId }
      ]);
    }

    setSelectedNodeId(newNodeId);
  };

  const handleUpdateNode = (updatedNode: WorkflowNode) => {
    setNodes(prev => prev.map(n => (n.id === updatedNode.id ? updatedNode : n)));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleDuplicateNode = (node: WorkflowNode) => {
    const dupId = `node_${Date.now()}`;
    const dupNode: WorkflowNode = {
      ...node,
      id: dupId,
      label: `${node.label} (Copy)`,
      x: node.x + 40,
      y: node.y + 40
    };
    setNodes(prev => [...prev, dupNode]);
    setSelectedNodeId(dupId);
  };

  // Run Simulation Handler
  const handleRunSimulation = async () => {
    if (isSimulating || nodes.length === 0) return;

    setIsSimulating(true);
    setLogs([]);

    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      setActiveStepId(currentNode.id);

      // Set node state running
      setNodes(prev => prev.map(n => (n.id === currentNode.id ? { ...n, status: 'running' } : n)));

      const startTime = Date.now();

      // Add log
      setLogs(prev => [
        ...prev,
        {
          id: `log_${Date.now()}`,
          nodeId: currentNode.id,
          stepName: currentNode.label,
          status: 'running',
          message: `Executing ${currentNode.type} step logic...`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);

      // Simulate execution latency
      await new Promise(res => setTimeout(res, 1200));

      const durationMs = Date.now() - startTime;

      // Update log to success
      setLogs(prev =>
        prev.map(l =>
          l.nodeId === currentNode.id
            ? {
                ...l,
                status: 'success',
                message: `Completed successfully (${durationMs}ms)`,
                durationMs
              }
            : l
        )
      );

      // Set node status success
      setNodes(prev => prev.map(n => (n.id === currentNode.id ? { ...n, status: 'success' } : n)));
    }

    setIsSimulating(false);
    setActiveStepId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={24} color="#818cf8" />
            Visual Automation Builder
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No-code visual node canvas for AI-driven multi-channel lead automation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Play size={14} fill="#ffffff" />
            {isSimulating ? 'Simulating Workflow...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left / Central Canvas Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          {/* Visual Node Canvas */}
          <VisualCanvas
            nodes={nodes}
            connections={connections}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onNodesChange={setNodes}
            onConnectionsChange={setConnections}
            onRunSimulation={handleRunSimulation}
            isSimulating={isSimulating}
          />

          {/* Node Palette (Step Library) */}
          <NodePalette onAddNode={handleAddNode} />

          {/* Simulation Telemetry & Logs */}
          <WorkflowExecutionSimulator
            logs={logs}
            isSimulating={isSimulating}
            activeStepId={activeStepId}
            onClearLogs={() => setLogs([])}
          />
        </div>

        {/* Right Node Inspector Drawer */}
        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
          />
        )}
      </div>
    </div>
  );
}
