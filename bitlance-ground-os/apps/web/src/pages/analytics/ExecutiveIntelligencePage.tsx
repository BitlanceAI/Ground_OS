import { BarChart3, TrendingUp, Brain, Users, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const FUNNEL_DATA = [
  { stage: 'Visits', count: 156, fill: '#6366f1' },
  { stage: 'Meetings', count: 112, fill: '#818cf8' },
  { stage: 'Qualified', count: 67, fill: '#a5b4fc' },
  { stage: 'Site Visits', count: 34, fill: '#c7d2fe' },
  { stage: 'Bookings', count: 12, fill: '#10b981' },
];

const WEEKLY_DATA = [
  { day: 'Mon', visits: 18, meetings: 14, leads: 8 },
  { day: 'Tue', visits: 22, meetings: 16, leads: 11 },
  { day: 'Wed', visits: 19, meetings: 13, leads: 7 },
  { day: 'Thu', visits: 28, meetings: 22, leads: 15 },
  { day: 'Fri', visits: 24, meetings: 18, leads: 12 },
  { day: 'Sat', visits: 31, meetings: 25, leads: 17 },
  { day: 'Sun', visits: 14, meetings: 10, leads: 6 },
];

const INTENT_DATA = [
  { name: 'HIGH', value: 7, color: '#f59e0b' },
  { name: 'MEDIUM', value: 18, color: '#6366f1' },
  { name: 'LOW', value: 31, color: '#374151' },
];

const CUSTOMTOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: 'rgba(13,20,36,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '10px 14px' }}>
      <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '6px' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontSize: '0.75rem', color: p.color }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function ExecutiveIntelligencePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={24} color="var(--color-brand-light)" />
          Executive Intelligence
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Real estate sales performance analytics · Lifestyle Homes · This Week
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid-4">
        {[
          { label: 'Total Pipeline', value: '₹4.2Cr', change: '+18%', color: 'var(--color-success)' },
          { label: 'Conversion Rate', value: '7.7%', change: '+2.1%', color: 'var(--color-brand-light)' },
          { label: 'AI Actions', value: '342', change: '+45%', color: 'var(--color-ai-processing)' },
          { label: 'Avg Meeting Score', value: '74', change: '+6pts', color: 'var(--color-ai-complete)' },
        ].map(k => (
          <div key={k.label} className="metric-card">
            <span className="metric-label">{k.label}</span>
            <div className="metric-value" style={{ color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-success)' }}>{k.change} vs last week</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Weekly Activity */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--color-brand-light)" /> Weekly Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_DATA} barGap={2}>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CUSTOMTOOLTIP />} />
              <Bar dataKey="visits" fill="#6366f1" name="Visits" radius={[3,3,0,0]} />
              <Bar dataKey="meetings" fill="#818cf8" name="Meetings" radius={[3,3,0,0]} />
              <Bar dataKey="leads" fill="#10b981" name="Leads" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="var(--color-success)" /> Conversion Funnel
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FUNNEL_DATA.map((f, i) => (
              <div key={f.stage}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{f.stage}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: f.fill }}>{f.count}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: f.fill,
                    width: `${(f.count / FUNNEL_DATA[0].count) * 100}%`,
                    boxShadow: `0 0 8px ${f.fill}44`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Intent Distribution */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={16} color="var(--color-brand-light)" /> Lead Intent Distribution
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={INTENT_DATA} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {INTENT_DATA.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {INTENT_DATA.map(i => (
                <div key={i.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: i.color }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{i.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: i.color }}>{i.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-ai-processing)" /> Agent Leaderboard
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'Vikram Joshi', territory: 'Juhu', score: 91, meetings: 28, qualified: 19, rank: 1 },
              { name: 'Aman Sharma', territory: 'Andheri West', score: 82, meetings: 23, qualified: 14, rank: 2 },
              { name: 'Priya Nair', territory: 'Goregaon East', score: 76, meetings: 19, qualified: 11, rank: 3 },
              { name: 'Sneha Kulkarni', territory: 'Versova', score: 68, meetings: 16, qualified: 8, rank: 4 },
            ].map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: a.rank === 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : a.rank === 2 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0
                }}>
                  {a.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{a.territory}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1rem', color: a.score >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>{a.score}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.9rem' }}>{a.qualified}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Leads</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Intelligence Highlights */}
      <div className="card-branded">
        <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={16} color="var(--color-brand-light)" />
          AI Intelligence Highlights · This Week
        </h3>
        <div className="grid-3">
          {[
            { label: 'Competitor Mentions', value: '23', detail: 'Prestige: 14, Lodha: 6, DLF: 3', color: 'var(--color-error)' },
            { label: 'Top Objection', value: 'PRICE', detail: '67% of meetings — avg delta: ₹6.2L', color: 'var(--color-warning)' },
            { label: 'Voice AI Success Rate', value: '78%', detail: '14 of 18 calls led to re-engagement', color: 'var(--color-success)' },
          ].map(h => (
            <div key={h.label} style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{h.label}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, color: h.color, marginBottom: '4px' }}>{h.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{h.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
