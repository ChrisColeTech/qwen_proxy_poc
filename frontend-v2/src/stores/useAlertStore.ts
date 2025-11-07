import { create } from 'zustand';
import type { AlertState, AlertType } from '@/types';

interface AlertStore extends Partial<AlertState> {
  showAlert: (message: string, type: AlertType) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  message: undefined,
  type: undefined,
  showAlert: (message, type) => set({ message, type }),
  hideAlert: () => set({ message: undefined, type: undefined }),
}));
