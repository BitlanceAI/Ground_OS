import { useState } from 'react';
import { Phone, PhoneCall, PhoneIncoming, CheckCircle2, Clock, TrendingUp, MessageSquare } from 'lucide-react';

const VOICE_CALLS = [
  {
    id: 'vc1', customer: 'Rajesh Kumar', phone: '+91 99887 76655',
    status: 'COMPLETED', trigger: 'CUSTOMER_INACTIVE_5MIN',
    duration: '3:07', sentiment: 'POSITIVE',
    outcome: 'SITE_VISIT_SCHEDULED', time: '11:25',
    summary: 'Customer confirmed site visit for tomorrow 10AM. Payment plan confirmed as feasible. Will discuss with spouse.',
  },
  {
    id: 'vc2', customer: 'Kavitha Nair', phone: '+91 98001 23456',
    status: 'IN_PROGRESS', trigger: 'FOLLOW_UP_OVERDUE',
    duration: '1:23', sentiment: 'NEUTRAL',
    outcome: null, time: '11:45',
    summary: null,
  },
  {
    id: 'vc3', customer: 'Suresh Mehta', phone: '+91 99112 33445',
    status: 'QUEUED', trigger: 'CUSTOMER_INACTIVE_5MIN',
    duration: null, sentiment: null,
    outcome: null, time: '12:00',
    summary: null,
  },
];

export default function VoiceAIPage() {
  const [selected, setSelected] = useState('vc1');
  const call = VOICE_CALLS.find(v => v.id === selected) || VOICE_CALLS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Phone size={24} color="var(--color-brand-light)" />
          Voice AI Center
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Automated Voice AI follow-ups triggered by customer inactivity and workflow rules
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: 'Calls Today', value: '18', color: 'var(--color-brand-light)', icon: Phone },
          { label: 'In Progress', value: '1', color: 'var(--color-ai-processing)', icon: PhoneCall },
          { label: 'Completed', value: '14', color: 'var(--color-success)', icon: CheckCircle2 },
          { label: 'Queued', value: '3', color: 'var(--color-text-muted)', icon: Clock },
        ].map(s => (
          <div key={s.label} className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="metric-label">{s.label}</span>
              <s.icon size={16} color={s.color} />
            </div>
            <div className="metric-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Call Queue */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Call Queue</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {VOICE_CALLS.map(v => (
              <div
                key={v.id}
                onClick={() => setSelected(v.id)}
                style={{
                  padding: '14px', borderRadius: '10px', cursor: 'pointer',
                  background: selected === v.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected === v.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.customer}</span>
                  <span className={`badge ${v.status === 'COMPLETED' ? 'badge-success' : v.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-neutral'}`}>
                    {v.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span>{v.phone}</span>
                  {v.duration && <span>⏱ {v.duration}</span>}
                  <span>📋 {v.trigger.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {call.status === 'COMPLETED' && call.summary ? (
            <>
              <div className="card-branded">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3>Call Details — {call.customer}</h3>
                  <span className="badge badge-success">COMPLETED</span>
                </div>
                <div className="grid-2" style={{ gap: '10px', marginBottom: '16px' }}>
                  {[
                    ['Duration', call.duration || '—'],
                    ['Sentiment', call.sentiment || '—'],
                    ['Outcome', (call.outcome || '—').replace('_', ' ')],
                    ['Trigger', call.trigger.replace('_', ' ')],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                      <div style={{ fontWeight: 600, marginTop: '2px', color: l === 'Sentiment' && v === 'POSITIVE' ? 'var(--color-success)' : 'var(--color-text-primary)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--color-success)" /> AI Call Summary
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {call.summary}
                </p>
              </div>

              <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(13,20,36,0.9))',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <TrendingUp size={16} color="var(--color-success)" />
                  <h3>Outcome: SITE_VISIT_SCHEDULED</h3>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                    <MessageSquare size={13} /> Send Confirmation
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Schedule Reminder
                  </button>
                </div>
              </div>
            </>
          ) : call.status === 'IN_PROGRESS' ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="recording-indicator" />
                <span style={{ color: '#ef4444', fontWeight: 600 }}>LIVE CALL</span>
              </div>
              <h3 style={{ marginBottom: '8px' }}>{call.customer}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{call.phone}</p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 800, marginTop: '16px', color: 'var(--color-text-primary)' }}>
                01:23
              </div>
              <div className="ai-state ai-state-processing" style={{ display: 'inline-flex', marginTop: '12px' }}>
                AI Transcribing
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <Clock size={40} color="var(--color-text-muted)" style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Queued</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                {call.customer} · {call.phone}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                Scheduled: {call.time}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
