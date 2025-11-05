# Qwen Proxy - Complete Application Rebuild Implementation Plan

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | P0 | Pending | Project Structure & Dependencies Setup |
| Phase 2 | P0 | Pending | Frontend - Type Definitions |
| Phase 3 | P0 | Pending | Frontend - Services Layer |
| Phase 4 | P0 | Pending | Frontend - Utility Functions |
| Phase 5 | P0 | Pending | Frontend - Custom Hooks (Credentials & Proxy) |
| Phase 6 | P0 | Pending | Frontend - Custom Hooks (Settings & Server) |
| Phase 7 | P0 | Pending | Frontend - Theme & Layout Foundation |
| Phase 8 | P1 | Pending | Frontend - shadcn/ui Base Components |
| Phase 9 | P1 | Pending | Frontend - Dashboard Components |
| Phase 10 | P1 | Pending | Frontend - Settings Components |
| Phase 11 | P1 | Pending | Frontend - Pages & Navigation |
| Phase 12 | P0 | Pending | Electron - TypeScript Configuration & Build Setup |
| Phase 13 | P0 | Pending | Electron - Utilities & Logger |
| Phase 14 | P0 | Pending | Electron - Backend Manager Service |
| Phase 15 | P0 | Pending | Electron - Preload Script & IPC Bridge |
| Phase 16 | P0 | Pending | Electron - Main Process Core |
| Phase 17 | P1 | Pending | Electron - Window Management & Tray |
| Phase 18 | P1 | Pending | Electron - Credential Management |
| Phase 19 | P1 | Pending | Electron - Assets & Icons |
| Phase 20 | P1 | Pending | Integration - Electron ↔ Frontend |
| Phase 21 | P1 | Pending | Integration - Frontend ↔ Backend API |
| Phase 22 | P2 | Pending | Root Workspace Configuration |
| Phase 23 | P2 | Pending | Build & Distribution Setup |
| Phase 24 | P2 | Pending | Testing & Validation |

---

## Overview

This document outlines the complete rebuild of the Qwen Proxy desktop application, consisting of:
1. **Frontend Application** - React + TypeScript + Vite UI
2. **Electron Application** - Desktop wrapper with process management
3. **Integration Layer** - Connecting frontend, Electron, and existing backend

### Current State
- ✅ **Backend (provider-router)** - Express server with REST API, settings management, Qwen provider (Port 8000)
- ✅ **Documentation** - Comprehensive docs for Electron and Frontend architecture
- ❌ **Frontend** - Needs to be built from scratch
- ❌ **Electron** - Needs to be built from scratch

### Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     Electron Desktop App                        │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────┐    │
│  │  Main Process    │────────▶│  Backend Manager         │    │
│  │  (Node.js/TS)    │         │  (Lifecycle Control)     │    │
│  │  - IPC Handlers  │         │  - Start/Stop/Restart    │    │
│  │  - Window Mgmt   │         │  - WSL Integration       │    │
│  │  - Credentials   │         └────────────┬─────────────┘    │
│  │  - Tray          │                      │                  │
│  └────────┬─────────┘                      │                  │
│           │                                 ▼                  │
│           │                          Child Process             │
│  ┌────────▼─────────┐              (Backend Server)           │
│  │  Preload Script  │              Express on :8000           │
│  │  (IPC Bridge)    │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
│  ┌────────▼──────────────────────────────────────────────┐   │
│  │          Renderer Process (React/Vite)                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│   │
│  │  │  Dashboard   │  │  Settings    │  │  Navigation  ││   │
│  │  │  - Auth      │  │  - Server    │  │             ││   │
│  │  │  - Proxy     │  │  - Logging   │  │             ││   │
│  │  │  - Guide     │  │  - System    │  │             ││   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘│   │
│  │                                                        │   │
│  │  Services: electron-ipc.service.ts (IPC)              │   │
│  │           settings-api.service.ts (HTTP)              │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ Direct HTTP
                              ▼
                    ┌───────────────────┐
                    │  Backend API      │
                    │  localhost:8000   │
                    │  /v1/settings     │
                    │  /v1/chat/...     │
                    └───────────────────┘
```

---

## Phase 1: Project Structure & Dependencies Setup (P0)

### Goal
Create the foundational project structure and initialize both frontend and Electron applications with proper dependency management.

### Files to Create

#### Frontend Application
```
frontend/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .gitignore
├── .env.example
└── src/
    └── (empty for now)
```

#### Electron Application
```
electron/
├── package.json
├── tsconfig.json
├── .gitignore
└── src/
    └── (empty for now)
