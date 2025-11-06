import { useEffect } from 'react';
import { credentialsService } from '@/services/credentialsService';
import { proxyService } from '@/services/proxyService';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { STATUS_POLL_INTERVAL } from '@/lib/constants';

export function useCredentialPolling() {
  const setCredentials = useCredentialsStore((state) => state.setCredentials);
  const setProxyStatus = useProxyStore((state) => state.setStatus);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        const credentials = await credentialsService.getCredentials();
        setCredentials(credentials);
      } catch (error) {
        console.error('Error fetching credentials:', error);
      }

      try {
        const status = await proxyService.getStatus();
        setProxyStatus(status);
      } catch (error) {
        console.error('Error fetching proxy status:', error);
      }
    };

    fetchData();

    // Poll proxy status every 10 seconds
    const interval = setInterval(async () => {
      try {
        const status = await proxyService.getStatus();
        setProxyStatus(status);
      } catch (error) {
        console.error('Error polling proxy status:', error);
      }
    }, STATUS_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [setCredentials, setProxyStatus]);
}
