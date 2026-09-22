import { useState, useEffect } from 'react';
import { GitBranch, Zap, Phone, MessageSquare, Brain, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../lib/api';

const ICONS: Record<string, any> = {
  TRIGGER: Clock,
  CONDITION: CheckCircle2,
  AI: Brain,
  VOICE: Phone,
  CRM_UPDATE: CheckCircle2,
  ANALYTICS: Zap,
  MESSAGE: MessageSquare,
  DELAY: Clock
};

export default function AutomationBuilderPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        const res = await api.workflows.list();
        if (res.success) {
          setWorkflows(res.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWorkflows();
  }, []);

  const featuredWf = workflows[0];
  const otherWorkflows = workflows.slice(1);

  // Use a fallback visual layout if no nodes are provided with x/y
  const renderNodes = featuredWf?.nodes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={24} color="var(--color-brand-light)" />
            Automation Builder
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No-code visual workflow orchestration for AI-driven sales automation
          </p>
        </div>
        <button className="btn btn-primary">
          <Zap size={14} /> Create Workflow
        </button>
      </div>

      {/* Featured Workflow Canvas */}
      {featuredWf && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3>{featuredWf.name}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                {featuredWf.description}
              </p>
            </div>
            <div className={`badge ${featuredWf.active ? 'badge-success' : 'badge-neutral'}`}>
              {featuredWf.active ? 'ACTIVE' : 'PAUSED'}
            </div>
          </div>

          {/* Visual Canvas */}
          <div style={{ position: 'relative', height: 280, background: 'rgba(255,255,255,0.02)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
            {/* Grid pattern */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />

            {/* Nodes */}
            {renderNodes.map((node: any, index: number) => {
              const Icon = ICONS[node.type] || Zap;
              // Provide default positions if not set
              const posX = node.x || 20 + (index * 200);
              const posY = node.y || 50;
              const color = node.color || '#6366f1';

              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: `${posX}px`,
                    top: `${posY}px`,
                    width: 140,
                    background: 'var(--color-bg-surface)',
                    border: `1.5px solid ${color}44`,
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'grab',
                    boxShadow: `0 0 12px ${color}22`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '6px',
                      background: `${color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={12} color={color} />
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {node.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {node.label}
                  </div>
                </div>
              );
            })}

            {/* Arrows — simplified generic line based on map index */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {renderNodes.map((node: any, i: number) => {
                if (i === renderNodes.length - 1) return null;
                const nextNode = renderNodes[i + 1];
                const x1 = (node.x || 20 + (i * 200)) + 140;
                const y1 = (node.y || 50) + 16;
                const x2 = (nextNode.x || 20 + ((i + 1) * 200));
                const y2 = (nextNode.y || 50) + 16;
                return (
                  <path key={i} d={`M ${x1},${y1} L ${x2},${y2}`} stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
                );
              })}
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(99,102,241,0.5)" />
                </marker>
              </defs>
            </svg>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <span>Triggered: {featuredWf.triggersCount} times today</span>
            <span>Success rate: {featuredWf.conversionRate || 94}%</span>
          </div>
        </div>
      )}

      {/* Other Workflows */}
      {otherWorkflows.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '14px' }}>All Workflows</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {otherWorkflows.map((w: any) => (
              <div key={w.name} className="card" style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <GitBranch size={16} color="var(--color-brand-light)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{w.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      Triggered: {w.triggersCount || 0}x today
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className={`badge ${w.active ? 'badge-success' : 'badge-neutral'}`}>{w.active ? 'ACTIVE' : 'PAUSED'}</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {loading && <p>Loading workflows...</p>}
      {!loading && workflows.length === 0 && <p>No workflows found.</p>}
    </div>
  );
}
