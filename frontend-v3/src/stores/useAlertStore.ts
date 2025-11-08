import { toast } from '@/hooks/useToast';

interface AlertStore {
  showAlert: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useAlertStore = {
  showAlert: (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const { dismiss } = toast({
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      dismiss();
    }, 3000);
  },
} as AlertStore;
