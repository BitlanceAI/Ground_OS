import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle, Send, PhoneCall, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportViewerPage() {
  const navigate = useNavigate();
  const [creativeSent, setCreativeSent] = useState(false);

  const handleSendCreative = () => {
    setCreativeSent(true);
    toast.success('AI Comparison Creative sent to Rajesh Kumar on WhatsApp!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Quality Score Hero */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.8))',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        textAlign: 'center',
        padding: '1.5rem',
      }}>
        <span className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>AI ANALYSIS COMPLETE</span>
        <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#34d399' }}>
          94<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/100</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
          Top Quality Meeting Score
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Intent Level: <strong>VERY HIGH (91%)</strong> · Conversion Probability: <strong>88%</strong>
        </p>
      </div>

      {/* Extracted Structured Requirements */}
      <div className="glass-card">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fbbf24' }}>
          📋 Extracted Requirements
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Unit:</span> <strong>3BHK (1650 sq.ft)</strong>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Budget:</span> <strong>₹95 Lakhs</strong>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Facing:</span> <strong>East (Vastu)</strong>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.4rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Parking:</span> <strong>2 Covered</strong>
          </div>
        </div>
      </div>

      {/* Recommended Next Actions */}
      <div className="glass-card">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
          ⚡ Next Automated Actions
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            onClick={handleSendCreative}
            disabled={creativeSent}
            className="btn-primary"
            style={{
              background: creativeSent ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: creativeSent ? '#34d399' : '#000',
              border: creativeSent ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
              fontSize: '0.82rem',
              padding: '0.75rem',
            }}
          >
            {creativeSent ? <CheckCircle size={15} /> : <Send size={15} />}
            {creativeSent ? 'Dispatched to WhatsApp' : 'Dispatch Personalized WhatsApp Creative'}
          </button>

          <button
            onClick={() => {
              toast.success('Voice AI Call scheduled for tomorrow 11:30 AM');
            }}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.75rem' }}
          >
            <PhoneCall size={15} color="#8b5cf6" /> Schedule Voice AI Confirmation
          </button>
        </div>
      </div>

      <button
        className="btn-secondary"
        onClick={() => navigate('/')}
        style={{ padding: '0.85rem' }}
      >
        Return to Today's Dashboard <ArrowRight size={15} />
      </button>
    </div>
  );
}
