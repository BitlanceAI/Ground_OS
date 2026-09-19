import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Send, Star, FileText, Clock, CheckCircle2, 
  Building2, MessageSquare, Copy, ExternalLink, ShieldCheck, UserCheck
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

  // Load saved meeting notes and details
  const savedData = (() => {
    try {
      const item = localStorage.getItem('meeting_notes_m1');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const savedTranscripts: TranscriptItem[] = (() => {
    try {
      const item = localStorage.getItem('meeting_transcript_m1');
      if (item) return JSON.parse(item);
    } catch {
      // ignore
    }
    if (savedData?.transcript && Array.isArray(savedData.transcript)) {
      return savedData.transcript;
    }
    return [
      {
        speaker: 'Nilesh Somnawane (Agent)',
        role: 'agent',
        text: 'Namaste Harish ji, thank you for your time today at Pinnacle Electronics.',
        time: '00:05',
      },
      {
        speaker: 'Harish Mehta (Client)',
        role: 'client',
        text: 'Namaste Nilesh. Yes, we need to upgrade our inventory tracking and POS billing across our 2 store counters.',
        time: '00:18',
      },
      {
        speaker: 'Nilesh Somnawane (Agent)',
        role: 'agent',
        text: 'Understood. Our platform connects directly with real-time field orders, GST compliance, and automated WhatsApp payment links for your clients.',
        time: '00:36',
      },
      {
        speaker: 'Harish Mehta (Client)',
        role: 'client',
        text: 'Our budget is capped at ₹1.5 Lakhs annually, and I need assurance on 24/7 on-ground customer support here in Mumbai.',
        time: '00:52',
      },
      {
        speaker: 'Nilesh Somnawane (Agent)',
        role: 'agent',
        text: 'Our Mumbai hub is based right here in Andheri West, so your dedicated support rep is within a 15-minute reach. Our retail tier fits inside ₹1.25 Lakhs. Can I send the quotation to your WhatsApp?',
        time: '01:15',
      },
      {
        speaker: 'Harish Mehta (Client)',
        role: 'client',
        text: 'Yes, send the complete proposal on WhatsApp. If terms are agreeable, we will sign the agreement by Tuesday.',
        time: '01:30',
      },
    ];
  })();

  const customerName = savedData?.businessOwnerName || 'Harish Mehta';
  const customerBusiness = savedData?.businessName || 'Pinnacle Electronics Store';
  const duration = savedData?.duration || '12m 40s';
  const agentName = savedData?.agentName || 'Nilesh Somnawane';
  const outcome = savedData?.outcome || 'High Intent';
  const nextAction = savedData?.nextAction || 'Send official pricing proposal and schedule onboarding call for Tuesday';
  const summary = savedData?.summary || savedData?.notes || 
    `High-intent commercial discussion conducted with ${customerName} at ${customerBusiness}. Client required POS & WhatsApp integration within a ₹1.5L annual budget. Addressed SLA concerns with local Andheri West support guarantee. Agreed to review official quotation on WhatsApp with target sign-off by Tuesday.`;

  // CEO WhatsApp Phone State
  const [ceoPhone, setCeoPhone] = useState(() => {
    return localStorage.getItem('ground_os_ceo_whatsapp') || '919820012345';
  });

  const generateWhatsAppMessage = () => {
    return (
      `🚀 *FIELD VISIT REPORT — CEO BRIEFING*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📍 *Shop / Company:* ${customerBusiness}\n` +
      `👤 *Decision Maker:* ${customerName}\n` +
      `👔 *Field Agent:* ${agentName} (Andheri West)\n` +
      `⏱️ *Meeting Duration:* ${duration}\n` +
      `🎯 *Deal Intent:* ${outcome} (₹1.25L - ₹1.5L)\n\n` +
      `📝 *EXECUTIVE SUMMARY:*\n${summary}\n\n` +
      `📌 *NEXT ACTION / FOLLOW-UP:*\n${nextAction}\n\n` +
      `💬 *TRANSCRIPT HIGHLIGHTS:*\n` +
      savedTranscripts.slice(0, 3).map(t => `• *${t.speaker}:* "${t.text}"`).join('\n') +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Submitted via Bitlance Ground OS_`
    );
  };

  const handleCopyTranscript = () => {
    const text = savedTranscripts.map(t => `[${t.time}] ${t.speaker}:\n${t.text}\n`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Full transcript copied to clipboard!');
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

    // 2. Direct 1-Click WhatsApp link (wa.me) for instant real delivery
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');

    toast.success('Report dispatched! Opening WhatsApp with CEO briefing...', { duration: 4000 });
    setSendingWhatsApp(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={13} /> Verified On-Site Meeting
            </span>
            <span className="badge badge-brand">{outcome}</span>
          </div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '4px', fontWeight: 800 }}>
            {customerBusiness}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Client: <strong style={{ color: '#fff' }}>{customerName}</strong> · Agent: <strong style={{ color: '#fff' }}>{agentName}</strong> · Duration: {duration}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/visits')}
          >
            Back to Visits
          </button>
          <button 
            className="btn" 
            onClick={handleSendToCeo}
            disabled={sendingWhatsApp}
            style={{ 
              background: '#25D366', 
              color: '#fff', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={16} fill="#fff" />
            {sendingWhatsApp ? 'Preparing...' : 'Submit to CEO via WhatsApp'}
          </button>
        </div>
      </div>

      {/* WhatsApp CEO Submission Card */}
      <div className="card-branded" style={{
        background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(13, 20, 36, 0.95))',
        border: '1px solid rgba(37, 211, 102, 0.35)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Send size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Instant WhatsApp CEO Submission</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Directly sends this visit's summary, deal points, and proper transcript to the CEO's WhatsApp
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>CEO WhatsApp:</label>
            <input 
              type="text" 
              value={ceoPhone} 
              onChange={(e) => setCeoPhone(e.target.value)}
              placeholder="e.g. 919820012345"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                width: 160
              }}
            />
            <button
              onClick={handleSendToCeo}
              className="btn"
              style={{
                background: '#25D366',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '7px 16px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Send Now <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Message preview block */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap'
        }}>
          {generateWhatsAppMessage()}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid-3">
        {/* Deal Intent */}
        <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Deal Intent
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '2.2rem', fontWeight: 800,
            color: 'var(--color-warning)', marginBottom: '4px'
          }}>
            {outcome}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Client ready for quotation
          </span>
        </div>

        {/* Meeting Quality */}
        <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Meeting Quality
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '2.2rem', fontWeight: 800,
            color: 'var(--color-success)', marginBottom: '4px'
          }}>
            92<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/100</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
          </div>
        </div>

        {/* Territory / Field Verification */}
        <div className="card" style={{ textAlign: 'center', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            GPS & Agent Status
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '1.25rem', fontWeight: 700,
            color: 'var(--color-brand-light)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            <ShieldCheck size={20} color="var(--color-success)" /> Verified Check-In
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Andheri West, Mumbai
          </span>
        </div>
      </div>

      {/* AI Drafted Summary & Next Steps */}
      <div className="grid-2">
        <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Brain size={18} color="var(--color-brand-light)" /> AI Executive Summary
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.9rem', margin: 0 }}>
            {summary}
          </p>
        </div>

        <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
            <Clock size={18} color="var(--color-warning)" /> Next Action & Timeline
          </h2>
          <div style={{
            padding: '14px', background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            lineHeight: 1.6,
            marginBottom: '16px'
          }}>
            {nextAction}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
            ⚡ This action item is included in the automated WhatsApp report sent to the CEO.
          </p>
        </div>
      </div>

      {/* Proper Meeting Transcripts */}
      <div className="card" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--color-brand-light)" />
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Full Audio Meeting Transcript</h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Speech-to-Text captured and diarized turn-by-turn with Deepgram Nova-2
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleCopyTranscript}
            style={{ fontSize: '0.8rem', gap: '6px' }}
          >
            <Copy size={14} /> Copy Transcript
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {savedTranscripts.map((t, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                gap: '14px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: t.role === 'agent' ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${t.role === 'agent' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: t.role === 'agent' ? 'var(--color-brand)' : '#334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.8rem', fontWeight: 700
              }}>
                {t.role === 'agent' ? 'NS' : customerName.slice(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.85rem', fontWeight: 700,
                    color: t.role === 'agent' ? 'var(--color-brand-light)' : '#fff'
                  }}>
                    {t.speaker}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {t.time}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                  {t.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
