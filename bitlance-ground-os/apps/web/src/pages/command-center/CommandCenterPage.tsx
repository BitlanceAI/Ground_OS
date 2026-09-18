import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, Mic, Brain, AlertTriangle, TrendingUp,
  ChevronRight, Activity, Zap, RefreshCw
} from 'lucide-react';
import { DEMO_METRICS, DEMO_AGENTS, DEMO_AI_FEED } from '../../lib/demo-data';
import LiveAgentMap from '../../components/map/LiveAgentMap';
import AIPriorityFeed from '../../components/ai-feed/AIPriorityFeed';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
            Command Center
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Live operations — Lifestyle Homes · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button className="btn btn-ghost" style={{ gap: '6px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} />
          Live
        </button>
      </div>

      {/* Executive Metrics — 6 cards */}
      <div className="grid-6">
        {DEMO_METRICS.map((m) => {
          const Icon = m.icon;
          return (
          <div key={m.id} className="metric-card" id={`metric-${m.id}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="metric-label">{m.label}</span>
              <Icon size={16} color={m.color} />
            </div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: m.change > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              <TrendingUp size={10} />
              {m.change > 0 ? '+' : ''}{m.change}% vs yesterday
            </div>
          </div>
          );
        })}
      </div>

      {/* Main content — Map + Feed */}
      <div className="dashboard-layout">

        {/* Live Agent Map — Hero Surface */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={16} color="var(--color-brand-light)" />
              Live Field Map
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { color: 'var(--color-agent-online)', label: 'Online' },
                { color: 'var(--color-agent-en-route)', label: 'En Route' },
                { color: 'var(--color-agent-meeting)', label: 'Meeting' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <LiveAgentMap agents={DEMO_AGENTS} />
        </div>

        {/* AI Priority Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={16} color="var(--color-brand-light)" />
              AI Priority Feed
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{DEMO_AI_FEED.length} signals</span>
          </div>
          <AIPriorityFeed items={DEMO_AI_FEED} />
        </div>
      </div>

      {/* Agent Activity Strip */}
      <div>
        <div className="section-header">
          <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-brand-light)" />
            Active Field Agents
          </span>
          <button className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: '4px' }} onClick={() => navigate('/agents/all')}>
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {DEMO_AGENTS.map(agent => (
            <div
              key={agent.id}
              className="card"
              style={{ minWidth: 200, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
              onClick={() => navigate(`/agents/${agent.id}`)}
              id={`agent-card-${agent.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0
                }}>
                  {agent.firstName[0]}{agent.lastName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.firstName} {agent.lastName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{agent.territory}</div>
                </div>
                <div className={`status-dot ${agent.status.toLowerCase().replace('_', '-')}`} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{agent.visitsToday}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Visits</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{agent.meetingsToday}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Meetings</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: agent.score >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>{agent.score}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Score</div>
                </div>
              </div>

              <div className={`badge ${agent.status === 'IN_MEETING' ? 'badge-warning' : agent.status === 'EN_ROUTE' ? 'badge-brand' : 'badge-success'}`} style={{ alignSelf: 'flex-start' }}>
                {agent.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
