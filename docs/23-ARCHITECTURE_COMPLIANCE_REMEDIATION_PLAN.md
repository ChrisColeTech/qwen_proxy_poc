# 23-ARCHITECTURE_COMPLIANCE_REMEDIATION_PLAN

## Work Progression Tracking

| Phase | Status | Files Modified | Files Created | Critical Issues Resolved |
|-------|--------|----------------|---------------|-------------------------|
| Phase 1A: Type System Foundation | ✅ Complete | 0 | 8 | Type safety violations |
| Phase 1B: Core Services Layer | ✅ Complete | 0 | 6 | Business logic in components |
| Phase 1C: Zustand Store Architecture | ✅ Complete | 0 | 5 | Missing state management |
| Phase 2A: CSS Architecture Foundation | ✅ Complete | 1 | 0 | Inline Tailwind violations |
| Phase 2B: Theme System Enhancement | ✅ Complete | 2 | 0 | Hardcoded color violations |
| Phase 3A: Navigation Architecture | ✅ Complete | 4 | 1 | React Router dependency |
| Phase 3B: Common UI Components | ✅ Complete | 1 | 6 | Code duplication |
| Phase 4A: Activity Domain | ✅ Complete | 2 | 3 | Domain-specific violations |
| Phase 4B: Settings Domain | ✅ Complete | 1 | 2 | Domain-specific violations |
| Phase 4C: Providers Domain | ✅ Complete | 4 | 2 | Domain-specific violations |
| Phase 4D: Models Domain | ✅ Complete | 4 | 2 | Domain-specific violations |
| Phase 4E: Logs Domain | ✅ Complete | 1 | 3 | Domain-specific violations |
| Phase 4F: Home/Dashboard Domain | ✅ Complete | 3 | 2 | Domain-specific violations |
| Phase 5A: Layout Components Migration | ✅ Complete | 6 | 0 | Layout violations |
| Phase 5B: Shared Components Migration | ✅ Complete | 15 | 0 | Component violations |
| Phase 6: Export Standardization | ✅ Complete | 15 | 0 | Export pattern violations |
| Phase 7: Cleanup and Optimization | ✅ Complete | 13 | 0 | Low priority violations |

**Legend:** ✅ Complete | 🟡 In Progress | ⬜ Not Started

---

## Overview

This implementation plan addresses the 50+ architectural violations identified in the architecture compliance audit. The plan is organized into phases prioritizing foundation work (types, services, stores) before component and page migrations to ensure adherence to Single Responsibility Principle (SRP) and Don't Repeat Yourself (DRY) principles.

### Guiding Principles

1. **Foundation First**: Build type system, services, and stores before touching components
2. **Domain-Driven Design**: Organize by business domain (activity, providers, models, etc.)
3. **Single Responsibility**: Each module has one clear purpose
4. **DRY**: Eliminate duplication through shared utilities and components
5. **Progressive Enhancement**: Each phase builds on previous work
6. **No Breaking Changes**: Maintain functionality throughout migration

### Critical Violations Addressed

- ❌ React Router instead of Zustand state-based navigation
- ❌ Inline Tailwind classes everywhere
- ❌ Hardcoded colors instead of theme variables
- ❌ Business logic in components
- ❌ Missing type definitions
- ❌ Default exports instead of named exports
- ❌ Manual localStorage management
- ❌ Code duplication across components

---

## Phase 1A: Type System Foundation

**Priority:** CRITICAL
**Dependencies:** None
**Objective:** Establish comprehensive type system for type safety and IntelliSense support

### Files Created

```
frontend/src/types/
├── activity.types.ts       # Activity feed types
├── settings.types.ts       # Settings types
├── provider.types.ts       # Provider domain types
├── model.types.ts          # Model domain types
├── logs.types.ts           # Logs types
├── ui.types.ts             # UI state types
├── api.types.ts            # API response types
└── common.types.ts         # Shared utility types
```

### Implementation Details

#### `activity.types.ts`
```typescript
/**
 * Activity Domain Types
 * Defines all types for activity tracking and display
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
  api_requests: number;
  requests_change: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}
```

#### `provider.types.ts`
```typescript
/**
 * Provider Domain Types
 */

export type ProviderType = 'lm-studio' | 'qwen-proxy' | 'qwen-direct' | 'ollama';
export type ProviderStatus = 'enabled' | 'disabled' | 'error';

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  status: ProviderStatus;
  base_url: string;
  api_key?: string;
  created_at: string;
  updated_at: string;
  config?: ProviderConfig;
}

export interface ProviderConfig {
  timeout?: number;
  max_retries?: number;
  headers?: Record<string, string>;
}

export interface CreateProviderInput {
  name: string;
  type: ProviderType;
  base_url: string;
  api_key?: string;
  enabled?: boolean;
  config?: ProviderConfig;
}

export interface UpdateProviderInput extends Partial<CreateProviderInput> {
  id: string;
}
```

#### `ui.types.ts`
```typescript
/**
 * UI State Types
 * For Zustand UI store
 */

export type Screen =
  | 'home'
  | 'activity'
  | 'logs'
  | 'settings'
  | 'providers'
  | 'providers-create'
  | 'providers-edit'
  | 'models'
  | 'models-create'
  | 'models-edit';

export type Theme = 'light' | 'dark' | 'system';
export type SidebarPosition = 'left' | 'right';

export interface NavigationState {
  currentScreen: Screen;
  previousScreen?: Screen;
  navigationParams?: Record<string, unknown>;
}

export interface UIState {
  navigation: NavigationState;
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarPosition: SidebarPosition;
}
```

#### `api.types.ts`
```typescript
/**
 * API Response Types
 * Standard response formats from backend
 */

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiListResponse<T> {
  [key: string]: T[];
}
```

