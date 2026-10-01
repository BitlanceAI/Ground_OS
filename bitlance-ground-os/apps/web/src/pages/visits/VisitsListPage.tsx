import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, Clock, ChevronRight, Plus, 
  User, Building, Phone, FileText, CheckCircle2, 
  Trash2, X, AlertCircle, Sparkles, Navigation, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { geocodeAddress, searchPlaces, getCurrentDeviceLocation, PlaceSuggestion } from '../../lib/geocoder';

export interface Visit {
  id: string;
  customerName: string;
  business: string;
  location: string;
  lat?: number;
  lng?: number;
  date?: string;
  time: string;
  status: 'upcoming' | 'completed' | 'in_progress';
  type: string;
  phone?: string;
  notes?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'NORMAL';
}

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
    return [];
  });

  // Load completed meeting notes to check closed status
  const meetingNotes = (() => {
    try {
      const saved = localStorage.getItem('meeting_notes_m1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  // Save to localStorage whenever visits change
  useEffect(() => {
    try {
      localStorage.setItem('ground_os_agent_visits', JSON.stringify(visits));
    } catch (e) {
      console.error(e);
    }
  }, [visits]);

  // Request browser GPS position on mount to track agent in Delhi
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('ground_os_agent_location', JSON.stringify(loc));
          window.dispatchEvent(new Event('storage'));
        },
        (err) => {
          // Default agent location in Delhi NCR
          const defaultDelhi = {
            lat: 28.5921,
            lng: 77.0460,
            address: 'Dwarka, New Delhi',
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem('ground_os_agent_location', JSON.stringify(defaultDelhi));
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Plan Visit Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [business, setBusiness] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Site Visit');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'NORMAL'>('HIGH');
  const [notes, setNotes] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const remainingCount = visits.filter(v => v.status === 'upcoming' && !(meetingNotes && (meetingNotes.businessName === v.business || meetingNotes.businessOwnerName === v.customerName))).length;

  const handleLocationInputChange = async (val: string) => {
    setLocation(val);
    setSelectedCoords(null);
    if (val.trim().length >= 2) {
      setIsSearchingPlaces(true);
      setShowSuggestions(true);
      try {
        const res = await searchPlaces(val);
        setSuggestions(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingPlaces(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: PlaceSuggestion) => {
    setLocation(item.displayName);
    setSelectedCoords({ lat: item.lat, lng: item.lng });
    setShowSuggestions(false);
    toast.success(`Location pinned on map: ${item.name || item.displayName}`);
  };

  const handleUseCurrentGPS = async () => {
    setIsDetectingGPS(true);
    try {
      const loc = await getCurrentDeviceLocation();
      setLocation(loc.address);
      setSelectedCoords({ lat: loc.lat, lng: loc.lng });
      localStorage.setItem('ground_os_agent_location', JSON.stringify({ ...loc, isLiveGPS: true }));
      window.dispatchEvent(new Event('storage'));
      toast.success(`Agent GPS locked: ${loc.address}`);
    } catch (err: any) {
      toast.error(err?.message || 'Could not fetch device GPS');
    } finally {
      setIsDetectingGPS(false);
    }
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !business.trim() || !location.trim()) {
      toast.error('Please fill in Customer Name, Business, and Location.');
      return;
    }

    setIsGeocoding(true);
    let coords = selectedCoords;
    if (!coords) {
      const resolved = await geocodeAddress(location, business);
      coords = { lat: resolved.lat, lng: resolved.lng };
    }
    setIsGeocoding(false);

    const newVisit: Visit = {
      id: `v-${Date.now()}`,
      customerName: customerName.trim(),
      business: business.trim(),
      location: location.trim(),
      lat: coords.lat,
      lng: coords.lng,
      date: date.trim() || new Date().toISOString().split('T')[0],
      time: time.trim() || '17:30',
      status: 'upcoming',
      type,
      phone: phone.trim(),
      notes: notes.trim(),
      priority,
    };

    setVisits(prev => [newVisit, ...prev]);
    setIsPlanModalOpen(false);
    toast.success(`Visit to ${customerName} (${business}) mapped at ${location.trim()}!`);

    // Reset fields
    setCustomerName('');
    setBusiness('');
    setPhone('');
    setLocation('');
    setSelectedCoords(null);
    setSuggestions([]);
    setDate('');
    setTime('');
    setNotes('');
  };

  const handleStartVisit = async (visit: Visit) => {
    // If meeting is already closed, prevent restarting
    if (visit.status === 'completed' || (meetingNotes && (meetingNotes.businessName === visit.business || meetingNotes.businessOwnerName === visit.customerName))) {
      toast.error('This meeting has already concluded and closed.');
      navigate('/meetings/m1/report');
      return;
    }

    // Resolve accurate destination coordinates
    const coords = (visit.lat && visit.lng) ? { lat: visit.lat, lng: visit.lng } : await geocodeAddress(visit.location);

    // Update visit status to in_progress
    setVisits(prev => prev.map(v => v.id === visit.id ? { ...v, status: 'in_progress', lat: coords.lat, lng: coords.lng } : v));

    // Broadcast active visit tracking for CEO panel and Google Map
    const trackingPayload = {
      visitId: visit.id,
      name: visit.customerName,
      business: visit.business || visit.customerName,
      address: visit.location || 'Dwarka Delhi',
      lat: coords.lat,
      lng: coords.lng,
      status: 'IN_PROGRESS',
      agentName: 'Nilesh Somnawane',
      startedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('ground_os_active_visit_tracking', JSON.stringify(trackingPayload));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }

    toast.success(`Checked in at ${visit.business || visit.customerName}! Live GPS broadcasting to CEO panel.`);

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

  const handleClearAll = () => {
    setVisits([]);
    try {
      localStorage.removeItem('ground_os_agent_visits');
      localStorage.removeItem('ground_os_active_visit_tracking');
      localStorage.removeItem('meeting_notes_m1');
      localStorage.removeItem('meeting_transcript_m1');
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
    toast.success('Cleared all visits and demo data.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 840, margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            My Visits Today
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
            Agent: <strong style={{ color: '#fff' }}>Nilesh Somnawane</strong> · Territory: <strong style={{ color: '#fff' }}>Delhi NCR</strong> · <strong style={{ color: 'var(--color-brand-light)' }}>{remainingCount} scheduled visits</strong> remaining.
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
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: 440, margin: '0 auto 20px' }}>
              Only client visits added by Agent Nilesh are shown here. Plan your visit to let Ground OS track meetings and route intelligence.
            </p>
            <button className="btn btn-primary" onClick={() => setIsPlanModalOpen(true)} style={{ gap: '8px' }}>
              <Plus size={16} /> Plan Your First Visit
            </button>
          </div>
        ) : (
          visits.map(visit => {
            const isClosed = visit.status === 'completed' || (
              meetingNotes && (meetingNotes.businessName === visit.business || meetingNotes.businessOwnerName === visit.customerName)
            );

            return (
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
                  borderLeft: isClosed 
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
                    {visit.date && (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                        {visit.date}
                      </div>
                    )}
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
                      {isClosed ? (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Meeting Closed</span>
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
                  {isClosed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Closed
                      </span>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => navigate('/meetings/m1/report')}
                        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      >
                        View Summary <ChevronRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleStartVisit(visit)}
                        style={{ padding: '10px 18px', gap: '6px' }}
                      >
                        {visit.status === 'in_progress' ? 'Resume Meeting' : 'Start Visit'} <ChevronRight size={16} />
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        onClick={() => handleDeleteVisit(visit.id, visit.customerName)}
                        title="Delete Visit"
                        style={{ padding: '10px', color: 'var(--color-text-muted)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
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
            padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="var(--color-brand-light)" />
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Plan Client Field Visit</h3>
              </div>
              <button 
                onClick={() => setIsPlanModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    <Building size={14} /> Shop / Business Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Sreejal Jewellers" 
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    <User size={14} /> Customer / Owner Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Uttam" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>
                      <MapPin size={14} /> Exact Location / Area *
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentGPS}
                      disabled={isDetectingGPS}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-brand-light)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                        padding: 0
                      }}
                      title="Fetch my real current GPS device location"
                    >
                      <Navigation size={12} /> {isDetectingGPS ? 'Detecting...' : 'Use My GPS'}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Search place, street or area..." 
                    value={location}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
                  />

                  {/* Verified Pin Tag */}
                  {selectedCoords && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                      <CheckCircle2 size={13} />
                      <span>Verified Pin: {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}</span>
                    </div>
                  )}

                  {/* Autocomplete Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#0d1424',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      zIndex: 200,
                      maxHeight: '180px',
                      overflowY: 'auto'
                    }}>
                      {suggestions.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(s)}
                          style={{
                            padding: '9px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#e2e8f0',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <MapPin size={13} color="var(--color-brand-light)" style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#fff' }}>{s.name}</strong> · <span style={{ color: '#94a3b8' }}>{s.displayName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    <Phone size={14} /> Contact Phone (WhatsApp)
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+91 98318 76890" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    <Calendar size={14} /> Scheduled Date
                  </label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    <Clock size={14} /> Scheduled Time
                  </label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  <FileText size={14} /> Visit Objective / Notes
                </label>
                <textarea 
                  rows={2}
                  placeholder="Purpose of visit and agenda..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
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
                  disabled={isGeocoding}
                >
                  {isGeocoding ? 'Locating...' : 'Schedule Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
