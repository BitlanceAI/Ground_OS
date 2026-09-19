import { Routes, Route, NavLink } from 'react-router-dom';
import { Compass, Calendar, Mic, FileText, UserCheck } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import ActiveVisitPage from './pages/ActiveVisitPage';
import MeetingWorkspacePage from './pages/MeetingWorkspacePage';
import ReportViewerPage from './pages/ReportViewerPage';
import CustomerLitePage from './pages/CustomerLitePage';

export default function App() {
  return (
    <div className="pwa-container">
      {/* Top Mobile Bar */}
      <header className="pwa-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.8rem',
            color: '#000'
          }}>⚡</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>GROUND OS</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Aman Sharma · Lifestyle Homes</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div className="pulse-dot" />
            <span style={{ fontSize: '0.68rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>GPS HIGH-ACCURACY</span>
          </div>
        </div>
      </header>

      {/* Main App Content */}
      <main className="pwa-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/visit/:visitId" element={<ActiveVisitPage />} />
          <Route path="/meeting/:meetingId" element={<MeetingWorkspacePage />} />
          <Route path="/report/:meetingId" element={<ReportViewerPage />} />
          <Route path="/customer/:customerId" element={<CustomerLitePage />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="pwa-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Calendar size={20} />
          <span>Today</span>
        </NavLink>
        <NavLink to="/visit/vis-001" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Compass size={20} />
          <span>Active</span>
        </NavLink>
        <NavLink to="/meeting/mtg-001" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Mic size={20} />
          <span>Record</span>
        </NavLink>
        <NavLink to="/report/mtg-001" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>AI Report</span>
        </NavLink>
        <NavLink to="/customer/cust-rajesh-01" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserCheck size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
