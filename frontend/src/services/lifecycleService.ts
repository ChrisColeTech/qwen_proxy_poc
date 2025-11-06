import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { proxyService } from '@/services/proxyService';

const LIFECYCLE_POLL_INTERVAL = 1000; // 1 second
const LIFECYCLE_TIMEOUT = 30000; // 30 seconds

let pollInterval: NodeJS.Timeout | null = null;
let timeoutHandle: NodeJS.Timeout | null = null;

function cleanup() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
}

export function startLifecycleMonitoring(targetState: 'running' | 'stopped') {
  console.log('[LifecycleService] Starting monitoring for:', targetState);
  cleanup();

  const { setState, setError } = useLifecycleStore.getState();
  const { setStatus } = useProxyStore.getState();

  // Set initial transition state
  if (targetState === 'running') {
    console.log('[LifecycleService] Setting state to starting');
    setState('starting', 'Starting Provider Router...');
  } else {
    console.log('[LifecycleService] Setting state to stopping');
    setState('stopping', 'Stopping Provider Router...');
  }

  // Poll for status updates
  pollInterval = setInterval(async () => {
    try {
      const status = await proxyService.getStatus();
      setStatus(status);

      // Check if target state reached
      const isRunning = status.providerRouter?.running;
      if (targetState === 'running' && isRunning) {
        const port = status.providerRouter?.port;
        setState('running', port ? `Provider Router running on port ${port}` : 'Provider Router running');
        cleanup();
      } else if (targetState === 'stopped' && !isRunning) {
        setState('stopped', 'Provider Router stopped');
        cleanup();
      }
    } catch (error) {
      setError(`Failed to fetch status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      cleanup();
    }
  }, LIFECYCLE_POLL_INTERVAL);

  // Timeout protection
  timeoutHandle = setTimeout(() => {
    setError(`Provider Router ${targetState === 'running' ? 'start' : 'stop'} operation timed out after 30 seconds`);
    cleanup();
  }, LIFECYCLE_TIMEOUT);
}
