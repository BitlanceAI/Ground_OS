import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Sparkles, Shield, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MeetingWorkspacePage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(true);
  const [seconds, setSeconds] = useState(148); // ~2m 28s
  const [activeObjectionHint, setActiveObjectionHint] = useState<string | null>(
    'Detected mention of DLF Sky ₹88L. Reminder: Highlight 80% carpet area ratio (1320 sq.ft net usable).'
  );

  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndMeeting = () => {
    setIsRecording(false);
    toast.loading('Uploading audio & generating AI Intelligence Report...', { duration: 1500 });
    setTimeout(() => {
      toast.success('AI Meeting Report Ready!');
      navigate('/report/mtg-001');
    }, 1600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Meeting Status */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <div className="pulse-dot" style={{ backgroundColor: isRecording ? '#ef4444' : '#64748b' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isRecording ? '#f87171' : '#94a3b8', letterSpacing: '0.05em' }}>
            {isRecording ? 'LIVE AUDIO RECORDING IN PROGRESS' : 'MEETING PAUSED'}
          </span>
        </div>

        <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#f8fafc', letterSpacing: '-0.02em' }}>
          {formatTimer(seconds)}
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Rajesh Kumar · Lifestyle Palms 3BHK
        </div>

        {/* Live Animated Audio Waveform */}
        {isRecording && (
          <div className="waveform-bars" style={{ marginTop: '1rem' }}>
            {[20, 45, 80, 50, 95, 60, 40, 75, 90, 30, 85, 60, 40, 70, 95, 50, 65, 85, 40, 60].map((h, i) => (
              <div
                key={i}
                className="wave-bar"
                style={{
                  height: `${h}%`,
                  animationDelay: `${(i % 5) * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Real-time AI Co-Pilot / Objection Assist Card */}
      {activeObjectionHint && (
        <div className="glass-card" style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
            <Sparkles size={16} color="#f87171" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5' }}>
              LIVE OBJECTION COPILOT
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#f8fafc', lineHeight: 1.4 }}>
            {activeObjectionHint}
          </p>
        </div>
      )}

      {/* Live STT Transcript Preview */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Live Speech-to-Text Stream
          </h4>
          <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)' }}>STT Active (99.2%)</span>
        </div>

        <div style={{
          maxHeight: '140px',
          overflowY: 'auto',
          fontSize: '0.78rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          <div>
            <strong style={{ color: 'var(--accent-gold)' }}>Aman:</strong> "The all-inclusive launch price for East-facing units on 7th floor is ₹96.5 Lakhs..."
          </div>
          <div>
            <strong style={{ color: 'var(--accent-blue)' }}>Rajesh Kumar:</strong> "DLF Sky is offering 3BHK in Sector 63 for ₹88 Lakhs. Why is Lifestyle Palms higher?"
          </div>
          <div>
            <strong style={{ color: 'var(--accent-gold)' }}>Aman:</strong> "DLF's super-to-carpet efficiency is only 68%, giving you 1150 sq.ft carpet, whereas ours is 80%..."
          </div>
        </div>
      </div>

      {/* End Meeting CTA */}
      <button
        className="btn-primary"
        onClick={handleEndMeeting}
        style={{
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff',
          padding: '1rem',
          marginTop: 'auto',
        }}
      >
        <Square size={18} fill="#fff" /> End Meeting & Generate Intelligence
      </button>
    </div>
  );
}
