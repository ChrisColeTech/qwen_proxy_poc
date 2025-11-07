import { useState } from 'react';
import { proxyService } from '@/services/proxyService';
import { useAlertStore } from '@/stores/useAlertStore';
import { startLifecycleMonitoring } from '@/services/lifecycleService';

export function useProxyControl() {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlertStore;

  const handleStart = async () => {
    setLoading(true);

    // Start lifecycle monitoring FIRST to show "Starting..." immediately
    startLifecycleMonitoring('running');

    try {
      await proxyService.startProxy();
      // Toast will be shown by lifecycle service when state reaches 'running'
    } catch (error) {
      console.error('Error starting proxy:', error);
      showAlert('Failed to start proxy server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);

    // Start lifecycle monitoring FIRST to show "Stopping..." immediately
    startLifecycleMonitoring('stopped');

    try {
      await proxyService.stopProxy();
      // Toast will be shown by lifecycle service when state reaches 'stopped'
    } catch (error) {
      console.error('Error stopping proxy:', error);
      showAlert('Failed to stop proxy server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return { handleStart, handleStop, loading };
}
