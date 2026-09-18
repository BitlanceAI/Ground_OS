import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Mic, MessageSquare,
  Phone, Palette, GitBranch, BarChart3, Brain, Settings, LogOut,
  Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import TopBar from './TopBar';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Command', to: '/command', title: 'Command Center' },
  { icon: Users, label: 'Field', to: '/agents', title: 'Field Agents' },
  { icon: MessageSquare, label: 'WhatsApp', to: '/whatsapp', title: 'WhatsApp Intelligence' },
  { icon: Phone, label: 'Voice', to: '/voice', title: 'Voice AI' },
  { icon: Palette, label: 'Creative', to: '/creatives', title: 'Creative Studio' },
  { icon: GitBranch, label: 'Automation', to: '/automation', title: 'Automation Builder' },
  { icon: Brain, label: 'Intelligence', to: '/intelligence', title: 'Executive Intelligence' },
];

const agentNavItems = [
  { icon: MapPin, label: 'Visits', to: '/visits', title: 'My Visits' },
  { icon: Mic, label: 'Meetings', to: '/meetings/demo-meeting-id', title: 'Meetings' },
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAgent = user?.role === 'agent';
  const navItems = isAgent ? agentNavItems : adminNavItems;

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

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{ position: 'relative' }}>
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
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
          {navItems.map(({ icon: Icon, label, to, title }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={title}
            >
              <Icon size={22} />
              <span className="mobile-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', paddingBottom: '16px' }}>
          <button className="nav-item" title="Settings">
            <Settings size={22} />
            <span className="mobile-nav-label">Settings</span>
          </button>
          <button className="nav-item" onClick={handleLogout} title="Logout">
            <LogOut size={22} />
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
        <div className="page-content page-enter">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
