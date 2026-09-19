import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, Mic, Brain, TrendingUp,
  ChevronRight, RefreshCw, Calendar, Plus
} from 'lucide-react';
import { agentsApi } from '../../lib/api';
import LiveAgentMap from '../../components/map/LiveAgentMap';
import AIPriorityFeed from '../../components/ai-feed/AIPriorityFeed';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  // Dynamic visits from localStorage
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
        if (t && (t.business || t.name)) return t;
      }
    } catch (e) {
      console.error(e);
    }
    const inProgress = visits.find(v => v.status === 'in_progress') || visits[0];
    if (inProgress) {
      return {
        name: inProgress.customerName || 'Client',
        business: inProgress.business || inProgress.customerName || 'Shop Destination',
        address: inProgress.location || 'Andheri West, Mumbai',
        lat: inProgress.lat || 19.136,
        lng: inProgress.lng || 72.828,
        status: inProgress.status,
      };
    }
    return null;
  }, [visits, tick]);

  // Try fetching live agents from API, fallback to organization's 1 agent
  useEffect(() => {
    agentsApi.list()
      .then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setAgents(res.data);
        } else {
          setAgents([]);
        }
      })
      .catch(() => {
        setAgents([]);
      });
  }, [tick]);

  const metrics = [
    { id: 'active-agents', label: 'Active Agents', value: String(agents.length || 1), subtext: agents.length > 0 ? `${agents.length} online` : '1 online', color: 'var(--color-brand-light)', icon: Users },
    { id: 'live-visits', label: 'Live Visits', value: String(visits.length), subtext: visits.length > 0 ? `${visits.length} scheduled` : '0 scheduled', color: 'var(--color-success)', icon: Map },
    { id: 'meetings-today', label: 'Meetings Today', value: String(meetingNotes ? 1 : 0), subtext: meetingNotes ? '1 conducted' : '0 conducted', color: 'var(--color-ai-complete)', icon: Mic },
    { id: 'high-intent', label: 'High Intent Leads', value: String(meetingNotes?.intentScore > 70 ? 1 : 0), subtext: 'Real-time detection', color: 'var(--color-error)', icon: Brain },
    { id: 'ai-followups', label: 'AI Follow-ups', value: String(meetingNotes?.actionItems?.length || 0), subtext: meetingNotes?.actionItems?.length ? `${meetingNotes.actionItems.length} pending` : '0 pending', color: 'var(--color-ai-processing)', icon: RefreshCw },
    { id: 'pipeline', label: 'Pipeline Value', value: '₹0', subtext: 'Current pipeline', color: 'var(--color-ai-recommend)', icon: TrendingUp },
  ];

  // Dynamic AI signals derived from actual user activity
  const feedItems = useMemo(() => {
    const items = [];
    if (meetingNotes) {
      items.push({
        id: 'meeting-signal-m1',
        type: 'HIGH_INTENT',
        priority: 'CRITICAL',
        title: `HIGH INTENT — ${meetingNotes.customerName || 'Rajesh Kumar'}`,
        body: meetingNotes.executiveSummary || (meetingNotes.dealIntel ? `${meetingNotes.dealIntel.configuration || '3BHK'} · ${meetingNotes.dealIntel.budget || '₹80L-₹1Cr'} · ${meetingNotes.dealIntel.timeline || 'Immediate'}` : 'Meeting summary and transcript recorded.'),
        badge: String(meetingNotes.intentScore || 86),
        action: 'View Report',
        actionRoute: '/meetings/m1/report',
        agent: meetingNotes.agentName || 'Nilesh Somnawane',
        time: 'Today',
        customerId: 'c1',
      });
    }
    return items;
  }, [meetingNotes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
            Command Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            CEO Live Field Intelligence · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
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
          padding: '12px 18px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.16), rgba(244, 63, 94, 0.16))',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 0 10px rgba(99, 102, 241, 0.7)'
            }}>
              🔔
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Agent Nilesh Somnawane is Active in Field</span>
                <span className="badge badge-brand" style={{ fontSize: '10px', padding: '1px 6px' }}>LIVE ON MAP</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                Visiting <strong>{activeDestination.business}</strong> ({activeDestination.address}) · Client: {activeDestination.name}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            onClick={() => navigate('/visits')}
          >
            Visit Intel
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
              Live Field Map & Destination Tracking
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
              AI Priority Feed
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'none', fontWeight: 500 }}>
              {feedItems.length} {feedItems.length === 1 ? 'signal' : 'signals'}
            </span>
          </div>
          <AIPriorityFeed items={feedItems} />
        </div>
      </div>

      {/* Agent Activity Strip */}
      <div>
        <div className="section-header">
          <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="var(--color-brand-light)" />
            Active Field Agents
          </span>
          {agents.length > 0 && (
            <button className="btn btn-ghost" style={{ gap: '6px' }} onClick={() => navigate('/agents/all')}>
              View All <ChevronRight size={14} />
            </button>
          )}
        </div>

        {agents.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '28px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              border: '1px dashed var(--color-border)',
              background: 'rgba(13, 20, 36, 0.4)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-brand-light)',
            }}>
              <Users size={20} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
              No Field Agents Active
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
              Field agents will appear here as they start their routes and check into visit locations.
            </p>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '6px 14px', marginTop: '4px', gap: '6px', display: 'inline-flex', alignItems: 'center' }}
              onClick={() => navigate('/visits')}
            >
              <Calendar size={14} />
              Plan a Visit
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            {agents.map(agent => {
              const firstName = agent.firstName || agent.name?.split(' ')[0] || 'Nilesh';
              const lastName = agent.lastName || agent.name?.split(' ').slice(1).join(' ') || 'Somnawane';
              const territory = agent.territory || 'Andheri West';
              const agentVisits = visits.length || agent.visitsToday || 0;
              const agentMeetings = (meetingNotes ? 1 : 0) || agent.meetingsToday || 0;
              const agentStatus = visits.some(v => v.status === 'in_progress') ? 'IN_MEETING' : (agent.status || 'ONLINE');

              return (
                <div
                  key={agent.id}
                  className="card"
                  style={{ minWidth: 220, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  id={`agent-card-${agent.id}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>
                      {firstName[0]}{lastName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {firstName} {lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{territory}</div>
                    </div>
                    <div className={`status-dot ${agentStatus.toLowerCase().replace('_', '-')}`} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{agentVisits}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Visits</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{agentMeetings}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Meetings</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-success)' }}>92</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Score</div>
                    </div>
                  </div>

                  <div className={`badge ${agentStatus === 'IN_MEETING' ? 'badge-warning' : agentStatus === 'EN_ROUTE' ? 'badge-brand' : 'badge-success'}`} style={{ alignSelf: 'flex-start' }}>
                    {agentStatus.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
