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

  const login = async () => {
    console.log('[useCredentials] ⭐ Login button clicked!');
    console.log('[useCredentials] window.electronAPI exists?', !!window.electronAPI);
    console.log('[useCredentials] window.electronAPI:', window.electronAPI);

    setLoading(true);
    setError(null);

    try {
      // Check if running in Electron
      if (window.electronAPI) {
        console.log('[useCredentials] Running in Electron - calling electronAPI.qwen.openLogin()');
        await window.electronAPI.qwen.openLogin();
        console.log('[useCredentials] Login window closed, refreshing credentials...');
        // Credentials are already saved by main process, just refresh the UI
        window.location.reload();
      } else {
        // Browser mode - open in new tab (extension will handle it)
        console.log('[useCredentials] Running in browser - opening Qwen in new tab');
        window.open('https://chat.qwen.ai', '_blank');
      }
    } catch (err) {
      console.error('[useCredentials] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
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
