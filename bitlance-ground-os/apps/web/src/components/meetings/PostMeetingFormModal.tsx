import { useState } from 'react';
import {
  X, TrendingUp, Calendar, Tag, MessageSquare,
  IndianRupee, CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react';

export interface PostMeetingFormData {
  expectedDealValue: string;
  dealCurrency: 'INR' | 'USD';
  followUpStatus: 'INTERESTED' | 'NOT_INTERESTED' | 'FOLLOW_UP_NEEDED' | 'DEAL_CLOSED' | 'PRICING_OBJECTION';
  followUpDate: string;
  agentObservations: string;
  keyHighlights: string;
  productsDemoedOrDiscussed: string;
}

interface Props {
  businessName: string;
  businessOwnerName: string;
  onSubmit: (data: PostMeetingFormData) => void;
  onSkip: () => void;
}

const FOLLOW_UP_OPTIONS: { value: PostMeetingFormData['followUpStatus']; label: string; color: string; emoji: string }[] = [
  { value: 'INTERESTED', label: 'Interested – Send Proposal', color: '#10b981', emoji: '🟢' },
  { value: 'FOLLOW_UP_NEEDED', label: 'Follow-Up Needed', color: '#f59e0b', emoji: '🟡' },
  { value: 'PRICING_OBJECTION', label: 'Pricing Objection', color: '#f97316', emoji: '🟠' },
  { value: 'NOT_INTERESTED', label: 'Not Interested', color: '#ef4444', emoji: '🔴' },
  { value: 'DEAL_CLOSED', label: 'Deal Closed 🎉', color: '#6366f1', emoji: '🟣' },
];

export default function PostMeetingFormModal({ businessName, businessOwnerName, onSubmit, onSkip }: Props) {
  const [dealValue, setDealValue] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<PostMeetingFormData['followUpStatus']>('FOLLOW_UP_NEEDED');
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [agentObservations, setAgentObservations] = useState('');
  const [keyHighlights, setKeyHighlights] = useState('');
  const [productsDiscussed, setProductsDiscussed] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!dealValue.trim()) {
      setError('Please enter the expected deal value (or write "0" if none).');
      return;
    }
    setError('');
    onSubmit({
      expectedDealValue: dealValue.trim(),
      dealCurrency: 'INR',
      followUpStatus,
      followUpDate,
      agentObservations: agentObservations.trim(),
      keyHighlights: keyHighlights.trim(),
      productsDemoedOrDiscussed: productsDiscussed.trim(),
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(4, 9, 20, 0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: '16px',
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: '560px',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 24px 60px -12px rgba(0,0,0,0.8)',
        padding: '32px 28px',
        display: 'flex', flexDirection: 'column', gap: '22px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={20} color="var(--color-brand-light)" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Meeting Completed!</h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Fill in final details to generate your report
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              <strong style={{ color: '#fff' }}>{businessName}</strong> · Client: <strong style={{ color: '#fff' }}>{businessOwnerName}</strong>
            </p>
          </div>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Expected Deal Value */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <IndianRupee size={13} /> Expected Deal Value *
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)', fontSize: '0.95rem', fontWeight: 700,
              pointerEvents: 'none',
            }}>₹</span>
            <input
              type="text"
              value={dealValue}
              onChange={(e) => { setDealValue(e.target.value); setError(''); }}
              placeholder="e.g. 50000 or 2,50,000 or 0"
              style={{
                width: '100%', padding: '12px 14px 12px 30px',
                borderRadius: 'var(--radius-md)', border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
                background: 'var(--color-bg-elevated)', color: 'white', fontSize: '1rem',
                fontWeight: 700, fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-error)', fontSize: '0.78rem', marginTop: '5px' }}>
              <AlertCircle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Follow-up Status */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
            <Tag size={13} /> Client Status / Follow-Up
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {FOLLOW_UP_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFollowUpStatus(opt.value)}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-full)',
                  border: followUpStatus === opt.value ? `1.5px solid ${opt.color}` : '1px solid var(--color-border)',
                  background: followUpStatus === opt.value ? `${opt.color}22` : 'rgba(255,255,255,0.03)',
                  color: followUpStatus === opt.value ? opt.color : 'var(--color-text-secondary)',
                  fontSize: '0.8rem', fontWeight: followUpStatus === opt.value ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Next Follow-up Date */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <Calendar size={13} /> Next Follow-Up Date
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)', color: 'white', fontSize: '0.875rem',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Products / Services Discussed */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <TrendingUp size={13} /> Products / Services Demoed
          </label>
          <input
            type="text"
            value={productsDiscussed}
            onChange={(e) => setProductsDiscussed(e.target.value)}
            placeholder="e.g. Retail POS, Inventory Management, WhatsApp CRM"
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)', color: 'white', fontSize: '0.875rem',
            }}
          />
        </div>

        {/* Key Highlights */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <MessageSquare size={13} /> Key Highlights / Promises Made
          </label>
          <textarea
            value={keyHighlights}
            onChange={(e) => setKeyHighlights(e.target.value)}
            placeholder="e.g. Client promised to show it to his partner, requested demo again next week..."
            rows={2}
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)', color: 'white', fontSize: '0.875rem',
              fontFamily: 'inherit', resize: 'none',
            }}
          />
        </div>

        {/* Agent Observations */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <MessageSquare size={13} /> Additional Agent Observations
          </label>
          <textarea
            value={agentObservations}
            onChange={(e) => setAgentObservations(e.target.value)}
            placeholder="e.g. Client seemed hesitant about pricing, shop had 3 billing counters, competitor was Tally..."
            rows={2}
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)', color: 'white', fontSize: '0.875rem',
              fontFamily: 'inherit', resize: 'none',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onSkip}
            style={{
              flex: 0.6, padding: '12px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.03)',
              color: 'var(--color-text-secondary)', fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            style={{
              flex: 1, padding: '13px', justifyContent: 'center', gap: '8px',
              fontWeight: 700, fontSize: '0.9rem',
            }}
          >
            Generate AI Report <ChevronRight size={16} />
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Your inputs + meeting transcript will be used to generate a comprehensive AI report sent to CEO via WhatsApp
        </p>
      </div>
    </div>
  );
}
