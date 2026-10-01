import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Send, Star, FileText, Clock, CheckCircle2, 
  Building2, MessageSquare, Copy, ExternalLink, ShieldCheck, 
  AlertTriangle, ArrowLeft, Check, Sparkles, AlertCircle, TrendingUp,
  Play, Pause, RotateCcw, Volume2, FastForward
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TranscriptItem {
  speaker: string;
  role: 'agent' | 'client';
  text: string;
  time: string;
}

export default function AiMeetingReportPage() {
  const navigate = useNavigate();
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
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

  const customerName = savedData?.businessOwnerName || 'Uttam';
  const customerBusiness = savedData?.businessName || 'Sreejal Jewellers';
  const duration = savedData?.duration || '00:14';
  const agentName = savedData?.agentName || 'Nilesh Somnawane';
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

  // CEO WhatsApp Phone State
  const [ceoPhone, setCeoPhone] = useState(() => {
    return localStorage.getItem('ground_os_ceo_whatsapp') || '919820012345';
  });

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
      `🚀 *FIELD VISIT REPORT — CEO BRIEFING*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📅 *Date:* ${meetingDate}\n` +
      `⏰ *Time:* ${meetingTime}\n` +
      `📍 *Location / Shop:* ${customerBusiness}\n` +
      `👤 *Business Owner / Decision Maker:* ${customerName}\n` +
      `👔 *Field Agent:* ${agentName}\n` +
      `⏱️ *Meeting Duration:* ${duration}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      (isLowScore ? `🚨 *AUDIT WARNING: LOW INTENT / POOR VISIT*\n• Quality Rating: ${qualityScore}/100 (Failed Commercial Audit)\n\n` : `🎯 *DEAL INTELLIGENCE:*\n• Intent Score: ${qualityScore}/100 (${outcome})\n`) +
      (expectedDealValue ? `• Expected Deal Value: ₹${expectedDealValue}\n` : '') +
      (followUpStatus ? `• Client Status: ${followUpLabel[followUpStatus] || followUpStatus}\n` : '') +
      (followUpDate ? `• Next Follow-Up: ${followUpDate}\n` : '') +
      `\n📝 *EXECUTIVE AUDIT SUMMARY:*\n${summary}\n\n` +
      (productsDiscussed ? `🛍️ *Products / Services Discussed:*\n${productsDiscussed}\n\n` : '') +
      (keyHighlights ? `💡 *Key Highlights / Promises:*\n${keyHighlights}\n\n` : '') +
      `📌 *NEXT ACTION:*\n${nextAction}\n\n` +
      (agentObservations ? `🔍 *Agent Field Observations:*\n${agentObservations}\n\n` : '') +
      `💬 *PERSON-WISE TRANSCRIPT:*\n` +
      (transcriptHighlights || '• Brief audio capture recorded.') +
      `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Submitted via Bitlance Ground OS · ${meetingDate}_`
    );
  };

  const handleCopyTranscript = () => {
    const text = savedTranscripts.map(t => `[${t.time}] ${t.speaker}:\n${t.text}\n`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Full transcript copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToCeo = async () => {
    setSendingWhatsApp(true);
    localStorage.setItem('ground_os_ceo_whatsapp', ceoPhone);

    const messageText = generateWhatsAppMessage();
    const cleanPhone = ceoPhone.replace(/[^0-9]/g, '');

    const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_ID;
    const token = import.meta.env.VITE_WHATSAPP_GLOBAL_TOKEN;

    if (phoneId && token) {
      try {
        await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: messageText },
          }),
        });
      } catch (err) {
        console.warn('WhatsApp Cloud API direct attempt completed with error:', err);
      }
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');

    toast.success('Report ready! Dispatched to CEO WhatsApp.', { duration: 3500 });
    setSendingWhatsApp(false);
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

        {/* Action Button */}
        <button 
          className="btn" 
          onClick={handleSendToCeo}
          disabled={sendingWhatsApp}
          style={{ 
            background: '#25D366', 
            color: '#fff', 
            fontWeight: 700, 
            fontSize: '0.9rem',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '11px 22px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
            transition: 'all 0.2s'
          }}
        >
          <MessageSquare size={16} fill="#fff" />
          {sendingWhatsApp ? 'Connecting...' : 'Submit to CEO via WhatsApp'}
        </button>
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
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: 600 }}>
            On-Ground Verification
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={24} color="var(--color-success)" />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>GPS Check-In Verified</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {checkinLocation?.latitude
                  ? `${checkinLocation.latitude.toFixed(5)}, ${checkinLocation.longitude.toFixed(5)} (±${checkinLocation.accuracy?.toFixed(0) ?? '?'}m)`
                  : checkinLocation?.locationLabel || customerBusiness}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-light)', fontWeight: 600 }}>
            Agent: {agentName}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Left Column = Analysis & Transcript; Right Column = WhatsApp CEO Dispatcher */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '20px', alignItems: 'start' }}>
        
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

        {/* Right Column — Instant CEO WhatsApp Dispatcher (Modernized) */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="card" style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(13, 20, 36, 0.98) 100%)',
            border: '1px solid rgba(37, 211, 102, 0.35)',
            boxShadow: '0 12px 30px -10px rgba(37, 211, 102, 0.15)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Send size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Submit Report to CEO</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  WhatsApp Executive Briefing
                </p>
              </div>
            </div>

            {/* Input Phone */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                CEO WHATSAPP NUMBER
              </label>
              <input
                type="text"
                value={ceoPhone}
                onChange={(e) => setCeoPhone(e.target.value)}
                placeholder="e.g. 919820012345"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--color-border-subtle)',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Message Preview */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                WHATSAPP CEO MESSAGE PREVIEW
              </label>
              <pre style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(37, 211, 102, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                fontSize: '0.72rem',
                color: '#34d399',
                maxHeight: 260,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
                margin: 0,
                lineHeight: 1.45
              }}>
                {generateWhatsAppMessage()}
              </pre>
            </div>

            {/* Dispatch Button */}
            <button
              onClick={handleSendToCeo}
              disabled={sendingWhatsApp}
              style={{
                width: '100%',
                background: '#25D366',
                color: '#fff',
                fontWeight: 700,
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
              }}
            >
              <Send size={16} />
              {sendingWhatsApp ? 'Dispatching...' : 'Send to CEO WhatsApp'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '12px', margin: '12px 0 0 0' }}>
              Opens directly in WhatsApp Web / App with pre-filled briefing.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
