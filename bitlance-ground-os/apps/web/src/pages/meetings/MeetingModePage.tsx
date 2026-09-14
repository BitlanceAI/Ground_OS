import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Play, Upload, CheckCircle2, ChevronRight } from 'lucide-react';

type Phase = 'travel' | 'arrive' | 'meeting' | 'complete';

export default function MeetingModePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('travel');
  const [elapsed, setElapsed] = useState(0);
  const [meetingActive, setMeetingActive] = useState(false);

  useEffect(() => {
    let t: any;
    if (meetingActive) {
      t = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(t);
  }, [meetingActive]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const phases = [
    { id: 'travel', label: 'En Route', done: phase !== 'travel' },
    { id: 'arrive', label: 'Arrived & Verified', done: ['meeting', 'complete'].includes(phase) },
    { id: 'meeting', label: 'Meeting', done: phase === 'complete' },
    { id: 'complete', label: 'Complete', done: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Meeting Mode</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Visit: Rajesh Electronics · Aman Sharma</p>
      </div>

      {/* Phase Progress */}
      <div className="card-branded">
        <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
          {phases.map((p, i) => (
            <div key={p.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
              {i > 0 && (
                <div style={{
                  position: 'absolute', top: 16, left: 0, right: '50%',
                  height: 2,
                  background: p.done ? 'var(--color-brand)' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.5s'
                }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', zIndex: 1,
                background: p.done ? 'var(--color-brand)' : phase === p.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                border: `2px solid ${p.done ? 'var(--color-brand)' : phase === p.id ? 'var(--color-brand)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: p.done ? '#fff' : phase === p.id ? 'var(--color-brand-light)' : 'var(--color-text-muted)',
                fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.5s'
              }}>
                {p.done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: '0.7rem', color: phase === p.id ? 'var(--color-brand-light)' : 'var(--color-text-muted)', textAlign: 'center' }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Action Card */}
      {phase === 'travel' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗺️</div>
          <h3 style={{ marginBottom: '8px' }}>Heading to Rajesh Electronics</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '0.85rem' }}>
            Shop 14, Andheri West Market · 2.3 km away
          </p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            onClick={() => setPhase('arrive')}>
            I've Arrived at Location
          </button>
        </div>
      )}

      {phase === 'arrive' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📍</div>
          <h3 style={{ marginBottom: '8px' }}>Verify Your Location</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.85rem' }}>
            GPS will confirm you're within 50m of the destination
          </p>
          <div className="badge badge-success" style={{ margin: '0 auto 24px', display: 'inline-flex' }}>
            ✓ Location Verified — 12m accuracy
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            onClick={() => { setPhase('meeting'); setMeetingActive(true); }}>
            Start Meeting & Recording
          </button>
        </div>
      )}

      {phase === 'meeting' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          {/* Recording indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <div className="recording-indicator" />
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>RECORDING</span>
          </div>

          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '3.5rem', fontWeight: 800,
            color: 'var(--color-text-primary)', marginBottom: '8px', letterSpacing: '0.02em'
          }}>
            {formatTime(elapsed)}
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '0.85rem' }}>
            Meeting in progress · AI is listening
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <div className="ai-state ai-state-processing">Transcribing</div>
            <div className="ai-state ai-state-insight">Intent Detection</div>
          </div>

          <button
            className="btn btn-danger"
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            onClick={() => { setPhase('complete'); setMeetingActive(false); }}
          >
            <Square size={16} /> End Meeting
          </button>
        </div>
      )}

      {phase === 'complete' && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <CheckCircle2 size={48} color="var(--color-success)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Meeting Complete!</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.85rem' }}>
            Duration: {formatTime(elapsed)} · Recording uploaded
          </p>
          <div className="ai-state ai-state-processing" style={{ margin: '16px auto', display: 'inline-flex' }}>
            AI processing transcript...
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              Add Notes
            </button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => navigate('/meetings/m1/report')}>
              View AI Report <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Customer Context */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>Customer Context</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            ['Customer', 'Rajesh Kumar'],
            ['Business', 'Rajesh Electronics'],
            ['Lead Score', '86 · HIGH'],
            ['Requirement', '3BHK, ₹80L–₹1Cr'],
            ['Last Contact', 'WhatsApp today'],
            ['Objection (prev)', 'None'],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginTop: '2px' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
