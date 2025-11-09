import { isElectron } from '@/utils/platform';
import { useProxyStore } from '@/stores/useProxyStore';

/**
 * Hook to detect Chrome extension installation status
 *
 * Now uses WebSocket-based detection instead of polling.
 * Extension status is received via wsProxyStatus.extensionConnected from the backend.
 *
 * The extension establishes a Socket.io connection to the backend when enabled,
 * and the backend broadcasts the connection status to all frontend clients.
 */
export function useExtensionDetection() {
  const needsExtension = !isElectron();
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);

  // Get extension status from WebSocket broadcast
  const extensionDetected = wsProxyStatus?.extensionConnected ?? false;

  return {
    needsExtension,
    extensionDetected,
  };
}