```

#### Root Configuration
- `.gitignore` (update)
- `README.md` (update)

### Files to Modify
None

### Integration Points
- Backend at `/mnt/d/Projects/qwen_proxy_opencode/backend/provider-router/` (existing)
- Root `.env` file (existing)

### Package Configurations

**frontend/package.json:**
```json
{
  "name": "qwen-proxy-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-label": "^2.0.2",
    "lucide-react": "^0.300.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

**electron/package.json:**
```json
{
  "name": "qwen-proxy-electron",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "NODE_ENV=development electron .",
    "start": "electron .",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "dependencies": {
    "electron": "^28.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "electron-builder": "^24.9.1"
  }
}
```

### Validation
- ✅ Both frontend and electron directories exist
- ✅ package.json files are valid
- ✅ TypeScript configurations are correct
- ✅ Git ignores node_modules and build artifacts

---

## Phase 2: Frontend - Type Definitions (P0)

### Goal
Create TypeScript type definitions for all data structures used across the frontend application.

### Files to Create

#### `frontend/src/types/credentials.ts`
```typescript
export interface TokenExpiry {
  expired: boolean;
  expiresAt: Date;
  timeLeftHours: number;
  timeLeftDays: number;
}

export interface Credentials {
  cookieString: string;
  umidToken: string;
  hasToken: boolean;
  tokenExpiry: TokenExpiry | null;
}

export interface ProxyStatus {
  running: boolean;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}
```

#### `frontend/src/types/settings.ts`
```typescript
export type SettingCategory = 'server' | 'logging' | 'system';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Settings {
  // Server settings
  'server.port': number;
  'server.host': string;
  'server.timeout': number;

  // Logging settings
  'logging.level': LogLevel;
  'logging.logRequests': boolean;
  'logging.logResponses': boolean;

  // System settings
  'system.autoStart': boolean;
  'system.minimizeToTray': boolean;
  'system.checkUpdates': boolean;
}

export type SettingKey = keyof Settings;
export type SettingValue = Settings[SettingKey];

export interface SettingInfo {
  key: SettingKey;
  value: SettingValue;
  category: SettingCategory;
  requiresRestart: boolean;
  isDefault?: boolean;
}

export interface SettingsResponse {
  settings: Partial<Settings>;
  category?: string;
}

export interface UpdateSettingResponse {
  key: SettingKey;
  value: SettingValue;
  requiresRestart: boolean;
  updated_at: number;
  message: string;
}

export interface BulkUpdateResponse {
  updated: SettingKey[];
  errors: Array<{ key: string; error: string }>;
  requiresRestart: boolean;
  message: string;
}

export interface SettingItemConfig {
  key: SettingKey;
  label: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'switch';
  options?: Array<{ label: string; value: string | number | boolean }>;
  placeholder?: string;
  min?: number;
  max?: number;
  requiresRestart?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}
```

#### `frontend/src/types/electron-api.ts`
```typescript
import { Credentials, ProxyStatus, ApiResponse } from './credentials';

export interface ElectronAPI {
  // Credentials
  getCredentials: () => Promise<Credentials>;
  refreshCredentials: () => Promise<Credentials>;
  openLogin: () => Promise<void>;

  // Proxy Control
  getProxyStatus: () => Promise<ProxyStatus>;
  startProxy: () => Promise<ApiResponse>;
  stopProxy: () => Promise<ApiResponse>;

  // Clipboard
  copyToClipboard: (text: string) => Promise<void>;

  // Event Listeners
  onCredentialsUpdated: (callback: (credentials: Credentials) => void) => () => void;
  onProxyStatusChanged: (callback: (status: ProxyStatus) => void) => () => void;
}

// Extend Window interface
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
```

#### `frontend/src/types/index.ts`
```typescript
export * from './credentials';
export * from './settings';
export * from './electron-api';
```

### Files to Modify
None

### Integration Points
- Will be imported by all services, hooks, and components

### Validation
- ✅ TypeScript compilation passes
- ✅ No circular dependencies
- ✅ All types exported correctly
- ✅ Window interface properly extended

---

## Phase 3: Frontend - Services Layer (P0)

### Goal
Create service classes that encapsulate external communication (Electron IPC and Backend HTTP API).

### Files to Create

#### `frontend/src/services/electron-ipc.service.ts`
```typescript
import { Credentials, ProxyStatus, ApiResponse } from '@/types/credentials';
import { ElectronAPI } from '@/types/electron-api';

class ElectronIPCService {
  private api: ElectronAPI | null = null;

  constructor() {
    this.api = window.electronAPI || null;
  }

  isElectron(): boolean {
    return this.api !== null;
  }

  // Credentials
  async getCredentials(): Promise<Credentials> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.getCredentials();
  }

  async refreshCredentials(): Promise<Credentials> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.refreshCredentials();
  }

  async openLogin(): Promise<void> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.openLogin();
  }

  // Proxy Control
  async getProxyStatus(): Promise<ProxyStatus> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.getProxyStatus();
  }

  async startProxy(): Promise<ApiResponse> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.startProxy();
  }

  async stopProxy(): Promise<ApiResponse> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.stopProxy();
  }

  // Clipboard
  async copyToClipboard(text: string): Promise<void> {
    if (!this.api) throw new Error('Electron API not available');
    return this.api.copyToClipboard(text);
  }

  // Event Listeners
  onCredentialsUpdated(callback: (credentials: Credentials) => void): () => void {
    if (!this.api) return () => {};
    return this.api.onCredentialsUpdated(callback);
  }

  onProxyStatusChanged(callback: (status: ProxyStatus) => void): () => void {
    if (!this.api) return () => {};
    return this.api.onProxyStatusChanged(callback);
  }
}

export const electronIPC = new ElectronIPCService();
```

#### `frontend/src/services/settings-api.service.ts`
```typescript
import {
  Settings,
  SettingKey,
  SettingValue,
  SettingInfo,
  SettingsResponse,
  UpdateSettingResponse,
  BulkUpdateResponse,
  SettingCategory
} from '@/types/settings';

const API_BASE_URL = import.meta.env.MODE === 'development'
  ? '/api/v1'  // Proxied by Vite in development
  : 'http://localhost:8000/v1';  // Direct connection in production

class SettingsApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Get all settings with optional category filter
  async getAllSettings(category?: SettingCategory): Promise<Partial<Settings>> {
    const url = category
      ? `${this.baseUrl}/settings?category=${category}`
      : `${this.baseUrl}/settings`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`);
    }

    const data: SettingsResponse = await response.json();
    return data.settings;
  }

  // Get specific setting
  async getSetting(key: SettingKey): Promise<SettingInfo> {
    const response = await fetch(`${this.baseUrl}/settings/${key}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch setting ${key}: ${response.statusText}`);
    }

    return response.json();
  }

  // Update specific setting
  async updateSetting(key: SettingKey, value: SettingValue): Promise<UpdateSettingResponse> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });

    if (!response.ok) {
      throw new Error(`Failed to update setting ${key}: ${response.statusText}`);
    }

    return response.json();
  }

  // Bulk update settings
  async bulkUpdateSettings(settings: Partial<Settings>): Promise<BulkUpdateResponse> {
    const response = await fetch(`${this.baseUrl}/settings/bulk`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update settings: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete setting (reset to default)
  async deleteSetting(key: SettingKey): Promise<UpdateSettingResponse> {
    const response = await fetch(`${this.baseUrl}/settings/${key}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete setting ${key}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const settingsApi = new SettingsApiService();
```

#### `frontend/src/services/index.ts`
```typescript
export { electronIPC } from './electron-ipc.service';
export { settingsApi } from './settings-api.service';
```

### Files to Modify
None

### Integration Points
- Types from Phase 2
- Will be used by hooks in Phase 5 & 6
- Backend API at `localhost:8000/v1` (existing)
- Electron preload script (to be created in Phase 15)

### Validation
- ✅ Services instantiate without errors
- ✅ isElectron() returns correct value
- ✅ All methods handle missing API gracefully
- ✅ HTTP endpoints are correctly formatted

---

## Phase 4: Frontend - Utility Functions (P0)

### Goal
Create reusable utility functions for formatting, validation, and common operations.

### Files to Create

#### `frontend/src/utils/formatters.ts`
```typescript
import { TokenExpiry } from '@/types/credentials';

export function formatTokenExpiry(expiry: TokenExpiry | null): string {
  if (!expiry) return '-';

  if (expiry.expired) {
    return 'Expired';
  }

  const date = new Date(expiry.expiresAt);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function formatTimeLeft(expiry: TokenExpiry | null): string {
  if (!expiry) return '-';

  if (expiry.expired) {
    return 'Session expired';
  }

  const days = expiry.timeLeftDays;
  const hours = expiry.timeLeftHours % 24;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

export function getTimeLeftColor(expiry: TokenExpiry | null): 'success' | 'warning' | 'danger' {
  if (!expiry || expiry.expired) return 'danger';
  if (expiry.timeLeftHours < 24) return 'warning';
  return 'success';
}

export function getTokenStatusText(hasToken: boolean, expired: boolean): string {
  if (!hasToken) return 'Not logged in';
  if (expired) return 'Expired';
  return 'Authenticated ✓';
}
```

#### `frontend/src/utils/clipboard.ts`
```typescript
import { electronIPC } from '@/services/electron-ipc.service';

export async function copyToClipboard(text: string): Promise<void> {
  if (electronIPC.isElectron()) {
    await electronIPC.copyToClipboard(text);
  } else {
    // Fallback for browser
    await navigator.clipboard.writeText(text);
  }
}
```

#### `frontend/src/utils/settings-validator.ts`
```typescript
import { SettingKey, SettingValue, LogLevel, ValidationError } from '@/types/settings';

export function validatePort(port: number): ValidationError | null {
  if (port < 1 || port > 65535) {
    return { field: 'server.port', message: 'Port must be between 1 and 65535' };
  }
  return null;
}

export function validateHost(host: string): ValidationError | null {
  if (!host || host.trim() === '') {
    return { field: 'server.host', message: 'Host is required' };
  }
  // Basic validation - can be localhost, 0.0.0.0, or IP address
  const validHostPattern = /^(localhost|(\d{1,3}\.){3}\d{1,3})$/;
  if (!validHostPattern.test(host)) {
    return { field: 'server.host', message: 'Invalid host format' };
  }
  return null;
}

export function validateLogLevel(level: string): ValidationError | null {
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(level as LogLevel)) {
    return { field: 'logging.level', message: 'Invalid log level' };
  }
  return null;
}

export function validateTimeout(timeout: number): ValidationError | null {
  if (timeout < 1000 || timeout > 600000) {
    return { field: 'server.timeout', message: 'Timeout must be between 1000ms and 600000ms' };
  }
  return null;
}

export function validateBoolean(value: any): ValidationError | null {
  if (typeof value !== 'boolean') {
    return { field: 'unknown', message: 'Value must be a boolean' };
  }
  return null;
}

export function validateSetting(key: SettingKey, value: SettingValue): ValidationError | null {
  switch (key) {
    case 'server.port':
      return validatePort(value as number);
    case 'server.host':
      return validateHost(value as string);
    case 'server.timeout':
      return validateTimeout(value as number);
    case 'logging.level':
      return validateLogLevel(value as string);
    case 'logging.logRequests':
    case 'logging.logResponses':
    case 'system.autoStart':
    case 'system.minimizeToTray':
    case 'system.checkUpdates':
      return validateBoolean(value);
    default:
      return null;
  }
}

export function validateSettings(settings: Record<string, any>): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [key, value] of Object.entries(settings)) {
    const error = validateSetting(key as SettingKey, value);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

// Helper functions
export function requiresRestart(key: SettingKey): boolean {
  const restartRequired = [
    'server.port',
    'server.host',
    'logging.level'
  ];
  return restartRequired.includes(key);
}

export function getSettingDisplayName(key: SettingKey): string {
  const names: Record<SettingKey, string> = {
    'server.port': 'Server Port',
    'server.host': 'Server Host',
    'server.timeout': 'Request Timeout',
    'logging.level': 'Log Level',
    'logging.logRequests': 'Log Requests',
    'logging.logResponses': 'Log Responses',
    'system.autoStart': 'Auto Start',
    'system.minimizeToTray': 'Minimize to Tray',
    'system.checkUpdates': 'Check for Updates'
  };
  return names[key] || key;
}

export function getSettingDescription(key: SettingKey): string {
  const descriptions: Record<SettingKey, string> = {
    'server.port': 'Port number for the backend server (1-65535)',
    'server.host': 'Host address for the backend server',
    'server.timeout': 'Request timeout in milliseconds (1000-600000)',
    'logging.level': 'Minimum log level to display',
    'logging.logRequests': 'Log all incoming HTTP requests',
    'logging.logResponses': 'Log all outgoing HTTP responses',
    'system.autoStart': 'Automatically start backend when app launches',
    'system.minimizeToTray': 'Minimize to system tray instead of taskbar',
    'system.checkUpdates': 'Automatically check for application updates'
  };
  return descriptions[key] || '';
}
```

#### `frontend/src/utils/cn.ts`
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### `frontend/src/utils/index.ts`
```typescript
export * from './formatters';
export * from './clipboard';
export * from './settings-validator';
export { cn } from './cn';
```

### Files to Modify
None

### Integration Points
- Types from Phase 2
- Services from Phase 3
- Will be used by components in Phase 9 & 10

### Validation
- ✅ All formatters return expected values
- ✅ Edge cases handled (null, expired, invalid values)
- ✅ Clipboard works in both Electron and browser
- ✅ Validation catches invalid inputs

---

## Phase 5: Frontend - Custom Hooks (Credentials & Proxy) (P0)

### Goal
Create React hooks for managing credentials and proxy control state.

### Files to Create

#### `frontend/src/hooks/useCredentials.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { Credentials } from '@/types/credentials';
import { electronIPC } from '@/services/electron-ipc.service';

export function useCredentials() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial credentials
  useEffect(() => {
    loadCredentials();
  }, []);

  // Subscribe to credential updates
  useEffect(() => {
    const unsubscribe = electronIPC.onCredentialsUpdated((newCredentials) => {
      setCredentials(newCredentials);
    });

    return unsubscribe;
  }, []);

  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const creds = await electronIPC.getCredentials();
      setCredentials(creds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCredentials = useCallback(async () => {
    try {
      setError(null);
      const creds = await electronIPC.refreshCredentials();
      setCredentials(creds);
      return creds;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh credentials';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const openLogin = useCallback(async () => {
    try {
      setError(null);
      await electronIPC.openLogin();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to open login';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  return {
    credentials,
    loading,
    error,
    refreshCredentials,
    openLogin,
  };
}
```

#### `frontend/src/hooks/useProxyControl.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { ProxyStatus } from '@/types/credentials';
import { electronIPC } from '@/services/electron-ipc.service';

export function useProxyControl() {
  const [status, setStatus] = useState<ProxyStatus>({ running: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operating, setOperating] = useState(false);

  // Load initial status
  useEffect(() => {
    loadStatus();
  }, []);

  // Subscribe to status updates
  useEffect(() => {
    const unsubscribe = electronIPC.onProxyStatusChanged((newStatus) => {
      setStatus(newStatus);
      setOperating(false);
    });

    return unsubscribe;
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const proxyStatus = await electronIPC.getProxyStatus();
      setStatus(proxyStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  }, []);

  const startProxy = useCallback(async () => {
    try {
      setOperating(true);
      setError(null);
      const result = await electronIPC.startProxy();
      if (!result.success) {
        throw new Error(result.message || 'Failed to start proxy');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start proxy';
      setError(errorMsg);
      setOperating(false);
      throw new Error(errorMsg);
    }
  }, []);

  const stopProxy = useCallback(async () => {
    try {
      setOperating(true);
      setError(null);
      const result = await electronIPC.stopProxy();
      if (!result.success) {
        throw new Error(result.message || 'Failed to stop proxy');
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop proxy';
      setError(errorMsg);
      setOperating(false);
      throw new Error(errorMsg);
    }
  }, []);

  const toggleProxy = useCallback(async () => {
    return status.running ? stopProxy() : startProxy();
  }, [status.running, startProxy, stopProxy]);

  return {
    status,
    loading,
    error,
    operating,
    startProxy,
    stopProxy,
    toggleProxy,
  };
}
```

#### `frontend/src/hooks/index.ts`
```typescript
export { useCredentials } from './useCredentials';
export { useProxyControl } from './useProxyControl';
```

### Files to Modify
None

### Integration Points
- Types from Phase 2
- Services from Phase 3
- Will be used by Dashboard components in Phase 9

### Validation
- ✅ Hooks initialize without errors
- ✅ State loads on mount
- ✅ Event listeners clean up properly
- ✅ Error handling works correctly

---

## Phase 6: Frontend - Custom Hooks (Settings & Server) (P0)

### Goal
Create React hooks for managing settings and server restart control.

### Files to Create

#### `frontend/src/hooks/useSettings.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  SettingKey,
  SettingValue,
  SettingCategory
} from '@/types/settings';
import { settingsApi } from '@/services/settings-api.service';

interface UseSettingsOptions {
  category?: SettingCategory;
  autoFetch?: boolean;
}

interface UseSettingsReturn {
  settings: Partial<Settings> | null;
  loading: boolean;
  error: string | null;
  requiresRestart: boolean;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: SettingKey, value: SettingValue) => Promise<void>;
  bulkUpdate: (settings: Partial<Settings>) => Promise<void>;
  resetSetting: (key: SettingKey) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSettings(options: UseSettingsOptions = {}): UseSettingsReturn {
  const { category, autoFetch = true } = options;

  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresRestart, setRequiresRestart] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getAllSettings(category);
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, [category]);

  const updateSetting = useCallback(async (key: SettingKey, value: SettingValue) => {
    try {
      setError(null);
      const response = await settingsApi.updateSetting(key, value);

      // Update local state
      setSettings((prev) => prev ? { ...prev, [key]: value } : { [key]: value });

      // Track restart requirement
      if (response.requiresRestart) {
        setRequiresRestart(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update setting';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const bulkUpdate = useCallback(async (newSettings: Partial<Settings>) => {
    try {
      setError(null);
      const response = await settingsApi.bulkUpdateSettings(newSettings);

      // Update local state
      setSettings((prev) => ({ ...prev, ...newSettings }));

      // Track restart requirement
      if (response.requiresRestart) {
        setRequiresRestart(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to bulk update settings';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const resetSetting = useCallback(async (key: SettingKey) => {
    try {
      setError(null);
      const response = await settingsApi.deleteSetting(key);

      // Update local state with default value
      setSettings((prev) => {
        if (!prev) return null;
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      // Track restart requirement
      if (response.requiresRestart) {
        setRequiresRestart(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset setting';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchSettings();
    }
  }, [autoFetch, fetchSettings]);

  return {
    settings,
    loading,
    error,
    requiresRestart,
    fetchSettings,
    updateSetting,
    bulkUpdate,
    resetSetting,
    refetch: fetchSettings,
  };
}
```

#### `frontend/src/hooks/useServerControl.ts`
```typescript
import { useState, useCallback } from 'react';
import { electronIPC } from '@/services/electron-ipc.service';

type RestartProgress =
  | 'idle'
  | 'validating'
  | 'stopping'
  | 'updating'
  | 'starting'
  | 'complete'
  | 'error';

interface UseServerControlReturn {
  restarting: boolean;
  progress: RestartProgress;
  error: string | null;
  restartServer: () => Promise<void>;
  canRestart: boolean;
}

export function useServerControl(): UseServerControlReturn {
  const [restarting, setRestarting] = useState(false);
  const [progress, setProgress] = useState<RestartProgress>('idle');
  const [error, setError] = useState<string | null>(null);

  const canRestart = electronIPC.isElectron();

  const restartServer = useCallback(async () => {
    if (!canRestart) {
      setError('Server restart only available in Electron environment');
      return;
    }

    try {
      setRestarting(true);
      setError(null);

      // Step 1: Validate
      setProgress('validating');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Stop backend
      setProgress('stopping');
      await electronIPC.stopProxy();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Update settings (backend reads from .env or database)
      setProgress('updating');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Start backend
      setProgress('starting');
      await electronIPC.startProxy();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Complete
      setProgress('complete');
      setTimeout(() => {
        setProgress('idle');
        setRestarting(false);
      }, 1500);

    } catch (err) {
      setProgress('error');
      const errorMsg = err instanceof Error ? err.message : 'Failed to restart server';
      setError(errorMsg);
      setRestarting(false);
      throw new Error(errorMsg);
    }
  }, [canRestart]);

  return {
    restarting,
    progress,
    error,
    restartServer,
    canRestart,
  };
}
```

#### `frontend/src/hooks/index.ts` (update)
```typescript
export { useCredentials } from './useCredentials';
export { useProxyControl } from './useProxyControl';
export { useSettings } from './useSettings';
export { useServerControl } from './useServerControl';
```

### Files to Modify
- `frontend/src/hooks/index.ts` - Add new exports

### Integration Points
- Types from Phase 2
- Services from Phase 3
- Will be used by Settings components in Phase 10

### Validation
- ✅ Settings hook loads data correctly
- ✅ Update operations work
- ✅ Restart requirement tracking works
- ✅ Error handling is robust

---

## Phase 7: Frontend - Theme & Layout Foundation (P0)

### Goal
Create theme context and base layout components for the application.

### Files to Create

#### `frontend/src/contexts/ThemeContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

#### `frontend/src/components/layout/TitleBar.tsx`
```typescript
import { Minus, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TitleBar() {
  const handleMinimize = () => {
    // Will be connected to Electron IPC
    console.log('Minimize clicked');
  };

  const handleMaximize = () => {
    // Will be connected to Electron IPC
    console.log('Maximize clicked');
  };

  const handleClose = () => {
    // Will be connected to Electron IPC
    console.log('Close clicked');
  };

  return (
    <div className="h-8 bg-background border-b flex items-center justify-between px-4 drag-region">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-primary" />
        <span className="text-sm font-semibold">Qwen Proxy</span>
      </div>
      <div className="flex items-center gap-1 no-drag">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleMinimize}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleMaximize}
        >
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
```

#### `frontend/src/components/layout/StatusBar.tsx`
```typescript
interface StatusBarProps {
  message?: string;
}

export function StatusBar({ message = 'Ready' }: StatusBarProps) {
  return (
    <div className="h-6 bg-muted/30 border-t px-4 flex items-center justify-between text-xs text-muted-foreground">
      <span>{message}</span>
      <span>Qwen Proxy v1.0.0</span>
    </div>
  );
}
```

#### `frontend/src/components/layout/AppLayout.tsx`
```typescript
import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';

interface AppLayoutProps {
  children: React.ReactNode;
  statusMessage?: string;
}

export function AppLayout({ children, statusMessage }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <TitleBar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <StatusBar message={statusMessage} />
    </div>
  );
}
```

#### `frontend/src/components/layout/index.ts`
```typescript
export { AppLayout } from './AppLayout';
export { TitleBar } from './TitleBar';
export { StatusBar } from './StatusBar';
```

### Files to Modify
None

### Integration Points
- Will wrap entire app in `App.tsx` (Phase 11)
- Uses Button component (to be created in Phase 8)
- Uses theme classes from Tailwind (configured in Phase 1)

### Validation
- ✅ Theme switches correctly
- ✅ Layout renders properly
- ✅ Title bar and status bar display
- ✅ Drag region works (once Electron is connected)

---

## Phase 8: Frontend - shadcn/ui Base Components (P1)

### Goal
Install and configure shadcn/ui components needed across the application.

### Files to Create

#### `frontend/src/components/ui/button.tsx`
```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### `frontend/src/components/ui/card.tsx`
```typescript
import * as React from 'react';
import { cn } from '@/utils/cn';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

#### Additional UI Components (create these files):
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/label.tsx`
- `frontend/src/components/ui/tabs.tsx`
- `frontend/src/components/ui/switch.tsx`
- `frontend/src/components/ui/select.tsx`

### Files to Modify
None

### Integration Points
- Uses `cn` utility from Phase 4
- Radix UI primitives (installed in Phase 1)
- Will be used by all components in Phase 9 & 10

### Validation
- ✅ All components render correctly
- ✅ Variants work as expected
- ✅ Theme classes apply properly
- ✅ Accessibility features work

---

## Phase 9: Frontend - Dashboard Components (P1)

### Goal
Create all components needed for the Dashboard page.

### Files to Create

#### `frontend/src/components/dashboard/AuthenticationStatus.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/dashboard/ProxyServerControl.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/dashboard/QuickStartGuide.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/dashboard/CodeExample.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/dashboard/index.ts`
```typescript
export { AuthenticationStatus } from './AuthenticationStatus';
export { ProxyServerControl } from './ProxyServerControl';
export { QuickStartGuide } from './QuickStartGuide';
export { CodeExample } from './CodeExample';
```

### Files to Modify
None

### Integration Points
- Hooks from Phase 5 (useCredentials, useProxyControl)
- Utils from Phase 4 (formatters, clipboard)
- UI components from Phase 8
- Types from Phase 2

### Validation
- ✅ All components render
- ✅ Credentials display correctly
- ✅ Proxy controls work
- ✅ Copy functionality works

---

## Phase 10: Frontend - Settings Components (P1)

### Goal
Create all components needed for the Settings page.

### Files to Create

#### `frontend/src/components/settings/SettingItem.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/settings/ServerSettings.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/settings/LoggingSettings.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/settings/SystemSettings.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/settings/AboutSettings.tsx`
(Full implementation from migration doc)

#### `frontend/src/components/settings/index.ts`
```typescript
export { SettingItem } from './SettingItem';
export { ServerSettings } from './ServerSettings';
export { LoggingSettings } from './LoggingSettings';
export { SystemSettings } from './SystemSettings';
export { AboutSettings } from './AboutSettings';
```

### Files to Modify
None

### Integration Points
- Hooks from Phase 6 (useSettings, useServerControl)
- Utils from Phase 4 (validators)
- UI components from Phase 8
- Types from Phase 2

### Validation
- ✅ Settings load from API
- ✅ Updates persist
- ✅ Validation works
- ✅ Restart warnings appear

---

## Phase 11: Frontend - Pages & Navigation (P1)

### Goal
Create page components and implement navigation.

### Files to Create

#### `frontend/src/pages/Dashboard.tsx`
(Full implementation from migration doc)

#### `frontend/src/pages/Settings.tsx`
(Full implementation from migration doc)

#### `frontend/src/pages/index.ts`
```typescript
export { Dashboard } from './Dashboard';
export { Settings } from './Settings';
```

#### `frontend/src/App.tsx`
```typescript
import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout';
import { Dashboard, Settings } from '@/pages';
import { Button } from '@/components/ui/button';
import { Home, Settings as SettingsIcon } from 'lucide-react';

type Page = 'dashboard' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  return (
    <ThemeProvider>
      <AppLayout statusMessage="Ready">
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex gap-2 px-6 pt-4">
            <Button
              variant={currentPage === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage('dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentPage === 'settings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentPage('settings')}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Page Content */}
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'settings' && <Settings />}
        </div>
      </AppLayout>
    </ThemeProvider>
  );
}

export default App;
```

#### `frontend/src/main.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

#### `frontend/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
```

### Files to Modify
None

### Integration Points
- All components from Phase 9 & 10
- Layout from Phase 7
- Theme context from Phase 7

### Validation
- ✅ Navigation works
- ✅ Pages render correctly
- ✅ Theme applies
- ✅ All features functional

---

## Phase 12: Electron - TypeScript Configuration & Build Setup (P0)

### Goal
Configure TypeScript compilation for Electron main process.

### Files to Create

#### `electron/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### `electron/.gitignore`
```
node_modules/
dist/
*.log
.DS_Store
```

### Files to Modify
- `electron/package.json` (already created in Phase 1, no changes needed)

### Integration Points
None

### Validation
- ✅ TypeScript compiles without errors
- ✅ Output directory is correct
- ✅ Source maps generate

---

## Phase 13: Electron - Utilities & Logger (P0)

### Goal
Create utility functions and logging service for Electron.

### Files to Create

#### `electron/src/utils/logger.ts`
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logLevel: LogLevel = 'info';

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }
}

export const logger = new Logger();
```

#### `electron/src/utils/path-converter.ts`
```typescript
import path from 'path';

/**
 * Convert Windows path to WSL path
 * Example: D:\Projects\app -> /mnt/d/Projects/app
 */
export function windowsToWslPath(windowsPath: string): string {
  // Normalize to forward slashes
  const normalized = windowsPath.replace(/\\/g, '/');

  // Convert drive letter (D:/ -> /mnt/d/)
  const wslPath = normalized.replace(/^([A-Z]):/i, (_match, drive) => {
    return `/mnt/${drive.toLowerCase()}`;
  });

  return wslPath;
}

/**
 * Get the directory path from a file path
 */
export function getDirectory(filePath: string): string {
  return path.dirname(filePath);
}
```

#### `electron/src/utils/index.ts`
```typescript
export { logger } from './logger';
export { windowsToWslPath, getDirectory } from './path-converter';
```

### Files to Modify
None

### Integration Points
- Will be used by all Electron services and main process
- Node.js path module

### Validation
- ✅ Logger outputs correctly
- ✅ Path conversion works
- ✅ TypeScript types are correct

---

## Phase 14: Electron - Backend Manager Service (P0)

### Goal
Create service to manage backend process lifecycle.

### Files to Create

#### `electron/src/services/backend-manager.ts`
```typescript
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { logger, windowsToWslPath, getDirectory } from '../utils';

interface ServerSettings {
  port: number;
  host: string;
  timeout?: number;
}

interface Credentials {
  umidToken: string;
  cookieString: string;
}

class BackendManager {
  private static instance: BackendManager | null = null;
  private backendProcess: ChildProcess | null = null;
  private currentSettings: ServerSettings = { port: 8000, host: '0.0.0.0' };
  private credentials: Credentials | null = null;

  private constructor() {}

  static getInstance(): BackendManager {
    if (!BackendManager.instance) {
      BackendManager.instance = new BackendManager();
    }
    return BackendManager.instance;
  }

  setCredentials(credentials: Credentials): void {
    this.credentials = credentials;
  }

  async start(settings: ServerSettings, credentials?: Credentials): Promise<void> {
    if (this.backendProcess) {
      logger.warn('Backend already running');
      return;
    }

    if (credentials) {
      this.credentials = credentials;
    }

    if (!this.credentials) {
      throw new Error('Credentials not set');
    }

    this.currentSettings = settings;

    const backendPath = path.join(
      __dirname,
      '../../../backend/provider-router/src/index.js'
    );
    const wslPath = windowsToWslPath(backendPath);
    const wslDir = getDirectory(wslPath);

    // Hardcoded Node.js path for nvm
    const nodeFullPath = '/home/risky/.nvm/versions/node/v20.18.1/bin/node';

    const command = `cd "${wslDir}" && QWEN_TOKEN="${this.credentials.umidToken}" QWEN_COOKIES="${this.credentials.cookieString}" PORT="${settings.port}" HOST="${settings.host}" ${nodeFullPath} "${wslPath}"`;

    logger.info('Starting backend process', { port: settings.port, host: settings.host });

    this.backendProcess = spawn('wsl', ['bash', '-c', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    this.backendProcess.stdout?.on('data', (data) => {
      logger.info(`[Backend] ${data.toString().trim()}`);
    });

    this.backendProcess.stderr?.on('data', (data) => {
      logger.error(`[Backend Error] ${data.toString().trim()}`);
    });

    this.backendProcess.on('exit', (code) => {
      logger.info(`Backend process exited with code ${code}`);
      this.backendProcess = null;
    });

    this.backendProcess.on('error', (err) => {
      logger.error('Backend process error', err);
      this.backendProcess = null;
    });

    // Wait for backend to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async stop(): Promise<void> {
    if (!this.backendProcess) {
      logger.warn('Backend not running');
      return;
    }

    logger.info('Stopping backend process');

    return new Promise((resolve) => {
      if (!this.backendProcess) {
        resolve();
        return;
      }

      const process = this.backendProcess;

      // Graceful shutdown
      process.kill('SIGTERM');

      // Force kill after 5 seconds
      const killTimeout = setTimeout(() => {
        if (process.killed === false) {
          logger.warn('Force killing backend process');
          process.kill('SIGKILL');
        }
      }, 5000);

      process.on('exit', () => {
        clearTimeout(killTimeout);
        this.backendProcess = null;
        resolve();
      });
    });
  }

  async restart(newSettings?: ServerSettings, credentials?: Credentials): Promise<void> {
    logger.info('Restarting backend process');

    await this.stop();

    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 1000));

    const settings = newSettings || this.currentSettings;
    await this.start(settings, credentials);
  }

  isBackendRunning(): boolean {
    return this.backendProcess !== null && !this.backendProcess.killed;
  }

  getPort(): number {
    return this.currentSettings.port;
  }

  getSettings(): ServerSettings {
    return { ...this.currentSettings };
  }
}

export const backendManager = BackendManager.getInstance();
```

#### `electron/src/services/index.ts`
```typescript
export { backendManager } from './backend-manager';
```

### Files to Modify
None

### Integration Points
- Utils from Phase 13
- Node.js child_process module
- Backend at `backend/provider-router/src/index.js` (existing)

### Validation
- ✅ Backend starts successfully
- ✅ Backend stops gracefully
- ✅ Restart works correctly
- ✅ Logs appear in console

---

## Phase 15: Electron - Preload Script & IPC Bridge (P0)

### Goal
Create the preload script that bridges Electron IPC to the renderer process.

### Files to Create

#### `electron/preload.js`
```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Credentials
  getCredentials: () => ipcRenderer.invoke('get-credentials'),
  refreshCredentials: () => ipcRenderer.invoke('refresh-credentials'),
  openLogin: () => ipcRenderer.invoke('open-login'),

  // Proxy Control
  getProxyStatus: () => ipcRenderer.invoke('get-proxy-status'),
  startProxy: () => ipcRenderer.invoke('start-proxy'),
  stopProxy: () => ipcRenderer.invoke('stop-proxy'),

  // Clipboard
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),

  // Event Listeners - return cleanup functions
  onCredentialsUpdated: (callback) => {
    const subscription = (_event, credentials) => callback(credentials);
    ipcRenderer.on('credentials-updated', subscription);
    return () => ipcRenderer.removeListener('credentials-updated', subscription);
  },

  onProxyStatusChanged: (callback) => {
    const subscription = (_event, status) => callback(status);
    ipcRenderer.on('proxy-status-changed', subscription);
    return () => ipcRenderer.removeListener('proxy-status-changed', subscription);
  },

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
});
```

### Files to Modify
None

### Integration Points
- Electron contextBridge API
- Will be loaded by main process (Phase 16)
- Matches ElectronAPI interface from Phase 2

### Validation
- ✅ API exposed to window object
- ✅ All methods defined
- ✅ Event listeners work
- ✅ Security (context isolation) maintained

---

## Phase 16: Electron - Main Process Core (P0)

### Goal
Create the main Electron process entry point with core IPC handlers.

### Files to Create

#### `electron/src/main.ts`
```typescript
import { app, BrowserWindow, ipcMain, clipboard, session } from 'electron';
import path from 'path';
import { backendManager } from './services';
import { logger } from './utils';

let mainWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load frontend
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers - Credentials
ipcMain.handle('get-credentials', async () => {
  try {
    const credentials = await extractQwenCookies();
    return credentials;
  } catch (err) {
    logger.error('Failed to get credentials', err);
    return {
      cookieString: '',
      umidToken: '',
      hasToken: false,
      tokenExpiry: null,
    };
  }
});

ipcMain.handle('refresh-credentials', async () => {
  try {
    const credentials = await extractQwenCookies();
    if (mainWindow) {
      mainWindow.webContents.send('credentials-updated', credentials);
    }
    return credentials;
  } catch (err) {
    logger.error('Failed to refresh credentials', err);
    throw err;
  }
});

ipcMain.handle('open-login', async () => {
  createLoginWindow();
});

// IPC Handlers - Proxy Control
ipcMain.handle('get-proxy-status', async () => {
  return {
    running: backendManager.isBackendRunning(),
  };
});

ipcMain.handle('start-proxy', async () => {
  try {
    const credentials = await extractQwenCookies();
    if (!credentials.hasToken) {
      return { success: false, message: 'Please login first' };
    }

    const settings = backendManager.getSettings();
    await backendManager.start(settings, {
      umidToken: credentials.umidToken,
      cookieString: credentials.cookieString,
    });

    if (mainWindow) {
      mainWindow.webContents.send('proxy-status-changed', { running: true });
    }

    return { success: true, message: 'Proxy started', port: settings.port };
  } catch (err) {
    logger.error('Failed to start proxy', err);
    return { success: false, message: 'Failed to start proxy' };
  }
});

ipcMain.handle('stop-proxy', async () => {
  try {
    await backendManager.stop();

    if (mainWindow) {
      mainWindow.webContents.send('proxy-status-changed', { running: false });
    }

    return { success: true, message: 'Proxy stopped' };
  } catch (err) {
    logger.error('Failed to stop proxy', err);
    return { success: false, message: 'Failed to stop proxy' };
  }
});

// IPC Handlers - Clipboard
ipcMain.handle('copy-to-clipboard', async (_event, text: string) => {
  clipboard.writeText(text);
});

// IPC Handlers - Window Controls
ipcMain.on('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// Placeholder for credentials extraction (will be implemented in Phase 18)
async function extractQwenCookies() {
  return {
    cookieString: '',
    umidToken: '',
    hasToken: false,
    tokenExpiry: null,
  };
}

function createLoginWindow() {
  // Will be implemented in Phase 18
  logger.info('Login window not yet implemented');
}

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', async () => {
  if (backendManager.isBackendRunning()) {
    await backendManager.stop();
  }
});
```

### Files to Modify
None

### Integration Points
- Backend manager from Phase 14
- Logger from Phase 13
- Preload script from Phase 15
- Frontend (to be loaded in development from Vite, production from dist)

### Validation
- ✅ Window opens
- ✅ IPC handlers respond
- ✅ Backend starts/stops
- ✅ Frontend loads correctly

---

## Phase 17: Electron - Window Management & Tray (P1)

### Goal
Add system tray integration and window state management.

### Files to Create

#### `electron/src/tray.ts`
```typescript
import { app, Tray, Menu, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import { backendManager } from './services';
import { logger } from './utils';

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow): Tray {
  const iconPath = path.join(__dirname, '../assets/icons/png/16x16.png');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('Qwen Proxy');

  updateTrayMenu(mainWindow);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  return tray;
}

export function updateTrayMenu(mainWindow: BrowserWindow): void {
  if (!tray) return;

  const isRunning = backendManager.isBackendRunning();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Login to Qwen',
      click: () => {
        mainWindow.webContents.send('open-login-from-tray');
      },
    },
    {
      label: isRunning ? 'Stop Proxy' : 'Start Proxy',
      click: async () => {
        if (isRunning) {
          await backendManager.stop();
          mainWindow.webContents.send('proxy-status-changed', { running: false });
        } else {
          // Need credentials - show main window
          mainWindow.show();
          mainWindow.webContents.send('start-proxy-from-tray');
        }
        updateTrayMenu(mainWindow);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

export function getTray(): Tray | null {
  return tray;
}
```

### Files to Modify
- `electron/src/main.ts` - Import and initialize tray

```typescript
// Add to main.ts after imports
import { createTray, updateTrayMenu } from './tray';

// Add after createMainWindow()
let tray: Tray | null = null;

// In app.whenReady():
app.whenReady().then(() => {
  createMainWindow();
  if (mainWindow) {
    tray = createTray(mainWindow);
  }
});

// Update window close handler:
ipcMain.on('window:close', () => {
  if (mainWindow) {
    mainWindow.hide();  // Hide to tray instead of closing
  }
});
```

### Integration Points
- Backend manager from Phase 14
- Main window from Phase 16
- Tray icon (to be created in Phase 19)

### Validation
- ✅ Tray icon appears
- ✅ Menu shows correct options
- ✅ Window shows/hides correctly
- ✅ Quit works properly

---

## Phase 18: Electron - Credential Management (P1)

### Goal
Implement Qwen login window and credential extraction.

### Files to Create

#### `electron/src/credentials.ts`
```typescript
import { BrowserWindow, session } from 'electron';
import { logger } from './utils';

export interface Credentials {
  cookieString: string;
  umidToken: string;
  hasToken: boolean;
  tokenExpiry: {
    expired: boolean;
    expiresAt: Date;
    timeLeftHours: number;
    timeLeftDays: number;
  } | null;
}

export function createLoginWindow(onComplete: () => void): BrowserWindow {
  const loginWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      partition: 'persist:qwen',  // Isolated persistent session
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  loginWindow.loadURL('https://chat.qwen.ai');

  // Listen for navigation to detect successful login
  loginWindow.webContents.on('did-navigate', async (event, url) => {
    if (url.includes('chat.qwen.ai')) {
      logger.info('Login detected, extracting cookies');

      // Wait for cookies to be set
      setTimeout(async () => {
        await extractQwenCookies();
        loginWindow.close();
        onComplete();
      }, 2000);
    }
  });

  loginWindow.on('closed', () => {
    logger.info('Login window closed');
  });

  return loginWindow;
}

export async function extractQwenCookies(): Promise<Credentials> {
  const qwenSession = session.fromPartition('persist:qwen');

  try {
    const cookies = await qwenSession.cookies.get({ domain: 'chat.qwen.ai' });

    // Extract all cookies
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Find umid token
    const umidCookie = cookies.find((c) => c.name === 'bx-umidtoken');
    const umidToken = umidCookie?.value || '';

    // Find JWT token and decode
    const tokenCookie = cookies.find((c) => c.name === 'token');
    const jwtToken = tokenCookie?.value || '';

    let tokenExpiry = null;

    if (jwtToken) {
      try {
        const decoded = decodeJWT(jwtToken);
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          const now = new Date();
          const timeLeftMs = expiresAt.getTime() - now.getTime();
          const timeLeftHours = Math.floor(timeLeftMs / (1000 * 60 * 60));
          const timeLeftDays = Math.floor(timeLeftHours / 24);

          tokenExpiry = {
            expired: timeLeftMs <= 0,
            expiresAt,
            timeLeftHours,
            timeLeftDays,
          };
        }
      } catch (err) {
        logger.error('Failed to decode JWT', err);
      }
    }

    const credentials: Credentials = {
      cookieString,
      umidToken,
      hasToken: !!jwtToken,
      tokenExpiry,
    };

    logger.info('Credentials extracted', {
      hasToken: credentials.hasToken,
      expiresAt: tokenExpiry?.expiresAt,
    });

    return credentials;
  } catch (err) {
    logger.error('Failed to extract cookies', err);
    throw err;
  }
}

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (err) {
    logger.error('JWT decode error', err);
    return null;
  }
}

export function startTokenExpirationMonitoring(
  onUpdate: (credentials: Credentials) => void
): NodeJS.Timeout {
  // Check every hour
  return setInterval(async () => {
    logger.info('Checking token expiration');
    const credentials = await extractQwenCookies();

    if (credentials.tokenExpiry?.expired) {
      logger.warn('Token expired');
    } else if (credentials.tokenExpiry && credentials.tokenExpiry.timeLeftHours < 24) {
      logger.warn('Token expiring soon', {
        timeLeft: `${credentials.tokenExpiry.timeLeftHours}h`,
      });
    }

    onUpdate(credentials);
  }, 60 * 60 * 1000); // 1 hour
}
```

### Files to Modify
- `electron/src/main.ts` - Replace placeholder functions

```typescript
// Add import
import { createLoginWindow, extractQwenCookies, startTokenExpirationMonitoring } from './credentials';

// Replace extractQwenCookies placeholder with import

// Update open-login handler:
ipcMain.handle('open-login', async () => {
  loginWindow = createLoginWindow(() => {
    // After login complete, update credentials
    ipcMain.emit('refresh-credentials');
  });
});

// Add in app.whenReady():
// Start token monitoring
startTokenExpirationMonitoring((credentials) => {
  if (mainWindow) {
    mainWindow.webContents.send('credentials-updated', credentials);
  }
});
```

### Integration Points
- Main window from Phase 16
- Logger from Phase 13

### Validation
- ✅ Login window opens
- ✅ Cookies extracted after login
- ✅ JWT decoded correctly
- ✅ Token monitoring works

---

## Phase 19: Electron - Assets & Icons (P1)

### Goal
Add application icons and assets.

### Files to Create

```
electron/assets/
└── icons/
    └── png/
        ├── 16x16.png
        ├── 32x32.png
        ├── 64x64.png
        ├── 128x128.png
        ├── 256x256.png
        └── 512x512.png
```

Create a simple icon (or use existing project logo):
- Square format
- Transparent background
- Simple design for tray visibility

### Files to Modify
None

### Integration Points
- Tray from Phase 17
- electron-builder config (Phase 23)

### Validation
- ✅ Icons display in tray
- ✅ Icons display in taskbar
- ✅ Icons display in installers

---

## Phase 20: Integration - Electron ↔ Frontend (P1)

### Goal
Connect Electron IPC handlers to frontend components.

### Files to Modify

#### `frontend/src/components/layout/TitleBar.tsx`
```typescript
// Update handlers to use Electron API
import { electronIPC } from '@/services/electron-ipc.service';

const handleMinimize = () => {
  if (window.electronAPI) {
    window.electronAPI.minimizeWindow();
  }
};

const handleMaximize = () => {
  if (window.electronAPI) {
    window.electronAPI.maximizeWindow();
  }
};

const handleClose = () => {
  if (window.electronAPI) {
    window.electronAPI.closeWindow();
  }
};
```

### Integration Points
- All frontend hooks from Phase 5 & 6
- All Electron IPC handlers from Phase 16
- Services from Phase 3

### Validation
- ✅ All IPC calls work
- ✅ Events propagate correctly
- ✅ Error handling works
- ✅ UI updates in response to events

---

## Phase 21: Integration - Frontend ↔ Backend API (P1)

### Goal
Ensure frontend can communicate with backend REST API.

### Files to Modify

#### `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

### Integration Points
- Settings API service from Phase 3
- Backend API at `localhost:8000/v1` (existing)

### Validation
- ✅ Settings load from backend
- ✅ Updates persist to backend
- ✅ Error handling works
- ✅ Proxy works in development

---

## Phase 22: Root Workspace Configuration (P2)

### Goal
Create root-level scripts and configuration for managing the entire workspace.

### Files to Create

#### Root `package.json`
```json
{
  "name": "qwen-proxy-workspace",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "install:all": "npm install && cd electron && npm install && cd ../frontend && npm install && cd ../backend/provider-router && npm install",
    "clean": "rm -rf electron/dist frontend/dist electron/node_modules frontend/node_modules node_modules",
    "dev:backend": "cd backend/provider-router && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:electron": "cd electron && npm run build:watch",
    "build:frontend": "cd frontend && npm run build",
    "build:electron": "cd electron && npm run build",
    "electron": "npm run build:frontend && cd electron && npm run build && npm start",
    "electron:dev": "cd electron && npm run dev",
    "build:win": "npm run build:frontend && cd electron && npm run build && npm run build:win",
    "build:mac": "npm run build:frontend && cd electron && npm run build && npm run build:mac",
    "build:linux": "npm run build:frontend && cd electron && npm run build && npm run build:linux",
    "test:frontend": "cd frontend && npm test",
    "lint:frontend": "cd frontend && npm run lint"
  }
}
```

### Files to Modify
None

### Integration Points
- Frontend scripts from Phase 1
- Electron scripts from Phase 1
- Backend scripts (existing)

### Validation
- ✅ All scripts work
- ✅ Dependencies install correctly
- ✅ Build process completes

---

## Phase 23: Build & Distribution Setup (P2)

### Goal
Configure electron-builder for creating distributable installers.

### Files to Create

#### `electron/electron-builder.json`
```json
{
  "appId": "com.qwenproxy.app",
  "productName": "Qwen Proxy",
  "directories": {
    "output": "dist",
    "buildResources": "assets"
  },
  "files": [
    "dist/**/*",
    "preload.js",
    "assets/**/*",
    "../../frontend/dist/**/*"
  ],
  "extraResources": [
    {
      "from": "../backend/provider-router",
      "to": "backend",
      "filter": ["**/*", "!node_modules"]
    }
  ],
  "win": {
    "target": ["nsis"],
    "icon": "assets/icon.ico"
  },
  "mac": {
    "target": ["dmg"],
    "icon": "assets/icon.icns",
    "category": "public.app-category.developer-tools"
  },
  "linux": {
    "target": ["AppImage"],
    "icon": "assets/icon.png",
    "category": "Development"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

### Files to Modify
None

### Integration Points
- Electron dist from Phase 16
- Frontend dist from Phase 11
- Icons from Phase 19

### Validation
- ✅ Windows installer builds
- ✅ macOS installer builds
- ✅ Linux AppImage builds
- ✅ All files included correctly

---

## Phase 24: Testing & Validation (P2)

### Goal
Comprehensive testing of the entire application.

### Test Checklist

#### Electron Application
- [ ] App launches without errors
- [ ] Window displays correctly
- [ ] Title bar controls work
- [ ] Tray icon appears and works
- [ ] Single instance lock works

#### Authentication
- [ ] Login window opens
- [ ] Qwen login completes
- [ ] Cookies extracted correctly
- [ ] JWT decoded properly
- [ ] Token expiration monitored
- [ ] Credentials updated in UI

#### Backend Management
- [ ] Backend starts successfully
- [ ] Backend stops gracefully
- [ ] Backend restarts correctly
- [ ] Settings applied correctly
- [ ] Process logging works

#### Dashboard
- [ ] Authentication status displays
- [ ] Token expiry shown correctly
- [ ] Proxy controls work
- [ ] Start/stop toggle works
- [ ] Copy URL button works
- [ ] Quick start guide displays
- [ ] Code example displays

#### Settings
- [ ] Settings load from API
- [ ] Server settings update
- [ ] Logging settings update
- [ ] System settings update
- [ ] Validation works correctly
- [ ] Restart warnings appear
- [ ] Save/reset buttons work

#### Navigation
- [ ] Navigate between pages
- [ ] Active page highlights
- [ ] State persists across navigation

#### Integration
- [ ] IPC communication works
- [ ] HTTP API communication works
- [ ] Event listeners work
- [ ] Error handling works

#### Build & Distribution
- [ ] Development mode works
- [ ] Production build works
- [ ] Windows installer works
- [ ] macOS installer works
- [ ] Linux AppImage works

---

## Final Project Structure

```
qwen_proxy_opencode/
├── frontend/
│   ├── src/
│   │   ├── types/
│   │   │   ├── credentials.ts
│   │   │   ├── settings.ts
│   │   │   ├── electron-api.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── electron-ipc.service.ts
│   │   │   ├── settings-api.service.ts
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useCredentials.ts
│   │   │   ├── useProxyControl.ts
│   │   │   ├── useSettings.ts
│   │   │   ├── useServerControl.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── clipboard.ts
│   │   │   ├── settings-validator.ts
│   │   │   ├── cn.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── AuthenticationStatus.tsx
│   │   │   │   ├── ProxyServerControl.tsx
│   │   │   │   ├── QuickStartGuide.tsx
│   │   │   │   ├── CodeExample.tsx
│   │   │   │   └── index.ts
│   │   │   ├── settings/
│   │   │   │   ├── SettingItem.tsx
│   │   │   │   ├── ServerSettings.tsx
│   │   │   │   ├── LoggingSettings.tsx
│   │   │   │   ├── SystemSettings.tsx
│   │   │   │   ├── AboutSettings.tsx
│   │   │   │   └── index.ts
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── TitleBar.tsx
│   │   │   │   ├── StatusBar.tsx
│   │   │   │   └── index.ts
│   │   │   └── ui/
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── switch.tsx
│   │   │       └── select.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── index.ts
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── dist/ (build output)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
├── electron/
│   ├── src/
│   │   ├── services/
│   │   │   ├── backend-manager.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── path-converter.ts
│   │   │   └── index.ts
│   │   ├── main.ts
│   │   ├── tray.ts
│   │   └── credentials.ts
│   ├── dist/ (compiled JS)
│   ├── assets/
│   │   └── icons/
│   │       └── png/
│   │           ├── 16x16.png
│   │           ├── 32x32.png
│   │           └── ...
│   ├── preload.js
│   ├── package.json
│   ├── tsconfig.json
│   └── electron-builder.json
├── backend/
│   └── provider-router/ (existing)
├── docs/
│   └── 15-COMPLETE_APPLICATION_REBUILD_PLAN.md (this file)
├── package.json (root workspace)
├── .env
└── README.md
```

---

## Dependencies Summary

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-switch": "^1.0.3",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-label": "^2.0.2",
  "lucide-react": "^0.300.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.2.0"
}
```

### Electron Dependencies
```json
{
  "electron": "^28.0.0"
}
```

### Dev Dependencies (Frontend)
```json
{
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@vitejs/plugin-react": "^4.2.1",
  "typescript": "^5.3.3",
  "vite": "^5.0.8",
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32"
}
```

### Dev Dependencies (Electron)
```json
{
  "@types/node": "^20.10.6",
  "typescript": "^5.3.3",
  "electron-builder": "^24.9.1"
}
```

---

## Key Principles Applied

### Single Responsibility Principle (SRP)
- Each component has one clear purpose
- Services handle only external communication
- Hooks manage only state and side effects
- Utils provide only pure functions
- Types define only data structures

### Don't Repeat Yourself (DRY)
- Shared types used across all layers
- Reusable utility functions
- Common UI components (shadcn/ui)
- Centralized services (singletons)
- Shared validation logic

### Best Practices
- TypeScript strict mode enabled
- Context isolation in Electron
- Proper error handling throughout
- Event listener cleanup
- Graceful process shutdown
- Modular architecture
- Clear separation of concerns
- Comprehensive logging

---

## Notes

- No artificial timelines - work at your own pace
- Phases are ordered by priority (P0 → P1 → P2)
- Foundation layers (types, services, hooks, utils) are P0
- UI components are P1
- Integration and distribution are P1-P2
- Test each phase before moving to the next
- Backend is already complete and working
- Settings are managed via direct HTTP (not IPC)
- Backend runs as WSL child process on Windows

---

## Success Criteria

✅ **Frontend Application**
- All components render correctly
- Navigation works smoothly
- Theme switching works
- All hooks manage state correctly
- API integration works

✅ **Electron Application**
- Window management works
- Tray integration works
- IPC communication works
- Backend lifecycle managed correctly
- Credential extraction works
- Token monitoring works

✅ **Integration**
- Frontend ↔ Electron communication works
- Frontend ↔ Backend HTTP works
- All features functional end-to-end

✅ **Build & Distribution**
- Development mode works
- Production builds work
- Installers created for all platforms
- App runs correctly after installation

---

*End of Implementation Plan*
