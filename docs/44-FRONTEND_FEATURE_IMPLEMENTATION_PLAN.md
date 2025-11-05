# Document 44: Frontend Feature Implementation Plan

**Created:** 2025-11-04
**Status:** Active Implementation Plan
**Purpose:** Comprehensive implementation plan for frontend features based on Doc 27 architecture
**Reference:** Doc 27 (Frontend Architecture Guide)

---

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| [Phase 1](#phase-1-type-definitions-and-interfaces) | P0 | ⬜ Not Started | Type definitions and interfaces |
| [Phase 2](#phase-2-api-configuration) | P0 | ⬜ Not Started | API configuration and constants |
| [Phase 3](#phase-3-api-service-layer) | P0 | ⬜ Not Started | HTTP API service |
| [Phase 4](#phase-4-electron-ipc-service-layer) | P0 | ⬜ Not Started | Electron IPC service |
| [Phase 5](#phase-5-status-and-health-hooks) | P1 | ⬜ Not Started | Status polling and health check hooks |
| [Phase 6](#phase-6-proxy-control-hook) | P1 | ⬜ Not Started | Proxy control hook |
| [Phase 7](#phase-7-credentials-service) | P1 | ⬜ Not Started | Credentials service (hybrid) |
| [Phase 8](#phase-8-proxy-control-components) | P2 | ⬜ Not Started | Proxy control UI components |
| [Phase 9](#phase-9-credentials-management-components) | P2 | ⬜ Not Started | Credentials management components |
| [Phase 10](#phase-10-dashboard-page) | P3 | ⬜ Not Started | Dashboard page integration |
| [Phase 11](#phase-11-settings-page) | P3 | ⬜ Not Started | Settings page |
| [Phase 12](#phase-12-providers-page) | P3 | ⬜ Not Started | Providers admin page |
| [Phase 13](#phase-13-models-page) | P3 | ⬜ Not Started | Models admin page |
| [Phase 14](#phase-14-sessions-page) | P3 | ⬜ Not Started | Sessions admin page |
| [Phase 15](#phase-15-activity-page) | P3 | ⬜ Not Started | Activity/Request History page |
| [Phase 16](#phase-16-navigation-and-routing) | P3 | ⬜ Not Started | Navigation and routing setup |
| [Phase 17](#phase-17-electron-qwen-authentication) | P4 | ⬜ Not Started | Electron Qwen authentication IPC |
| [Phase 18](#phase-18-electron-api-server-lifecycle) | P4 | ⬜ Not Started | Electron API Server spawning |

**Priority Levels:**
- **P0**: Foundation (blocking all other work)
- **P1**: Core functionality (blocking feature components)
- **P2**: Feature components (blocking pages)
- **P3**: Pages (user-facing features)
- **P4**: Electron lifecycle (production readiness)

---

## Phase 1: Type Definitions and Interfaces

**Priority:** P0 (Foundation)
**Dependencies:** None
**Blocks:** All subsequent phases

### Files to Create

```
frontend/src/types/
├── api.types.ts          # API request/response types
├── proxy.types.ts        # Proxy status, config types
├── credentials.types.ts  # Qwen credentials types
├── provider.types.ts     # Provider types
├── model.types.ts        # Model types
├── session.types.ts      # Session types
└── activity.types.ts     # Request/Response history types
```

### Files to Modify

- `frontend/src/types/index.ts` - Add exports for new types

### Type Definitions

**frontend/src/types/api.types.ts**
```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  services: {
    apiServer: boolean;
    providerRouter: boolean;
    qwenProxy: boolean;
  };
}

// Error response
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
```

**frontend/src/types/proxy.types.ts**
```typescript
export interface ProxyStatus {
  running: boolean;
  port: number;
  uptime?: number;
  requestCount?: number;
}

export interface ProxyConfig {
  port: number;
  autoStart: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

**frontend/src/types/credentials.types.ts**
```typescript
export interface QwenCredentials {
  token: string;
  cookies: string;
  expiresAt: number;
}

export interface CredentialStatus {
  hasCredentials: boolean;
  isValid: boolean;
  expiresAt?: number;
}
```

**frontend/src/types/provider.types.ts**
```typescript
export interface Provider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  priority: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProviderStats {
  providerId: string;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
}
```

**frontend/src/types/model.types.ts**
```typescript
export interface Model {
  id: string;
  name: string;
  providerId: string;
  displayName: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  enabled: boolean;
}

export interface ModelMapping {
  qwenModel: string;
  targetModel: string;
  providerId: string;
}
```

**frontend/src/types/session.types.ts**
```typescript
export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  requestCount: number;
  active: boolean;
}
```

**frontend/src/types/activity.types.ts**
```typescript
export interface RequestLog {
  id: string;
  sessionId: string;
  timestamp: number;
  method: string;
  path: string;
  model: string;
  provider: string;
  statusCode: number;
  duration: number;
  tokenCount?: number;
}

export interface ActivityStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  tokenUsage: number;
}
```

### Integration Points

- `frontend/src/types/electron.types.ts` (existing)
- `frontend/src/types/index.ts` (existing)

### Structure After Phase 1

```
frontend/src/types/
├── index.ts
├── electron.types.ts      # ✅ Existing
├── api.types.ts           # 🆕 New
├── proxy.types.ts         # 🆕 New
├── credentials.types.ts   # 🆕 New
├── provider.types.ts      # 🆕 New
├── model.types.ts         # 🆕 New
├── session.types.ts       # 🆕 New
└── activity.types.ts      # 🆕 New
```

### Validation

- [ ] All types export correctly from `types/index.ts`
- [ ] TypeScript compilation passes
- [ ] No circular dependencies

---

## Phase 2: API Configuration

**Priority:** P0 (Foundation)
**Dependencies:** Phase 1
**Blocks:** Phase 3

### Files to Create

```
frontend/src/config/
└── api.ts    # API Server configuration
```

### Content

**frontend/src/config/api.ts**
```typescript
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  timeout: 10000, // 10 seconds

  endpoints: {
    // Health
    health: '/api/health',

    // Proxy management
    proxyStart: '/api/proxy/start',
    proxyStop: '/api/proxy/stop',
    proxyStatus: '/api/proxy/status',
    proxyConfig: '/api/proxy/config',

    // Credentials
    credentialsGet: '/api/qwen/credentials',
    credentialsSave: '/api/qwen/credentials',
    credentialsDelete: '/api/qwen/credentials',

    // Providers
    providersList: '/api/providers',
    providersCreate: '/api/providers',
    providersUpdate: (id: string) => `/api/providers/${id}`,
    providersDelete: (id: string) => `/api/providers/${id}`,
    providersStats: '/api/providers/stats',

    // Models
    modelsList: '/api/models',
    modelsSync: '/api/models/sync',
    modelMappings: '/api/models/mappings',
    modelMappingCreate: '/api/models/mappings',
    modelMappingDelete: (id: string) => `/api/models/mappings/${id}`,

    // Sessions
    sessionsList: '/api/sessions',
    sessionsActive: '/api/sessions/active',
    sessionsDelete: (id: string) => `/api/sessions/${id}`,
    sessionsCleanup: '/api/sessions/cleanup',

    // Activity
    activityRequests: '/api/activity/requests',
    activityStats: '/api/activity/stats',
  },
} as const;
```

### Files to Modify

None

### Integration Points

- Will be used by `services/api.service.ts` (Phase 3)

### Structure After Phase 2

```
frontend/src/
├── config/
│   └── api.ts            # 🆕 New
├── types/
│   └── ...               # ✅ From Phase 1
```

### Validation

- [ ] Environment variable support works
- [ ] Endpoint functions return correct paths
- [ ] Configuration imports correctly

---

## Phase 3: API Service Layer

**Priority:** P0 (Foundation)
**Dependencies:** Phase 1, Phase 2
**Blocks:** Phase 5, Phase 6, Phase 7

### Files to Create

```
frontend/src/services/
└── api.service.ts    # HTTP API service
```

### Content

**frontend/src/services/api.service.ts**
```typescript
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '@/config/api';
import type {
  ApiResponse,
  HealthCheckResponse,
  ProxyStatus,
  ProxyConfig,
  QwenCredentials,
  Provider,
  Model,
  ModelMapping,
  Session,
  RequestLog,
  ActivityStats,
} from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health
  async checkHealth(): Promise<HealthCheckResponse> {
    const response = await this.client.get(API_CONFIG.endpoints.health);
    return response.data;
  }

  // Proxy management
  async startProxy(): Promise<ApiResponse<ProxyStatus>> {
    const response = await this.client.post(API_CONFIG.endpoints.proxyStart);
    return response.data;
  }

  async stopProxy(): Promise<ApiResponse<ProxyStatus>> {
    const response = await this.client.post(API_CONFIG.endpoints.proxyStop);
    return response.data;
  }

  async getProxyStatus(): Promise<ProxyStatus> {
    const response = await this.client.get(API_CONFIG.endpoints.proxyStatus);
    return response.data;
  }

  async updateProxyConfig(config: ProxyConfig): Promise<ApiResponse<ProxyConfig>> {
    const response = await this.client.put(API_CONFIG.endpoints.proxyConfig, config);
    return response.data;
  }

  // Credentials
  async getCredentials(): Promise<QwenCredentials | null> {
    const response = await this.client.get(API_CONFIG.endpoints.credentialsGet);
    return response.data;
  }

  async saveCredentials(credentials: QwenCredentials): Promise<ApiResponse<void>> {
    const response = await this.client.post(
      API_CONFIG.endpoints.credentialsSave,
      credentials
    );
    return response.data;
  }

  async deleteCredentials(): Promise<ApiResponse<void>> {
    const response = await this.client.delete(API_CONFIG.endpoints.credentialsDelete);
    return response.data;
  }

  // Providers
  async listProviders(): Promise<Provider[]> {
    const response = await this.client.get(API_CONFIG.endpoints.providersList);
    return response.data;
  }

  async createProvider(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider> {
    const response = await this.client.post(API_CONFIG.endpoints.providersCreate, provider);
    return response.data;
  }

  async updateProvider(id: string, provider: Partial<Provider>): Promise<Provider> {
    const response = await this.client.put(
      API_CONFIG.endpoints.providersUpdate(id),
      provider
    );
    return response.data;
  }

  async deleteProvider(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(API_CONFIG.endpoints.providersDelete(id));
    return response.data;
  }

  // Models
  async listModels(): Promise<Model[]> {
    const response = await this.client.get(API_CONFIG.endpoints.modelsList);
    return response.data;
  }

  async syncModels(): Promise<ApiResponse<void>> {
    const response = await this.client.post(API_CONFIG.endpoints.modelsSync);
    return response.data;
  }

  async getModelMappings(): Promise<ModelMapping[]> {
    const response = await this.client.get(API_CONFIG.endpoints.modelMappings);
    return response.data;
  }

  // Sessions
  async listSessions(): Promise<Session[]> {
    const response = await this.client.get(API_CONFIG.endpoints.sessionsList);
    return response.data;
  }

  async deleteSession(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(API_CONFIG.endpoints.sessionsDelete(id));
    return response.data;
  }

  async cleanupSessions(): Promise<ApiResponse<void>> {
    const response = await this.client.post(API_CONFIG.endpoints.sessionsCleanup);
    return response.data;
  }

  // Activity
  async getRequestLogs(params?: { limit?: number; offset?: number }): Promise<RequestLog[]> {
    const response = await this.client.get(API_CONFIG.endpoints.activityRequests, {
      params,
    });
    return response.data;
  }

  async getActivityStats(): Promise<ActivityStats> {
    const response = await this.client.get(API_CONFIG.endpoints.activityStats);
    return response.data;
  }
}

export const apiService = new ApiService();
```

### Files to Modify

None

### Integration Points

- `frontend/src/config/api.ts` (Phase 2)
- `frontend/src/types/*` (Phase 1)

### Structure After Phase 3

```
frontend/src/
├── config/
│   └── api.ts            # ✅ From Phase 2
├── services/
│   └── api.service.ts    # 🆕 New
├── types/
│   └── ...               # ✅ From Phase 1
```

### Validation

- [ ] Service instantiates correctly
- [ ] All methods compile without errors
- [ ] Error handling works (try/catch in components)

---

## Phase 4: Electron IPC Service Layer

**Priority:** P0 (Foundation)
**Dependencies:** Phase 1
**Blocks:** Phase 7, Phase 9

### Files to Create

```
frontend/src/services/
└── electron-ipc.service.ts    # Electron IPC wrapper
```

### Content

**frontend/src/services/electron-ipc.service.ts**
```typescript
import type { QwenCredentials } from '@/types';

class ElectronIPCService {
  private get api() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI;
  }

  get isAvailable(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  // Window controls
  minimizeWindow(): void {
    this.api.window.minimize();
  }

  maximizeWindow(): void {
    this.api.window.maximize();
  }

  closeWindow(): void {
    this.api.window.close();
  }

  // Clipboard operations
  async copyToClipboard(text: string): Promise<void> {
    await this.api.clipboard.writeText(text);
  }

  async readFromClipboard(): Promise<string> {
    return await this.api.clipboard.readText();
  }

  // App lifecycle
  quitApp(): void {
    this.api.app.quit();
  }

  // Qwen authentication (to be implemented in Phase 17)
  async openQwenLogin(): Promise<void> {
    // Will be implemented when Electron handlers are added
    throw new Error('Not implemented yet');
  }

  async extractQwenCredentials(): Promise<QwenCredentials> {
    // Will be implemented when Electron handlers are added
    throw new Error('Not implemented yet');
  }
}

export const electronIPCService = new ElectronIPCService();
```

### Files to Modify

- `frontend/src/types/electron.types.ts` - Add Qwen authentication methods to ElectronAPI interface (Phase 17)

### Integration Points

- `frontend/src/types/electron.types.ts` (existing)
- `window.electronAPI` from preload script

### Structure After Phase 4

```
frontend/src/
├── services/
│   ├── api.service.ts           # ✅ From Phase 3
│   └── electron-ipc.service.ts  # 🆕 New
├── types/
│   └── ...                      # ✅ From Phase 1
```

### Validation

- [ ] Service detects Electron environment correctly
- [ ] Window controls work in Electron
- [ ] Clipboard operations work in Electron
- [ ] Graceful degradation in browser (throws error)

---

## Phase 5: Status and Health Hooks

**Priority:** P1 (Core Functionality)
**Dependencies:** Phase 3
**Blocks:** Phase 8, Phase 10

### Files to Create

```
frontend/src/hooks/
├── useProxyStatus.ts    # Proxy status polling
└── useApiHealth.ts      # API health check
```

### Content

**frontend/src/hooks/useProxyStatus.ts**
```typescript
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';
import type { ProxyStatus } from '@/types';

export function useProxyStatus(pollingInterval = 5000) {
  const [status, setStatus] = useState<ProxyStatus>({
    running: false,
    port: 8000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const result = await apiService.getProxyStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to get proxy status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus({ running: false, port: 8000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshStatus();

    // Poll every pollingInterval
    const interval = setInterval(refreshStatus, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  return { status, loading, error, refreshStatus };
}
```

**frontend/src/hooks/useApiHealth.ts**
```typescript
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';
import type { HealthCheckResponse } from '@/types';

export function useApiHealth(checkInterval = 30000) {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      const result = await apiService.checkHealth();
      setHealth(result);
      setIsHealthy(result.status === 'healthy');
    } catch (err) {
      console.error('API health check failed:', err);
      setHealth(null);
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Check periodically
    const interval = setInterval(checkHealth, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return { health, isHealthy, loading, checkHealth };
}
```

### Files to Modify

None

### Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/types/api.types.ts` (Phase 1)
- `frontend/src/types/proxy.types.ts` (Phase 1)

### Structure After Phase 5

```
frontend/src/
├── hooks/
│   ├── useProxyStatus.ts    # 🆕 New
│   └── useApiHealth.ts      # 🆕 New
├── services/
│   └── ...                  # ✅ From Phase 3-4
```

### Validation

- [ ] Status polling starts automatically
- [ ] Polling interval can be customized
- [ ] Hooks clean up intervals on unmount
- [ ] Error states handled correctly

---

## Phase 6: Proxy Control Hook

**Priority:** P1 (Core Functionality)
**Dependencies:** Phase 3, Phase 5
**Blocks:** Phase 8

### Files to Create

```
frontend/src/hooks/
└── useProxyControl.ts    # Proxy start/stop control
```

### Content

**frontend/src/hooks/useProxyControl.ts**
```typescript
import { useState } from 'react';
import { apiService } from '@/services/api.service';

export function useProxyControl() {
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startProxy = async () => {
    setStarting(true);
    setError(null);
    try {
      const result = await apiService.startProxy();
      if (!result.success) {
        throw new Error(result.error || 'Failed to start proxy');
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to start proxy:', err);
      throw err;
    } finally {
      setStarting(false);
    }
  };

  const stopProxy = async () => {
    setStopping(true);
    setError(null);
    try {
      const result = await apiService.stopProxy();
      if (!result.success) {
        throw new Error(result.error || 'Failed to stop proxy');
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to stop proxy:', err);
      throw err;
    } finally {
      setStopping(false);
    }
  };

  return {
    startProxy,
    stopProxy,
    starting,
    stopping,
    error,
  };
}
```

### Files to Modify

None

### Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)

### Structure After Phase 6

```
frontend/src/
├── hooks/
│   ├── useProxyStatus.ts     # ✅ From Phase 5
│   ├── useApiHealth.ts       # ✅ From Phase 5
│   └── useProxyControl.ts    # 🆕 New
```

### Validation

- [ ] Start/stop operations work
- [ ] Loading states update correctly
- [ ] Errors are captured and exposed
- [ ] Can be used in components

---

## Phase 7: Credentials Service

**Priority:** P1 (Core Functionality)
**Dependencies:** Phase 3, Phase 4
**Blocks:** Phase 9

### Files to Create

```
frontend/src/services/
└── credentials.service.ts    # Hybrid credentials service
```

### Content

**frontend/src/services/credentials.service.ts**
```typescript
import { apiService } from './api.service';
import { electronIPCService } from './electron-ipc.service';
import type { QwenCredentials, CredentialStatus } from '@/types';

class CredentialsService {
  // Use Electron IPC to open login browser (Electron only)
  async openLogin(): Promise<void> {
    if (!electronIPCService.isAvailable) {
      throw new Error('Electron API not available. This feature requires the desktop app.');
    }
    await electronIPCService.openQwenLogin();
  }

  // Use Electron IPC to extract credentials from browser session (Electron only)
  async extractCredentials(): Promise<QwenCredentials> {
    if (!electronIPCService.isAvailable) {
      throw new Error('Electron API not available. This feature requires the desktop app.');
    }
    return await electronIPCService.extractQwenCredentials();
  }

  // Use HTTP API to save credentials to backend
  async saveCredentials(credentials: QwenCredentials): Promise<void> {
    const result = await apiService.saveCredentials(credentials);
    if (!result.success) {
      throw new Error(result.error || 'Failed to save credentials');
    }
  }

  // Use HTTP API to get stored credentials
  async getStoredCredentials(): Promise<QwenCredentials | null> {
    return await apiService.getCredentials();
  }

  // Use HTTP API to delete credentials
  async deleteCredentials(): Promise<void> {
    const result = await apiService.deleteCredentials();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete credentials');
    }
  }

  // Check if credentials exist and are valid
  async getCredentialStatus(): Promise<CredentialStatus> {
    try {
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        return { hasCredentials: false, isValid: false };
      }

      const isValid = credentials.expiresAt > Date.now();
      return {
        hasCredentials: true,
        isValid,
        expiresAt: credentials.expiresAt,
      };
    } catch (err) {
      console.error('Failed to get credential status:', err);
      return { hasCredentials: false, isValid: false };
    }
  }
}

export const credentialsService = new CredentialsService();
```

### Files to Modify

None

### Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/services/electron-ipc.service.ts` (Phase 4)
- `frontend/src/types/credentials.types.ts` (Phase 1)

### Structure After Phase 7

```
frontend/src/
├── services/
│   ├── api.service.ts           # ✅ From Phase 3
│   ├── electron-ipc.service.ts  # ✅ From Phase 4
│   └── credentials.service.ts   # 🆕 New
```

### Validation

- [ ] Service gracefully handles non-Electron environment
- [ ] Can save/retrieve credentials via HTTP
- [ ] Status check works correctly
- [ ] Error messages are clear

---

## Phase 8: Proxy Control Components

**Priority:** P2 (Feature Components)
**Dependencies:** Phase 5, Phase 6
**Blocks:** Phase 10

### Files to Create

```
frontend/src/components/features/
└── proxy/
    ├── ProxyStatusIndicator.tsx    # Visual status indicator
    ├── ProxyControlButtons.tsx     # Start/Stop buttons
    └── ProxyConfigForm.tsx         # Configuration form
```

### Content

**frontend/src/components/features/proxy/ProxyStatusIndicator.tsx**
```typescript
import { useProxyStatus } from '@/hooks/useProxyStatus';

export function ProxyStatusIndicator() {
  const { status, loading, error } = useProxyStatus();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Checking status...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          status.running ? 'bg-green-500' : 'bg-muted'
        }`}
      />
      <span className={status.running ? 'text-foreground' : 'text-muted-foreground'}>
        {status.running ? `Running on port ${status.port}` : 'Stopped'}
      </span>
    </div>
  );
}
```

**frontend/src/components/features/proxy/ProxyControlButtons.tsx**
```typescript
import { Button } from '@/components/ui/button';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useProxyStatus } from '@/hooks/useProxyStatus';

export function ProxyControlButtons() {
  const { status, refreshStatus } = useProxyStatus();
  const { startProxy, stopProxy, starting, stopping } = useProxyControl();

  const handleStart = async () => {
    try {
      await startProxy();
      await refreshStatus();
    } catch (err) {
      // Error already handled in hook
    }
  };

  const handleStop = async () => {
    try {
      await stopProxy();
      await refreshStatus();
    } catch (err) {
      // Error already handled in hook
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleStart}
        disabled={status.running || starting}
        variant={status.running ? 'secondary' : 'default'}
      >
        {starting ? 'Starting...' : 'Start Proxy'}
      </Button>
      <Button
        onClick={handleStop}
        disabled={!status.running || stopping}
        variant="outline"
      >
        {stopping ? 'Stopping...' : 'Stop Proxy'}
      </Button>
    </div>
  );
}
```

**frontend/src/components/features/proxy/ProxyConfigForm.tsx**
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api.service';
import type { ProxyConfig } from '@/types';

export function ProxyConfigForm() {
  const [config, setConfig] = useState<ProxyConfig>({
    port: 8000,
    autoStart: false,
    logLevel: 'info',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateProxyConfig(config);
      // Show success message
    } catch (err) {
      console.error('Failed to save config:', err);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="port">Port</Label>
        <Input
          id="port"
          type="number"
          value={config.port}
          onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="logLevel">Log Level</Label>
        <select
          id="logLevel"
          className="w-full border rounded px-3 py-2"
          value={config.logLevel}
          onChange={(e) => setConfig({ ...config, logLevel: e.target.value as any })}
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  );
}
```

### Files to Modify

None

### Integration Points

- `frontend/src/hooks/useProxyStatus.ts` (Phase 5)
- `frontend/src/hooks/useProxyControl.ts` (Phase 6)
- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/components/ui/*` (existing shadcn components)

### Structure After Phase 8

```
frontend/src/
├── components/
│   ├── features/
│   │   └── proxy/
│   │       ├── ProxyStatusIndicator.tsx    # 🆕 New
│   │       ├── ProxyControlButtons.tsx     # 🆕 New
│   │       └── ProxyConfigForm.tsx         # 🆕 New
│   ├── layout/
│   │   └── ...                             # ✅ Existing
│   └── ui/
│       └── ...                             # ✅ Existing
```

### Validation

- [ ] Status indicator updates in real-time
- [ ] Start/Stop buttons work correctly
- [ ] Configuration form saves properly
- [ ] Loading states display correctly
- [ ] Error states handled gracefully

---

## Phase 9: Credentials Management Components

**Priority:** P2 (Feature Components)
**Dependencies:** Phase 7
**Blocks:** Phase 10, Phase 11

### Files to Create

```
frontend/src/components/features/
└── credentials/
    ├── CredentialStatusCard.tsx     # Shows credential status
    ├── LoginButton.tsx              # Qwen login button
    └── CredentialManager.tsx        # Full credential management
```

### Content

**frontend/src/components/features/credentials/CredentialStatusCard.tsx**
```typescript
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { credentialsService } from '@/services/credentials.service';
import type { CredentialStatus } from '@/types';

export function CredentialStatusCard() {
  const [status, setStatus] = useState<CredentialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const result = await credentialsService.getCredentialStatus();
    setStatus(result);
    setLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Qwen Credentials</h3>
        <div className="text-sm">
          <div>
            Status:{' '}
            {status?.hasCredentials ? (
              <span className={status.isValid ? 'text-green-600' : 'text-yellow-600'}>
                {status.isValid ? 'Valid' : 'Expired'}
              </span>
            ) : (
              <span className="text-muted-foreground">Not configured</span>
            )}
          </div>
          {status?.expiresAt && (
            <div className="text-muted-foreground">
              Expires: {new Date(status.expiresAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

**frontend/src/components/features/credentials/LoginButton.tsx**
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { credentialsService } from '@/services/credentials.service';
import { electronIPCService } from '@/services/electron-ipc.service';

interface LoginButtonProps {
  onLoginComplete?: () => void;
}

export function LoginButton({ onLoginComplete }: LoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Open Electron browser to login
      await credentialsService.openLogin();

      // Extract credentials (happens automatically after login)
      const credentials = await credentialsService.extractCredentials();

      // Save to backend via HTTP API
      await credentialsService.saveCredentials(credentials);

      onLoginComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!electronIPCService.isAvailable) {
    return (
      <div className="text-sm text-muted-foreground">
        Login feature requires desktop app
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login to Qwen'}
      </Button>
      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  );
}
```

**frontend/src/components/features/credentials/CredentialManager.tsx**
```typescript
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CredentialStatusCard } from './CredentialStatusCard';
import { LoginButton } from './LoginButton';
import { credentialsService } from '@/services/credentials.service';

export function CredentialManager() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete saved credentials?')) {
      return;
    }

    try {
      await credentialsService.deleteCredentials();
      setRefreshKey((k) => k + 1); // Force refresh
    } catch (err) {
      console.error('Failed to delete credentials:', err);
    }
  };

  return (
    <div className="space-y-4">
      <CredentialStatusCard key={refreshKey} />
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold">Manage Credentials</h3>
        <LoginButton onLoginComplete={() => setRefreshKey((k) => k + 1)} />
        <Button variant="destructive" onClick={handleDelete}>
          Delete Credentials
        </Button>
      </Card>
    </div>
  );
}
```

### Files to Modify

None

### Integration Points

- `frontend/src/services/credentials.service.ts` (Phase 7)
- `frontend/src/services/electron-ipc.service.ts` (Phase 4)
- `frontend/src/types/credentials.types.ts` (Phase 1)
- `frontend/src/components/ui/*` (existing shadcn components)

### Structure After Phase 9

```
frontend/src/
├── components/
│   ├── features/
│   │   ├── credentials/
│   │   │   ├── CredentialStatusCard.tsx    # 🆕 New
│   │   │   ├── LoginButton.tsx             # 🆕 New
│   │   │   └── CredentialManager.tsx       # 🆕 New
│   │   └── proxy/
│   │       └── ...                         # ✅ From Phase 8
```

### Validation

- [ ] Credential status displays correctly
- [ ] Login flow works in Electron
- [ ] Non-Electron graceful degradation
- [ ] Delete confirmation works
- [ ] UI refreshes after login/delete

---

## Phase 10: Dashboard Page

**Priority:** P3 (Pages)
**Dependencies:** Phase 5, Phase 8, Phase 9
**Blocks:** None

### Page Structure

Dashboard has no parent-child relationships - it's a standalone page.

### Files to Create

```
frontend/src/pages/dashboard/
├── DashboardPage.tsx              # Parent page router (mobile/desktop switching)
├── DashboardMainPage.tsx          # Desktop main page
└── MobileDashboardMainPage.tsx    # Mobile main page
```

### Files to Modify

- `frontend/src/App.tsx` - Import and route to DashboardPage

### Content

**frontend/src/pages/dashboard/DashboardPage.tsx**
```typescript
// Parent router - switches between mobile and desktop
import { useIsMobile } from '@/hooks/useIsMobile';
import { DashboardMainPage } from './DashboardMainPage';
import { MobileDashboardMainPage } from './MobileDashboardMainPage';

export function DashboardPage() {
  const isMobile = useIsMobile();

  const CurrentPageComponent = isMobile ? MobileDashboardMainPage : DashboardMainPage;

  return <CurrentPageComponent />;
}
```

**frontend/src/pages/dashboard/DashboardMainPage.tsx**
```typescript
import { Card } from '@/components/ui/card';
import { ProxyStatusIndicator } from '@/components/features/proxy/ProxyStatusIndicator';
import { ProxyControlButtons } from '@/components/features/proxy/ProxyControlButtons';
import { CredentialStatusCard } from '@/components/features/credentials/CredentialStatusCard';
import { useApiHealth } from '@/hooks/useApiHealth';

export function Dashboard() {
  const { isHealthy, loading } = useApiHealth();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your Qwen Proxy configuration and status
        </p>
      </div>

      {/* API Health */}
      {loading ? (
        <div>Checking API health...</div>
      ) : !isHealthy ? (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <div className="text-destructive font-semibold">
            API Server is not responding. Please check if it's running.
          </div>
        </Card>
      ) : null}

      {/* Proxy Status */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Proxy Status</h2>
          <div className="mt-2">
            <ProxyStatusIndicator />
          </div>
        </div>
        <ProxyControlButtons />
      </Card>

      {/* Credentials */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Credentials</h2>
        <CredentialStatusCard />
      </div>
    </div>
  );
}
```

**frontend/src/App.tsx** (update)
```typescript
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';

function App() {
  return (
    <ThemeProvider>
      <AppLayout statusMessage="Ready">
        <Dashboard />
      </AppLayout>
    </ThemeProvider>
  );
}

export default App;
```

### Integration Points

- All components from Phase 8 and Phase 9
- Hooks from Phase 5
- Layout from existing implementation

### Structure After Phase 10

```
frontend/src/
├── pages/
│   └── Dashboard.tsx         # 🆕 New
├── App.tsx                   # 🔧 Modified
├── components/
│   └── features/
│       ├── proxy/            # ✅ From Phase 8
│       └── credentials/      # ✅ From Phase 9
```

### Validation

- [ ] Dashboard displays all sections
- [ ] Real-time status updates work
- [ ] Proxy controls functional
- [ ] Health check warning appears when API down

---

## Phase 11: Settings Page

**Priority:** P3 (Pages)
**Dependencies:** Phase 8
**Blocks:** Phase 16

### Page Structure

**Settings** is a standalone page (no parent-child relationships).

### Files to Create

```
frontend/src/pages/settings/
├── SettingsPage.tsx              # Parent page router
├── SettingsMainPage.tsx          # Desktop main page (3x3 grid)
└── MobileSettingsMainPage.tsx    # Mobile main page (single column)
```

### Content

**frontend/src/pages/settings/SettingsPage.tsx**
```typescript
import { useIsMobile } from '@/hooks/useIsMobile';
import { SettingsMainPage } from './SettingsMainPage';
import { MobileSettingsMainPage } from './MobileSettingsMainPage';

export function SettingsPage() {
  const isMobile = useIsMobile();

  const CurrentPageComponent = isMobile ? MobileSettingsMainPage : SettingsMainPage;

  return <CurrentPageComponent />;
}
```

**frontend/src/pages/settings/SettingsMainPage.tsx**
```typescript
import { Card } from '@/components/ui/card';
import { ProxyConfigForm } from '@/components/features/proxy/ProxyConfigForm';
import { useTheme } from '@/contexts/ThemeContext';

export function SettingsMainPage() {
  const { theme, setTheme } = useTheme();

  // Desktop 3x3 grid layout
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '100px 1fr 100px',
      gridTemplateRows: '80px 1fr 80px',
      gap: '8px',
      minHeight: '100%'
    }}>
      {/* Top row */}
      <div>{/* Top Left placeholder */}</div>
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure application preferences</p>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left placeholder */}</div>
      <div className="space-y-6">
        {/* Theme Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </Card>

        {/* Proxy Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Proxy Configuration</h2>
          <ProxyConfigForm />
        </Card>
      </div>
      <div>{/* Right placeholder */}</div>

      {/* Bottom row */}
      <div>{/* Bottom Left placeholder */}</div>
      <div>{/* Bottom Center placeholder */}</div>
      <div>{/* Bottom Right placeholder */}</div>
    </div>
  );
}
```

### Files to Modify

None (will be used in Phase 16 routing)

### Integration Points

- `frontend/src/components/features/proxy/ProxyConfigForm.tsx` (Phase 8)
- `frontend/src/contexts/ThemeContext.tsx` (existing)
- `frontend/src/hooks/useIsMobile.ts` (mobile/desktop detection)

### Structure After Phase 11

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx         # ✅ From Phase 10
│   │   ├── DashboardMainPage.tsx
│   │   └── MobileDashboardMainPage.tsx
│   └── settings/                      # 🆕 New
│       ├── SettingsPage.tsx           # Router
│       ├── SettingsMainPage.tsx       # Desktop main
│       └── MobileSettingsMainPage.tsx # Mobile main
```

### Validation

- [ ] Theme selector works
- [ ] Proxy config form integrated
- [ ] Settings persist correctly
- [ ] Mobile/desktop switching works

---

## Phase 12: Providers Page (with Models as Child)

**Priority:** P3 (Pages)
**Dependencies:** Phase 3
**Blocks:** Phase 16

### Page Structure

**Providers** is a parent page that has **Models** as a child page. The ProvidersPage component routes between:
- ProvidersMainPage / MobileProvidersMainPage (main view)
- ModelsPage / MobileModelsPage (child view)

### Files to Create

```
frontend/src/pages/providers/
├── ProvidersPage.tsx              # Parent page router (handles mobile/desktop + child routing)
├── ProvidersMainPage.tsx          # Desktop main page (providers CRUD with 3x3 grid)
├── MobileProvidersMainPage.tsx    # Mobile main page (providers CRUD, single column)
├── ModelsPage.tsx                 # Desktop child page (models CRUD with 3x3 grid)
└── MobileModelsPage.tsx           # Mobile child page (models CRUD, single column)

frontend/src/components/features/providers/
├── ProviderList.tsx        # List of providers
├── ProviderForm.tsx        # Add/Edit provider form
└── ProviderCard.tsx        # Provider card component

frontend/src/components/features/models/
├── ModelList.tsx           # List of models
├── ModelMappingForm.tsx    # Model mapping form
└── ModelSyncButton.tsx     # Sync models button
```

### Content Summary

**ProvidersPage.tsx** - Parent router:
```typescript
// Routes between mobile/desktop and parent/child pages
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppStore } from '@/stores/appStore';
import { ProvidersMainPage } from './ProvidersMainPage';
import { MobileProvidersMainPage } from './MobileProvidersMainPage';
import { ModelsPage } from './ModelsPage';
import { MobileModelsPage } from './MobileModelsPage';

export function ProvidersPage() {
  const currentChildPage = useAppStore((state) => state.currentChildPage);
  const isMobile = useIsMobile();

  // Determine which component to render
  let CurrentPageComponent;

  if (currentChildPage === "models") {
    CurrentPageComponent = isMobile ? MobileModelsPage : ModelsPage;
  } else {
    CurrentPageComponent = isMobile ? MobileProvidersMainPage : ProvidersMainPage;
  }

  return <CurrentPageComponent />;
}
```

**ProvidersMainPage.tsx** - Desktop 3x3 grid with DataTable:
- Grid: `100px | 1fr | 100px` columns, `80px | 1fr | 80px` rows
- Left column: Filters sidebar
- Center column: DataTable with providers
- Right column: Quick actions
- Top row: Header with stats and Add button
- Bottom row: Pagination

**ModelsPage.tsx** - Desktop child page:
- Same 3x3 grid structure as ProvidersMainPage
- Shows models related to providers
- Can navigate back to providers

### Files to Modify

None

### Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/types/provider.types.ts` (Phase 1)
- `frontend/src/types/model.types.ts` (Phase 1)
- `frontend/src/stores/appStore.ts` (currentChildPage state)
- `frontend/src/hooks/useIsMobile.ts` (mobile/desktop detection)

### Structure After Phase 12-13

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx         # ✅ From Phase 10
│   │   ├── DashboardMainPage.tsx
│   │   └── MobileDashboardMainPage.tsx
│   ├── settings/
│   │   ├── SettingsPage.tsx          # ✅ From Phase 11
│   │   ├── SettingsMainPage.tsx
│   │   └── MobileSettingsMainPage.tsx
│   └── providers/                     # 🆕 New (Parent with child)
│       ├── ProvidersPage.tsx          # Parent router
│       ├── ProvidersMainPage.tsx      # Desktop main
│       ├── MobileProvidersMainPage.tsx # Mobile main
│       ├── ModelsPage.tsx             # Desktop child
│       └── MobileModelsPage.tsx       # Mobile child
├── components/
│   └── features/
│       ├── providers/        # 🆕 New
│       │   ├── ProviderList.tsx
│       │   ├── ProviderForm.tsx
│       │   └── ProviderCard.tsx
│       ├── models/           # 🆕 New
│       │   ├── ModelList.tsx
│       │   ├── ModelMappingForm.tsx
│       │   └── ModelSyncButton.tsx
│       ├── proxy/
│       └── credentials/
```

### Validation

- [ ] Can list all providers
- [ ] Can create new provider
- [ ] Can edit existing provider
- [ ] Can delete provider with confirmation
- [ ] Provider stats display correctly
- [ ] Can navigate to Models child page
- [ ] Models page displays correctly
- [ ] Can navigate back to Providers main page
- [ ] Mobile/desktop switching works for both pages
- [ ] Can list all models
- [ ] Can create model mappings
- [ ] Sync button fetches new models
- [ ] Models grouped by provider correctly

---

## Phase 14: Sessions Page (with Requests/Responses as Children)

**Priority:** P3 (Pages)
**Dependencies:** Phase 3
**Blocks:** Phase 16

### Page Structure

**Sessions** is a parent page that can have **Requests** and **Responses** as child pages. The SessionsPage component routes between:
- SessionsMainPage / MobileSessionsMainPage (main view)
- RequestsPage / MobileRequestsPage (child view)
- ResponsesPage / MobileResponsesPage (child view)

### Files to Create

```
frontend/src/pages/sessions/
├── SessionsPage.tsx              # Parent page router
├── SessionsMainPage.tsx          # Desktop main page (3x3 grid)
├── MobileSessionsMainPage.tsx    # Mobile main page (single column)
├── RequestsPage.tsx              # Desktop child page (3x3 grid)
├── MobileRequestsPage.tsx        # Mobile child page (single column)
├── ResponsesPage.tsx             # Desktop child page (3x3 grid)
└── MobileResponsesPage.tsx       # Mobile child page (single column)

frontend/src/components/features/sessions/
├── SessionList.tsx          # List of sessions
├── SessionCard.tsx          # Session details card
└── SessionCleanupButton.tsx # Cleanup inactive sessions

frontend/src/components/features/requests/
├── RequestList.tsx          # List of requests
└── RequestDetailDialog.tsx  # Request details modal

frontend/src/components/features/responses/
├── ResponseList.tsx         # List of responses
└── ResponseDetailDialog.tsx # Response details modal
```

### Content Summary

**SessionsPage.tsx** - Parent router:
```typescript
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppStore } from '@/stores/appStore';
import { SessionsMainPage } from './SessionsMainPage';
import { MobileSessionsMainPage } from './MobileSessionsMainPage';
import { RequestsPage } from './RequestsPage';
import { MobileRequestsPage } from './MobileRequestsPage';
import { ResponsesPage } from './ResponsesPage';
import { MobileResponsesPage } from './MobileResponsesPage';

export function SessionsPage() {
  const currentChildPage = useAppStore((state) => state.currentChildPage);
  const isMobile = useIsMobile();

  let CurrentPageComponent;

  if (currentChildPage === "requests") {
    CurrentPageComponent = isMobile ? MobileRequestsPage : RequestsPage;
  } else if (currentChildPage === "responses") {
    CurrentPageComponent = isMobile ? MobileResponsesPage : ResponsesPage;
  } else {
    CurrentPageComponent = isMobile ? MobileSessionsMainPage : SessionsMainPage;
  }

  return <CurrentPageComponent />;
}
```

- Active sessions list with 3x3 grid
- Session details (request count, last activity)
- Delete session functionality
- Cleanup inactive sessions
- Navigate to Requests or Responses child pages

### Files to Modify

None

### Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/types/session.types.ts` (Phase 1)
- `frontend/src/types/activity.types.ts` (Phase 1)
- `frontend/src/stores/appStore.ts` (currentChildPage state)
- `frontend/src/hooks/useIsMobile.ts` (mobile/desktop detection)

### Structure After Phase 14-15

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   └── ...                        # ✅ From Phase 10
│   ├── settings/
│   │   └── ...                        # ✅ From Phase 11
│   ├── providers/
│   │   └── ...                        # ✅ From Phase 12-13
│   └── sessions/                      # 🆕 New (Parent with children)
│       ├── SessionsPage.tsx           # Parent router
│       ├── SessionsMainPage.tsx       # Desktop main
│       ├── MobileSessionsMainPage.tsx # Mobile main
│       ├── RequestsPage.tsx           # Desktop child
│       ├── MobileRequestsPage.tsx     # Mobile child
│       ├── ResponsesPage.tsx          # Desktop child
│       └── MobileResponsesPage.tsx    # Mobile child
├── components/
│   └── features/
│       ├── sessions/         # 🆕 New
│       │   ├── SessionList.tsx
│       │   ├── SessionCard.tsx
│       │   └── SessionCleanupButton.tsx
│       ├── requests/         # 🆕 New
│       │   ├── RequestList.tsx
│       │   └── RequestDetailDialog.tsx
│       ├── responses/        # 🆕 New
│       │   ├── ResponseList.tsx
│       │   └── ResponseDetailDialog.tsx
│       ├── providers/
│       ├── models/
│       ├── proxy/
│       └── credentials/
```

### Validation

- [ ] Sessions list displays correctly
- [ ] Can delete individual sessions
- [ ] Cleanup removes inactive sessions
- [ ] Session stats accurate
- [ ] Can navigate to Requests child page
- [ ] Can navigate to Responses child page
- [ ] Request logs display correctly
- [ ] Response logs display correctly
- [ ] Detail dialogs show full data
- [ ] Mobile/desktop switching works for all pages

---

## Phase 15: Activity Page

**Priority:** P3 (Pages)
**Dependencies:** Phase 3
**Blocks:** Phase 16

### Page Structure

**Activity** is a standalone page (no parent-child relationships).

### Files to Create

```
frontend/src/pages/activity/
├── ActivityPage.tsx              # Parent page router
├── ActivityMainPage.tsx          # Desktop main page (3x3 grid)
└── MobileActivityMainPage.tsx    # Mobile main page (single column)

frontend/src/components/features/activity/
├── ActivityStatsCard.tsx    # Stats card
└── ActivityLogList.tsx      # Combined request/response history
```

### Content Summary

**ActivityPage.tsx** - Simple router:
```typescript
import { useIsMobile } from '@/hooks/useIsMobile';
import { ActivityMainPage } from './ActivityMainPage';
import { MobileActivityMainPage } from './MobileActivityMainPage';

export function ActivityPage() {
  const isMobile = useIsMobile();

  const CurrentPageComponent = isMobile ? MobileActivityMainPage : ActivityMainPage;

  return <CurrentPageComponent />;
}
```

- Request/response history with 3x3 grid
- Activity statistics
- Filtering and pagination

### Files to Modify

None

### Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/types/activity.types.ts` (Phase 1)
- `frontend/src/hooks/useIsMobile.ts` (mobile/desktop detection)

### Structure After Phase 15

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   └── ...                        # ✅ From Phase 10
│   ├── settings/
│   │   └── ...                        # ✅ From Phase 11
│   ├── providers/
│   │   └── ...                        # ✅ From Phase 12-13
│   ├── sessions/
│   │   └── ...                        # ✅ From Phase 14
│   └── activity/                      # 🆕 New (Standalone)
│       ├── ActivityPage.tsx           # Router
│       ├── ActivityMainPage.tsx       # Desktop main
│       └── MobileActivityMainPage.tsx # Mobile main
├── components/
│   └── features/
│       ├── activity/         # 🆕 New
│       │   ├── ActivityStatsCard.tsx
│       │   └── ActivityLogList.tsx
│       └── ...
```

### Validation

- [ ] Activity logs display correctly
- [ ] Stats calculations accurate
- [ ] Filtering works
- [ ] Pagination works
- [ ] Mobile/desktop switching works

---

## Phase 16: Navigation and Routing

**Priority:** P3 (Pages)
**Dependencies:** Phase 10-15
**Blocks:** None

### Files to Create

```
frontend/src/components/layout/
├── Tabbar.tsx             # Navigation Tabbar
└── NavigationMenu.tsx      # Navigation menu items
```

### Files to Modify

- `frontend/src/App.tsx` - Add routing
- `frontend/src/components/layout/AppLayout.tsx` - Integrate Tabbar

### Package Dependencies

```bash
npm install react-router-dom
npm install -D @types/react-router-dom
```

### Content Summary

- React Router setup
- Tabbar navigation
- Route definitions
- Active route highlighting

### Integration Points

- All pages from Phase 10-15
- AppLayout component

### Structure After Phase 16

```
frontend/src/
├── App.tsx                       # 🔧 Modified (routing)
├── components/
│   └── layout/
│       ├── AppLayout.tsx         # 🔧 Modified (Tabbar)
│       ├── Tabbar.tsx           # 🆕 New
│       ├── NavigationMenu.tsx    # 🆕 New
│       ├── TitleBar.tsx          # ✅ Existing
│       └── StatusBar.tsx         # ✅ Existing
├── pages/
│   ├── Dashboard.tsx             # ✅ From Phase 10
│   ├── Settings.tsx              # ✅ From Phase 11
│   ├── Providers.tsx             # ✅ From Phase 12
│   ├── Models.tsx                # ✅ From Phase 13
│   ├── Sessions.tsx              # ✅ From Phase 14
│   └── Activity.tsx              # ✅ From Phase 15
```

### Validation

- [ ] All routes work correctly
- [ ] Tabbar navigation functional
- [ ] Active route highlighted
- [ ] Browser back/forward works

---

## Phase 17: Electron Qwen Authentication

**Priority:** P4 (Production Readiness)
**Dependencies:** Phase 4
**Blocks:** None

### Files to Create

```
electron/src/
└── qwen-auth.ts    # Qwen authentication logic
```

### Files to Modify

- `electron/src/main.ts` - Add Qwen IPC handlers
- `electron/src/preload.ts` - Expose Qwen auth to renderer
- `frontend/src/types/electron.types.ts` - Add Qwen methods to ElectronAPI
- `frontend/src/services/electron-ipc.service.ts` - Implement Qwen methods

### Content Summary

- IPC handler for opening Qwen login browser
- Cookie extraction from Electron session
- Credential parsing and validation
- Secure credential transmission to renderer

### Integration Points

- Electron BrowserWindow API
- Electron Session API
- Frontend credentials service (Phase 7)

### Structure After Phase 17

```
electron/src/
├── main.ts              # 🔧 Modified (IPC handlers)
├── preload.ts           # 🔧 Modified (expose API)
└── qwen-auth.ts         # 🆕 New

frontend/src/
├── services/
│   └── electron-ipc.service.ts  # 🔧 Modified (implement methods)
└── types/
    └── electron.types.ts        # 🔧 Modified (add methods)
```

### Validation

- [ ] Can open Qwen login browser
- [ ] Cookies extracted correctly
- [ ] Credentials parsed and validated
- [ ] Frontend receives credentials via IPC

---

## Phase 18: Electron API Server Lifecycle

**Priority:** P4 (Production Readiness)
**Dependencies:** None (backend must exist)
**Blocks:** None

### Files to Create

```
electron/src/
└── api-server-manager.ts    # API Server lifecycle management
```

### Files to Modify

- `electron/src/main.ts` - Add API Server spawning

### Content Summary

- Spawn API Server process on Electron startup
- Health check polling
- Process management (restart on crash)
- Graceful shutdown
- Logging integration

### Integration Points

- Backend API Server (must exist at `backend/api-server`)
- Node.js child_process
- Electron app lifecycle events

### Structure After Phase 18

```
electron/src/
├── main.ts                    # 🔧 Modified (spawn API server)
├── preload.ts                 # ✅ Existing
├── qwen-auth.ts               # ✅ From Phase 17
└── api-server-manager.ts      # 🆕 New
```

### Validation

- [ ] API Server starts on Electron startup
- [ ] Health check waits for server ready
- [ ] Window only opens after server ready
- [ ] Server shuts down gracefully on quit
- [ ] Production build works correctly

---

## Complete Directory Structure

After all phases are complete:

```
frontend/
├── src/
│   ├── components/
│   │   ├── features/
│   │   │   ├── activity/
│   │   │   │   ├── RequestLogList.tsx
│   │   │   │   ├── ActivityStatsCard.tsx
│   │   │   │   └── RequestDetailDialog.tsx
│   │   │   ├── credentials/
│   │   │   │   ├── CredentialStatusCard.tsx
│   │   │   │   ├── LoginButton.tsx
│   │   │   │   └── CredentialManager.tsx
│   │   │   ├── models/
│   │   │   │   ├── ModelList.tsx
│   │   │   │   ├── ModelMappingForm.tsx
│   │   │   │   └── ModelSyncButton.tsx
│   │   │   ├── providers/
│   │   │   │   ├── ProviderList.tsx
│   │   │   │   ├── ProviderForm.tsx
│   │   │   │   └── ProviderCard.tsx
│   │   │   ├── proxy/
│   │   │   │   ├── ProxyStatusIndicator.tsx
│   │   │   │   ├── ProxyControlButtons.tsx
│   │   │   │   └── ProxyConfigForm.tsx
│   │   │   └── sessions/
│   │   │       ├── SessionList.tsx
│   │   │       ├── SessionCard.tsx
│   │   │       └── SessionCleanupButton.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── TitleBar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── Tabbar.tsx
│   │   │   └── NavigationMenu.tsx
│   │   └── ui/
│   │       └── ... (shadcn components)
│   ├── config/
│   │   └── api.ts
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   ├── useProxyStatus.ts
│   │   ├── useApiHealth.ts
│   │   └── useProxyControl.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   ├── Providers.tsx
│   │   ├── Models.tsx
│   │   ├── Sessions.tsx
│   │   └── Activity.tsx
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── electron-ipc.service.ts
│   │   └── credentials.service.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── electron.types.ts
│   │   ├── api.types.ts
│   │   ├── proxy.types.ts
│   │   ├── credentials.types.ts
│   │   ├── provider.types.ts
│   │   ├── model.types.ts
│   │   ├── session.types.ts
│   │   └── activity.types.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css

electron/
└── src/
    ├── main.ts
    ├── preload.ts
    ├── qwen-auth.ts
    └── api-server-manager.ts
```

---

## Notes

### Architecture Compliance

This implementation plan follows Doc 27 architecture:

- **HTTP API for Backend Management** - All proxy/service control via API Server (port 3002)
- **IPC for Electron Features** - Window control, clipboard, Qwen authentication via IPC
- **No Mixing** - Clear separation between HTTP and IPC
- **Direct Communication** - Frontend calls API Server directly
- **Single Responsibility** - Each service/component has one purpose

### Domain-Driven Design

- **Types first** (Phase 1) - Domain models define the system
- **Services** (Phase 3-4, 7) - Domain logic encapsulation
- **Hooks** (Phase 5-6) - Reusable domain operations
- **Components** (Phase 8-9) - UI representations of domain concepts
- **Pages** (Phase 10-15) - Aggregate domain features

### DRY and SRP

- **No duplication** - Shared logic in services/hooks
- **Single responsibility** - Each file has one clear purpose
- **Composition** - Pages compose components, components use hooks, hooks use services

### Testing Strategy

Each phase should include:
- Type validation (TypeScript compilation)
- Unit tests for services/hooks
- Integration tests for components
- E2E tests for pages

---

**Last Updated:** 2025-11-04
**Status:** Ready for implementation
