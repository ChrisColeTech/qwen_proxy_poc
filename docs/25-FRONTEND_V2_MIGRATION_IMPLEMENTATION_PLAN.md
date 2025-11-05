# 25-FRONTEND_V2_MIGRATION_IMPLEMENTATION_PLAN

## Work Progression Tracking

| Phase | Priority | Status | Files Created | Files Modified | Critical Issues Resolved |
|-------|----------|--------|---------------|----------------|-------------------------|
| Phase 1A: Core Infrastructure Setup | P0 | ⬜ Not Started | 8 | 3 | Project configuration, dependencies |
| Phase 1B: Type System Foundation | P0 | ✅ Complete | 10 | 0 | Type safety, IntelliSense |
| Phase 1C: API Service Layer | P0 | ⬜ Not Started | 2 | 0 | API communication foundation |
| Phase 1D: Utility Functions | P0 | ⬜ Not Started | 4 | 0 | Shared utility logic |
| Phase 2A: State Management (Zustand Stores) | P1 | ✅ Complete | 6 | 0 | Centralized state management |
| Phase 2B: React Query Hooks | P1 | ⬜ Not Started | 6 | 0 | Data fetching and caching |
| Phase 3A: UI Component Library (shadcn/ui) | P2 | ⬜ Not Started | 15 | 1 | Reusable UI primitives |
| Phase 3B: Common Shared Components | P2 | ⬜ Not Started | 8 | 0 | Application-specific shared components |
| Phase 3C: Layout Components | P2 | ⬜ Not Started | 4 | 0 | Page structure components |
| Phase 4A: Providers Domain Pages | P3 | ⬜ Not Started | 5 | 0 | Providers CRUD functionality |
| Phase 4B: Models Domain Pages | P3 | ⬜ Not Started | 5 | 0 | Models CRUD functionality |
| Phase 4C: Sessions Domain Pages (Read-Only) | P3 | ⬜ Not Started | 2 | 0 | Sessions viewing |
| Phase 4D: Requests Domain Pages (Read-Only) | P3 | ⬜ Not Started | 2 | 0 | Requests viewing |
| Phase 4E: Settings Page | P3 | ⬜ Not Started | 3 | 0 | Application settings |
| Phase 4F: Activity/Dashboard Page | P3 | ⬜ Not Started | 2 | 0 | Home/overview page |
| Phase 5: Integration and Testing | P4 | ⬜ Not Started | 0 | 2 | Electron integration, root config |
| Phase 6: Migration Cutover | P5 | ✅ Complete | 0 | 2 | Replace old frontend |

**Legend:** ✅ Complete | 🟡 In Progress | ⬜ Not Started

---

## Overview

This implementation plan covers the complete migration from `frontend/` to `frontend/` with a clean, properly architected React + TypeScript application following domain-driven design, SRP, and DRY principles.

### Objectives

1. **Clean Architecture**: Establish proper separation of concerns
2. **Type Safety**: Complete TypeScript coverage with strict mode
3. **Maintainability**: Follow SRP and DRY principles
4. **Testability**: Structure code for easy testing
5. **Performance**: Optimize bundle size and runtime performance
6. **Developer Experience**: Excellent IntelliSense and error messages

### Guiding Principles

1. **Foundation First**: Build infrastructure (types, services, utils) before UI
2. **Domain-Driven Design**: Organize by business domain
3. **Single Responsibility Principle**: One purpose per module
4. **Don't Repeat Yourself**: Shared utilities and components
5. **Progressive Enhancement**: Each phase builds on previous work
6. **API Contract Consistency**: Match backend `/api/*` routes exactly

### Technology Stack

- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: Zustand (with persist middleware)
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS + CSS Modules
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Validation**: Zod

---

