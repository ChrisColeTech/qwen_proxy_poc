import { toast } from '@/hooks/use-toast';

interface AlertStore {
  showAlert: (message: string, type: 'success' | 'error') => void;
}

export const useAlertStore = {
  showAlert: (message: string, type: 'success' | 'error') => {
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
