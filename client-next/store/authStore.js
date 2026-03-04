import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const AUTH_COOKIE = 'auth-token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function setCookie(name, value) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // Actions
      setAuth: (token, user) => {
        // Sync to cookie so middleware can read it server-side
        setCookie(AUTH_COOKIE, token);
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        clearCookie(AUTH_COOKIE);
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      // Getters
      getToken: () => get().token,
      getUser: () => get().user,
      isAuth: () => get().isAuthenticated,
    }),
    {
      name: 'auth-storage',
      // localStorage persists across tabs and page refreshes
      storage: createJSONStorage(() => {
        // SSR guard — localStorage is only available in the browser
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Only persist user-facing auth fields, not the hydration flag
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Called once localStorage has been read and the store is hydrated.
        // ALWAYS set hydration flag, even if there's no persisted state or an error.
        if (error) {
          console.warn('[Auth] Hydration error:', error);
        }
        
        if (state) {
          // Re-sync cookie when valid auth data is restored from localStorage
          if (state.token && state.isAuthenticated) {
            setCookie(AUTH_COOKIE, state.token);
            console.log('[Auth] Session restored from localStorage');
          }
          state.setHasHydrated(true);
        } else {
          // No persisted state found — initialize an empty auth store
          // We need to manually trigger setHasHydrated for the initial empty state
          useAuthStore.setState({ _hasHydrated: true });
          console.log('[Auth] No persisted session found');
        }
      },
    }
  )
);
