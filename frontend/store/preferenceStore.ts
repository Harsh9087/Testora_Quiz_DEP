import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LanguageCode } from '../lib/i18n';
import { apiFetch } from '../lib/api';

export type FontFamily = 'inter' | 'sans' | 'serif' | 'arial' | 'dyslexic';
export type InterfaceDensity = 'compact' | 'standard' | 'comfortable' | 'spacious';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferencesState {
  // Appearance
  font_family: FontFamily;
  text_scale: number;
  interface_density: InterfaceDensity;
  theme: ThemePreference;

  // Regional & Language
  language: LanguageCode;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';

  // Accessibility
  high_contrast: boolean;
  reduced_motion: boolean;
  high_focus: boolean;
  sound_enabled: boolean;

  // Notification Channels
  master_notifications: boolean;
  channel_in_app: boolean;
  channel_email: boolean;
  channel_push: boolean;

  // Notification Categories
  cat_messages: boolean;
  cat_account: boolean;
  cat_security: boolean;
  cat_announcements: boolean;
  cat_updates: boolean;
  cat_reminders: boolean;
  cat_marketing: boolean;

  // Search
  search_history_enabled: boolean;
  search_default_sort: string;
  search_default_filter: string;

  // Privacy & Security
  two_factor_enabled: boolean;
  profile_visibility: 'public' | 'institution' | 'private';

  // Operational State
  isLoading: boolean;
  isSaving: boolean;
  lastSyncedAt: string | null;

  // Methods
  applyToDom: () => void;
  playChime: () => void;
  fetchFromBackend: (token?: string | null) => Promise<void>;
  savePreferences: (partial: Partial<UserPreferencesState>, token?: string | null) => Promise<boolean>;
  resetToDefaults: (token?: string | null) => Promise<boolean>;
}

export const DEFAULT_PREFERENCES = {
  font_family: 'inter' as FontFamily,
  text_scale: 100,
  interface_density: 'standard' as InterfaceDensity,
  theme: 'light' as ThemePreference,
  language: 'en' as LanguageCode,
  timezone: 'Asia/Kolkata',
  date_format: 'DD/MM/YYYY',
  time_format: '12h' as const,
  high_contrast: false,
  reduced_motion: false,
  high_focus: false,
  sound_enabled: true,
  master_notifications: true,
  channel_in_app: true,
  channel_email: true,
  channel_push: false,
  cat_messages: true,
  cat_account: true,
  cat_security: true,
  cat_announcements: true,
  cat_updates: true,
  cat_reminders: true,
  cat_marketing: false,
  search_history_enabled: true,
  search_default_sort: 'newest',
  search_default_filter: 'all',
  two_factor_enabled: false,
  profile_visibility: 'institution' as const,
};

