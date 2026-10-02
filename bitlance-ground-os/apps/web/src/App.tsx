import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import AppShell from './components/layout/AppShell';

// Pages
import LoginPage from './pages/login/LoginPage';
import CommandCenterPage from './pages/command-center/CommandCenterPage';
import AgentDetailPage from './pages/agents/AgentDetailPage';
import AgentsManagementPage from './pages/agents/AgentsManagementPage';
import VisitDetailPage from './pages/visits/VisitDetailPage';
import MeetingModePage from './pages/meetings/MeetingModePage';
import AiMeetingReportPage from './pages/meetings/AiMeetingReportPage';
import Customer360Page from './pages/customers/Customer360Page';
import WhatsAppIntelligencePage from './pages/whatsapp/WhatsAppIntelligencePage';
import VoiceAIPage from './pages/voice/VoiceAIPage';
import CreativeStudioPage from './pages/creatives/CreativeStudioPage';
import AutomationBuilderPage from './pages/workflows/AutomationBuilderPage';
import ExecutiveIntelligencePage from './pages/analytics/ExecutiveIntelligencePage';
import VisitsListPage from './pages/visits/VisitsListPage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && user?.role) {
    // Normalize legacy roles from localStorage
    const normalizedRole = user.role.toLowerCase() === 'ceo' || user.role.toLowerCase() === 'sales_manager' ? 'admin' : 
                           user.role.toLowerCase() === 'agent' ? 'agent' : user.role;
                           
    if (!allowedRoles.includes(normalizedRole)) {
      if (normalizedRole === 'agent') return <Navigate to="/visits" replace />;
      // If we don't know the role at all, redirect to a safe endpoint or login to prevent loops
      return <Navigate to="/login" replace />;
    }
  }
  
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />

      {/* Protected — inside AppShell */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        {/* Default route based on role */}
        <Route index element={
          user?.role?.toLowerCase() === 'agent' ? <Navigate to="/visits" replace /> : <Navigate to="/command" replace />
        } />
        
        {/* Admin Only Routes */}
        <Route path="command" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CommandCenterPage />
          </ProtectedRoute>
        } />
        <Route path="agents" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentsManagementPage />
          </ProtectedRoute>
        } />
        <Route path="agents/:agentId" element={<AgentDetailPage />} />
        <Route path="customers/:customerId" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Customer360Page />
          </ProtectedRoute>
        } />
        <Route path="whatsapp" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <WhatsAppIntelligencePage />
          </ProtectedRoute>
        } />
        <Route path="voice" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VoiceAIPage />
          </ProtectedRoute>
        } />
        <Route path="creatives" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CreativeStudioPage />
          </ProtectedRoute>
        } />
        <Route path="automation" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AutomationBuilderPage />
          </ProtectedRoute>
        } />
        <Route path="intelligence" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ExecutiveIntelligencePage />
          </ProtectedRoute>
        } />

        {/* Shared / Agent Routes */}
        <Route path="visits" element={<VisitsListPage />} />
        <Route path="visits/:visitId" element={<VisitDetailPage />} />
        <Route path="meetings/:meetingId" element={<MeetingModePage />} />
        <Route path="meetings/:meetingId/report" element={<AiMeetingReportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
