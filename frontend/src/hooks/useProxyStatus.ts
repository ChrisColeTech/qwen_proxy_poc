import { useEffect, useState, useCallback } from 'react';
import { proxyService } from '@/services/proxy.service';
import { useProxyStore } from '@/stores/useProxyStore';

export function useProxyStatus() {
  const { status, setStatus } = useProxyStore();
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const proxyStatus = await proxyService.getProxyStatus();
      setStatus(proxyStatus);
    } catch (err) {
      console.error('Failed to fetch proxy status:', err);
    } finally {
      setLoading(false);
    }
  }, [setStatus]);

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(fetchStatus, 10000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status,
    loading,
    refetch: fetchStatus,
  };
}