## Project Structure (Final State)

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios/fetch wrapper
│   │   └── endpoints.ts           # API endpoint definitions
│   ├── components/
│   │   ├── common/                # Shared application components
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   └── Timestamp.tsx
│   │   ├── layout/                # Layout components
│   │   │   ├── PageLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── providers/             # Provider domain components
│   │   │   ├── ProviderForm.tsx
│   │   │   └── ProviderStatusBadge.tsx
│   │   ├── models/                # Model domain components
│   │   │   ├── ModelForm.tsx
│   │   │   └── CapabilitiesList.tsx
│   │   ├── settings/              # Settings components
│   │   │   ├── SettingsSection.tsx
│   │   │   └── SettingItem.tsx
│   │   ├── table/                 # Table components
│   │   │   └── DataTable.tsx
│   │   └── ui/                    # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── table.tsx
│   │       └── ... (other shadcn components)
│   ├── hooks/
│   │   ├── useProviders.ts
│   │   ├── useModels.ts
│   │   ├── useSessions.ts
│   │   ├── useRequests.ts
│   │   ├── useActivity.ts
│   │   └── useSettings.ts
│   ├── pages/
│   │   ├── activity/
│   │   │   └── ActivityPage.tsx
│   │   ├── providers/
│   │   │   ├── ProvidersListPage.tsx
│   │   │   ├── ProviderCreatePage.tsx
│   │   │   ├── ProviderEditPage.tsx
│   │   │   └── ProviderReadPage.tsx
│   │   ├── models/
│   │   │   ├── ModelsListPage.tsx
│   │   │   ├── ModelCreatePage.tsx
│   │   │   ├── ModelEditPage.tsx
│   │   │   └── ModelReadPage.tsx
│   │   ├── sessions/
│   │   │   ├── SessionsListPage.tsx
│   │   │   └── SessionReadPage.tsx
│   │   ├── requests/
│   │   │   ├── RequestsListPage.tsx
│   │   │   └── RequestReadPage.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   ├── stores/
│   │   ├── uiStore.ts             # UI state (theme, navigation)
│   │   ├── providerStore.ts       # Providers state
│   │   ├── modelStore.ts          # Models state
│   │   ├── sessionStore.ts        # Sessions state (optional)
│   │   ├── requestStore.ts        # Requests state (optional)
│   │   └── settingsStore.ts       # Settings state
│   ├── types/
│   │   ├── api.types.ts           # API response types
│   │   ├── common.types.ts        # Shared types
│   │   ├── provider.types.ts      # Provider domain types
│   │   ├── model.types.ts         # Model domain types
│   │   ├── session.types.ts       # Session types
│   │   ├── request.types.ts       # Request types
│   │   ├── activity.types.ts      # Activity types
│   │   ├── settings.types.ts      # Settings types
│   │   └── ui.types.ts            # UI state types
│   ├── utils/
│   │   ├── date.utils.ts          # Date formatting utilities
│   │   ├── string.utils.ts        # String utilities
│   │   ├── validation.utils.ts    # Validation helpers
│   │   └── cn.ts                  # className utility
│   ├── styles/
│   │   ├── globals.css            # Global styles and Tailwind
│   │   └── themes.css             # Theme variables
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   └── vite-env.d.ts              # Vite types
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── components.json                # shadcn/ui config
└── README.md
```

---

## Phase 1A: Core Infrastructure Setup

**Priority:** P0
**Dependencies:** None
**Objective:** Set up project configuration, dependencies, and build tooling

### Files Created

1. `frontend/package.json` (modified)
2. `frontend/tsconfig.json`
3. `frontend/vite.config.ts`
4. `frontend/tailwind.config.js`
5. `frontend/postcss.config.js`
6. `frontend/components.json`
7. `frontend/src/styles/globals.css`
8. `frontend/src/styles/themes.css`

### Files Modified

1. `frontend/package.json` - Add dependencies
2. `frontend/tsconfig.json` - Configure TypeScript strict mode
3. `frontend/index.html` - Update title and meta

### Dependencies to Install

```bash
# Core dependencies
npm install react react-dom
npm install -D @types/react @types/react-dom

