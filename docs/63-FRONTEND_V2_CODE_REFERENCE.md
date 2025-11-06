# Frontend v2 Code Reference

**Project**: Qwen Proxy Dashboard - Frontend v2 Code Snippets
**Reference**: Companion to [62-FRONTEND_V2_IMPLEMENTATION_PLAN.md](./62-FRONTEND_V2_IMPLEMENTATION_PLAN.md)
**Purpose**: Complete code implementations for all components
**Date**: November 6, 2025

---

## Table of Contents

- [Phase 1: Foundation - Core Architecture Files](#phase-1-foundation---core-architecture-files)
- [Phase 2: Layout Components](#phase-2-layout-components)
- [Phase 3: UI Components - shadcn Extensions](#phase-3-ui-components---shadcn-extensions)
- [Phase 4: Feature Components - Alerts](#phase-4-feature-components---alerts)
- [Phase 5: Feature Components - Credentials](#phase-5-feature-components---credentials)
- [Phase 6: Feature Components - Stats, Providers, Models](#phase-6-feature-components---stats-providers-models)
- [Phase 7: Feature Components - Authentication](#phase-7-feature-components---authentication)
- [Phase 8: Feature Components - Proxy](#phase-8-feature-components---proxy)
- [Phase 9: Pages - Dashboard](#phase-9-pages---dashboard)
- [Phase 10: Public Assets](#phase-10-public-assets)
- [CSS Architecture](#css-architecture)

---

## Phase 1: Foundation - Core Architecture Files

### src/types/common.types.ts

```typescript
// UI State types (simplified - theme only, no navigation)
export interface UIState {
  theme: 'light' | 'dark';
}

// Status types matching backend API
export type ProxyStatus = 'stopped' | 'starting' | 'running' | 'partial' | 'error';
export type CredentialStatus = 'active' | 'inactive' | 'expired';
```

### src/types/credentials.types.ts

```typescript
// Maps to GET /api/qwen/credentials response
export interface QwenCredentials {
  token: string;        // masked token
  cookies: string;      // masked cookies
  expiresAt: number | null;  // Unix timestamp
  isExpired: boolean;
}

// Maps to POST /api/qwen/credentials request
export interface SetCredentialsRequest {
  token: string;
  cookies: string;
  expiresAt?: number;
}
```

### src/types/proxy.types.ts

```typescript
// Provider type (from status endpoint)
export interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl: string;
  // Add other provider fields as needed
}

// Model type (from status endpoint)
export interface Model {
  id: string;
  name: string;
  providerId: string;
  // Add other model fields as needed
}

// Maps to GET /api/proxy/status response
// CRITICAL: This is the actual backend response structure
export interface ProxyStatusResponse {
  status: 'running' | 'partial' | 'stopped';
  providerRouter: {
    running: boolean;
    port: number;
    pid: number | null;
    uptime: number;
  };
  qwenProxy: {
    running: boolean;
    port: number;
    pid: number | null;
    uptime: number;
  };
  providers: {
    items: Provider[];      // Array of provider objects
    total: number;
    enabled: number;
  };
  models: {
    items: Model[];         // Array of model objects
    total: number;
  };
  credentials: {
    valid: boolean;
    expiresAt: number | null;
  };
  message: string;
}

// Maps to POST /api/proxy/start and POST /api/proxy/stop responses
export interface ProxyControlResponse {
  success: boolean;
  status: string;
  providerRouter: {
    running: boolean;
    port: number;
    pid: number | null;
    uptime: number;
  };
  qwenProxy: {
    running: boolean;
    port: number;
    pid: number | null;
    uptime: number;
  };
  message: string;
}
```

### src/types/index.ts

```typescript
// Re-export all types
export * from './common.types';
export * from './credentials.types';
export * from './proxy.types';
```

### src/stores/useUIStore.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types/common.types';

interface UIStore {
  uiState: UIState;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      uiState: {
        theme: 'light',
      },
      setTheme: (theme) => set((state) => ({
        uiState: { ...state.uiState, theme }
      })),
      toggleTheme: () => set((state) => ({
        uiState: {
          ...state.uiState,
          theme: state.uiState.theme === 'light' ? 'dark' : 'light'
        }
      })),
    }),
    { name: 'qwen-proxy-ui-state' }
  )
);
```

### src/stores/useCredentialsStore.ts

```typescript
import { create } from 'zustand';
import type { QwenCredentials } from '@/types/credentials.types';

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

### src/stores/useProxyStore.ts

```typescript
import { create } from 'zustand';
import type { ProxyStatusResponse } from '@/types/proxy.types';

interface ProxyStore {
  status: ProxyStatusResponse | null;
  loading: boolean;
  setStatus: (status: ProxyStatusResponse | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProxyStore = create<ProxyStore>((set) => ({
  status: null,
  loading: false,
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
}));
```

### src/stores/useAlertStore.ts

```typescript
import { create } from 'zustand';

interface AlertStore {
  alert: {
    message: string;
    type: 'success' | 'error';
  } | null;
  showAlert: (message: string, type: 'success' | 'error') => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alert: null,
  showAlert: (message, type) => set({ alert: { message, type } }),
  hideAlert: () => set({ alert: null }),
}));
```

### src/hooks/useDarkMode.ts

```typescript
import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function useDarkMode() {
  const theme = useUIStore((state) => state.uiState.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return { theme, toggleTheme };
}
```

### src/lib/constants.ts

```typescript
export const APP_NAME = 'Qwen Proxy Dashboard';
export const APP_VERSION = '2.0.0';
export const SIDEBAR_WIDTH_EXPANDED = 224;
export const SIDEBAR_WIDTH_COLLAPSED = 48;
export const TITLEBAR_HEIGHT = 48;
export const STATUSBAR_HEIGHT = 24;
```

### src/utils/formatters.ts

```typescript
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}
```

### src/utils/validators.ts

```typescript
export function isValidPort(port: number): boolean {
  return port >= 1 && port <= 65535;
}

export function isValidHost(host: string): boolean {
  return host.length > 0 && /^[a-zA-Z0-9.-]+$/.test(host);
}

export function isValidPath(path: string): boolean {
  return path.length > 0;
}
```

### src/utils/string.utils.ts

```typescript
export function truncateToken(token: string, length: number = 20): string {
  if (token.length <= length) return token;
  return `${token.substring(0, length)}...`;
}

export function truncateCookies(cookies: string, length: number = 50): string {
  if (cookies.length <= length) return cookies;
  return `${cookies.substring(0, length)}...`;
}
```

---

## Phase 2: Layout Components

**CRITICAL**: All layout components must use ONLY custom CSS classes from index.css (NO inline Tailwind).

### src/components/layout/Sidebar.tsx

```typescript
import { useUIStore } from '@/stores/useUIStore';
import { Home, Settings, Activity } from 'lucide-react';

export function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.uiState.sidebarCollapsed);
  const currentScreen = useUIStore((state) => state.uiState.currentScreen);
  const setCurrentScreen = useUIStore((state) => state.setCurrentScreen);

  // NO INLINE TAILWIND - All styling via CSS classes
  return (
    <aside className={sidebarCollapsed ? 'sidebar sidebar-collapsed' : 'sidebar sidebar-expanded'}>
      <nav>
        <button
          className={currentScreen === 'home' ? 'sidebar-item sidebar-item-active' : 'sidebar-item'}
          onClick={() => setCurrentScreen('home')}
        >
          <Home className="sidebar-button" />
          {!sidebarCollapsed && <span className="sidebar-label">Home</span>}
        </button>

        <button
          className={currentScreen === 'settings' ? 'sidebar-item sidebar-item-active' : 'sidebar-item'}
          onClick={() => setCurrentScreen('settings')}
        >
          <Settings className="sidebar-button" />
          {!sidebarCollapsed && <span className="sidebar-label">Settings</span>}
        </button>

        <button
          className={currentScreen === 'activity' ? 'sidebar-item sidebar-item-active sidebar-item-border-top' : 'sidebar-item sidebar-item-border-top'}
          onClick={() => setCurrentScreen('activity')}
        >
          <Activity className="sidebar-button" />
          {!sidebarCollapsed && <span className="sidebar-label">Activity</span>}
        </button>
      </nav>
    </aside>
  );
}
```

### src/components/layout/MainContent.tsx

```typescript
import type { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  return (
    <main className="main-content">
      {children}
    </main>
  );
}
```

### src/components/layout/TitleBar.tsx (Updated)

```typescript
import { useDarkMode } from '@/hooks/useDarkMode';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TitleBar() {
  const { theme, toggleTheme } = useDarkMode();

  return (
    <header className="titlebar">
      <div className="titlebar-content">
        <h1 className="titlebar-title">Qwen Proxy Dashboard</h1>
        <div className="titlebar-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="titlebar-button"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### src/components/layout/StatusBar.tsx (Updated)

```typescript
import { useProxyStore } from '@/stores/useProxyStore';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { Activity } from 'lucide-react';

export function StatusBar() {
  const proxyStatus = useProxyStore((state) => state.status);
  const credentials = useCredentialsStore((state) => state.credentials);

  return (
    <footer className="statusbar">
      <div className="statusbar-content">
        <div className="statusbar-item">
          <Activity className="statusbar-icon" />
          <span className="statusbar-text">
            Proxy: {proxyStatus?.status || 'Unknown'}
          </span>
        </div>

        <div className="statusbar-item">
          <span className="statusbar-text">
            Credentials: {credentials?.isExpired ? 'Expired' : credentials ? 'Active' : 'None'}
          </span>
        </div>
      </div>
    </footer>
  );
}
```

### src/components/layout/AppLayout.tsx (Updated)

```typescript
import type { ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <TitleBar />

      <div className="app-layout-body">
        <Sidebar />
        {children}
      </div>

      <StatusBar />
    </div>
  );
}
```

---

## Phase 3: UI Components - shadcn Extensions

### Install shadcn Components

```bash
npx shadcn@latest add badge alert
```

### src/components/ui/status-badge.tsx

```typescript
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'expired' | 'running' | 'stopped';
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'active':
      case 'running':
        return 'default'; // Green
      case 'inactive':
      case 'stopped':
        return 'secondary'; // Gray
      case 'expired':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
  };

  const getLabel = () => {
    if (children) return children;

    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'expired': return 'Expired';
      case 'running': return 'Running';
      case 'stopped': return 'Stopped';
      default: return status;
    }
  };

  return (
    <Badge variant={getVariant()} className="status-badge">
      {getLabel()}
    </Badge>
  );
}
```

### src/components/ui/environment-badge.tsx

```typescript
import { Badge } from '@/components/ui/badge';
import { authService } from '@/services/authService';

export function EnvironmentBadge() {
  const isElectron = authService.isElectron();

  return (
    <Badge
      variant="outline"
      className={isElectron ? 'environment-badge-desktop' : 'environment-badge-browser'}
    >
      <span className="environment-badge-dot" />
      {isElectron ? 'Desktop' : 'Browser'}
    </Badge>
  );
}
```

---

## Phase 4: Feature Components - Alerts

### src/components/features/alerts/StatusAlert.tsx

```typescript
import { useAlertStore } from '@/stores/useAlertStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, X } from 'lucide-react';

export function StatusAlert() {
  const alert = useAlertStore((state) => state.alert);
  const hideAlert = useAlertStore((state) => state.hideAlert);

  if (!alert) return null;

  const isSuccess = alert.type === 'success';
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <Alert variant={isSuccess ? 'default' : 'destructive'} className="status-alert">
      <div className="status-alert-content">
        <div className="status-alert-message">
          <Icon className="status-alert-icon" />
          <AlertDescription>{alert.message}</AlertDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={hideAlert} className="status-alert-close">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
```

---

## Phase 5: Feature Components - Credentials

### src/components/features/credentials/CredentialsDetailCard.tsx

```typescript
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { truncateToken, truncateCookies } from '@/utils/string.utils';
import { formatDate } from '@/utils/formatters';

export function CredentialsDetailCard() {
  const credentials = useCredentialsStore((state) => state.credentials);

  if (!credentials) return null;

  return (
    <Card className="credentials-detail-card">
      <CardHeader>
        <div className="credentials-detail-header">
          <FileText className="credentials-detail-icon" />
          <CardTitle>Credentials Detail</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="credentials-detail-content">
        <div className="credentials-detail-item">
          <span className="credentials-detail-label">Token</span>
          <code className="credentials-detail-value">{truncateToken(credentials.token)}</code>
        </div>

        <div className="credentials-detail-item">
          <span className="credentials-detail-label">Cookies</span>
          <code className="credentials-detail-value">{truncateCookies(credentials.cookies)}</code>
        </div>

        <div className="credentials-detail-item">
          <span className="credentials-detail-label">Expires At</span>
          <span className="credentials-detail-value">
            {credentials.expiresAt ? formatDate(new Date(credentials.expiresAt)) : 'Never'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 6: Feature Components - Stats, Providers, Models

### src/components/features/stats/SystemStatsCard.tsx

```typescript
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Activity } from 'lucide-react';

export function SystemStatsCard() {
  const credentials = useCredentialsStore((state) => state.credentials);
  const status = useProxyStore((state) => state.status);

  const credentialStatus = credentials?.isExpired
    ? 'expired'
    : credentials
    ? 'active'
    : 'inactive';

  const proxyStatus = status?.status === 'running'
    ? 'running'
    : 'stopped';

  const providersEnabled = status?.providers.enabled || 0;
  const providersTotal = status?.providers.total || 0;
  const modelsTotal = status?.models.total || 0;

  return (
    <Card className="system-stats-card">
      <CardHeader>
        <div className="system-stats-header">
          <Activity className="system-stats-icon" />
          <CardTitle>System Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="system-stats-grid">
          {/* Credentials */}
          <div className="system-stats-item">
            <span className="system-stats-label">Credentials</span>
            <StatusBadge status={credentialStatus} />
          </div>

          {/* Proxy */}
          <div className="system-stats-item">
            <span className="system-stats-label">Proxy</span>
            <StatusBadge status={proxyStatus} />
          </div>

          {/* Providers */}
          <div className="system-stats-item">
            <span className="system-stats-label">Providers</span>
            <span className="system-stats-value">{providersEnabled} / {providersTotal}</span>
          </div>

          {/* Models */}
          <div className="system-stats-item">
            <span className="system-stats-label">Models</span>
            <span className="system-stats-value">{modelsTotal}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### src/components/features/stats/ConnectionGuideCard.tsx

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function ConnectionGuideCard() {
  return (
    <Card className="connection-guide-card">
      <CardHeader>
        <div className="connection-guide-header">
          <BookOpen className="connection-guide-icon" />
          <CardTitle>Quick Guide</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="connection-guide-list">
          <li className="connection-guide-step">
            <span className="connection-guide-number">1</span>
            <div className="connection-guide-content">
              <strong>Connect to Qwen</strong>
              <p className="connection-guide-description">
                Authenticate using the browser extension or manual credentials
              </p>
            </div>
          </li>

          <li className="connection-guide-step">
            <span className="connection-guide-number">2</span>
            <div className="connection-guide-content">
              <strong>Start Proxy</strong>
              <p className="connection-guide-description">
                Launch the proxy server to enable request routing
              </p>
            </div>
          </li>

          <li className="connection-guide-step">
            <span className="connection-guide-number">3</span>
            <div className="connection-guide-content">
              <strong>Configure Providers</strong>
              <p className="connection-guide-description">
                Point your AI applications to the proxy endpoint
              </p>
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
```

### src/components/features/providers/ProvidersListCard.tsx

```typescript
import { useProxyStore } from '@/stores/useProxyStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Server } from 'lucide-react';

export function ProvidersListCard() {
  const status = useProxyStore((state) => state.status);

  const providers = status?.providers.items || [];
  const enabledProviders = providers.filter(p => p.enabled);
  const enabledCount = status?.providers.enabled || 0;
  const totalCount = status?.providers.total || 0;

  return (
    <Card className="providers-list-card">
      <CardHeader>
        <div className="providers-list-header">
          <Server className="providers-list-icon" />
          <CardTitle>Providers ({enabledCount} / {totalCount})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {enabledProviders.length === 0 ? (
          <p className="providers-list-empty">No providers enabled</p>
        ) : (
          <div className="providers-list">
            {enabledProviders.map(provider => (
              <div key={provider.id} className="provider-item">
                <StatusBadge status="active" />
                <div className="provider-info">
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-url">{provider.baseUrl}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### src/components/features/models/ModelsListCard.tsx

```typescript
import { useProxyStore } from '@/stores/useProxyStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layers } from 'lucide-react';

export function ModelsListCard() {
  const status = useProxyStore((state) => state.status);

  const models = status?.models.items || [];
  const totalCount = status?.models.total || 0;

  return (
    <Card className="models-list-card">
      <CardHeader>
        <div className="models-list-header">
          <Layers className="models-list-icon" />
          <CardTitle>Models ({totalCount})</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <p className="models-list-empty">No models available</p>
        ) : (
          <div className="models-list">
            {models.map(model => (
              <div key={model.id} className="model-item">
                <div className="model-name">{model.name}</div>
                <div className="model-provider">Provider: {model.providerId}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 7: Feature Components - Authentication

### src/components/features/authentication/AuthenticationCard.tsx

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { authService } from '@/services/authService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Lock, Info } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export function AuthenticationCard() {
  const credentials = useCredentialsStore((state) => state.credentials);
  const loading = useCredentialsStore((state) => state.loading);
  const { handleConnect, handleRevoke } = useAuth();

  const hasCredentials = !!credentials;
  const isElectron = authService.isElectron();

  const getStatus = () => {
    if (!credentials) return 'inactive';
    if (credentials.isExpired) return 'expired';
    return 'active';
  };

  return (
    <Card className="authentication-card">
      <CardHeader>
        <div className="authentication-header">
          <Lock className="authentication-icon" />
          <CardTitle>Authentication</CardTitle>
          <StatusBadge status={getStatus()} />
        </div>
      </CardHeader>
      <CardContent className="authentication-content">
        {/* Expiration display */}
        {credentials?.expiresAt && (
          <div className="authentication-expiration">
            <span className="authentication-label">Expires:</span>
            <span className="authentication-value">
              {formatDate(new Date(credentials.expiresAt))}
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="authentication-actions">
          <Button onClick={handleConnect} disabled={loading} className="authentication-button">
            {loading ? 'Connecting...' : hasCredentials ? 'Re-authenticate' : 'Connect to Qwen'}
          </Button>

          {hasCredentials && (
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={loading}
              className="authentication-button"
            >
              Revoke
            </Button>
          )}
        </div>

        {/* Inline footer instructions */}
        <div className="authentication-footer">
          <Info className="authentication-footer-icon" />
          <p className="authentication-footer-text">
            {isElectron
              ? 'Click "Connect to Qwen" to authenticate using the browser extension.'
              : 'Install the Chrome extension and authenticate through the browser.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 8: Feature Components - Proxy

### src/components/features/proxy/ProxyControlCard.tsx

```typescript
import { useProxyControl } from '@/hooks/useProxyControl';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Server, Copy } from 'lucide-react';
import { formatDuration } from '@/utils/formatters';

export function ProxyControlCard() {
  const status = useProxyStore((state) => state.status);
  const loading = useProxyStore((state) => state.loading);
  const showAlert = useAlertStore((state) => state.showAlert);
  const { handleStart, handleStop } = useProxyControl();

  // Start status polling
  useProxyStatus();

  const isRunning = status?.status === 'running';
  const port = status?.qwenProxy.port || 3000;
  const uptime = status?.qwenProxy.uptime || 0;

  const handleCopy = () => {
    const url = `http://localhost:${port}`;
    navigator.clipboard.writeText(url);
    showAlert('Endpoint URL copied to clipboard', 'success');
  };

  return (
    <Card className="proxy-control-card">
      <CardHeader>
        <div className="proxy-control-header">
          <Server className="proxy-control-icon" />
          <CardTitle>Proxy Server</CardTitle>
          <StatusBadge status={isRunning ? 'running' : 'stopped'} />
        </div>
      </CardHeader>
      <CardContent className="proxy-control-content">
        {/* Inline proxy info grid */}
        <div className="proxy-info-grid">
          <div className="proxy-info-item">
            <span className="proxy-info-label">Port</span>
            <span className="proxy-info-value">{port}</span>
          </div>

          <div className="proxy-info-item">
            <span className="proxy-info-label">Status</span>
            <span className="proxy-info-value">{status?.status || 'Unknown'}</span>
          </div>

          {isRunning && (
            <div className="proxy-info-item">
              <span className="proxy-info-label">Uptime</span>
              <span className="proxy-info-value">{formatDuration(uptime)}</span>
            </div>
          )}
        </div>

        {/* Inline control buttons */}
        <div className="proxy-control-actions">
          <Button
            onClick={handleStart}
            disabled={isRunning || loading}
            className="proxy-control-button"
          >
            Start Proxy
          </Button>
          <Button
            variant="destructive"
            onClick={handleStop}
            disabled={!isRunning || loading}
            className="proxy-control-button"
          >
            Stop Proxy
          </Button>
        </div>

        {/* Inline endpoint URL (conditional) */}
        {isRunning && (
          <div className="proxy-endpoint">
            <div className="proxy-endpoint-header">
              <span className="proxy-endpoint-label">Endpoint URL</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="proxy-endpoint-copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <code className="proxy-endpoint-url">
              http://localhost:{port}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 9: Pages - Dashboard

### src/pages/HomePage.tsx

```typescript
import { useCredentialPolling } from '@/hooks/useCredentialPolling';
import { StatusAlert } from '@/components/features/alerts/StatusAlert';
import { AuthenticationCard } from '@/components/features/authentication/AuthenticationCard';
import { ProxyControlCard } from '@/components/features/proxy/ProxyControlCard';
import { CredentialsDetailCard } from '@/components/features/credentials/CredentialsDetailCard';
import { ProvidersListCard } from '@/components/features/providers/ProvidersListCard';
import { ModelsListCard } from '@/components/features/models/ModelsListCard';
import { SystemStatsCard } from '@/components/features/stats/SystemStatsCard';
import { ConnectionGuideCard } from '@/components/features/stats/ConnectionGuideCard';
import { EnvironmentBadge } from '@/components/ui/environment-badge';

export function HomePage() {
  // Start credential polling
  useCredentialPolling();

  return (
    <div className="homepage">
      <StatusAlert />

      <div className="homepage-header">
        <h1 className="homepage-title">Qwen Proxy Dashboard</h1>
        <EnvironmentBadge />
      </div>

      <div className="homepage-grid">
        {/* Main column (2/3 width) */}
        <div className="homepage-main">
          <AuthenticationCard />
          <ProxyControlCard />
          <CredentialsDetailCard />

          {/* Providers and Models (2-column grid) */}
          <div className="homepage-providers-models">
            <ProvidersListCard />
            <ModelsListCard />
          </div>
        </div>

        {/* Sidebar column (1/3 width) */}
        <div className="homepage-sidebar">
          <SystemStatsCard />
          <ConnectionGuideCard />
        </div>
      </div>
    </div>
  );
}
```

### src/App.tsx (Updated)

```typescript
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';

export function App() {
  return (
    <AppLayout>
      <HomePage />
    </AppLayout>
  );
}
```

---

## Phase 10: Public Assets

### public/extension-install.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Qwen Proxy Chrome Extension - Installation Guide</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 0.5rem;
    }
    h2 {
      color: #1e40af;
      margin-top: 2rem;
    }
    h3 {
      color: #1e3a8a;
      margin-top: 1.5rem;
    }
    ul, ol {
      margin-left: 1.5rem;
    }
    li {
      margin: 0.5rem 0;
    }
    code {
      background-color: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
    }
    .note {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 1rem;
      margin: 1rem 0;
    }
    .back-link {
      display: inline-block;
      margin-top: 2rem;
      color: #2563eb;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <h1>Qwen Proxy Chrome Extension</h1>
  <h2>Installation Guide</h2>

  <section>
    <h3>Prerequisites</h3>
    <ul>
      <li>Google Chrome browser (version 88 or later)</li>
      <li>Qwen Proxy application running on your machine</li>
      <li>Basic familiarity with Chrome extensions</li>
    </ul>
  </section>

  <section>
    <h3>Installation Steps</h3>
    <ol>
      <li>
        <strong>Download the Extension</strong>
        <p>Download the extension files to a local directory on your computer.</p>
      </li>

      <li>
        <strong>Open Chrome Extensions Page</strong>
        <p>Navigate to <code>chrome://extensions/</code> in your Chrome browser, or:</p>
        <ul>
          <li>Click the three-dot menu in the top-right corner</li>
          <li>Select "Extensions" → "Manage Extensions"</li>
        </ul>
      </li>

      <li>
        <strong>Enable Developer Mode</strong>
        <p>Toggle the "Developer mode" switch in the top-right corner of the extensions page.</p>
      </li>

      <li>
        <strong>Load Unpacked Extension</strong>
        <p>Click the "Load unpacked" button and select the directory containing the extension files.</p>
      </li>

      <li>
        <strong>Grant Permissions</strong>
        <p>Review and accept the permissions requested by the extension:</p>
        <ul>
          <li>Access to Qwen website cookies</li>
          <li>Communication with local Qwen Proxy application</li>
        </ul>
      </li>

      <li>
        <strong>Pin the Extension (Optional)</strong>
        <p>Click the extensions icon (puzzle piece) in the toolbar and pin the Qwen Proxy extension for easy access.</p>
      </li>
    </ol>
  </section>

  <section>
    <h3>Verification</h3>
    <p>To verify the extension is installed correctly:</p>
    <ol>
      <li>Check that the Qwen Proxy icon appears in your Chrome toolbar</li>
      <li>Click the icon to open the extension popup</li>
      <li>Verify it shows "Connected" status when the Qwen Proxy application is running</li>
      <li>Try authenticating from the Qwen Proxy Dashboard application</li>
    </ol>
  </section>

  <section>
    <h3>Troubleshooting</h3>

    <h4>Extension Not Appearing</h4>
    <ul>
      <li>Verify Developer mode is enabled</li>
      <li>Check that you selected the correct directory (should contain <code>manifest.json</code>)</li>
      <li>Refresh the extensions page and try loading again</li>
    </ul>

    <h4>Permissions Denied</h4>
    <ul>
      <li>Uninstall and reinstall the extension</li>
      <li>Ensure you accept all requested permissions</li>
      <li>Check Chrome's site settings for blocked permissions</li>
    </ul>

    <h4>Connection Issues</h4>
    <ul>
      <li>Verify the Qwen Proxy application is running</li>
      <li>Check that the proxy server is started in the dashboard</li>
      <li>Ensure no firewall is blocking localhost connections</li>
    </ul>

    <div class="note">
      <strong>Note:</strong> If you encounter persistent issues, check the browser console (F12) for error messages and refer to the main documentation.
    </div>
  </section>

  <section>
    <h3>Usage</h3>
    <p>Once installed, the extension works automatically:</p>
    <ol>
      <li>Open the Qwen Proxy Dashboard application</li>
      <li>Click "Connect to Qwen" in the Authentication card</li>
      <li>The extension will capture your Qwen credentials automatically</li>
      <li>Credentials will be sent to the proxy application securely</li>
    </ol>
  </section>

  <a href="/" class="back-link">← Back to Dashboard</a>
</body>
</html>
```

---

## CSS Architecture

**CRITICAL**: All styling must be defined in `src/index.css` using custom CSS classes with the `@apply` directive.

### CSS Class Naming Pattern

Follow the pattern: `.component-element-modifier`

Examples:
- `.sidebar-item`, `.sidebar-item-active`, `.sidebar-item-border-top`
- `.feature-card`, `.feature-card-active`, `.feature-card-title`
- `.header-container`, `.header-title`, `.header-actions`

### Required CSS Classes (Define in index.css)

#### Layout Components

```css
/* Sidebar */
.sidebar { @apply bg-background border-border transition-all; }
.sidebar-collapsed { @apply w-12; }
.sidebar-expanded { @apply w-56; }
.sidebar-item { @apply hover:bg-accent text-foreground cursor-pointer; }
.sidebar-item-active { @apply bg-accent text-primary border-primary; }
.sidebar-item-border-top { @apply border-t border-border; }
.sidebar-button { @apply h-5 w-5; }
.sidebar-label { @apply text-sm; }

/* MainContent */
.main-content { @apply flex-1 overflow-auto; }

/* TitleBar */
.titlebar { @apply h-12 border-b border-border bg-background; }
.titlebar-content { @apply flex items-center justify-between h-full px-4; }
.titlebar-title { @apply text-lg font-semibold text-foreground; }
.titlebar-actions { @apply flex items-center gap-2; }
.titlebar-button { @apply h-8 w-8; }

/* StatusBar */
.statusbar { @apply h-6 border-t border-border bg-muted/30; }
.statusbar-content { @apply flex items-center justify-between h-full px-4; }
.statusbar-item { @apply flex items-center gap-2; }
.statusbar-icon { @apply h-4 w-4 text-muted-foreground; }
.statusbar-text { @apply text-xs text-muted-foreground; }

/* AppLayout */
.app-layout { @apply h-screen flex flex-col; }
.app-layout-body { @apply flex flex-1 overflow-hidden; }
```

#### Feature Components

```css
/* StatusAlert */
.status-alert { @apply mb-6; }
.status-alert-content { @apply flex items-center justify-between; }
.status-alert-message { @apply flex items-center gap-3; }
.status-alert-icon { @apply h-5 w-5; }
.status-alert-close { @apply h-8 w-8; }

/* CredentialsDetailCard */
.credentials-detail-card { /* Base card styles */ }
.credentials-detail-header { @apply flex items-center gap-3; }
.credentials-detail-icon { @apply h-5 w-5 text-primary; }
.credentials-detail-content { @apply space-y-4; }
.credentials-detail-item { @apply flex flex-col gap-1; }
.credentials-detail-label { @apply text-xs font-medium text-muted-foreground; }
.credentials-detail-value { @apply text-sm font-mono bg-muted p-2 rounded; }

/* SystemStatsCard */
.system-stats-card { /* Base card styles */ }
.system-stats-header { @apply flex items-center gap-3; }
.system-stats-icon { @apply h-5 w-5 text-primary; }
.system-stats-grid { @apply grid grid-cols-2 gap-4; }
.system-stats-item { @apply flex flex-col gap-2; }
.system-stats-label { @apply text-xs font-medium text-muted-foreground; }
.system-stats-value { @apply text-sm font-semibold text-foreground; }

/* ConnectionGuideCard */
.connection-guide-card { /* Base card styles */ }
.connection-guide-header { @apply flex items-center gap-3; }
.connection-guide-icon { @apply h-5 w-5 text-primary; }
.connection-guide-list { @apply space-y-3; }
.connection-guide-step { @apply flex items-start gap-3; }
.connection-guide-number { @apply flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold; }
.connection-guide-content { @apply flex-1; }
.connection-guide-description { @apply text-sm text-muted-foreground; }

/* ProvidersListCard */
.providers-list-card { /* Base card styles */ }
.providers-list-header { @apply flex items-center gap-3; }
.providers-list-icon { @apply h-5 w-5 text-primary; }
.providers-list { @apply space-y-3; }
.providers-list-empty { @apply text-sm text-muted-foreground text-center py-4; }
.provider-item { @apply flex items-center gap-3 p-3 rounded-lg border border-border; }
.provider-info { @apply flex-1; }
.provider-name { @apply font-medium text-foreground; }
.provider-url { @apply text-sm text-muted-foreground; }

/* ModelsListCard */
.models-list-card { /* Base card styles */ }
.models-list-header { @apply flex items-center gap-3; }
.models-list-icon { @apply h-5 w-5 text-primary; }
.models-list { @apply space-y-2; }
.models-list-empty { @apply text-sm text-muted-foreground text-center py-4; }
.model-item { @apply p-3 rounded-lg border border-border; }
.model-name { @apply font-medium text-foreground; }
.model-provider { @apply text-sm text-muted-foreground; }

/* AuthenticationCard */
.authentication-card { /* Base card styles */ }
.authentication-header { @apply flex items-center gap-3; }
.authentication-icon { @apply h-5 w-5 text-primary; }
.authentication-content { @apply space-y-4; }
.authentication-expiration { @apply flex items-center justify-between; }
.authentication-label { @apply text-xs font-medium text-muted-foreground; }
.authentication-value { @apply text-sm text-foreground; }
.authentication-actions { @apply flex gap-2; }
.authentication-button { /* Inherits from Button component */ }
.authentication-footer { @apply flex items-start gap-2 p-3 bg-muted/50 rounded-lg; }
.authentication-footer-icon { @apply h-4 w-4 shrink-0 mt-0.5 text-muted-foreground; }
.authentication-footer-text { @apply text-sm text-muted-foreground; }

/* ProxyControlCard */
.proxy-control-card { /* Base card styles */ }
.proxy-control-header { @apply flex items-center gap-3; }
.proxy-control-icon { @apply h-5 w-5 text-primary; }
.proxy-control-content { @apply space-y-4; }
.proxy-info-grid { @apply grid grid-cols-2 gap-4; }
.proxy-info-item { @apply flex flex-col gap-1; }
.proxy-info-label { @apply text-xs font-medium text-muted-foreground; }
.proxy-info-value { @apply text-sm font-semibold text-foreground; }
.proxy-control-actions { @apply flex gap-2; }
.proxy-control-button { /* Inherits from Button component */ }
.proxy-endpoint { @apply p-3 bg-muted/50 rounded-lg space-y-2; }
.proxy-endpoint-header { @apply flex items-center justify-between; }
.proxy-endpoint-label { @apply text-xs font-medium text-muted-foreground; }
.proxy-endpoint-copy { @apply h-8 w-8; }
.proxy-endpoint-url { @apply block px-2 py-1 bg-background border border-border rounded text-sm font-mono; }
```

#### Pages

```css
/* HomePage */
.homepage { @apply p-8; }
.homepage-header { @apply mb-6 flex items-center gap-3; }
.homepage-title { @apply text-4xl font-bold text-foreground; }
.homepage-grid { @apply grid grid-cols-1 lg:grid-cols-3 gap-6; }
.homepage-main { @apply lg:col-span-2 space-y-6; }
.homepage-sidebar { @apply lg:col-span-1 space-y-6; }
.homepage-providers-models { @apply grid grid-cols-1 md:grid-cols-2 gap-6; }
```

#### UI Components

```css
/* StatusBadge */
.status-badge { /* Inherits from Badge component */ }

/* EnvironmentBadge */
.environment-badge-desktop { @apply border-purple-300 text-purple-700; }
.environment-badge-browser { @apply border-blue-300 text-blue-700; }
.environment-badge-dot { @apply inline-block h-2 w-2 rounded-full bg-current mr-2 animate-pulse; }
```

### Theme Variables

All colors must use theme variables (NO hardcoded colors):

```css
/* Example theme variable usage */
.my-component {
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));
  border-color: hsl(var(--border));
}

/* Common theme variables */
--background        /* Page background */
--foreground        /* Primary text */
--muted            /* Muted backgrounds */
--muted-foreground /* Muted text */
--accent           /* Accent backgrounds */
--primary          /* Primary brand color */
--primary-foreground /* Primary text on brand color */
--destructive      /* Error/danger color */
--border           /* Border color */
```

---

## Store Access Pattern

**CORRECT - Selective subscription:**

```typescript
const theme = useUIStore((state) => state.uiState.theme);
const setTheme = useUIStore((state) => state.setTheme);
```

**WRONG - Full store subscription:**

```typescript
const store = useUIStore();
const theme = store.uiState.theme;
```

---

## Import Path Alias

**CORRECT:**

```typescript
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/ui/button';
```

**WRONG:**

```typescript
import { useUIStore } from '../../stores/useUIStore';
import { Button } from '../ui/button';
```

---

## Named Exports

**CORRECT:**

```typescript
export function MyComponent() {
  // Component implementation
}
```

**WRONG:**

```typescript
export default function MyComponent() {
  // Component implementation
}
```

---

## Notes

### Key Requirements

1. **NO inline Tailwind classes** - All styling in index.css
2. **ONLY theme variables for colors** - Automatic dark mode support
3. **Zustand for ALL state** - No prop drilling, no Context API (except for existing ThemeContext)
4. **Custom CSS class naming** - Follow `.component-element-modifier` pattern
5. **Business logic in hooks/services** - Keep components presentational
6. **Selective Zustand subscriptions** - For performance optimization
7. **Named exports** - For better tree-shaking and consistency
8. **`@/` path alias** - For cleaner imports

### Component Size Guidelines

- Feature components: Target <100 lines
- Consolidated components: ~80-100 lines (AuthenticationCard, ProxyControlCard)
- Simple components: <30 lines (StatusAlert, EnvironmentBadge)

### Architecture Principles

- **Single Responsibility Principle** - One component, one purpose
- **DRY (Don't Repeat Yourself)** - Extract common logic to hooks/services
- **Domain-Driven Design** - Organize by feature domains
- **Separation of Concerns** - UI in components, logic in hooks/services

---

**Last Updated**: November 6, 2025
**Status**: Complete code reference for all phases
**Reference**: [62-FRONTEND_V2_IMPLEMENTATION_PLAN.md](./62-FRONTEND_V2_IMPLEMENTATION_PLAN.md)
