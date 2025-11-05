# Electron + Frontend Rebuild Implementation Plan

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | P0 | ⬜ Not Started | TypeScript Types & Interfaces Foundation |
| Phase 2 | P0 | ⬜ Not Started | Core Services & Utilities |
| Phase 3 | P0 | ⬜ Not Started | React Hooks Foundation |
| Phase 4 | P1 | ⬜ Not Started | Electron Main Process Core |
| Phase 5 | P1 | ⬜ Not Started | Electron IPC Bridge (Preload) |
| Phase 6 | P2 | ⬜ Not Started | UI Component Library |
| Phase 7 | P2 | ⬜ Not Started | Dashboard Components |
| Phase 8 | P3 | ⬜ Not Started | Page Layouts & Routing |
| Phase 9 | P3 | ⬜ Not Started | System Tray & Window Management |
| Phase 10 | P4 | ⬜ Not Started | Build Configuration & Testing |

**Legend:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ❌ Blocked

---

## Project Structure Overview

```
qwen_proxy_opencode/
├── electron/                           # Electron desktop application
│   ├── src/
│   │   ├── main.ts                    # Main process entry point
│   │   ├── services/
│   │   │   ├── backend-manager.ts     # Backend process lifecycle
│   │   │   └── credential-manager.ts  # Credential extraction & storage
│   │   ├── utils/
│   │   │   ├── logger.ts              # Structured logging
│   │   │   ├── jwt-decoder.ts         # JWT token decoding
│   │   │   └── path-utils.ts          # Path conversion utilities
│   │   └── types/
│   │       ├── electron.types.ts      # Electron-specific types
│   │       └── ipc.types.ts           # IPC message types
│   ├── preload.ts                     # IPC bridge (contextBridge)
│   ├── dist/                          # Compiled TypeScript output
│   ├── assets/
│   │   └── icons/                     # Application icons
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                           # React UI application
│   ├── src/
│   │   ├── types/
│   │   │   ├── electron-api.types.ts  # Window.electronAPI interface
│   │   │   ├── api.types.ts           # Backend API types
│   │   │   ├── domain.types.ts        # Domain models
│   │   │   └── ui.types.ts            # UI component types
│   │   ├── services/
│   │   │   ├── electron-ipc.service.ts # Electron IPC wrapper
│   │   │   ├── api.service.ts         # Backend HTTP client
│   │   │   └── storage.service.ts     # Local storage wrapper
│   │   ├── hooks/
│   │   │   ├── useElectron.ts         # Electron environment detection
│   │   │   ├── useCredentials.ts      # Qwen credentials state
│   │   │   ├── useProxyControl.ts     # Backend start/stop control
│   │   │   ├── useProviders.ts        # Provider CRUD operations
│   │   │   ├── useModels.ts           # Model listing
│   │   │   ├── useSessions.ts         # Session management
│   │   │   └── useActivity.ts         # Activity monitoring
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   └── Table.tsx
│   │   │   ├── layout/                # Layout components
│   │   │   │   ├── PageLayout.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── Header.tsx
│   │   │   └── dashboard/             # Dashboard-specific components
│   │   │       ├── QwenLoginCard.tsx
│   │   │       ├── ProxyControlCard.tsx
│   │   │       ├── StatsCard.tsx
│   │   │       ├── QuickStartGuide.tsx
│   │   │       └── CodeExample.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx          # Home dashboard
│   │   │   ├── Providers.tsx          # Provider management
│   │   │   ├── Models.tsx             # Model listing
│   │   │   ├── Sessions.tsx           # Session management
│   │   │   ├── Activity.tsx           # Activity monitoring
│   │   │   └── Settings.tsx           # Application settings
│   │   ├── utils/
│   │   │   ├── formatters.ts          # Date/time/number formatters
│   │   │   └── validators.ts          # Input validation
│   │   ├── config/
│   │   │   └── api.config.ts          # API configuration
│   │   ├── App.tsx                    # Root component
│   │   └── main.tsx                   # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── backend/                            # Backend services (existing)
    ├── api-server/                     # Integration point
    ├── provider-router/                # Integration point
    └── qwen-proxy/                     # Integration point
```

---

## Phase 1: TypeScript Types & Interfaces Foundation

**Priority:** P0 (Critical Foundation)

**Objective:** Establish all TypeScript type definitions to ensure type safety across the application.

### Files to Create

#### Electron Types

**File:** `/electron/src/types/electron.types.ts`
```typescript
// Core Electron types
export interface ServerSettings {
  port: number;
  host: string;
  timeout?: number;
}

export interface BackendStatus {
  running: boolean;
  port?: number;
  pid?: number;
}

export interface QwenCredentials {
  token: string;
  cookies: string;
  expiresAt: number;
}
```