export const usePreferenceStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      isLoading: false,
      isSaving: false,
      lastSyncedAt: null,

      applyToDom: () => {
        if (typeof window === 'undefined') return;
        const state = get();
        const root = document.documentElement;

        // 1. Theme application (Defaults cleanly to light mode; only dark if explicitly chosen)
        const isDark = state.theme === 'dark';

        if (isDark) {
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
        } else {
          root.classList.remove('dark');
          root.setAttribute('data-theme', 'light');
        }

        // 2. Font family
        root.setAttribute('data-font', state.font_family);

        // 3. Text scaling
        root.style.setProperty('--font-scale', `${state.text_scale}%`);

        // 4. Interface density
        root.setAttribute('data-density', state.interface_density);

        // 5. Accessibility attributes
        if (state.high_contrast) {
          root.setAttribute('data-contrast', 'high');
        } else {
          root.removeAttribute('data-contrast');
        }

        if (state.reduced_motion) {
          root.setAttribute('data-motion', 'reduced');
        } else {
          root.removeAttribute('data-motion');
        }

        if (state.high_focus) {
          root.setAttribute('data-focus', 'high');
        } else {
          root.removeAttribute('data-focus');
        }

        // 6. Language attribute
        root.setAttribute('lang', state.language);
      },

      playChime: () => {
        if (typeof window === 'undefined') return;
        const state = get();
        if (!state.sound_enabled) return;

        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          const now = ctx.currentTime;

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(523.25, now); // C5
          osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(659.25, now + 0.12);
          osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.28); // G5

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now + 0.12);
          osc1.stop(now + 0.15);
          osc2.stop(now + 0.35);
        } catch {}
      },

      fetchFromBackend: async (token?: string | null) => {
        const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!activeToken) {
          get().applyToDom();
          return;
        }

        set({ isLoading: true });
        try {
          const res = await apiFetch('/preferences', { token: activeToken });
          if (res.ok) {
            const data = await res.json();
            set({
              font_family: data.font_family || 'inter',
              text_scale: data.text_scale || 100,
              interface_density: data.interface_density || 'standard',
              theme: data.theme || 'system',
              language: data.language || 'en',
              timezone: data.timezone || 'Asia/Kolkata',
              date_format: data.date_format || 'DD/MM/YYYY',
              time_format: data.time_format || '12h',
              high_contrast: !!data.high_contrast,
              reduced_motion: !!data.reduced_motion,
              high_focus: !!data.high_focus,
              sound_enabled: data.sound_enabled !== undefined ? !!data.sound_enabled : true,
              master_notifications: data.master_notifications !== undefined ? !!data.master_notifications : true,
              channel_in_app: data.channel_in_app !== undefined ? !!data.channel_in_app : true,
              channel_email: data.channel_email !== undefined ? !!data.channel_email : true,
              channel_push: !!data.channel_push,
              cat_messages: data.cat_messages !== undefined ? !!data.cat_messages : true,
              cat_account: data.cat_account !== undefined ? !!data.cat_account : true,
              cat_security: true,
              cat_announcements: data.cat_announcements !== undefined ? !!data.cat_announcements : true,
              cat_updates: data.cat_updates !== undefined ? !!data.cat_updates : true,
              cat_reminders: data.cat_reminders !== undefined ? !!data.cat_reminders : true,
              cat_marketing: !!data.cat_marketing,
              search_history_enabled: data.search_history_enabled !== undefined ? !!data.search_history_enabled : true,
              search_default_sort: data.search_default_sort || 'newest',
              search_default_filter: data.search_default_filter || 'all',
              two_factor_enabled: !!data.two_factor_enabled,
              profile_visibility: data.profile_visibility || 'institution',
              lastSyncedAt: new Date().toISOString(),
            });
            get().applyToDom();
          }
        } catch {
          // Graceful fallback to local cache
          get().applyToDom();
        } finally {
          set({ isLoading: false });
        }
      },

      savePreferences: async (partial: Partial<UserPreferencesState>, token?: string | null) => {
        // Optimistic local update
        set((state) => ({ ...state, ...partial, isSaving: true }));
        get().applyToDom();

        const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!activeToken) {
          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        }

        try {
          // Prepare clean payload
          const currentState = get();
          const payload = {
            font_family: currentState.font_family,
            text_scale: currentState.text_scale,
            interface_density: currentState.interface_density,
            theme: currentState.theme,
            language: currentState.language,
            timezone: currentState.timezone,
            date_format: currentState.date_format,
            time_format: currentState.time_format,
            high_contrast: currentState.high_contrast,
            reduced_motion: currentState.reduced_motion,
            high_focus: currentState.high_focus,
            sound_enabled: currentState.sound_enabled,
            master_notifications: currentState.master_notifications,
            channel_in_app: currentState.channel_in_app,
            channel_email: currentState.channel_email,
            channel_push: currentState.channel_push,
            cat_messages: currentState.cat_messages,
            cat_account: currentState.cat_account,
            cat_security: true,
            cat_announcements: currentState.cat_announcements,
            cat_updates: currentState.cat_updates,
            cat_reminders: currentState.cat_reminders,
            cat_marketing: currentState.cat_marketing,
            search_history_enabled: currentState.search_history_enabled,
            search_default_sort: currentState.search_default_sort,
            search_default_filter: currentState.search_default_filter,
            two_factor_enabled: currentState.two_factor_enabled,
            profile_visibility: currentState.profile_visibility,
          };

          const res = await apiFetch('/preferences', {
            token: activeToken,
            method: 'PUT',
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
            return true;
          }
          set({ isSaving: false });
          return false;
        } catch {
          set({ isSaving: false });
          return false;
        }
      },

      resetToDefaults: async (token?: string | null) => {
        set({ ...DEFAULT_PREFERENCES, isSaving: true });
        get().applyToDom();

        const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
        if (!activeToken) {
          set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
          return true;
        }

        try {
          const res = await apiFetch('/preferences/reset', {
            token: activeToken,
            method: 'POST',
          });
          if (res.ok) {
            set({ isSaving: false, lastSyncedAt: new Date().toISOString() });
            return true;
          }
          set({ isSaving: false });
          return false;
        } catch {
          set({ isSaving: false });
          return false;
        }
      },
    }),
    {
      name: 'testora_user_preferences',
      partialize: (state) => ({
        font_family: state.font_family,
        text_scale: state.text_scale,
        interface_density: state.interface_density,
        theme: state.theme,
        language: state.language,
        timezone: state.timezone,
        date_format: state.date_format,
        time_format: state.time_format,
        high_contrast: state.high_contrast,
        reduced_motion: state.reduced_motion,
        high_focus: state.high_focus,
        sound_enabled: state.sound_enabled,
        master_notifications: state.master_notifications,
        channel_in_app: state.channel_in_app,
        channel_email: state.channel_email,
        channel_push: state.channel_push,
        cat_messages: state.cat_messages,
        cat_account: state.cat_account,
        cat_security: true,
        cat_announcements: state.cat_announcements,
        cat_updates: state.cat_updates,
        cat_reminders: state.cat_reminders,
        cat_marketing: state.cat_marketing,
        search_history_enabled: state.search_history_enabled,
        search_default_sort: state.search_default_sort,
        search_default_filter: state.search_default_filter,
        two_factor_enabled: state.two_factor_enabled,
        profile_visibility: state.profile_visibility,
      }),
    }
  )
);

