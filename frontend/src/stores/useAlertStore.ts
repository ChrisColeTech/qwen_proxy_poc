import { create } from 'zustand';
import type { Alert, AlertType } from '@/types/alert.types';

interface AlertState {
  alert: Alert | null;
  showAlert: (type: AlertType, message: string) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>()((set) => ({
  alert: null,
  showAlert: (type, message) => set({ alert: { type, message } }),
  hideAlert: () => set({ alert: null }),
}));
