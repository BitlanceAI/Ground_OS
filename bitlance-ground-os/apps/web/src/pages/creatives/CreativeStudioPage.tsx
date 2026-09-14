import { useState } from 'react';
import { Palette, Zap, Download, Send, CheckCircle2, Image } from 'lucide-react';

const CREATIVES = [
  {
    id: 'cr1', customer: 'Rajesh Kumar', type: 'WHATSAPP_CREATIVE',
    title: 'Payment Plan Card — 3BHK',
    status: 'READY',
    brief: 'Address Prestige price objection. Highlight 20-40-40 plan. Show school proximity.',
    messages: ['20-40-40 Construction-Linked Plan', '3 min from DPS & Ryan International', 'RERA Registered P51800048924', 'Premium Andheri West Location'],
    tone: 'Professional, Reassuring',
  },
  {
    id: 'cr2', customer: 'Kavitha Nair', type: 'BROCHURE',
    title: 'Site Visit Confirmation',
    status: 'GENERATING',
    brief: 'Site visit scheduled for this weekend. Highlight amenities and floor plan.',
    messages: [],
    tone: 'Warm, Inviting',
  },
];

export default function CreativeStudioPage() {
  const [selected, setSelected] = useState('cr1');
  const [generating, setGenerating] = useState(false);
  const creative = CREATIVES.find(c => c.id === selected) || CREATIVES[0];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={24} color="var(--color-brand-light)" />
            Creative Studio
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            AI-generated marketing assets based on meeting intelligence
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate}>
          <Zap size={14} /> Generate New Creative
        </button>
      </div>

      <div className="grid-2">
        {/* Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ marginBottom: '4px' }}>Creative Queue</h3>
          {CREATIVES.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: selected === c.id ? 'var(--color-brand)' : undefined,
                background: selected === c.id ? 'rgba(99,102,241,0.06)' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{c.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.customer} · {c.type}</div>
                </div>
                <span className={`badge ${c.status === 'READY' ? 'badge-success' : 'badge-warning'}`}>
                  {c.status}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{c.brief}</p>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {creative.status === 'READY' ? (
            <>
              {/* Creative Preview Card */}
              <div style={{
                borderRadius: '16px', overflow: 'hidden',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                padding: '32px', position: 'relative'
              }}>
                {/* Decorative */}
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'absolute', bottom: -30, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-head)' }}>
                    LIFESTYLE HOMES
                  </div>
                  <h2 style={{ color: '#fff', fontSize: '1.4rem', fontFamily: 'var(--font-head)', marginBottom: '6px', lineHeight: 1.2 }}>
                    Flexible Payment Plan
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Dream 3BHK · Andheri West
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {creative.messages.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a5b4fc', flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem' }}>{m}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Starting from</div>
                      <div style={{ color: '#fff', fontFamily: 'var(--font-head)', fontSize: '1.5rem', fontWeight: 800 }}>₹80 Lakhs</div>
                    </div>
                    <div style={{
                      background: '#fff', color: '#4338ca', borderRadius: '8px',
                      padding: '6px 14px', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-head)'
                    }}>
                      Book Site Visit
                    </div>
                  </div>
                </div>
              </div>

              {/* Brief */}
              <div className="card">
                <h3 style={{ marginBottom: '10px' }}>Creative Brief</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>TYPE</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{creative.type}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>TONE</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{creative.tone}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{creative.brief}</p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Download size={14} /> Download
                </button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Send size={14} /> Send via WhatsApp
                </button>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
              <div className="ai-state ai-state-processing" style={{ display: 'inline-flex', marginBottom: '16px' }}>
                {generating ? 'Generating...' : 'AI Processing'}
              </div>
              <h3 style={{ marginBottom: '8px' }}>Creative Generation in Progress</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                AI is crafting a personalized creative based on meeting insights
              </p>
              {generating && (
                <div style={{ marginTop: '20px' }}>
                  {['Analysing brief...', 'Generating layout...', 'Applying brand...'].map((step, i) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', justifyContent: 'center' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? 'var(--color-brand)' : 'var(--color-text-muted)', animation: 'pulse-beat 1s ease-in-out infinite' }} />
                      <span style={{ fontSize: '0.8rem', color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
