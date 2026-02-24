import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // View mode state (for GroupPage)
  viewMode: null, // 'list' | 'table' | null (auto-detect)
  
  setViewMode: (mode) => set({ viewMode: mode }),

  // Dialog/Modal state
  openDialogs: {},
  
  openDialog: (dialogId) =>
    set((state) => ({
      openDialogs: { ...state.openDialogs, [dialogId]: true },
    })),
    
  closeDialog: (dialogId) =>
    set((state) => ({
      openDialogs: { ...state.openDialogs, [dialogId]: false },
    })),

  // Loading states
  loadingStates: {},
  
  setLoading: (key, isLoading) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: isLoading },
    })),
}));
