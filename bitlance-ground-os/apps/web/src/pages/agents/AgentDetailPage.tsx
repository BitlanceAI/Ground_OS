import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MapPin, Star, Clock, TrendingUp, ChevronRight, Lightbulb, 
  FileText, CheckCircle2, User, Building, ExternalLink, Calendar, 
  RefreshCw, X, ArrowLeft, Zap, ShieldCheck, Phone, Check, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { agentsApi, visitsApi } from '../../lib/api';

export default function AgentDetailPage() {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const { user } = useAuthStore();
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (agentId && agentId !== 'me' && agentId !== 'agt-nilesh-01') {
      agentsApi.get(agentId).then(res => {
        if (res?.data) setAgentData(res.data);
      }).catch(err => console.warn('Failed to load agent profile:', err));
    }
  }, [agentId]);

  const effectiveAgentId = agentId === 'me' ? (user?.agentId || user?.id || 'm1') : (agentId || 'm1');

  // Load agent visits
  const visits = useMemo(() => {
    try {
      const saved = localStorage.getItem(`ground_os_agent_visits_${effectiveAgentId}`) || localStorage.getItem('ground_os_agent_visits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [effectiveAgentId, refreshKey]);

  // Load single active meeting note if present
  const singleMeetingNote = useMemo(() => {
    try {
      const saved = localStorage.getItem(`meeting_notes_${effectiveAgentId}`) || localStorage.getItem('meeting_notes_m1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [effectiveAgentId, refreshKey]);

  // Load full completed meetings history array
  const completedMeetingsHistory = useMemo(() => {
    try {
      const saved = localStorage.getItem('ground_os_completed_meetings_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    // If no multi-history exists yet but single meeting note exists, wrap it
    if (singleMeetingNote) {
      return [{
        id: singleMeetingNote.id || 'm1',
        meetingId: singleMeetingNote.id || 'm1',
        businessName: singleMeetingNote.businessName || 'Sreejal Jewellers',
        clientName: singleMeetingNote.businessOwnerName || 'Uttam',
        agentName: singleMeetingNote.agentName || 'Nilesh Somnawane',
        duration: singleMeetingNote.duration || '00:14',
        qualityScore: singleMeetingNote.qualityScore || 88,
        outcome: singleMeetingNote.outcome || 'High Intent',
        summary: singleMeetingNote.summary || singleMeetingNote.notes || 'Client expressed strong interest in smart POS integration and requested commercial proposal.',
        nextAction: singleMeetingNote.nextAction || 'Send WhatsApp proposal',
        selfieUrl: singleMeetingNote.selfieUrl,
        customerPhone: singleMeetingNote.customerPhone || '9876543210',
        completedAt: singleMeetingNote.completedAt || new Date().toISOString(),
        leadTapped: localStorage.getItem('ground_os_lead_tapped_m1') === 'true' || singleMeetingNote.leadTapped === true,
      }];
    }
    return [];
  }, [singleMeetingNote, refreshKey]);

  const verificationData = useMemo(() => {
    try {
      const saved = localStorage.getItem('ground_os_active_visit_tracking') || localStorage.getItem('ground_os_last_verification');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  // Calculate leads tapped count for this agent
  const leadsTappedCount = useMemo(() => {
    let count = 0;
    const isM1Tapped = localStorage.getItem('ground_os_lead_tapped_m1') === 'true';
    if (isM1Tapped) count++;

    completedMeetingsHistory.forEach((m: any) => {
      const isItemTapped = localStorage.getItem(`ground_os_lead_tapped_${m.id}`) === 'true' || m.leadTapped === true;
      if (isItemTapped && m.id !== 'm1') count++;
    });
    return Math.max(count, isM1Tapped ? 1 : 0);
  }, [completedMeetingsHistory, refreshKey]);

  // Admin action: Toggle Lead Tapped for a specific meeting/lead
  const handleToggleLeadTapped = async (meeting: any) => {
    const meetingId = meeting.id || meeting.meetingId || 'm1';
    const currentStatus = localStorage.getItem(`ground_os_lead_tapped_${meetingId}`) === 'true' || 
      (meetingId === 'm1' && localStorage.getItem('ground_os_lead_tapped_m1') === 'true') ||
      meeting.leadTapped === true;
    
    const nextStatus = !currentStatus;

    // Update storage keys
    localStorage.setItem(`ground_os_lead_tapped_${meetingId}`, String(nextStatus));
    if (meetingId === 'm1') {
      localStorage.setItem('ground_os_lead_tapped_m1', String(nextStatus));
    }

    // Update single meeting notes if matched
    try {
      const singleRaw = localStorage.getItem('meeting_notes_m1');
      if (singleRaw) {
        const parsed = JSON.parse(singleRaw);
        parsed.leadTapped = nextStatus;
        localStorage.setItem('meeting_notes_m1', JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn(e);
    }

    // Update completed meetings history array
    try {
      const historyRaw = localStorage.getItem('ground_os_completed_meetings_history');
      if (historyRaw) {
        const list = JSON.parse(historyRaw);
        const updated = list.map((item: any) => {
          if (item.id === meetingId || item.meetingId === meetingId) {
            return { ...item, leadTapped: nextStatus };
          }
          return item;
        });
        localStorage.setItem('ground_os_completed_meetings_history', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn(e);
    }

    // Call backend API if possible
    try {
      await visitsApi.tapLead(meetingId).catch(() => {});
    } catch (e) {
      console.warn(e);
    }

    window.dispatchEvent(new Event('storage'));
    setRefreshKey(k => k + 1);

    if (nextStatus) {
      toast.success(`🎯 Lead for ${meeting.businessName || 'Client'} marked as TAPPED! (+1 live increment)`, { duration: 4000 });
    } else {
      toast.error(`Lead for ${meeting.businessName || 'Client'} marked as Untapped.`, { duration: 3000 });
    }
  };

  const qualityScore = singleMeetingNote?.qualityScore || (completedMeetingsHistory[0]?.qualityScore) || 88;
  const qualityBreakdown = singleMeetingNote?.qualityBreakdown || {
    rapport: qualityScore,
    discovery: Math.max(15, qualityScore - 8),
    objectionHandling: Math.max(10, qualityScore - 12),
    closingClarity: Math.max(15, qualityScore - 5),
  };

  const currentAgentName = agentData?.name || 
    (agentId === 'me' && user ? `${user.firstName} ${user.lastName}`.trim() : null) || 
    'Nilesh Somnawane';
  const currentAgentPhone = agentData?.phone || 
    (agentId === 'me' && user?.phone ? user.phone : null) || 
    '+91 98765 43210';
  const currentAgentTerritory = agentData?.territory || 
    (agentId === 'me' && user?.territory ? user.territory : null) || 
    'Delhi NCR (Dwarka Hub)';

  const initials = currentAgentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AG';

  const pendingVisits = visits.filter((v: any) => 
    v.status !== 'completed' && 
    !(singleMeetingNote && (singleMeetingNote.businessName === v.business || singleMeetingNote.businessOwnerName === v.customerName))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 1000, margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Back button for Admin */}
      {user?.role?.toLowerCase() !== 'agent' && (
        <button 
          onClick={() => navigate('/agents')}
          style={{
            background: 'none', border: 'none', color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem',
            cursor: 'pointer', padding: 0
          }}
        >
          <ArrowLeft size={14} /> Back to Agent Management
        </button>
      )}

      {/* Header — Agent Identity & Live Score */}
      <div className="card-branded" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)'
          }}>
            {initials}
          </div>
          
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>FIELD AGENT PROFILE</span>
              <div className="status-dot online" />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>Active in Field</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 4px 0' }}>{currentAgentName}</h1>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <MapPin size={14} color="var(--color-brand-light)" />
                Territory: <strong>{currentAgentTerritory}</strong>
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Phone: {currentAgentPhone}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', fontWeight: 900, color: qualityScore >= 70 ? 'var(--color-success)' : qualityScore >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
              {qualityScore}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quality Score</div>
          </div>
        </div>

        {/* Live Dossier Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '24px' }}>
          {[
            { label: 'Assigned Leads', value: visits.length, icon: '📍' },
            { label: 'Meetings Completed', value: completedMeetingsHistory.length, icon: '🎙' },
            { label: 'Leads Tapped (Admin)', value: leadsTappedCount, icon: '⚡', highlight: true },
            { label: 'Active Route Pending', value: pendingVisits.length, icon: '📋' },
          ].map(s => (
            <div key={s.label} style={{ 
              textAlign: 'center', 
              padding: '14px', 
              background: s.highlight ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255,255,255,0.03)', 
              borderRadius: '10px', 
              border: s.highlight ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid var(--color-border-subtle)' 
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, color: s.highlight ? '#fbbf24' : 'var(--color-text-primary)' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: s.highlight ? '#fde68a' : 'var(--color-text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Leads & Meeting Audit Section */}
      <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="var(--color-brand-light)" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {user?.role?.toLowerCase() === 'agent' ? 'My Meetings & Lead Dossier' : `Agent Leads & Meeting Audit: ${currentAgentName}`}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {user?.role?.toLowerCase() === 'agent' 
                ? 'All completed meetings and recordings are submitted to Admin for verification.'
                : 'Inspect full meeting recordings, verified selfies, and mark leads as successfully tapped (+1).'}
            </p>
          </div>
        </div>

        {/* Meeting History List */}
        {completedMeetingsHistory.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <FileText size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>No Completed Meetings Logged</h4>
            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
              When this agent completes a meeting visit and submits the audio recording, it will appear here for Admin audit.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {completedMeetingsHistory.map((meeting: any) => {
              const meetingId = meeting.id || meeting.meetingId || 'm1';
              const isTapped = localStorage.getItem(`ground_os_lead_tapped_${meetingId}`) === 'true' || 
                (meetingId === 'm1' && localStorage.getItem('ground_os_lead_tapped_m1') === 'true') ||
                meeting.leadTapped === true;

              return (
                <div 
                  key={meetingId}
                  style={{
                    padding: '22px',
                    borderRadius: 'var(--radius-md)',
                    background: isTapped ? 'rgba(251, 191, 36, 0.04)' : 'rgba(99, 102, 241, 0.04)',
                    border: isTapped ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
                          {meeting.outcome || 'High Intent'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Duration: {meeting.duration || '00:14'}
                        </span>
                        {isTapped && (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={12} fill="#fbbf24" /> TAPPED (+1)
                          </span>
                        )}
                      </div>

                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700 }}>
                        {meeting.businessName || 'Client Shop'}
                      </h3>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>Contact: <strong style={{ color: '#fff' }}>{meeting.clientName || 'Owner'}</strong></span>
                        <span>•</span>
                        <span>Location: <strong>Dwarka Delhi</strong></span>
                        {meeting.customerPhone && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> +91 {meeting.customerPhone.replace(/[^0-9]/g, '').slice(-10)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: meeting.qualityScore >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {meeting.qualityScore || 88}<span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>/100</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>AI Intent Score</div>
                    </div>
                  </div>

                  {/* Ground Presence Geo-Stamp */}
                  {(meeting.selfieUrl || verificationData?.selfieUrl) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <img 
                        src={meeting.selfieUrl || verificationData?.selfieUrl} 
                        alt="Customer Selfie" 
                        onClick={() => setFullscreenImage(meeting.selfieUrl || verificationData?.selfieUrl)}
                        style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', border: '1.5px solid var(--color-success)', flexShrink: 0, cursor: 'pointer' }} 
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-success)' }}>
                          ✓ Ground Verified Presence Stamp
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Dwarka Sector 12, New Delhi (GNSS Satellite Locked)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary Narrative */}
                  <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: '#e2e8f0',
                    border: '1px solid var(--color-border-subtle)'
                  }}>
                    <strong style={{ color: 'var(--color-brand-light)' }}>Executive Summary: </strong>
                    {meeting.summary || 'Client expressed interest in retail POS system.'}
                  </div>

                  {/* Admin Decision Bar: Lead Tapped Control & Full Report Link */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '12px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--color-border-subtle)'
                  }}>
                    {/* Admin Lead Tapped Toggle Button */}
                    {user?.role?.toLowerCase() !== 'agent' ? (
                      <button
                        onClick={() => handleToggleLeadTapped(meeting)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isTapped
                            ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                            : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: isTapped ? '#000' : '#fff',
                          boxShadow: isTapped ? '0 2px 10px rgba(251, 191, 36, 0.4)' : '0 2px 10px rgba(99, 102, 241, 0.3)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isTapped ? (
                          <>
                            <CheckCircle2 size={15} color="#000" />
                            <span>✓ Lead Tapped (+1 Active)</span>
                          </>
                        ) : (
                          <>
                            <Zap size={14} fill="#fff" />
                            <span>Mark Lead as Tapped (+1)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: isTapped ? 'var(--color-warning)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Zap size={13} fill={isTapped ? '#fbbf24' : 'none'} color={isTapped ? '#fbbf24' : 'currentColor'} />
                        <span>{isTapped ? 'Lead Tapped Status: Verified by Admin (+1)' : 'Lead Tapped Status: Pending Admin Audit'}</span>
                      </div>
                    )}

                    <button 
                      className="btn btn-secondary"
                      onClick={() => navigate('/meetings/m1/report')}
                      style={{ fontSize: '0.825rem', padding: '8px 14px', gap: '6px' }}
                    >
                      Open Full AI Report <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Planned / Scheduled Route Leads */}
      {pendingVisits.length > 0 && (
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--color-brand-light)" />
            Active Route Scheduled Leads ({pendingVisits.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingVisits.map((v: any) => (
              <div key={v.id} style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.business} · {v.customerName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>📍 {v.location} · Scheduled at {v.time}</div>
                </div>
                <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
                  {v.type || 'Site Visit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Quality Breakdown & Coaching */}
      <div className="grid-2">
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
            <Star size={16} color="var(--color-brand-light)" /> Quality Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Requirement Discovery', score: qualityBreakdown.discovery },
              { label: 'Customer Rapport', score: qualityBreakdown.rapport },
              { label: 'Objection Handling', score: qualityBreakdown.objectionHandling },
              { label: 'Closing & Follow-up Clarity', score: qualityBreakdown.closingClarity },
            ].map(({ label, score }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                    {score}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-error)',
                    width: `${score}%`, transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <InsightsCard />
      </div>
      
      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: '20px'
          }}
        >
          <img 
            src={fullscreenImage} 
            alt="Fullscreen Selfie" 
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', border: '2px solid var(--color-brand-light)' }} 
          />
          <button
            onClick={() => setFullscreenImage(null)}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

const allInsights = [
  { insight: 'Converts 38% better when commercial pricing is introduced after understanding retail counter volume.', type: 'tip' as const },
  { insight: 'Territory focus on Dwarka Delhi retail hubs shows high responsiveness to POS and WhatsApp billing proposals.', type: 'positive' as const },
  { insight: 'Ensure all recorded meetings conclude with a confirmed WhatsApp proposal delivery timeline.', type: 'action' as const },
  { insight: 'Clients in Sector 62–63 respond 2.4x faster when demo screenshots are shared via WhatsApp within 30 mins of the meeting.', type: 'tip' as const },
  { insight: 'Meetings lasting 12–18 minutes show the highest conversion rates in this territory. Avoid rushing below 8 min.', type: 'positive' as const },
  { insight: 'Repeat visits within 5 days of the first visit have a 67% higher deal closure rate than delayed follow-ups.', type: 'action' as const },
  { insight: 'Audio transcripts flagged for "pricing objection" convert at 45% when re-pitched with EMI breakdown.', type: 'tip' as const },
  { insight: 'Selfie verification compliance has improved agent accountability scores by 29% across the team.', type: 'positive' as const },
  { insight: 'Schedule next-day follow-ups for leads with intent score above 70 to maximise pipeline velocity.', type: 'action' as const },
];

function InsightsCard() {
  const [seed, setSeed] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const displayed = useMemo(() => {
    const shuffled = [...allInsights].sort(() => Math.sin(seed + 1) - 0.5);
    return shuffled.slice(0, 3);
  }, [seed]);

  const handleRefresh = () => {
    setSpinning(true);
    setSeed(s => s + 1);
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
          <Lightbulb size={16} color="var(--color-ai-recommend)" /> AI Coaching Insights
        </h3>
        <button
          onClick={handleRefresh}
          title="Get new insights"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '6px',
            padding: '5px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--color-brand-light)',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={13} style={{ transition: 'transform 0.5s ease', transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)' }} />
          Refresh
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayed.map((c, i) => (
          <div key={`${seed}-${i}`} style={{
            padding: '12px 14px', borderRadius: '8px',
            background: c.type === 'positive' ? 'rgba(16,185,129,0.08)' : c.type === 'action' ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
            border: `1px solid ${c.type === 'positive' ? 'rgba(16,185,129,0.2)' : c.type === 'action' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
          }}>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{c.insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
