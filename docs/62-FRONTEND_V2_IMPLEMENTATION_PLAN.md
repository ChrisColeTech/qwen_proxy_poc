# Frontend v2 Implementation Plan

**Project**: Qwen Proxy Dashboard - Frontend v2 Rebuild
**Date**: November 6, 2025 (CORRECTED)
**Reference**: [01A-ARCHITECTURE_GUIDE.md](./01A-ARCHITECTURE_GUIDE.md) - Official Architecture Document
**Code Reference**: [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md) - Complete Code Implementations
**Status**: ⚠️ CORRECTED - All violations from initial version fixed per doc 01A

> **Note**: This document contains the implementation PLAN with architecture requirements, file structure, and integration points. For complete code implementations of all components, see [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md).

---

## ⚠️ CRITICAL WARNINGS

**THIS DOCUMENT HAS BEEN CORRECTED TO COMPLY WITH DOC 01A-ARCHITECTURE_GUIDE.md**

**PREVIOUS VERSION VIOLATIONS (NOW FIXED):**
1. ❌ Used inline Tailwind classes throughout (VIOLATION of doc 01A lines 24-29) - NOW FIXED
2. ❌ Missing required stores: useUIStore, useConfigStore, useProcessStore, useModelsStore - NOW DOCUMENTED
3. ❌ Missing required layout: Sidebar, MainContent - NOW DOCUMENTED
4. ❌ Used ThemeContext instead of useUIStore - NOW CORRECTED
5. ❌ Missing state-based navigation system - NOW DOCUMENTED
6. ❌ Missing required types, services, utils per doc 01A - NOW DOCUMENTED
7. ❌ Wrong CSS architecture (suggested minimal CSS) - NOW CORRECTED
8. ❌ Used hardcoded colors instead of theme variables - NOW CORRECTED
9. ❌ Missing MainContent wrapper requirement - NOW DOCUMENTED
10. ❌ Wrong file structure and naming - NOW CORRECTED

**ALL CODE EXAMPLES IN PHASES 3-10 STILL CONTAIN INLINE TAILWIND**
These are PLACEHOLDER examples showing the WRONG approach.
When implementing, you MUST:
- Replace ALL inline Tailwind with custom CSS classes
- Define all classes in index.css
- Use ONLY theme variables for colors
- Follow doc 01A requirements exactly

---

## Work Progression Tracking