**File:** `/electron/src/types/ipc.types.ts`
```typescript
// IPC message types
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProxyStartResponse {
  success: boolean;
  port?: number;
  message?: string;
}

export interface CredentialsData {
  hasToken: boolean;
  tokenExpiry?: number;
}
```

#### Frontend Types

**File:** `/frontend/src/types/electron-api.types.ts`
```typescript
// Window.electronAPI interface definition
export interface ElectronAPI {
  // Credentials
  qwen: {
    openLogin: () => Promise<void>;
    getCredentials: () => Promise<CredentialsData>;
    refreshCredentials: () => Promise<CredentialsData>;
    onCredentialsUpdated: (callback: (data: CredentialsData) => void) => () => void;
  };

  // Proxy Control
  proxy: {
    start: () => Promise<ProxyStartResponse>;
    stop: () => Promise<IPCResponse>;
    getStatus: () => Promise<BackendStatus>;
    onStatusChanged: (callback: (status: BackendStatus) => void) => () => void;
  };

  // System
  system: {
    copyToClipboard: (text: string) => Promise<boolean>;
    showNotification: (title: string, body: string) => Promise<void>;
  };

  // Window
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
```

**File:** `/frontend/src/types/api.types.ts`
```typescript
// Backend REST API types
export interface Provider {
  id: string;
  name: string;
  type: 'qwen-direct' | 'openai' | 'lmstudio' | 'custom';
  enabled: boolean;
  config: {
    base_url: string;
    credentials?: {
      token?: string;
      cookies?: string;
      api_key?: string;
      expires_at?: number;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  provider_id: string;
  name: string;
  display_name: string;
  context_length: number;
  capabilities: string[];
}

export interface Session {
  id: string;
  provider_id: string;
  model_id: string;
  created_at: string;
  last_activity: string;
  request_count: number;
}

export interface ActivityStats {
  total_requests: number;
  total_sessions: number;
  active_providers: number;
  uptime_seconds: number;
}
```

**File:** `/frontend/src/types/domain.types.ts`
```typescript
// Domain-specific types
export interface CredentialsData {
  hasToken: boolean;
  tokenExpiry?: number;
}

export interface BackendStatus {
  running: boolean;
  port?: number;
}

export interface ProxyStartResponse {
  success: boolean;
  port?: number;
  message?: string;
}

export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

**File:** `/frontend/src/types/ui.types.ts`
```typescript
// UI component prop types
export type Page = 'dashboard' | 'providers' | 'models' | 'sessions' | 'activity' | 'settings';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary';

export interface NavigationItem {
  page: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
```

### Files to Modify

None (this is foundation work)

### Integration Points

- Backend API Server (`/backend/api-server`) - types must match API responses
- Backend Provider Router (`/backend/provider-router`) - types must match provider models

### Validation Checklist

- [ ] All types exported properly
- [ ] No circular dependencies
- [ ] Types match backend API contracts
- [ ] Window.electronAPI properly declared
- [ ] All enums and unions defined

---

## Phase 2: Core Services & Utilities

**Priority:** P0 (Critical Foundation)

**Objective:** Implement core service layers and utility functions.

### Files to Create

#### Electron Utilities

**File:** `/electron/src/utils/logger.ts`
```typescript
enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

class Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error): void;
  debug(message: string, data?: any): void;
}

export const logger = new Logger('[Electron]');
```

**File:** `/electron/src/utils/jwt-decoder.ts`
```typescript
export interface DecodedJWT {
  exp: number;
  iat: number;
  [key: string]: any;
}

export function decodeJWT(token: string): DecodedJWT;
export function isTokenExpired(exp: number): boolean;
export function getTimeRemaining(exp: number): number;
```

**File:** `/electron/src/utils/path-utils.ts`
```typescript
export function convertToWSLPath(windowsPath: string): string;
export function resolveBackendPath(): string;
export function resolveNodePath(): string;
```

#### Frontend Services

**File:** `/frontend/src/services/electron-ipc.service.ts`
```typescript
import type { ElectronAPI, CredentialsData, BackendStatus, ProxyStartResponse } from '@/types';

class ElectronIPCService {
  private get api(): ElectronAPI | undefined {
    return window.electronAPI;
  }

  isElectron(): boolean {
    return this.api !== undefined;
  }

  // Credentials
  async openQwenLogin(): Promise<void>;
  async getQwenCredentials(): Promise<CredentialsData>;
  async refreshQwenCredentials(): Promise<CredentialsData>;
  onCredentialsUpdated(callback: (data: CredentialsData) => void): () => void;

