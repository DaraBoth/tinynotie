import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // State - matching current Redux structure
      mode: 'system', // 'light' | 'dark' | 'system'

      // Actions
      setMode: (mode) => set({ mode }),
      
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),

      // Getters
      getMode: () => get().mode,
    }),
    {
      name: 'theme-storage',
    }
  )
);
