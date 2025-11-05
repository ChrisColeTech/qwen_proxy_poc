import { useState } from 'react';
import { proxyService } from '@/services/proxy.service';
import { useProxyStore } from '@/stores/useProxyStore';

export function useProxyControl() {
  const { setStatus, setError } = useProxyStore();
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  const startProxy = async () => {
    setStarting(true);
    setLocalError(null);
    setError(null);
    try {
      const status = await proxyService.startProxy();
      setStatus(status);
      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start proxy';
      setLocalError(message);
      setError(message);
      throw err;
    } finally {
      setStarting(false);
    }
  };

  const stopProxy = async () => {
    setStopping(true);
    setLocalError(null);
    setError(null);
    try {
      const status = await proxyService.stopProxy();
      setStatus(status);
      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop proxy';
      setLocalError(message);
      setError(message);
      throw err;
    } finally {
      setStopping(false);
    }
  };

  return {
    startProxy,
    stopProxy,
    starting,
    stopping,
    error,
  };
}
