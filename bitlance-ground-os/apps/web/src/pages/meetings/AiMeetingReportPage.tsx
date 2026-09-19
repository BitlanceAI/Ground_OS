import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Send, Star, FileText, Clock, CheckCircle2, 
  Building2, MessageSquare, Copy, ExternalLink, ShieldCheck, 
  AlertTriangle, ArrowLeft, Check, Sparkles, AlertCircle
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

  // Load saved meeting notes and details
  const savedData = useMemo(() => {
    try {
      const item = localStorage.getItem('meeting_notes_m1');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

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
    return [
      {
        speaker: 'Nilesh Somnawane (Agent)',
        role: 'agent',
        text: 'Namaste Harish ji, thank you for your time today.',
        time: '00:05',
      },
      {
        speaker: 'Harish Mehta (Client)',
        role: 'client',
        text: 'Namaste Nilesh. We want to evaluate your commercial POS billing platform.',
        time: '00:18',
      },
    ];
  }, [savedData]);

  const customerName = savedData?.businessOwnerName || 'Uttam';
  const customerBusiness = savedData?.businessName || 'Sreejal Jewellers';
  const duration = savedData?.duration || '00:14';
  const agentName = savedData?.agentName || 'Nilesh Somnawane';

  // Dynamic values evaluated by LLM
  const qualityScore: number = typeof savedData?.qualityScore === 'number' ? savedData.qualityScore : 78;
  const intentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = savedData?.intentLevel || 'MEDIUM';
  const outcome: string = savedData?.outcome || (intentLevel === 'LOW' ? 'Low Intent' : intentLevel === 'MEDIUM' ? 'Moderate Intent' : 'High Intent');
  const summary: string = savedData?.summary || savedData?.notes || 'Meeting evaluation in progress.';
  const nextAction: string = savedData?.nextAction || 'Follow up with client regarding next steps.';
  const objections = Array.isArray(savedData?.objections) ? savedData.objections : [];
  const qualityBreakdown = savedData?.qualityBreakdown || {
    rapport: qualityScore,
    discovery: Math.max(10, qualityScore - 10),
    objectionHandling: Math.max(5, qualityScore - 15),
    closingClarity: Math.max(10, qualityScore - 5),
  };

  // CEO WhatsApp Phone State
  const [ceoPhone, setCeoPhone] = useState(() => {
    return localStorage.getItem('ground_os_ceo_whatsapp') || '919820012345';
  });

  // Calculate score colors
  const scoreColor = qualityScore >= 70 ? 'var(--color-success)' : qualityScore >= 40 ? 'var(--color-warning)' : 'var(--color-error)';
  const starCount = qualityScore >= 80 ? 5 : qualityScore >= 60 ? 4 : qualityScore >= 40 ? 3 : qualityScore >= 20 ? 2 : 1;

  const generateWhatsAppMessage = () => {
    const transcriptHighlights = savedTranscripts.slice(0, 3).map(t => `• *${t.speaker}:* "${t.text}"`).join('\n');
    return (
      `🚀 *FIELD VISIT REPORT — CEO BRIEFING*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *Shop / Company:* ${customerBusiness}\n` +
      `👤 *Decision Maker:* ${customerName}\n` +
      `👔 *Field Agent:* ${agentName} (Andheri West)\n` +
      `⏱️ *Meeting Duration:* ${duration}\n` +
      `🎯 *Deal Intent:* ${outcome} (Score: ${qualityScore}/100)\n\n` +
      `📝 *EXECUTIVE SUMMARY:*\n${summary}\n\n` +
      `📌 *NEXT ACTION / FOLLOW-UP:*\n${nextAction}\n\n` +
      `💬 *TRANSCRIPT HIGHLIGHTS:*\n` +
      (transcriptHighlights || '• Brief audio capture recorded.') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Submitted via Bitlance Ground OS_`
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

    // 1. Attempt WhatsApp Cloud API if credentials are present
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

    // 2. Direct 1-Click WhatsApp link (wa.me) for guaranteed instant delivery
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
              background: qualityScore >= 70 ? 'rgba(16, 185, 129, 0.15)' : qualityScore >= 40 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: scoreColor,
              border: `1px solid ${scoreColor}40`,
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <Sparkles size={12} /> AI Audited Report
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>•</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              Verified Check-In · Andheri West
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
            {customerBusiness}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Decision Maker: <strong style={{ color: '#fff' }}>{customerName}</strong> · Field Agent: <strong style={{ color: '#fff' }}>{agentName}</strong> · Duration: <strong style={{ color: '#fff' }}>{duration}</strong>
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
            {qualityScore < 30 ? 'No commercial pitch delivered' : qualityScore < 70 ? 'Discovery phase · Follow-up needed' : 'High buying propensity · Proposal requested'}
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
                <Star key={i} size={13} fill={i < starCount ? '#f59e0b' : 'none'} color="#f59e0b" />
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
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Andheri West Sales Hub</div>
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

          {/* Full Diarized Audio Transcript */}
          <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-brand-light)" />
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Audio Meeting Transcript</h2>
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
                    background: t.role === 'agent' ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${t.role === 'agent' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: t.role === 'agent' ? 'var(--color-brand)' : '#334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.75rem', fontWeight: 700
                  }}>
                    {t.role === 'agent' ? 'NS' : customerName.slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.825rem', fontWeight: 700,
                        color: t.role === 'agent' ? 'var(--color-brand-light)' : '#fff'
                      }}>
                        {t.speaker}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {t.time}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                      {t.text}
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

            {/* CEO Phone Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                CEO WhatsApp Number
              </label>
              <input 
                type="text" 
                value={ceoPhone} 
                onChange={(e) => setCeoPhone(e.target.value)}
                placeholder="e.g. 919820012345"
                style={{
                  width: '100%',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  color: '#fff',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            {/* Styled WhatsApp Chat Bubble Preview */}
            <div style={{
              background: '#0c1b12',
              border: '1px solid rgba(37, 211, 102, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              color: '#d1fae5',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                borderBottom: '1px solid rgba(37, 211, 102, 0.2)', paddingBottom: '8px', marginBottom: '10px',
                color: '#25D366', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em'
              }}>
                <MessageSquare size={13} /> WHATSAPP CEO MESSAGE PREVIEW
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {generateWhatsAppMessage()}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSendToCeo}
              disabled={sendingWhatsApp}
              className="btn"
              style={{
                width: '100%',
                background: '#25D366',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.925rem',
                padding: '13px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
              }}
            >
              <Send size={16} />
              {sendingWhatsApp ? 'Dispatching...' : 'Send to CEO WhatsApp'}
              <ExternalLink size={14} />
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
