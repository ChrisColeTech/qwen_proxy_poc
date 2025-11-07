import { useState, useEffect } from 'react';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { credentialsService } from '@/services/credentials.service';
import type { CredentialStatus } from '@/types/credentials.types';

export function useCredentials() {
  const { setCredentials, loading, setLoading } = useCredentialsStore();
  const { wsProxyStatus } = useProxyStore();
  const [error, setError] = useState<string | null>(null);

  // Get credentials from WebSocket store, fallback to HTTP polling
  const status: CredentialStatus = wsProxyStatus?.credentials
    ? {
        valid: wsProxyStatus.credentials.valid,
        expiresAt: wsProxyStatus.credentials.expiresAt,
      }
    : { valid: false, expiresAt: null };

  // HTTP polling fallback (only if WebSocket not available)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        await credentialsService.getStatus();
        // Data is fetched but store will be updated via WebSocket
        setError(null);
      } catch (err) {
        console.error('Error fetching credentials:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);

    return () => clearInterval(interval);
  }, [wsProxyStatus]);

  const login = () => {
    window.open('https://chat.qwen.ai', '_blank');
  };

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await credentialsService.deleteCredentials();
      setCredentials(null);
      // WebSocket will handle updating the status
    } catch (err) {
      console.error('Error deleting credentials:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    window.location.reload();
  };

  return {
    status,
    loading,
    error,
    login,
    logout,
    refresh,
  };
}
