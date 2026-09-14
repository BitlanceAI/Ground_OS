import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MapPin, Mic, MessageSquare,
  Phone, Palette, GitBranch, BarChart3, Brain, Settings, LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import TopBar from './TopBar';

const navItems = [
  { icon: LayoutDashboard, label: 'Command', to: '/command', title: 'Command Center' },
  { icon: Users, label: 'Field', to: '/agents', title: 'Field Agents' },
  { icon: MessageSquare, label: 'WhatsApp', to: '/whatsapp', title: 'WhatsApp Intelligence' },
  { icon: Mic, label: 'Meetings', to: '/meetings/demo-meeting-id', title: 'Meetings' },
  { icon: Phone, label: 'Voice', to: '/voice', title: 'Voice AI' },
  { icon: Palette, label: 'Creative', to: '/creatives', title: 'Creative Studio' },
  { icon: GitBranch, label: 'Automation', to: '/automation', title: 'Automation Builder' },
  { icon: Brain, label: 'Intelligence', to: '/intelligence', title: 'Executive Intelligence' },
];

export default function AppShell() {
  const { user, organization, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar" style={{ position: 'relative' }}>
        {/* Logo */}
        <div style={{ marginBottom: '16px', padding: '0 10px' }}>
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
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
          {navItems.map(({ icon: Icon, label, to, title }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={title}
            >
              <Icon size={20} />
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
          <button className="nav-item" title="Settings">
            <Settings size={20} />
          </button>
          <button className="nav-item" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>

          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            marginTop: '8px',
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <TopBar organizationName={organization?.name || 'Bitlance Ground OS'} />
        <div className="page-content page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
