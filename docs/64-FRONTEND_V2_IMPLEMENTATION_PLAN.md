# Frontend v2 Implementation Plan

**Project**: Qwen Proxy Dashboard - Frontend v2 Rebuild
**Date**: November 6, 2025
**Status**: Planning Phase
**Reference Documents**:
- [01A-ARCHITECTURE_GUIDE.md](./01A-ARCHITECTURE_GUIDE.md) - Official Architecture Requirements
- [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md) - Complete Code Implementations

---

## Important Notes

**This is an IMPLEMENTATION PLAN document** - it contains NO code examples.
- For complete code implementations, see [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md)
- All architecture requirements are from [01A-ARCHITECTURE_GUIDE.md](./01A-ARCHITECTURE_GUIDE.md)
- This document focuses on WHAT to build, not HOW to build it

---

## Work Progression Tracking

| Phase | Priority | Status | Files | Description |
|-------|----------|--------|-------|-------------|
| [Phase 1](#phase-1-foundation---types) | P0 | ⬜ Pending | 4 files | Type definitions for credentials and proxy |
| [Phase 2](#phase-2-foundation---stores) | P0 | ⬜ Pending | 4 files | Zustand stores for state management |
| [Phase 3](#phase-3-foundation---hooks) | P0 | ⬜ Pending | 4 files | Custom hooks for business logic |
| [Phase 4](#phase-4-foundation---services) | P0 | ⬜ Pending | 2 files | API service layers |
| [Phase 5](#phase-5-foundation---utilities) | P0 | ⬜ Pending | 3 files | Formatting and validation utilities |
| [Phase 6](#phase-6-ui-components---shadcn-installation) | P1 | ⬜ Pending | 2 files | Install shadcn badge and alert components |
| [Phase 7](#phase-7-ui-components---wrappers) | P1 | ⬜ Pending | 2 files | App-specific UI wrapper components |
| [Phase 8](#phase-8-feature-components---alerts) | P2 | ⬜ Pending | 1 file | Alert notification system |
| [Phase 9](#phase-9-feature-components---credentials) | P2 | ⬜ Pending | 1 file | Credentials detail display |
| [Phase 10](#phase-10-feature-components---stats-and-guide) | P2 | ⬜ Pending | 2 files | System status and quick guide |
| [Phase 11](#phase-11-feature-components---providers-and-models) | P2 | ⬜ Pending | 2 files | Read-only providers and models lists |
| [Phase 12](#phase-12-feature-components---authentication) | P2 | ⬜ Pending | 1 file | Authentication card |
| [Phase 13](#phase-13-feature-components---proxy) | P2 | ⬜ Pending | 1 file | Proxy control card |
| [Phase 14](#phase-14-pages) | P3 | ⬜ Pending | 2 files | Dashboard page and App integration |
| [Phase 15](#phase-15-public-assets) | P4 | ⬜ Pending | 1 file | Extension installation guide |

**Status Legend**: ⬜ Pending | 🔄 In Progress | ✅ Complete | ❌ Blocked

**Total Files**: 32 files across 15 phases

---

## Project Scope

### Objectives

Build a simple single-page dashboard following doc 01A architecture specifications:

1. **Architecture Compliance**
   - ALL styling in index.css using custom CSS classes (NO inline Tailwind per doc 01A lines 24-29)
   - Use theme variables only for colors (NO hardcoded colors per doc 01A lines 31-36)
   - Implement required Zustand stores for state management
   - Follow SRP, DRY, and domain-driven design principles

2. **Core Features** (backend-supported)
   - Credentials management via `/api/qwen/credentials` endpoints
   - Proxy control via `/api/proxy/start` and `/api/proxy/stop`
   - Status overview via `/api/proxy/status` (includes all dashboard data)
   - Read-only providers display from status endpoint
   - Read-only models display from status endpoint

3. **Simplified Dashboard**
   - Single-page dashboard (NO complex navigation system)
   - No sidebar needed (all features on one page)
   - No multi-page routing (just one HomePage)
   - Focus on essential monitoring and control

### Backend API Endpoints Used

**Credentials Management** (`/api/qwen/credentials`):
- POST - Set credentials (token, cookies, expiresAt)
- GET - Retrieve current credentials (masked)
- DELETE - Revoke credentials

**Proxy Control** (`/api/proxy/*`):
- POST `/api/proxy/start` - Start both qwen-proxy and provider-router
- POST `/api/proxy/stop` - Stop both servers
- GET `/api/proxy/status` - Get comprehensive status including providers, models, credentials

**Key Discovery**: The `/api/proxy/status` endpoint returns ALL data needed:
- Proxy status (qwenProxy + providerRouter running state, ports, PIDs, uptime)
- Providers list with enabled count
- Models list with total count
- Credentials validity and expiration

### What's Included

✅ **Essential Features**:
- Credentials connect/revoke workflow
- Proxy start/stop controls
- Status overview dashboard
- Providers list (read-only display)
- Models list (read-only display)
- Alert/notification system
- Theme switching (light/dark)

### Architecture Principles (from doc 01A)

**Critical Requirements**:

1. **NO Inline Tailwind Classes** (doc 01A lines 24-29, 395-419)
   - ALL styling must be custom CSS classes defined in index.css
   - Components use semantic class names only

2. **Theme Variables Only** (doc 01A lines 31-36, 469-519)
   - NEVER use hardcoded colors
   - Always use theme variables for automatic dark mode support

3. **Zustand State Management** (simplified for backend scope)
   - `useUIStore` - Theme state only
   - `useCredentialsStore` - Credentials state
   - `useProxyStore` - Proxy state (includes providers/models data)
   - `useAlertStore` - Alert messages

4. **Simplified Layout** 
   - AppLayout - Root container
   - TitleBar - Top bar with theme toggle
   - StatusBar - Bottom status bar

5. **File Structure** (doc 01A lines 284-368)
   - Types in `types/` directory
   - Services in `services/` with camelCase naming
   - Hooks in `hooks/`
   - Utils in `utils/` and `lib/`
   - Named exports (NOT default exports)
   - `@/` path alias for imports

---

## Final File Structure

```
frontend-v2/
├── public/
│   ├── favicon.ico                             ✅ Exists
│   └── extension-install.html                  📝 Create
│
├── src/
│   ├── assets/
│   │   └── .gitkeep                            ✅ Exists
│   │
│   ├── components/
│   │   ├── ui/                                 # shadcn/ui components (Atoms)
│   │   │   ├── button.tsx                      ✅ Installed
│   │   │   ├── card.tsx                        ✅ Installed
│   │   │   ├── input.tsx                       ✅ Installed
│   │   │   ├── label.tsx                       ✅ Installed
│   │   │   ├── dialog.tsx                      ✅ Installed
│   │   │   ├── badge.tsx                       📝 Install (Phase 6)
│   │   │   ├── alert.tsx                       📝 Install (Phase 6)
│   │   │   ├── status-badge.tsx                📝 Create (Phase 7)
│   │   │   └── environment-badge.tsx           📝 Create (Phase 7)
│   │   │
│   │   ├── layout/                             # Layout components
│   │   │   ├── AppLayout.tsx                   ✅ Exists (review)
│   │   │   ├── TitleBar.tsx                    ✅ Exists (review)
│   │   │   └── StatusBar.tsx                   ✅ Exists (review)
│   │   │
│   │   └── features/                           # Feature components
│   │       ├── alerts/
│   │       │   └── StatusAlert.tsx             📝 Create (Phase 8)
│   │       ├── credentials/
│   │       │   └── CredentialsDetailCard.tsx   📝 Create (Phase 9)
│   │       ├── stats/
│   │       │   ├── SystemStatsCard.tsx         📝 Create (Phase 10)
│   │       │   └── ConnectionGuideCard.tsx     📝 Create (Phase 10)
│   │       ├── providers/
│   │       │   └── ProvidersListCard.tsx       📝 Create (Phase 11)
│   │       ├── models/
│   │       │   └── ModelsListCard.tsx          📝 Create (Phase 11)
│   │       ├── authentication/
│   │       │   └── AuthenticationCard.tsx      📝 Create (Phase 12)
│   │       └── proxy/
│   │           └── ProxyControlCard.tsx        📝 Create (Phase 13)
│   │
│   ├── pages/
│   │   └── HomePage.tsx                        📝 Create (Phase 14)
│   │
│   ├── stores/                                 # Zustand stores
│   │   ├── useUIStore.ts                       📝 Create (Phase 2)
│   │   ├── useCredentialsStore.ts              📝 Create (Phase 2)
│   │   ├── useProxyStore.ts                    📝 Create (Phase 2)
│   │   └── useAlertStore.ts                    📝 Create (Phase 2)
│   │
│   ├── services/                               # Business logic services
│   │   ├── credentialsService.ts               📝 Create (Phase 4)
│   │   └── proxyService.ts                     📝 Create (Phase 4)
│   │
│   ├── types/                                  # Type definitions
│   │   ├── common.types.ts                     📝 Create (Phase 1)
│   │   ├── credentials.types.ts                📝 Create (Phase 1)
│   │   ├── proxy.types.ts                      📝 Create (Phase 1)
│   │   └── index.ts                            📝 Create (Phase 1)
│   │
│   ├── hooks/                                  # Custom hooks
│   │   ├── useDarkMode.ts                      📝 Create (Phase 3)
│   │   ├── useAuth.ts                          📝 Create (Phase 3)
│   │   ├── useProxyControl.ts                  📝 Create (Phase 3)
│   │   └── useCredentialPolling.ts             📝 Create (Phase 3)
│   │
│   ├── lib/                                    # Core utilities
│   │   ├── utils.ts                            ✅ Created by shadcn
│   │   └── constants.ts                        📝 Create (Phase 5)
│   │
│   ├── utils/                                  # Helper utilities
│   │   ├── formatters.ts                       📝 Create (Phase 5)
│   │   └── string.utils.ts                     📝 Create (Phase 5)
│   │
│   ├── App.tsx                                 🔧 Modify (Phase 14)
│   ├── main.tsx                                ✅ Entry point
│   ├── index.css                               🔧 Add component CSS
│   └── vite-env.d.ts                           ✅ Vite types
│
├── .gitignore                                  ✅ Configured
├── index.html                                  ✅ Configured
├── package.json                                ✅ Configured
├── postcss.config.js                           ✅ Configured
├── tailwind.config.js                          ✅ Configured
├── tsconfig.json                               ✅ Configured
├── tsconfig.app.json                           ✅ Configured
├── tsconfig.node.json                          ✅ Configured
├── vite.config.ts                              ✅ Configured
└── README.md                                   ✅ Configured
```

**Legend**:
- ✅ Already exists
- 📝 Create in this implementation
- 🔧 Modify existing file

---

## Phase 1: Foundation - Types

**Priority**: P0 (CRITICAL - Foundation)
**Objective**: Create all type definitions matching backend API structure

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/types/common.types.ts`
**Purpose**: Shared types used across the application
**Responsibility**: Define UI state and status enums

**Key Types**:
- `UIState` - Theme state (simplified, no navigation)
- `ProxyStatus` - Status enum matching backend values
- `CredentialStatus` - Credential state enum

**Architecture Notes**:
- Simplified UIState (theme only, no sidebar/navigation for single page)
- Status types must match backend API exactly

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/types/credentials.types.ts`
**Purpose**: Types matching `/api/qwen/credentials` endpoints
**Responsibility**: Define credential data structures

**Key Types**:
- `QwenCredentials` - Maps to GET response (token, cookies, expiresAt, isExpired)
- `SetCredentialsRequest` - Maps to POST request body

**Architecture Notes**:
- Token and cookies are masked strings from backend
- expiresAt is Unix timestamp (number) or null
- isExpired is computed server-side

#### 3. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/types/proxy.types.ts`
**Purpose**: Types matching `/api/proxy/*` endpoints
**Responsibility**: Define proxy, provider, and model types

**Key Types**:
- `Provider` - Provider object from status endpoint
- `Model` - Model object from status endpoint
- `ProxyStatusResponse` - Complete response from GET `/api/proxy/status`
- `ProxyControlResponse` - Response from start/stop endpoints

**Architecture Notes**:
- ProxyStatusResponse includes providers, models, credentials, and proxy status
- This is the CRITICAL type - must match actual backend response structure exactly
- Providers and models are nested objects with items arrays

#### 4. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/types/index.ts`
**Purpose**: Central type export file
**Responsibility**: Re-export all types for easy importing

**Exports**:
- All types from common.types.ts
- All types from credentials.types.ts
- All types from proxy.types.ts

### Integration Points

**None** - Foundation types have no dependencies

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] All types match backend API exactly
- [ ] No `any` types used
- [ ] All types exported from index.ts
- [ ] Types use proper TypeScript conventions (interfaces for objects, types for unions)

**Code Reference**: See [Phase 1 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-1-foundation---types)

---

## Phase 2: Foundation - Stores

**Priority**: P0 (CRITICAL - Foundation)
**Objective**: Create all Zustand stores for state management

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/stores/useUIStore.ts`
**Purpose**: UI state management (theme only for simple dashboard)
**Responsibility**: Manage theme state with persistence

**State**:
- `uiState.theme` - 'light' | 'dark'

**Actions**:
- `setTheme(theme)` - Set specific theme
- `toggleTheme()` - Toggle between light and dark

**Persistence**: Yes, localStorage key `qwen-proxy-ui-state`

**Architecture Notes**:
- Simplified from doc 01A (no sidebar/navigation state for single page)
- Uses Zustand persist middleware for automatic localStorage sync
- Replaces ThemeContext pattern per doc 01A requirements

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/stores/useCredentialsStore.ts`
**Purpose**: Qwen credentials state
**Responsibility**: Store current credentials and loading state

**State**:
- `credentials` - QwenCredentials | null
- `loading` - boolean

**Actions**:
- `setCredentials(credentials)` - Update credentials
- `setLoading(loading)` - Update loading state

**Persistence**: No (runtime state only, refreshed from backend)

**Architecture Notes**:
- Simple store - business logic in useAuth hook
- Services handle API calls
- No persistence needed (always fetched fresh)

#### 3. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/stores/useProxyStore.ts`
**Purpose**: Proxy server state (includes providers and models)
**Responsibility**: Store proxy status with embedded providers/models data

**State**:
- `status` - ProxyStatusResponse | null
- `loading` - boolean

**Actions**:
- `setStatus(status)` - Update entire status object
- `setLoading(loading)` - Update loading state

**Persistence**: No (runtime state only, polled from backend)

**Architecture Notes**:
- Status object includes providers.items and models.items from backend
- No separate provider/model stores needed
- Polling hook refreshes this automatically

#### 4. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/stores/useAlertStore.ts`
**Purpose**: Alert/notification messages
**Responsibility**: Show success or error alerts

**State**:
- `alert` - { message: string, type: 'success' | 'error' } | null

**Actions**:
- `showAlert(message, type)` - Display alert
- `hideAlert()` - Dismiss alert

**Persistence**: No (transient UI state)

**Architecture Notes**:
- Simple notification system
- Can be enhanced with auto-dismiss timeout if needed
- Used by all API operations for user feedback

### Integration Points

**Types (Read)**:
- `@/types` - For QwenCredentials, ProxyStatusResponse, UIState

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] useUIStore persists to localStorage
- [ ] All stores follow Zustand patterns
- [ ] Selective subscription pattern supported
- [ ] No business logic in stores (just state and actions)
- [ ] Named exports used

**Code Reference**: See [Phase 2 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-2-foundation---stores)

---

## Phase 3: Foundation - Hooks

**Priority**: P0 (CRITICAL - Foundation)
**Objective**: Create custom hooks for business logic and side effects

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/hooks/useDarkMode.ts`
**Purpose**: Theme management hook (doc 01A lines 336-338)
**Responsibility**: Apply theme to DOM and provide toggle function

**Functionality**:
- Subscribe to useUIStore theme state
- Apply/remove 'dark' class on document.documentElement
- Return theme value and toggleTheme function

**Integration Points**:
- Uses `useUIStore` for theme state and actions
- Uses React useEffect for DOM manipulation

**Architecture Notes**:
- Required by doc 01A for theme management
- Replaces manual theme context logic
- Handles dark mode class application automatically

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/hooks/useAuth.ts`
**Purpose**: Authentication business logic
**Responsibility**: Handle connect and revoke credentials operations

**Functionality**:
- `handleConnect()` - Initiate credential connection flow (Electron vs Browser)
- `handleRevoke()` - Revoke credentials via API
- `loading` state during operations
- Error handling and alert display

**Integration Points**:
- Uses `credentialsService` for API calls
- Uses `useCredentialsStore` for state updates
- Uses `useAlertStore` for user feedback
- Detects Electron vs Browser environment

**Architecture Notes**:
- Extracted from AuthenticationCard per SRP
- Business logic separated from UI component
- Handles both Electron IPC and browser-extension flow

#### 3. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/hooks/useProxyControl.ts`
**Purpose**: Proxy control business logic
**Responsibility**: Handle proxy start and stop operations

**Functionality**:
- `handleStart()` - Start proxy servers via API
- `handleStop()` - Stop proxy servers via API
- `loading` state during operations
- Success/error handling with alerts

**Integration Points**:
- Uses `proxyService` for API calls
- Uses `useProxyStore` for state updates
- Uses `useAlertStore` for user feedback

**Architecture Notes**:
- Extracted from ProxyControlCard per SRP
- Handles API calls and state updates
- Provides clean interface to UI components

#### 4. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/hooks/useCredentialPolling.ts`
**Purpose**: Auto-refresh credentials and proxy status
**Responsibility**: Poll backend for status updates

**Functionality**:
- Fetch credentials on mount
- Fetch proxy status on mount
- Poll proxy status every 10 seconds
- Cleanup on unmount

**Integration Points**:
- Uses `credentialsService.getCredentials()`
- Uses `proxyService.getStatus()`
- Uses `useCredentialsStore.setCredentials()`
- Uses `useProxyStore.setStatus()`

**Architecture Notes**:
- Single hook for all polling needs
- Invoked once in HomePage
- Keeps dashboard data fresh automatically
- No manual refresh needed

### Integration Points

**Stores (Read/Write)**:
- `useUIStore` - Theme state (useDarkMode)
- `useCredentialsStore` - Credentials state (useAuth, useCredentialPolling)
- `useProxyStore` - Proxy state (useProxyControl, useCredentialPolling)
- `useAlertStore` - Alert messages (useAuth, useProxyControl)

**Services (Call)**:
- `credentialsService` - API calls (useAuth, useCredentialPolling)
- `proxyService` - API calls (useProxyControl, useCredentialPolling)

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] useDarkMode applies dark class correctly
- [ ] useAuth handles both Electron and browser modes
- [ ] useProxyControl handles start/stop operations
- [ ] useCredentialPolling refreshes data automatically
- [ ] Error handling in all hooks
- [ ] Named exports used

**Code Reference**: See [Phase 3 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-3-foundation---hooks)

---

## Phase 4: Foundation - Services

**Priority**: P0 (CRITICAL - Foundation)
**Objective**: Create API service layers for backend communication

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/services/credentialsService.ts`
**Purpose**: API calls for `/api/qwen/credentials` endpoints
**Responsibility**: Handle all credential-related API operations

**Methods**:
- `getCredentials()` - GET current credentials (returns QwenCredentials)
- `setCredentials(request)` - POST new credentials (returns success response)
- `revokeCredentials()` - DELETE credentials (returns success response)
- `isElectron()` - Detect if running in Electron environment

**Architecture Notes**:
- Pure functions, no state management
- Uses fetch API for HTTP calls
- Error handling and response parsing
- Returns typed responses matching backend API
- camelCase naming per doc 01A

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/services/proxyService.ts`
**Purpose**: API calls for `/api/proxy/*` endpoints
**Responsibility**: Handle all proxy control API operations

**Methods**:
- `getStatus()` - GET proxy status (returns ProxyStatusResponse with providers/models)
- `startProxy()` - POST start proxy (returns ProxyControlResponse)
- `stopProxy()` - POST stop proxy (returns ProxyControlResponse)

**Architecture Notes**:
- Pure functions, no state management
- Uses fetch API for HTTP calls
- Error handling and response parsing
- Returns typed responses matching backend API
- Status response includes providers and models data

### Integration Points

**Types (Read)**:
- `@/types` - For request/response type definitions

**External APIs**:
- Backend REST API at `/api/qwen/*` and `/api/proxy/*`

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] All methods return properly typed responses
- [ ] Error handling for network failures
- [ ] Response parsing handles edge cases
- [ ] isElectron() detection works correctly
- [ ] Named exports used
- [ ] camelCase naming (NOT kebab-case)

**Code Reference**: See [Phase 4 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-4-foundation---services)

---

## Phase 5: Foundation - Utilities

**Priority**: P0 (CRITICAL - Foundation)
**Objective**: Create utility functions for formatting and validation

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/lib/constants.ts`
**Purpose**: Application constants (doc 01A lines 341-342)
**Responsibility**: Central location for app-wide constants

**Constants**:
- `APP_NAME` - Application title
- `APP_VERSION` - Version number
- `TITLEBAR_HEIGHT` - Title bar height in pixels
- `STATUSBAR_HEIGHT` - Status bar height in pixels
- Other UI-related constants

**Architecture Notes**:
- Single source of truth for constants
- Easy to update globally
- Type-safe constant values

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/utils/formatters.ts`
**Purpose**: Formatting utilities (doc 01A lines 344-346)
**Responsibility**: Format data for display

**Functions**:
- `formatBytes(bytes)` - Convert bytes to readable format (KB, MB, GB)
- `formatDuration(ms)` - Convert milliseconds to readable duration
- `formatDate(date)` - Format dates for display
- `formatUptime(ms)` - Format uptime as "Xh Ym" or "Xm Ys"

**Architecture Notes**:
- Pure functions, no side effects
- Handle edge cases (0, null, undefined)
- Consistent formatting across app

#### 3. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/utils/string.utils.ts`
**Purpose**: String manipulation utilities
**Responsibility**: String truncation and masking

**Functions**:
- `truncateToken(token)` - Show first/last few characters of token
- `truncateCookies(cookies)` - Truncate long cookie strings
- `truncateString(str, length)` - Generic truncation with ellipsis

**Architecture Notes**:
- Used by CredentialsDetailCard for display
- Prevents UI overflow from long strings
- Security-friendly (shows partial data only)

### Integration Points

**None** - Utility functions are pure and self-contained

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] All functions handle edge cases (null, 0, empty string)
- [ ] Formatting is consistent and readable
- [ ] Truncation preserves enough info to be useful
- [ ] Named exports used

**Code Reference**: See [Phase 5 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-5-foundation---utilities)

---

## Phase 6: UI Components - shadcn Installation

**Priority**: P1 (UI Foundation)
**Objective**: Install required shadcn/ui components

### Files to Create

#### 1. Install shadcn Badge Component
**Command**: `npx shadcn@latest add badge`
**Creates**: `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/ui/badge.tsx`

**Purpose**: Base badge component for status indicators
**Usage**: Will be wrapped by StatusBadge component

#### 2. Install shadcn Alert Component
**Command**: `npx shadcn@latest add alert`
**Creates**: `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/ui/alert.tsx`

**Purpose**: Base alert component for notifications
**Usage**: Will be used by StatusAlert component

### Integration Points

**Existing shadcn Components** (already installed):
- button.tsx
- card.tsx
- input.tsx
- label.tsx
- dialog.tsx
- popover.tsx
- command.tsx

### Validation Checklist

- [ ] Both components install successfully
- [ ] TypeScript compiles without errors
- [ ] Components render in Storybook/test page
- [ ] Variants work correctly (default, destructive, outline, etc.)

**Code Reference**: See [Phase 6 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-6-ui-components---shadcn-installation)

---

## Phase 7: UI Components - Wrappers

**Priority**: P1 (UI Foundation)
**Objective**: Create app-specific wrapper components around shadcn primitives

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/ui/status-badge.tsx`
**Purpose**: Application-specific status badge wrapper
**Responsibility**: Map application status types to badge variants and colors

**Props**:
- `status` - 'active' | 'inactive' | 'expired' | 'running' | 'stopped'
- `children` - Optional custom text

**Functionality**:
- Maps status to appropriate badge variant
- Applies correct colors using theme variables
- Provides consistent status display across app

**Integration Points**:
- Uses shadcn `Badge` component
- Uses theme variables for colors

**Architecture Notes**:
- Wrapper component per doc 01A pattern
- Centralizes status display logic
- Type-safe status values

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/ui/environment-badge.tsx`
**Purpose**: Desktop/Browser mode indicator
**Responsibility**: Show current environment with visual indicator

**Props**: None (auto-detects environment)

**Functionality**:
- Detects Electron vs Browser using credentialsService.isElectron()
- Shows animated pulse indicator
- Displays "Desktop Mode" or "Browser Mode"
- Uses appropriate colors (purple for desktop, blue for browser)

**Integration Points**:
- Uses shadcn `Badge` component
- Uses `credentialsService.isElectron()`
- Uses theme variables for colors

**Architecture Notes**:
- Zero-config component
- Auto-detects environment
- Visual feedback for user

### Integration Points

**shadcn Components**:
- `@/components/ui/badge` - Base badge component

**Services**:
- `@/services/credentialsService` - For isElectron() detection

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] StatusBadge shows correct colors for each status
- [ ] EnvironmentBadge detects mode correctly
- [ ] Both components use theme variables only
- [ ] Named exports used

**Code Reference**: See [Phase 7 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-7-ui-components---wrappers)

---

## Phase 8: Feature Components - Alerts

**Priority**: P2 (Features)
**Objective**: Create alert notification system component

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/alerts/StatusAlert.tsx`
**Purpose**: Display success/error alert messages
**Responsibility**: Show alerts from useAlertStore with dismiss functionality

**Props**: None (reads from store)

**Functionality**:
- Subscribes to useAlertStore for alert state
- Renders shadcn Alert with appropriate variant
- Shows success icon (CheckCircle) or error icon (XCircle)
- Includes close button to dismiss
- Returns null when no alert to show

**UI Structure**:
- Alert container with variant (default for success, destructive for error)
- Flex layout with icon, message, and close button
- Close button dismisses alert

**Integration Points**:
- `@/stores/useAlertStore` - For alert state and hideAlert()
- `@/components/ui/alert` - Base alert component
- `@/components/ui/button` - For close button
- `lucide-react` - For icons

**Architecture Notes**:
- Simple component under 30 lines
- Conditionally renders based on store state
- Uses theme variables for colors

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] Renders conditionally (null when no alert)
- [ ] Success and error variants styled correctly
- [ ] Close button dismisses alert
- [ ] Component is under 30 lines
- [ ] Named export used

**Code Reference**: See [Phase 8 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-8-feature-components---alerts)

---

## Phase 9: Feature Components - Credentials

**Priority**: P2 (Features)
**Objective**: Create credentials detail display component

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/credentials/CredentialsDetailCard.tsx`
**Purpose**: Display current credentials with truncation
**Responsibility**: Show token, cookies, and expiration in card format

**Props**: None (reads from store)

**Functionality**:
- Subscribes to useCredentialsStore for credentials
- Shows truncated token using truncateToken()
- Shows truncated cookies using truncateCookies()
- Shows formatted expiration date
- Returns null if no credentials

**UI Structure**:
- Card with header (icon + title)
- Content with three sections: Token, Cookies, Expiration
- Each section has label and truncated value
- Monospace font for token/cookies values

**Integration Points**:
- `@/stores/useCredentialsStore` - For credentials state
- `@/components/ui/card` - Base card components
- `@/utils/string.utils` - For truncation functions
- `lucide-react` - For FileText icon

**Architecture Notes**:
- Read-only display component
- Secure display (truncated values)
- Clean card-based layout

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] Renders conditionally (null when no credentials)
- [ ] Token truncation works correctly
- [ ] Cookies truncation works correctly
- [ ] Date formatting is readable
- [ ] Named export used

**Code Reference**: See [Phase 9 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-9-feature-components---credentials)

---

## Phase 10: Feature Components - Stats and Guide

**Priority**: P2 (Features)
**Objective**: Create system stats overview and quick guide cards

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/stats/SystemStatsCard.tsx`
**Purpose**: Display system status overview in grid layout
**Responsibility**: Show credentials, proxy, providers, and models status

**Props**: None (reads from stores)

**Functionality**:
- Shows 4-column grid: Credentials | Proxy | Providers | Models
- Credentials section: Shows active/inactive/expired badge
- Proxy section: Shows running/stopped badge, port if running
- Providers section: Shows count (enabled/total) from status.providers
- Models section: Shows count (total) from status.models

**UI Structure**:
- Card with header (Activity icon + title)
- 4-column grid layout
- Each section has label, badge, and details
- StatusBadge for visual indicators

**Integration Points**:
- `@/stores/useCredentialsStore` - For credential status
- `@/stores/useProxyStore` - For proxy status, providers, models data
- `@/components/ui/card` - Base card components
- `@/components/ui/status-badge` - For status indicators
- `lucide-react` - For Activity icon

**Architecture Notes**:
- Central dashboard overview
- All data from stores
- Responsive grid layout

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/stats/ConnectionGuideCard.tsx`
**Purpose**: Quick start guide for users
**Responsibility**: Display step-by-step connection instructions

**Props**: None (static content)

**Functionality**:
- Shows 3 numbered steps
- Step 1: Install browser extension
- Step 2: Connect to Qwen
- Step 3: Start proxy server
- Static content, no dynamic data

**UI Structure**:
- Card with header (BookOpen icon + title)
- Ordered list with numbered steps
- Clear, concise instructions

**Integration Points**:
- `@/components/ui/card` - Base card components
- `lucide-react` - For BookOpen icon

**Architecture Notes**:
- Static component, no store access
- Helps new users get started
- Simple and clear instructions

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] SystemStatsCard grid layout responsive
- [ ] Status badges display correctly
- [ ] Providers/models counts show from proxy status
- [ ] ConnectionGuideCard steps are clear
- [ ] Both components use theme variables
- [ ] Named exports used

**Code Reference**: See [Phase 10 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-10-feature-components---stats-and-guide)

---

## Phase 11: Feature Components - Providers and Models

**Priority**: P2 (Features)
**Objective**: Create read-only lists for providers and models from status endpoint

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/providers/ProvidersListCard.tsx`
**Purpose**: Display list of enabled providers (read-only)
**Responsibility**: Show providers from proxy status endpoint

**Props**: None (reads from store)

**Functionality**:
- Subscribes to useProxyStore for status.providers
- Shows count in header: "Providers (enabled / total)"
- Displays list of enabled providers only
- For each provider: name, base URL, enabled badge
- Shows "No providers enabled" if empty

**UI Structure**:
- Card with header (Server icon + title with count)
- List of enabled providers
- Each item: StatusBadge + provider name + base URL
- Empty state message

**Integration Points**:
- `@/stores/useProxyStore` - For status.providers data
- `@/components/ui/card` - Base card components
- `@/components/ui/status-badge` - For enabled indicator
- `@/types` - For Provider type
- `lucide-react` - For Server icon

**Architecture Notes**:
- READ-ONLY display (no edit/delete)
- Data comes from proxy status endpoint
- No separate provider management

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/models/ModelsListCard.tsx`
**Purpose**: Display list of available models (read-only)
**Responsibility**: Show models from proxy status endpoint

**Props**: None (reads from store)

**Functionality**:
- Subscribes to useProxyStore for status.models
- Shows count in header: "Models (total)"
- Displays list of all models
- For each model: name, provider ID
- Shows "No models available" if empty

**UI Structure**:
- Card with header (Layers icon + title with count)
- List of models
- Each item: model name + provider ID
- Empty state message

**Integration Points**:
- `@/stores/useProxyStore` - For status.models data
- `@/components/ui/card` - Base card components
- `@/types` - For Model type
- `lucide-react` - For Layers icon

**Architecture Notes**:
- READ-ONLY display (no edit/delete)
- Data comes from proxy status endpoint
- No separate model management

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] ProvidersListCard shows enabled providers
- [ ] ModelsListCard shows all models
- [ ] Counts display correctly in headers
- [ ] Empty states handled gracefully
- [ ] No CRUD operations exposed (read-only)
- [ ] Named exports used

**Code Reference**: See [Phase 11 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-11-feature-components---providers-and-models)

---

## Phase 12: Feature Components - Authentication

**Priority**: P2 (Features)
**Objective**: Create consolidated authentication card component

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/authentication/AuthenticationCard.tsx`
**Purpose**: CONSOLIDATED authentication card (all logic inline)
**Responsibility**: Handle credential connection and revocation in one component

**Props**: None (reads from stores and hooks)

**Functionality**:
- Uses useAuth() hook for handleConnect(), handleRevoke(), loading state
- Uses useCredentialsStore() for credentials and status
- Shows status badge (active/inactive/expired)
- Shows expiration date if credentials exist
- Connect button (becomes "Re-authenticate" when credentials exist)
- Revoke button (only shows when credentials exist)
- Footer with mode-specific instructions (Electron vs Browser)

**UI Structure**:
- Card with header (Lock icon + title + StatusBadge)
- Content area with expiration display
- Button row (Connect/Re-authenticate + Revoke)
- Footer with instructions based on environment

**Integration Points**:
- `@/hooks/useAuth` - For handleConnect(), handleRevoke(), loading
- `@/stores/useCredentialsStore` - For credentials state
- `@/services/credentialsService` - For isElectron() detection
- `@/components/ui/card` - Base card components
- `@/components/ui/button` - For action buttons
- `@/components/ui/status-badge` - For status display
- `lucide-react` - For Lock, Info icons

**Architecture Notes**:
- CONSOLIDATED component (80-100 lines)
- NO child components (AuthButtons, AuthCardFooter, etc.)
- All UI inline using custom CSS classes
- Business logic from useAuth hook
- Mode-specific instructions inline

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] Component is consolidated (no child files)
- [ ] Uses useAuth hook correctly
- [ ] Status badge updates correctly
- [ ] Buttons disabled during loading
- [ ] Mode-specific instructions show correctly
- [ ] Component is 80-100 lines
- [ ] Named export used

**Code Reference**: See [Phase 12 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-12-feature-components---authentication)

---

## Phase 13: Feature Components - Proxy

**Priority**: P2 (Features)
**Objective**: Create consolidated proxy control card component

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/components/features/proxy/ProxyControlCard.tsx`
**Purpose**: CONSOLIDATED proxy control card (all logic inline)
**Responsibility**: Handle proxy start/stop and status display in one component

**Props**: None (reads from stores and hooks)

**Functionality**:
- Uses useProxyControl() hook for handleStart(), handleStop()
- Uses useCredentialPolling() for status updates
- Uses useProxyStore() for proxy status
- Shows status badge (running/stopped)
- Shows proxy info grid (port, status, uptime)
- Start/Stop buttons
- Endpoint URL display with copy button (when running)

**UI Structure**:
- Card with header (Server icon + title + StatusBadge)
- Proxy info grid (port, status, uptime)
- Button row (Start + Stop)
- Endpoint URL section (conditional, when running)
  - URL display in code block
  - Copy button

**Integration Points**:
- `@/hooks/useProxyControl` - For handleStart(), handleStop()
- `@/hooks/useCredentialPolling` - For status updates
- `@/stores/useProxyStore` - For proxy status
- `@/stores/useAlertStore` - For copy success alert
- `@/components/ui/card` - Base card components
- `@/components/ui/button` - For action buttons
- `@/components/ui/status-badge` - For running/stopped status
- `@/utils/formatters` - For formatUptime()
- `lucide-react` - For Server, Copy icons

**Architecture Notes**:
- CONSOLIDATED component (80-100 lines)
- NO child components (ProxyInfoGrid, ProxyControlButtons, etc.)
- All UI inline using custom CSS classes
- Business logic from hooks
- Uptime calculation from status.uptime

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] Component is consolidated (no child files)
- [ ] Status polling works (via useCredentialPolling)
- [ ] Start/Stop buttons work correctly
- [ ] Uptime calculation accurate
- [ ] Copy to clipboard works
- [ ] Endpoint only shows when running
- [ ] Component is 80-100 lines
- [ ] Named export used

**Code Reference**: See [Phase 13 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-13-feature-components---proxy)

---

## Phase 14: Pages

**Priority**: P3 (Integration)
**Objective**: Create dashboard page and integrate into App

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/pages/HomePage.tsx`
**Purpose**: Main dashboard page composing all features
**Responsibility**: Layout and compose all feature components

**Props**: None

**Functionality**:
- Initiates useCredentialPolling() for auto-refresh
- Renders StatusAlert at top
- Shows page header with title and EnvironmentBadge
- 2-column layout (main + sidebar)
- Main column (2/3 width): Auth, Proxy, Credentials, Providers/Models
- Sidebar column (1/3 width): Stats, Guide

**UI Structure**:
- Container with padding
- StatusAlert (conditional)
- Page header section
- 2-column grid (responsive)
  - Main column: AuthenticationCard, ProxyControlCard, CredentialsDetailCard, Providers/Models grid
  - Sidebar column: SystemStatsCard, ConnectionGuideCard

**Integration Points**:
- `@/hooks/useCredentialPolling` - For auto-refresh
- All feature components from previous phases
- `@/components/ui/environment-badge`

**Architecture Notes**:
- NO business logic (just composition)
- Responsive grid layout
- Single page (no navigation)
- Polling initiated here

### Files to Modify

#### 2. `/Users/chris/Projects/qwen_proxy_poc/frontend-v2/src/App.tsx`
**Purpose**: Update to use HomePage
**Responsibility**: Integrate HomePage into AppLayout

**Changes Required**:
- Import HomePage
- Replace placeholder content with HomePage
- Keep AppLayout wrapper
- Apply useDarkMode hook

**Before/After**:
- Before: Placeholder div with "Hello World"
- After: HomePage component inside AppLayout

**Integration Points**:
- `@/components/layout/AppLayout`
- `@/pages/HomePage`
- `@/hooks/useDarkMode`

### Validation Checklist

- [ ] TypeScript compiles without errors
- [ ] All components render in correct layout
- [ ] Credential polling initiates automatically
- [ ] Responsive grid (stacks on mobile)
- [ ] StatusAlert appears when triggered
- [ ] EnvironmentBadge shows correct mode
- [ ] Named exports used

**Code Reference**: See [Phase 14 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-14-pages)

---

## Phase 15: Public Assets

**Priority**: P4 (Documentation)
**Objective**: Create Chrome extension installation instructions

### Files to Create

#### 1. `/Users/chris/Projects/qwen_proxy_poc/public/extension-install.html`
**Purpose**: Step-by-step guide for installing Chrome extension
**Responsibility**: Provide clear installation instructions for browser users

**Content Sections**:
- Title and introduction
- Prerequisites (Chrome browser, Qwen Proxy running)
- Installation steps (numbered 1-5)
  - Download extension
  - Open Chrome extensions page
  - Enable Developer Mode
  - Load unpacked extension
  - Grant permissions
- Verification section (how to verify installation)
- Troubleshooting section (common issues)
- Link back to dashboard

**Format**: Static HTML page with inline CSS

**Integration Points**:
- None (static HTML served from public directory)

**Architecture Notes**:
- Accessible from browser at `/extension-install.html`
- Used by browser mode users
- Simple, clear, step-by-step instructions

### Validation Checklist

- [ ] HTML is valid
- [ ] Instructions are clear and accurate
- [ ] Page is accessible from browser
- [ ] Links work correctly
- [ ] Styling is simple and readable

**Code Reference**: See [Phase 15 in doc 63](./63-FRONTEND_V2_CODE_REFERENCE.md#phase-15-public-assets)

---

## Success Criteria

### Functional Requirements

- [ ] All 32 files created successfully
- [ ] TypeScript compilation succeeds with no errors
- [ ] All components render without errors
- [ ] Credential management workflow works end-to-end (connect/revoke)
- [ ] Proxy control workflow works end-to-end (start/stop)
- [ ] Alerts display correctly for success/error states
- [ ] Theme switching works (light/dark mode)
- [ ] Responsive layout works on different screen sizes
- [ ] Both Electron and browser modes supported
- [ ] Auto-refresh polling keeps data current

### Architecture Requirements (doc 01A Compliance)

**Critical CSS Requirements**:
- [ ] ZERO inline Tailwind classes in ANY component (doc 01A lines 24-29)
- [ ] ALL styling defined in index.css using custom CSS classes
- [ ] ONLY theme variables used for colors (doc 01A lines 31-36)
- [ ] Custom CSS naming follows `.component-element-modifier` pattern

**State Management**:
- [ ] useUIStore implemented for theme state
- [ ] useCredentialsStore implemented for credentials
- [ ] useProxyStore implemented for proxy/providers/models
- [ ] useAlertStore implemented for notifications
- [ ] All stores use Zustand with selective subscriptions
- [ ] Persistence via Zustand persist middleware (NOT manual localStorage)

**Component Architecture**:
- [ ] Pages composed of feature components (NO business logic in pages)
- [ ] Feature components access stores directly (NO prop drilling)
- [ ] Business logic extracted to hooks and services
- [ ] Named exports used throughout (NOT default exports)
- [ ] Import paths use `@/` alias (NOT relative paths)

**Simplified Layout** (single page dashboard):
- [ ] AppLayout root container exists
- [ ] TitleBar with theme toggle exists
- [ ] StatusBar with status info exists
- [ ] NO Sidebar component (not needed)
- [ ] NO MainContent wrapper (not needed)
- [ ] NO navigation system (single page only)

**Type Safety**:
- [ ] All types defined in `types/` directory
- [ ] No `any` types used anywhere
- [ ] Types match backend API exactly
- [ ] Type imports use `import type` where applicable

**Utilities**:
- [ ] formatters.ts created with required functions
- [ ] validators.ts created (if needed)
- [ ] constants.ts created in lib/
- [ ] string.utils.ts created for truncation

### Code Quality

- [ ] SRP followed (single responsibility per component)
- [ ] DRY followed (no duplicate code)
- [ ] Domain-driven design patterns used
- [ ] Consistent naming conventions throughout
- [ ] Proper error handling in all async operations
- [ ] Loading states for all async actions
- [ ] Type safety enforced (no `any` types)

### Testing Checklist

**Credentials Management**:
- [ ] Connect to Qwen (Electron mode) works
- [ ] Connect to Qwen (Browser mode) shows instructions
- [ ] Revoke credentials works
- [ ] Credential status updates correctly
- [ ] Expiration display accurate

**Proxy Control**:
- [ ] Start proxy server works
- [ ] Stop proxy server works
- [ ] Proxy status updates correctly
- [ ] Uptime display accurate
- [ ] Copy endpoint URL works

**Data Display**:
- [ ] Providers list displays from status endpoint
- [ ] Models list displays from status endpoint
- [ ] Counts are accurate
- [ ] Empty states handled gracefully

**UI/UX**:
- [ ] Alerts show for success/error
- [ ] Theme toggle works correctly
- [ ] Dark mode applies to all components
- [ ] Polling updates data automatically
- [ ] Environment badge shows correct mode
- [ ] Responsive layout works on mobile

---

## Anti-Patterns to Avoid

### Critical Violations - DO NOT

**1. Use Inline Tailwind Classes** (doc 01A lines 24-29, 395-419)
- Wrong: `<div className="flex items-center gap-3">`
- Correct: `<div className="feature-header">` (defined in index.css)

**2. Use Hardcoded Colors** (doc 01A lines 31-36, 469-519)
- Wrong: `text-white`, `bg-gray-100`, `text-red-500`
- Correct: `text-foreground`, `bg-background`, `text-destructive`

**3. Mix Inline Tailwind with Custom Classes**
- Wrong: `<div className="my-component flex items-center">`
- Correct: `<div className="my-component">` (all styles in index.css)

**4. Put Business Logic in Components**
- Wrong: Complex logic, API calls, validation in components
- Correct: Extract to services and hooks

**5. Use Default Exports**
- Wrong: `export default function MyComponent()`
- Correct: `export function MyComponent()`

**6. Use `any` Type**
- Wrong: `function processData(data: any)`
- Correct: Define proper interfaces in types/

**7. Prop Drilling**
- Wrong: Passing props through multiple levels
- Correct: Direct store access via Zustand

**8. Manual localStorage**
- Wrong: `localStorage.setItem()` in components
- Correct: Zustand persist middleware

### Mandatory Practices - DO

**1. Define ALL Styling in index.css**
- Use `@apply` directive with Tailwind utilities
- Follow naming: `.component-element-modifier`
- Use theme variables only

**2. Selective Zustand Subscriptions**
- Correct: `const theme = useUIStore((state) => state.uiState.theme)`
- Wrong: `const store = useUIStore(); const theme = store.uiState.theme`

**3. Use `@/` Path Alias**
- Correct: `import { useUIStore } from '@/stores/useUIStore'`
- Wrong: `import { useUIStore } from '../../stores/useUIStore'`

**4. Named Exports**
- Correct: `export function MyComponent() {}`
- Wrong: `export default function MyComponent() {}`

**5. Define Types in types/ Directory**
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

**To Install** (Phase 6): badge, alert

---

## Development Workflow

### Starting a New Phase

1. **Read phase requirements** - Understand what needs to be built
2. **Check doc 63** - Reference code implementations
3. **Verify dependencies** - Ensure previous phases complete
4. **Create types first** - Define interfaces before implementation
5. **Define CSS classes** - Add to index.css before creating components
6. **Build incrementally** - One file at a time, test as you go
7. **Validate checklist** - Ensure all requirements met
8. **Test thoroughly** - Verify functionality and integration

### Code Review Checklist

**Before Committing**:
- [ ] No inline Tailwind classes
- [ ] All CSS in index.css
- [ ] Only theme variables for colors
- [ ] TypeScript strict mode passes
- [ ] No `any` types
- [ ] Named exports used
- [ ] `@/` path alias used
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Manual testing complete

---

## Summary

This implementation plan defines **15 phases** to build a complete single-page dashboard:

**Foundation (P0)**: 17 files
- Types, stores, hooks, services, utilities

**UI Components (P1)**: 4 files
- shadcn installations and app-specific wrappers

**Features (P2)**: 9 files
- Alert system, credentials, stats, providers, models, auth, proxy

**Pages (P3)**: 2 files
- HomePage and App integration

**Assets (P4)**: 1 file
- Extension installation guide

**Total**: 32 files following strict architecture guidelines

**Key Principles**:
- NO code in this document (see doc 63 for implementations)
- ALL styling in index.css (no inline Tailwind)
- Theme variables only (no hardcoded colors)
- Zustand for state management
- Single page dashboard (no complex navigation)
- SRP, DRY, and type safety throughout

**Next Steps**:
1. Review this plan completely
2. Reference doc 63 for code implementations
3. Follow doc 01A architecture requirements
4. Execute phases sequentially
5. Validate at each step

---

**For Code Implementations**: See [63-FRONTEND_V2_CODE_REFERENCE.md](./63-FRONTEND_V2_CODE_REFERENCE.md)

**For Architecture Requirements**: See [01A-ARCHITECTURE_GUIDE.md](./01A-ARCHITECTURE_GUIDE.md)