# Routing & State
npm install zustand
npm install @tanstack/react-query

# UI & Styling
npm install tailwindcss postcss autoprefixer
npm install clsx tailwind-merge
npm install lucide-react
npm install class-variance-authority

# Utilities
npm install date-fns
npm install zod

# shadcn/ui (installed via CLI)
npx shadcn-ui@latest init
```

### TypeScript Configuration

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite Configuration

**`vite.config.ts`:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
```

### Global Styles

**`src/styles/globals.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other CSS variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark theme variables */
  }
}
```

### Integration Points

- **Electron**: Will load `http://localhost:5173` in development
- **API Backend**: All API calls to `http://localhost:3002/api/*`

---

## Phase 1B: Type System Foundation

**Priority:** P0
**Dependencies:** Phase 1A
**Objective:** Define comprehensive TypeScript types for the entire application

### Files Created

1. `src/types/api.types.ts` - API response wrappers
2. `src/types/common.types.ts` - Shared utility types
3. `src/types/provider.types.ts` - Provider domain types
4. `src/types/model.types.ts` - Model domain types
5. `src/types/session.types.ts` - Session types
6. `src/types/request.types.ts` - Request and response types
7. `src/types/activity.types.ts` - Activity feed types
8. `src/types/settings.types.ts` - Settings types
9. `src/types/ui.types.ts` - UI state types
10. `src/vite-env.d.ts` - Vite environment types

### Type Definitions

#### `api.types.ts`
```typescript
/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: {
    message: string;
    type?: string;
    code?: string;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * API error
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
```

#### `common.types.ts`
```typescript
/**
 * Common utility types
 */

export type UUID = string;
export type Timestamp = number; // Unix timestamp in milliseconds
export type ISODateString = string;

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableAction<T> {
  icon: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  tooltip: string;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: (row: T) => boolean;
}
```

#### `provider.types.ts`
```typescript
/**
 * Provider Domain Types
 */

export type ProviderType = 'lm-studio' | 'qwen-proxy' | 'qwen-direct';
export type ProviderStatus = 'active' | 'inactive' | 'error';

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  priority: number;
  description?: string;
  created_at: number;
  updated_at: number;
}

export interface ProviderConfig {
  id: number;
  provider_id: string;
  key: string;
  value: string;
  is_sensitive: boolean;
  created_at: number;
  updated_at: number;
}

export interface CreateProviderInput {
  id: string;
  name: string;
  type: ProviderType;
  enabled?: boolean;
  priority?: number;
  description?: string;
  configs?: Record<string, string>;
}

export interface UpdateProviderInput {
  id: string;
  name?: string;
  enabled?: boolean;
  priority?: number;
  description?: string;
}
```

#### `model.types.ts`
```typescript
/**
 * Model Domain Types
 */

export type ModelStatus = 'active' | 'inactive' | 'error';

export interface Model {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  status: ModelStatus;
  created_at: number;
  updated_at: number;
}

export interface CreateModelInput {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
}

export interface UpdateModelInput {
  id: string;
  name?: string;
  description?: string;
  capabilities?: string[];
}
```

#### `session.types.ts`
```typescript
/**
 * Session Types
 */

export interface Session {
  id: string;
  chat_id: string;
  parent_id?: string;
  first_user_message: string;
  message_count: number;
  created_at: number;
  last_accessed: number;
  expires_at: number;
}
```

#### `request.types.ts`
```typescript
/**
 * Request and Response Types
 */

export interface Request {
  id: number;
  session_id: string;
  request_id: string;
  timestamp: number;
  method: string;
  path: string;
  openai_request: string;
  qwen_request: string;
  model: string;
  stream: boolean;
  created_at: number;
}

export interface Response {
  id: number;
  request_id: number;
  session_id: string;
  response_id: string;
  timestamp: number;
  qwen_response?: string;
  openai_response: string;
  parent_id?: string;
  completion_tokens?: number;
  prompt_tokens?: number;
  total_tokens?: number;
  finish_reason?: string;
  error?: string;
  duration_ms?: number;
  created_at: number;
}

export interface RequestWithResponse {
  request: Request;
  response?: Response;
}
```

