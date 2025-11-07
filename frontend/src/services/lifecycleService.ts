import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { proxyService } from '@/services/proxyService';

const LIFECYCLE_POLL_INTERVAL = 1000; // 1 second
const LIFECYCLE_TIMEOUT = 30000; // 30 seconds

let pollInterval: number | null = null;
let timeoutHandle: number | null = null;

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
    setState('starting', 'Starting...');
    useAlertStore.showAlert('Starting proxy server...', 'success');
  } else {
    console.log('[LifecycleService] Setting state to stopping');
    setState('stopping', 'Stopping...');
    useAlertStore.showAlert('Stopping proxy server...', 'success');
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
        const message = port ? `Running :${port}` : 'Running';
        setState('running', message);
        useAlertStore.showAlert('Proxy server started successfully', 'success');
        cleanup();
      } else if (targetState === 'stopped' && !isRunning) {
        setState('stopped', 'Stopped');
        useAlertStore.showAlert('Proxy server stopped successfully', 'success');
        cleanup();
      }
    } catch (error) {
      const errorMessage = `Failed to fetch status: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMessage);
      useAlertStore.showAlert(errorMessage, 'error');
      cleanup();
    }
  }, LIFECYCLE_POLL_INTERVAL);

  // Timeout protection
  timeoutHandle = setTimeout(() => {
    const errorMessage = `${targetState === 'running' ? 'Start' : 'Stop'} timeout (30s)`;
    setError(errorMessage);
    useAlertStore.showAlert(`Provider Router ${targetState === 'running' ? 'start' : 'stop'} operation timed out after 30 seconds`, 'error');
    cleanup();
  }, LIFECYCLE_TIMEOUT);
}
