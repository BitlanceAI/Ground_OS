import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, Mic, Brain, TrendingUp,
  ChevronRight, RefreshCw, Calendar, Plus, ExternalLink
} from 'lucide-react';
import { agentsApi } from '../../lib/api';
import LiveAgentMap from '../../components/map/LiveAgentMap';
import AIPriorityFeed from '../../components/ai-feed/AIPriorityFeed';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  // Dynamic visits from localStorage (strictly agent-created visits only)
  const visits = useMemo(() => {
    try {
      const saved = localStorage.getItem('ground_os_agent_visits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [tick]);

  // Dynamic meeting notes from localStorage
  const meetingNotes = useMemo(() => {
    try {
      const saved = localStorage.getItem('meeting_notes_m1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [tick]);

  // Active destination shop/company tracking
  const activeDestination = useMemo(() => {
    try {
      const trackingRaw = localStorage.getItem('ground_os_active_visit_tracking');
      if (trackingRaw) {
        const t = JSON.parse(trackingRaw);
        if (t && (t.business || t.name)) {
          // Validate & correct Delhi / Dwarka coordinates if previously defaulted to Mumbai
          const addr = (t.address || '').toLowerCase();
          if ((addr.includes('delhi') || addr.includes('dwarka')) && t.lat < 25) {
            t.lat = 28.5921;
            t.lng = 77.0460;
          }
          return t;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const inProgress = visits.find(v => v.status === 'in_progress') || visits[0];
    if (inProgress) {
      const addr = (inProgress.location || '').toLowerCase();
      const isDelhi = addr.includes('delhi') || addr.includes('dwarka');
      return {
        name: inProgress.customerName || 'Client',
        business: inProgress.business || inProgress.customerName || 'Shop Destination',
        address: inProgress.location || 'Dwarka Delhi',
        lat: inProgress.lat || (isDelhi ? 28.5921 : 28.5921),
        lng: inProgress.lng || (isDelhi ? 77.0460 : 77.0460),
        status: inProgress.status,
      };
    }
    return null;
  }, [visits, tick]);

  // Ensure solely Nilesh Somnawane exists as the 1 active agent in Delhi
  useEffect(() => {
    let agentLoc: any = null;
    try {
      const savedLoc = localStorage.getItem('ground_os_agent_location');
      if (savedLoc) agentLoc = JSON.parse(savedLoc);
    } catch (e) {
      // ignore
    }

    const nilesh = {
      id: 'cmu6rgile000a5m6xjc38jqj6',
      name: 'Nilesh Somnawane',
      firstName: 'Nilesh',
      lastName: 'Somnawane',
      territory: 'Delhi NCR (Dwarka)',
      phone: '+91 98765 43210',
      email: 'nilesh@lifestylehomes.in',
      role: 'FIELD_SALES_EXECUTIVE',
      status: (activeDestination && activeDestination.status !== 'COMPLETED') ? 'IN_MEETING' : 'ONLINE',
      lat: agentLoc?.lat || 28.5921,
      lng: agentLoc?.lng || 77.0460,
      visitsToday: visits.length,
      meetingsToday: meetingNotes ? 1 : 0,
      score: meetingNotes?.qualityScore || 88,
    };

    setAgents([nilesh]);
  }, [tick, visits, meetingNotes, activeDestination]);

  const metrics = [
    { id: 'active-agents', label: 'Active Agents', value: '1', subtext: '1 online', color: 'var(--color-brand-light)', icon: Users },
    { id: 'live-visits', label: 'Live Visits', value: String(visits.length), subtext: visits.length > 0 ? `${visits.length} scheduled` : '0 scheduled', color: 'var(--color-success)', icon: Map },
    { id: 'meetings-today', label: 'Meetings Today', value: String(meetingNotes ? 1 : 0), subtext: meetingNotes ? '1 conducted' : '0 conducted', color: 'var(--color-ai-complete)', icon: Mic },
    { id: 'high-intent', label: 'High Intent Leads', value: String(meetingNotes?.qualityScore > 60 ? 1 : 0), subtext: 'Real-time detection', color: 'var(--color-error)', icon: Brain },
    { id: 'ai-followups', label: 'AI Follow-ups', value: String(meetingNotes?.nextAction ? 1 : 0), subtext: meetingNotes?.nextAction ? '1 pending' : '0 pending', color: 'var(--color-ai-processing)', icon: RefreshCw },
    { id: 'pipeline', label: 'Pipeline Value', value: '₹0', subtext: 'Current pipeline', color: 'var(--color-ai-recommend)', icon: TrendingUp },
  ];

  // Dynamic AI signals derived ONLY from actual client visits & meetings conducted by Nilesh
  const feedItems = useMemo(() => {
    const items = [];
    if (meetingNotes) {
      const client = meetingNotes.businessOwnerName || activeDestination?.name || 'Client';
      const shop = meetingNotes.businessName || activeDestination?.business || 'Business';
      const isLow = meetingNotes.intentLevel === 'LOW' || meetingNotes.qualityScore < 30;

      items.push({
        id: 'meeting-signal-m1',
        type: isLow ? 'FOLLOW_UP_RISK' : 'HIGH_INTENT',
        priority: 'CRITICAL',
        title: `${meetingNotes.outcome?.toUpperCase() || (isLow ? 'LOW INTENT' : 'HIGH INTENT')} — ${client} (${shop})`,
        body: meetingNotes.summary || 'Meeting summary and transcript recorded.',
        badge: `${meetingNotes.qualityScore || 78}/100`,
        action: 'View Summary',
        actionRoute: '/meetings/m1/report',
        agent: 'Nilesh Somnawane',
        time: 'Today',
        customerId: 'c1',
      });
    }
    return items;
  }, [meetingNotes, activeDestination]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
            Command Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            CEO Live Field Intelligence · Delhi NCR Hub · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          className="btn btn-ghost"
          style={{ gap: '6px' }}
          onClick={() => setTick(t => t + 1)}
          title="Refresh dashboard data"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* CEO Live Notification Alert Banner */}
      {activeDestination && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.16), rgba(244, 63, 94, 0.16))',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 0 12px rgba(99, 102, 241, 0.7)'
            }}>
              🔔
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Agent Nilesh Somnawane is Active in Field</span>
                <span className="badge badge-brand" style={{ fontSize: '10px', padding: '1px 6px' }}>LIVE ON MAP</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                Visiting <strong>{activeDestination.business}</strong> ({activeDestination.address}) · Client: <strong>{activeDestination.name}</strong>
              </div>
            </div>
          </div>
          {/* Admin sees summary of the meeting only */}
          <button
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '7px 16px', gap: '6px', fontWeight: 600 }}
            onClick={() => navigate('/meetings/m1/report')}
            title="View Meeting Summary"
          >
            Visit Intel <ExternalLink size={13} />
          </button>
        </div>
      )}

      {/* Executive Metrics — 6 cards */}
      <div className="grid-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="metric-card" id={`metric-${m.id}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="metric-label">{m.label}</span>
                <Icon size={16} color={m.color} />
              </div>
              <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, display: 'inline-block' }}></span>
                {m.subtext}
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
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={16} color="var(--color-brand-light)" />
              Live Field Map & Destination Tracking (Delhi NCR)
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { color: 'var(--color-agent-online)', label: 'Agent Online' },
                { color: '#f43f5e', label: 'Shop Destination' },
                { color: 'var(--color-agent-meeting)', label: 'In Meeting' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: color, boxShadow: `0 0 5px ${color}` }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <LiveAgentMap agents={agents} destinationPlace={activeDestination} />
        </div>

        {/* AI Priority Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={16} color="var(--color-brand-light)" />
              Live Meeting Intelligence
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'none', fontWeight: 500 }}>
              {feedItems.length} {feedItems.length === 1 ? 'signal' : 'signals'}
            </span>
          </div>

          {feedItems.length === 0 ? (
            <div className="card" style={{ padding: '32px 20px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
              <Brain size={36} color="var(--color-brand-light)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>No Meeting Intelligence Yet</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Only real meetings conducted by Agent Nilesh will appear here. No demo clients.
              </p>
            </div>
          ) : (
            <AIPriorityFeed items={feedItems} />
          )}
        </div>
      </div>

      {/* Sole Field Agent: Nilesh Somnawane */}
      <div>
        <div className="section-header">
          <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-brand-light)" />
            Field Sales Agent
          </span>
          <button className="btn btn-ghost" style={{ gap: '6px' }} onClick={() => navigate('/agents/agt-nilesh-01')}>
            Agent Portal <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {agents.map(agent => {
            const agentStatus = (activeDestination && activeDestination.status !== 'COMPLETED') ? 'IN_MEETING' : 'ONLINE';

            return (
              <div
                key={agent.id}
                className="card"
                style={{ maxWidth: 360, width: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 20px' }}
                onClick={() => navigate('/agents/agt-nilesh-01')}
                id={`agent-card-${agent.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.95rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                    boxShadow: '0 0 14px rgba(99, 102, 241, 0.4)'
                  }}>
                    NS
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                      Nilesh Somnawane
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Delhi NCR (Dwarka Hub)</div>
                  </div>
                  <div className={`status-dot ${agentStatus.toLowerCase().replace('_', '-')}`} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{visits.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Visits</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{meetingNotes ? 1 : 0}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Meetings</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-success)' }}>{agent.score}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Score</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className={`badge ${agentStatus === 'IN_MEETING' ? 'badge-warning' : 'badge-success'}`}>
                    {agentStatus.replace('_', ' ')}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-light)', fontWeight: 600 }}>
                    Open Portal →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
