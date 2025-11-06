import { useLifecycleStore } from '@/stores/useLifecycleStore';

/**
 * Hook to access Provider Router Lifecycle state
 * Provides lifecycle state, messages, and errors from the centralized store
 */
export function useProviderRouterLifecycle() {
  const state = useLifecycleStore((state) => state.state);
  const message = useLifecycleStore((state) => state.message);
  const error = useLifecycleStore((state) => state.error);

  return {
    state,
    message,
    error,
  };
}
