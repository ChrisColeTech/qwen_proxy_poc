import { useState, useEffect } from 'react';
import { useProxyStore } from '@/stores/useProxyStore';
import { proxyService } from '@/services/proxy.service';
import { useAlertStore } from '@/stores/useAlertStore';
import { isElectron } from '@/utils/platform';
import { credentialsService } from '@/services/credentials.service';
import { useUIStore } from '@/stores/useUIStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';

export function useHomePage() {
  const { wsProxyStatus, connected } = useProxyStore();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const lifecycleState = useLifecycleStore((state) => state.state);
  const [proxyLoading, setProxyLoading] = useState(false);

  // Keep proxyLoading true while lifecycle is in transitional states
  useEffect(() => {
    if (lifecycleState === 'starting' || lifecycleState === 'stopping') {
      setProxyLoading(true);
    } else {
      setProxyLoading(false);
    }
  }, [lifecycleState]);

  const handleStartProxy = async () => {
    setProxyLoading(true);
    // Optimistically set lifecycle state to 'starting' immediately for instant UI feedback
    useLifecycleStore.getState().setState('starting', 'Starting...');
    // Show immediate feedback before API call
    useAlertStore.showAlert('Starting proxy server...', 'info');
    try {
      await proxyService.start();
      // Success/error toasts handled via WebSocket lifecycle events
      // proxyLoading will be cleared by useEffect watching lifecycle state
    } catch (error) {
      console.error('Failed to start proxy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start proxy server';
      useAlertStore.showAlert(errorMessage, 'error');
      // Clear loading and reset lifecycle state on HTTP error (lifecycle events won't fire)
      setProxyLoading(false);
      useLifecycleStore.getState().setState('stopped', 'Stopped');
    }
  };

  const handleStopProxy = async () => {
    setProxyLoading(true);
    // Optimistically set lifecycle state to 'stopping' immediately for instant UI feedback
    useLifecycleStore.getState().setState('stopping', 'Stopping...');
    // Show immediate feedback before API call
    useAlertStore.showAlert('Stopping proxy server...', 'info');
    try {
      await proxyService.stop();
      // Success/error toasts handled via WebSocket lifecycle events
      // proxyLoading will be cleared by useEffect watching lifecycle state
    } catch (error) {
      console.error('Failed to stop proxy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop proxy server';
      useAlertStore.showAlert(errorMessage, 'error');
      // Clear loading and reset lifecycle state on HTTP error (lifecycle events won't fire)
      setProxyLoading(false);
      useLifecycleStore.getState().setState('running', 'Running');
    }
  };

  const handleQwenLogin = async () => {
    console.log('[useHomePage] ⭐ handleQwenLogin called!');
    console.log('[useHomePage] isElectron():', isElectron());
    console.log('[useHomePage] window.electronAPI:', window.electronAPI);

    try {
      // Step 1: Delete old credentials first if they exist (for re-login)
      const hasCredentials = wsProxyStatus?.credentials?.expiresAt;
      if (hasCredentials) {
        useAlertStore.showAlert('Clearing old credentials...', 'success');
        await credentialsService.deleteCredentials();
      }

      // Step 2: Platform-specific login flow
      if (isElectron()) {
        console.log('[useHomePage] Running in Electron - calling electronAPI.qwen.openLogin()');
        // In Electron, call the IPC API to open the login window
        await window.electronAPI?.qwen.openLogin();
        console.log('[useHomePage] Login window closed');
        useAlertStore.showAlert('Credentials saved successfully!', 'success');
        return;
      }

      // Step 3: In browser, check if extension is connected via WebSocket
      const extensionConnected = wsProxyStatus?.extensionConnected ?? false;

      if (!extensionConnected) {
        // Navigate to browser guide page for install instructions
        setCurrentRoute('/browser-guide');
        return;
      }

      // Step 4: Extension is installed, open login window
      window.open('https://chat.qwen.ai', '_blank');
      useAlertStore.showAlert(
        'Please log in to chat.qwen.ai. The extension will automatically extract your credentials.',
        'success'
      );
    } catch (error) {
      console.error('Failed to handle Qwen login:', error);
      useAlertStore.showAlert(
        error instanceof Error ? error.message : 'Failed to prepare login. Please try again.',
        'error'
      );
    }
  };

  return {
    wsProxyStatus,
    connected,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  };
}
