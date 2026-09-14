import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CheckCircle2, Navigation2, ChevronRight, ShieldCheck, Camera } from 'lucide-react';

export default function VisitDetailPage() {
  const navigate = useNavigate();

  const visitEvents = [
    { type: 'ASSIGNED', time: '10:00', label: 'Visit Assigned', detail: 'Aman assigned to Rajesh Electronics', color: '#6366f1' },
    { type: 'DEPARTED', time: '10:20', label: 'Agent Departed', detail: 'Left from Andheri West base', color: '#818cf8' },
    { type: 'ARRIVED', time: '10:41', label: 'Arrived at Location', detail: '12m GPS accuracy · Shop 14, Andheri West', color: '#22d3ee' },
    { type: 'CUSTOMER_VERIFIED', time: '10:42', label: 'Customer Verified', detail: 'OTP matched. Geo-tagged Selfie captured.', color: '#10b981' },
    { type: 'LOCATION_VERIFIED', time: '10:42', label: 'Location Verified', detail: 'GPS verified — within 50m of destination', color: '#10b981' },
    { type: 'MEETING_STARTED', time: '10:43', label: 'Meeting Started', detail: 'Recording active', color: '#f59e0b' },
    { type: 'MEETING_ENDED', time: '11:04', label: 'Meeting Ended', detail: 'Duration: 21 minutes', color: '#10b981' },
    { type: 'AI_PROCESSING', time: '11:04', label: 'AI Processing', detail: 'Transcript processing started', color: '#6366f1' },
    { type: 'REPORT_READY', time: '11:06', label: 'Report Ready', detail: 'AI analysis complete — Score: 78', color: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="badge badge-success" style={{ marginBottom: '8px' }}>REPORT READY</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Visit: Rajesh Electronics</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Agent: Aman Sharma · 14 Sep 2026 · Andheri West
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary">View Map</button>
          <button className="btn btn-primary" onClick={() => navigate('/meetings/m1/report')}>
            AI Report <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Visit Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-branded">
            <h3 style={{ marginBottom: '16px' }}>Visit Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { label: 'Destination', value: 'Rajesh Electronics, Shop 14' },
                { label: 'Distance', value: '2.3 km from base' },
                { label: 'Arrival Time', value: '10:41 AM' },
                { label: 'GPS Accuracy', value: '12 meters' },
                { label: 'Meeting Duration', value: '21 minutes' },
                { label: 'Report Status', value: 'AI Complete' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '2px' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status */}
          <div className="card" style={{ border: '1px solid var(--color-success)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
              <ShieldCheck size={18} /> Customer Verified
            </h3>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                <Camera size={24} color="var(--color-text-muted)" />
                {/* Mock image overlay */}
                <div style={{ position: 'absolute', width: '64px', height: '64px', background: 'url(https://i.pravatar.cc/150?img=11) center/cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-primary)' }}>OTP Authenticated</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Mobile: +91 98765 **112</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-brand-light)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <MapPin size={12} /> 19.1235° N, 72.8378° E
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div style={{
            height: 240, borderRadius: '12px', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0d1424, #111827)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '12px',
          }}>
            <MapPin size={32} color="var(--color-brand-light)" />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Visit route map — Andheri West
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              <span>📍 Origin: 19.076, 72.877</span>
              <span>🏁 Dest: 19.123, 72.837</span>
            </div>
          </div>
        </div>

        {/* Event Timeline */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--color-brand-light)" />
            Visit Event Log
          </h3>
          <div className="timeline">
            {visitEvents.map((e, i) => (
              <div key={e.type} className="timeline-item">
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: `${e.color}22`, border: `1.5px solid ${e.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '2px'
                }}>
                  <CheckCircle2 size={12} color={e.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text-primary)' }}>{e.label}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{e.time}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>{e.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
