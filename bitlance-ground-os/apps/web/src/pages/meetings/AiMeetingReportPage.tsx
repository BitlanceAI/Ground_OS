import { useNavigate } from 'react-router-dom';
import { 
  Brain, TrendingUp, AlertTriangle, ChevronRight, MessageSquare, 
  Send, Star, FileText, Clock, CheckCircle2, Building2 
} from 'lucide-react';
import { DEMO_MEETING_INSIGHT } from '../../lib/demo-data';
import { useState } from 'react';
import toast from 'react-hot-toast';

const m = DEMO_MEETING_INSIGHT;

export default function AiMeetingReportPage() {
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);

  const savedAgentNotes = (() => {
    try {
      const item = localStorage.getItem('meeting_notes_m1');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const customerName = savedAgentNotes?.businessOwnerName || m.customerName;
  const customerBusiness = savedAgentNotes?.businessName || m.customerBusiness;

  const shareWithCeo = async () => {
    setSending(true);
    try {
      const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_ID || '744188362103708';
      const token = import.meta.env.VITE_WHATSAPP_GLOBAL_TOKEN;
      
      if (!token) {
        throw new Error("WhatsApp token not configured in .env");
      }

      // Default target phone number
      const targetPhone = "919999999999"; 

      const messageText = `*AI Meeting Report: ${customerName}*\n\n` +
        `*Quality Score:* ${m.qualityScore}/100\n` +
        `*Intent Level:* ${m.intentLevel}\n\n` +
        `*Summary:* ${m.summary}\n\n` +
        `*Recommended Action:* ${m.recommendedAction}`;

      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: targetPhone,
          type: "text",
          text: {
            preview_url: false,
            body: messageText
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Successfully sent report to CEO via WhatsApp!");
      } else {
        console.error("WhatsApp API Error:", data);
        toast.error(`Failed to send: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send WhatsApp message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="ai-state ai-state-complete" style={{ marginBottom: '8px' }}>AI Report Ready</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{customerName} — Meeting Report</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {customerBusiness} · {m.duration} · Agent: {m.agentName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={shareWithCeo}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Share with CEO'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/customers/c1')}>
            View Customer 360 <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Top Row — Score + Intent */}
      <div className="grid-3">
        {/* Quality Score */}
        <div className="card" style={{ textAlign: 'center', padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Meeting Quality</div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '3.5rem', fontWeight: 900,
            color: m.qualityScore >= 80 ? 'var(--color-success)' : 'var(--color-warning)',
            lineHeight: 1
          }}>{m.qualityScore}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>/100</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < 4 ? '#f59e0b' : 'none'} color="#f59e0b" />)}
          </div>
        </div>

        {/* Intent Level */}
        <div className="card" style={{ textAlign: 'center', padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Purchase Intent</div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: '2rem', fontWeight: 800,
            color: m.intentLevel === 'HIGH' ? 'var(--color-warning)' : 'var(--color-success)',
            marginBottom: '8px'
          }}>{m.intentLevel}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ height: 8, background: 'var(--color-intent-low)', borderRadius: 'var(--radius-sm)', flex: 1 }} />
            <div style={{ height: 8, background: 'var(--color-intent-medium)', borderRadius: 'var(--radius-sm)', flex: 1 }} />
            <div style={{ height: 8, background: 'var(--color-intent-high)', borderRadius: 'var(--radius-sm)', flex: 1, boxShadow: '0 0 8px var(--color-intent-high)' }} />
            <div style={{ height: 8, background: 'rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', flex: 1 }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            72% purchase probability
          </div>
        </div>

        {/* Objections */}
        <div className="card" style={{ textAlign: 'center', padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Objections Detected</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '3.5rem', fontWeight: 900, color: 'var(--color-error)', lineHeight: 1, marginBottom: '8px' }}>
            {m.objections.length}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'center' }}>
            {m.objections.map(o => (
              <span key={o.type} className={`badge ${o.severity === 'HIGH' ? 'badge-error' : 'badge-warning'}`}>
                {o.type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* AI Summary — Constrained line-length & balanced padding */}
      <div className="card-branded" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={18} color="var(--color-brand-light)" style={{ marginTop: '1px', flexShrink: 0 }} /> AI Summary
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75, fontSize: '0.9375rem', maxWidth: '72ch', margin: 0 }}>
          {m.summary}
        </p>
      </div>

      {/* Agent Field Notes (if saved during or after meeting) */}
      {savedAgentNotes?.notes && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(13, 20, 36, 0.95))',
          border: '1px solid var(--color-border)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
              <FileText size={16} color="var(--color-brand-light)" style={{ marginTop: '1px' }} /> Agent Field Notes & Objections
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
                {savedAgentNotes.outcome || 'High Intent'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Recorded by Agent
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--color-text-primary)', lineHeight: 1.6, fontSize: '0.875rem', marginBottom: '14px', maxWidth: '75ch' }}>
            {savedAgentNotes.notes}
          </p>
          {savedAgentNotes.nextAction && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-subtle)',
              fontSize: '0.8125rem', color: 'var(--color-text-secondary)'
            }}>
              <Clock size={14} color="var(--color-warning)" />
              <span><strong>Agent Follow-up Action:</strong> {savedAgentNotes.nextAction}</span>
            </div>
          )}
        </div>
      )}

      {/* AI Recommended Action — Differentiated button hierarchy */}
      <div className="card-branded" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(13,20,36,0.9))',
        border: '1px solid rgba(16,185,129,0.25)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <h2 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ai-recommend)' }}>
          <Brain size={18} color="var(--color-ai-recommend)" style={{ marginTop: '1px', flexShrink: 0 }} /> AI Recommended Action
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, fontSize: '0.9375rem', maxWidth: '72ch', margin: 0 }}>
          {m.recommendedAction}
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/creatives')}
            style={{ 
              background: 'rgba(99, 102, 241, 0.2)', 
              border: '1px solid var(--color-brand)', 
              color: '#fff', 
              padding: '8px 16px',
              fontWeight: 600
            }}
          >
            <MessageSquare size={14} /> Generate Creative
          </button>
          <button 
            className="btn btn-secondary"
            style={{ 
              background: 'rgba(16, 185, 129, 0.15)', 
              border: '1px solid rgba(16, 185, 129, 0.35)', 
              color: 'var(--color-success)', 
              padding: '8px 16px',
              fontWeight: 600
            }}
          >
            <Send size={14} /> Schedule Follow-up
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Requirements — Dot Leader bridging labels and values */}
        <div className="card" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--color-ai-recommend)" style={{ marginTop: '1px', flexShrink: 0 }} /> Captured Requirements
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(m.requirement).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'baseline', padding: '8px 0', gap: '12px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize', flexShrink: 0 }}>
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <div style={{ flex: 1, borderBottom: '1px dotted rgba(255,255,255,0.18)', marginBottom: '4px' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 600, flexShrink: 0 }}>
                  {typeof v === 'number' && k.includes('budget') ? `₹${(v / 100000).toFixed(0)}L` : String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Objections + Competitors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h2 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="var(--color-warning)" style={{ marginTop: '1px', flexShrink: 0 }} /> Objections Breakdown
            </h2>
            {m.objections.map(o => (
              <div key={o.type} style={{
                padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: '10px',
                background: o.severity === 'HIGH' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                border: `1px solid ${o.severity === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className={`badge ${o.severity === 'HIGH' ? 'badge-error' : 'badge-warning'}`}>{o.type}</span>
                  <span className={`badge badge-${o.severity === 'HIGH' ? 'error' : 'warning'}`}>{o.severity}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>{o.description}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h2 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="var(--color-brand-light)" style={{ marginTop: '1px', flexShrink: 0 }} /> Competitors Mentioned
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {m.competitorMentions.map(c => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.location}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--color-error)' }}>
                    ₹{(c.pricePoint / 100000).toFixed(0)}L
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quality Breakdown */}
      <div className="card" style={{ borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Meeting Quality Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {Object.entries(m.qualityBreakdown).map(([k, v]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800, color: v >= 80 ? 'var(--color-success)' : v >= 65 ? 'var(--color-warning)' : 'var(--color-error)' }}>{v}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize', marginTop: '2px' }}>
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', marginTop: '6px', maxWidth: '80%', margin: '6px auto 0' }}>
                <div style={{
                  height: '100%', borderRadius: 'var(--radius-sm)',
                  background: v >= 80 ? 'var(--color-success)' : v >= 65 ? 'var(--color-warning)' : 'var(--color-error)',
                  width: `${v}%`
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
