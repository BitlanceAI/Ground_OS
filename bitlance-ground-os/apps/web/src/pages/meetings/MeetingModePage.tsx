import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Play, Upload, CheckCircle2, ChevronRight, User, Building, FileText } from 'lucide-react';

type Phase = 'arrive' | 'meeting' | 'complete';

export default function MeetingModePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('arrive');
  const [elapsed, setElapsed] = useState(0);
  const [meetingActive, setMeetingActive] = useState(false);
  
  const [businessName, setBusinessName] = useState('Rajesh Electronics');
  const [businessOwnerName, setBusinessOwnerName] = useState('Rajesh Kumar');
  const [purposeOfVisit, setPurposeOfVisit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let t: any;
    if (meetingActive) {
      t = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(t);
  }, [meetingActive]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const phases = [
    { id: 'arrive', label: 'Arrived & Details', done: ['meeting', 'complete'].includes(phase) },
    { id: 'meeting', label: 'Meeting', done: phase === 'complete' },
    { id: 'complete', label: 'Complete', done: false },
  ];

  const handleStartMeeting = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:4000/api/v1/meetings/m1/pre-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, businessOwnerName, purposeOfVisit })
      });
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
    setPhase('meeting'); 
    setMeetingActive(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Meeting Mode</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Visit: {businessName} · {businessOwnerName}</p>
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
      {phase === 'arrive' && (
        <div className="card" style={{ padding: '32px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📍</div>
            <h3 style={{ marginBottom: '8px' }}>Location Verified</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Please confirm the business details before starting the meeting recording.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                <Building size={14} /> Business Name
              </label>
              <input 
                type="text" 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'white' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                <User size={14} /> Business Owner Name
              </label>
              <input 
                type="text" 
                value={businessOwnerName} 
                onChange={(e) => setBusinessOwnerName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                <FileText size={14} /> Purpose of Visit
              </label>
              <textarea 
                value={purposeOfVisit} 
                onChange={(e) => setPurposeOfVisit(e.target.value)}
                placeholder="E.g., Pitching new 3BHK inventory, discussing pricing..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'white', minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            onClick={handleStartMeeting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Start Meeting & Recording'}
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
          <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Meeting Complete!</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '8px', fontSize: '0.85rem' }}>
            Duration: {formatTime(elapsed)} · Summary sent to {businessOwnerName} via WhatsApp
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
    </div>
  );
}
