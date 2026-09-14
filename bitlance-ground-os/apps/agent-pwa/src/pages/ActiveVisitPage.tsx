import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Navigation, CheckCircle, ShieldCheck, Play, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ActiveVisitPage() {
  const navigate = useNavigate();
  const { visitId } = useParams();

  const [geofenceVerified, setGeofenceVerified] = useState(true);
  const [distanceMeters, setDistanceMeters] = useState(8);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyGPS = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setGeofenceVerified(true);
      setDistanceMeters(6);
      toast.success('Geofence Verified! Within 6 meters of Rajesh Electronics.');
    }, 800);
  };

  const handleStartMeeting = () => {
    toast.success('Meeting Mode Activated. Recording Started.');
    navigate('/meeting/mtg-001');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Customer Banner */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <span className="badge badge-gold" style={{ marginBottom: '0.4rem' }}>ACTIVE VISIT</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Rajesh Kumar</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rajesh Electronics & Appliances</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹96.5 L</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Target 3BHK</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <a
            href="tel:+919876500112"
            className="btn-secondary"
            style={{ textDecoration: 'none', flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
          >
            <Phone size={14} color="#10b981" /> Call Customer
          </a>
          <button
            onClick={() => navigate('/customer/cust-rajesh-01')}
            className="btn-secondary"
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.78rem' }}
          >
            <MessageSquare size={14} color="#3b82f6" /> View 360 Intel
          </button>
        </div>
      </div>

      {/* Geofence Radar Card */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: geofenceVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          border: `2px solid ${geofenceVerified ? '#10b981' : '#f59e0b'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.75rem',
          boxShadow: geofenceVerified ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
        }}>
          {geofenceVerified ? <ShieldCheck size={36} color="#10b981" /> : <Navigation size={36} color="#f59e0b" />}
        </div>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
          {geofenceVerified ? 'Location Verified & Authenticated' : 'Checking Geofence Proximity'}
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>
          {geofenceVerified
            ? `Verified within ${distanceMeters}m of customer destination (Geofence SLA: <100m)`
            : 'You are en-route. Tap below to verify GPS lock on arrival.'}
        </p>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleVerifyGPS}
            disabled={isVerifying}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.65rem' }}
          >
            <MapPin size={15} /> {isVerifying ? 'Verifying GPS...' : 'Re-verify GPS'}
          </button>
        </div>
      </div>

      {/* AI Meeting Prep Intel */}
      <div className="glass-card">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: '#fbbf24' }}>
          ⚡ AI Pre-Meeting Briefing
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.4rem' }}>
            <strong style={{ color: '#f8fafc' }}>Key Preference:</strong> 3BHK, min 1600 sq.ft, East-facing, 2 parkings.
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.4rem' }}>
            <strong style={{ color: '#f8fafc' }}>Expected Objection:</strong> Mentions DLF Sky price at ₹88L. Counter with 80% usable carpet efficiency (1320 sq.ft vs 1150 sq.ft).
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.4rem' }}>
            <strong style={{ color: '#f8fafc' }}>Target Action:</strong> Secure Saturday 11:00 AM on-site visit commitment.
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <button className="btn-primary" onClick={handleStartMeeting} style={{ padding: '1rem' }}>
        <Play size={18} fill="#000" /> Start Meeting Mode & Record Audio
      </button>
    </div>
  );
}
