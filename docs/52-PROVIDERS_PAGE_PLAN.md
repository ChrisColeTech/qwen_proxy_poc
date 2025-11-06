# 52 - Providers Page Plan

## Document Information
- **Document**: 52 - Providers Page Plan
- **Version**: 3.0
- **Date**: November 5, 2025
- **Purpose**: Implementation plan for Providers management page
- **Related**: Doc 56 (UX Guide), Doc 01A (Architecture Guide), Doc 29 (Provider Router)

---

## Work Progression

| Phase | Name | Priority | Status | Description |
|-------|------|----------|--------|-------------|
| 1 | Types & Services | Highest | Not Started | Type definitions and service verification |
| 2 | State Management | Highest | Not Started | Zustand store for providers |
| 3 | UI Components | High | Not Started | Reusable badges only |
| 4 | Page Assembly | Medium | Not Started | Page with shared CSS patterns |

---

## Page Mockup

```
┌──────────────────────────────────────────────────────────┐
│ Providers                                           [↻]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Total    │  │  Enabled   │  │  Disabled  │        │
│  │     3      │  │      2     │  │      1     │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Name          Type        Status       Actions    │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Qwen Main     qwen-direct ● Enabled    [Test] [⋮] │ │
│  │ LM Studio     lm-studio   ○ Disabled   [Test] [⋮] │ │
│  │ Qwen Backup   qwen-proxy  ● Enabled    [Test] [⋮] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## User Purpose

**Primary Questions**:
- What providers do I have?
- Which ones are enabled?
- Are they working?

**User Actions**:
1. View list of providers
2. Enable/disable providers
3. Test connections
4. Delete providers

**What NOT to show**:
- ❌ Runtime "loaded" status
- ❌ Reload action
- ❌ Provider IDs
- ❌ Priority numbers

---

## Backend API Reference

**Verified from**: `/backend/api-server/src/routes/providers.js`

### GET /api/providers
```json
{
  "providers": [
    {
      "id": "qwen-direct",
      "name": "Qwen Direct",
      "type": "qwen-direct",
      "enabled": true,
      "priority": 0
    }
  ],
  "total": 1
}
```

### POST /api/providers/:id/enable
No request body. Returns `{ success: true, provider: Provider }`.

### POST /api/providers/:id/disable
No request body. Returns `{ success: true, provider: Provider }`.

### POST /api/providers/:id/test
No request body. Returns `{ provider_id, healthy, duration_ms, timestamp }`.

### DELETE /api/providers/:id
No request body. Returns `{ success: true, message: string }`.

---

## Phase 1: Types & Services

**Priority**: Highest

### Files to Create

```
src/types/providers.types.ts
```

### Files to Verify

```
src/services/providers.service.ts  [Should exist]
src/services/api.service.ts        [Integration]
```

### Type Definitions

**File**: `src/types/providers.types.ts`

```typescript
export interface Provider {
  id: string;
  name: string;
  type: 'qwen-direct' | 'qwen-proxy' | 'lm-studio';
  enabled: boolean;
  priority: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProvidersResponse {
  providers: Provider[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProviderTestResult {
  provider_id: string;
  healthy: boolean;
  duration_ms: number;
  timestamp: number;
}

export interface ProviderStats {
  total: number;
  enabled: number;
  disabled: number;
}
```

### File Tree

```
src/
├── types/
│   └── providers.types.ts          [NEW]
└── services/
    ├── providers.service.ts        [VERIFY]
    └── api.service.ts              [INTEGRATION]
```

---

## Phase 2: State Management

**Priority**: Highest

### Files to Create

```
src/stores/providersStore.ts
src/hooks/useProviders.ts
```

### Store Implementation

**File**: `src/stores/providersStore.ts`

```typescript
import { create } from 'zustand';
import { providersService } from '@/services/providers.service';
import type { Provider, ProviderStats } from '@/types/providers.types';

interface ProvidersStore {
  providers: Provider[];
  stats: ProviderStats;
  loading: boolean;
  error: string | null;
  testingIds: Set<string>;

  fetchProviders: () => Promise<void>;
  enableProvider: (id: string) => Promise<void>;
  disableProvider: (id: string) => Promise<void>;
  testProvider: (id: string) => Promise<ProviderTestResult>;
  deleteProvider: (id: string) => Promise<void>;
  calculateStats: () => void;
}

export const useProvidersStore = create<ProvidersStore>((set, get) => ({
  providers: [],
  stats: { total: 0, enabled: 0, disabled: 0 },
  loading: false,
  error: null,
  testingIds: new Set(),

  calculateStats: () => {
    const { providers } = get();
    const enabled = providers.filter(p => p.enabled).length;
    set({
      stats: {
        total: providers.length,
        enabled,
        disabled: providers.length - enabled
      }
    });
  },

  fetchProviders: async () => {
    try {
      set({ loading: true, error: null });
      const response = await providersService.listProviders();
      set({ providers: response.providers, loading: false });
      get().calculateStats();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch providers',
        loading: false
      });
    }
  },

  enableProvider: async (id: string) => {
    try {
      // Optimistic update
      const { providers } = get();
      set({ providers: providers.map(p => p.id === id ? { ...p, enabled: true } : p) });
      get().calculateStats();
      await providersService.enableProvider(id);
    } catch (error) {
      await get().fetchProviders(); // Revert
      throw error;
    }
  },

  disableProvider: async (id: string) => {
    try {
      // Optimistic update
      const { providers } = get();
      set({ providers: providers.map(p => p.id === id ? { ...p, enabled: false } : p) });
      get().calculateStats();
      await providersService.disableProvider(id);
    } catch (error) {
      await get().fetchProviders(); // Revert
      throw error;
    }
  },

  testProvider: async (id: string) => {
    const { testingIds } = get();
    testingIds.add(id);
    set({ testingIds: new Set(testingIds) });

    try {
      const result = await providersService.testProvider(id);
      return result;
    } finally {
      testingIds.delete(id);
      set({ testingIds: new Set(testingIds) });
    }
  },

  deleteProvider: async (id: string) => {
    try {
      await providersService.deleteProvider(id);
      await get().fetchProviders();
    } catch (error) {
      throw error;
    }
  }
}));
```

**File**: `src/hooks/useProviders.ts`

```typescript
import { useEffect } from 'react';
import { useProvidersStore } from '@/stores/providersStore';

export const useProviders = () => {
  const store = useProvidersStore();

  useEffect(() => {
    store.fetchProviders();
  }, []);

  return {
    providers: store.providers,
    stats: store.stats,
    loading: store.loading,
    error: store.error,
    testingIds: store.testingIds,
    enableProvider: store.enableProvider,
    disableProvider: store.disableProvider,
    testProvider: store.testProvider,
    deleteProvider: store.deleteProvider,
    refresh: store.fetchProviders
  };
};
```

### File Tree

```
src/
├── stores/
│   └── providersStore.ts           [NEW]
├── hooks/
│   └── useProviders.ts             [NEW]
├── services/
│   └── providers.service.ts        [INTEGRATION]
└── types/
    └── providers.types.ts          [INTEGRATION]
```

---

## Phase 3: UI Components

**Priority**: High

### Files to Create

```
src/components/providers/StatusBadge.tsx
src/components/providers/TypeBadge.tsx
```

**Note**: Only creating small reusable badges. Table markup goes directly in page using shared `.data-table` CSS.

### Component Specifications

**StatusBadge.tsx** - Shows ● Enabled / ○ Disabled

```typescript
export function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <div className={`status-badge status-badge--${enabled ? 'enabled' : 'disabled'}`}>
      <span className="status-dot" />
      <span>{enabled ? 'Enabled' : 'Disabled'}</span>
    </div>
  );
}
```

**TypeBadge.tsx** - Shows provider type

```typescript
const TYPE_LABELS: Record<string, string> = {
  'qwen-direct': 'qwen-direct',
  'qwen-proxy': 'qwen-proxy',
  'lm-studio': 'lm-studio'
};

