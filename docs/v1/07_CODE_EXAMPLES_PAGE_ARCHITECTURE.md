# Code Examples: Page Architecture & Component Dependencies

**Reference Implementation:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/`

**Purpose:** Complete examples for page architecture following Doc 70-PAGE_ARCHITECTURE_GUIDE.md with TabCard, ActionList, and page hooks pattern.

---

## Table of Contents

1. [Page Architecture Overview](#page-architecture-overview)
2. [Complete HomePage Example](#complete-homepage-example)
3. [Page Hooks Pattern](#page-hooks-pattern)
4. [Constants & Builders](#constants--builders)
5. [UI Components](#ui-components)
6. [Component Dependencies](#component-dependencies)

---

## Page Architecture Overview

### Three-Layer Architecture (Per Doc 70)

```
┌─────────────────────────────────────────────────────┐
│  Page Component (Presentation Layer)                │
│  - Renders TabCard with tabs                        │
│  - Renders ActionList with items                    │
│  - Uses hook for all logic                          │
│  - < 50 lines of JSX                                │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Page Hook (Logic Layer)                            │
│  - State management                                 │
│  - API calls                                        │
│  - Event handlers                                   │
│  - Lifecycle management                             │
│  - Returns data + handlers                          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Constants File (Configuration Layer)               │
│  - Builder functions for tabs/actions               │
│  - Helper functions                                 │
│  - Static configuration                             │
│  - No React hooks                                   │
└─────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Pages are thin**: < 50 lines, presentation only
- **Hooks contain logic**: State, effects, handlers
- **Constants are pure**: Builder functions, helpers, config
- **TabCard for organization**: Tabs with conditional visibility
- **ActionList for actions**: Clickable items with icons

---

## Complete HomePage Example

### 1. Page Component

**Location:** `frontend/src/pages/HomePage.tsx`

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { ActionList } from '@/components/ui/action-list';
import { useHomePage } from '@/hooks/useHomePage';
import { buildHomeTabs, buildHomeActions } from '@/constants/home.constants';

/**
 * Home Page - System Overview and Quick Actions
 *
 * Architecture:
 * - Thin presentation layer (< 50 lines)
 * - All logic in useHomePage hook
 * - All UI builders in home.constants
 * - TabCard for organizing content
 * - ActionList for quick actions
 */
export function HomePage() {
  const {
    // Data
    proxyStatus,
    credentials,
    extensionDetected,
    needsExtension,
    isElectron,

    // Actions
    handleStartProxy,
    handleStopProxy,
    handleLogin,
    handleOpenBrowserGuide,
    handleOpenDesktopGuide,
  } = useHomePage();

  // Build tabs using data from hook
  const tabs = buildHomeTabs({
    proxyStatus,
    credentials,
    extensionDetected,
    needsExtension,
    isElectron,
  });

  // Build action items using handlers from hook
  const actions = buildHomeActions({
    proxyStatus,
    credentials,
    extensionDetected,
    needsExtension,
    isElectron,
    handleStartProxy,
    handleStopProxy,
    handleLogin,
    handleOpenBrowserGuide,
    handleOpenDesktopGuide,
  });

  return (
    <div className="page-container">
      <TabCard tabs={tabs} />
      <ActionList title="Quick Actions" actions={actions} />
    </div>
  );
}
```

**Total Lines:** 60 (including imports and whitespace)

**What This Shows:**
- Thin presentation layer (just renders components)
- All logic delegated to `useHomePage` hook
- All UI construction delegated to builder functions
- Clean, readable, maintainable

---

### 2. Page Hook

**Location:** `frontend/src/hooks/useHomePage.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProxyStore } from '@/stores/useProxyStore';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { proxyService } from '@/services/proxy.service';
import { credentialsService } from '@/services/credentials.service';
import { isElectron } from '@/utils/platform';
import { toast } from '@/hooks/useToast';

