import { useState } from 'react';
import { credentialsService } from '@/services/credentialsService';
import { browserExtensionService } from '@/services/browser-extension.service';
import { useAlertStore } from '@/stores/useAlertStore';
import { useUIStore } from '@/stores/useUIStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { CREDENTIAL_POLL_INTERVAL } from '@/lib/constants';

export function useCredentialActions() {
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlertStore;
  const setStatusMessage = useUIStore((state) => state.setStatusMessage);
  const refreshStatus = useProxyStore((state) => state.refreshStatus);
  const credentials = useProxyStore((state) => state.status?.credentials);

  const handleConnect = async () => {
    setLoading(true);
    setStatusMessage('Connecting to Qwen...');
    try {
      // Delete old credentials first if they exist (for re-login)
      if (credentials) {
        await credentialsService.revokeCredentials();
        await refreshStatus();
      }

      if (credentialsService.isElectron()) {
        // Open login window - it will auto-extract and send credentials to backend
        await window.electronAPI?.qwen.openLogin();

        // Refresh status to check if credentials were added
        await refreshStatus();
        const currentStatus = useProxyStore.getState().status;

        if (currentStatus?.credentials?.valid) {
          showAlert('Credentials connected successfully', 'success');
          setStatusMessage('Connected to Qwen');
        } else {
          showAlert('Failed to extract credentials. Please try again.', 'error');
          setStatusMessage('Failed to connect');
        }
      } else {
        const extensionInstalled = await browserExtensionService.isExtensionInstalled();

        if (!extensionInstalled) {
          browserExtensionService.openInstallInstructions();
          showAlert('Please install the browser extension first', 'error');
          setStatusMessage('Extension not installed');
          setLoading(false);
          return;
        }

        await browserExtensionService.openQwenLogin();
        showAlert('Please log in to chat.qwen.ai. The extension will automatically extract your credentials.', 'success');
        setStatusMessage('Awaiting login from extension');

        // Poll for new credentials after extension extraction
        const pollInterval = setInterval(async () => {
          await refreshStatus();
          const currentStatus = useProxyStore.getState().status;
          if (currentStatus?.credentials?.valid) {
            setStatusMessage('Connected to Qwen');
            showAlert('Credentials received successfully', 'success');
            clearInterval(pollInterval);
            setLoading(false);
          }
        }, CREDENTIAL_POLL_INTERVAL);

        // Stop polling after 60 seconds
        setTimeout(() => {
          clearInterval(pollInterval);
          setLoading(false);
        }, 60000);
        return;
      }
    } catch (error) {
      console.error('Error connecting:', error);
      showAlert('Failed to connect credentials', 'error');
      setStatusMessage('Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    setStatusMessage('Revoking credentials...');
    try {
      await credentialsService.revokeCredentials();
      await refreshStatus();
      showAlert('Credentials revoked successfully', 'success');
      setStatusMessage('Credentials revoked');
    } catch (error) {
      console.error('Error revoking:', error);
      showAlert('Failed to revoke credentials', 'error');
      setStatusMessage('Failed to revoke credentials');
    } finally {
      setLoading(false);
    }
  };

  return { handleConnect, handleRevoke, loading };
}