export function TypeBadge({ type }: {
  type: 'qwen-direct' | 'qwen-proxy' | 'lm-studio'
}) {
  return (
    <span className="type-badge">
      {TYPE_LABELS[type] || type}
    </span>
  );
}
```

### File Tree

```
src/
├── components/
│   └── providers/
│       ├── StatusBadge.tsx         [NEW]
│       └── TypeBadge.tsx           [NEW]
├── hooks/
│   └── useProviders.ts             [INTEGRATION]
└── types/
    └── providers.types.ts          [INTEGRATION]
```

---

## Phase 4: Page Assembly

**Priority**: Medium

### Files to Create

```
src/pages/ProvidersPage.tsx
```

### Files to Modify

```
src/index.css  (add providers-specific styles)
```

### Files to Use

```
src/hooks/useProviders.ts                 [Phase 2]
src/components/providers/StatusBadge.tsx  [Phase 3]
src/components/providers/TypeBadge.tsx    [Phase 3]
```

### Page Implementation

**File**: `src/pages/ProvidersPage.tsx`

```typescript
import { useState } from 'react';
import { useProviders } from '@/hooks/useProviders';
import { StatusBadge } from '@/components/providers/StatusBadge';
import { TypeBadge } from '@/components/providers/TypeBadge';
import { toast } from 'react-hot-toast';

