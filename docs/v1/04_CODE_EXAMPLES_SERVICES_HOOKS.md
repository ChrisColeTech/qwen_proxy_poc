# Code Examples - Services & Hooks

**REFERENCE IMPLEMENTATION**: This document uses `frontend` and `backend` as the source of truth for all correct implementations.

**IMPORTANT**: All file paths in examples use generic naming:
- Use `frontend/src/...` instead of `frontend/src/...`
- Use `backend/src/...` instead of `backend/src/...`

The actual reference implementations are located at:
- Frontend: `/Users/chris/Projects/qwen_proxy_poc/frontend/`
- Backend: `/Users/chris/Projects/qwen_proxy_poc/backend/`

This document contains code examples for services, hooks, and supporting utilities that power the application.

---

## Quick Navigation

- **WebSocket Service**: Real-time communication with Socket.io
- **WebSocket Hook**: React integration for WebSocket events
- **Lifecycle Store**: State management for proxy lifecycle
- **Extension Detection**: WebSocket-based detection hook
- **HomePage Hook**: Complete page logic implementation
- **Services**: Credentials, Proxy, Models, Providers
- **Other Hooks**: Dark mode, credentials, models
- **Stores**: UI, Credentials, Proxy, Alerts
- **Utilities**: Platform detection, formatters

---

## WebSocket Implementation

### frontend/src/services/websocket.service.ts

**Reference**: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/services/websocket.service.ts`

```typescript
import { io, Socket } from 'socket.io-client';
import type {
  ProxyStatusEvent,
  CredentialsUpdatedEvent,
  ProvidersUpdatedEvent,
  ModelsUpdatedEvent,
  LifecycleUpdateEvent,
  WebSocketConnectionStatus,
} from '@/types';

type EventCallback<T> = (data: T) => void;

interface WebSocketCallbacks {
  onProxyStatus?: EventCallback<ProxyStatusEvent>;
  onCredentialsUpdated?: EventCallback<CredentialsUpdatedEvent>;
  onProvidersUpdated?: EventCallback<ProvidersUpdatedEvent>;
  onModelsUpdated?: EventCallback<ModelsUpdatedEvent>;
  onLifecycleUpdate?: EventCallback<LifecycleUpdateEvent>;
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private status: WebSocketConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    // Service is initialized but not connected
  }

  connect(url: string = 'http://localhost:3002', callbacks: WebSocketCallbacks = {}): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to:', url);
    this.callbacks = callbacks;

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log('[WebSocket] Reconnection attempt:', attempt);
      this.reconnectAttempts = attempt;
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      this.updateStatus('disconnected');
    });

    // Business events
    this.socket.on('proxy:status', (data: ProxyStatusEvent) => {
      console.log('[WebSocket] proxy:status', data);
      this.callbacks.onProxyStatus?.(data);
    });

    this.socket.on('credentials:updated', (data: CredentialsUpdatedEvent) => {
      console.log('[WebSocket] credentials:updated', data);
      this.callbacks.onCredentialsUpdated?.(data);
    });

    this.socket.on('providers:updated', (data: ProvidersUpdatedEvent) => {
      console.log('[WebSocket] providers:updated', data);
      this.callbacks.onProvidersUpdated?.(data);
    });

    this.socket.on('models:updated', (data: ModelsUpdatedEvent) => {
      console.log('[WebSocket] models:updated', data);
      this.callbacks.onModelsUpdated?.(data);
    });

    this.socket.on('lifecycle:update', (data: LifecycleUpdateEvent) => {
      console.log('[WebSocket] lifecycle:update', data);
      this.callbacks.onLifecycleUpdate?.(data);
    });
  }

  private updateStatus(status: WebSocketConnectionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.updateStatus('disconnected');
    }
  }

  getStatus(): WebSocketConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
```

**Purpose:**
- Manages Socket.io connection to backend
- Handles automatic reconnection with exponential backoff
- Provides typed event callbacks for business logic
- Singleton service pattern for global WebSocket state
- Transports: WebSocket with polling fallback
- Used by: useWebSocket hook

---

### frontend/src/hooks/useWebSocket.ts

**Reference**: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/hooks/useWebSocket.ts`

