import { useState } from 'react';
import { proxyService } from '@/services/proxyService';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { useUIStore } from '@/stores/useUIStore';

export function useProxyControl() {
  const [loading, setLoading] = useState(false);
  const setStatus = useProxyStore((state) => state.setStatus);
  const showAlert = useAlertStore((state) => state.showAlert);
  const setStatusMessage = useUIStore((state) => state.setStatusMessage);

  const handleStart = async () => {
    setLoading(true);
    setStatusMessage('Starting proxy server...');
    try {
      const response = await proxyService.startProxy();
      showAlert(response.message, 'success');

      // Refresh status
      const status = await proxyService.getStatus();
      setStatus(status);

      const port = status.qwenProxy?.port;
      setStatusMessage(port ? `Proxy running on port ${port}` : 'Proxy running');
    } catch (error) {
      console.error('Error starting proxy:', error);
      showAlert('Failed to start proxy server', 'error');
      setStatusMessage('Failed to start proxy');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setStatusMessage('Stopping proxy server...');
    try {
      const response = await proxyService.stopProxy();
      showAlert(response.message, 'success');

      // Refresh status
      const status = await proxyService.getStatus();
      setStatus(status);
      setStatusMessage('Proxy stopped');
    } catch (error) {
      console.error('Error stopping proxy:', error);
      showAlert('Failed to stop proxy server', 'error');
      setStatusMessage('Failed to stop proxy');
    } finally {
      setLoading(false);
    }
  };

  return { handleStart, handleStop, loading };
}