#### `common.types.ts`
```typescript
/**
 * Common Utility Types
 */

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  loadingState: LoadingState;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}
```

### Integration Points

- **Used by:** All services, stores, and components
- **Imports:** None (foundation layer)

### Success Criteria

- ✅ All domain types defined with proper TypeScript syntax
- ✅ No `any` types used
- ✅ All types exported with named exports
- ✅ JSDoc comments on all exported types
- ✅ TypeScript compilation succeeds with strict mode

---

## Phase 1B: Core Services Layer

**Priority:** CRITICAL
**Dependencies:** Phase 1A
**Objective:** Extract business logic from components into service classes

### Files Created

```
frontend/src/services/
├── activityService.ts      # Activity data operations
├── settingsService.ts      # Settings management
├── providerService.ts      # Provider CRUD operations
├── modelService.ts         # Model CRUD operations
├── logsService.ts          # Logs fetching
└── proxyService.ts         # Proxy control operations
```

### Implementation Details

#### `activityService.ts`
```typescript
/**
 * Activity Service
 * Handles all activity-related data operations
 */

import { getBackendUrl } from '@/lib/config';
import type { ActivityItem, ActivityStats, ActivityFilters } from '@/types/activity.types';
import type { ApiResponse } from '@/types/api.types';

export class ActivityService {
  private static async getBaseUrl(): Promise<string> {
    return await getBackendUrl();
  }

  /**
   * Fetch recent activity with optional filters
   */
  static async getRecentActivity(filters?: ActivityFilters): Promise<ActivityItem[]> {
    const baseUrl = await this.getBaseUrl();
    const params = new URLSearchParams();

    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);

    const url = `${baseUrl}/api/v1/activity/recent?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.statusText}`);
    }

    const data: ApiResponse<{ activities: ActivityItem[] }> = await response.json();
    return data.data?.activities || [];
  }

  /**
   * Fetch activity statistics
   */
  static async getActivityStats(): Promise<ActivityStats> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/activity/stats`);

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }

    const data: ApiResponse<{ stats: ActivityStats }> = await response.json();
    if (!data.data?.stats) {
      throw new Error('Invalid response format');
    }

    return data.data.stats;
  }

  /**
   * Fetch all activity data in parallel
   */
  static async fetchAllData(filters?: ActivityFilters): Promise<{
    activity: ActivityItem[];
    stats: ActivityStats;
  }> {
    const [activity, stats] = await Promise.all([
      this.getRecentActivity(filters),
      this.getActivityStats(),
    ]);

    return { activity, stats };
  }
}
```

#### `providerService.ts`
```typescript
/**
 * Provider Service
 * Handles all provider CRUD operations
 */

import { getBackendUrl } from '@/lib/config';
import type {
  Provider,
  CreateProviderInput,
  UpdateProviderInput
} from '@/types/provider.types';

export class ProviderService {
  private static async getBaseUrl(): Promise<string> {
    return await getBackendUrl();
  }

  /**
   * Fetch all providers
   */
  static async getAll(): Promise<Provider[]> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/providers`);

    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.statusText}`);
    }

    const data = await response.json();
    return data.providers || [];
  }

  /**
   * Get single provider by ID
   */
  static async getById(id: string): Promise<Provider> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/providers/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch provider: ${response.statusText}`);
    }

    const data = await response.json();
    return data.provider;
  }

  /**
   * Create new provider
   */
  static async create(input: CreateProviderInput): Promise<Provider> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Failed to create provider: ${response.statusText}`);
    }

    const data = await response.json();
    return data.provider;
  }

  /**
   * Update existing provider
   */
  static async update(input: UpdateProviderInput): Promise<Provider> {
    const baseUrl = await this.getBaseUrl();
    const { id, ...updateData } = input;

    const response = await fetch(`${baseUrl}/api/v1/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update provider: ${response.statusText}`);
    }

    const data = await response.json();
    return data.provider;
  }

  /**
   * Delete provider
   */
  static async delete(id: string): Promise<void> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/providers/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete provider: ${response.statusText}`);
    }
  }

  /**
   * Test provider connection
   */
  static async testConnection(id: string): Promise<boolean> {
    const baseUrl = await this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/providers/${id}/test`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  }
}
```

#### `proxyService.ts`
```typescript
/**
 * Proxy Service
 * Handles proxy server control operations via Electron IPC
 */

export interface ProxyStatus {
  running: boolean;
  port?: number;
  pid?: number;
  managedByElectron?: boolean;
}

export class ProxyService {
  private static getElectronAPI(): any {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI;
  }

  /**
   * Get proxy server status
   */
  static async getStatus(): Promise<ProxyStatus> {
    const api = this.getElectronAPI();
    return await api.getProxyStatus();
  }

  /**
   * Start proxy server
   */
  static async start(): Promise<ProxyStatus> {
    const api = this.getElectronAPI();
    const result = await api.startProxy();

    if (!result.success) {
      throw new Error(result.message || 'Failed to start proxy');
    }

    return {
      running: true,
      port: result.port,
      pid: result.pid,
    };
  }

  /**
   * Stop proxy server
   */
  static async stop(): Promise<void> {
    const api = this.getElectronAPI();
    const result = await api.stopProxy();

    if (!result.success) {
      throw new Error(result.message || 'Failed to stop proxy');
    }
  }