  // Proxy Control
  async startProxy(): Promise<ProxyStartResponse>;
  async stopProxy(): Promise<IPCResponse>;
  async getProxyStatus(): Promise<BackendStatus>;
  onProxyStatusChanged(callback: (status: BackendStatus) => void): () => void;

  // System
  async copyToClipboard(text: string): Promise<boolean>;
  async showNotification(title: string, body: string): Promise<void>;

  // Window
  minimizeWindow(): void;
  maximizeWindow(): void;
  closeWindow(): void;
}

export const electronIPCService = new ElectronIPCService();
```

**File:** `/frontend/src/services/api.service.ts`
```typescript
import type { Provider, Model, Session, ActivityStats } from '@/types';

class APIService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Providers
  async getProviders(): Promise<Provider[]>;
  async getProvider(id: string): Promise<Provider>;
  async createProvider(data: Partial<Provider>): Promise<Provider>;
  async updateProvider(id: string, data: Partial<Provider>): Promise<Provider>;
  async deleteProvider(id: string): Promise<void>;

  // Models
  async getModels(): Promise<Model[]>;
  async syncModels(providerId: string): Promise<Model[]>;

  // Sessions
  async getSessions(): Promise<Session[]>;
  async getSession(id: string): Promise<Session>;
  async deleteSession(id: string): Promise<void>;

  // Activity
  async getActivityStats(): Promise<ActivityStats>;

  // Health
  async healthCheck(): Promise<boolean>;
}

export const apiService = new APIService('http://localhost:3002');
```

**File:** `/frontend/src/services/storage.service.ts`
```typescript
class StorageService {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

export const storageService = new StorageService('qwen-proxy');
```

#### Frontend Utilities

**File:** `/frontend/src/utils/formatters.ts`
```typescript
export function formatDate(timestamp: number | string): string;
export function formatTimeRemaining(expiresAt: number): string;
export function formatNumber(num: number): string;
export function formatBytes(bytes: number): string;
```

**File:** `/frontend/src/utils/validators.ts`
```typescript
export function isValidURL(url: string): boolean;
export function isValidPort(port: number): boolean;
export function isValidProviderType(type: string): boolean;
```

**File:** `/frontend/src/config/api.config.ts`
```typescript
export const API_CONFIG = {
  baseURL: 'http://localhost:3002',
  timeout: 10000,
  endpoints: {
    health: '/api/health',
    providers: '/api/providers',
    models: '/api/models',
    sessions: '/api/sessions',
    activity: '/api/activity',
  },
};
```

### Files to Modify

None

### Integration Points

- Backend API Server - HTTP endpoints must exist
- Electron Main Process - will consume logger and utils

### Validation Checklist

- [ ] All services are singletons or pure functions
- [ ] Error handling implemented
- [ ] Logging integrated
- [ ] Type safety enforced
- [ ] No business logic in services (only data access)

---

## Phase 3: React Hooks Foundation

**Priority:** P0 (Critical Foundation)

**Objective:** Create custom React hooks for state management and data fetching.

### Files to Create

**File:** `/frontend/src/hooks/useElectron.ts`
```typescript
import { electronIPCService } from '@/services';

export function useElectron() {
  const isElectron = electronIPCService.isElectron();

  return {
    isElectron,
    ipc: isElectron ? electronIPCService : null,
  };
}
```

**File:** `/frontend/src/hooks/useCredentials.ts`
```typescript
import { useState, useEffect } from 'react';
import { electronIPCService } from '@/services';
import type { CredentialsData } from '@/types';

export function useCredentials() {
  const [credentials, setCredentials] = useState<CredentialsData>({
    hasToken: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const openLogin = async () => Promise<void>;
  const refresh = async () => Promise<void>;

  return {
    credentials,
    isLoading,
    error,
    openLogin,
    refresh,
  };
}
```

**File:** `/frontend/src/hooks/useProxyControl.ts`
```typescript
import { useState, useEffect } from 'react';
import { electronIPCService } from '@/services';
import type { BackendStatus } from '@/types';

export function useProxyControl() {
  const [status, setStatus] = useState<BackendStatus>({ running: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => Promise<void>;
  const stop = async () => Promise<void>;

  return {
    status,
    isLoading,
    error,
    start,
    stop,
  };
}
```

**File:** `/frontend/src/hooks/useProviders.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services';
import type { Provider } from '@/types';

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => Promise<void>, []);
  const createProvider = async (data: Partial<Provider>) => Promise<void>;
  const updateProvider = async (id: string, data: Partial<Provider>) => Promise<void>;
  const deleteProvider = async (id: string) => Promise<void>;

  return {
    providers,
    isLoading,
    error,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
  };
}
```

**File:** `/frontend/src/hooks/useModels.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services';
import type { Model } from '@/types';

export function useModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => Promise<void>, []);
  const syncModels = async (providerId: string) => Promise<void>;

  return {
    models,
    isLoading,
    error,
    fetchModels,
    syncModels,
  };
}
```

**File:** `/frontend/src/hooks/useSessions.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services';
import type { Session } from '@/types';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => Promise<void>, []);
  const deleteSession = async (id: string) => Promise<void>;

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    deleteSession,
  };
}
```

**File:** `/frontend/src/hooks/useActivity.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services';
import type { ActivityStats } from '@/types';