#### `activity.types.ts`
```typescript
/**
 * Activity Feed Types
 */

export type ActivityType = 'database' | 'api' | 'request' | 'log' | 'system';
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'completed' | 'failed';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  description: string;
  timestamp: string;
  timestamp_ms: number;
  metadata?: Record<string, unknown>;
}

export interface ActivityStats {
  total_providers: number;
  providers_change: string;
  active_models: number;
  models_change: string;
  total_requests: number;
  requests_change: string;
  active_sessions: number;
  sessions_change: string;
}
```

#### `settings.types.ts`
```typescript
/**
 * Settings Types
 */

export interface AppSettings {
  apiBaseUrl: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRequests: boolean;
  logResponses: boolean;
}

export interface ProxySettings {
  host: string;
  port: number;
  timeout: number;
  retries: number;
}

export interface Settings {
  app: AppSettings;
  proxy: ProxySettings;
}
```

#### `ui.types.ts`
```typescript
/**
 * UI State Types
 */

export type Theme = 'light' | 'dark' | 'system';
export type SidebarPosition = 'left' | 'right';

export type ScreenName =
  | 'home'
  | 'providers-list'
  | 'providers-create'
  | 'providers-edit'
  | 'providers-read'
  | 'models-list'
  | 'models-create'
  | 'models-edit'
  | 'models-read'
  | 'sessions-list'
  | 'sessions-read'
  | 'requests-list'
  | 'requests-read'
  | 'settings';

export interface Navigation {
  currentScreen: ScreenName;
  navigationParams?: Record<string, unknown>;
  history: ScreenName[];
}

export interface UIState {
  theme: Theme;
  sidebarPosition: SidebarPosition;
  sidebarCollapsed: boolean;
  navigation: Navigation;
}
```

### Integration Points

- All other modules will import from `@/types/*`
- Type checking enforced at build time
- IntelliSense support in IDE

---

## Phase 1C: API Service Layer

**Priority:** P0
**Dependencies:** Phase 1B
**Objective:** Create centralized API communication layer

### Files Created

1. `src/api/client.ts` - HTTP client with error handling
2. `src/api/endpoints.ts` - API endpoint definitions

### Implementation

#### `api/client.ts`
```typescript
import type { ApiError } from '@/types/api.types';

const API_BASE_URL = 'http://localhost:3002';

/**
 * HTTP client for API requests
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };

        try {
          const data = await response.json();
          error.message = data.error?.message || data.message || error.message;
          error.code = data.error?.code || data.code;
        } catch {
          // Response is not JSON
        }

        throw error;
      }

      return response.json();
    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        throw err; // Already an ApiError
      }

      throw {
        message: err instanceof Error ? err.message : 'Network error',
        status: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

#### `api/endpoints.ts`
```typescript
/**
 * API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Health
  health: '/api/health',

  // Providers
  providers: {
    list: '/api/providers',
    get: (id: string) => `/api/providers/${id}`,
    create: '/api/providers',
    update: (id: string) => `/api/providers/${id}`,
    delete: (id: string) => `/api/providers/${id}`,
  },

  // Models
  models: {
    list: '/api/models',
    get: (id: string) => `/api/models/${id}`,
    create: '/api/models',
    update: (id: string) => `/api/models/${id}`,
    delete: (id: string) => `/api/models/${id}`,
  },

  // Sessions
  sessions: {
    list: '/api/sessions',
    get: (id: string) => `/api/sessions/${id}`,
    delete: (id: string) => `/api/sessions/${id}`,
  },

  // Requests
  requests: {
    list: '/api/requests',
    get: (id: number) => `/api/requests/${id}`,
    delete: (id: number) => `/api/requests/${id}`,
  },

  // Activity
  activity: {
    list: '/api/activity',
    stats: '/api/activity/stats',
  },

  // Settings
  settings: {
    get: '/api/settings',
    update: '/api/settings',
  },
} as const;
```

### Integration Points

- Used by all React Query hooks
- Error handling propagated to UI
- Centralized URL management

---

## Phase 1D: Utility Functions

**Priority:** P0
**Dependencies:** Phase 1B
**Objective:** Create reusable utility functions

### Files Created

1. `src/utils/cn.ts` - className merging utility
2. `src/utils/date.utils.ts` - Date formatting
3. `src/utils/string.utils.ts` - String manipulation
4. `src/utils/validation.utils.ts` - Validation helpers

### Implementation

#### `utils/cn.ts`
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### `utils/date.utils.ts`
```typescript
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number, formatString = 'PPP'): string {
  return format(new Date(timestamp), formatString);
}

/**
 * Format timestamp to date and time
 */
