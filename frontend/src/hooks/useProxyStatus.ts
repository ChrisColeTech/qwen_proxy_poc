import { useEffect } from 'react';
import { proxyService } from '@/services/proxyService';
import { useProxyStore } from '@/stores/useProxyStore';
import { CREDENTIAL_POLL_INTERVAL } from '@/lib/constants';

export function useProxyStatus() {
  const setProxyStatus = useProxyStore((state) => state.setStatus);
  const status = useProxyStore((state) => state.status);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const newStatus = await proxyService.getStatus();
        setProxyStatus(newStatus);
      } catch (error) {
        console.error('Error fetching proxy status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds, but stop once credentials are valid
    const interval = setInterval(() => {
      if (status?.credentials?.valid) {
        clearInterval(interval);
        return;
      }
      fetchStatus();
    }, CREDENTIAL_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [setProxyStatus, status?.credentials?.valid]);
}