  /**
   * Restart proxy server
   */
  static async restart(): Promise<ProxyStatus> {
    await this.stop();
    // Wait a moment for clean shutdown
    await new Promise(resolve => setTimeout(resolve, 500));
    return await this.start();
  }
}
```

### Files Modified

None (pure creation phase)

### Integration Points

- **Uses:** Phase 1A type definitions
- **Uses:** `/lib/config.ts` (existing)
- **Used by:** Phase 1C stores

### Success Criteria

- ✅ All API calls extracted from components
- ✅ Services follow static class pattern
- ✅ All methods have proper error handling
- ✅ All methods are typed with Phase 1A types
- ✅ JSDoc comments on all public methods
- ✅ No `console.log` statements (use proper logging)

---

## Phase 1C: Zustand Store Architecture

**Priority:** CRITICAL
**Dependencies:** Phase 1A, Phase 1B
**Objective:** Create centralized state management with Zustand

### Files Created

```
frontend/src/stores/
├── uiStore.ts              # UI state and navigation
├── activityStore.ts        # Activity domain state
├── providerStore.ts        # Provider domain state
├── modelStore.ts           # Model domain state
└── settingsStore.ts        # Settings state
```

### Implementation Details

#### `uiStore.ts`
```typescript
/**
 * UI Store
 * Manages UI state including navigation, theme, and layout
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Screen, Theme, SidebarPosition, UIState } from '@/types/ui.types';

interface UIStore extends UIState {
  // Navigation actions
  setCurrentScreen: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;

  // Theme actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Layout actions
  toggleSidebar: () => void;
  setSidebarPosition: (position: SidebarPosition) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      navigation: {
        currentScreen: 'home',
        previousScreen: undefined,
        navigationParams: undefined,
      },
      theme: 'system',
      sidebarCollapsed: false,
      sidebarPosition: 'left',

      // Navigation actions
      setCurrentScreen: (screen, params) => set((state) => ({
        navigation: {
          currentScreen: screen,
          previousScreen: state.navigation.currentScreen,
          navigationParams: params,
        },
      })),

      goBack: () => set((state) => ({
        navigation: {
          currentScreen: state.navigation.previousScreen || 'home',
          previousScreen: undefined,
          navigationParams: undefined,
        },
      })),

      // Theme actions
      setTheme: (theme) => set({ theme }),

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark',
      })),

      // Layout actions
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed,
      })),

      setSidebarPosition: (position) => set({ sidebarPosition: position }),
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

#### `activityStore.ts`
```typescript
/**
 * Activity Store
 * Manages activity feed state and data fetching
 */

import { create } from 'zustand';
import { ActivityService } from '@/services/activityService';
import type { ActivityItem, ActivityStats, ActivityFilters } from '@/types/activity.types';

interface ActivityStore {
  // State
  activity: ActivityItem[];
  stats: ActivityStats | null;
  isLoading: boolean;
  error: string | null;
  filters: ActivityFilters;

  // Actions
  fetchActivity: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  setFilters: (filters: ActivityFilters) => void;
  clearError: () => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  // Initial state
  activity: [],
  stats: null,
  isLoading: false,
  error: null,
  filters: {},

  // Fetch activity data
  fetchActivity: async () => {
    set({ isLoading: true, error: null });

    try {
      const { filters } = get();
      const { activity, stats } = await ActivityService.fetchAllData(filters);

      set({
        activity,
        stats,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch activity',
        isLoading: false,
      });
    }
  },

  // Refresh activity
  refreshActivity: async () => {
    const { fetchActivity } = get();
    await fetchActivity();
  },

