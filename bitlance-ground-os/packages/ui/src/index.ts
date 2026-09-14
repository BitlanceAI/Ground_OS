// ============================================================
// BITLANCE GROUND OS — Shared UI Theme Tokens & Components
// ============================================================

export const themeColors = {
  bg: {
    primary: '#0a0f1a',
    secondary: '#111827',
    card: '#1e293b',
    elevated: '#334155',
  },
  accent: {
    gold: '#f59e0b',
    amber: '#d97706',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    emerald: '#10b981',
    purple: '#8b5cf6',
    rose: '#f43f5e',
  },
  status: {
    online: '#10b981',
    enRoute: '#3b82f6',
    atLocation: '#f59e0b',
    inMeeting: '#8b5cf6',
    offline: '#64748b',
    critical: '#ef4444',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    glow: 'rgba(245, 158, 11, 0.25)',
  }
};

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString();
}