export function ProvidersPage() {
  const {
    providers,
    stats,
    loading,
    error,
    testingIds,
    enableProvider,
    disableProvider,
    testProvider,
    deleteProvider,
    refresh
  } = useProviders();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleEnable = async (id: string) => {
    try {
      await enableProvider(id);
      toast.success('Provider enabled');
    } catch (error) {
      toast.error('Failed to enable provider');
    }
  };

  const handleDisable = async (id: string) => {
    try {
      await disableProvider(id);
      toast.success('Provider disabled');
    } catch (error) {
      toast.error('Failed to disable provider');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testProvider(id);
      if (result.healthy) {
        toast.success(`Provider working (${result.duration_ms}ms)`);
      } else {
        toast.error('Provider connection failed');
      }
    } catch (error) {
      toast.error('Failed to test provider');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;

    try {
      await deleteProvider(id);
      toast.success('Provider deleted');
    } catch (error) {
      toast.error('Failed to delete provider');
    }
  };

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <div className="error-message">{error}</div>
          <button className="error-retry" onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Providers</h1>
        <button
          className="refresh-button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Summary Cards - uses shared .summary-cards CSS */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">Total</div>
          <div className="summary-card-value">{stats.total}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Enabled</div>
          <div className="summary-card-value">{stats.enabled}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Disabled</div>
          <div className="summary-card-value">{stats.disabled}</div>
        </div>
      </div>

      {/* Empty State */}
      {providers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No providers configured</div>
          <div className="empty-state-description">
            Providers route AI requests to different backends (Qwen, LM Studio, etc).
          </div>
        </div>
      ) : (
        /* Data Table - uses shared .data-table CSS */
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(provider => (
              <tr key={provider.id}>
                <td>{provider.name}</td>
                <td>
                  <TypeBadge type={provider.type} />
                </td>
                <td>
                  <StatusBadge enabled={provider.enabled} />
                </td>
                <td className="providers-actions-cell">
                  <button
                    className="test-button"
                    onClick={() => handleTest(provider.id)}
                    disabled={testingIds.has(provider.id)}
                  >
                    {testingIds.has(provider.id) ? 'Testing...' : 'Test'}
                  </button>

                  <div className="action-menu">
                    <button
                      className="action-menu-trigger"
                      onClick={() => setOpenMenuId(
                        openMenuId === provider.id ? null : provider.id
                      )}
                    >
                      ⋮
                    </button>

                    {openMenuId === provider.id && (
                      <div className="action-menu-dropdown">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            provider.enabled
                              ? handleDisable(provider.id)
                              : handleEnable(provider.id);
                          }}
                        >
                          {provider.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            handleTest(provider.id);
                          }}
                        >
                          Test Connection
                        </button>
                        <button
                          className="action-menu-delete"
                          onClick={() => {
                            setOpenMenuId(null);
                            handleDelete(provider.id, provider.name);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

### Page-Specific CSS

**File**: `src/index.css` (append - page-specific styles only)

```css
/* ============================================
   PROVIDERS PAGE SPECIFIC
   Only styles unique to this page
   Note: Shared styles (.page-container, .data-table, etc.)
   already defined in Proxy Status Page section
   ============================================ */

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: monospace;
}

.providers-actions-cell {
  text-align: right;
}

.providers-actions-cell .test-button,
.providers-actions-cell .action-menu {
  display: inline-block;
  vertical-align: middle;
}

.test-button {
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.test-button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-menu {
  position: relative;
}

.action-menu-trigger {
  padding: 0.5rem;
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--foreground);
  border-radius: 4px;
  transition: background-color 0.15s;
}

.action-menu-trigger:hover {
  background: var(--accent);
}

.action-menu-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.25rem;
  background: var(--popover);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 160px;
}

.action-menu-dropdown button {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  font-size: 0.875rem;
  color: var(--popover-foreground);
  cursor: pointer;
  transition: background-color 0.15s;
}

.action-menu-dropdown button:hover {
  background: var(--accent);
}

.action-menu-delete {
  color: var(--destructive) !important;
}
```

### File Tree

```
src/
├── pages/
│   └── ProvidersPage.tsx           [NEW]
├── components/
│   └── providers/
│       ├── StatusBadge.tsx         [INTEGRATION]
│       └── TypeBadge.tsx           [INTEGRATION]
├── hooks/
│   └── useProviders.ts             [INTEGRATION]
└── index.css                       [MODIFIED]
```

---

## Architecture Compliance

### DRY (Don't Repeat Yourself)
- ✅ **Uses shared CSS** from Doc 51: `.page-container`, `.page-header`, `.summary-cards`, `.data-table`
- ✅ **Standard HTML table** with shared styles (not custom wrapper components)
- ✅ **Only page-specific CSS** added (.type-badge, .action-menu, etc.)
- ✅ StatusBadge reusable across pages

### SRP (Single Responsibility)
- ✅ StatusBadge: Shows enabled/disabled
- ✅ TypeBadge: Shows provider type
- ✅ Page: Composition + user interactions
- ✅ Store: State management

### No Inline Tailwind
- ✅ All styling via semantic CSS classes
- ✅ Shared styles in one place

### Theme Variables Only
- ✅ All colors via var(--primary), var(--destructive), etc.

---

## Related Documents

- **Doc 56**: UX Guide
- **Doc 01A**: Architecture Guide
- **Doc 29**: Provider Router

---

## Version History

- **v1.0**: Initial plan
- **v2.0**: Removed runtime status, reload action
- **v3.0**: **DRY approach** - removed custom table components, use shared .data-table CSS, standard HTML tables