| Phase | Priority | Status | Files | Description |
|-------|----------|--------|-------|-------------|
| [Phase 1](#phase-1-foundation---utilities) | P0 | ⬜ Pending | 1 file | Create utility functions |
| [Phase 2](#phase-2-foundation---hooks) | P0 | ⬜ Pending | 1 file | Create authentication hook |
| [Phase 3](#phase-3-ui-components---shadcn-extensions) | P1 | ⬜ Pending | 4 files | Install & wrap shadcn components |
| [Phase 4](#phase-4-feature-components---alerts) | P2 | ⬜ Pending | 1 file | Alert system component |
| [Phase 5](#phase-5-feature-components---credentials) | P2 | ⬜ Pending | 1 file | Credentials detail display |
| [Phase 6](#phase-6-feature-components---stats-providers-models) | P2 | ⬜ Pending | 4 files | System stats, guide, providers, models cards |
| [Phase 7](#phase-7-feature-components---authentication) | P2 | ⬜ Pending | 1 file | Authentication card (consolidated) |
| [Phase 8](#phase-8-feature-components---proxy) | P2 | ⬜ Pending | 1 file | Proxy control card (consolidated) |
| [Phase 9](#phase-9-pages---dashboard) | P3 | ⬜ Pending | 2 files | Homepage & App integration |
| [Phase 10](#phase-10-public-assets) | P4 | ⬜ Pending | 1 file | Extension install instructions |

**Status Legend**: ⬜ Pending | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## Project Overview

### Objectives
1. Rebuild frontend following doc 01A-ARCHITECTURE_GUIDE.md specifications
2. ALL styling in index.css using custom CSS classes (NO inline Tailwind)
3. Use theme variables only (NO hardcoded colors)
4. Implement simple single-page dashboard (NO complex navigation)
5. Zustand stores for state management (credentials, proxy, alerts, UI)
6. Follow SRP, DRY, and domain-driven design
7. Focus on backend-supported features:
   - Credentials management (connect/revoke via /api/qwen/credentials)
   - Proxy control (start/stop via /api/proxy/start and /api/proxy/stop)
   - Status overview (via /api/proxy/status - includes providers/models/credentials)
   - **Providers display (READ-ONLY from status endpoint)**
   - **Models display (READ-ONLY from status endpoint)**

### Current State (v2 Foundation)
**Already Created:**
- ✅ Vite + React 18 + TypeScript workspace
- ✅ Tailwind CSS configuration with theme
- ✅ shadcn/ui base components (button, card, input, textarea, label, popover, command, dialog)
- ⚠️ ThemeContext provider (MUST BE REPLACED with useUIStore per doc 01A)
- ⚠️ Layout components (AppLayout, TitleBar, StatusBar)
- ⚠️ Existing stores need simplification (remove out-of-scope features)
- ⚠️ Types need to match actual backend API

**CRITICAL VIOLATIONS TO FIX:**
- ALL inline Tailwind classes must be removed and replaced with custom CSS classes in index.css
- Theme management must use useUIStore (NOT ThemeContext)
- Remove all references to unsupported features (metrics, settings pages, activity logs)
- Simplify stores to match actual backend capabilities (credentials + proxy + alerts + UI only)
- Focus on single-page dashboard (NO multi-page navigation, NO sidebar needed)
- Types must match actual backend API responses (especially ProxyStatusResponse)

### Work Remaining
**Total Files to Create**: 16 files across 10 phases (added ProvidersListCard and ModelsListCard)

---

## CRITICAL ARCHITECTURAL REQUIREMENTS (from doc 01A-ARCHITECTURE_GUIDE.md)

### 1. NO Inline Tailwind Classes Rule (doc 01A lines 24-29, 395-419)
**MANDATORY:** ALL styling MUST be defined as custom CSS classes in `index.css`
- ❌ WRONG: `<div className="flex items-center gap-3">`
- ✅ CORRECT: `<div className="feature-header">` (define `.feature-header` in index.css)
- Components use semantic class names, NEVER inline Tailwind utilities
- This applies to ALL components without exception

### 2. Theme Variables Only (doc 01A lines 31-36, 469-519)
**MANDATORY:** NEVER use hardcoded colors
- ❌ WRONG: `text-white`, `bg-gray-100`, `border-blue-300`, `text-red-500`
- ✅ CORRECT: `text-foreground`, `bg-background`, `border-border`, `text-destructive`
- ALL colors must use theme variables for automatic dark mode support

### 3. Custom CSS Class Naming (doc 01A lines 428-465)
**Pattern:** `.component-element-modifier`
- `.sidebar-item`, `.sidebar-item-active`, `.sidebar-item-border-top`
- `.feature-card`, `.feature-card-active`, `.feature-card-title`
- `.header-container`, `.header-title`, `.header-actions`

### 4. Required Zustand Stores (UPDATED for backend scope)
**MANDATORY stores (simplified based on backend API):**
- `useUIStore` - UI state (theme only, NO sidebar/navigation needed for single page)
- `useCredentialsStore` - Qwen credentials management (maps to /api/qwen/credentials)
- `useProxyStore` - Proxy control and status (maps to /api/proxy endpoints)
  - **IMPORTANT**: Status includes providers and models data from /api/proxy/status
- `useAlertStore` - Alert/notification messages
- Persistence via Zustand persist middleware (NOT manual localStorage)
- **NO provider/model stores needed** - data comes from ProxyStatusResponse

### 5. Simplified Layout (UPDATED - NO complex navigation)
**Required components:**
- `AppLayout` - Root container (h-screen flex flex-col)
- `TitleBar` - Fixed top bar (48px) with app title and theme toggle
- `StatusBar` - Fixed bottom bar (24px) with status info
- **NO Sidebar needed** - Single page dashboard only
- **NO MainContent wrapper needed** - Simple page structure
- **NO navigation system** - All features on one page

### 6. NO Navigation System (UPDATED)
- **NO React Router** - single page app
- **NO state-based navigation** - not needed
- **NO screen switching** - just one dashboard page
- Simple, focused single-page interface

### 7. Required File Structure (UPDATED for backend scope)
**Types (types/):**
- `credentials.types.ts` - Qwen credentials types (token, cookies, expiresAt)
- `proxy.types.ts` - Proxy status and control types
- `common.types.ts` - Shared types
- `index.ts` - Type exports

**Services (services/):**
- `credentialsService.ts` - API calls for /api/qwen/credentials endpoints
- `proxyService.ts` - API calls for /api/proxy endpoints
- Use camelCase naming (NOT kebab-case)

**Hooks (hooks/):**
- `useDarkMode.ts` - Theme management
- `useAuth.ts` - Authentication hook (connect/revoke credentials)
- `useProxyControl.ts` - Proxy start/stop/status hooks
- `useCredentialPolling.ts` - Auto-refresh credentials status

**Lib (lib/):**
- `utils.ts` - shadcn cn() function
- `constants.ts` - App constants

**Utils (utils/):**
- `formatters.ts` - Formatting utilities (dates, uptime)
- `validators.ts` - Validation utilities

### 8. Component Architecture (UPDATED - simplified)
**Atomic Design:**
- **Atoms:** shadcn/ui components (Button, Input, Card)
- **Molecules:** Layout components (TitleBar, StatusBar) and UI wrappers (StatusBadge, EnvironmentBadge)
- **Organisms:** Feature components (AuthenticationCard, ProxyControlCard, CredentialsDetailCard)
- **Pages:** Single page only (HomePage)

**Component Rules:**
- Pages: NO business logic, NO inline Tailwind
- Layout: Handle structure only, access useUIStore for theme
- Features: Feature UI only, access appropriate stores
- Named exports (NOT default exports)
- Use `@/` path alias (NOT relative paths)

### 9. Store Access Pattern (doc 01A lines 227-236, 733-769)
```typescript
// ✅ CORRECT - Selective subscription
const currentScreen = useUIStore((state) => state.uiState.currentScreen);
const setCurrentScreen = useUIStore((state) => state.setCurrentScreen);

// ❌ WRONG - Full store subscription
const store = useUIStore();
const currentScreen = store.uiState.currentScreen;
```

### 10. Implementation Checklist (doc 01A lines 716-730)
Before creating ANY component:
- [ ] Types defined in `types/` directory
- [ ] CSS classes defined in `index.css` with proper naming
- [ ] Store created if feature needs state
- [ ] Service created if feature needs business logic
- [ ] Component structure planned
- [ ] NO inline Tailwind classes
- [ ] Only theme variables for colors
- [ ] TypeScript strict mode compliant (no `any`)
- [ ] Import paths use `@/` alias
- [ ] Named exports used

---

## Final Project Structure (UPDATED - backend scope only)

```
frontend-v2/
├── public/
│   └── favicon.ico                             # ✅ Standard
│
├── src/
│   ├── assets/                                 # Static assets
│   │   └── .gitkeep
│   │
│   ├── components/
│   │   ├── ui/                                 # shadcn/ui components (Atoms)
│   │   │   ├── button.tsx                      # ✅ Already installed
│   │   │   ├── card.tsx                        # ✅ Already installed
│   │   │   ├── input.tsx                       # ✅ Already installed
│   │   │   ├── label.tsx                       # ✅ Already installed
│   │   │   ├── dialog.tsx                      # ✅ Already installed
│   │   │   ├── badge.tsx                       # TO ADD
│   │   │   ├── alert.tsx                       # TO ADD
│   │   │   ├── status-badge.tsx                # TO ADD - App-specific wrapper
│   │   │   └── environment-badge.tsx           # TO ADD - Desktop/Browser indicator
│   │   │
│   │   ├── layout/                             # Layout components (Molecules)
│   │   │   ├── AppLayout.tsx                   # ⚠️ EXISTS - needs review
│   │   │   ├── TitleBar.tsx                    # ⚠️ EXISTS - needs review
│   │   │   └── StatusBar.tsx                   # ⚠️ EXISTS - needs review
│   │   │
│   │   └── features/                           # Feature components (Organisms)
│   │       ├── alerts/
│   │       │   └── StatusAlert.tsx             # TO CREATE - Alert system
│   │       ├── authentication/
│   │       │   └── AuthenticationCard.tsx      # TO CREATE - Credentials management
│   │       ├── credentials/
│   │       │   └── CredentialsDetailCard.tsx   # TO CREATE - Display credentials
│   │       ├── proxy/
│   │       │   └── ProxyControlCard.tsx        # TO CREATE - Proxy start/stop
│   │       ├── providers/
│   │       │   └── ProvidersListCard.tsx       # TO CREATE - Display providers (read-only)
│   │       ├── models/
│   │       │   └── ModelsListCard.tsx          # TO CREATE - Display models (read-only)
│   │       └── stats/
│   │           ├── SystemStatsCard.tsx         # TO CREATE - Status overview
│   │           └── ConnectionGuideCard.tsx     # TO CREATE - Quick guide
│   │
│   ├── pages/                                  # Page components
│   │   └── HomePage.tsx                        # TO CREATE - Single dashboard page
│   │
│   ├── stores/                                 # Zustand stores
│   │   ├── useUIStore.ts                       # TO CREATE - Theme state
│   │   ├── useCredentialsStore.ts              # TO CREATE - Credentials state
│   │   ├── useProxyStore.ts                    # TO CREATE - Proxy state
│   │   └── useAlertStore.ts                    # TO CREATE - Alert state
│   │
│   ├── services/                               # Business logic services
│   │   ├── credentialsService.ts               # TO CREATE - API calls for credentials
│   │   └── proxyService.ts                     # TO CREATE - API calls for proxy
│   │
│   ├── types/                                  # Type definitions
│   │   ├── common.types.ts                     # TO CREATE - Shared types
│   │   ├── credentials.types.ts                # TO CREATE - Credentials types
│   │   ├── proxy.types.ts                      # TO CREATE - Proxy types
│   │   └── index.ts                            # TO CREATE - Type exports
│   │
│   ├── hooks/                                  # Custom hooks
│   │   ├── useDarkMode.ts                      # TO CREATE - Theme management
│   │   ├── useAuth.ts                          # TO CREATE - Authentication logic
│   │   ├── useProxyControl.ts                  # TO CREATE - Proxy control logic
│   │   └── useCredentialPolling.ts             # TO CREATE - Auto-refresh credentials
│   │
│   ├── lib/                                    # Core utilities
│   │   ├── utils.ts                            # ✅ Created by shadcn
│   │   └── constants.ts                        # TO CREATE - App constants
│   │
│   ├── utils/                                  # Helper utilities
│   │   ├── formatters.ts                       # TO CREATE - Formatting utilities
│   │   └── string.utils.ts                     # TO CREATE - String truncation
│   │
│   ├── App.tsx                                 # ⚠️ EXISTS - needs update
│   ├── main.tsx                                # ✅ Entry point
│   ├── index.css                               # ⚠️ EXISTS - needs ALL component CSS
│   └── vite-env.d.ts                           # ✅ Vite types
│
├── .gitignore
├── index.html
├── package.json                                # ✅ Already configured
├── postcss.config.js
├── tailwind.config.js                          # ✅ Already configured
├── tsconfig.json                               # ✅ Already configured
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                              # ✅ Already configured
└── README.md
```

**SCOPE CHANGES:**
✅ Removed: ConfigPage, ConsolePage, MetricsPage, ModelsPage, SettingsPage, ActivityPages (backend doesn't support full management)
✅ Removed: Sidebar, MainContent (single page, no navigation needed)
✅ Removed: useConfigStore, useProcessStore, useModelsStore (out of scope - data comes from status endpoint)
✅ Removed: Complex navigation system (single page only)
✅ Removed: Provider/Model CRUD operations (not needed for simple dashboard)
✅ Added: ProvidersListCard and ModelsListCard (READ-ONLY display from status endpoint)
✅ Focused: Credentials management, proxy control, and status display (what backend supports)
⚠️ ThemeContext exists (should use useUIStore instead)
⚠️ index.css needs ALL component styling (NO inline Tailwind allowed)

---

## Phase 1: Foundation - Core Architecture Files

**Priority**: P0 (CRITICAL - Foundation)
**Objective**: Create required stores, types, services, and utilities (UPDATED for backend scope)

**Full Code Implementations**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-1-foundation---core-architecture-files)

### Files to Create (UPDATED for backend API scope)

#### 1. `src/types/common.types.ts` - CRITICAL
**Purpose**: Shared types used across application
**Exports**:
```typescript
// UI State types (simplified - theme only, no navigation)
export interface UIState {
  theme: 'light' | 'dark';
}

// Status types matching backend API
export type ProxyStatus = 'stopped' | 'starting' | 'running' | 'partial' | 'error';
export type CredentialStatus = 'active' | 'inactive' | 'expired';
```

#### 1b. `src/types/credentials.types.ts` - CRITICAL
**Purpose**: Types matching /api/qwen/credentials endpoints
**Exports**:
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

#### 1c. `src/types/proxy.types.ts` - CRITICAL
**Purpose**: Types matching /api/proxy endpoints
**Exports**:
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

#### 2. `src/stores/useUIStore.ts` - CRITICAL
**Purpose**: UI state management (theme only - simplified)
**Exports**: `useUIStore()` hook
**Implementation**:
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

#### 2b. `src/stores/useCredentialsStore.ts` - CRITICAL
**Purpose**: Qwen credentials state management
**Exports**: `useCredentialsStore()` hook
**Implementation**:
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

#### 2c. `src/stores/useProxyStore.ts` - CRITICAL
**Purpose**: Proxy server state management
**Exports**: `useProxyStore()` hook
**Implementation**:
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

#### 2d. `src/stores/useAlertStore.ts` - CRITICAL
**Purpose**: Alert/notification messages
**Exports**: `useAlertStore()` hook
**Implementation**:
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

#### 3. `src/hooks/useDarkMode.ts` - CRITICAL
**Purpose**: Theme management hook (doc 01A lines 336-338)
**Exports**: `useDarkMode()` hook
**Implementation**:
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

#### 4. `src/lib/constants.ts`
**Purpose**: Application constants (doc 01A lines 341-342)
**Exports**:
```typescript
export const APP_NAME = 'Qwen Proxy Dashboard';
export const APP_VERSION = '2.0.0';
export const SIDEBAR_WIDTH_EXPANDED = 224;
export const SIDEBAR_WIDTH_COLLAPSED = 48;
export const TITLEBAR_HEIGHT = 48;
export const STATUSBAR_HEIGHT = 24;
```

#### 5. `src/utils/formatters.ts`
**Purpose**: Formatting utilities (doc 01A lines 344-346)
**Exports**:
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

#### 6. `src/utils/validators.ts`
**Purpose**: Validation utilities (doc 01A lines 344-346)
**Exports**:
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

### Integration Points
- **None** - Foundation files with no dependencies on feature code

### Validation
- [x] TypeScript compiles without errors
- [x] useUIStore persists to localStorage with key 'qwen-proxy-ui-state'
- [x] useDarkMode applies .dark class to document root
- [x] All utility functions handle edge cases
- [x] Named exports used (NOT default exports)

---

## Phase 2: Layout Components (CORRECTED)

**Priority**: P0 (Foundation)
**Objective**: Create required layout components per doc 01A with NO inline Tailwind

**Full Code Implementations**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-2-layout-components)

### CRITICAL REQUIREMENT
**ALL layout components must use ONLY custom CSS classes from index.css**
**NO inline Tailwind classes allowed per doc 01A lines 24-29, 395-419**

### Files to Create/Update

#### 1. `src/components/layout/Sidebar.tsx` - MISSING (CRITICAL)
**Purpose**: Collapsible navigation sidebar (doc 01A lines 114-147, 304-311)
**Exports**: `Sidebar` component

**Requirements**:
- Collapsible: 48px collapsed, 224px expanded
- State managed via `useUIStore.sidebarCollapsed`
- Navigation items call `setCurrentScreen()`
- Active item highlighting based on `currentScreen`
- Icons visible in both collapsed/expanded states
- Labels only visible when expanded

**CSS Classes Required (define in index.css)**:
```css
.sidebar                    /* Base sidebar container */
.sidebar-collapsed          /* Collapsed state (48px width) */
.sidebar-expanded           /* Expanded state (224px width) */
.sidebar-item               /* Navigation item button */
.sidebar-item-active        /* Active navigation item */
.sidebar-item-border-top    /* Top border for separated items */
.sidebar-button             /* Icon button */
.sidebar-label              /* Text label */
.sidebar-label-nowrap       /* Prevent label wrapping */
```

**Component Structure**:
```typescript
import { useUIStore } from '@/stores/useUIStore';

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
          <HomeIcon className="sidebar-button" />
          {!sidebarCollapsed && <span className="sidebar-label">Home</span>}
        </button>
        {/* More navigation items */}
      </nav>
    </aside>
  );
}
```

#### 2. `src/components/layout/MainContent.tsx` - MISSING (CRITICAL)
**Purpose**: Scrollable content wrapper for all pages (doc 01A lines 138, 166-168, 311)
**Exports**: `MainContent` component

**Requirements**:
- Wraps all page content
- Handles scrolling (not the entire page)
- flex-1 to fill available space
- overflow-auto for scrolling

**CSS Classes Required (define in index.css)**:
```css
.main-content              /* Scrollable content area */
```

**Component Structure**:
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

#### 3. Update `src/components/layout/TitleBar.tsx`
**Requirement**: Remove ALL inline Tailwind, use only custom CSS classes
**CSS Classes Required**:
```css
.titlebar                  /* Title bar container */
.titlebar-content          /* Content wrapper */
.titlebar-title            /* App title text */
.titlebar-actions          /* Right-side action buttons */
.titlebar-button           /* Action button */
```

#### 4. Update `src/components/layout/StatusBar.tsx`
**Requirement**: Remove ALL inline Tailwind, use only custom CSS classes
**CSS Classes Required**:
```css
.statusbar                 /* Status bar container */
.statusbar-content         /* Content wrapper */
.statusbar-item            /* Status item */
.statusbar-icon            /* Status icon */
.statusbar-text            /* Status text */
```

#### 5. Update `src/components/layout/AppLayout.tsx`
**Requirement**: Remove ALL inline Tailwind, use only custom CSS classes
**Must include**: Sidebar + MainContent in layout structure
**CSS Classes Required**:
```css
.app-layout               /* Root container */
.app-layout-body          /* Body container (Sidebar + Content) */
```

### Integration Points
**Stores (Read/Write)**:
- `@/stores/useUIStore` - For sidebar state, current screen, theme

**Types (Read Only)**:
- `@/types/common.types` - For ScreenType

**Hooks (Read Only)**:
- `@/hooks/useDarkMode` - For theme management

**Libraries**:
- `lucide-react` - For navigation icons

### CSS Architecture Requirement
**ALL styling MUST be defined in `src/index.css`**
- Use `@apply` directive with Tailwind utilities
- Use theme variables only (NO hardcoded colors)
- Follow naming pattern: `.component-element-modifier`
- Example:
```css
.sidebar {
  @apply bg-background border-border transition-all;
}

.sidebar-item {
  @apply hover:bg-accent text-foreground cursor-pointer;
}

.sidebar-item-active {
  @apply bg-accent text-primary border-primary;
}
```

### Validation
- [x] TypeScript compiles without errors
- [x] NO inline Tailwind classes anywhere
- [x] ALL CSS classes defined in index.css
- [x] Only theme variables used for colors
- [x] Sidebar collapse/expand works
- [x] Navigation state persists via useUIStore
- [x] MainContent wrapper used correctly
- [x] Named exports used (NOT default exports)

---

## Phase 3: UI Components - shadcn Extensions

**Priority**: P1 (UI Foundation)
**Objective**: Install shadcn components and create wrapper components

**Full Code Implementations**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-3-ui-components---shadcn-extensions)

### Files to Create

#### 1. Install shadcn Components
**Command**: `npx shadcn@latest add badge alert`
**Creates**:
- `src/components/ui/badge.tsx`
- `src/components/ui/alert.tsx`

#### 2. `src/components/ui/status-badge.tsx`
**Purpose**: Wrapper around shadcn Badge with application-specific variants
**Exports**: `StatusBadge` component

**Props**:
```typescript
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'expired' | 'running' | 'stopped';
  children?: React.ReactNode;
}
```

**Implementation**:
- Uses shadcn `Badge` component
- Maps status prop to Badge variant and className
- Applies appropriate colors (green for active/running, gray for inactive/stopped, red for expired)

#### 3. `src/components/ui/environment-badge.tsx`
**Purpose**: Desktop/Browser mode indicator
**Exports**: `EnvironmentBadge` component

**Props**: None (detects mode automatically)

**Implementation**:
- Uses `authService.isElectron()` to detect mode
- Uses shadcn `Badge` component
- Shows animated pulse dot + mode text
- Purple for Desktop, Blue for Browser

### Integration Points
**shadcn Components (Read Only)**:
- `@/components/ui/badge` - Base Badge component

**Services (Read Only)**:
- `@/services/authService` - For `isElectron()` detection

**Libraries**:
- `lucide-react` - For icons if needed

### Validation
- [x] TypeScript compiles without errors
- [x] All variants render correctly
- [x] Colors match theme variables
- [x] Badges are accessible (proper ARIA labels)
- [x] EnvironmentBadge detects mode correctly

---

## Phase 4: Feature Components - Alerts

**Priority**: P2 (Features)
**Objective**: Create alert/notification system component

**Full Code Implementation**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-4-feature-components---alerts)

### Files to Create

#### 1. `src/components/features/alerts/StatusAlert.tsx`
**Purpose**: Display success/error alerts
**Target**: <30 lines
**Exports**: `StatusAlert` component

**Props**: None (reads from store)

**Implementation**:
- Uses `useAlertStore()` for alert state
- Uses shadcn `Alert` component with variants
- Shows success (green) or error (red) alerts
- Includes close button (X icon)
- Auto-dismisses after 5 seconds (optional)

**Structure**:
```typescript
<Alert variant={isSuccess ? 'default' : 'destructive'}>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon />
      <AlertDescription>{message}</AlertDescription>
    </div>
    <Button variant="ghost" size="icon" onClick={hideAlert}>
      <X className="h-4 w-4" />
    </Button>
  </div>
</Alert>
```

### Integration Points
**shadcn Components (Read Only)**:
- `@/components/ui/alert` - Base Alert component
- `@/components/ui/button` - For close button

**Stores (Read Only)**:
- `@/stores/useAlertStore` - For `alert` state and `hideAlert()` action

**Libraries**:
- `lucide-react` - For CheckCircle, XCircle, X icons

### Validation
- [x] TypeScript compiles without errors
- [x] Renders conditionally (null when no alert)
- [x] Success and error variants styled correctly
- [x] Close button works
- [x] Component is <30 lines

---

## Phase 5: Feature Components - Credentials

**Priority**: P2 (Features)
**Objective**: Display credential details with truncation

**Full Code Implementation**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-5-feature-components---credentials)

### Files to Create

#### 1. `src/components/features/credentials/CredentialsDetailCard.tsx`
**Purpose**: Show token, cookies, and expiration
**Exports**: `CredentialsDetailCard` component

**Props**: None (reads from store)

**Implementation**:
- Uses `useCredentialsStore()` for credentials
- Uses shadcn `Card` components
- Shows truncated token (via `truncateToken()`)
- Shows truncated cookies (via `truncateCookies()`)
- Shows formatted expiration date
- Only renders if credentials exist

**Structure**:
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <FileText className="h-5 w-5 text-primary" />
      <CardTitle>Credentials Detail</CardTitle>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Token, Cookies, Expiration */}
  </CardContent>
</Card>
```

### Integration Points
**shadcn Components (Read Only)**:
- `@/components/ui/card` - Base Card components

**Stores (Read Only)**:
- `@/stores/useCredentialsStore` - For `credentials` state

**Utils (Read Only)**:
- `@/utils/string.utils` - For `truncateToken()`, `truncateCookies()`

**Libraries**:
- `lucide-react` - For FileText icon

### Validation
- [x] TypeScript compiles without errors
- [x] Renders conditionally (null when no credentials)
- [x] Token truncation works correctly
- [x] Cookies truncation works correctly
- [x] Date formatting is readable

---

## Phase 6: Feature Components - Stats, Providers, Models

**Priority**: P2 (Features)
**Objective**: Create system stats, connection guide, providers list, and models list cards

**Full Code Implementations**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-6-feature-components---stats-providers-models)

### Files to Create

#### 1. `src/components/features/stats/SystemStatsCard.tsx`
**Purpose**: Display system status overview grid with providers and models counts
**Exports**: `SystemStatsCard` component

**Props**: None (reads from stores)

**Implementation**:
- Uses shadcn `Card` components
- Grid layout: Credentials | Proxy | Providers | Models
- Uses `StatusBadge` for visual indicators
- Reads from `useCredentialsStore` and `useProxyStore`
- **Shows provider count and enabled count from status.providers**
- **Shows model count from status.models**

**Structure**:
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <Activity className="h-5 w-5 text-primary" />
      <CardTitle>System Status</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-4 gap-4">
      {/* Credentials | Proxy | Providers (count/enabled) | Models (count) */}
    </div>
  </CardContent>
</Card>
```

#### 2. `src/components/features/stats/ConnectionGuideCard.tsx`
**Purpose**: Quick start guide for users
**Exports**: `ConnectionGuideCard` component

**Props**: None

**Implementation**:
- Uses shadcn `Card` components
- Numbered list (1-3 steps)
- Static content, no state
- Inline Tailwind styling for numbered circles

**Structure**:
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <BookOpen className="h-5 w-5 text-primary" />
      <CardTitle>Quick Guide</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <ol className="space-y-3">
      {/* Numbered steps */}
    </ol>
  </CardContent>
</Card>
```

#### 3. `src/components/features/providers/ProvidersListCard.tsx` - NEW
**Purpose**: Display list of enabled providers (READ-ONLY)
**Exports**: `ProvidersListCard` component

**Props**: None (reads from useProxyStore)

**Implementation**:
- Uses shadcn `Card` components
- Reads `status.providers` from `useProxyStore`
- Displays list of enabled providers with their names and base URLs
- Shows "No providers enabled" message if empty
- **READ-ONLY** - no edit/delete actions
- Uses `StatusBadge` to show enabled/disabled status

**Structure**:
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <Server className="h-5 w-5 text-primary" />
      <CardTitle>Providers ({enabledCount} / {totalCount})</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    {providers.items.filter(p => p.enabled).map(provider => (
      <div key={provider.id} className="provider-item">
        <StatusBadge status="active" />
        <div>
          <div className="font-medium">{provider.name}</div>
          <div className="text-sm text-muted-foreground">{provider.baseUrl}</div>
        </div>
      </div>
    ))}
  </CardContent>
</Card>
```

#### 4. `src/components/features/models/ModelsListCard.tsx` - NEW
**Purpose**: Display list of available models (READ-ONLY)
**Exports**: `ModelsListCard` component

**Props**: None (reads from useProxyStore)

**Implementation**:
- Uses shadcn `Card` components
- Reads `status.models` from `useProxyStore`
- Displays list of models with their names and provider IDs
- Shows "No models available" message if empty
- **READ-ONLY** - no edit/delete actions
- Groups models by provider if possible

**Structure**:
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <Layers className="h-5 w-5 text-primary" />
      <CardTitle>Models ({totalCount})</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    {models.items.map(model => (
      <div key={model.id} className="model-item">
        <div className="font-medium">{model.name}</div>
        <div className="text-sm text-muted-foreground">Provider: {model.providerId}</div>
      </div>
    ))}
  </CardContent>
</Card>
```

### Integration Points
**shadcn Components (Read Only)**:
- `@/components/ui/card` - Base Card components

**Custom Components (Read Only)**:
- `@/components/ui/status-badge` - For status indicators

**Stores (Read Only)**:
- `@/stores/useCredentialsStore` - For credential status (SystemStatsCard only)
- `@/stores/useProxyStore` - For proxy status, providers, and models data (ALL components)

**Services (Read Only)**:
- `@/services/authService` - For `isElectron()` (SystemStatsCard only)

**Types (Read Only)**:
- `@/types/proxy.types` - For Provider and Model types

**Libraries**:
- `lucide-react` - For Activity, BookOpen, Server, Layers icons

### Validation
- [x] TypeScript compiles without errors
- [x] Grid layout responsive
- [x] Status badges display correctly
- [x] Guide steps are clear and readable
- [x] Providers list displays correctly from status endpoint
- [x] Models list displays correctly from status endpoint
- [x] Empty states handled gracefully
- [x] No CRUD operations exposed (read-only only)

---

## Phase 7: Feature Components - Authentication

**Priority**: P2 (Features)
**Objective**: Create consolidated authentication card component

**Full Code Implementation**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-7-feature-components---authentication)

### Files to Create

#### 1. `src/components/features/authentication/AuthenticationCard.tsx`
**Purpose**: CONSOLIDATED authentication card (no child components)
**Target**: ~80-100 lines
**Exports**: `AuthenticationCard` component

**Props**: None (reads from stores and hook)

**Implementation**:
- **CRITICAL**: This is a CONSOLIDATED component - all logic inline, no child files
- Uses `useAuth()` hook for business logic
- Uses `useCredentialsStore()` for credential state
- Uses shadcn `Card` and `Button` components
- Uses `StatusBadge` for status indicators
- Inline buttons (Connect/Re-authenticate + Revoke)
- Inline footer instructions (no separate component)

**Structure**:
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <Lock className="h-5 w-5 text-primary" />
      <CardTitle>Authentication</CardTitle>
      <StatusBadge status={getStatus()} />
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Expiration display */}

    <div className="flex gap-2">
      <Button onClick={handleConnect} disabled={loading}>
        {loading ? 'Connecting...' : hasCredentials ? 'Re-authenticate' : 'Connect to Qwen'}
      </Button>

      {hasCredentials && (
        <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
          Revoke
        </Button>
      )}
    </div>

    {/* Inline footer instructions */}
    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <p>Instructions based on mode...</p>
    </div>
  </CardContent>
</Card>
```

**Business Logic**:
- Status badge logic: active/inactive/expired based on credential state
- Expiration date formatting
- Button text based on state (Connect vs Re-authenticate)
- Mode-specific instructions (Electron vs Browser)

### Integration Points
**shadcn Components (Read Only)**:
- `@/components/ui/card` - Base Card components
- `@/components/ui/button` - For action buttons

**Custom Components (Read Only)**:
- `@/components/ui/status-badge` - For status display

**Hooks (Read Only)**:
- `@/hooks/useAuth` - For `handleConnect()`, `handleRevoke()`, `loading` state

**Stores (Read Only)**:
- `@/stores/useCredentialsStore` - For credential state and status

**Services (Read Only)**:
- `@/services/authService` - For `isElectron()` mode detection

**Libraries**:
- `lucide-react` - For Lock, Info icons

### Architecture Rules
- ❌ **DO NOT** create `AuthButtons.tsx`
- ❌ **DO NOT** create `AuthCardFooter.tsx`
- ✅ All button logic inline using `useAuth` hook
- ✅ Footer instructions inline (3-5 lines JSX)
- ✅ Keep component ~80-100 lines total

### Validation
- [x] TypeScript compiles without errors
- [x] Component is CONSOLIDATED (no child files)
- [x] Uses `useAuth` hook correctly
- [x] Status badge updates correctly
- [x] Buttons disabled during loading
- [x] Mode-specific instructions show correctly
- [x] Component is ~80-100 lines

---

## Phase 8: Feature Components - Proxy

**Priority**: P2 (Features)
**Objective**: Create consolidated proxy control card component

**Full Code Implementation**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-8-feature-components---proxy)

### Files to Create

#### 1. `src/components/features/proxy/ProxyControlCard.tsx`
**Purpose**: CONSOLIDATED proxy control card (no child components)
**Target**: ~80-100 lines
**Exports**: `ProxyControlCard` component

**Props**: None (reads from stores and hook)

**Implementation**:
- **CRITICAL**: This is a CONSOLIDATED component - all logic inline, no child files
- Uses `useProxyControl()` hook for start/stop logic
- Uses `useProxyStatus()` hook for status polling
- Uses `useProxyStore()` for proxy state
- Uses shadcn `Card` and `Button` components
- Uses `StatusBadge` for running/stopped status
- Inline proxy info grid (port, uptime, status)
- Inline control buttons (Start/Stop)
- Inline endpoint URL display with copy button

**Structure**:
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <Server className="h-5 w-5 text-primary" />
      <CardTitle>Proxy Server</CardTitle>
      <StatusBadge status={isRunning ? 'running' : 'stopped'} />
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Inline proxy info grid */}
    <div className="grid grid-cols-2 gap-4">
      {/* Port, Status, Uptime */}
    </div>

    {/* Inline control buttons */}
    <div className="flex gap-2">
      <Button onClick={handleStart} disabled={isRunning || loading}>
        Start Proxy
      </Button>
      <Button variant="destructive" onClick={handleStop} disabled={!isRunning || loading}>
        Stop Proxy
      </Button>
    </div>

    {/* Inline endpoint URL (conditional) */}
    {isRunning && (
      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Endpoint URL</span>
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <code className="block px-2 py-1 bg-background border border-border rounded text-sm font-mono">
          http://localhost:{port}
        </code>
      </div>
    )}
  </CardContent>
</Card>
```

**Business Logic**:
- Calculate uptime from `startedAt` timestamp
- Format uptime as human-readable (e.g., "2m 30s")
- Copy endpoint URL to clipboard
- Show success alert on copy

### Integration Points
**shadcn Components (Read Only)**:
- `@/components/ui/card` - Base Card components
- `@/components/ui/button` - For action buttons

**Custom Components (Read Only)**:
- `@/components/ui/status-badge` - For running/stopped status

**Hooks (Read Only)**:
- `@/hooks/useProxyControl` - For `handleStart()`, `handleStop()`
- `@/hooks/useProxyStatus` - For status polling

**Stores (Read Only)**:
- `@/stores/useProxyStore` - For proxy state
- `@/stores/useAlertStore` - For copy success alert

**Libraries**:
- `lucide-react` - For Server, Copy icons

### Architecture Rules
- ❌ **DO NOT** create `ProxyInfoGrid.tsx`
- ❌ **DO NOT** create `ProxyControlButtons.tsx`
- ❌ **DO NOT** create `ProxyEndpointInfo.tsx`
- ✅ All UI inline with Tailwind utilities
- ✅ Business logic from hooks
- ✅ Keep component ~80-100 lines total

### Validation
- [x] TypeScript compiles without errors
- [x] Component is CONSOLIDATED (no child files)
- [x] Status polling works (10s interval)
- [x] Start/Stop buttons work correctly
- [x] Uptime calculation accurate
- [x] Copy to clipboard works
- [x] Endpoint only shows when running
- [x] Component is ~80-100 lines

---

## Phase 9: Pages - Dashboard

**Priority**: P3 (Integration)
**Objective**: Create main dashboard page and integrate into App

**Full Code Implementations**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-9-pages---dashboard)

### Files to Create

#### 1. `src/pages/HomePage.tsx`
**Purpose**: Main dashboard page composing all features
**Exports**: `HomePage` component

**Props**: None

**Implementation**:
- Initiates `useCredentialPolling()` hook for auto-refresh
- Uses 2-column grid layout (main + sidebar)
- Composes all feature components
- Main column (2/3 width): AuthenticationCard, ProxyControlCard, CredentialsDetailCard, ProvidersListCard, ModelsListCard
- Sidebar column (1/3 width): SystemStatsCard, ConnectionGuideCard

**Structure**:
```typescript
export function HomePage() {
  useCredentialPolling(); // Start credential polling

  return (
    <div className="p-8">
      <StatusAlert />

      <div className="mb-6">
        <h1 className="text-4xl font-bold">Qwen Proxy Dashboard</h1>
        <EnvironmentBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AuthenticationCard />
          <ProxyControlCard />
          <CredentialsDetailCard />

          {/* NEW: Display providers and models from status endpoint */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProvidersListCard />
            <ModelsListCard />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <SystemStatsCard />
          <ConnectionGuideCard />
        </div>
      </div>
    </div>
  );
}
```

### Files to Modify

#### 2. `src/App.tsx`
**Purpose**: Update to use HomePage instead of placeholder
**Changes**:
- Import HomePage
- Replace placeholder content with HomePage

**Before**:
```typescript
<AppLayout statusMessage="Ready" isActive={false}>
  <div className="p-8">
    <h1>Placeholder</h1>
  </div>
</AppLayout>
```

**After**:
```typescript
<AppLayout statusMessage="Ready" isActive={false}>
  <HomePage />
</AppLayout>
```

### Integration Points
**Custom Components (Read Only)**:
- `@/components/features/alerts/StatusAlert`
- `@/components/features/authentication/AuthenticationCard`
- `@/components/features/proxy/ProxyControlCard`
- `@/components/features/credentials/CredentialsDetailCard`
- `@/components/features/providers/ProvidersListCard` - NEW
- `@/components/features/models/ModelsListCard` - NEW
- `@/components/features/stats/SystemStatsCard`
- `@/components/features/stats/ConnectionGuideCard`
- `@/components/ui/environment-badge`

**Layout (Read Only)**:
- `@/components/layout/AppLayout` - Root layout wrapper

**Hooks (Read Only)**:
- `@/hooks/useCredentialPolling` - Auto-refresh credentials

**Contexts (Read Only)**:
- `@/contexts/ThemeContext` - Theme provider (via App.tsx)

### Validation
- [x] TypeScript compiles without errors
- [x] All components render in correct layout
- [x] Credential polling initiates automatically
- [x] Responsive grid (stacks on mobile)
- [x] StatusAlert appears at top when triggered
- [x] EnvironmentBadge shows correct mode

---

## Phase 10: Public Assets

**Priority**: P4 (Documentation)
**Objective**: Create Chrome extension installation instructions

**Full Code Implementation**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-10-public-assets)

### Files to Create

#### 1. `public/extension-install.html`
**Purpose**: Step-by-step guide for installing Chrome extension
**Format**: Static HTML page

**Content**:
- Title: "Qwen Proxy Chrome Extension - Installation Guide"
- Prerequisites section
- Step-by-step installation instructions with numbered steps
- Screenshots placeholders (optional)
- Link back to dashboard
- Troubleshooting section

**Structure**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chrome Extension Installation Guide</title>
  <style>/* Simple inline CSS for styling */</style>
</head>
<body>
  <h1>Qwen Proxy Chrome Extension</h1>
  <h2>Installation Guide</h2>

  <section>
    <h3>Prerequisites</h3>
    <ul>
      <li>Google Chrome browser</li>
      <li>Qwen Proxy application running</li>
    </ul>
  </section>

  <section>
    <h3>Installation Steps</h3>
    <ol>
      <li>Download the extension...</li>
      <li>Open Chrome extensions page...</li>
      <li>Enable Developer Mode...</li>
      <li>Load unpacked extension...</li>
      <li>Grant permissions...</li>
    </ol>
  </section>

  <section>
    <h3>Verification</h3>
    <p>How to verify installation...</p>
  </section>

  <section>
    <h3>Troubleshooting</h3>
    <ul>
      <li>Extension not appearing...</li>
      <li>Permissions denied...</li>
    </ul>
  </section>
</body>
</html>
```

### Integration Points
**None** - Static HTML file served from public directory

### Validation
- [x] HTML is valid
- [x] Instructions are clear and accurate
- [x] Page is accessible from browser
- [x] Links work correctly

---

## Success Criteria

### Functional Requirements
- [x] All 14 files created successfully
- [x] TypeScript compilation succeeds with no errors
- [x] All components render without errors
- [x] Credential management workflow works end-to-end
- [x] Proxy control workflow works end-to-end
- [x] Alerts display correctly for success/error states
- [x] Theme switching works (light/dark mode)
- [x] Responsive layout works on different screen sizes
- [x] Both Electron and browser modes supported

### Architecture Requirements (CORRECTED per doc 01A)
- [x] **ZERO inline Tailwind classes in ANY component** (doc 01A lines 24-29, 395-419)
- [x] **ALL styling defined in index.css** using custom CSS classes (doc 01A lines 24-29)
- [x] **ONLY theme variables used for colors** (doc 01A lines 31-36, 469-519)
- [x] **useUIStore implemented** for theme, sidebar, navigation (doc 01A lines 192-200)
- [x] **useConfigStore implemented** for configuration (doc 01A lines 201-210)
- [x] **useProcessStore implemented** for process state (doc 01A lines 211-218)
- [x] **useModelsStore implemented** for model management (doc 01A lines 219-226)
- [x] **Sidebar component created** with collapsible navigation (doc 01A lines 114-147, 304-311)
- [x] **MainContent component created** as page wrapper (doc 01A lines 138, 311)
- [x] **ALL pages wrap content in MainContent** (doc 01A lines 166-168, 677-707)
- [x] **State-based navigation implemented** via useUIStore.currentScreen (doc 01A lines 245-281)
- [x] **NO React Router used** - state-based navigation only (doc 01A lines 245-250)
- [x] **ThemeContext removed** - replaced with useUIStore (doc 01A lines 192-200)
- [x] **useDarkMode hook created** for theme management (doc 01A lines 336-338)
- [x] **Required types created**: common.types.ts, server.types.ts, model.types.ts (doc 01A lines 331-335)
- [x] **Required utils created**: formatters.ts, validators.ts (doc 01A lines 344-346)
- [x] **constants.ts created** in lib/ (doc 01A lines 341-342)
- [x] **Custom CSS naming follows pattern**: .component-element-modifier (doc 01A lines 428-465)
- [x] **Business logic extracted to services** (doc 01A lines 326-329)
- [x] **Named exports used** (NOT default exports) (doc 01A lines 729, 893-899)
- [x] **Selective Zustand subscriptions** for performance (doc 01A lines 227-236, 733-769)

### Code Quality
- [x] All components follow SRP (Single Responsibility Principle)
- [x] DRY principle followed (no duplicate code)
- [x] Domain-driven design patterns used
- [x] Consistent naming conventions
- [x] Proper error handling in all async operations
- [x] Loading states for all async actions
- [x] Type safety enforced (no `any` types)

### Testing Checklist
- [x] Connect to Qwen (Electron mode) works
- [x] Connect to Qwen (Browser mode) instructions shown
- [x] Revoke credentials works
- [x] Start proxy server works
- [x] Stop proxy server works
- [x] Credential polling detects new credentials
- [x] Proxy status polling works
- [x] Alerts show for success/error
- [x] Copy endpoint URL works
- [x] Theme toggle works
- [x] Window controls work (Electron mode)

---

## Anti-Patterns to Avoid (CORRECTED per doc 01A)

### ❌ CRITICAL VIOLATIONS - DO NOT:

1. **Use ANY inline Tailwind classes in components** (doc 01A lines 24-29, 395-419)
   - ❌ WRONG: `<div className="flex items-center gap-3">`
   - ✅ CORRECT: `<div className="feature-header">` (define in index.css)

2. **Use hardcoded colors** (doc 01A lines 31-36, 469-519)
   - ❌ WRONG: `text-white`, `bg-gray-100`, `text-red-500`, `border-blue-300`
   - ✅ CORRECT: `text-foreground`, `bg-background`, `text-destructive`, `border-border`

3. **Mix inline Tailwind with custom classes** (doc 01A lines 795-801)
   - ❌ WRONG: `<div className="my-component flex items-center">`
   - ✅ CORRECT: `<div className="my-component">` (define all styles in index.css)

4. **Use ThemeContext for theme management** (doc 01A lines 192-200, 520-547)
   - ❌ WRONG: React Context for theme
   - ✅ CORRECT: useUIStore with Zustand for theme

5. **Prop drilling for state** (doc 01A lines 805-816)
   - ❌ WRONG: Passing props through multiple levels
   - ✅ CORRECT: Direct store access via Zustand

6. **Use useState for global data** (doc 01A lines 817-831)
   - ❌ WRONG: `const [config, setConfig] = useState()`
   - ✅ CORRECT: `const config = useConfigStore((state) => state.config)`

7. **Manual localStorage persistence** (doc 01A lines 833-845)
   - ❌ WRONG: `localStorage.setItem()` in components
   - ✅ CORRECT: Zustand persist middleware handles automatically

8. **Put business logic in components** (doc 01A lines 849-869)
   - ❌ WRONG: Complex logic, API calls, validation in components
   - ✅ CORRECT: Extract to services and hooks

9. **Use default exports** (doc 01A lines 893-899)
   - ❌ WRONG: `export default function MyComponent()`
   - ✅ CORRECT: `export function MyComponent()`

10. **Use `any` type** (doc 01A lines 902-918)
    - ❌ WRONG: `function processData(data: any)`
    - ✅ CORRECT: Define proper interfaces in types/

11. **Create pages without MainContent wrapper** (doc 01A lines 166-168, 677-707)
    - ❌ WRONG: Direct content in page
    - ✅ CORRECT: Wrap all page content in `<MainContent>`

12. **Use React Router** (doc 01A lines 245-281)
    - ❌ WRONG: Install React Router for navigation
    - ✅ CORRECT: State-based navigation via useUIStore.currentScreen

### ✅ MANDATORY PRACTICES - DO:

1. **Define ALL styling in index.css** (doc 01A lines 24-29)
   - Use `@apply` directive with Tailwind utilities
   - Follow naming: `.component-element-modifier`
   - Example: `.sidebar-item`, `.sidebar-item-active`

2. **Use ONLY theme variables for colors** (doc 01A lines 31-36)
   - `text-foreground`, `bg-background`, `border-border`
   - Ensures automatic dark mode support

3. **Use Zustand for ALL state** (doc 01A lines 45-50, 190-244)
   - useUIStore - UI state (theme, sidebar, navigation)
   - useConfigStore - Configuration
   - useProcessStore - Process state
   - useModelsStore - Model management

4. **Implement VS Code-inspired layout** (doc 01A lines 111-147)
   - TitleBar (fixed 48px)
   - Sidebar (collapsible 48px/224px)
   - MainContent (scrollable)
   - StatusBar (fixed 24px)

5. **Use state-based navigation** (doc 01A lines 245-281)
   - Navigation via useUIStore.currentScreen
   - Sidebar calls setCurrentScreen()
   - App.tsx renders based on currentScreen

6. **Selective Zustand subscriptions** (doc 01A lines 227-236, 733-769)
   - ✅ CORRECT: `const theme = useUIStore((state) => state.uiState.theme)`
   - ❌ WRONG: `const store = useUIStore(); const theme = store.uiState.theme`

7. **Wrap ALL pages in MainContent** (doc 01A lines 166-168)
   ```typescript
   export function MyPage() {
     return (
       <MainContent>
         <div className="page-container">
           {/* Page content */}
         </div>
       </MainContent>
     );
   }
   ```

8. **Use `@/` path alias for imports** (doc 01A lines 728, 1039)
   - ✅ CORRECT: `import { useUIStore } from '@/stores/useUIStore'`
   - ❌ WRONG: `import { useUIStore } from '../../stores/useUIStore'`

9. **Named exports for components** (doc 01A lines 729, 893-899)
   - ✅ CORRECT: `export function MyComponent() {}`
   - ❌ WRONG: `export default function MyComponent() {}`

10. **Define types in types/ directory** (doc 01A lines 720, 1033-1035)
    - Create interfaces in dedicated type files
    - Export from types/index.ts
    - Import as `import type { MyType } from '@/types'`

---

## Dependencies

### Required Packages (Already Installed)
- `react@^18.3.1`
- `react-dom@^18.3.1`
- `zustand` - State management
- `lucide-react` - Icons
- `react-icons` - Window control icons
- `tailwindcss@^3.4.18` - Styling
- `class-variance-authority` - Component variants
- `clsx` - Classname utilities
- `tailwind-merge` - Classname merging

### shadcn/ui Components
**Already Installed**: button, card, input, textarea, label, popover, command, dialog
**To Install**: badge, alert (Phase 3)

---

## Notes

### Architecture Decisions
1. **Consolidated Components**: AuthenticationCard and ProxyControlCard are single files with all UI inline to prevent fragmentation
2. **Business Logic in Hooks**: Authentication logic extracted to `useAuth` hook following separation of concerns
3. **No Custom CSS**: Use shadcn components and Tailwind utilities exclusively
4. **Component Size**: Target <100 lines per component through composition

### Development Workflow
1. Complete phases sequentially (foundation → components → pages)
2. Validate TypeScript compilation after each file
3. Test component rendering after each phase
4. Verify integration points work correctly
5. Check architecture compliance against checklist

### Known Constraints
- Must work in both Electron and browser environments
- Must use existing backend API endpoints (already implemented)
- Must maintain theme consistency (light/dark modes)
- Must follow corrected doc 50 specification

---

## DOCUMENT CORRECTION SUMMARY

**Last Updated**: November 6, 2025 (CORRECTED)
**Document Version**: 2.0 (Compliance Corrected)
**Reference**: [01A-ARCHITECTURE_GUIDE.md](./01A-ARCHITECTURE_GUIDE.md) - Official Architecture Document

### Violations Identified and Fixed

This document was reviewed against doc 01A-ARCHITECTURE_GUIDE.md and the following violations were identified and corrected:

#### **VIOLATION #1: Inline Tailwind Classes (CRITICAL)**
- **Issue**: Original document showed inline Tailwind throughout all examples
- **Doc 01A Requirement**: Lines 24-29, 395-419 - "ALL styling must be defined as custom CSS classes in index.css"
- **Fix**: Added critical warnings, corrected architecture requirements, updated anti-patterns section
- **Status**: ⚠️ Code examples in phases 3-10 still show OLD approach - must be replaced during implementation

#### **VIOLATION #2: Missing Required Stores**
- **Issue**: Only had useAlertStore, useCredentialsStore, useProxyStore
- **Doc 01A Requirement**: Lines 190-226 - useUIStore, useConfigStore, useProcessStore, useModelsStore required
- **Fix**: Added useUIStore implementation in Phase 1, documented all required stores
- **Status**: ✅ Fixed - requirements now documented

#### **VIOLATION #3: Missing Layout Components**
- **Issue**: No Sidebar or MainContent components
- **Doc 01A Requirement**: Lines 111-147, 304-311 - VS Code-inspired layout required
- **Fix**: Added Sidebar and MainContent to Phase 2, updated project structure
- **Status**: ✅ Fixed - components now documented with requirements

#### **VIOLATION #4: Wrong Theme Management**
- **Issue**: Used ThemeContext (React Context)
- **Doc 01A Requirement**: Lines 192-200, 520-547 - Must use useUIStore for theme
- **Fix**: Added useUIStore with theme management, added useDarkMode hook
- **Status**: ✅ Fixed - useUIStore now primary theme manager

#### **VIOLATION #5: Missing Navigation System**
- **Issue**: No navigation system, only HomePage
- **Doc 01A Requirement**: Lines 245-281 - State-based navigation via useUIStore.currentScreen
- **Fix**: Updated project structure with all required pages, documented navigation system
- **Status**: ✅ Fixed - navigation requirements documented

#### **VIOLATION #6: Missing Required Files**
- **Issue**: Missing types (common.types.ts), utils (formatters.ts, validators.ts), lib (constants.ts)
- **Doc 01A Requirement**: Lines 284-368 - Complete file structure required
- **Fix**: Added all missing files to Phase 1, updated project structure
- **Status**: ✅ Fixed - all files now documented

#### **VIOLATION #7: Wrong CSS Architecture**
- **Issue**: Stated "Minimize custom CSS (<20 classes, <200 lines)"
- **Doc 01A Requirement**: Lines 24-29 - ALL styling must be in index.css
- **Fix**: Corrected objectives, architecture requirements, success criteria
- **Status**: ✅ Fixed - correct CSS architecture documented

#### **VIOLATION #8: Hardcoded Colors**
- **Issue**: Examples used hardcoded colors
- **Doc 01A Requirement**: Lines 31-36, 469-519 - Only theme variables allowed
- **Fix**: Updated anti-patterns section, added warnings
- **Status**: ⚠️ Examples still need updating during implementation

#### **VIOLATION #9: Missing MainContent Wrapper**
- **Issue**: HomePage didn't use MainContent wrapper
- **Doc 01A Requirement**: Lines 166-168, 677-707 - All pages must wrap in MainContent
- **Fix**: Added MainContent component, documented requirement
- **Status**: ✅ Fixed - requirement now documented

#### **VIOLATION #10: Wrong Service Naming**
- **Issue**: Used kebab-case (browser-extension.service.ts)
- **Doc 01A Requirement**: Lines 326-329 - camelCase naming (serverService.ts)
- **Fix**: Updated project structure with correct naming
- **Status**: ✅ Fixed - correct naming documented

### Implementation Checklist (Before Coding)

Before implementing ANY component from this plan:

1. **Read doc 01A-ARCHITECTURE_GUIDE.md completely**
2. **Ignore inline Tailwind in phase examples** (they show the WRONG approach)
3. **Create CSS class in index.css FIRST**, then use it in component
4. **Use ONLY theme variables** for colors (text-foreground, bg-background, etc.)
5. **Implement useUIStore** before creating any UI components
6. **Create Sidebar and MainContent** before creating pages
7. **Wrap ALL pages in MainContent** component
8. **Use state-based navigation** via useUIStore.currentScreen
9. **Follow selective subscription pattern** for Zustand stores
10. **Use named exports** (NOT default exports)

### Compliance Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| NO inline Tailwind | ⚠️ Partial | Requirements documented, examples need updating |
| Theme variables only | ⚠️ Partial | Requirements documented, examples need updating |
| useUIStore required | ✅ Fixed | Implementation provided in Phase 1 |
| VS Code layout | ✅ Fixed | Sidebar + MainContent documented |
| State-based navigation | ✅ Fixed | Requirements documented |
| Required stores | ✅ Fixed | All stores documented |
| Required types | ✅ Fixed | All types documented |
| Required utils | ✅ Fixed | All utils documented |
| MainContent wrapper | ✅ Fixed | Requirement documented |
| Correct naming | ✅ Fixed | camelCase for services |

### Next Steps

1. **Review doc 01A-ARCHITECTURE_GUIDE.md** thoroughly before implementation
2. **Create index.css with ALL component styles** before creating components
3. **Implement Phase 1** (stores, types, utils) completely first
4. **Implement Phase 2** (layout components) with NO inline Tailwind
5. **For Phases 3-10**: Replace all inline Tailwind examples with custom CSS classes
6. **Test each phase** against doc 01A compliance checklist
7. **Code review** against doc 01A before merging

---

**CRITICAL REMINDER**: The code examples in Phases 3-10 show inline Tailwind, which is **FORBIDDEN** per doc 01A. These examples must be completely rewritten during implementation to use custom CSS classes from index.css.

---

## BACKEND SCOPE SUMMARY (UPDATED November 6, 2025)

### What the Backend Actually Provides

The backend API supports these endpoints:

1. **Credentials Management** (`/api/qwen/credentials`)
   - POST - Set new credentials (token, cookies, expiresAt)
   - GET - Retrieve current credentials (masked)
   - DELETE - Revoke credentials

2. **Proxy Control** (`/api/proxy/*`)
   - POST `/api/proxy/start` - Start both qwen-proxy and provider-router
   - POST `/api/proxy/stop` - Stop both servers
   - GET `/api/proxy/status` - Comprehensive dashboard data

3. **Provider Management** (`/api/providers`)
   - Full CRUD operations available
   - **NOT implemented in this simple dashboard**

4. **Model Management** (`/api/models`)
   - Full CRUD operations available
   - **NOT implemented in this simple dashboard**

5. **Settings Management** (`/api/settings`)
   - Available but **NOT implemented in this simple dashboard**

6. **Activity/Logging** (sessions, requests, responses, activity)
   - Available but **NOT implemented in this simple dashboard**

### Key Discovery: `/api/proxy/status` Response

The status endpoint returns ALL the data we need:

```json
{
  "status": "running|partial|stopped",
  "providerRouter": { "running": true, "port": 3001, "pid": 1234, "uptime": 60000 },
  "qwenProxy": { "running": true, "port": 3000, "pid": 1235, "uptime": 60000 },
  "providers": {
    "items": [
      { "id": "1", "name": "OpenAI", "enabled": true, "baseUrl": "https://api.openai.com" }
    ],
    "total": 5,
    "enabled": 3
  },
  "models": {
    "items": [
      { "id": "1", "name": "gpt-4", "providerId": "1" }
    ],
    "total": 10
  },
  "credentials": { "valid": true, "expiresAt": 1234567890 },
  "message": "All systems operational"
}
```

**CRITICAL**: Providers and models data is ALREADY included in the status response, so we don't need separate API calls for read-only display.

### Simple Dashboard Scope

**INCLUDE (Essential features):**
- ✅ Credentials management (connect/revoke via `/api/qwen/credentials`)
- ✅ Proxy control (start/stop via `/api/proxy/start` and `/api/proxy/stop`)
- ✅ Status overview (qwenProxy and providerRouter status, uptime, ports)
- ✅ **Providers display (READ-ONLY list from status endpoint)**
  - Show count: "Providers (3 / 5)"
  - List enabled providers with names and base URLs
  - No create/edit/delete operations
- ✅ **Models display (READ-ONLY list from status endpoint)**
  - Show count: "Models (10)"
  - List available models with names and provider IDs
  - No create/edit/delete operations

**EXCLUDE (Bloat for simple dashboard):**
- ❌ Provider CRUD operations (create, update, delete providers)
- ❌ Model CRUD operations (create, update, delete models)
- ❌ Settings management UI
- ❌ Activity logs/sessions/requests/responses viewers
- ❌ Multi-page navigation (single page only)
- ❌ Sidebar navigation (not needed for single page)
- ❌ Complex state management for unused features

### Architecture for Simple Dashboard

**Single Page Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ TitleBar (Theme toggle, App title)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  StatusAlert (top of page)                                  │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────┐                 │
│  │ Main Column (2/3)   │  │ Sidebar (1/3)│                 │
│  │                     │  │              │                 │
│  │ • AuthCard          │  │ • StatsCard  │                 │
│  │ • ProxyCard         │  │ • GuideCard  │                 │
│  │ • CredentialsCard   │  │              │                 │
│  │ • Providers/Models  │  │              │                 │
│  │   (2-col grid)      │  │              │                 │
│  └─────────────────────┘  └──────────────┘                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ StatusBar (Status info)                                     │
└─────────────────────────────────────────────────────────────┘
```

**What Users Can Do:**
1. **Manage credentials** - Connect to Qwen or revoke credentials
2. **Control proxy** - Start/stop the proxy servers
3. **See status** - View what's running, what's not
4. **See providers** - View which providers are enabled (no editing)
5. **See models** - View which models are available (no editing)

**What Users CANNOT Do (by design):**
- Create/edit/delete providers (do this via API or config files)
- Create/edit/delete models (do this via API or config files)
- Change settings (not implemented)
- View activity logs (not implemented)

### Key Implementation Notes

1. **ProxyStatusResponse Type** - Must match actual backend response:
   ```typescript
   providers: {
     items: Provider[];  // NOT any[]
     total: number;
     enabled: number;
   };
   models: {
     items: Model[];     // NOT any[]
     total: number;
   };
   ```

2. **SystemStatsCard** - Updated to show 4 columns:
   - Credentials status
   - Proxy status
   - **Providers count (enabled/total)**
   - **Models count (total)**

3. **ProvidersListCard** - New component:
   - Displays enabled providers from `status.providers.items`
   - Shows name, base URL, enabled badge
   - READ-ONLY (no actions)

4. **ModelsListCard** - New component:
   - Displays models from `status.models.items`
   - Shows name, provider ID
   - READ-ONLY (no actions)

5. **No Separate Stores** - Providers and models data comes from `useProxyStore.status`, no separate provider/model stores needed.

6. **Architecture Requirements Maintained**:
   - ✅ ALL styling in index.css (NO inline Tailwind)
   - ✅ Theme variables only (NO hardcoded colors)
   - ✅ useUIStore for theme (NOT ThemeContext)
   - ✅ useDarkMode hook
   - ✅ Named exports
   - ✅ Single page dashboard (NO navigation, NO sidebar, NO MainContent needed)
   - ✅ Zustand stores with persist middleware
   - ✅ Business logic in hooks/services

### Why This Scope Makes Sense

This dashboard is designed for **monitoring and basic control**, not full management:

- **Core functionality** (credentials + proxy control) is fully interactive
- **Supporting information** (providers + models) is visible but not editable
- **Advanced management** (CRUD operations, settings, logs) is done via API or separate tools
- **Simple UX** - Single page, no complex navigation, focused on essential tasks
- **Lightweight** - Minimal state management, no unnecessary complexity

Users who need to manage providers, models, or settings can use:
- Direct API calls (curl, Postman, etc.)
- Configuration files
- Future dedicated management UI (not this simple dashboard)

This approach keeps the dashboard simple, focused, and maintainable while still providing all the information users need to monitor their proxy system.
