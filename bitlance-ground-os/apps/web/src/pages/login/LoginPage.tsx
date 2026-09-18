import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, ArrowRight, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

// Demo credentials for quick login
const DEMO_USERS = [
  { label: 'CEO', email: 'adminbitlance@gmail.com', password: 'demo1234', role: 'admin' },
  { label: 'Agent (Nilesh)', email: 'nilesh@lifestylehomes.in', password: 'demo1234', role: 'agent' },
];

// Mock login response
const MOCK_USERS: Record<string, object> = {
  'adminbitlance@gmail.com': {
    user: { id: 'u1', organizationId: 'org1', email: 'adminbitlance@gmail.com', firstName: 'Anurag', lastName: 'Dhole', role: 'admin' },
    organization: { id: 'org1', name: 'Lifestyle Homes', slug: 'lifestyle-homes', settings: { primaryColor: '#6366f1' } },
    tokens: { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' },
  },
  'nilesh@lifestylehomes.in': {
    user: { id: 'u3', organizationId: 'org1', email: 'nilesh@lifestylehomes.in', firstName: 'Nilesh', lastName: 'Kumar', role: 'agent' },
    organization: { id: 'org1', name: 'Lifestyle Homes', slug: 'lifestyle-homes', settings: { primaryColor: '#6366f1' } },
    tokens: { accessToken: 'mock_access_token', refreshToken: 'mock_refresh_token' },
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(r => setTimeout(r, 800));

    const mockData = MOCK_USERS[email];
    if (mockData && password === 'demo1234') {
      login(mockData as any);
      toast.success('Welcome to Bitlance Ground OS');
      navigate('/command');
    } else {
      toast.error('Invalid credentials. Use demo1234 as password.');
    }
    setLoading(false);
  };

  const quickLogin = async (demoUser: typeof DEMO_USERS[0]) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const mockData = MOCK_USERS[demoUser.email];
    if (mockData) {
      login(mockData as any);
      toast.success(`Logged in as ${demoUser.label}`);
      navigate('/command');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-base)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      overflow: 'hidden',
    }}>
      {/* Left — Branding */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        background: 'linear-gradient(135deg, #090e1a 0%, #0d1424 60%, #111827 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '30%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '64px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(99,102,241,0.5)',
            fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: '20px', color: '#fff',
          }}>GO</div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>BITLANCE</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 400, fontSize: '0.8rem', color: 'var(--color-brand-light)', letterSpacing: '0.15em' }}>GROUND OS</div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '3rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '24px' }}>
          Every ground{' '}
          <span style={{ background: 'linear-gradient(90deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            interaction
          </span>
          {' '}becomes business{' '}
          <span style={{ color: 'var(--color-brand-light)' }}>intelligence.</span>
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 420 }}>
          AI-powered field sales, meeting capture, WhatsApp automation, Voice AI continuation, and creative generation — unified in one command center.
        </p>

        {/* Pipeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '48px', flexWrap: 'wrap' }}>
          {['OBSERVE', 'UNDERSTAND', 'RECOMMEND', 'AUTOMATE', 'CONVERT'].map((step, i, arr) => (
            <>
              <span key={step} style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                color: i === 0 ? '#6366f1' : i === 4 ? '#10b981' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-head)',
              }}>{step}</span>
              {i < arr.length - 1 && <span key={`arrow-${i}`} style={{ color: 'var(--color-text-disabled)', fontSize: '0.65rem' }}>→</span>}
            </>
          ))}
        </div>
      </div>

      {/* Right — Login Form */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        background: 'var(--color-bg-surface)',
        borderLeft: '1px solid var(--color-border-subtle)',
      }}>
        <div style={{ maxWidth: 400 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1.75rem', marginBottom: '8px' }}>
            Sign in
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '40px' }}>
            Access your Ground OS command center
          </p>

          {/* Quick Demo Login */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Quick Demo Access
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => quickLogin(u)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  id={`quick-login-${u.role.toLowerCase()}`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>or sign in manually</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@lifestylehomes.in"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', marginTop: '8px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Security note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '32px', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
            <Shield size={12} />
            <span>Secured with JWT authentication & role-based access control</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