```typescript
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
    updateFromLifecycle,
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
      onLifecycleUpdate: (event) => {
        updateFromLifecycle(event);
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
    updateFromLifecycle,
  ]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    reconnectAttempts,
  };
}
```

**Purpose:**
- React hook for WebSocket integration
- Connects on mount, disconnects on unmount
- Updates Zustand stores with real-time data
- Provides connection status to components
- Used by: App.tsx (global WebSocket setup)

---

### frontend/src/stores/useLifecycleStore.ts

**Reference**: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/stores/useLifecycleStore.ts`

```typescript
import { create } from 'zustand';

export type LifecycleState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

interface LifecycleStore {
  state: LifecycleState;
  message: string;
  error: string | null;
  setState: (state: LifecycleState, message: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const useLifecycleStore = create<LifecycleStore>((set) => ({
  state: 'idle',
  message: '',
  error: null,
  setState: (state, message) => set({ state, message, error: null }),
  setError: (error) => set({ state: 'error', error }),
  clearError: () => set({ error: null }),
}));
```

**Purpose:**
- Tracks proxy lifecycle state transitions
- Provides user-facing messages for each state
- Error handling with separate error state
- Used by: HomePage, StatusBar, useHomePage hook
- States: idle → starting → running → stopping → stopped | error

---

## Services Layer

Services provide the API communication layer between the frontend and backend.

### frontend/src/services/credentials.service.ts

```typescript
import type { CredentialStatus } from '@/types/credentials.types';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:3002';

class CredentialsService {
  async getStatus(): Promise<CredentialStatus> {
    const response = await fetch(`${API_URL}/api/qwen/credentials`);
    if (response.ok) {
      const data = await response.json();
      // Transform backend format to frontend format
      return {
        valid: data.isValid || false,
        expiresAt: data.expiresAt ? data.expiresAt * 1000 : null, // Convert seconds to milliseconds
      };
    } else if (response.status === 404) {
      return { valid: false, expiresAt: null };
    }
    throw new Error('Failed to fetch credentials status');
  }

  async deleteCredentials(): Promise<void> {
    const response = await fetch(`${API_URL}/api/qwen/credentials`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Failed to delete credentials');
    }
  }

  getStatusInfo(status: CredentialStatus) {
    if (!status.expiresAt) {
      return {
        icon: XCircle,
        label: 'NOT LOGGED IN',
        variant: 'secondary' as const,
        color: 'credentials-status-inactive',
      };
    }

    const now = Date.now();
    const isExpired = status.expiresAt < now;

    if (isExpired) {
      return {
        icon: AlertCircle,
        label: 'EXPIRED',
        variant: 'destructive' as const,
        color: 'credentials-status-expired',
      };
    }

    return {
      icon: CheckCircle,
      label: 'LOGGED IN',
      variant: 'default' as const,
      color: 'credentials-status-valid',
    };
  }

  formatExpiration(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  getTimeRemaining(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return 'Less than 1 hour';
  }
}

export const credentialsService = new CredentialsService();
```

**Purpose:**
- Manages Qwen credential operations (get status, delete)
- Provides UI helper methods for status display and formatting
- Communicates with backend API at localhost:3002
- Converts backend timestamp format (seconds) to frontend (milliseconds)
- Used by: useCredentials hook, CredentialsStatusCard, HomePage

---

### frontend/src/services/proxy.service.ts

```typescript
import type { ProxyStatus } from '@/types/home.types';

const API_URL = 'http://localhost:3002';

class ProxyService {
  async getStatus(): Promise<ProxyStatus> {
    const response = await fetch(`${API_URL}/api/proxy/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch proxy status');
    }
    return response.json();
  }

  async start(): Promise<void> {
    const response = await fetch(`${API_URL}/api/proxy/start`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to start proxy');
    }
  }

  async stop(): Promise<void> {
    const response = await fetch(`${API_URL}/api/proxy/stop`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to stop proxy');
    }
  }

  formatUptime(seconds?: number): string {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.floor(seconds)}s`;
  }

  formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
}

export const proxyService = new ProxyService();
```

**Purpose:**
- Manages proxy server operations (status, start, stop)
- Provides UI helper methods for formatting uptime and time display
- Communicates with backend API at localhost:3002
- Used by: useHomePage hook, ProxyStatusSection, HomePage

---

### frontend/src/services/models.service.ts

```typescript
import type { Model, ParsedModel, Capability } from '@/types/models.types';

const API_BASE_URL = 'http://localhost:3002';

class ModelsService {
  async getModels(): Promise<Model[]> {
    const response = await fetch(`${API_BASE_URL}/api/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  }

  parseModel(model: Model): ParsedModel {
    let capabilities: Capability[] = [];
    try {
      capabilities = JSON.parse(model.capabilities);
    } catch {
      capabilities = [];
    }

    const providerMatch = model.description.match(/Discovered from (.+)$/);
    const provider = providerMatch ? providerMatch[1] : 'Unknown';

    return {
      id: model.id,
      name: model.name,
      description: model.description.split(' - Discovered from')[0].trim(),
      capabilities,
      provider,
    };
  }

  getCapabilityDisplay(capability: Capability) {
    if (capability === 'chat' || capability === 'completion') {
      return { label: 'chat', color: 'models-capability-chat' };
    }
    if (capability === 'vision' || capability.includes('vl')) {
      return { label: 'vision', color: 'models-capability-vision' };
    }
    if (capability === 'tools' || capability === 'tool-call') {
      return { label: 'tool-call', color: 'models-capability-tools' };
    }
    if (capability === 'code') {
      return { label: 'code', color: 'models-capability-code' };
    }
    return null;
  }
}

export const modelsService = new ModelsService();
```

**Purpose:**
- Fetches models from backend API
- Parses model data and extracts capabilities
- Provides capability display helpers for UI
- Used by: useModels hook, ModelsPage, ModelCard

---

### frontend/src/services/providers.service.ts

```typescript
import type { Provider, ProvidersResponse } from '@/types/providers.types';
import { apiService } from './api.service';

const API_URL = 'http://localhost:3002';

class ProvidersService {
  async getProviders(): Promise<Provider[]> {
    const response = await fetch(`${API_URL}/api/providers`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data: ProvidersResponse = await response.json();
    return data.providers;
  }

  async toggleEnabled(provider: Provider): Promise<void> {
    const action = provider.enabled ? 'disable' : 'enable';
    const response = await fetch(`${API_URL}/api/providers/${provider.id}/${action}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to ${action} provider`);
    }
  }

  async testConnection(providerId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${providerId}/test`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Connection test failed');
    }
  }

  async deleteProvider(providerId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${providerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete provider');
    }
  }

  async switchProvider(providerId: string): Promise<void> {
    try {
      await apiService.setActiveProvider(providerId);
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  async createProvider(data: {
    id: string;
    name: string;
    type: string;
    enabled?: boolean;
    priority?: number;
    description?: string;
    config?: Record<string, unknown>;
  }): Promise<Provider> {
    const response = await fetch(`${API_URL}/api/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create provider');
    }
    return await response.json();
  }

  async getProviderTypes(): Promise<Array<{
    value: string;
    label: string;
    description: string;
    requiredConfig: string[];
    configSchema: Record<string, any>;
  }>> {
    const response = await fetch(`${API_URL}/api/providers/types`);
    if (!response.ok) {
      throw new Error('Failed to fetch provider types');
    }
    const data = await response.json();
    return data.types;
  }
}

export const providersService = new ProvidersService();
```

**Purpose:**
- Manages provider CRUD operations
- Handles provider enable/disable, testing, and switching
- Communicates with backend API at localhost:3002
- Used by: useProviders hook, ProvidersPage, ProvidersTable

---

## Custom Hooks

Hooks encapsulate reusable logic and state management.

### frontend/src/hooks/useCredentials.ts

```typescript
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
```

**Purpose:**
- Manages credential status retrieval and logout
- Primarily uses WebSocket data, with HTTP polling as fallback
- Polls every 60 seconds if WebSocket unavailable
- Provides login, logout, and refresh actions
- Used by: CredentialsStatusCard, HomePage

---

### frontend/src/hooks/useHomePage.ts

```typescript
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
    useAlertStore.showAlert('Starting proxy server...', 'success');
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
    useAlertStore.showAlert('Stopping proxy server...', 'success');
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
    try {
      // Step 1: Delete old credentials first if they exist (for re-login)
      const hasCredentials = wsProxyStatus?.credentials?.expiresAt;
      if (hasCredentials) {
        useAlertStore.showAlert('Clearing old credentials...', 'success');
        await credentialsService.deleteCredentials();
      }

      // Step 2: Platform-specific login flow
      if (isElectron()) {
        // In Electron, directly open the login window (no extension needed)
        window.open('https://chat.qwen.ai', '_blank');
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
        'Failed to prepare login. Please try again.',
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
```

**Purpose:**
- Manages proxy control functionality (start/stop) with optimistic UI updates
- Handles platform-specific Qwen login flow (Electron vs Browser)
- Coordinates between lifecycle state, WebSocket data, and UI feedback
- Provides instant UI feedback before API calls complete
- Used by: HomePage component

---

### frontend/src/hooks/useModels.ts

```typescript
import { useState, useEffect, useMemo } from 'react';
import { modelsService } from '@/services/models.service';
import type { ParsedModel, CapabilityFilter } from '@/types/models.types';

export function useModels() {
  const [models, setModels] = useState<ParsedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capabilityFilter, setCapabilityFilter] = useState<CapabilityFilter>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawModels = await modelsService.getModels();
      const parsed = rawModels.map((m) => modelsService.parseModel(m));
      setModels(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
      console.error('Failed to load models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const providers = useMemo(() => {
    const uniqueProviders = new Set(models.map((m) => m.provider));
    return Array.from(uniqueProviders).sort();
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (capabilityFilter !== 'all') {
        const hasCapability = model.capabilities.some((cap) => {
          if (capabilityFilter === 'chat') return cap === 'chat';
          if (capabilityFilter === 'vision') return cap === 'vision' || cap.includes('vl');
          if (capabilityFilter === 'tool-call') return cap === 'tools' || cap === 'tool-call';
          return false;
        });
        if (!hasCapability) return false;
      }

      if (providerFilter !== 'all' && model.provider !== providerFilter) {
        return false;
      }

      return true;
    });
  }, [models, capabilityFilter, providerFilter]);

  const clearFilters = () => {
    setCapabilityFilter('all');
    setProviderFilter('all');
  };

  return {
    models: filteredModels,
    loading,
    error,
    capabilityFilter,
    providerFilter,
    providers,
    setCapabilityFilter,
    setProviderFilter,
    clearFilters,
    refresh: loadModels,
  };
}
```

**Purpose:**
- Fetches and manages models list with filtering
- Provides capability and provider-based filtering
- Automatically extracts unique providers from models
- Memoizes filtered results for performance
- Used by: ModelsPage component

---

### frontend/src/hooks/useDarkMode.ts

```typescript
import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function useDarkMode() {
  const theme = useUIStore((state) => state.uiState.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return { theme, toggleTheme };
}
```

**Purpose:**
- Applies theme class to document root element
- Syncs with useUIStore theme state
- Ensures theme changes update the DOM
- Used by: App.tsx to initialize theme system

---

## Zustand Stores

State management using Zustand for reactive, persistent application state.

### frontend/src/stores/useUIStore.ts

```typescript
import { create } from 'zustand';
import type { UIState } from '@/types';

interface UIStore {
  uiState: UIState;
  statusMessage: string;
  currentRoute: string;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  toggleSidebarPosition: () => void;
  setShowStatusMessages: (show: boolean) => void;
  toggleShowStatusMessages: () => void;
  setStatusMessage: (message: string) => void;
  setCurrentRoute: (route: string) => void;
  loadSettings: () => Promise<void>;
}

function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI;
}

async function saveUIState(uiState: UIState) {
  const electron = isElectron();
  if (electron && window.electronAPI) {
    await window.electronAPI.settings.set('uiState', uiState);
  } else {
    localStorage.setItem('qwen-proxy-ui-state', JSON.stringify(uiState));
  }
}

async function loadUIState(): Promise<UIState> {
  const electron = isElectron();
  const defaults: UIState = { theme: 'dark', sidebarPosition: 'left', showStatusMessages: true };

  if (electron && window.electronAPI) {
    const stored = await window.electronAPI.settings.get('uiState') as UIState | null;
    return stored ? { ...defaults, ...stored } : defaults;
  } else {
    try {
      const stored = localStorage.getItem('qwen-proxy-ui-state');
      if (stored) {
        const parsed = JSON.parse(stored);
        const uiState = parsed.state?.uiState || parsed;
        if (uiState.theme && uiState.sidebarPosition) {
          return { ...defaults, ...uiState };
        }
      }
    } catch (e) {
      console.error('[UIStore] Failed to load UI state:', e);
    }
    return defaults;
  }
}

export const useUIStore = create<UIStore>((set, get) => ({
  uiState: {
    theme: 'dark',
    sidebarPosition: 'left',
    showStatusMessages: true,
  },
  statusMessage: 'Ready',
  currentRoute: '/',
  setTheme: async (theme) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, theme };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save theme:', error);
      set({ uiState: currentState }); // Rollback
    }
  },
  toggleTheme: async () => {
    const currentState = get().uiState;
    const newTheme: 'light' | 'dark' = currentState.theme === 'light' ? 'dark' : 'light';
    const newState: UIState = { ...currentState, theme: newTheme };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save theme toggle:', error);
      set({ uiState: currentState }); // Rollback
    }
  },
  setSidebarPosition: async (position) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, sidebarPosition: position };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save sidebar position:', error);
      set({ uiState: currentState }); // Rollback
    }
  },
  toggleSidebarPosition: async () => {
    const currentState = get().uiState;
    const newPosition: 'left' | 'right' = currentState.sidebarPosition === 'left' ? 'right' : 'left';
    const newState: UIState = { ...currentState, sidebarPosition: newPosition };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save sidebar position toggle:', error);
      set({ uiState: currentState }); // Rollback
    }
  },
  setShowStatusMessages: async (show) => {
    const currentState = get().uiState;
    const newState: UIState = { ...currentState, showStatusMessages: show };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status messages:', error);
      set({ uiState: currentState }); // Rollback
    }
  },
  toggleShowStatusMessages: async () => {
    const currentState = get().uiState;
    const newValue = !currentState.showStatusMessages;
    const newState: UIState = { ...currentState, showStatusMessages: newValue };
    set({ uiState: newState });
    try {
      await saveUIState(newState);
    } catch (error) {
      console.error('[UIStore] Failed to save show status messages toggle:', error);
      set({ uiState: currentState }); // Rollback
    }
  },
  setStatusMessage: (message) => set({ statusMessage: message }),
  setCurrentRoute: async (route) => {
    set({ currentRoute: route });
    if (isElectron() && window.electronAPI) {
      await window.electronAPI.settings.set('currentRoute', route);
    } else {
      localStorage.setItem('qwen-proxy-current-route', route);
    }
  },
  loadSettings: async () => {
    try {
      const uiState = await loadUIState();
      const currentRoute = isElectron() && window.electronAPI
        ? await window.electronAPI.settings.get('currentRoute') as string || '/'
        : localStorage.getItem('qwen-proxy-current-route') || '/';
      set({ uiState, currentRoute });
    } catch (error) {
      console.error('[UIStore] Failed to load settings:', error);
    }
  },
}));
```

**Purpose:**
- Manages UI state (theme, sidebar position, status messages)
- Persists settings to electron-store (Electron) or localStorage (Browser)
- Provides rollback on save errors
- Auto-loads settings on app startup
- Used by: TitleBar, StatusBar, App.tsx

---

### frontend/src/stores/useCredentialsStore.ts

```typescript
import { create } from 'zustand';
import type { QwenCredentials } from '@/types';

interface CredentialsStore {
  credentials: QwenCredentials | null;
  loading: boolean;
  setCredentials: (credentials: QwenCredentials | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useCredentialsStore = create<CredentialsStore>((set) => ({
  credentials: null,
  loading: false,
  setCredentials: (credentials) => set({ credentials }),
  setLoading: (loading) => set({ loading }),
}));
```

**Purpose:**
- Simple store for credentials state and loading indicator
- Updated by useCredentials hook and WebSocket events
- Used by: CredentialsStatusCard, HomePage

---

## Utilities

### frontend/src/utils/platform.ts

```typescript
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}
```

**Purpose:**
- Platform detection utility
- Returns true if running in Electron, false in browser
- Used by: useHomePage, services, components

---

## Constants

### frontend/src/lib/constants.ts

```typescript
export const APP_NAME = 'Qwen Proxy';
export const APP_VERSION = '1.0.0';
export const TITLEBAR_HEIGHT = 40;
export const STATUSBAR_HEIGHT = 24;
export const API_BASE_URL = 'http://localhost:3002';
export const CREDENTIAL_POLL_INTERVAL = 5000; // 5 seconds
export const STATUS_POLL_INTERVAL = 10000; // 10 seconds
```

**Purpose:**
- Defines application-wide constants
- Configures polling intervals for status updates
- Centralizes API configuration and layout dimensions
- Prevents magic numbers throughout codebase

---

## Component Examples

### frontend/src/components/ui/environment-badge.tsx

See `/Users/chris/Projects/qwen_proxy_poc/docs/v1/03_CODE_EXAMPLES.md` for component examples including:
- TitleBar
- StatusBar
- EnvironmentBadge
- StatusBadge

---

## Summary of Updates

This document has been updated with **actual working code from frontend**. All services, hooks, stores, and utilities are production-ready and actively used.

### What Changed
- **Services**: Updated to class-based patterns with helper methods for UI formatting
- **Hooks**: Updated to WebSocket-first data flow with HTTP polling fallback
- **Stores**: Updated to Zustand with platform-aware persistence (electron-store + localStorage)
- **Utilities**: Simplified to essential platform detection

### Key Patterns

1. **Service Layer**: Class-based services with singleton exports
   ```typescript
   class CredentialsService {
     async getStatus() { /* ... */ }
   }
   export const credentialsService = new CredentialsService();
   ```

2. **Hooks**: Combine Zustand stores + services + lifecycle management
   ```typescript
   export function useHomePage() {
     const { wsProxyStatus } = useProxyStore();
     // ... optimistic updates, error handling, etc.
   }
   ```

3. **Stores**: Platform-aware persistence with error rollback
   ```typescript
   export const useUIStore = create<UIStore>((set, get) => ({
     toggleTheme: async () => {
       try {
         await saveUIState(newState);
       } catch (error) {
         set({ uiState: currentState }); // Rollback
       }
     }
   }));
   ```

---

## LEGACY TYPE DEFINITIONS (For Reference)

**NOTE**: The type definitions below are from older documentation. Frontend uses updated types located in `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/*.types.ts`

### LEGACY: frontend/src/vite-env.d.ts (CRITICAL - TypeScript Declarations)

```typescript
/// <reference types="vite/client" />

interface ElectronAPI {
  qwen: {
    openLogin: () => Promise<void>;
    extractCredentials: () => Promise<{ token: string; cookies: string; expiresAt: number }>;
  };
  clipboard: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
  };
  app: {
    quit: () => void;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximize: (callback: () => void) => void;
    onUnmaximize: (callback: () => void) => void;
  };
  history: {
    read: () => Promise<any>;
    add: (entry: any) => Promise<any>;
    clear: () => Promise<any>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
```

**Purpose:**
- **CRITICAL**: Extends the Window interface with Electron API types
- Provides TypeScript autocomplete for `window.electronAPI`
- Defines all IPC communication interfaces between Electron and React
- Makes TypeScript aware of Vite client types
- **Required for**: TitleBar, useAuth, and any Electron IPC usage

**What it does:**
1. Declares `window.electronAPI` as optional (undefined in browser mode)
2. Types all Electron IPC methods exposed via contextBridge
3. Enables type-safe usage: `window.electronAPI?.qwen.openLogin()`
4. Prevents TypeScript errors when accessing Electron APIs

**Without this file:**
- TypeScript will error: `Property 'electronAPI' does not exist on type 'Window'`
- No autocomplete for Electron API methods
- Type safety is lost for IPC communications

---

### frontend/src/types/index.ts (Additional Types)

```typescript
// Credential types
export interface QwenCredentials {
  token: string;
  sessionId: string;
  refreshToken: string;
  expiresAt: number;
  isExpired: boolean;
}

export interface SetCredentialsRequest {
  token: string;
  sessionId: string;
  refreshToken: string;
}

// Proxy types
export interface ProxyStatusResponse {
  qwenProxy: {
    running: boolean;
    port?: number;
    startedAt?: string;
  } | null;
}

export interface ProxyControlResponse {
  success: boolean;
  message: string;
}

// UI State (already defined in Phase 5)
export interface UIState {
  theme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
}
```

---

## Integration Architecture

### Service → Store → Component Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Component Layer                        │
│  (HomePage, SystemControlCard, StatusBar, etc.)         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│                     Hook Layer                           │
│  useAuth, useProxyControl, useCredentialPolling          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                          │
│  credentialsService, proxyService                        │
│  (API Communication)                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│                 Backend API Layer                        │
│  http://localhost:3002                                   │
│  /api/qwen/credentials, /api/proxy/*                     │
└─────────────────────────────────────────────────────────┘

                 │
                 ↓ (Response)

┌─────────────────────────────────────────────────────────┐
│                   Zustand Stores                         │
│  useCredentialsStore, useProxyStore, useAlertStore       │
│  (State Management)                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓ (Subscribe)

┌─────────────────────────────────────────────────────────┐
│                 Component Re-render                      │
│  React components subscribe to store changes            │
└─────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Using Services Directly

```typescript
import { credentialsService } from '@/services/credentialsService';

// Check credentials
const credentials = await credentialsService.getCredentials();
if (credentials && !credentials.isExpired) {
  console.log('Valid credentials found');
}

// Detect environment
if (credentialsService.isElectron()) {
  console.log('Running in Electron');
}
```

### Using Hooks in Components

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { handleConnect, handleRevoke, loading } = useAuth();

  return (
    <div>
      <button onClick={handleConnect} disabled={loading}>
        Connect
      </button>
      <button onClick={handleRevoke} disabled={loading}>
        Revoke
      </button>
    </div>
  );
}
```

### Polling Pattern

```typescript
import { useCredentialPolling } from '@/hooks/useCredentialPolling';

function HomePage() {
  // Automatically starts polling on mount
  useCredentialPolling();

  // Component can now use stores that are updated by polling
  return <div>Status updates automatically</div>;
}
```

---

## Best Practices

1. **Services**:
   - Keep services stateless
   - Handle errors gracefully
   - Use consistent error logging
   - Return typed responses

2. **Hooks**:
   - One hook, one responsibility
   - Update multiple stores as needed
   - Provide loading states
   - Clean up intervals/subscriptions

3. **Error Handling**:
   - Services: Throw errors with context
   - Hooks: Catch errors, update alert store
   - Components: Display error states

4. **Polling**:
   - Use constants for intervals
   - Clean up intervals on unmount
   - Handle errors without breaking the loop

---

## File Structure

```
frontend/src/
├── services/
│   ├── credentialsService.ts
│   └── proxyService.ts
├── hooks/
│   ├── useDarkMode.ts
│   ├── useCredentialPolling.ts
│   ├── useProxyControl.ts
│   └── useAuth.ts
├── stores/
│   ├── useUIStore.ts
│   ├── useCredentialsStore.ts
│   ├── useProxyStore.ts
│   └── useAlertStore.ts
└── lib/
    └── constants.ts
```
