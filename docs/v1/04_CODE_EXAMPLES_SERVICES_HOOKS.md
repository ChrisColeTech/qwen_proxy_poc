# Code Examples - Services & Hooks

This document contains code examples for services, hooks, and supporting utilities that power the application.

---

## Services Layer

Services provide the API communication layer between the frontend and backend.

### frontend/src/services/credentialsService.ts

```typescript
import type { QwenCredentials, SetCredentialsRequest } from '@/types';

const API_BASE = 'http://localhost:3002';

export const credentialsService = {
  async getCredentials(): Promise<QwenCredentials | null> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to get credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  },

  async setCredentials(request: SetCredentialsRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to set credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error setting credentials:', error);
      throw error;
    }
  },

  async revokeCredentials(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to revoke credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error revoking credentials:', error);
      throw error;
    }
  },

  isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  },
};
```

**Purpose:**
- Manages Qwen credential operations (get, set, revoke)
- Communicates with backend API at localhost:3002
- Provides environment detection (Electron vs Browser)
- Used by: useAuth hook, EnvironmentBadge, HomePage

---

### frontend/src/services/proxyService.ts

```typescript
import type { ProxyStatusResponse, ProxyControlResponse } from '@/types';

const API_BASE = 'http://localhost:3002';

export const proxyService = {
  async getStatus(): Promise<ProxyStatusResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/proxy/status`);
      if (!response.ok) {
        throw new Error('Failed to get proxy status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting proxy status:', error);
      throw error;
    }
  },

  async startProxy(): Promise<ProxyControlResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/proxy/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start proxy');
      }
      return await response.json();
    } catch (error) {
      console.error('Error starting proxy:', error);
      throw error;
    }
  },

  async stopProxy(): Promise<ProxyControlResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/proxy/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to stop proxy');
      }
      return await response.json();
    } catch (error) {
      console.error('Error stopping proxy:', error);
      throw error;
    }
  },
};
```

**Purpose:**
- Manages proxy server operations (status, start, stop)
- Communicates with backend API at localhost:3002
- Used by: useProxyControl hook, useCredentialPolling hook, SystemControlCard

---

## Custom Hooks

Hooks encapsulate reusable logic and state management.

### frontend/src/hooks/useCredentialPolling.ts

```typescript
import { useEffect } from 'react';
import { credentialsService } from '@/services/credentialsService';
import { proxyService } from '@/services/proxyService';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { STATUS_POLL_INTERVAL } from '@/lib/constants';

export function useCredentialPolling() {
  const setCredentials = useCredentialsStore((state) => state.setCredentials);
  const setProxyStatus = useProxyStore((state) => state.setStatus);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        const credentials = await credentialsService.getCredentials();
        setCredentials(credentials);
      } catch (error) {
        console.error('Error fetching credentials:', error);
      }

      try {
        const status = await proxyService.getStatus();
        setProxyStatus(status);
      } catch (error) {
        console.error('Error fetching proxy status:', error);
      }
    };

    fetchData();

    // Poll proxy status every 10 seconds
    const interval = setInterval(async () => {
      try {
        const status = await proxyService.getStatus();
        setProxyStatus(status);
      } catch (error) {
        console.error('Error polling proxy status:', error);
      }
    }, STATUS_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [setCredentials, setProxyStatus]);
}
```

**Purpose:**
- Fetches initial credentials and proxy status on mount
- Polls proxy status every 10 seconds (STATUS_POLL_INTERVAL)
- Updates useCredentialsStore and useProxyStore
- Used by: HomePage component for real-time status updates

---

### frontend/src/hooks/useProxyControl.ts

```typescript
import { useState } from 'react';
import { proxyService } from '@/services/proxyService';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { useUIStore } from '@/stores/useUIStore';

export function useProxyControl() {
  const [loading, setLoading] = useState(false);
  const setStatus = useProxyStore((state) => state.setStatus);
  const showAlert = useAlertStore((state) => state.showAlert);
  const setStatusMessage = useUIStore((state) => state.setStatusMessage);

  const handleStart = async () => {
    setLoading(true);
    setStatusMessage('Starting proxy server...');
    try {
      const response = await proxyService.startProxy();
      showAlert(response.message, 'success');

      // Refresh status
      const status = await proxyService.getStatus();
      setStatus(status);

      const port = status.qwenProxy?.port;
      setStatusMessage(port ? `Proxy running on port ${port}` : 'Proxy running');
    } catch (error) {
      console.error('Error starting proxy:', error);
      showAlert('Failed to start proxy server', 'error');
      setStatusMessage('Failed to start proxy');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    setStatusMessage('Stopping proxy server...');
    try {
      const response = await proxyService.stopProxy();
      showAlert(response.message, 'success');

      // Refresh status
      const status = await proxyService.getStatus();
      setStatus(status);
      setStatusMessage('Proxy stopped');
    } catch (error) {
      console.error('Error stopping proxy:', error);
      showAlert('Failed to stop proxy server', 'error');
      setStatusMessage('Failed to stop proxy');
    } finally {
      setLoading(false);
    }
  };

  return { handleStart, handleStop, loading };
}
```

**Purpose:**
- Provides proxy control functionality (start/stop)
- Manages loading state during operations
- Updates status bar, alerts, and proxy store
- Used by: SystemControlCard component

---

### frontend/src/hooks/useAuth.ts

```typescript
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
```

**Purpose:**
- Manages credential authentication flow
- Handles both Electron (IPC) and Browser (Extension) modes
- Provides connect and revoke functionality
- Updates credentials store, alerts, and status bar
- Used by: SystemControlCard, connection components

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

## Constants

### frontend/src/lib/constants.ts

```typescript
export const STATUS_POLL_INTERVAL = 10000; // 10 seconds

export const API_CONFIG = {
  BASE_URL: 'http://localhost:3002',
  TIMEOUT: 30000,
} as const;

export const CREDENTIALS_CONFIG = {
  POLL_INTERVAL: 5000, // Check for new credentials every 5 seconds (browser mode)
} as const;
```

**Purpose:**
- Defines application-wide constants
- Configures polling intervals for status updates
- Centralizes API configuration
- Prevents magic numbers throughout codebase

---

## Type Definitions

### frontend/src/vite-env.d.ts (CRITICAL - TypeScript Declarations)

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
