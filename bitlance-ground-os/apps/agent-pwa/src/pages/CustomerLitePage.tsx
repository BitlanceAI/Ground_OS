import { useState } from 'react';
import { Phone, MessageSquare, MapPin, Calendar, CheckCircle2, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerLitePage() {
  const [noteText, setNoteText] = useState('');

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    toast.success('Note attached to customer profile');
    setNoteText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Profile Header */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.75rem',
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#fff'
        }}>
          RK
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Rajesh Kumar</h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rajesh Electronics & Appliances</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <span className="badge badge-gold">Lead Score: 91/100</span>
          <span className="badge badge-emerald">Stage: Negotiation</span>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <a
            href="tel:+919876500112"
            className="btn-primary"
            style={{ textDecoration: 'none', flex: 1, padding: '0.6rem', fontSize: '0.78rem' }}
          >
            <Phone size={15} /> Call
          </a>
          <a
            href="https://wa.me/919876500112"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ textDecoration: 'none', flex: 1, padding: '0.6rem', fontSize: '0.78rem' }}
          >
            <MessageSquare size={15} color="#25D366" /> WhatsApp
          </a>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="glass-card">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>Customer Intelligence</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div>📍 <strong>Address:</strong> Shop 14, Galaxy Plaza, Sector 62, Noida</div>
          <div>🏢 <strong>Interested in:</strong> Lifestyle Palms 3BHK East Facing</div>
          <div>💰 <strong>Verified Budget:</strong> ₹95 Lakhs (Self-funded + Loan)</div>
          <div>⏰ <strong>Tentative Site Visit:</strong> Saturday 11:00 AM</div>
        </div>
      </div>

      {/* Quick Agent Notes */}
      <div className="glass-card">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add Quick Field Note</h4>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Type field note or client observation..."
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            padding: '0.6rem',
            color: '#f8fafc',
            fontSize: '0.78rem',
            resize: 'none',
            height: '60px',
            marginBottom: '0.5rem',
          }}
        />
        <button
          onClick={handleAddNote}
          className="btn-secondary"
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem' }}
        >
          Save Note
        </button>
      </div>
    </div>
  );
}