/**
 * Home Page Hook
 *
 * Handles all logic for the Home page:
 * - Proxy control (start/stop)
 * - Login flow (platform-aware)
 * - Extension detection
 * - Optimistic UI updates
 * - Error handling
 */
export function useHomePage() {
  const navigate = useNavigate();

  // Store state
  const proxyStatus = useProxyStore((state) => state.status);
  const credentials = useCredentialsStore((state) => state.credentials);
  const lifecycleState = useLifecycleStore((state) => state.state);

  // Extension detection (WebSocket-based, no polling)
  const { needsExtension, extensionDetected } = useExtensionDetection();

  // Platform detection
  const isElectronApp = isElectron();

  // Local loading states
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  /**
   * Start Proxy with optimistic UI update
   */
  const handleStartProxy = useCallback(async () => {
    if (isStarting || lifecycleState === 'starting') return;

    setIsStarting(true);

    // Optimistic update - instant UI feedback
    useLifecycleStore.getState().setState('starting', 'Starting :3001');

    try {
      await proxyService.startProxy();

      // Success toast
      toast({
        title: 'Proxy Started',
        description: 'Provider router is now running',
      });

      // WebSocket lifecycle:update event will update to 'running'

    } catch (error) {
      console.error('[HomePage] Failed to start proxy:', error);

      // Rollback optimistic update on error
      useLifecycleStore.getState().setError('Failed to start proxy');

      toast({
        title: 'Start Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, lifecycleState]);

  /**
   * Stop Proxy with optimistic UI update
   */
  const handleStopProxy = useCallback(async () => {
    if (isStopping || lifecycleState === 'stopping') return;

    setIsStopping(true);

    // Optimistic update - instant UI feedback
    useLifecycleStore.getState().setState('stopping', 'Stopping');

    try {
      await proxyService.stopProxy();

      toast({
        title: 'Proxy Stopped',
        description: 'Provider router has been stopped',
      });

      // WebSocket lifecycle:update event will update to 'stopped'

    } catch (error) {
      console.error('[HomePage] Failed to stop proxy:', error);

      // Rollback optimistic update on error
      useLifecycleStore.getState().setError('Failed to stop proxy');

      toast({
        title: 'Stop Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsStopping(false);
    }
  }, [isStopping, lifecycleState]);

  /**
   * Login - Platform-aware
   * - Electron: Opens Qwen login window, extracts credentials
   * - Browser: Navigates to browser guide for extension setup
   */
  const handleLogin = useCallback(async () => {
    if (isElectronApp) {
      // Electron: Open Qwen login window
      try {
        await credentialsService.openQwenLoginWindow();

        toast({
          title: 'Login Window Opened',
          description: 'Sign in to Qwen to extract credentials',
        });
      } catch (error) {
        console.error('[HomePage] Failed to open login window:', error);

        toast({
          title: 'Login Failed',
          description: error instanceof Error ? error.message : 'Failed to open login window',
          variant: 'destructive',
        });
      }
    } else {
      // Browser: Navigate to guide
      navigate('/browser-guide');
    }
  }, [isElectronApp, navigate]);

  /**
   * Navigate to browser guide
   */
  const handleOpenBrowserGuide = useCallback(() => {
    navigate('/browser-guide');
  }, [navigate]);

  /**
   * Navigate to desktop guide
   */
  const handleOpenDesktopGuide = useCallback(() => {
    navigate('/desktop-guide');
  }, [navigate]);

  return {
    // Data
    proxyStatus,
    credentials,
    extensionDetected,
    needsExtension,
    isElectron: isElectronApp,
    lifecycleState,
    isStarting,
    isStopping,

    // Actions
    handleStartProxy,
    handleStopProxy,
    handleLogin,
    handleOpenBrowserGuide,
    handleOpenDesktopGuide,
  };
}
```

**Key Features:**
- All business logic centralized
- Optimistic UI updates for instant feedback
- Platform-aware login flow
- WebSocket-based extension detection
- Error handling with rollback
- Toast notifications for user feedback

---

### 3. Constants & Builders

**Location:** `frontend/src/constants/home.constants.tsx`

```typescript
import type { TabDefinition } from '@/components/ui/tab-card';
import type { ActionItem } from '@/components/ui/action-list';
import { StatusBadge } from '@/components/ui/status-badge';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { Play, Square, LogIn, Chrome, Laptop } from 'lucide-react';

/**
 * Build tabs for HomePage TabCard
 * Pure function - no hooks, no side effects
 */
export function buildHomeTabs(data: {
  proxyStatus: any;
  credentials: any;
  extensionDetected: boolean;
  needsExtension: boolean;
  isElectron: boolean;
}): TabDefinition[] {
  const {
    proxyStatus,
    credentials,
    extensionDetected,
    needsExtension,
    isElectron,
  } = data;

  // Determine statuses
  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const isAuthenticated = credentials?.valid || false;

  return [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Environment</span>
                <EnvironmentBadge />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Proxy Status</span>
                <StatusBadge status={isProxyRunning ? 'running' : 'stopped'}>
                  {isProxyRunning ? 'Running' : 'Stopped'}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Authentication</span>
                <StatusBadge status={isAuthenticated ? 'active' : 'inactive'}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </StatusBadge>
              </div>
              {needsExtension && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Extension</span>
                  <StatusBadge status={extensionDetected ? 'active' : 'inactive'}>
                    {extensionDetected ? 'Detected' : 'Not Detected'}
                  </StatusBadge>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'details',
      label: 'Details',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Proxy Details</h3>
            {isProxyRunning && proxyStatus?.providerRouter ? (
              <div className="space-y-1 text-sm">
                <div>Port: {proxyStatus.providerRouter.port || 'N/A'}</div>
                <div>Uptime: {formatUptime(proxyStatus.providerRouter.uptime)}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Proxy is not running</p>
            )}
          </div>

          {isAuthenticated && credentials && (
            <div>
              <h3 className="text-sm font-medium mb-2">Credentials</h3>
              <div className="space-y-1 text-sm">
                <div>Status: Valid</div>
                {credentials.expiresAt && (
                  <div>Expires: {new Date(credentials.expiresAt * 1000).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];
}

/**
 * Build action items for HomePage ActionList
 * Pure function - receives handlers from hook
 */
export function buildHomeActions(data: {
  proxyStatus: any;
  credentials: any;
  extensionDetected: boolean;
  needsExtension: boolean;
  isElectron: boolean;
  handleStartProxy: () => void;
  handleStopProxy: () => void;
  handleLogin: () => void;
  handleOpenBrowserGuide: () => void;
  handleOpenDesktopGuide: () => void;
}): ActionItem[] {
  const {
    proxyStatus,
    credentials,
    extensionDetected,
    needsExtension,
    isElectron,
    handleStartProxy,
    handleStopProxy,
    handleLogin,
    handleOpenBrowserGuide,
    handleOpenDesktopGuide,
  } = data;

  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const isAuthenticated = credentials?.valid || false;

  return [
    // Proxy Control
    {
      icon: isProxyRunning ? Square : Play,
      title: isProxyRunning ? 'Stop Proxy' : 'Start Proxy',
      description: isProxyRunning
        ? 'Stop the provider router proxy'
        : 'Start the provider router proxy',
      onClick: isProxyRunning ? handleStopProxy : handleStartProxy,
      disabled: false,
      hidden: false,
    },

    // Login
    {
      icon: LogIn,
      title: 'Authenticate',
      description: isElectron
        ? 'Open Qwen login window to extract credentials'
        : 'Open browser guide to set up extension',
      onClick: handleLogin,
      disabled: isAuthenticated,
      hidden: false,
    },

    // Browser Guide (browser mode only)
    {
      icon: Chrome,
      title: 'Browser Setup Guide',
      description: 'Learn how to set up the Chrome extension',
      onClick: handleOpenBrowserGuide,
      disabled: false,
      hidden: isElectron, // Only show in browser mode
    },

    // Desktop Guide (Electron mode only)
    {
      icon: Laptop,
      title: 'Desktop App Guide',
      description: 'Learn how to use the desktop application',
      onClick: handleOpenDesktopGuide,
      disabled: false,
      hidden: !isElectron, // Only show in Electron mode
    },
  ];
}

/**
 * Helper: Format uptime in human-readable form
 */
function formatUptime(seconds?: number): string {
  if (!seconds) return 'N/A';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
```

**Key Features:**
- Pure functions (no hooks, no side effects)
- Builder pattern for tabs and actions
- Conditional visibility (hidden property)
- Helper functions for formatting
- Type-safe with TypeScript

---

## UI Components

### TabCard Component

**Location:** `frontend/src/components/ui/tab-card.tsx`

```typescript
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TabDefinition {
  id: string;
  label: string;
  content: React.ReactNode;
  hidden?: boolean;
}

interface TabCardProps {
  title?: string;
  tabs: TabDefinition[];
  defaultTab?: string;
}

export function TabCard({ title, tabs, defaultTab }: TabCardProps) {
  const visibleTabs = tabs.filter((tab) => !tab.hidden);
  const [activeTab, setActiveTab] = useState(defaultTab || visibleTabs[0]?.id || '');

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {visibleTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

**Features:**
- Conditional tab visibility (hidden property)
- Automatic grid layout based on visible tabs
- Default tab selection
- Type-safe tab definitions

---

### ActionList Component

**Location:** `frontend/src/components/ui/action-list.tsx`

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export interface ActionItem {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionListProps {
  title?: string;
  icon?: LucideIcon;
  actions: ActionItem[];
}

export function ActionList({ title, icon: Icon, actions }: ActionListProps) {
  const visibleActions = actions.filter((action) => !action.hidden);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          {visibleActions.map((action, index) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className="w-full flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <ActionIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Features:**
- Conditional action visibility (hidden property)
- Disabled state support
- Icon + title + description layout
- Hover states and transitions

---

## Component Dependencies

### HomePage Dependencies

```
HomePage.tsx
├── TabCard (UI component)
├── ActionList (UI component)
├── useHomePage (page hook)
│   ├── useProxyStore (Zustand store)
│   ├── useCredentialsStore (Zustand store)
│   ├── useLifecycleStore (Zustand store)
│   ├── useExtensionDetection (hook)
│   │   ├── useProxyStore (Zustand store)
│   │   └── isElectron (platform utility)
│   ├── proxyService (service)
│   ├── credentialsService (service)
│   ├── isElectron (platform utility)
│   └── toast (UI notification)
└── home.constants (builders)
    ├── StatusBadge (UI component)
    ├── EnvironmentBadge (UI component)
    └── Icons (lucide-react)
```

### Store Dependencies

All stores depend on:
- Zustand (`create` function)
- Type definitions (`@/types`)

### Service Dependencies

Services depend on:
- Axios or fetch for HTTP requests
- Type definitions for request/response

### Hook Dependencies

Hooks may depend on:
- React hooks (`useState`, `useEffect`, `useCallback`)
- Stores (via Zustand selectors)
- Services (for API calls)
- Other hooks (composition)
- Utilities (platform detection, formatting)

---

## Summary

This page architecture provides:

✅ **Separation of Concerns**: Page, Hook, Constants
✅ **Thin Pages**: < 50 lines, presentation only
✅ **Reusable Components**: TabCard, ActionList
✅ **Type Safety**: Full TypeScript coverage
✅ **Conditional Visibility**: Hidden property on tabs/actions
✅ **Platform Awareness**: Electron vs Browser detection
✅ **Optimistic UI**: Instant feedback before API confirms
✅ **Error Handling**: Rollback on failure
✅ **WebSocket Integration**: Real-time updates
✅ **Clean Dependencies**: Clear component hierarchy

All patterns follow Doc 70-PAGE_ARCHITECTURE_GUIDE.md and use actual working code from frontend.