export function useActivity() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => Promise<void>, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}
```

### Files to Modify

None

### Integration Points

- `/frontend/src/services/electron-ipc.service.ts` - hooks consume IPC service
- `/frontend/src/services/api.service.ts` - hooks consume API service
- Backend API Server - hooks fetch data from API

### Validation Checklist

- [ ] All hooks follow React hooks rules
- [ ] Proper dependency arrays
- [ ] Cleanup functions for subscriptions
- [ ] Error handling
- [ ] Loading states managed
- [ ] No business logic (only state management)

---

## Phase 4: Electron Main Process Core

**Priority:** P1 (High)

**Objective:** Implement Electron main process, backend manager, and credential handling.

### Files to Create

**File:** `/electron/src/services/backend-manager.ts`
```typescript
import { spawn, ChildProcess } from 'child_process';
import type { ServerSettings, BackendStatus } from '../types';

class BackendManager {
  private static instance: BackendManager | null = null;
  private backendProcess: ChildProcess | null = null;
  private settings: ServerSettings;

  private constructor() {}

  static getInstance(): BackendManager;

  async start(settings: ServerSettings): Promise<void>;
  async stop(): Promise<void>;
  async restart(settings: ServerSettings): Promise<void>;
  isRunning(): boolean;
  getStatus(): BackendStatus;
  getPort(): number;

  private async waitForBackend(port: number): Promise<void>;
  private setupProcessHandlers(): void;
  private killProcess(): void;
}

export const backendManager = BackendManager.getInstance();
```

**File:** `/electron/src/services/credential-manager.ts`
```typescript
import { session } from 'electron';
import type { QwenCredentials } from '../types';

class CredentialManager {
  private static instance: CredentialManager | null = null;

  private constructor() {}

  static getInstance(): CredentialManager;

  async extractQwenCookies(): Promise<QwenCredentials | null>;
  async saveCredentialsToBackend(credentials: QwenCredentials): Promise<void>;
  isTokenExpired(expiresAt: number): boolean;
  getTimeRemaining(expiresAt: number): string;
}

export const credentialManager = CredentialManager.getInstance();
```

**File:** `/electron/src/main.ts`
```typescript
import { app, BrowserWindow, Tray, Menu, ipcMain, Notification } from 'electron';
import path from 'path';
import { backendManager } from './services/backend-manager';
import { credentialManager } from './services/credential-manager';
import { logger } from './utils/logger';

let mainWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createMainWindow(): void;
function createLoginWindow(): void;
function createTray(): void;
function updateTrayMenu(): void;
function registerIPCHandlers(): void;

app.whenReady().then(async () => {
  // Start backend
  await backendManager.start({ port: 3002, host: 'localhost' });

  // Create UI
  createMainWindow();
  createTray();
  registerIPCHandlers();
});

