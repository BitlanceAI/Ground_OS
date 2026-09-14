import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, Clock, TrendingUp, ChevronRight, Lightbulb } from 'lucide-react';
import { DEMO_AGENTS } from '../../lib/demo-data';

export default function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agent = DEMO_AGENTS.find(a => a.id === agentId) || DEMO_AGENTS[0];

  const qualityBreakdown = [
    { label: 'Requirement Discovery', score: 85 },
    { label: 'Customer Engagement', score: 80 },
    { label: 'Objection Handling', score: 65 },
    { label: 'Product Knowledge', score: 90 },
    { label: 'Closing Attempt', score: 70 },
    { label: 'Follow-up Clarity', score: 75 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card-branded">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)'
          }}>
            {agent.firstName[0]}{agent.lastName[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{agent.firstName} {agent.lastName}</h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <MapPin size={12} />
                {agent.territory}
              </div>
              <div className={`status-dot ${agent.status.toLowerCase().replace('_', '-')}`} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{agent.status.replace('_', ' ')}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', fontWeight: 900, color: agent.score >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {agent.score}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agent Score</div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px' }}>
          {[
            { label: 'Visits Today', value: agent.visitsToday, icon: '📍' },
            { label: 'Meetings', value: agent.meetingsToday, icon: '🎙' },
            { label: 'Qualified Leads', value: 3, icon: '⭐' },
            { label: 'Follow-ups Due', value: 2, icon: '📋' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        {/* Meeting Quality */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={16} color="var(--color-brand-light)" /> Meeting Quality Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {qualityBreakdown.map(({ label, score }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: score >= 80 ? 'var(--color-success)' : score >= 65 ? 'var(--color-warning)' : 'var(--color-error)' }}>{score}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: score >= 80 ? 'var(--color-success)' : score >= 65 ? 'var(--color-warning)' : 'var(--color-error)',
                    width: `${score}%`, transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Coaching */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={16} color="var(--color-ai-recommend)" /> AI Coaching Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { insight: 'Converts 34% better when budget is qualified within the first 5 minutes of meeting.', type: 'tip' },
              { insight: 'Objection handling score has improved 12 points this month — excellent progress.', type: 'positive' },
              { insight: 'Missing closing attempt in 3 of last 5 meetings. Recommend structured trial close technique.', type: 'action' },
            ].map((c, i) => (
              <div key={i} style={{
                padding: '12px', borderRadius: '8px',
                background: c.type === 'positive' ? 'rgba(16,185,129,0.08)' : c.type === 'action' ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${c.type === 'positive' ? 'rgba(16,185,129,0.2)' : c.type === 'action' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{c.insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Visits */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Today's Visits</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { customer: 'Rajesh Kumar', business: 'Rajesh Electronics', status: 'REPORT_READY', time: '10:41', score: 86 },
            { customer: 'Amit Patel', business: 'Patel Pharma', status: 'COMPLETED', time: '09:15', score: 54 },
            { customer: 'Neha Gupta', business: 'Gupta Furniture', status: 'MEETING_STARTED', time: '14:00', score: null },
            { customer: 'Suresh Shah', business: 'Shah Textiles', status: 'ASSIGNED', time: '16:00', score: null },
          ].map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => navigate(`/visits/v${i+1}`)}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', width: 36 }}>{v.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.customer}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{v.business}</div>
              </div>
              {v.score && <span className="badge badge-success">{v.score}</span>}
              <span className={`badge ${v.status === 'REPORT_READY' ? 'badge-brand' : v.status === 'MEETING_STARTED' ? 'badge-warning' : v.status === 'ASSIGNED' ? 'badge-neutral' : 'badge-success'}`}>
                {v.status.replace('_', ' ')}
              </span>
              <ChevronRight size={14} color="var(--color-text-muted)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
