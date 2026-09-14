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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

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
        <Route index element={<CommandCenterPage />} />
        <Route path="command" element={<CommandCenterPage />} />
        <Route path="agents/:agentId" element={<AgentDetailPage />} />
        <Route path="visits/:visitId" element={<VisitDetailPage />} />
        <Route path="meetings/:meetingId" element={<MeetingModePage />} />
        <Route path="meetings/:meetingId/report" element={<AiMeetingReportPage />} />
        <Route path="customers/:customerId" element={<Customer360Page />} />
        <Route path="whatsapp" element={<WhatsAppIntelligencePage />} />
        <Route path="voice" element={<VoiceAIPage />} />
        <Route path="creatives" element={<CreativeStudioPage />} />
        <Route path="automation" element={<AutomationBuilderPage />} />
        <Route path="intelligence" element={<ExecutiveIntelligencePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
