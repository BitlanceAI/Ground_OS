import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';

export default function VisitsListPage() {
  const navigate = useNavigate();

  // Mock data for Nilesh's visits today
  const visits = [
    {
      id: 'v1',
      customerName: 'Rajesh Kumar',
      business: 'Rajesh Electronics',
      location: 'Shop 14, Andheri West Market',
      time: '14:30 PM',
      status: 'upcoming',
      type: 'Site Visit',
    },
    {
      id: 'v2',
      customerName: 'Sneha Kulkarni',
      business: 'Lifestyle Grand',
      location: 'Versova',
      time: '16:00 PM',
      status: 'upcoming',
      type: 'Follow-up',
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: 800, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>My Visits Today</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>You have 2 scheduled visits remaining.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {visits.map(visit => (
          <div key={visit.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ color: 'var(--color-brand-light)', fontWeight: 700, fontSize: '1.1rem' }}>{visit.time}</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{visit.type}</div>
              </div>
              
              <div style={{ width: '1px', height: '40px', background: 'var(--color-border-subtle)' }} />
              
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{visit.customerName}</h3>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {visit.location}</span>
                </div>
              </div>
            </div>

            <div>
              {visit.id === 'v1' ? (
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate('/meetings/m1')}
                  style={{ padding: '10px 20px' }}
                >
                  Start Visit <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn-secondary" disabled>
                  Scheduled
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
