import { useState } from 'react';
import { proxyService } from '@/services/proxyService';
import { useAlertStore } from '@/stores/useAlertStore';
import { startLifecycleMonitoring } from '@/services/lifecycleService';

export function useProxyControl() {
  const [loading, setLoading] = useState(false);
  const showAlert = useAlertStore((state) => state.showAlert);

  const handleStart = async () => {
    setLoading(true);

    // Start lifecycle monitoring FIRST to show "Starting..." immediately
    startLifecycleMonitoring('running');

    try {
      const response = await proxyService.startProxy();
      showAlert(response.message, 'success');
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
      const response = await proxyService.stopProxy();
      showAlert(response.message, 'success');
    } catch (error) {
      console.error('Error stopping proxy:', error);
      showAlert('Failed to stop proxy server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return { handleStart, handleStop, loading };
}