export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'PPP p');
}
```

#### `utils/string.utils.ts`
```typescript
/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Convert string to slug format
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

#### `utils/validation.utils.ts`
```typescript
/**
 * Validate slug format (lowercase, alphanumeric, hyphens)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate port number
 */
export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}
```

### Integration Points

- Used across all components
- Imported via `@/utils/*`

---

## Phase 2A: State Management (Zustand Stores)

**Priority:** P1
**Dependencies:** Phase 1B, 1C
**Objective:** Create Zustand stores for global state management

### Files Created

1. `src/stores/uiStore.ts` - UI state (theme, navigation)
2. `src/stores/providerStore.ts` - Providers state
3. `src/stores/modelStore.ts` - Models state
4. `src/stores/sessionStore.ts` - Sessions state (optional)
5. `src/stores/requestStore.ts` - Requests state (optional)
6. `src/stores/settingsStore.ts` - Settings state

### Implementation

#### `stores/uiStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, SidebarPosition, ScreenName, UIState } from '@/types/ui.types';

interface UIStore extends UIState {
  // Theme
  setTheme: (theme: Theme) => void;

  // Sidebar
  setSidebarPosition: (position: SidebarPosition) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Navigation
  setCurrentScreen: (screen: ScreenName, params?: Record<string, unknown>) => void;
  goBack: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      sidebarPosition: 'left',
      sidebarCollapsed: false,
      navigation: {
        currentScreen: 'home',
        navigationParams: {},
        history: [],
      },

      // Actions
      setTheme: (theme) => set({ theme }),

      setSidebarPosition: (position) => set({ sidebarPosition: position }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),

      setCurrentScreen: (screen, params) => set((state) => ({
        navigation: {
          currentScreen: screen,
          navigationParams: params || {},
          history: [...state.navigation.history, state.navigation.currentScreen],
        },
      })),

      goBack: () => set((state) => {
        const history = [...state.navigation.history];
        const previousScreen = history.pop() || 'home';
        return {
          navigation: {
            currentScreen: previousScreen as ScreenName,
            navigationParams: {},
            history,
          },
        };
      }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarPosition: state.sidebarPosition,
      }),
    }
  )
);
```

### Integration Points

- Used by all pages and components
- Persisted to localStorage
- Navigation state drives routing

---

## Phase 2B: React Query Hooks

**Priority:** P1
**Dependencies:** Phase 1C, 2A
**Objective:** Create data fetching hooks using React Query

### Files Created

1. `src/hooks/useProviders.ts`
2. `src/hooks/useModels.ts`
3. `src/hooks/useSessions.ts`
4. `src/hooks/useRequests.ts`
5. `src/hooks/useActivity.ts`
6. `src/hooks/useSettings.ts`

### Implementation

#### `hooks/useProviders.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { Provider, CreateProviderInput, UpdateProviderInput } from '@/types/provider.types';

