import { useEffect, useState } from 'react';
import { websocketService } from '@/services/websocket.service';
import { useProxyStore } from '@/stores/useProxyStore';
import type { WebSocketConnectionStatus } from '@/types';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { url = 'http://localhost:3002', autoConnect = true } = options;

  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>(
    websocketService.getStatus()
  );
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const {
    setConnected,
    updateFromProxyStatus,
    updateFromCredentials,
    updateFromProviders,
    updateFromModels,
  } = useProxyStore();

  useEffect(() => {
    if (!autoConnect) return;

    // Setup WebSocket connection with callbacks
    websocketService.connect(url, {
      onProxyStatus: (event) => {
        updateFromProxyStatus(event);
      },
      onCredentialsUpdated: (event) => {
        updateFromCredentials(event);
      },
      onProvidersUpdated: (event) => {
        updateFromProviders(event);
      },
      onModelsUpdated: (event) => {
        updateFromModels(event);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
        setConnected(status === 'connected');
        setReconnectAttempts(websocketService.getReconnectAttempts());
      },
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
      setConnected(false);
    };
  }, [
    url,
    autoConnect,
    setConnected,
    updateFromProxyStatus,
    updateFromCredentials,
    updateFromProviders,
    updateFromModels,
  ]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    reconnectAttempts,
  };
}
