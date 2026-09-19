import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Clock, ChevronRight, Plus, 
  User, Building, Phone, FileText, CheckCircle2, 
  Trash2, X, AlertCircle, Sparkles, Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface Visit {
  id: string;
  customerName: string;
  business: string;
  location: string;
  time: string;
  status: 'upcoming' | 'completed' | 'in_progress';
  type: string;
  phone?: string;
  notes?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'NORMAL';
}

const DEFAULT_VISITS: Visit[] = [];

export default function VisitsListPage() {
  const navigate = useNavigate();

  // Load persistent visits or start fresh
  const [visits, setVisits] = useState<Visit[]>(() => {
    try {
      const saved = localStorage.getItem('ground_os_agent_visits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_VISITS;
  });

  // Save to localStorage whenever visits change
  useEffect(() => {
    try {
      localStorage.setItem('ground_os_agent_visits', JSON.stringify(visits));
    } catch (e) {
      console.error(e);
    }
  }, [visits]);

  // Plan Visit Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [business, setBusiness] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('17:30 PM');
  const [type, setType] = useState('Site Visit');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'NORMAL'>('HIGH');
  const [notes, setNotes] = useState('');

  const remainingCount = visits.filter(v => v.status === 'upcoming').length;

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !business.trim() || !location.trim()) {
      toast.error('Please fill in Customer Name, Business, and Location.');
      return;
    }

    const newVisit: Visit = {
      id: `v-${Date.now()}`,
      customerName: customerName.trim(),
      business: business.trim(),
      location: location.trim(),
      time: time.trim() || '18:00 PM',
      status: 'upcoming',
      type,
      phone: phone.trim(),
      notes: notes.trim(),
      priority,
    };

    setVisits(prev => [newVisit, ...prev]);
    setIsPlanModalOpen(false);
    toast.success(`Visit to ${customerName} scheduled successfully!`);

    // Reset fields
    setCustomerName('');
    setBusiness('');
    setPhone('');
    setLocation('');
    setTime('17:30 PM');
    setNotes('');
  };

  const handleStartVisit = (visit: Visit) => {
    navigate('/meetings/m1', {
      state: {
        customerName: visit.customerName,
        business: visit.business,
        purpose: visit.notes || `${visit.type} at ${visit.location}`,
      }
    });
  };

  const handleDeleteVisit = (id: string, name: string) => {
    setVisits(prev => prev.filter(v => v.id !== id));
    toast.success(`Removed visit with ${name}`);
  };

  const handleMarkCompleted = (id: string) => {
    setVisits(prev => prev.map(v => v.id === id ? { ...v, status: 'completed' } : v));
    toast.success('Visit marked as completed');
  };

  const handleClearAll = () => {
    setVisits([]);
    try {
      localStorage.removeItem('ground_os_agent_visits');
      localStorage.removeItem('meeting_notes_m1');
    } catch (e) {
      console.error(e);
    }
    toast.success('Cleared all visits. Ready to test from the beginning!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 840, margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            My Visits Today
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            You have <strong style={{ color: 'var(--color-brand-light)' }}>{remainingCount} scheduled visits</strong> remaining.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {visits.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={handleClearAll}
              style={{ gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}
              title="Remove all visits and start fresh"
            >
              <Trash2 size={15} />
              Start Fresh
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={() => setIsPlanModalOpen(true)}
            style={{ gap: '8px', padding: '10px 18px', fontSize: '0.9rem', boxShadow: 'var(--shadow-brand)' }}
          >
            <Plus size={18} />
            Plan New Visit
          </button>
        </div>
      </div>

      {/* Visits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {visits.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Calendar size={48} color="var(--color-brand-light)" style={{ margin: '0 auto 16px', opacity: 0.7 }} />
            <h3 style={{ marginBottom: '8px' }}>No Visits Planned Yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 20px' }}>
              Plan your client interactions, site visits, and pitches for today to let Ground OS track meetings and route intelligence.
            </p>
            <button className="btn btn-primary" onClick={() => setIsPlanModalOpen(true)} style={{ gap: '8px' }}>
              <Plus size={16} /> Plan Your First Visit
            </button>
          </div>
        ) : (
          visits.map(visit => (
            <div 
              key={visit.id} 
              className="card" 
              style={{ 
                padding: '24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: visit.status === 'completed' 
                  ? '4px solid var(--color-success)' 
                  : visit.priority === 'HIGH' 
                    ? '4px solid var(--color-brand)' 
                    : '4px solid var(--color-border)'
              }}
            >
              {/* Left Details */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                <div style={{ textAlign: 'center', minWidth: '85px', flexShrink: 0 }}>
                  <div style={{ color: 'var(--color-brand-light)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {visit.time}
                  </div>
                  <div style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '0.75rem', 
                    marginTop: '4px',
                    background: 'rgba(255,255,255,0.04)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'inline-block'
                  }}>
                    {visit.type}
                  </div>
                </div>
                
                <div style={{ width: '1px', height: '54px', background: 'var(--color-border-subtle)' }} />
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                      {visit.customerName}
                    </h3>
                    {visit.status === 'completed' ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Completed</span>
                    ) : visit.priority === 'HIGH' ? (
                      <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>High Priority</span>
                    ) : null}
                  </div>

                  <div style={{ color: 'var(--color-brand-light)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                    {visit.business} {visit.phone && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>· {visit.phone}</span>}
                  </div>

                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <MapPin size={13} color="var(--color-brand-light)" /> 
                    <span>{visit.location}</span>
                  </div>

                  {visit.notes && (
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '0.78rem', 
                      color: 'var(--color-text-muted)',
                      background: 'rgba(99,102,241,0.05)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <FileText size={12} /> {visit.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {visit.status === 'completed' ? (
                  <button 
                    className="btn btn-ghost"
                    onClick={() => navigate('/meetings/m1/report')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    View Report <ChevronRight size={14} />
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleStartVisit(visit)}
                      style={{ padding: '10px 18px', gap: '6px' }}
                    >
                      Start Visit <ChevronRight size={16} />
                    </button>
                    <button 
                      className="btn btn-ghost"
                      onClick={() => handleDeleteVisit(visit.id, visit.customerName)}
                      title="Delete / Cancel Visit"
                      style={{ padding: '10px', color: 'var(--color-text-muted)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Plan New Visit Modal Dialog */}
      {isPlanModalOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(9, 14, 26, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 150, padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '560px',
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            padding: '28px',
            display: 'flex', flexDirection: 'column', gap: '20px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation size={18} color="var(--color-brand-light)" />
                  Plan & Schedule Visit
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Enter client details to organize your field route and record visits.
                </p>
              </div>
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Client & Business */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <User size={13} color="var(--color-brand-light)" /> Client Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g. Vikram Mehta"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Building size={13} color="var(--color-brand-light)" /> Business / Shop *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g. Mehta Jewellers"
                    value={business}
                    onChange={e => setBusiness(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Location & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <MapPin size={13} color="var(--color-brand-light)" /> Location / Address *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g. Linking Road, Bandra West"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Phone size={13} color="var(--color-brand-light)" /> Contact Phone
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+91 98200 12345"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Time, Type, Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Clock size={13} color="var(--color-brand-light)" /> Scheduled Time
                  </label>
                  <input 
                    type="text" 
                    placeholder="17:30 PM"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Visit Type
                  </label>
                  <select 
                    value={type}
                    onChange={e => setType(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none'
                    }}
                  >
                    <option value="Site Visit">Site Visit</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Product Pitch">Product Pitch</option>
                    <option value="Payment Collection">Payment Collection</option>
                    <option value="Contract Signing">Contract Signing</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select 
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none'
                    }}
                  >
                    <option value="HIGH">High Intent</option>
                    <option value="MEDIUM">Medium Intent</option>
                    <option value="NORMAL">Normal</option>
                  </select>
                </div>
              </div>

              {/* Purpose / Agenda */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  <FileText size={13} color="var(--color-brand-light)" /> Purpose / Agenda Notes
                </label>
                <textarea 
                  placeholder="E.g. Pitching Lifestyle Grand 3BHK premium floor plans; discuss payment milestone discount..."
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-elevated)', color: '#fff', fontSize: '0.875rem', outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setIsPlanModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ gap: '6px', padding: '10px 20px' }}
                >
                  <Calendar size={16} /> Schedule Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
