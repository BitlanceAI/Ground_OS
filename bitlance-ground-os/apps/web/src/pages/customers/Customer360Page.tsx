import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronRight, Clock, Phone, MessageSquare, Mic } from 'lucide-react';
import { DEMO_RAJESH_TIMELINE } from '../../lib/demo-data';

const TIMELINE_ICONS: Record<string, string> = {
  WHATSAPP_ENQUIRY: '💬',
  AI_QUALIFICATION: '🤖',
  AGENT_ARRIVED: '📍',
  MEETING_STARTED: '🎙',
  MEETING_COMPLETED: '✅',
  AI_ANALYSIS: '🧠',
  LEAD_SCORE_UPDATED: '⭐',
  CEO_NOTIFIED: '📱',
  CREATIVE_GENERATED: '🎨',
  CREATIVE_SENT: '📤',
  CONVERSATION_INACTIVE: '⏰',
  VOICE_AI_TRIGGERED: '📞',
  FOLLOW_UP_SCHEDULED: '📋',
};

export default function Customer360Page() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      {/* Left column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Customer Header */}
        <div className="card-branded">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', fontWeight: 800, color: '#fff', flexShrink: 0
            }}>RK</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.4rem', marginBottom: '2px' }}>Rajesh Kumar</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Rajesh Electronics · Shop 14, Andheri West</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span className="badge badge-error">86 · HIGH</span>
                <span className="badge badge-brand">3BHK</span>
                <span className="badge badge-success">₹80L–₹1Cr</span>
                <span className="badge badge-info">SITE VISIT</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '3rem', fontWeight: 900, color: 'var(--color-warning)', lineHeight: 1 }}>86</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Lead Score</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px' }}>
            {[
              { label: 'WhatsApp', icon: '💬', action: () => navigate('/whatsapp') },
              { label: 'Call', icon: '📞', action: () => navigate('/voice') },
              { label: 'Meeting', icon: '🎙', action: () => navigate('/meetings/m1') },
              { label: 'Creative', icon: '🎨', action: () => navigate('/creatives') },
            ].map(a => (
              <button key={a.label} className="btn btn-secondary" style={{ justifyContent: 'center', flexDirection: 'column', gap: '4px', padding: '10px' }}
                onClick={a.action}>
                <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                <span style={{ fontSize: '0.72rem' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="card">
          <h3 style={{ marginBottom: '14px' }}>Captured Requirements</h3>
          <div className="grid-2" style={{ gap: '12px' }}>
            {[
              ['Configuration', '3BHK'],
              ['Budget', '₹80L – ₹1Cr'],
              ['Purpose', 'Self-use'],
              ['Location', 'Andheri West'],
              ['Timeline', '3–6 months'],
              ['Family Size', '4 members'],
              ['Payment', 'Construction-linked'],
              ['Schools Needed', 'Yes'],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active objections */}
        <div className="card">
          <h3 style={{ marginBottom: '12px' }}>Active Objections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { type: 'PRICE', desc: 'Prestige offering 3BHK at ₹72L in Malad — ₹8L cheaper. Critical blocker.', severity: 'HIGH', resolved: false },
              { type: 'DECISION', desc: 'Needs spouse consultation before final commitment.', severity: 'MEDIUM', resolved: false },
            ].map(o => (
              <div key={o.type} style={{
                padding: '12px', borderRadius: '8px',
                background: o.severity === 'HIGH' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                border: `1px solid ${o.severity === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className={`badge ${o.severity === 'HIGH' ? 'badge-error' : 'badge-warning'}`}>{o.type} · {o.severity}</span>
                  {!o.resolved && <span className="badge badge-neutral">OPEN</span>}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column — Timeline */}
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: '0' }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--color-brand-light)" />
          Journey Timeline
          <span className="badge badge-brand" style={{ marginLeft: '4px' }}>{DEMO_RAJESH_TIMELINE.length}</span>
        </h3>

        <div className="timeline" style={{ overflowY: 'auto', flex: 1 }}>
          {DEMO_RAJESH_TIMELINE.map((event) => (
            <div key={event.id} className="timeline-item">
              <div className={`timeline-dot ${event.isAiEvent ? 'ai' : 'event'}`} style={{ fontSize: '0.75rem' }}>
                <span>{TIMELINE_ICONS[event.type] || '•'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {event.title}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                    {event.time}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '2px' }}>
                  {event.description}
                </p>
                {(event as any).metadata && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    {Object.entries((event as any).metadata).map(([k, v]) => (
                      <span key={k} className="badge badge-brand" style={{ fontSize: '0.65rem' }}>
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
                {event.isAiEvent && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-brand-light)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                    🤖 AI Action
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
