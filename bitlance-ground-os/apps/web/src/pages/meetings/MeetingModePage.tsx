import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Mic, Square, Play, Upload, CheckCircle2, ChevronRight, 
  User, Building, FileText, Edit3, X, Save, Clock, Tag, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

type Phase = 'arrive' | 'meeting' | 'complete';

export default function MeetingModePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<Phase>('arrive');
  const [elapsed, setElapsed] = useState(0);
  const [meetingActive, setMeetingActive] = useState(false);
  
  const [businessName, setBusinessName] = useState(() => {
    return (location.state as any)?.business || '';
  });
  const [businessOwnerName, setBusinessOwnerName] = useState(() => {
    return (location.state as any)?.customerName || '';
  });
  const [purposeOfVisit, setPurposeOfVisit] = useState(() => {
    return (location.state as any)?.purpose || '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agent Notes State
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('meeting_notes_m1');
      return saved ? JSON.parse(saved).notes || '' : '';
    } catch {
      return '';
    }
  });
  const [outcomeTag, setOutcomeTag] = useState(() => {
    try {
      const saved = localStorage.getItem('meeting_notes_m1');
      return saved ? JSON.parse(saved).outcome || 'High Intent' : 'High Intent';
    } catch {
      return 'High Intent';
    }
  });
  const [nextAction, setNextAction] = useState(() => {
    try {
      const saved = localStorage.getItem('meeting_notes_m1');
      return saved ? JSON.parse(saved).nextAction || 'Send pricing quotation over WhatsApp' : 'Send pricing quotation over WhatsApp';
    } catch {
      return 'Send pricing quotation over WhatsApp';
    }
  });
  const [notesSaved, setNotesSaved] = useState(() => {
    return !!localStorage.getItem('meeting_notes_m1');
  });

  const handleSaveNotes = () => {
    if (!meetingNotes.trim()) {
      toast.error('Please enter meeting notes before saving.');
      return;
    }
    const payload = {
      notes: meetingNotes,
      outcome: outcomeTag,
      nextAction: nextAction,
      businessName,
      businessOwnerName,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('meeting_notes_m1', JSON.stringify(payload));
    } catch (e) {
      console.error(e);
    }
    setNotesSaved(true);
    setIsNotesModalOpen(false);
    toast.success('Meeting notes saved successfully!');
  };

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
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {businessName ? `Visit: ${businessName} · ${businessOwnerName}` : 'Enter business and client details to start'}
        </p>
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
                width: 32, height: 32, borderRadius: 'var(--radius-full)', zIndex: 1,
                background: p.done ? 'var(--color-brand)' : phase === p.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
                border: `2px solid ${p.done ? 'var(--color-brand)' : phase === p.id ? 'var(--color-brand)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: p.done ? '#fff' : phase === p.id ? 'var(--color-brand-light)' : 'var(--color-text-muted)',
                fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.5s'
              }}>
                {p.done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: '0.75rem', color: phase === p.id ? 'var(--color-brand-light)' : 'var(--color-text-muted)', textAlign: 'center' }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Action Card */}
      {phase === 'arrive' && (
        <div className="card" style={{ padding: '32px 24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📍</div>
            <h3 style={{ marginBottom: '8px' }}>Location Verified</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Please confirm the business details before starting the meeting recording.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                <Building size={14} /> Business Name *
              </label>
              <input 
                type="text" 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business or shop name (e.g. Acme Corp)"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'white', fontSize: '0.875rem' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                <User size={14} /> Business Owner Name *
              </label>
              <input 
                type="text" 
                value={businessOwnerName} 
                onChange={(e) => setBusinessOwnerName(e.target.value)}
                placeholder="Enter client / owner name (e.g. Rahul Sharma)"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', color: 'white', fontSize: '0.875rem' }}
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
        <div className="card" style={{ textAlign: 'center', padding: '40px', position: 'relative' }}>
          <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Meeting Complete!</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '0.875rem' }}>
            Duration: {formatTime(elapsed)} · Summary sent to {businessOwnerName} via WhatsApp
          </p>
          <div className="ai-state ai-state-processing" style={{ margin: '16px auto', display: 'inline-flex' }}>
            AI processing transcript...
          </div>

          {/* Saved Agent Notes Preview */}
          {notesSaved && meetingNotes && (
            <div style={{
              textAlign: 'left',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              margin: '20px 0 8px 0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-light)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={13} color="var(--color-success)" /> Agent Notes Saved
                </span>
                <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>{outcomeTag}</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '10px', lineHeight: 1.5 }}>
                {meetingNotes}
              </p>
              {nextAction && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="var(--color-warning)" />
                  <span><strong>Next Action:</strong> {nextAction}</span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
              onClick={() => setIsNotesModalOpen(true)}
            >
              <Edit3 size={15} />
              {notesSaved && meetingNotes ? 'Edit Notes' : 'Add Notes'}
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, justifyContent: 'center', gap: '8px' }}
              onClick={() => navigate('/meetings/m1/report')}
            >
              View AI Report <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Notes Modal */}
      {isNotesModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(9, 14, 26, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '520px',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="var(--color-brand-light)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Add Meeting Notes</h3>
              </div>
              <button 
                onClick={() => setIsNotesModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Record crucial field observations and next steps for {businessOwnerName} ({businessName}).
            </p>

            {/* Outcome Tag Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Meeting Outcome / Intent
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['High Intent', 'Pricing Objection', 'Financing Needed', 'Follow-up Scheduled', 'Closed / Won'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setOutcomeTag(tag)}
                    className="badge"
                    style={{
                      cursor: 'pointer',
                      border: outcomeTag === tag ? '1px solid var(--color-brand)' : '1px solid var(--color-border-subtle)',
                      background: outcomeTag === tag ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                      color: outcomeTag === tag ? '#fff' : 'var(--color-text-secondary)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      textTransform: 'none'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Content */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Field Notes & Client Objections
              </label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="E.g., Client loved the 3BHK layout; objected to 2027 delivery date; agreed to review payment structure if 10% discount on down payment is approved..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                  color: 'white',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Next Action Item */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Action Item / Next Follow-up
              </label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="E.g., Send updated pricing sheet and call on Tuesday"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsNotesModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveNotes}
                style={{ gap: '6px' }}
              >
                <Save size={15} /> Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
