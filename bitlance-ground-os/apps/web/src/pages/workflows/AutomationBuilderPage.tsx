import { GitBranch, Zap, Phone, MessageSquare, Brain, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const WORKFLOW_NODES = [
  { id: 'n1', type: 'TRIGGER', label: 'Customer Inactive 5min', x: 20, y: 50, color: '#f59e0b', icon: Clock },
  { id: 'n2', type: 'CONDITION', label: 'Eligibility Check', x: 220, y: 50, color: '#6366f1', icon: CheckCircle2 },
  { id: 'n3', type: 'AI', label: 'Inject Context', x: 420, y: 50, color: '#818cf8', icon: Brain },
  { id: 'n4', type: 'VOICE', label: 'Voice AI Call', x: 620, y: 50, color: '#22d3ee', icon: Phone },
  { id: 'n5', type: 'CRM_UPDATE', label: 'Update CRM', x: 820, y: 50, color: '#10b981', icon: CheckCircle2 },
  { id: 'n6', type: 'ANALYTICS', label: 'Log Outcome', x: 620, y: 200, color: '#64748b', icon: Zap },
];

const OTHER_WORKFLOWS = [
  { name: 'Meeting → AI Report → CEO Notify', status: 'ACTIVE', triggers: 23, lastRun: '11:06' },
  { name: 'Site Visit → Reminder Sequence', status: 'ACTIVE', triggers: 8, lastRun: '10:30' },
  { name: 'High Intent → Fast Track Alert', status: 'ACTIVE', triggers: 7, lastRun: '11:07' },
  { name: 'Lost Lead → Re-engagement', status: 'PAUSED', triggers: 2, lastRun: '08:00' },
];

export default function AutomationBuilderPage() {
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
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3>WhatsApp Inactivity → Voice AI</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
              When customer is inactive for 5 minutes, check eligibility, inject context, trigger Voice AI call
            </p>
          </div>
          <div className="badge badge-success">ACTIVE</div>
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
          {WORKFLOW_NODES.map(node => {
            const Icon = node.icon;
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: 140,
                  background: 'var(--color-bg-surface)',
                  border: `1.5px solid ${node.color}44`,
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'grab',
                  boxShadow: `0 0 12px ${node.color}22`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '6px',
                    background: `${node.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={12} color={node.color} />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: node.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {node.type}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {node.label}
                </div>
              </div>
            );
          })}

          {/* Arrows — simplified SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {/* n1→n2 */}
            <path d="M 160,66 L 220,66" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)" />
            {/* n2→n3 */}
            <path d="M 360,66 L 420,66" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" fill="none" />
            {/* n3→n4 */}
            <path d="M 560,66 L 620,66" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" fill="none" />
            {/* n4→n5 */}
            <path d="M 760,66 L 820,66" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" fill="none" />
            {/* n2→n6 (fail) */}
            <path d="M 290,116 L 290,216 L 620,216" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="5,3" />
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="rgba(99,102,241,0.5)" />
              </marker>
            </defs>
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
          <span>Triggered: 18 times today</span>
          <span>Success rate: 94%</span>
          <span>Avg call duration: 2:47</span>
          <span>Site visits booked: 4</span>
        </div>
      </div>

      {/* Other Workflows */}
      <div>
        <h3 style={{ marginBottom: '14px' }}>All Workflows</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {OTHER_WORKFLOWS.map(w => (
            <div key={w.name} className="card" style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GitBranch size={16} color="var(--color-brand-light)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{w.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Triggered: {w.triggers}x today · Last: {w.lastRun}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className={`badge ${w.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>{w.status}</span>
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
