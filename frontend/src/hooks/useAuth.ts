import { useState } from 'react';
import { credentialsService } from '@/services/credentialsService';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { useUIStore } from '@/stores/useUIStore';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const setCredentials = useCredentialsStore((state) => state.setCredentials);
  const showAlert = useAlertStore((state) => state.showAlert);
  const setStatusMessage = useUIStore((state) => state.setStatusMessage);

  const handleConnect = async () => {
    setLoading(true);
    setStatusMessage('Connecting to Qwen...');
    try {
      if (credentialsService.isElectron()) {
        // Electron mode: use IPC to open login and extract credentials
        await window.electronAPI?.qwen.openLogin();
        const extracted = await window.electronAPI?.qwen.extractCredentials();

        if (extracted) {
          await credentialsService.setCredentials(extracted);
          const credentials = await credentialsService.getCredentials();
          setCredentials(credentials);
          showAlert('Credentials connected successfully', 'success');
          setStatusMessage('Connected to Qwen');
        }
      } else {
        // Browser mode: show extension instructions
        showAlert('Please install the Chrome extension and log in to chat.qwen.ai', 'success');
        setStatusMessage('Awaiting credentials from extension');
        window.open('/extension-install.html', '_blank');
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
      setCredentials(null);
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