app.on('before-quit', async () => {
  await backendManager.stop();
});
```

### Files to Modify

None

### Integration Points

- `/electron/src/utils/logger.ts` - used for logging
- `/electron/src/utils/jwt-decoder.ts` - used for token validation
- `/electron/src/utils/path-utils.ts` - used for path resolution
- `/electron/src/types/*.ts` - type definitions
- Backend API Server - backend manager spawns this process
- Backend API endpoint `/api/providers/qwen-default` - credentials saved here

### Validation Checklist

- [ ] Backend spawns successfully
- [ ] Backend stops gracefully
- [ ] Credentials extracted correctly
- [ ] Credentials saved to backend via HTTP
- [ ] Window creation works
- [ ] App lifecycle managed properly

---

## Phase 5: Electron IPC Bridge (Preload)

**Priority:** P1 (High)

**Objective:** Implement secure IPC communication bridge using contextBridge.

### Files to Create

**File:** `/electron/preload.ts`
```typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../frontend/src/types/electron-api.types';

const electronAPI: ElectronAPI = {
  qwen: {
    openLogin: () => ipcRenderer.invoke('qwen:open-login'),
    getCredentials: () => ipcRenderer.invoke('qwen:get-credentials'),
    refreshCredentials: () => ipcRenderer.invoke('qwen:refresh-credentials'),
    onCredentialsUpdated: (callback) => {
      const subscription = (_event: any, data: any) => callback(data);
      ipcRenderer.on('credentials-updated', subscription);
      return () => ipcRenderer.removeListener('credentials-updated', subscription);
    },
  },

  proxy: {
    start: () => ipcRenderer.invoke('proxy:start'),
    stop: () => ipcRenderer.invoke('proxy:stop'),
    getStatus: () => ipcRenderer.invoke('proxy:get-status'),
    onStatusChanged: (callback) => {
      const subscription = (_event: any, data: any) => callback(data);
      ipcRenderer.on('proxy-status-changed', subscription);
      return () => ipcRenderer.removeListener('proxy-status-changed', subscription);
    },
  },

  system: {
    copyToClipboard: (text) => ipcRenderer.invoke('system:copy-to-clipboard', text),
    showNotification: (title, body) => ipcRenderer.invoke('system:show-notification', title, body),
  },

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
```

### Files to Modify

**File:** `/electron/src/main.ts`
- Add IPC handlers:
  - `qwen:open-login`
  - `qwen:get-credentials`
  - `qwen:refresh-credentials`
  - `proxy:start`
  - `proxy:stop`
  - `proxy:get-status`
  - `system:copy-to-clipboard`
  - `system:show-notification`
  - `window:minimize`
  - `window:maximize`
  - `window:close`

### Integration Points

- `/electron/src/services/backend-manager.ts` - IPC handlers call this
- `/electron/src/services/credential-manager.ts` - IPC handlers call this
- `/frontend/src/types/electron-api.types.ts` - type definitions must match
- `/frontend/src/services/electron-ipc.service.ts` - consumes this API

### Validation Checklist

- [ ] contextBridge properly isolates renderer
- [ ] All IPC channels registered
- [ ] Type safety maintained
- [ ] Event cleanup functions work
- [ ] No Node.js APIs exposed to renderer

---

## Phase 6: UI Component Library

**Priority:** P2 (Medium)

**Objective:** Create reusable UI components following design system.

### Files to Create

**File:** `/frontend/src/components/ui/Card.tsx`
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps): JSX.Element;
export function CardHeader({ children, className }: CardProps): JSX.Element;
export function CardContent({ children, className }: CardProps): JSX.Element;
export function CardFooter({ children, className }: CardProps): JSX.Element;
```

**File:** `/frontend/src/components/ui/Button.tsx`
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant, size, children, ...props }: ButtonProps): JSX.Element;
```

**File:** `/frontend/src/components/ui/Badge.tsx`
```typescript
import type { BadgeVariant } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps): JSX.Element;
```

**File:** `/frontend/src/components/ui/Input.tsx`
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps): JSX.Element;
```

**File:** `/frontend/src/components/ui/Select.tsx`
```typescript
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export function Select({ options, value, onChange, label, error }: SelectProps): JSX.Element;
```

**File:** `/frontend/src/components/ui/Table.tsx`
```typescript
interface TableProps {
  children: React.ReactNode;
}

export function Table({ children }: TableProps): JSX.Element;
export function TableHeader({ children }: TableProps): JSX.Element;
export function TableBody({ children }: TableProps): JSX.Element;
export function TableRow({ children }: TableProps): JSX.Element;
export function TableHead({ children }: TableProps): JSX.Element;
export function TableCell({ children }: TableProps): JSX.Element;
```

### Files to Modify

None

### Integration Points

- Design system CSS variables (defined in index.css)
- Tailwind CSS configuration

### Validation Checklist

- [ ] Components are accessible (ARIA)
- [ ] Components are responsive
- [ ] Proper TypeScript types
- [ ] No business logic in components
- [ ] Consistent styling

---

## Phase 7: Dashboard Components

**Priority:** P2 (Medium)

**Objective:** Build dashboard-specific components for Qwen login and proxy control.

### Files to Create

**File:** `/frontend/src/components/dashboard/QwenLoginCard.tsx`
```typescript
import { Card, Button, Badge } from '@/components/ui';
import { useCredentials } from '@/hooks';

export function QwenLoginCard(): JSX.Element {
  const { credentials, openLogin, refresh } = useCredentials();

  // Implementation with:
  // - Login status badge
  // - Expiration display
  // - Time remaining
  // - Login/refresh buttons
}
```

**File:** `/frontend/src/components/dashboard/ProxyControlCard.tsx`
```typescript
import { Card, Button, Badge } from '@/components/ui';
import { useProxyControl } from '@/hooks';

export function ProxyControlCard(): JSX.Element {
  const { status, start, stop } = useProxyControl();

  // Implementation with:
  // - Running status badge
  // - Endpoint URL display
  // - Copy URL button
  // - Start/stop button
}
```

**File:** `/frontend/src/components/dashboard/StatsCard.tsx`
```typescript
import { Card } from '@/components/ui';
import { useProviders, useSessions } from '@/hooks';

export function StatsCard(): JSX.Element {
  const { providers } = useProviders();
  const { sessions } = useSessions();

  // Display:
  // - Total providers
  // - Active sessions
  // - Enabled providers
}
```

**File:** `/frontend/src/components/dashboard/QuickStartGuide.tsx`
```typescript
import { Card } from '@/components/ui';

export function QuickStartGuide(): JSX.Element {
  // Step-by-step guide:
  // 1. Login to Qwen
  // 2. Start Proxy
  // 3. Use endpoint
}
```

**File:** `/frontend/src/components/dashboard/CodeExample.tsx`
```typescript
import { Card, Button } from '@/components/ui';

export function CodeExample(): JSX.Element {
  // Code snippet with syntax highlighting
  // Copy button
}
```

**File:** `/frontend/src/components/layout/PageLayout.tsx`
```typescript
import { Navigation, Header } from '@/components/layout';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps): JSX.Element {
  // Standard page layout with navigation and header
}
```

**File:** `/frontend/src/components/layout/Navigation.tsx`
```typescript
import type { Page, NavigationItem } from '@/types';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps): JSX.Element {
  // Vertical navigation sidebar
}
```

**File:** `/frontend/src/components/layout/Header.tsx`
```typescript
export function Header(): JSX.Element {
  // Window controls (Electron)
  // App title
}
```

### Files to Modify

None

### Integration Points

- `/frontend/src/hooks/useCredentials.ts` - QwenLoginCard uses this
- `/frontend/src/hooks/useProxyControl.ts` - ProxyControlCard uses this
- `/frontend/src/hooks/useProviders.ts` - StatsCard uses this
- `/frontend/src/hooks/useSessions.ts` - StatsCard uses this
- `/frontend/src/components/ui/*` - all dashboard components use UI library

### Validation Checklist

- [ ] Components properly use hooks
- [ ] Loading states displayed
- [ ] Error states displayed
- [ ] Responsive design
- [ ] Accessibility (keyboard navigation)

---

## Phase 8: Page Layouts & Routing

**Priority:** P3 (Normal)

**Objective:** Create page layouts and implement routing.

### Files to Create

**File:** `/frontend/src/pages/Dashboard.tsx`
```typescript
import { PageLayout } from '@/components/layout';
import { QwenLoginCard, ProxyControlCard, StatsCard, QuickStartGuide, CodeExample } from '@/components/dashboard';

export function Dashboard(): JSX.Element {
  // Grid layout:
  // - Left: QwenLoginCard, ProxyControlCard
  // - Right: StatsCard
  // - Full width: QuickStartGuide, CodeExample
}
```

**File:** `/frontend/src/pages/Providers.tsx`
```typescript
import { PageLayout } from '@/components/layout';
import { useProviders } from '@/hooks';
import { Card, Button, Table } from '@/components/ui';

export function Providers(): JSX.Element {
  const { providers, createProvider, updateProvider, deleteProvider } = useProviders();

  // Provider CRUD interface:
  // - Table of providers
  // - Add provider button
  // - Edit/delete actions
}
```

**File:** `/frontend/src/pages/Models.tsx`
```typescript
import { PageLayout } from '@/components/layout';
import { useModels } from '@/hooks';
import { Card, Button, Table } from '@/components/ui';

export function Models(): JSX.Element {
  const { models, syncModels } = useModels();

  // Model listing:
  // - Table of models grouped by provider
  // - Sync models button
}
```

**File:** `/frontend/src/pages/Sessions.tsx`
```typescript
import { PageLayout } from '@/components/layout';
import { useSessions } from '@/hooks';
import { Card, Button, Table } from '@/components/ui';

export function Sessions(): JSX.Element {
  const { sessions, deleteSession } = useSessions();

  // Session management:
  // - Table of active sessions
  // - Delete session action
  // - View session details
}
```

**File:** `/frontend/src/pages/Activity.tsx`
```typescript
import { PageLayout } from '@/components/layout';
import { useActivity } from '@/hooks';
import { Card } from '@/components/ui';

export function Activity(): JSX.Element {
  const { stats } = useActivity();

  // Activity dashboard:
  // - Stats cards
  // - Recent activity list
}
```

**File:** `/frontend/src/pages/Settings.tsx`
```typescript
import { PageLayout } from '@/components/layout';
import { Card, Input, Select, Button } from '@/components/ui';

export function Settings(): JSX.Element {
  // Settings interface:
  // - Server settings (port, host)
  // - Logging settings
  // - System settings
  // - Save button
}
```

**File:** `/frontend/src/App.tsx`
```typescript
import { useState } from 'react';
import { Dashboard, Providers, Models, Sessions, Activity, Settings } from '@/pages';
import type { Page } from '@/types';

export function App(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Route to appropriate page component
}
```

### Files to Modify

**File:** `/frontend/src/main.tsx`
- Import and render App component

### Integration Points

- All hooks from Phase 3
- All components from Phases 6 and 7
- Backend API Server - pages fetch data from API

### Validation Checklist

- [ ] All pages render correctly
- [ ] Navigation between pages works
- [ ] Data fetching integrated
- [ ] Loading and error states
- [ ] Responsive layouts

---

## Phase 9: System Tray & Window Management

**Priority:** P3 (Normal)

**Objective:** Implement system tray integration and window controls.

### Files to Modify

**File:** `/electron/src/main.ts`
- Implement `createTray()`:
  - Show Dashboard menu item
  - Login to Qwen menu item
  - Start/Stop Proxy menu item
  - Navigation to CRUD pages
  - Settings menu item
  - Quit menu item
- Implement `updateTrayMenu()`:
  - Update based on backend status
  - Update based on credentials status
- Implement window event handlers:
  - Minimize to tray
  - Close to tray
  - Show from tray
- Add IPC listener for navigation:
  - `navigate` event to change page from tray menu

**File:** `/frontend/src/App.tsx`
- Add IPC listener for `navigate` event
- Update `currentPage` state when navigation event received

**File:** `/frontend/src/components/layout/Header.tsx`
- Add window control buttons (minimize, maximize, close)
- Wire up to IPC service

### Integration Points

- `/electron/src/services/backend-manager.ts` - tray shows backend status
- `/electron/src/services/credential-manager.ts` - tray shows auth status
- `/frontend/src/services/electron-ipc.service.ts` - header uses window controls

### Validation Checklist

- [ ] Tray icon displays correctly
- [ ] Tray menu items work
- [ ] Window minimizes to tray
- [ ] Window shows from tray
- [ ] Navigation from tray works
- [ ] Window controls work (min/max/close)

---

## Phase 10: Build Configuration & Testing

**Priority:** P4 (Low)

**Objective:** Configure build process and verify all functionality.

### Files to Create

**File:** `/electron/tsconfig.json`
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
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**File:** `/frontend/vite.config.ts`
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
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

**File:** `/electron/package.json`
```json
{
  "name": "qwen-proxy-electron",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsc && NODE_ENV=development electron .",
    "start": "tsc && electron ."
  }
}
```

**File:** `/frontend/package.json`
```json
{
  "name": "qwen-proxy-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Files to Modify

**File:** `/package.json` (root)
- Add npm scripts:
  - `dev:electron` - Start Electron in dev mode
  - `dev:frontend` - Start Vite dev server
  - `dev` - Start both (concurrently)
  - `build:electron` - Build Electron
  - `build:frontend` - Build frontend
  - `build` - Build both

### Integration Points

- All phases must be complete
- Backend services must be running
- Database must be initialized

### Validation Checklist

- [ ] Electron builds successfully
- [ ] Frontend builds successfully
- [ ] Dev mode works (hot reload)
- [ ] Production build works
- [ ] Backend spawns correctly
- [ ] All pages functional
- [ ] All IPC communication works
- [ ] All CRUD operations work
- [ ] System tray functional
- [ ] Window controls functional

---

## Testing Strategy

### Unit Tests
- Utility functions (formatters, validators)
- Service classes (API service, IPC service)
- Pure functions (JWT decoder, path utils)

### Integration Tests
- Backend spawning and stopping
- Credential extraction and storage
- IPC communication end-to-end
- API data fetching

### Manual Testing Checklist

#### Electron Functionality
- [ ] App launches successfully
- [ ] Backend auto-starts on launch
- [ ] Backend stops on quit
- [ ] System tray appears
- [ ] Tray menu items work
- [ ] Window controls work
- [ ] Minimize to tray works
- [ ] Close to tray works

#### Qwen Login
- [ ] Login window opens
- [ ] Cookies extracted after login
- [ ] Credentials saved to backend
- [ ] UI updates with credentials
- [ ] Token expiration displayed
- [ ] Refresh credentials works

#### Proxy Control
- [ ] Start proxy button works
- [ ] Stop proxy button works
- [ ] Status updates in real-time
- [ ] Endpoint URL displayed
- [ ] Copy URL to clipboard works

#### CRUD Pages
- [ ] Dashboard page loads
- [ ] Providers page loads
- [ ] Models page loads
- [ ] Sessions page loads
- [ ] Activity page loads
- [ ] Settings page loads
- [ ] Navigation between pages works

#### Data Operations
- [ ] Providers list loads
- [ ] Create provider works
- [ ] Update provider works
- [ ] Delete provider works
- [ ] Models list loads
- [ ] Sync models works
- [ ] Sessions list loads
- [ ] Delete session works

---

## Dependencies

### Electron Dependencies
```json
{
  "dependencies": {
    "electron": "^28.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## Risk Mitigation

### Technical Risks

**Risk:** Backend fails to spawn
- **Mitigation:** Comprehensive error logging, health check retries, fallback to manual start

**Risk:** IPC communication breaks
- **Mitigation:** Type-safe interfaces, extensive testing, fallback UI for non-Electron mode

**Risk:** Credentials extraction fails
- **Mitigation:** Clear user feedback, retry mechanism, manual credential entry option

**Risk:** Build process fails
- **Mitigation:** Clear build scripts, dependency version locking, CI/CD integration

### Project Risks

**Risk:** Scope creep
- **Mitigation:** Stick to phases, no new features until foundation complete

**Risk:** Type mismatches between Electron and Frontend
- **Mitigation:** Shared type definitions, strict TypeScript mode

**Risk:** Backend API changes
- **Mitigation:** Integration point documentation, version compatibility checks

---

## Success Criteria

### Phase Completion Criteria

Each phase is considered complete when:
1. All files created/modified as specified
2. All validation checklist items passed
3. No TypeScript compilation errors
4. Integration points verified
5. Manual testing passed

### Overall Project Success

Project is complete when:
1. ✅ All 10 phases completed
2. ✅ Electron app launches and runs stably
3. ✅ Backend spawns and stops correctly
4. ✅ Qwen login flow works end-to-end
5. ✅ All CRUD pages functional
6. ✅ System tray fully integrated
7. ✅ Production build succeeds
8. ✅ No critical bugs

---

## Notes

### Architecture Decisions

1. **IPC Only for Electron Features:** Settings, CRUD operations use HTTP directly to backend API
2. **Database-First Credentials:** Credentials stored in backend database, not .env files
3. **Singleton Services:** Backend Manager and Credential Manager use singleton pattern
4. **Type Safety First:** All types defined before implementation
5. **Component Composition:** UI components are composable and reusable

### Development Guidelines

1. **Follow SRP:** Each file has single responsibility
2. **Follow DRY:** No code duplication, use shared utilities
3. **Domain-Driven:** Types reflect domain models
4. **Test-Driven:** Write tests alongside implementation
5. **Document As You Go:** Update this plan with learnings

### Common Pitfalls to Avoid

1. ❌ Don't mix IPC and HTTP for same data operations
2. ❌ Don't put business logic in UI components
3. ❌ Don't bypass type safety with `any`
4. ❌ Don't create new files without updating this plan
5. ❌ Don't skip validation checklists

---

## Appendix A: File Naming Conventions

- **Types:** `*.types.ts` (e.g., `electron.types.ts`)
- **Services:** `*.service.ts` (e.g., `api.service.ts`)
- **Hooks:** `use*.ts` (e.g., `useCredentials.ts`)
- **Components:** PascalCase (e.g., `QwenLoginCard.tsx`)
- **Pages:** PascalCase (e.g., `Dashboard.tsx`)
- **Utils:** `*.ts` (e.g., `formatters.ts`)
- **Config:** `*.config.ts` (e.g., `api.config.ts`)

## Appendix B: Import Path Aliases

```typescript
// Frontend
'@/types' → '/frontend/src/types'
'@/services' → '/frontend/src/services'
'@/hooks' → '/frontend/src/hooks'
'@/components' → '/frontend/src/components'
'@/pages' → '/frontend/src/pages'
'@/utils' → '/frontend/src/utils'
'@/config' → '/frontend/src/config'
```

## Appendix C: Code Review Checklist

Before marking phase complete:
- [ ] TypeScript strict mode enabled
- [ ] No `any` types used
- [ ] All exports have types
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Comments for complex logic
- [ ] No console.log (use logger)
- [ ] Proper cleanup in useEffect
- [ ] Accessibility attributes (ARIA)
- [ ] Responsive design tested

---

**Document Version:** 1.0
**Created:** 2025-11-04
**Status:** Ready for Implementation
