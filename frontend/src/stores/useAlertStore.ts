import { create } from 'zustand';

interface AlertStore {
  alert: {
    message: string;
    type: 'success' | 'error';
  } | null;
  showAlert: (message: string, type: 'success' | 'error') => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alert: null,
  showAlert: (message, type) => set({ alert: { message, type } }),
  hideAlert: () => set({ alert: null }),
}));
