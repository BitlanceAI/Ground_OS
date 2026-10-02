import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
}

interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  isActive?: boolean;
  agentId?: string;
  phone?: string;
  territory?: string;
  employeeCode?: string;
}

interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  tokens: { accessToken: string; refreshToken: string } | null;
  login: (data: { user: User; organization: Organization; tokens: { accessToken: string; refreshToken: string } }) => void;
  logout: () => void;
  setTokens: (tokens: { accessToken: string }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      tokens: null,
      isAuthenticated: false,

      login: ({ user, organization, tokens }) =>
        set({
          user,
          organization,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokens,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          organization: null,
          accessToken: null,
          refreshToken: null,
          tokens: null,
          isAuthenticated: false,
        }),

      setTokens: ({ accessToken }) => set((s) => ({
        accessToken,
        tokens: s.tokens ? { ...s.tokens, accessToken } : null,
      })),
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({
        user: s.user,
        organization: s.organization,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        tokens: s.tokens,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
