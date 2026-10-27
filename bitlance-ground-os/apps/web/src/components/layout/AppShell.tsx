import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Mic, MessageSquare,
  Phone, Palette, GitBranch, BarChart3, Brain, LogOut,
  Menu, X, Navigation
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { agentsApi } from '../../lib/api';
import TopBar from './TopBar';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Command', to: '/command', title: 'CEO Command Center' },
  { icon: Users, label: 'Agents', to: '/agents', title: 'Field Agent Management & Leads' },
  { icon: MapPin, label: 'Visits', to: '/visits', title: 'Field Visits & Tracking' },
];

const agentNavItems = [
  { icon: MapPin, label: 'Visits', to: '/visits', title: 'My Field Visits' },
];

import { Component, ErrorInfo } from 'react';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#fee' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppShell() {
  const { user, organization, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'prompt' | 'granted' | 'denied' | 'syncing'>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAgent = (user?.role?.toUpperCase() === 'AGENT' || user?.role?.toUpperCase() === 'FIELD_AGENT' || Boolean(user?.agentId) || user?.email?.includes('agent')) && user?.role !== 'CEO' && user?.role !== 'ADMIN';
  const navItems = isAgent ? agentNavItems : adminNavItems;

  const sendLocation = useCallback(async (pos: GeolocationPosition, showToast = false) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    setGpsCoords({ lat, lng, accuracy });
    setGpsStatus('granted');

    const loc = {
      lat,
      lng,
      accuracy,
      agentId: user?.agentId,
      agentName: user ? `${user.firstName} ${user.lastName}`.trim() : 'Nilesh Somnawane',
      isLiveGPS: true,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('ground_os_agent_location', JSON.stringify(loc));
    if (user?.agentId) {
      localStorage.setItem(`ground_os_agent_location_${user.agentId}`, JSON.stringify(loc));
    }
    window.dispatchEvent(new Event('storage'));

    const agentId = user?.agentId || 'cmuqiadpb0003c0qqhzmw60r7';
    try {
      await agentsApi.updateLocation(agentId, {
        latitude: lat,
        longitude: lng,
        accuracy,
      });
      if (showToast) {
        toast.success(`📍 Real GPS synced: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Admin notified)`);
      }
    } catch (err) {}
  }, [user]);

  const requestGPS = useCallback((manual = true) => {
    if (!navigator.geolocation) {
      if (manual) toast.error('Geolocation is not supported by your browser');
      setGpsStatus('denied');
      return;
    }

    setGpsStatus('syncing');
    navigator.geolocation.getCurrentPosition(
      (pos) => sendLocation(pos, manual),
      (err) => {
        setGpsStatus('denied');
        if (manual) toast.error(`GPS permission error: ${err.message}. Please enable location in browser settings.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [sendLocation]);

  // Real-time GPS stream for field agents
  useEffect(() => {
    if (!isAgent || !navigator.geolocation) return;

    // Check existing stored location
    try {
      const saved = localStorage.getItem('ground_os_agent_location');
      if (saved) {
        const p = JSON.parse(saved);
        if (p?.lat && p?.lng && !(Math.abs(p.lat - 18.5204) < 0.05 && Math.abs(p.lng - 73.8567) < 0.05)) {
          setGpsCoords({ lat: p.lat, lng: p.lng, accuracy: p.accuracy });
          setGpsStatus('granted');
        }
      }
    } catch {}

    // Auto-prompt location
    requestGPS(false);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => sendLocation(pos, false),
      (err) => {
        console.warn('[Agent GPS] Watch notice:', err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied');
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );

    // Heartbeat every 15s to keep backend fresh
    const heartbeat = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos, false),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }, 15000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(heartbeat);
    };
  }, [isAgent, requestGPS, sendLocation]);

  return (
    <div className="app-shell">
      {/* Mobile Header Toggle */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-head)', fontWeight: 900,
            fontSize: '12px', color: '#fff'
          }}>GO</div>
          <span style={{ fontWeight: 700 }}>{organization?.name || 'Bitlance Ground OS'}</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)' }}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 'var(--topbar-height)',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Logo (Desktop) */}
        <div className="desktop-logo" style={{ marginBottom: '16px', padding: '0 10px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99,102,241,0.5)',
            fontFamily: 'var(--font-head)', fontWeight: 900,
            fontSize: '16px', color: '#fff', letterSpacing: '-0.5px'
          }}>
            GO
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', marginTop: '20px' }}>
          {navItems.map(({ icon: Icon, label, to, title }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={title}
            >
              <Icon size={24} />
              <span className="mobile-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', paddingBottom: '32px' }}>
          <button className="nav-item" onClick={handleLogout} title="Logout">
            <LogOut size={24} />
            <span className="mobile-nav-label">Logout</span>
          </button>

          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: '#fff',
            marginTop: '12px',
            border: '2px solid var(--color-bg-base)'
          }} title={user ? `${user.firstName} ${user.lastName} (${user.role})` : 'User'}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <div className="desktop-topbar">
          <TopBar organizationName={organization?.name || 'Bitlance Ground OS'} />
        </div>

        {/* Live GPS Broadcast Banner for Field Agents */}
        {isAgent && (
          <div style={{
            background: gpsStatus === 'granted'
              ? 'linear-gradient(90deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))'
              : gpsStatus === 'denied'
                ? 'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(239,68,68,0.04))'
                : 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
            borderBottom: '1px solid ' + (gpsStatus === 'granted' ? 'rgba(16,185,129,0.25)' : gpsStatus === 'denied' ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.3)'),
            padding: '9px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.82rem',
            position: 'sticky',
            top: 0,
            zIndex: 90,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: gpsStatus === 'granted' ? '#10b981' : gpsStatus === 'denied' ? '#ef4444' : '#6366f1',
                boxShadow: `0 0 8px ${gpsStatus === 'granted' ? '#10b981' : gpsStatus === 'denied' ? '#ef4444' : '#6366f1'}`,
              }} />
              <span>
                {gpsStatus === 'granted' && gpsCoords ? (
                  <>
                    <strong style={{ color: '#10b981' }}>Live GPS Broadcasting:</strong>{' '}
                    <span style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)' }}>
                      {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                    </span>
                    {gpsCoords.accuracy ? <span style={{ color: 'var(--color-text-muted)' }}> (±{Math.round(gpsCoords.accuracy)}m)</span> : null}
                    {' '}· Position syncing live to admin command map
                  </>
                ) : gpsStatus === 'denied' ? (
                  <>
                    <strong style={{ color: '#ef4444' }}>Location Access Blocked:</strong>{' '}
                    Please allow location access in your browser to transmit your coordinates to the Admin Command Center.
                  </>
                ) : (
                  <>
                    <strong style={{ color: 'var(--color-brand-light)' }}>Live GPS Location Required:</strong>{' '}
                    Please enable GPS so your real-time position appears on the Admin Panel and map.
                  </>
                )}
              </span>
            </div>
            <button
              onClick={() => requestGPS(true)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '4px 12px',
                borderColor: gpsStatus === 'granted' ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.4)',
                color: gpsStatus === 'granted' ? '#10b981' : '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Navigation size={12} className={gpsStatus === 'syncing' ? 'spin-icon' : ''} />
              {gpsStatus === 'granted' ? 'Sync GPS Now' : gpsStatus === 'syncing' ? 'Acquiring...' : 'Enable Live GPS'}
            </button>
          </div>
        )}

        <div className="page-content page-enter">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
