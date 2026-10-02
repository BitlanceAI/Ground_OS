// ============================================================
// TYPED API CLIENT — Bitlance Ground OS Web App
// All API calls go through here. Auto-injects auth token.
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ── Auth Store integration ─────────────────────────────────
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('auth-store');
    if (!raw) return null;
    const state = JSON.parse(raw);
    return state?.state?.tokens?.accessToken || null;
  } catch {
    return null;
  }
}

// ── Base fetch wrapper ─────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ── API Response wrapper ───────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data: T;
  _mock?: boolean;
}

// ── Auth ───────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: any; organization: any; tokens: any }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; expiresIn: number }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  me: () => apiFetch<{ user: any; organization: any }>('/api/v1/auth/me'),

  logout: () => apiFetch<{ message: string }>('/api/v1/auth/logout', { method: 'POST' }),
};

// ── Agents ─────────────────────────────────────────────────
export const agentsApi = {
  list: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${params.status}` : '';
    return apiFetch<ApiResponse<any[]>>(`/api/v1/agents${qs}`);
  },

  get: (agentId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/agents/${agentId}`),

  create: (data: { firstName: string; lastName?: string; email: string; password: string; phone?: string; territory?: string; employeeCode?: string }) =>
    apiFetch<ApiResponse<any>>('/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (agentId: string, data: { firstName?: string; lastName?: string; email?: string; password?: string; phone?: string; territory?: string; employeeCode?: string; isActive?: boolean; status?: string }) =>
    apiFetch<ApiResponse<any>>(`/api/v1/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleActive: (agentId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/agents/${agentId}/toggle-active`, {
      method: 'PATCH',
    }),

  delete: (agentId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/agents/${agentId}`, {
      method: 'DELETE',
    }),

  updateLocation: (agentId: string, location: { latitude: number; longitude: number; accuracy?: number; address?: string }) =>
    apiFetch<ApiResponse<any>>(`/api/v1/agents/${agentId}/location`, {
      method: 'POST',
      body: JSON.stringify(location),
    }),

  updateStatus: (agentId: string, status: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/agents/${agentId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};

// ── Visits ─────────────────────────────────────────────────
export const visitsApi = {
  list: (params?: { agentId?: string; status?: string; date?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<ApiResponse<any[]>>(`/api/v1/visits${qs ? '?' + qs : ''}`);
  },

  get: (visitId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/visits/${visitId}`),

  create: (data: { agentId: string; customerId: string; scheduledAt: string; purpose?: string; notes?: string; destinationLat?: number; destinationLng?: number; destinationAddress?: string }) =>
    apiFetch<ApiResponse<any>>('/api/v1/visits', { method: 'POST', body: JSON.stringify(data) }),

  arrive: (visitId: string, location: { latitude: number; longitude: number; accuracy?: number }) =>
    apiFetch<ApiResponse<any>>(`/api/v1/visits/${visitId}/arrive`, {
      method: 'POST',
      body: JSON.stringify(location),
    }),

  startMeeting: (visitId: string) =>
    apiFetch<ApiResponse<{ visit: any; meeting: any }>>(`/api/v1/visits/${visitId}/start-meeting`, { method: 'POST' }),

  updateStatus: (visitId: string, status: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/visits/${visitId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  tapLead: (visitId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/visits/${visitId}/tap-lead`, {
      method: 'PATCH',
    }),
};

// ── Meetings ───────────────────────────────────────────────
export const meetingsApi = {
  list: (params?: { agentId?: string; customerId?: string; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<ApiResponse<any[]>>(`/api/v1/meetings${qs ? '?' + qs : ''}`);
  },

  get: (meetingId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/meetings/${meetingId}`),

  getUploadUrl: (meetingId: string, filename: string, contentType?: string) =>
    apiFetch<{ success: boolean; uploadUrl: string; downloadUrl: string; key: string }>(
      `/api/v1/meetings/${meetingId}/recording-upload-url`,
      { method: 'POST', body: JSON.stringify({ filename, contentType }) }
    ),

  confirmRecording: (meetingId: string, audioUrl: string, durationSeconds?: number) =>
    apiFetch<ApiResponse<any>>(`/api/v1/meetings/${meetingId}/recording-confirmed`, {
      method: 'POST',
      body: JSON.stringify({ audioUrl, durationSeconds }),
    }),

  analyze: (meetingId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/meetings/${meetingId}/complete-and-analyze`, { method: 'POST' }),

  adminSchedule: (data: { agentId: string; customerId?: string; scheduledFor: string; title?: string; notes?: string; purposeOfVisit?: string }) =>
    apiFetch<ApiResponse<any>>('/api/v1/meetings/admin-schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  agentReport: () =>
    apiFetch<ApiResponse<any[]>>('/api/v1/meetings/agent-report'),
};

// ── Customers ──────────────────────────────────────────────
export const customersApi = {
  list: (params?: { search?: string; agentId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<ApiResponse<any[]>>(`/api/v1/customers${qs ? '?' + qs : ''}`);
  },

  get: (customerId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/customers/${customerId}`),
};

// ── Leads ──────────────────────────────────────────────────
export const leadsApi = {
  list: (params?: { status?: string; intentLevel?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<ApiResponse<any[]>>(`/api/v1/leads${qs ? '?' + qs : ''}`);
  },

  get: (leadId: string) =>
    apiFetch<ApiResponse<any>>(`/api/v1/leads/${leadId}`),
};

// ── WhatsApp ───────────────────────────────────────────────
export const whatsappApi = {
  getThreads: () => apiFetch<ApiResponse<any[]>>('/api/v1/whatsapp/threads'),

  send: (to: string, message: string, mediaUrl?: string, templateName?: string, numbers?: string[]) =>
    apiFetch<ApiResponse<any>>('/api/v1/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ to, numbers, message, mediaUrl, templateName }),
    }),
};

// ── Voice ──────────────────────────────────────────────────
export const voiceApi = {
  getCalls: () => apiFetch<ApiResponse<any[]>>('/api/v1/voice/calls'),

  triggerCall: (customerPhone: string, customerName: string, prompt: string) =>
    apiFetch<ApiResponse<any>>('/api/v1/voice/trigger', {
      method: 'POST',
      body: JSON.stringify({ customerPhone, customerName, prompt }),
    }),
};

// ── Workflows ──────────────────────────────────────────────
export const workflowsApi = {
  list: () => apiFetch<ApiResponse<any[]>>('/api/v1/workflows'),
  get: (id: string) => apiFetch<ApiResponse<any>>(`/api/v1/workflows/${id}`),

  create: (data: { name: string; description?: string; trigger: any; nodes: any[] }) =>
    apiFetch<ApiResponse<any>>('/api/v1/workflows', { method: 'POST', body: JSON.stringify(data) }),

  toggle: (id: string, active: boolean) =>
    apiFetch<ApiResponse<any>>(`/api/v1/workflows/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ active }),
    }),
};

// ── Analytics ──────────────────────────────────────────────
export const analyticsApi = {
  getExecutiveMetrics: () => apiFetch<ApiResponse<any>>('/api/v1/analytics/executive'),
  getAgentLeaderboard: () => apiFetch<ApiResponse<any[]>>('/api/v1/analytics/leaderboard'),
  getAiFeed: () => apiFetch<ApiResponse<any[]>>('/api/v1/analytics/ai-feed'),
};

// ── Creatives ──────────────────────────────────────────────
export const creativesApi = {
  list: () => apiFetch<ApiResponse<any[]>>('/api/v1/creatives'),

  generate: (data: { customerId?: string; type: string; brief: object }) =>
    apiFetch<ApiResponse<any>>('/api/v1/creatives/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── AI ───────────────────────────────────────────────────────
export const aiApi = {
  getFeed: () => apiFetch<ApiResponse<any[]>>('/api/v1/ai/feed'),
  query: (query: string) => apiFetch<ApiResponse<any>>('/api/v1/ai/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }),
  transcribe: (audioBlob: Blob) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': audioBlob.type || 'audio/webm',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}/api/v1/ai/transcribe`, {
      method: 'POST',
      headers,
      body: audioBlob,
    }).then(res => res.json());
  },
};

// ── Health ─────────────────────────────────────────────────
export const healthApi = {
  check: () => apiFetch<{ status: string; service: string; timestamp: string }>('/health'),
};

// ── WebSocket helper ───────────────────────────────────────
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4001';

export function createRealtimeConnection(onMessage: (data: any) => void): WebSocket {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[Realtime] Connected to Ground OS gateway');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error('[Realtime] Failed to parse message:', err);
    }
  };

  ws.onclose = () => {
    console.log('[Realtime] Disconnected from gateway');
  };

  ws.onerror = (err) => {
    console.error('[Realtime] WebSocket error:', err);
  };

  return ws;
}

export default {
  auth: authApi,
  agents: agentsApi,
  visits: visitsApi,
  meetings: meetingsApi,
  customers: customersApi,
  leads: leadsApi,
  whatsapp: whatsappApi,
  voice: voiceApi,
  workflows: workflowsApi,
  analytics: analyticsApi,
  creatives: creativesApi,
  ai: aiApi,
  health: healthApi,
};
