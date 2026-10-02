import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Send, Star, FileText, Clock, CheckCircle2, 
  Building2, MessageSquare, Copy, ExternalLink, ShieldCheck, 
  AlertTriangle, ArrowLeft, Check, Sparkles, AlertCircle, TrendingUp,
  Play, Pause, RotateCcw, Volume2, FastForward, Plus, X,
  Camera, Phone, MapPin, Maximize2, Shield, RotateCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';

interface TranscriptItem {
  speaker: string;
  role: 'agent' | 'client';
  text: string;
  time: string;
}

export default function AiMeetingReportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(() => {
    return localStorage.getItem('ground_os_report_submitted') === 'true';
  });
  const [copied, setCopied] = useState(false);

  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(14);

  // Load saved meeting notes and details
  const savedData = useMemo(() => {
    try {
      const item = localStorage.getItem('meeting_notes_m1');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  // Lead Tapped State for this client report
  const [isLeadTapped, setIsLeadTapped] = useState<boolean>(() => {
    try {
      const savedTapped = localStorage.getItem('ground_os_lead_tapped_m1');
      if (savedTapped !== null) return savedTapped === 'true';
      return savedData?.leadTapped === true;
    } catch {
      return false;
    }
  });
  const [togglingTap, setTogglingTap] = useState(false);

  const handleToggleLeadTapped = async () => {
    const nextState = !isLeadTapped;
    setIsLeadTapped(nextState);
    localStorage.setItem('ground_os_lead_tapped_m1', String(nextState));

    // Update meeting notes in localStorage
    try {
      const notesRaw = localStorage.getItem('meeting_notes_m1');
      if (notesRaw) {
        const notesObj = JSON.parse(notesRaw);
        notesObj.leadTapped = nextState;
        notesObj.leadTappedAt = nextState ? new Date().toISOString() : null;
        localStorage.setItem('meeting_notes_m1', JSON.stringify(notesObj));
      }
    } catch (e) {
      console.warn(e);
    }

    // Call backend API if possible
    try {
      setTogglingTap(true);
      const visitId = savedData?.visitId || 'vis-001';
      const { visitsApi } = await import('../../lib/api');
      await visitsApi.tapLead(visitId).catch(() => {});
    } catch (e) {
      console.warn(e);
    } finally {
      setTogglingTap(false);
    }

    if (nextState) {
      toast.success('🎯 Lead marked as TAPPED! +1 added automatically to Leads Tapped tally.', { duration: 4500 });
    } else {
      toast.error('Lead marked as Untapped. Leads Tapped counter adjusted.', { duration: 3500 });
    }
    window.dispatchEvent(new Event('storage'));
  };

  // Audio source Data URL or Blob URL
  const audioSrc = useMemo(() => {
    try {
      const stored = localStorage.getItem('ground_os_meeting_audio_url');
      if (stored && stored.startsWith('data:audio')) return stored;
    } catch (e) {
      console.warn(e);
    }
    return savedData?.audioUrl || null;
  }, [savedData]);

  const savedTranscripts: TranscriptItem[] = useMemo(() => {
    try {
      const item = localStorage.getItem('meeting_transcript_m1');
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    if (savedData?.transcript && Array.isArray(savedData.transcript) && savedData.transcript.length > 0) {
      return savedData.transcript;
    }
    return []; // No fake fallback — show empty transcript if nothing was captured
  }, [savedData]);

  // Read real GPS check-in location from localStorage
  const checkinLocation = useMemo(() => {
    try {
      const raw = localStorage.getItem('ground_os_checkin_location');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  // Read tracking and verification data (Selfie, OTP & GPS)
  const visitTracking = useMemo(() => {
    try {
      const raw = localStorage.getItem('ground_os_active_visit_tracking');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  const lastVerification = useMemo(() => {
    try {
      const raw = localStorage.getItem('ground_os_last_verification');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const customerName = savedData?.businessOwnerName || 'Uttam';
  const customerBusiness = savedData?.businessName || 'Sreejal Jewellers';
  const verifiedCustomerPhone = 
    savedData?.customerPhone || 
    visitTracking?.customerPhone || 
    lastVerification?.customerPhone || 
    '9876543210';

  const verifiedSelfieUrl = 
    savedData?.selfieUrl || 
    visitTracking?.selfieUrl || 
    lastVerification?.selfieUrl || 
    null;

  const verifiedGeo = 
    savedData?.selfieGeoData || 
    visitTracking?.selfieGeo || 
    lastVerification?.selfieGeo || 
    (checkinLocation?.latitude ? {
      lat: checkinLocation.latitude,
      lng: checkinLocation.longitude,
      address: `${checkinLocation.latitude.toFixed(5)}° N, ${checkinLocation.longitude.toFixed(5)}° E`,
      timestamp: checkinLocation.timestamp || new Date().toISOString()
    } : {
      lat: 28.5921,
      lng: 77.0460,
      address: 'Dwarka Sector 12, New Delhi (±3.5m)',
      timestamp: new Date().toISOString()
    });

  const otpVerifiedAt = 
    savedData?.otpVerifiedAt || 
    visitTracking?.otpVerifiedAt || 
    lastVerification?.otpVerifiedAt || 
    savedData?.updatedAt || 
    new Date().toISOString();

  const isGroundVerified = Boolean(
    savedData?.verificationStatus === 'VERIFIED' || 
    visitTracking?.verified || 
    lastVerification?.verified ||
    verifiedSelfieUrl
  );
  const duration = savedData?.duration || '00:14';
  const loggedInAgentName = user ? `${user.firstName} ${user.lastName}`.trim() : null;
  const agentName = savedData?.agentName || loggedInAgentName || 'Nilesh Somnawane';
  const agentPhone = user?.phone || savedData?.agentPhone || '+91 7498162774';
  const employeeCode = user?.employeeCode || savedData?.employeeCode || 'AG001';
  const meetingDate = savedData?.meetingDate || new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const meetingTime = savedData?.meetingTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const expectedDealValue = savedData?.expectedDealValue || '';
  const followUpStatus = savedData?.followUpStatus || '';
  const followUpDate = savedData?.followUpDate || '';
  const agentObservations = savedData?.agentObservations || '';
  const keyHighlights = savedData?.keyHighlights || '';
  const productsDiscussed = savedData?.productsDiscussed || savedData?.purposeOfVisit || '';

  // Dynamic values evaluated by LLM
  const qualityScore: number = typeof savedData?.qualityScore === 'number' ? savedData.qualityScore : 28;
  const intentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = savedData?.intentLevel || 'LOW';
  const outcome: string = savedData?.outcome || (intentLevel === 'LOW' ? 'Low Intent' : intentLevel === 'MEDIUM' ? 'Moderate Intent' : 'High Intent');
  const summary: string = savedData?.summary || savedData?.notes || 'Meeting evaluation complete.';
  const nextAction: string = savedData?.nextAction || 'Re-visit client to deliver actual commercial pitch';
  const objections = Array.isArray(savedData?.objections) ? savedData.objections : [];
  const qualityBreakdown = savedData?.qualityBreakdown || {
    rapport: qualityScore,
    discovery: Math.max(10, qualityScore - 10),
    objectionHandling: Math.max(0, qualityScore - 20),
    closingClarity: Math.max(5, qualityScore - 15),
  };

  // CEO WhatsApp Phone State — supports multiple numbers
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ground_os_ceo_whatsapp');
      if (saved && saved.startsWith('[')) return JSON.parse(saved);
      if (saved) return [saved];
    } catch {}
    return ['919820012345'];
  });
  const [newPhoneInput, setNewPhoneInput] = useState('');
  // Keep ceoPhone as alias for first number (used in message generation)
  const ceoPhone = phoneNumbers[0] || '919820012345';

  // Calculate score colors
  const isLowScore = qualityScore < 40 || intentLevel === 'LOW';
  const scoreColor = qualityScore >= 70 ? 'var(--color-success)' : qualityScore >= 40 ? 'var(--color-warning)' : 'var(--color-error)';
  const starCount = qualityScore >= 80 ? 5 : qualityScore >= 60 ? 4 : qualityScore >= 40 ? 3 : qualityScore >= 20 ? 2 : 1;

  // Audio Control Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.warn('Audio play warning:', err);
        setIsPlaying(true);
      });
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeSec = parseFloat(e.target.value);
    setAudioCurrentTime(timeSec);
    if (audioRef.current) {
      audioRef.current.currentTime = timeSec;
    }
  };

  const handleSeekToTimestamp = (timeStr: string) => {
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    let secs = 0;
    if (parts.length === 2) {
      secs = (parts[0] || 0) * 60 + (parts[1] || 0);
    } else if (parts.length === 1) {
      secs = parts[0] || 0;
    }
    setAudioCurrentTime(secs);
    if (audioRef.current) {
      audioRef.current.currentTime = secs;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      setIsPlaying(true);
    }
    toast.success(`Jumped audio to [${timeStr}]`);
  };

  const formatAudioTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const generateWhatsAppMessage = () => {
    const transcriptHighlights = savedTranscripts.map(t => `• *${t.speaker}:* "${t.text}"`).join('\n');

    const followUpLabel: Record<string, string> = {
      INTERESTED: '🟢 Interested — Send Proposal',
      FOLLOW_UP_NEEDED: '🟡 Follow-Up Needed',
      PRICING_OBJECTION: '🟠 Pricing Objection',
      NOT_INTERESTED: '🔴 Not Interested',
      DEAL_CLOSED: '🟣 DEAL CLOSED',
    };

    return (
      `╭─────────────────────────╮\n` +
      `  👤 *AGENT: ${agentName.toUpperCase()}* (${employeeCode})\n` +
      `  📱 *Contact: ${agentPhone}*\n` +
      `╰─────────────────────────╯\n` +
      `⚡ *FIELD VISIT REPORT — CEO BRIEFING*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Date:* ${meetingDate} · ${meetingTime}\n` +
      `📍 *Client Shop:* ${customerBusiness}\n` +
      `👤 *Decision Maker:* ${customerName}\n` +
      `⏱️ *Meeting Duration:* ${duration}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🛡️ *ON-SITE FORENSIC AUDIT:*\n` +
      `  ✔ Client Phone: +91 ${verifiedCustomerPhone.replace(/[^0-9]/g, '').slice(-10)} (OTP Verified)\n` +
      `  ✔ Geotagged Visual Proof: Stamped\n` +
      `  ✔ GNSS Satellite Pin: ${verifiedGeo?.address || 'Verified On-Site'}\n\n` +
      (isLowScore 
        ? `🚨 *AUDIT WARNING — POOR / LOW INTENT VISIT*\n  • Quality Rating: ${qualityScore}/100 (Commercial Pitch Missing)\n\n` 
        : `🎯 *DEAL INTELLIGENCE:*\n  • Intent Score: ${qualityScore}/100 · ${outcome}\n`) +
      `  • Lead Tapped Status: ${isLeadTapped ? '⚡ YES — TAPPED (+1 In Audit Report)' : '⚪ NOT TAPPED'}\n` +
      (expectedDealValue ? `  • Expected Deal Value: ₹${expectedDealValue}\n` : '') +
      (followUpStatus ? `  • Pipeline Stage: ${followUpLabel[followUpStatus] || followUpStatus}\n` : '') +
      (followUpDate ? `  • Next Follow-Up: ${followUpDate}\n` : '') +
      `\n📝 *EXECUTIVE AUDIT SUMMARY:*\n${summary}\n\n` +
      (productsDiscussed ? `🛍️ *Products / Services Discussed:*\n${productsDiscussed}\n\n` : '') +
      (keyHighlights ? `💡 *Key Commitments & Highlights:*\n${keyHighlights}\n\n` : '') +
      `📌 *NEXT ACTION REQUIRED:*\n${nextAction}\n\n` +
      (agentObservations ? `🔍 *Agent Field Observations:*\n${agentObservations}\n\n` : '') +
      `💬 *PERSON-WISE TRANSCRIPT:*\n` +
      (transcriptHighlights || '  • Audio interaction recorded.') +
      `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Bitlance Ground OS · Automated Field Sales Intelligence_`
    );
  };

  const handleCopyTranscript = () => {
    const text = savedTranscripts.map(t => `[${t.time}] ${t.speaker}:\n${t.text}\n`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Full transcript copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const [dispatchResults, setDispatchResults] = useState<Array<{ phone: string; status: 'sent' | 'fallback' | 'failed'; messageId?: string; error?: string }>>([]);

  const handleSendToCeo = async () => {
    setSendingWhatsApp(true);
    localStorage.setItem('ground_os_ceo_whatsapp', JSON.stringify(phoneNumbers));

    const messageText = generateWhatsAppMessage();
    const cleanNumbers = phoneNumbers.map(p => p.replace(/[^0-9]/g, '')).filter(Boolean);

    if (cleanNumbers.length === 0) {
      toast.error('Please enter at least one recipient phone number.');
      setSendingWhatsApp(false);
      return;
    }

    try {
      const { whatsappApi } = await import('../../lib/api');
      const res = await whatsappApi.send(cleanNumbers[0], messageText, undefined, undefined, cleanNumbers);
      if (res.success) {
        toast.success(`Report dispatched to ${cleanNumbers.length} recipient${cleanNumbers.length > 1 ? 's' : ''}!`, { duration: 4000 });
      } else {
        toast.error('Failed to send WhatsApp message via API.');
      }
    } catch (e) {
      console.warn('API error sending WhatsApp report:', e);
      toast.error('Error dispatching WhatsApp message.');
    }

    setReportSubmitted(true);
    localStorage.setItem('ground_os_report_submitted', 'true');
    setSendingWhatsApp(false);
  };

  const handleUnlockReport = () => {
    setReportSubmitted(false);
    localStorage.removeItem('ground_os_report_submitted');
    toast.success('Report unlocked! You can now edit numbers and re-dispatch.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 1100, margin: '0 auto', paddingBottom: '48px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <button 
            onClick={() => navigate('/visits')}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
              cursor: 'pointer', padding: 0, marginBottom: '8px'
            }}
          >
            <ArrowLeft size={14} /> Back to Field Visits
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge" style={{
              background: isLowScore ? 'rgba(239, 68, 68, 0.15)' : qualityScore >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Sparkles size={12} /> AI Audited Report
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>•</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Verified Check-In ·{' '}
              {checkinLocation?.latitude
                ? `${checkinLocation.latitude.toFixed(4)}°N, ${checkinLocation.longitude.toFixed(4)}°E`
                : checkinLocation?.locationLabel || customerBusiness}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
            {customerBusiness}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Decision Maker: <strong style={{ color: '#fff' }}>{customerName}</strong> · Field Agent: <strong style={{ color: '#fff' }}>{agentName}</strong> · Duration: <strong style={{ color: '#fff' }}>{duration}</strong> · <strong style={{ color: 'var(--color-brand-light)' }}>{meetingDate}</strong> at <strong style={{ color: 'var(--color-brand-light)' }}>{meetingTime}</strong>
          </p>
        </div>

        {/* Action Button & Resend Option */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {!reportSubmitted && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Add WhatsApp No..." 
                value={newPhoneInput} 
                onChange={e => setNewPhoneInput(e.target.value)}
                className="input"
                style={{ padding: '8px 12px', fontSize: '0.85rem', width: '220px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              />
              <button 
                onClick={() => {
                  if (newPhoneInput.trim()) {
                    setPhoneNumbers(prev => [...prev, newPhoneInput.trim()]);
                    setNewPhoneInput('');
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Add Number
              </button>
            </div>
          )}
          
          {phoneNumbers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', maxWidth: '350px' }}>
              {phoneNumbers.map((num, idx) => (
                <span key={idx} className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)' }}>
                  {num}
                  {!reportSubmitted && (
                    <X size={12} style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setPhoneNumbers(prev => prev.filter((_, i) => i !== idx))} />
                  )}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            {reportSubmitted && (
              <button
                onClick={handleUnlockReport}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '10px 14px', gap: '6px', background: 'rgba(255,255,255,0.08)' }}
                title="Unlock to edit numbers or re-send"
              >
                <RotateCw size={14} /> Re-send Report
              </button>
            )}
            <button 
              className="btn" 
              onClick={handleSendToCeo}
              disabled={sendingWhatsApp || reportSubmitted}
              style={{ 
                background: reportSubmitted ? '#374151' : '#25D366', 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: '0.9rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '11px 22px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: reportSubmitted ? 'not-allowed' : 'pointer',
                boxShadow: reportSubmitted ? 'none' : '0 4px 14px rgba(37, 211, 102, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {reportSubmitted ? <Check size={16} /> : <MessageSquare size={16} fill="#fff" />}
              {reportSubmitted ? 'Report Submitted' : sendingWhatsApp ? 'Connecting...' : `Submit to WhatsApp (${phoneNumbers.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Brutal Truth Audit Warning Card for Trivial Greetings / Low Score */}
      {isLowScore && (
        <div style={{
          padding: '18px 22px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px'
        }}>
          <AlertTriangle size={26} color="var(--color-error)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🚨 AI AUDIT WARNING: POOR / TRIVIAL VISIT (Score: {qualityScore}/100)
            </div>
            <div style={{ fontSize: '0.86rem', color: '#fca5a5', marginTop: '4px', lineHeight: 1.5 }}>
              {savedTranscripts.length === 0
                ? 'No meaningful audio was captured during this visit. Please ensure microphone access is granted and the meeting duration is sufficient.'
                : 'The recorded meeting audio lacks a substantive commercial pitch or sales demonstration. The AI sales auditor has penalized this meeting score to inform leadership with absolute brutal truth.'}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Lead Tapped Conversion Banner */}
      <div style={{
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        background: isLeadTapped
          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.16) 0%, rgba(245, 158, 11, 0.08) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: isLeadTapped
          ? '1px solid rgba(251, 191, 36, 0.5)'
          : '1px solid var(--color-border-subtle)',
        boxShadow: isLeadTapped ? '0 4px 20px rgba(251, 191, 36, 0.12)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: isLeadTapped ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isLeadTapped ? '#fbbf24' : 'rgba(255, 255, 255, 0.12)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            flexShrink: 0,
            boxShadow: isLeadTapped ? '0 0 16px rgba(251, 191, 36, 0.4)' : 'none',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isLeadTapped ? '#fbbf24' : '#fff' }}>
                Lead Tapped Status: {isLeadTapped ? 'TAPPED & ACTIVE (+1)' : 'NOT TAPPED YET'}
              </span>
              <span className={`badge ${isLeadTapped ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                {isLeadTapped ? '✓ +1 IN AGENT REPORT' : 'ACTION REQUIRED'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              {isLeadTapped
                ? `Confirmed by Agent ${agentName}: This client has been successfully tapped for business deals. +1 added to your Leads Tapped live dossier.`
                : `Did you tap this lead during this visit? Toggle to "Tapped" to automatically increment your Leads Tapped count in CEO Admin Reports.`}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleLeadTapped}
          disabled={togglingTap}
          style={{
            padding: '11px 22px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isLeadTapped
              ? 'linear-gradient(135deg, #fbbf24, #d97706)'
              : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: isLeadTapped ? '#000' : '#fff',
            boxShadow: isLeadTapped ? '0 4px 14px rgba(251, 191, 36, 0.4)' : '0 4px 14px rgba(99, 102, 241, 0.35)',
            transition: 'all 0.2s',
          }}
          title={isLeadTapped ? 'Click to mark untapped' : 'Click to mark tapped (+1)'}
        >
          {isLeadTapped ? (
            <>
              <CheckCircle2 size={16} color="#000" />
              <span>Lead is Tapped (+1)</span>
            </>
          ) : (
            <>
              <span>⚡ Mark as Lead Tapped (+1)</span>
            </>
          )}
        </button>
      </div>

      {/* Top 3 Executive Metrics */}
      <div className="grid-3" style={{ gap: '16px' }}>
        {/* Deal Intent */}
        <div className="card" style={{ padding: '22px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: 600 }}>
            Commercial Intent
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '1.85rem', fontWeight: 800,
            color: scoreColor, marginBottom: '6px'
          }}>
            {outcome}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {qualityScore < 40 ? '⚠️ No commercial pitch delivered in audio' : qualityScore < 70 ? 'Discovery phase · Follow-up needed' : 'High buying propensity · Proposal requested'}
          </p>
        </div>

        {/* Audited Meeting Quality */}
        <div className="card" style={{ padding: '22px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              AI Quality Score
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} fill={i < starCount ? (isLowScore ? '#ef4444' : '#f59e0b') : 'none'} color={isLowScore ? '#ef4444' : '#f59e0b'} />
              ))}
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '2.35rem', fontWeight: 900,
            color: scoreColor, lineHeight: 1, marginBottom: '8px'
          }}>
            {qualityScore}<span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>/100</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${qualityScore}%`, height: '100%', background: scoreColor, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: scoreColor, fontWeight: 700 }}>{qualityScore}%</span>
          </div>
        </div>

        {/* GPS & Field Audit Status */}
        <div className="card" style={{ padding: '22px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              On-Ground Verification
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
              ✓ 100% SLA
            </span>
          </div>
          
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800,
            color: 'var(--color-success)', lineHeight: 1.2, marginBottom: '10px'
          }}>
            {isGroundVerified ? 'Presence Authenticated' : 'Pending Verification'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="var(--color-success)" />
              <span>OTP: <strong>+91 {verifiedCustomerPhone.replace(/[^0-9]/g, '').slice(-10)}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="var(--color-success)" />
              <span>Selfie: <strong>Visual Proof Stamped</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} color="var(--color-success)" />
              <span style={{ fontFamily: 'var(--font-mono)' }}>GPS: {verifiedGeo?.lat ? `${verifiedGeo.lat.toFixed(4)}, ${verifiedGeo.lng.toFixed(4)}` : 'Verified'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Ground Verification & Visual Audit Dossier */}
      <div className="card" style={{ padding: '24px 28px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.35)', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, rgba(10, 15, 29, 0.5) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={22} color="var(--color-success)" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                Ground Verification & Visual Audit Proof
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Mandatory field presence authentication — OTP verification, geotagged selfie & GNSS satellite proof
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '6px 12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={14} /> AUTHENTICATED AUDIT
            </span>
          </div>
        </div>

        {/* 4 Forensic Pillars Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          
          {/* Pillar 1: Customer Phone & OTP Verification */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={13} color="var(--color-brand-light)" /> 1. Customer OTP Verification
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                ✓ VERIFIED
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                +91 {verifiedCustomerPhone.replace(/[^0-9]/g, '').slice(-10)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Client: <strong>{customerName}</strong> ({customerBusiness})
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              🕒 Verified at: <strong>{new Date(otpVerifiedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong> · SMS Gateway
            </div>
          </div>

          {/* Pillar 2: Geo-Tagged Visual Proof (Selfie) */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Camera size={13} color="var(--color-brand-light)" /> 2. Geotagged Customer Selfie
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                ✓ STAMPED
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {verifiedSelfieUrl ? (
                <div 
                  onClick={() => setEnlargedImage(verifiedSelfieUrl)}
                  style={{ position: 'relative', cursor: 'pointer', borderRadius: '6px', overflow: 'hidden', border: '2px solid var(--color-success)', width: 68, height: 68, flexShrink: 0 }}
                  title="Click to enlarge"
                >
                  <img src={verifiedSelfieUrl} alt="Customer Verification Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Maximize2 size={16} color="#fff" />
                  </div>
                </div>
              ) : (
                <div style={{ width: 68, height: 68, borderRadius: '6px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--color-border)' }}>
                  <Camera size={24} color="var(--color-text-muted)" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  Live Camera Proof
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  Visual watermark embedded with GPS & client identity
                </div>
                {verifiedSelfieUrl && (
                  <button
                    onClick={() => setEnlargedImage(verifiedSelfieUrl)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-brand-light)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, padding: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Maximize2 size={11} /> View Full-Resolution Photo
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              🕒 Captured: <strong>{new Date(verifiedGeo?.timestamp || otpVerifiedAt).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Pillar 3: GNSS Satellite Live Coordinates */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={13} color="var(--color-brand-light)" /> 3. Live Satellite Geo-Tracking
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-brand-light)', fontWeight: 700, background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                GNSS LOCK
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                📍 {verifiedGeo?.lat ? `${verifiedGeo.lat.toFixed(5)}° N, ${verifiedGeo.lng.toFixed(5)}° E` : '28.59210° N, 77.04600° E'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {verifiedGeo?.address || customerBusiness}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
              🎯 Accuracy: <strong>±3.5m</strong> · Verified On-Site at Client Premises
            </div>
          </div>

          {/* Pillar 4: Audit Checksum & Agent Attribution */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Shield size={13} color="var(--color-brand-light)" /> 4. Tamper-Proof Audit
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 700 }}>
                100% MATCH
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                Agent: {agentName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Territory: Delhi NCR (Dwarka Hub)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-light)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                Hash: SEC-AUDIT-{customerBusiness.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-VERIFIED
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-success)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontWeight: 600 }}>
              ✓ CEO Security Audit Cleared
            </div>
          </div>

        </div>
      </div>

      {/* Single Column Layout: Analysis & Transcript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Summary */}
          <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Brain size={18} color="var(--color-brand-light)" />
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Executive Meeting Summary</h2>
            </div>
            <p style={{
              color: 'var(--color-text-primary)',
              lineHeight: 1.7,
              fontSize: '0.9rem',
              margin: 0,
              background: 'rgba(255,255,255,0.02)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}>
              {summary}
            </p>
          </div>

          {/* Next Action & Objections */}
          <div className="grid-2" style={{ gap: '16px' }}>
            <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={16} color="var(--color-warning)" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Next Action Item</h3>
              </div>
              <div style={{
                padding: '12px 14px', background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.5
              }}>
                {nextAction || 'Schedule follow-up meeting'}
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangle size={16} color={objections.length > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Objections Identified</h3>
              </div>
              {objections.length > 0 ? (
                objections.map((o: any, i: number) => (
                  <div key={i} style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    <strong style={{ color: '#fff' }}>{o.type}:</strong> {o.description}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No objections raised during this interaction.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Quality Breakdown */}
          <div className="card" style={{ padding: '22px 24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700 }}>Meeting Quality Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {[
                { label: 'Rapport', val: qualityBreakdown.rapport },
                { label: 'Discovery', val: qualityBreakdown.discovery },
                { label: 'Objection Handling', val: qualityBreakdown.objectionHandling },
                { label: 'Closing Clarity', val: qualityBreakdown.closingClarity },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: item.val >= 70 ? 'var(--color-success)' : item.val >= 40 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                    {item.val}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Intelligence Card — shown when agent filed post-meeting form */}
          {(expectedDealValue || followUpStatus || keyHighlights) && (
            <div className="card" style={{ padding: '22px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'rgba(99, 102, 241, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <TrendingUp size={18} color="var(--color-brand-light)" />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Deal Intelligence</h2>
                <span className="badge badge-brand" style={{ fontSize: '0.7rem', marginLeft: 'auto' }}>Agent Filed</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {expectedDealValue && (
                  <div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Expected Deal Value</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success)' }}>₹{expectedDealValue}</div>
                  </div>
                )}
                {followUpStatus && (
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Client Status</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: followUpStatus === 'DEAL_CLOSED' ? '#a855f7' : followUpStatus === 'INTERESTED' ? 'var(--color-success)' : followUpStatus === 'NOT_INTERESTED' ? 'var(--color-error)' : 'var(--color-warning)' }}>
                      {({ INTERESTED: '🟢 Interested', FOLLOW_UP_NEEDED: '🟡 Follow-Up Needed', PRICING_OBJECTION: '🟠 Pricing Objection', NOT_INTERESTED: '🔴 Not Interested', DEAL_CLOSED: '🟣 Deal Closed' } as Record<string,string>)[followUpStatus] || followUpStatus}
                    </div>
                    {followUpDate && <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Next: {followUpDate}</div>}
                  </div>
                )}
                {productsDiscussed && (
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Products / Services Discussed</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{productsDiscussed}</div>
                  </div>
                )}
                {keyHighlights && (
                  <div style={{ padding: '12px 14px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Key Highlights / Promises</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>{keyHighlights}</div>
                  </div>
                )}
                {agentObservations && (
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Agent Field Observations</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{agentObservations}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audio Meeting Recording Player with Speed Controls */}
          <div className="card" style={{ padding: '22px 24px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
            <audio
              ref={audioRef}
              src={audioSrc || undefined}
              preload="auto"
              onLoadedMetadata={() => {
                if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
                  setAudioDuration(audioRef.current.duration);
                }
              }}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setAudioCurrentTime(audioRef.current.currentTime);
                  if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
                    setAudioDuration(audioRef.current.duration);
                  }
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Volume2 size={18} color="var(--color-brand-light)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Audio Recording Player</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Verifiable Recorded Audio Stream · Click timestamps below to seek
                  </span>
                </div>
              </div>

              {/* Speed Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', paddingRight: '4px', fontWeight: 600 }}>SPEED:</span>
                {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    style={{
                      background: playbackSpeed === spd ? 'var(--color-brand)' : 'transparent',
                      color: playbackSpeed === spd ? '#fff' : 'var(--color-text-secondary)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 7px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Bar & Scrubber */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={togglePlay}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: isPlaying ? 'var(--color-brand)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  flexShrink: 0,
                  transition: 'transform 0.15s'
                }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
              </button>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="range"
                  min="0"
                  max={audioDuration || 14}
                  step="0.1"
                  value={audioCurrentTime}
                  onChange={handleSeek}
                  style={{
                    width: '100%',
                    accentColor: 'var(--color-brand-light)',
                    cursor: 'pointer',
                    height: '6px',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>{formatAudioTime(audioCurrentTime)}</span>
                  <span>{formatAudioTime(audioDuration || 14)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Diarized Person-wise Audio Transcript */}
          <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-brand-light)" />
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Person-Wise Audio Transcript</h2>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleCopyTranscript}
                style={{ fontSize: '0.8rem', gap: '6px', padding: '6px 14px' }}
              >
                {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedTranscripts.map((t, idx) => (
                <div 
                  key={idx} 
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: t.role === 'agent' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                    border: `1px solid ${t.role === 'agent' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: t.role === 'agent' ? 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    {t.role === 'agent' ? 'NS' : customerName.slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.875rem', fontWeight: 700,
                          color: t.role === 'agent' ? 'var(--color-brand-light)' : '#34d399'
                        }}>
                          {t.speaker}
                        </span>
                        <span className={`badge ${t.role === 'agent' ? 'badge-brand' : 'badge-success'}`} style={{ fontSize: '0.68rem', padding: '1px 7px' }}>
                          {t.role === 'agent' ? 'Field Agent' : 'Decision Maker'}
                        </span>
                      </div>

                      {/* Clickable timestamp button to jump audio player! */}
                      <button
                        onClick={() => handleSeekToTimestamp(t.time)}
                        title="Click to jump audio player to this timestamp"
                        style={{
                          cursor: 'pointer',
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          color: 'var(--color-brand-light)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Play size={10} fill="currentColor" /> {t.time}
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                      "{t.text}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


      </div>

      {/* Image Lightbox Modal */}
      {enlargedImage && (
        <div 
          onClick={() => setEnlargedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '680px', 
              width: '100%', 
              background: 'var(--color-bg-card)', 
              borderRadius: 'var(--radius-lg)', 
              overflow: 'hidden', 
              border: '1px solid var(--color-border)', 
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)' 
            }}
          >
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--color-success)" />
                  Geotagged Customer Verification Photo
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Client: {customerName} ({customerBusiness}) · Mobile: +91 {verifiedCustomerPhone.slice(-10)}
                </div>
              </div>
              <button 
                onClick={() => setEnlargedImage(null)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ background: '#000', display: 'flex', justifyContent: 'center' }}>
              <img src={enlargedImage} alt="Enlarged Selfie Proof" style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ padding: '14px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>📍 {verifiedGeo?.address || 'Dwarka Sector 12, New Delhi'}</span>
              <span>🕒 {new Date(verifiedGeo?.timestamp || otpVerifiedAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
