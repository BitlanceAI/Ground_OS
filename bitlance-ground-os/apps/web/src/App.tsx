import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import AppShell from './components/layout/AppShell';

// Pages
import LoginPage from './pages/login/LoginPage';
import CommandCenterPage from './pages/command-center/CommandCenterPage';
import AgentDetailPage from './pages/agents/AgentDetailPage';
import VisitDetailPage from './pages/visits/VisitDetailPage';
import MeetingModePage from './pages/meetings/MeetingModePage';
import AiMeetingReportPage from './pages/meetings/AiMeetingReportPage';
import Customer360Page from './pages/customers/Customer360Page';
import WhatsAppIntelligencePage from './pages/whatsapp/WhatsAppIntelligencePage';
import VoiceAIPage from './pages/voice/VoiceAIPage';
import CreativeStudioPage from './pages/creatives/CreativeStudioPage';
import AutomationBuilderPage from './pages/workflows/AutomationBuilderPage';
import ExecutiveIntelligencePage from './pages/analytics/ExecutiveIntelligencePage';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // If user role is agent but tries to access admin route, redirect to their home
    if (user.role === 'agent') return <Navigate to="/visits" replace />;
    return <Navigate to="/" replace />;
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
          user?.role === 'agent' ? <Navigate to="/visits" replace /> : <Navigate to="/command" replace />
        } />
        
        {/* Admin Only Routes */}
        <Route path="command" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CommandCenterPage />
          </ProtectedRoute>
        } />
        <Route path="agents" element={
          <ProtectedRoute allowedRoles={['admin']}>
            {/* You'd typically have an Agents list page here, reusing AgentDetailPage for now or add a new one if it exists. But there is no agents list in the imports. We'll just map to a placeholder or skip. */}
            <Navigate to="/command" replace />
          </ProtectedRoute>
        } />
        <Route path="agents/:agentId" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AgentDetailPage />
          </ProtectedRoute>
        } />
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
        {/* For Agent "nilesh", we might redirect them to their specific visits. 
            For now, we'll give them access to visit and meeting detail pages. */}
        <Route path="visits" element={
          // Placeholder for an agent's visits list. If AgentDetailPage shows visits, we can use that.
          <AgentDetailPage />
        } />
        <Route path="visits/:visitId" element={<VisitDetailPage />} />
        <Route path="meetings/:meetingId" element={<MeetingModePage />} />
        <Route path="meetings/:meetingId/report" element={<AiMeetingReportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
