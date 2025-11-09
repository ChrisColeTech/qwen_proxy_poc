import { toast } from '@/hooks/useToast';

interface AlertStore {
  showAlert: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

// Toast queue to stagger multiple toasts with proper delays
let pendingToasts: Array<{ message: string; type: 'success' | 'error' | 'info' | 'warning' }> = [];
let queueTimeout: ReturnType<typeof setTimeout> | null = null;
let lastToastMessage: string | null = null;
let lastToastTime: number = 0;
const TOAST_STAGGER_DELAY = 300; // 300ms delay between toasts
const DUPLICATE_SUPPRESS_WINDOW = 1000; // Suppress duplicate messages within 1 second

const scheduleNextToast = () => {
  // Clear any existing timeout
  if (queueTimeout) {
    clearTimeout(queueTimeout);
    queueTimeout = null;
  }

  // If queue is empty, we're done
  if (pendingToasts.length === 0) {
    return;
  }

  // Get the next toast from the queue
  const nextToast = pendingToasts.shift()!;

  // Show the toast
  const { dismiss } = toast({
    description: nextToast.message,
    variant: nextToast.type === 'error' ? 'destructive' : 'default',
  });

  // Track last toast for deduplication
  lastToastMessage = nextToast.message;
  lastToastTime = Date.now();

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    dismiss();
  }, 3000);

  // Schedule the next toast if there are more in the queue
  if (pendingToasts.length > 0) {
    queueTimeout = setTimeout(scheduleNextToast, TOAST_STAGGER_DELAY);
  }
};

export const useAlertStore = {
  showAlert: (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    // Deduplicate: skip if same message was shown within the suppression window
    const now = Date.now();
    if (lastToastMessage === message && (now - lastToastTime) < DUPLICATE_SUPPRESS_WINDOW) {
      return;
    }

    const isFirstToast = pendingToasts.length === 0;

    // Add to queue
    pendingToasts.push({ message, type });

    // If this is the first toast, show it immediately and start the queue
    if (isFirstToast) {
      scheduleNextToast();
    }
  },
} as AlertStore;
