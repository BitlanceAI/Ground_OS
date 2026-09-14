import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, CheckCircle2, TrendingUp, Award, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING');

  const todayVisits = [
    {
      id: 'vis-001',
      customer: 'Rajesh Kumar',
      business: 'Rajesh Electronics & Appliances',
      time: '11:15 AM',
      location: 'Galaxy Plaza, Sector 62, Noida',
      status: 'IN_PROGRESS',
      intent: 'VERY_HIGH',
      intentScore: 91,
      dealValue: '₹96.5 L',
      notes: 'Requested 3BHK East-facing floor plan on WhatsApp.',
    },
    {
      id: 'vis-002',
      customer: 'Pooja Gupta',
      business: 'Fintech Solutions',
      time: '02:00 PM',
      location: 'Advant Navis, Sector 142, Noida',
      status: 'SCHEDULED',
      intent: 'HIGH',
      intentScore: 78,
      dealValue: '₹1.35 Cr',
      notes: 'Looking for 3BHK + Servant unit with payment plan.',
    },
    {
      id: 'vis-003',
      customer: 'Deepak Rao',
      business: 'Apex Logistics',
      time: '04:15 PM',
      location: 'Sector 63 Commercial Hub, Noida',
      status: 'SCHEDULED',
      intent: 'MEDIUM',
      intentScore: 65,
      dealValue: '₹82 L',
      notes: 'Initial inquiry on 2BHK rental yields.',
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Today Target Card */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Today's Target & Performance
          </span>
          <span className="badge badge-gold">
            <Award size={12} /> Top Performer
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)' }}>3 / 6</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Visits Done</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>92%</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AI Meeting Quality</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>₹2.8 Cr</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Active Pipeline</div>
          </div>
        </div>
      </div>

      {/* AI Ground Dispatcher Alert */}
      <div className="glass-card" style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}>
        <Zap size={22} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>Urgent Hot Lead Dispatched</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Rajesh Kumar is at Galaxy Plaza (800m away). Ready with 3BHK brochure & carpet comparison.
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>Today's Ground Route</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>3 Visits Remaining</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {todayVisits.map((visit) => (
            <div
              key={visit.id}
              className="glass-card"
              style={{
                cursor: 'pointer',
                borderLeft: visit.status === 'IN_PROGRESS' ? '3px solid var(--accent-gold)' : '1px solid var(--border-color)',
                padding: '1rem',
              }}
              onClick={() => navigate(`/visit/${visit.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{visit.customer}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{visit.business}</div>
                </div>
                <span className={visit.intent === 'VERY_HIGH' ? 'badge badge-gold' : 'badge badge-blue'}>
                  {visit.intent.replace('_', ' ')} · {visit.intentScore}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Clock size={13} /> {visit.time}
                <span style={{ opacity: 0.4 }}>•</span>
                <MapPin size={13} /> {visit.location}
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '0.5rem 0.65rem',
                borderRadius: '0.4rem',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.75rem',
              }}>
                💬 {visit.notes}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  {visit.dealValue}
                </span>
                <button
                  className={visit.status === 'IN_PROGRESS' ? 'btn-primary' : 'btn-secondary'}
                  style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/visit/${visit.id}`);
                  }}
                >
                  {visit.status === 'IN_PROGRESS' ? 'Resume Visit' : 'Start Navigation'} <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