  // Set filters and refetch
  setFilters: (filters) => {
    set({ filters });
    get().fetchActivity();
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
```

#### `providerStore.ts`
```typescript
/**
 * Provider Store
 * Manages provider state and CRUD operations
 */

import { create } from 'zustand';
import { ProviderService } from '@/services/providerService';
import type {
  Provider,
  CreateProviderInput,
  UpdateProviderInput
} from '@/types/provider.types';

interface ProviderStore {
  // State
  providers: Provider[];
  selectedProvider: Provider | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProviders: () => Promise<void>;
  fetchProvider: (id: string) => Promise<void>;
  createProvider: (input: CreateProviderInput) => Promise<Provider>;
  updateProvider: (input: UpdateProviderInput) => Promise<Provider>;
  deleteProvider: (id: string) => Promise<void>;
  testConnection: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useProviderStore = create<ProviderStore>((set, get) => ({
  // Initial state
  providers: [],
  selectedProvider: null,
  isLoading: false,
  error: null,

  // Fetch all providers
  fetchProviders: async () => {
    set({ isLoading: true, error: null });

    try {
      const providers = await ProviderService.getAll();
      set({ providers, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch providers',
        isLoading: false,
      });
    }
  },

  // Fetch single provider
  fetchProvider: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const provider = await ProviderService.getById(id);
      set({ selectedProvider: provider, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch provider',
        isLoading: false,
      });
    }
  },

  // Create provider
  createProvider: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const provider = await ProviderService.create(input);
      set((state) => ({
        providers: [...state.providers, provider],
        isLoading: false,
      }));
      return provider;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create provider',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update provider
  updateProvider: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const provider = await ProviderService.update(input);
      set((state) => ({
        providers: state.providers.map((p) => p.id === input.id ? provider : p),
        selectedProvider: state.selectedProvider?.id === input.id ? provider : state.selectedProvider,
        isLoading: false,
      }));
      return provider;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update provider',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete provider
  deleteProvider: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await ProviderService.delete(id);
      set((state) => ({
        providers: state.providers.filter((p) => p.id !== id),
        selectedProvider: state.selectedProvider?.id === id ? null : state.selectedProvider,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete provider',
        isLoading: false,
      });
      throw error;
    }
  },

  // Test connection
  testConnection: async (id) => {
    try {
      return await ProviderService.testConnection(id);
    } catch (error) {
      return false;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
```

### Files Modified

None (pure creation phase)

### Integration Points

- **Uses:** Phase 1A types
- **Uses:** Phase 1B services
- **Used by:** Phase 4+ components and pages

### Success Criteria

- ✅ All stores use Zustand `create` API
- ✅ Persist middleware used for appropriate state
- ✅ All async operations properly handled
- ✅ Loading and error states managed
- ✅ TypeScript types enforced
- ✅ No localStorage manipulation outside Zustand

---

## Phase 2A: CSS Architecture Foundation

**Priority:** CRITICAL
**Dependencies:** None
**Objective:** Create comprehensive CSS class library in index.css

### Files Modified

```
frontend/src/index.css      # Add 200-300 custom CSS classes
```

### Implementation Details

#### Updated `index.css` Structure
```css
/**
 * index.css
 * Central CSS architecture following the Architecture Guide
 * NO INLINE TAILWIND - All styles defined here
 */

/* ==========================================
   1. Theme Variables (EXISTING - Keep as is)
   ========================================== */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Existing theme variables... */
}

/* ==========================================
   2. Page Layout Classes
   ========================================== */
@layer components {
  /* Container Classes */
  .page-container {
    @apply max-w-7xl mx-auto py-8 px-6;
  }

  .page-container-full {
    @apply w-full h-full p-6;
  }

  .page-container-narrow {
    @apply max-w-4xl mx-auto py-6 px-4;
  }

  /* Header Classes */
  .page-header {
    @apply mb-6 flex items-center justify-between;
  }

  .page-header-vertical {
    @apply mb-6 flex flex-col gap-4;
  }

  .page-title {
    @apply text-3xl font-bold tracking-tight text-foreground;
  }

  .page-subtitle {
    @apply text-lg text-muted-foreground;
  }

  .page-description {
    @apply text-sm text-muted-foreground mt-2;
  }

  /* Section Classes */
  .section-header {
    @apply text-lg font-semibold text-foreground;
  }

  .section-description {
    @apply text-sm text-muted-foreground;
  }

  .section-divider {
    @apply my-6 border-t border-border;
  }

  /* ==========================================
     3. Grid Layout Classes
     ========================================== */
  .grid-1-col {
    @apply grid grid-cols-1 gap-6;
  }

  .grid-2-col {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
  }

  .grid-3-col {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
  }

  .grid-4-col {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
  }

  .stats-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-6;
  }

  /* ==========================================
     4. Card Component Classes
     ========================================== */
  .card-hover {
    @apply cursor-pointer transition-all hover:shadow-md hover:border-primary/50;
  }

  .card-clickable {
    @apply cursor-pointer transition-colors hover:bg-accent/50;
  }

  /* Stat Card Classes */
  .stat-card-header {
    @apply flex flex-row items-center justify-between space-y-0 pb-2;
  }

  .stat-card-title {
    @apply text-sm font-medium text-muted-foreground;
  }

  .stat-card-icon {
    @apply h-4 w-4 text-muted-foreground;
  }

  .stat-card-value {
    @apply text-2xl font-bold text-foreground;
  }

  .stat-card-change {
    @apply text-xs text-muted-foreground;
  }

  .stat-card-change-positive {
    @apply text-xs text-success;
  }

  .stat-card-change-negative {
    @apply text-xs text-destructive;
  }

  /* ==========================================
     5. Activity Feed Classes
     ========================================== */
  .activity-list {
    @apply space-y-4;
  }

  .activity-item {
    @apply flex items-start gap-4 p-4 rounded-lg border border-border;
    @apply transition-colors hover:bg-accent/50;
  }

  .activity-icon-wrapper {
    @apply p-2 rounded-lg bg-secondary;
  }

  .activity-icon {
    @apply h-4 w-4;
  }

  .activity-content {
    @apply flex-1 min-w-0;
  }

  .activity-description {
    @apply text-sm font-medium text-foreground;
  }

  .activity-timestamp {
    @apply text-xs text-muted-foreground mt-1;
  }

  /* Activity Type Colors */
  .activity-color-database {
    @apply text-primary;
  }

  .activity-color-api {
    @apply text-accent-foreground;
  }

  .activity-color-request {
    @apply text-success;
  }

  .activity-color-log {
    @apply text-warning;
  }

  .activity-color-default {
    @apply text-muted-foreground;
  }

  /* ==========================================
     6. Button Classes
     ========================================== */
  .button-icon {
    @apply h-4 w-4;
  }

  .button-icon-lg {
    @apply h-5 w-5;
  }

  .button-gap {
    @apply gap-2;
  }

  .button-refresh {
    @apply gap-2 transition-transform hover:rotate-180;
  }

  /* ==========================================
     7. Form Classes
     ========================================== */
  .form-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .form-field {
    @apply space-y-2;
  }

  .form-label {
    @apply text-sm font-medium text-foreground;
  }

  .form-description {
    @apply text-xs text-muted-foreground;
  }

  .form-error {
    @apply text-xs text-destructive;
  }

  .form-actions {
    @apply flex justify-end gap-2 mt-6;
  }

  /* ==========================================
     8. Table Classes
     ========================================== */
  .table-container {
    @apply w-full space-y-4;
  }

  .table-wrapper {
    @apply rounded-md border border-border;
  }

  .table-header-cell {
    @apply px-4 py-3 text-left text-sm font-medium text-muted-foreground;
  }

  .table-cell {
    @apply px-4 py-3 text-sm text-foreground;
  }

  .table-row {
    @apply border-b border-border transition-colors hover:bg-muted/50;
  }

  .table-actions {
    @apply flex items-center gap-2;
  }

  /* ==========================================
     9. Badge Classes
     ========================================== */
  .badge {
    @apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium;
    @apply border transition-colors;
  }

  .badge-success {
    @apply bg-success/10 text-success border-success/20;
  }

  .badge-warning {
    @apply bg-warning/10 text-warning border-warning/20;
  }

  .badge-error {
    @apply bg-destructive/10 text-destructive border-destructive/20;
  }

  .badge-info {
    @apply bg-primary/10 text-primary border-primary/20;
  }

  .badge-neutral {
    @apply bg-muted text-muted-foreground border-border;
  }

  /* Status Dots */
  .status-dot {
    @apply w-2 h-2 rounded-full;
  }

  .status-dot-success {
    @apply bg-success;
  }

  .status-dot-warning {
    @apply bg-warning;
  }

  .status-dot-error {
    @apply bg-destructive;
  }

  .status-dot-info {
    @apply bg-primary;
  }

  .status-dot-neutral {
    @apply bg-muted-foreground;
  }

  /* ==========================================
     10. Sidebar Classes
     ========================================== */
  .sidebar {
    @apply w-12 bg-secondary/30 flex flex-col;
  }

  .sidebar-left {
    @apply border-r border-border;
  }

  .sidebar-right {
    @apply border-l border-border;
  }

  .sidebar-button {
    @apply h-12 w-12 flex items-center justify-center;
    @apply transition-colors relative group;
    @apply text-muted-foreground hover:text-foreground;
  }

  .sidebar-button-active {
    @apply text-foreground bg-accent;
  }

  .sidebar-tooltip {
    @apply absolute z-50 px-2 py-1 text-xs font-medium;
    @apply bg-popover text-popover-foreground rounded shadow-md;
    @apply opacity-0 group-hover:opacity-100 transition-opacity;
  }

  .sidebar-tooltip-left {
    @apply right-full mr-2;
  }

  .sidebar-tooltip-right {
    @apply left-full ml-2;
  }

  /* ==========================================
     11. TitleBar Classes
     ========================================== */
  .titlebar {
    @apply h-8 bg-background border-b border-border;
    @apply flex items-center justify-between;
  }

  .titlebar-section {
    @apply flex items-center gap-2;
  }

  .titlebar-button {
    @apply h-8 w-12 flex items-center justify-center;
    @apply transition-colors hover:bg-accent;
  }

  .titlebar-button-close {
    @apply hover:bg-destructive hover:text-destructive-foreground;
  }

  .titlebar-title {
    @apply text-sm font-medium text-foreground px-2;
  }

  /* ==========================================
     12. Loading State Classes
     ========================================== */
  .loading-container {
    @apply flex h-full items-center justify-center;
  }

  .loading-content {
    @apply text-center;
  }

  .loading-spinner {
    @apply h-8 w-8 animate-spin rounded-full border-4;
    @apply border-primary border-t-transparent mx-auto mb-4;
  }

  .loading-text {
    @apply text-sm text-muted-foreground;
  }

  /* ==========================================
     13. Error State Classes
     ========================================== */
  .error-container {
    @apply flex h-full items-center justify-center;
  }

  .error-content {
    @apply text-center max-w-md;
  }

  .error-icon {
    @apply h-12 w-12 text-destructive mx-auto mb-4;
  }

  .error-title {
    @apply text-lg font-semibold text-foreground mb-2;
  }

  .error-message {
    @apply text-sm text-muted-foreground mb-4;
  }

  /* ==========================================
     14. Utility Classes
     ========================================== */
  .truncate-text {
    @apply truncate overflow-hidden text-ellipsis whitespace-nowrap;
  }

  .text-monospace {
    @apply font-mono text-sm;
  }

  .divider-vertical {
    @apply h-full w-px bg-border;
  }

  .divider-horizontal {
    @apply w-full h-px bg-border;
  }

  .scroll-area {
    @apply overflow-y-auto;
  }

  /* ==========================================
     15. Animation Classes
     ========================================== */
  .fade-in {
    @apply animate-in fade-in duration-200;
  }

  .slide-in-from-right {
    @apply animate-in slide-in-from-right duration-300;
  }

  .slide-in-from-left {
    @apply animate-in slide-in-from-left duration-300;
  }
}
```

### Integration Points

- **Used by:** All components (Phase 3+)
- **Modifies:** Existing `index.css`

### Success Criteria

- ✅ 200-300 CSS classes defined
- ✅ All classes use `@apply` with Tailwind utilities
- ✅ Classes organized by component domain
- ✅ No hardcoded color values (only theme variables)
- ✅ Consistent naming convention followed
- ✅ Comments documenting each section

---

## Phase 2B: Theme System Enhancement

**Priority:** CRITICAL
**Dependencies:** Phase 2A
**Objective:** Add custom theme colors and ensure proper dark mode support

### Files Modified

```
frontend/tailwind.config.js     # Add custom theme colors
frontend/src/index.css          # Add dark mode overrides
```

### Implementation Details

#### Updated `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom theme colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      // ... rest of config
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### Updated `index.css` (Add to theme variables)
```css
:root {
  /* Existing variables... */

  /* Custom theme colors */
  --success: 142 71% 45%;
  --success-foreground: 144 61% 20%;

  --warning: 38 92% 50%;
  --warning-foreground: 25 85% 25%;
}

.dark {
  /* Existing dark mode variables... */

  /* Custom dark mode colors */
  --success: 142 71% 45%;
  --success-foreground: 144 76% 90%;

  --warning: 38 92% 50%;
  --warning-foreground: 48 96% 89%;
}
```

### Integration Points

- **Uses:** Phase 2A CSS classes
- **Used by:** All components using theme colors

### Success Criteria

- ✅ Custom theme colors defined in Tailwind config
- ✅ Dark mode variants for all custom colors
- ✅ No hardcoded color values in config
- ✅ Theme switches properly between light/dark
- ✅ All CSS classes use theme color variables

---

## Phase 3A: Navigation Architecture

**Priority:** HIGH
**Dependencies:** Phase 1C (UIStore)
**Objective:** Replace React Router with Zustand state-based navigation

### Files Modified

```
frontend/src/App.tsx                    # Remove RouterProvider, add switch statement
frontend/src/main.tsx                   # Remove router configuration
frontend/src/components/layout/Sidebar.tsx   # Replace useNavigate with useUIStore
frontend/package.json                   # Remove react-router-dom dependency
```

### Files Created

```
frontend/src/components/navigation/
└── ScreenRenderer.tsx                  # New component to render screens
```

### Implementation Details

#### New `ScreenRenderer.tsx`
```typescript
/**
 * Screen Renderer
 * Renders the appropriate page based on UI store navigation state
 */

import { useUIStore } from '@/stores/uiStore';
import { HomePage } from '@/pages/HomePage';
import { ActivityPage } from '@/pages/ActivityPage';
import { LogsPage } from '@/pages/LogsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProvidersListPage } from '@/pages/providers/ProvidersListPage';
import { CreateProviderPage } from '@/pages/providers/CreateProviderPage';
import { ModelsListPage } from '@/pages/models/ModelsListPage';
import { CreateModelPage } from '@/pages/models/CreateModelPage';

export function ScreenRenderer() {
  const currentScreen = useUIStore((state) => state.navigation.currentScreen);

  switch (currentScreen) {
    case 'home':
      return <HomePage />;

    case 'activity':
      return <ActivityPage />;

    case 'logs':
      return <LogsPage />;

    case 'settings':
      return <SettingsPage />;

    case 'providers':
      return <ProvidersListPage />;

    case 'providers-create':
      return <CreateProviderPage />;

    case 'models':
      return <ModelsListPage />;

    case 'models-create':
      return <CreateModelPage />;

    default:
      return <HomePage />;
  }
}
```

#### Updated `App.tsx`
```typescript
/**
 * App Component
 * Root application component with state-based navigation
 */

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TitleBar } from '@/components/layout/TitleBar';
import { ScreenRenderer } from '@/components/navigation/ScreenRenderer';

export function App() {
  const theme = useUIStore((state) => state.theme);

  // Apply theme to document
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
  }, [theme]);

  return (
    <div className="app-container">
      <TitleBar />
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <ScreenRenderer />
        </main>
      </div>
    </div>
  );
}
```

#### Updated `Sidebar.tsx`
```typescript
/**
 * Sidebar Component
 * Navigation sidebar with Zustand state management
 */

import { Home, Activity, FileText, Settings, Database, Box } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import type { Screen } from '@/types/ui.types';

interface NavItem {
  id: Screen;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'activity', icon: Activity, label: 'Activity' },
  { id: 'providers', icon: Database, label: 'Providers' },
  { id: 'models', icon: Box, label: 'Models' },
  { id: 'logs', icon: FileText, label: 'Logs' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { navigation, sidebarPosition, setCurrentScreen } = useUIStore();
  const { currentScreen } = navigation;

  const isLeft = sidebarPosition === 'left';

  return (
    <aside className={`sidebar ${isLeft ? 'sidebar-left' : 'sidebar-right'}`}>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              className={`sidebar-button ${isActive ? 'sidebar-button-active' : ''}`}
              onClick={() => setCurrentScreen(item.id)}
              aria-label={item.label}
            >
              <Icon className="sidebar-icon" />
              <span className={`sidebar-tooltip ${isLeft ? 'sidebar-tooltip-left' : 'sidebar-tooltip-right'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
```

#### Updated `package.json`
```json
{
  "dependencies": {
    // Remove this line:
    // "react-router-dom": "^6.x.x"
  }
}
```

### Integration Points

- **Uses:** Phase 1C UIStore
- **Modifies:** App.tsx, Sidebar.tsx
- **Removes:** react-router-dom dependency

### Success Criteria

- ✅ React Router completely removed
- ✅ Navigation works via UIStore state
- ✅ Browser back/forward buttons disabled (Electron app)
- ✅ No console errors about routing
- ✅ All pages accessible via sidebar
- ✅ TypeScript compilation succeeds

---

## Phase 3B: Common UI Components

**Priority:** HIGH
**Dependencies:** Phase 2A (CSS classes)
**Objective:** Create reusable presentational components to eliminate duplication

### Files Created

```
frontend/src/components/common/
├── LoadingState.tsx        # Standardized loading indicator
├── ErrorState.tsx          # Standardized error display
├── EmptyState.tsx          # Empty state placeholder
├── ConfirmDialog.tsx       # Confirmation modal
├── IconWrapper.tsx         # Icon with consistent sizing
└── Timestamp.tsx           # Formatted timestamp display
```

### Implementation Details

#### `LoadingState.tsx`
```typescript
/**
 * Loading State Component
 * Standardized loading indicator
 */

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  message = 'Loading...',
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="loading-container">
      <div className="loading-content">
        <Loader2 className={`loading-spinner ${sizeClasses[size]}`} />
        <p className="loading-text">{message}</p>
      </div>
    </div>
  );
}
```

#### `ErrorState.tsx`
```typescript
/**
 * Error State Component
 * Standardized error display with retry functionality
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message,
  title = 'Something went wrong',
  onRetry
}: ErrorStateProps) {
  return (
    <div className="error-container">
      <div className="error-content">
        <AlertCircle className="error-icon" />
        <h2 className="error-title">{title}</h2>
        <p className="error-message">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### `EmptyState.tsx`
```typescript
/**
 * Empty State Component
 * Displayed when no data is available
 */

import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = FileQuestion
}: EmptyStateProps) {
  return (
    <div className="error-container">
      <div className="error-content">
        <Icon className="error-icon" />
        <h2 className="error-title">{title}</h2>
        {description && <p className="error-message">{description}</p>}
        {onAction && actionLabel && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### `ConfirmDialog.tsx`
```typescript
/**
 * Confirm Dialog Component
 * Reusable confirmation modal
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-destructive' : ''}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

#### `IconWrapper.tsx`
```typescript
/**
 * Icon Wrapper Component
 * Consistent icon sizing and styling
 */

import type { LucideIcon } from 'lucide-react';

interface IconWrapperProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconWrapper({ icon: Icon, size = 'md', className = '' }: IconWrapperProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return <Icon className={`${sizeClasses[size]} ${className}`} />;
}
```

#### `Timestamp.tsx`
```typescript
/**
 * Timestamp Component
 * Formatted timestamp display with relative time
 */

import { formatDistanceToNow } from 'date-fns';

interface TimestampProps {
  value: string | number | Date;
  relative?: boolean;
  className?: string;
}

export function Timestamp({ value, relative = true, className = '' }: TimestampProps) {
  const date = typeof value === 'string' || typeof value === 'number'
    ? new Date(value)
    : value;

  const displayValue = relative
    ? formatDistanceToNow(date, { addSuffix: true })
    : date.toLocaleString();

  return (
    <time className={className} dateTime={date.toISOString()}>
      {displayValue}
    </time>
  );
}
```

### Integration Points

- **Uses:** Phase 2A CSS classes
- **Uses:** Shadcn UI components
- **Used by:** Phase 4+ pages and components

### Success Criteria

- ✅ All common components created
- ✅ Components use CSS classes from Phase 2A
- ✅ No inline Tailwind in components
- ✅ Proper TypeScript types
- ✅ Components are reusable and composable
- ✅ JSDoc comments on all components

---

## Projected File & Folder Structure After Phase 3

```
frontend/src/
├── types/
│   ├── activity.types.ts           ✅ Phase 1A
│   ├── settings.types.ts           ✅ Phase 1A
│   ├── provider.types.ts           ✅ Phase 1A
│   ├── model.types.ts              ✅ Phase 1A
│   ├── logs.types.ts               ✅ Phase 1A
│   ├── ui.types.ts                 ✅ Phase 1A
│   ├── api.types.ts                ✅ Phase 1A
│   └── common.types.ts             ✅ Phase 1A
├── services/
│   ├── activityService.ts          ✅ Phase 1B
│   ├── settingsService.ts          ✅ Phase 1B
│   ├── providerService.ts          ✅ Phase 1B
│   ├── modelService.ts             ✅ Phase 1B
│   ├── logsService.ts              ✅ Phase 1B
│   └── proxyService.ts             ✅ Phase 1B
├── stores/
│   ├── uiStore.ts                  ✅ Phase 1C
│   ├── activityStore.ts            ✅ Phase 1C
│   ├── providerStore.ts            ✅ Phase 1C
│   ├── modelStore.ts               ✅ Phase 1C
│   └── settingsStore.ts            ✅ Phase 1C
├── components/
│   ├── common/                     ✅ Phase 3B
│   │   ├── LoadingState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── IconWrapper.tsx
│   │   └── Timestamp.tsx
│   ├── navigation/                 ✅ Phase 3A
│   │   └── ScreenRenderer.tsx
│   ├── layout/                     🔄 Modified Phase 3A
│   │   ├── Sidebar.tsx
│   │   ├── TitleBar.tsx
│   │   ├── AppLayout.tsx
│   │   └── PageLayout.tsx
│   ├── ui/                         (Existing shadcn components)
│   ├── activity/                   ⬜ Phase 4A
│   ├── settings/                   ⬜ Phase 4B
│   ├── providers/                  ⬜ Phase 4C
│   ├── models/                     ⬜ Phase 4D
│   └── dashboard/                  ⬜ Phase 4F
├── pages/
│   ├── HomePage.tsx                ⬜ Phase 4F
│   ├── ActivityPage.tsx            ⬜ Phase 4A
│   ├── LogsPage.tsx                ⬜ Phase 4E
│   ├── SettingsPage.tsx            ⬜ Phase 4B
│   ├── providers/                  ⬜ Phase 4C
│   └── models/                     ⬜ Phase 4D
├── lib/
│   └── config.ts                   (Existing)
├── index.css                       ✅ Phase 2A/2B
├── App.tsx                         ✅ Phase 3A
└── main.tsx                        ✅ Phase 3A
```

---

## Phase 4A: Activity Domain Migration

**Priority:** MEDIUM
**Dependencies:** Phase 1A, 1B, 1C, 2A, 3B
**Objective:** Migrate Activity page and components to new architecture

### Files Modified

```
frontend/src/pages/ActivityPage.tsx
```

### Files Created

```
frontend/src/components/activity/
├── ActivityList.tsx        # Activity feed list component
└── ActivityStats.tsx       # Statistics display component
```

### Implementation Details

#### `ActivityList.tsx`
```typescript
/**
 * Activity List Component
 * Displays list of activity items
 */

import type { ActivityItem } from '@/types/activity.types';
import { Database, Cpu, MessageSquare, FileText, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Timestamp } from '@/components/common/Timestamp';

interface ActivityListProps {
  activities: ActivityItem[];
}

function getActivityIcon(type: string) {
  const iconMap = {
    database: { icon: Database, colorClass: 'activity-color-database' },
    api: { icon: Cpu, colorClass: 'activity-color-api' },
    request: { icon: MessageSquare, colorClass: 'activity-color-request' },
    log: { icon: FileText, colorClass: 'activity-color-log' },
    default: { icon: Activity, colorClass: 'activity-color-default' },
  };

  return iconMap[type] || iconMap.default;
}

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Activity will appear here as you use the application"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="section-header">Recent Activity</CardTitle>
        <CardDescription className="section-description">
          Latest system events and changes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="activity-list">
          {activities.map((item) => {
            const { icon: Icon, colorClass } = getActivityIcon(item.type);

            return (
              <div key={item.id} className="activity-item">
                <div className={`activity-icon-wrapper ${colorClass}`}>
                  <Icon className="activity-icon" />
                </div>
                <div className="activity-content">
                  <p className="activity-description">{item.description}</p>
                  <Timestamp
                    value={item.timestamp_ms}
                    className="activity-timestamp"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### `ActivityStats.tsx`
```typescript
/**
 * Activity Stats Component
 * Displays activity statistics
 */

import type { ActivityStats as Stats } from '@/types/activity.types';
import { Database, Box, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityStatsProps {
  stats: Stats;
}

export function ActivityStats({ stats }: ActivityStatsProps) {
  const statItems = [
    {
      title: 'Total Providers',
      value: stats.total_providers,
      change: stats.providers_change,
      icon: Database,
    },
    {
      title: 'Active Models',
      value: stats.active_models,
      change: stats.models_change,
      icon: Box,
    },
    {
      title: 'API Requests',
      value: stats.api_requests,
      change: stats.requests_change,
      icon: Activity,
    },
  ];

  return (
    <div className="stats-grid">
      {statItems.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title}>
            <CardHeader className="stat-card-header">
              <CardTitle className="stat-card-title">{item.title}</CardTitle>
              <Icon className="stat-card-icon" />
            </CardHeader>
            <CardContent>
              <div className="stat-card-value">{item.value}</div>
              <p className="stat-card-change">{item.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

#### Updated `ActivityPage.tsx`
```typescript
/**
 * Activity Page
 * Main activity feed page
 */

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useActivityStore } from '@/stores/activityStore';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ActivityList } from '@/components/activity/ActivityList';
import { ActivityStats } from '@/components/activity/ActivityStats';

export function ActivityPage() {
  const { activity, stats, isLoading, error, fetchActivity, refreshActivity } =
    useActivityStore();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (isLoading) {
    return (
      <PageLayout>
        <LoadingState message="Loading activity..." />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <ErrorState message={error} onRetry={fetchActivity} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Activity Feed</h1>
            <p className="page-description">
              Track system events and changes in real-time
            </p>
          </div>
          <Button
            variant="outline"
            className="button-refresh"
            onClick={refreshActivity}
          >
            <RefreshCw className="button-icon" />
            Refresh
          </Button>
        </div>

        {stats && <ActivityStats stats={stats} />}
        <ActivityList activities={activity} />
      </div>
    </PageLayout>
  );
}
```

### Integration Points

- **Uses:** Phase 1A types, Phase 1B services, Phase 1C stores
- **Uses:** Phase 2A CSS classes
- **Uses:** Phase 3B common components

### Success Criteria

- ✅ No inline Tailwind classes
- ✅ Business logic in store, not component
- ✅ Named exports
- ✅ Proper TypeScript types
- ✅ Reusable sub-components created
- ✅ Loading and error states handled

---

## Phases 4B-4F: Additional Domain Migrations

Following the same pattern as Phase 4A, migrate each domain:

- **Phase 4B:** Settings Domain (SettingsPage + components)
- **Phase 4C:** Providers Domain (ProvidersListPage, CreateProviderPage, EditProviderPage + components)
- **Phase 4D:** Models Domain (ModelsListPage, CreateModelPage, EditModelPage + components)
- **Phase 4E:** Logs Domain (LogsPage + components)
- **Phase 4F:** Home/Dashboard Domain (HomePage + dashboard components)

Each phase follows identical pattern:
1. Create domain-specific components
2. Update page to use stores
3. Remove inline Tailwind
4. Use CSS classes from Phase 2A
5. Use common components from Phase 3B

---

## Phase 5A: Layout Components Migration

**Priority:** LOW
**Dependencies:** Phase 2A
**Objective:** Update layout components to use CSS classes

### Files Modified

```
frontend/src/components/layout/
├── Sidebar.tsx             (Already done in Phase 3A)
├── TitleBar.tsx
├── AppLayout.tsx
├── PageLayout.tsx
├── Header.tsx
└── Footer.tsx
```

---

## Phase 5B: Shared Components Migration

**Priority:** LOW
**Dependencies:** Phase 2A
**Objective:** Update shared components to use CSS classes

### Files Modified

```
frontend/src/components/
├── table/DataTable.tsx
├── form/FormField.tsx
├── common/StatusBadge.tsx
├── dashboard/CodeExample.tsx
├── dashboard/ProxyControlCard.tsx
└── dashboard/SessionsCard.tsx
```

---

## Phase 6: Export Standardization

**Priority:** LOW
**Dependencies:** None
**Objective:** Convert all default exports to named exports

### Files Modified

All page files (~20 files) - Simple find/replace operation

---

## Phase 7: Cleanup and Optimization

**Priority:** LOW
**Dependencies:** All previous phases
**Objective:** Remove unused code, optimize performance, add memoization

### Tasks

- Remove console.log statements
- Add React.memo where beneficial
- Remove unused imports
- Optimize re-renders
- Add JSDoc comments
- Run Prettier/ESLint

---

## Summary

This implementation plan provides a **structured, incremental approach** to fixing all 50+ architectural violations identified in the audit. By prioritizing foundation work (types, services, stores) before component migrations, we ensure:

1. **Type safety** throughout the codebase
2. **Single Responsibility Principle** - services handle business logic, components handle presentation
3. **DRY** - shared types, services, and components eliminate duplication
4. **Domain-Driven Design** - clear organization by business domain
5. **Progressive enhancement** - each phase builds on previous work
6. **No breaking changes** - application remains functional during migration

**Phases ordered by priority:**
1. Foundation (1A, 1B, 1C) - Most critical
2. CSS Architecture (2A, 2B) - Enables all other work
3. Navigation (3A, 3B) - Major architectural change
4. Domain Migrations (4A-4F) - Incremental improvements
5. Polish (5A, 5B, 6, 7) - Final cleanup
