import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function setPersistentCookie(name: string, value: string, days = 3650) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 86400;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

interface AuthState {
  token: string | null;
  role: string | null;
  fullName: string | null;
  institutionId: string | null;
  avatarUrl: string | null;
  setAuth: (token: string, role: string, fullName: string, institutionId?: string, avatarUrl?: string | null) => void;
  updateFullName: (name: string) => void;
  setAvatarUrl: (url: string | null) => void;
  logout: () => void;
  syncFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: typeof window !== 'undefined' ? (localStorage.getItem('token') || getCookie('token')) : null,
      role: typeof window !== 'undefined' ? (localStorage.getItem('role') || getCookie('role')) : null,
      fullName: typeof window !== 'undefined' ? (localStorage.getItem('fullName') || getCookie('fullName')) : null,
      institutionId: typeof window !== 'undefined' ? localStorage.getItem('institutionId') : null,
      avatarUrl: typeof window !== 'undefined' ? localStorage.getItem('avatarUrl') : null,
      
      setAuth: (token, role, fullName, institutionId, avatarUrl) => {
        if (typeof window !== 'undefined') {
          // 1. Permanent LocalStorage
          localStorage.setItem('token', token);
          localStorage.setItem('role', role);
          localStorage.setItem('fullName', fullName);
          if (institutionId) {
            localStorage.setItem('institutionId', institutionId);
          }
          if (avatarUrl) {
            localStorage.setItem('avatarUrl', avatarUrl);
          }

          // 2. Permanent 10-Year Cookies (Guarantees sessions persist across reloads & restarts)
          setPersistentCookie('token', token);
          setPersistentCookie('role', role);
          setPersistentCookie('fullName', fullName);
        }
        set({ 
          token, 
          role, 
          fullName, 
          institutionId: institutionId || null, 
          avatarUrl: avatarUrl || (typeof window !== 'undefined' ? localStorage.getItem('avatarUrl') : null) 
        });
      },

      updateFullName: (name: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('fullName', name);
          setPersistentCookie('fullName', name);
        }
        set({ fullName: name });
      },

      setAvatarUrl: (url: string | null) => {
        if (typeof window !== 'undefined') {
          if (url) {
            localStorage.setItem('avatarUrl', url);
          } else {
            localStorage.removeItem('avatarUrl');
          }
        }
        set({ avatarUrl: url });
      },
      
      logout: () => {
        if (typeof window !== 'undefined') {
          // Explicit manual user logout: purge storage and cookies
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('fullName');
          localStorage.removeItem('institutionId');
          localStorage.removeItem('workspaceId');
          localStorage.removeItem('workspaceName');
          localStorage.removeItem('avatarUrl');

          removeCookie('token');
          removeCookie('role');
          removeCookie('fullName');
        }
        set({ token: null, role: null, fullName: null, institutionId: null, avatarUrl: null });
      },

      syncFromStorage: () => {
        if (typeof window !== 'undefined') {
          // Read from LocalStorage or fallback to Persistent Cookie
          const t = localStorage.getItem('token') || getCookie('token');
          const r = localStorage.getItem('role') || getCookie('role');
          const n = localStorage.getItem('fullName') || getCookie('fullName');
          const inst = localStorage.getItem('institutionId');
          const av = localStorage.getItem('avatarUrl');

          // If recovered from cookie, restore to localStorage so all sub-pages stay in sync
          if (t && !localStorage.getItem('token')) {
            localStorage.setItem('token', t);
            if (r) localStorage.setItem('role', r);
            if (n) localStorage.setItem('fullName', n);
          }

          if (t && (get().token !== t || get().role !== r || get().fullName !== n || get().avatarUrl !== av)) {
            set({ token: t, role: r, fullName: n, institutionId: inst, avatarUrl: av });
          }
        }
      }
    }),
    {
      name: 'testora-quiz-auth',
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined' && state) {
          const legacyToken = localStorage.getItem('token') || getCookie('token');
          if (legacyToken && !state.token) {
            state.token = legacyToken;
            state.role = localStorage.getItem('role') || getCookie('role');
            state.fullName = localStorage.getItem('fullName') || getCookie('fullName');
            state.institutionId = localStorage.getItem('institutionId');
            state.avatarUrl = localStorage.getItem('avatarUrl');
          }
        }
      }
    }
  )
);

// Auto-sync storage across tabs and window focus so login state is never lost
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    try {
      useAuthStore.getState().syncFromStorage();
    } catch {}
  });
  window.addEventListener('storage', () => {
    try {
      useAuthStore.getState().syncFromStorage();
    } catch {}
  });
}