// Query keys
export const providerKeys = {
  all: ['providers'] as const,
  lists: () => [...providerKeys.all, 'list'] as const,
  details: () => [...providerKeys.all, 'detail'] as const,
  detail: (id: string) => [...providerKeys.details(), id] as const,
};

// Fetch all providers
export const useProviders = () => {
  return useQuery({
    queryKey: providerKeys.lists(),
    queryFn: () => apiClient.get<{ providers: Provider[] }>(API_ENDPOINTS.providers.list),
    select: (data) => data.providers,
  });
};

// Fetch single provider
export const useProvider = (id: string, enabled = true) => {
  return useQuery({
    queryKey: providerKeys.detail(id),
    queryFn: () => apiClient.get<Provider>(API_ENDPOINTS.providers.get(id)),
    enabled: enabled && !!id,
  });
};

// Create provider
export const useCreateProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProviderInput) =>
      apiClient.post<Provider>(API_ENDPOINTS.providers.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
};

// Update provider
export const useUpdateProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProviderInput) =>
      apiClient.put<Provider>(API_ENDPOINTS.providers.update(data.id), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: providerKeys.detail(variables.id) });
    },
  });
};

// Delete provider
export const useDeleteProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(API_ENDPOINTS.providers.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerKeys.lists() });
    },
  });
};
```

### Integration Points

- Used by all pages
- Automatic caching and refetching
- Optimistic updates

---

## Phase 3A: UI Component Library (shadcn/ui)

**Priority:** P2
**Dependencies:** Phase 1A
**Objective:** Install and configure shadcn/ui components

### Files Created

15 shadcn/ui components:
1. `src/components/ui/button.tsx`
2. `src/components/ui/input.tsx`
3. `src/components/ui/select.tsx`
4. `src/components/ui/card.tsx`
5. `src/components/ui/dialog.tsx`
6. `src/components/ui/table.tsx`
7. `src/components/ui/badge.tsx`
8. `src/components/ui/label.tsx`
9. `src/components/ui/textarea.tsx`
10. `src/components/ui/switch.tsx`
11. `src/components/ui/separator.tsx`
12. `src/components/ui/dropdown-menu.tsx`
13. `src/components/ui/alert.tsx`
14. `src/components/ui/tooltip.tsx`
15. `src/components/ui/skeleton.tsx`

### Files Modified

1. `components.json` - shadcn/ui configuration

### Installation

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add label
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add skeleton
```

### Integration Points

- Used by all custom components
- Consistent styling via Tailwind
- Accessibility built-in

---

## Phase 3B: Common Shared Components

**Priority:** P2
**Dependencies:** Phase 3A
**Objective:** Create reusable application-specific components

### Files Created

1. `src/components/common/ConfirmDialog.tsx`
2. `src/components/common/EmptyState.tsx`
3. `src/components/common/ErrorState.tsx`
4. `src/components/common/LoadingState.tsx`
5. `src/components/common/Timestamp.tsx`
6. `src/components/table/DataTable.tsx`
7. `src/components/providers/ProviderStatusBadge.tsx`
8. `src/components/models/CapabilitiesList.tsx`

### Implementation Examples

