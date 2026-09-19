import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Map, Mic, Brain, TrendingUp,
  ChevronRight, RefreshCw, Calendar, Plus, ExternalLink,
  Clock, MapPin, Trash2, Navigation, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { agentsApi } from '../../lib/api';
import LiveAgentMap from '../../components/map/LiveAgentMap';
import AIPriorityFeed from '../../components/ai-feed/AIPriorityFeed';
import { reverseGeocode } from '../../lib/geocoder';

export default function CommandCenterPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [tick, setTick] = useState(0);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number; address?: string; isLiveGPS?: boolean } | null>(null);

  // Clean up any stale Red Fort / Old Delhi cached coordinates
  useEffect(() => {
    try {
      const savedLoc = localStorage.getItem('ground_os_agent_location');
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc);
        if (
          parsed.address?.includes('Old Delhi') ||
          parsed.address?.includes('Red Fort') ||
          (Math.abs(parsed.lat - 28.654) < 0.01 && Math.abs(parsed.lng - 77.237) < 0.01)
        ) {
          localStorage.removeItem('ground_os_agent_location');
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Fetch continuous live GPS location via watchPosition so CEO sees actual agent presence
  useEffect(() => {
    let watchId: number | null = null;
    if (navigator.geolocation) {
      const updatePosition = async (pos: GeolocationPosition) => {
        let lat = pos.coords.latitude;
        let lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        const address = await reverseGeocode(lat, lng);
        const loc = {
          lat,
          lng,
          accuracy,
          address: address || 'Unknown Location',
          isLiveGPS: true,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('ground_os_agent_location', JSON.stringify(loc));
        setLiveLocation(loc);
      };

      navigator.geolocation.getCurrentPosition(
        updatePosition,
        (err) => {
          console.warn('[GPS] Initial lookup failed:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        (err) => console.warn('[GPS] Watch position notice:', err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

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

  // Dynamic meeting notes from localStorage (purges old mock notes containing Deepgram)
  const meetingNotes = useMemo(() => {
    try {
      const saved = localStorage.getItem('meeting_notes_m1');
      if (saved) {
        if (saved.includes('Deepgram Nova-2') || saved.includes('Discussion conducted at Sreejal Jewellers with Uttam')) {
          localStorage.removeItem('meeting_notes_m1');
          return null;
        }
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [tick]);

  // Active destination shop/company tracking (strictly only when a visit is actively IN_PROGRESS)
  const activeDestination = useMemo(() => {
    try {
      const trackingRaw = localStorage.getItem('ground_os_active_visit_tracking');
      if (trackingRaw) {
        const t = JSON.parse(trackingRaw);
        // Only active if explicitly marked IN_PROGRESS and corresponds to an active visit
        if (t && (t.business || t.name) && t.status === 'IN_PROGRESS') {
          const matchingVisit = visits.find(v => v.id === t.visitId);
          if (matchingVisit && matchingVisit.status === 'in_progress') {
            return t;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    const inProgress = visits.find(v => v.status === 'in_progress');
    if (inProgress) {
      return {
        visitId: inProgress.id,
        name: inProgress.customerName || 'Client',
        business: inProgress.business || inProgress.customerName || 'Shop Destination',
        address: inProgress.location || 'Client Location',
        lat: inProgress.lat || 28.6139,
        lng: inProgress.lng || 77.2090,
        status: inProgress.status,
      };
    }
    return null;
  }, [visits, tick]);

  // Sole Field Agent: Nilesh Somnawane with real GPS coordinates
  useEffect(() => {
    let agentLoc: any = liveLocation;
    if (!agentLoc) {
      try {
        const savedLoc = localStorage.getItem('ground_os_agent_location');
        if (savedLoc) {
          const parsed = JSON.parse(savedLoc);
          agentLoc = parsed;
        }
      } catch (e) {
        // ignore
      }
    }

    const nilesh = {
      id: 'cmu6rgile000a5m6xjc38jqj6',
      name: 'Nilesh Somnawane',
      firstName: 'Nilesh',
      lastName: 'Somnawane',
      territory: agentLoc?.address || 'New Delhi, India',
      phone: '+91 98765 43210',
      email: 'nilesh@lifestylehomes.in',
      role: 'FIELD_SALES_EXECUTIVE',
      status: (activeDestination && activeDestination.status !== 'COMPLETED') ? 'IN_MEETING' : 'ONLINE',
      lat: agentLoc?.lat || 28.6139,
      lng: agentLoc?.lng || 77.2090,
      accuracy: agentLoc?.accuracy,
      isLiveGPS: !!agentLoc?.isLiveGPS,
      visitsToday: visits.length,
      meetingsToday: meetingNotes ? 1 : 0,
      score: meetingNotes?.qualityScore || 88,
    };

    setAgents([nilesh]);
  }, [tick, visits, meetingNotes, activeDestination, liveLocation]);

  const liveVisitsCount = useMemo(() => {
    return visits.filter((v: any) => v.status === 'in_progress').length;
  }, [visits]);

  const pipelineVal = useMemo(() => {
    if (!meetingNotes) return '₹0';
    const rawVal = meetingNotes.expectedDealValue || meetingNotes.dealValue;
    if (!rawVal) return '₹0';
    const cleaned = String(rawVal).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0) {
      return `₹${num.toLocaleString('en-IN')}`;
    }
    return String(rawVal).startsWith('₹') ? rawVal : `₹${rawVal}`;
  }, [meetingNotes]);

  const metrics = [
    { id: 'active-agents', label: 'Active Agents', value: '1', subtext: '1 online', color: 'var(--color-brand-light)', icon: Users },
    { id: 'live-visits', label: 'Live Visits', value: String(liveVisitsCount), subtext: visits.length > 0 ? `${visits.length} scheduled` : '0 scheduled', color: 'var(--color-success)', icon: Map },
    { id: 'meetings-today', label: 'Meetings Today', value: String(meetingNotes ? 1 : 0), subtext: meetingNotes ? '1 conducted' : '0 conducted', color: 'var(--color-ai-complete)', icon: Mic },
    { id: 'high-intent', label: 'High Intent Leads', value: String(meetingNotes?.qualityScore > 60 ? 1 : 0), subtext: 'Real-time detection', color: 'var(--color-error)', icon: Brain },
    { id: 'ai-followups', label: 'AI Follow-ups', value: String(meetingNotes?.nextAction ? 1 : 0), subtext: meetingNotes?.nextAction ? '1 pending' : '0 pending', color: 'var(--color-ai-processing)', icon: RefreshCw },
    { id: 'pipeline', label: 'Pipeline Value', value: pipelineVal, subtext: 'Current pipeline', color: 'var(--color-ai-recommend)', icon: TrendingUp },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%', paddingBottom: '48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Command Center
            </h1>
            {liveLocation?.isLiveGPS && (
              <span className="badge badge-success" style={{ gap: '5px', fontSize: '11px', padding: '3px 8px' }} title={`Live GPS: ${liveLocation.lat.toFixed(5)}, ${liveLocation.lng.toFixed(5)}`}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
                Agent GPS Live ({liveLocation.lat.toFixed(3)}, {liveLocation.lng.toFixed(3)})
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5, marginTop: '4px', marginBottom: 0 }}>
            CEO Live Field Intelligence · {liveLocation?.address || 'Locating Agent...'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-ghost"
            style={{ gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}
            onClick={() => {
              localStorage.removeItem('ground_os_agent_visits');
              localStorage.removeItem('ground_os_active_visit_tracking');
              localStorage.removeItem('meeting_notes_m1');
              localStorage.removeItem('meeting_transcript_m1');
              setTick(t => t + 1);
              toast.success('Clean slate! All demo visits and mock notes wiped.');
            }}
            title="Wipe demo data and start 100% clean"
          >
            <Trash2 size={13} />
            Clear Demo Data
          </button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', height: 420, maxHeight: 420, overflow: 'hidden' }}>
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

      {/* Appointments & Active Agent Section — 2 Columns matching Dashboard Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 'var(--space-5)',
        alignItems: 'start',
        marginTop: '8px',
      }}>
        {/* Left Column: Today's Appointments & Field Visits */}
        <div>
          <div className="section-header">
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--color-brand-light)" />
              Today's Appointments & Field Visits
            </span>
            <button
              className="btn btn-ghost"
              style={{ gap: '6px' }}
              onClick={() => navigate('/visits')}
              id="view-all-appointments-btn"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {visits.length === 0 ? (
            <div className="card" style={{ padding: '28px 20px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
              <Calendar size={32} color="var(--color-brand-light)" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem' }}>No Scheduled Appointments</h4>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                Scheduled client visits and appointments by Agent Nilesh will appear here.
              </p>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', gap: '6px' }}
                onClick={() => navigate('/visits')}
              >
                <Plus size={14} /> Schedule New Visit
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visits.map((v: any) => {
                const isCompleted = v.status === 'completed';
                const isInProgress = v.status === 'in_progress';
                const statusLabel = isCompleted ? 'Completed' : (isInProgress ? 'In Progress' : 'Scheduled');
                const statusBadgeClass = isCompleted ? 'badge-success' : (isInProgress ? 'badge-warning' : 'badge-brand');

                return (
                  <div
                    key={v.id}
                    className="card"
                    style={{
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: isInProgress
                        ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.08), rgba(244, 63, 94, 0.08))'
                        : 'var(--color-bg-surface)',
                      border: isInProgress
                        ? '1px solid rgba(99, 102, 241, 0.35)'
                        : '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: isInProgress ? 'rgba(99, 102, 241, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid ' + (isInProgress ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}>
                        🏪
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                            {v.business || v.customerName}
                          </span>
                          <span className={`badge ${statusBadgeClass}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {statusLabel}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                          <span>Client: <strong style={{ color: 'var(--color-text-primary)' }}>{v.customerName}</strong></span>
                          <span>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {v.time}
                          </span>
                          <span>·</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {v.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {isCompleted ? (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '6px 12px', gap: '5px' }}
                          onClick={() => navigate('/meetings/m1/report')}
                        >
                          Intel <ExternalLink size={12} />
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '6px 12px', gap: '5px', color: 'var(--color-brand-light)' }}
                          onClick={() => navigate('/visits')}
                        >
                          View Visit <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Sole Field Agent: Nilesh Somnawane */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {agents.map(agent => {
              const agentStatus = (activeDestination && activeDestination.status !== 'COMPLETED') ? 'IN_MEETING' : 'ONLINE';

              return (
                <div
                  key={agent.id}
                  className="card"
                  style={{ width: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 20px' }}
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
    </div>
  );
}
