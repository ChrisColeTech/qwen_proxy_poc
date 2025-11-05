import { useState, useEffect, useCallback } from 'react';
import { credentialsService } from '@/services/credentials.service';
import { electronIPCService } from '@/services/electron-ipc.service';
import { browserExtensionService } from '@/services/browser-extension.service';
import { useCredentialsStore } from '@/stores/useCredentialsStore';

export function useCredentials() {
  const { status, loading, error, setStatus, setLoading, setError, clearCredentials, setCredentials } =
    useCredentialsStore();
  const [refreshKey, setRefreshKey] = useState(0);

  const isElectron = electronIPCService.isAvailable;

  const loadStatus = useCallback(async () => {
    try {
      const result = await credentialsService.getCredentialStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to load credential status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [setStatus, setError]);

  useEffect(() => {
    loadStatus();

    if (status.hasCredentials && status.isValid) {
      return;
    }

    const pollInterval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [refreshKey, status.hasCredentials, status.isValid, loadStatus]);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      if (status.hasCredentials) {
        await credentialsService.deleteCredentials();
        clearCredentials();
        setRefreshKey((k) => k + 1);
      }

      if (isElectron) {
        // Electron flow: Open window, extract credentials, save to API, update UI immediately
        await electronIPCService.openQwenLogin();
        const credentials = await electronIPCService.extractQwenCredentials();
        await credentialsService.saveCredentials(credentials);
        setCredentials(credentials);
        setStatus({
          hasCredentials: true,
          isValid: true,
          expiresAt: credentials.expiresAt,
        });
        setLoading(false);
        setRefreshKey((k) => k + 1);
      } else {
        // Browser flow: Check extension, open login page, let extension extract and POST credentials
        const extensionInstalled = await browserExtensionService.isExtensionInstalled();

        if (!extensionInstalled) {
          setLoading(false);
          throw new Error('browser extension not installed');
        }

        // Open login page - extension will extract credentials and POST to API
        // Polling will detect new credentials within 5 seconds
        await browserExtensionService.openQwenLogin();
        setLoading(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login failed:', err);
      setLoading(false);
      throw err;
    }
  };

  const deleteCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      await credentialsService.deleteCredentials();
      clearCredentials();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete credentials';
      setError(message);
      console.error('Failed to delete credentials:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    error,
    isElectron,
    login,
    deleteCredentials,
  };
}