#### `components/common/ConfirmDialog.tsx`
```typescript
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Integration Points

- Used across all pages
- Consistent UI/UX
- Reduced code duplication

---

## Phase 3C: Layout Components

**Priority:** P2
**Dependencies:** Phase 3A, 3B
**Objective:** Create page layout structure

### Files Created

1. `src/components/layout/MainLayout.tsx`
2. `src/components/layout/Sidebar.tsx`
3. `src/components/layout/Header.tsx`
4. `src/components/layout/PageLayout.tsx`

### Integration Points

- Used by all pages
- Navigation integration
- Theme support

---

## Phase 4A-4F: Domain Pages

**Priority:** P3
**Dependencies:** Phase 2B, 3B, 3C
**Objective:** Create all page components organized by domain

Each domain phase follows the same pattern:
- List page with DataTable
- Create/Edit pages with forms
- Read pages (where applicable)
- Domain-specific components

### Files Created Per Domain

**4A: Providers Domain (5 files)**
- ProvidersListPage.tsx
- ProviderCreatePage.tsx
- ProviderEditPage.tsx
- ProviderReadPage.tsx
- ProviderForm.tsx

**4B: Models Domain (5 files)**
- ModelsListPage.tsx
- ModelCreatePage.tsx
- ModelEditPage.tsx
- ModelReadPage.tsx
- ModelForm.tsx

**4C: Sessions Domain (2 files)**
- SessionsListPage.tsx
- SessionReadPage.tsx

**4D: Requests Domain (2 files)**
- RequestsListPage.tsx
- RequestReadPage.tsx

**4E: Settings (3 files)**
- SettingsPage.tsx
- SettingsSection.tsx
- SettingItem.tsx

**4F: Activity/Dashboard (2 files)**
- ActivityPage.tsx
- StatsCard.tsx

### Integration Points

- Use React Query hooks from Phase 2B
- Use Zustand stores from Phase 2A
- Use shared components from Phase 3B
- Use layout from Phase 3C

---

## Phase 5: Integration and Testing

**Priority:** P4
**Dependencies:** All previous phases
**Objective:** Integrate with Electron and test end-to-end

### Files Modified

1. `frontend/src/App.tsx` - Main app component with routing
2. `frontend/src/main.tsx` - Entry point with React Query setup

### Implementation

#### `App.tsx`
```typescript
import { useUIStore } from '@/stores/uiStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProvidersListPage } from '@/pages/providers/ProvidersListPage';
// ... import all pages

export function App() {
  const currentScreen = useUIStore((state) => state.navigation.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <ActivityPage />;
      case 'providers-list':
        return <ProvidersListPage />;
      case 'providers-create':
        return <ProviderCreatePage />;
      // ... all other screens
      default:
        return <ActivityPage />;
    }
  };

  return (
    <MainLayout>
      {renderScreen()}
    </MainLayout>
  );
}
```

#### `main.tsx`
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Integration Points

- **Electron**: Update `electron/src/main.ts` to load `http://localhost:5173`
- **Root package.json**: Update `dev:frontend` script to use `frontend`

---

## Phase 6: Migration Cutover

**Priority:** P5
**Dependencies:** Phase 5
**Objective:** Replace old frontend with new one

### Files Modified

1. `package.json` - Update workspace paths
2. `electron/src/main.ts` - Update paths (if needed)

### Cutover Steps

1. **Backup old frontend**: Rename `frontend/` to `frontend-old/`
2. **Rename new frontend**: Rename `frontend/` to `frontend/`
3. **Update root package.json workspace**:
   ```json
   "workspaces": [
     "frontend",
     "electron",
     "backend"
   ]
   ```
4. **Test full application**: `npm run dev`
5. **Remove old frontend**: Delete `frontend-old/` after successful testing

---

## Success Criteria

- ✅ All pages load without errors
- ✅ All CRUD operations work correctly
- ✅ API paths match backend routes exactly (`/api/*`)
- ✅ Navigation works via Zustand
- ✅ Theme switching works
- ✅ Data persists correctly
- ✅ TypeScript compilation passes with strict mode
- ✅ No console errors
- ✅ Responsive design works
- ✅ Electron integration works

---

## Notes

- Each phase should be completed and tested before moving to the next
- Foundation phases (1A-1D, 2A-2B) are critical - do not skip
- UI components (3A-3C) provide reusability
- Domain pages (4A-4F) can be done in parallel
- Keep old frontend until Phase 6 is complete
