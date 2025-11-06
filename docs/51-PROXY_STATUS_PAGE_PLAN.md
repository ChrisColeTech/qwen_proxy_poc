# 51 - Proxy Status Page Plan

## Document Information
- **Document**: 51 - Proxy Status Page Plan
- **Version**: 3.0
- **Date**: November 5, 2025
- **Purpose**: Implementation plan for Proxy Status management page
- **Related**: Doc 56 (UX Guide), Doc 01A (Architecture Guide), Doc 19 (Backend Lifecycle)

---

## Work Progression

| Phase | Name | Priority | Status | Description |
|-------|------|----------|--------|-------------|
| 1 | Types & Services | Highest | Not Started | Type definitions and service verification |
| 2 | State Management | Highest | Not Started | Zustand store for proxy status |
| 3 | UI Components | High | Not Started | Status components (reusable where applicable) |
| 4 | Page Assembly | Medium | Not Started | Page with shared CSS patterns |

---

## Page Mockup

```
┌─────────────────────────────────────────────────────────┐
│ Proxy Status                                       [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ● RUNNING                                              │
│                                                         │
│  Started: 2:34 PM                                       │
│  Uptime: 2h 15m                                         │
│                                                         │
│  [Stop Proxy]                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Providers   │ │   Models    │ │ Credentials │
│      3      │ │     12      │ │   ✓ Valid   │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## User Purpose

**Primary Question**: Is the proxy running?

**User Actions**:
1. Check proxy status at a glance
2. Start proxy when stopped
3. Stop proxy when running
4. See overview of system readiness

**What NOT to show**:
- ❌ PID numbers, port numbers
- ❌ Separate status for two servers
- ❌ "Partial" running states
- ❌ curl commands

---

## Backend API Reference

**Verified from**: `/backend/api-server/src/routes/proxy-control.js`

### GET /api/proxy/status
```json
{
  "status": "running" | "stopped",
  "providerRouter": { "running": boolean, "port": 3001, "uptime": number },
  "qwenProxy": { "running": boolean, "port": 3000, "uptime": number },
  "providers": { "total": number, "enabled": number },
  "models": { "total": number },
  "credentials": { "valid": boolean }
}
```

### POST /api/proxy/start
No request body. Returns same as GET /api/proxy/status.

### POST /api/proxy/stop
No request body. Returns `{ success: boolean, status: string, message: string }`.

---

## Phase 1: Types & Services

**Priority**: Highest

### Files to Create

```
src/types/proxy.types.ts
```

### Files to Verify

```
src/services/proxy.service.ts  [Should exist]
src/services/api.service.ts    [Integration]
```

### Type Definitions

**File**: `src/types/proxy.types.ts`

```typescript
export interface ProxyStatusResponse {
  status: 'running' | 'stopped' | 'partial';
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
    items: any[];
    total: number;
    enabled: number;
  };
  models: {
    items: any[];
    total: number;
  };
  credentials: {
    valid: boolean;
  };
}

export type ProxyState = 'running' | 'stopped';

export interface ProxyStatus {
  state: ProxyState;
  startedAt?: Date;
  uptime?: number;
}

export interface ProxySummary {
  providersCount: number;
  modelsCount: number;
  credentialsValid: boolean;
}
```

### File Tree

```
src/
├── types/
│   └── proxy.types.ts              [NEW]
└── services/
    ├── proxy.service.ts            [VERIFY]
    └── api.service.ts              [INTEGRATION]
```

---

## Phase 2: State Management

**Priority**: Highest

### Files to Create

```
src/stores/proxyStore.ts
src/hooks/useProxyStatus.ts
```

### Store Implementation

**File**: `src/stores/proxyStore.ts`

```typescript
import { create } from 'zustand';
import { proxyService } from '@/services/proxy.service';
import type { ProxyStatus, ProxySummary } from '@/types/proxy.types';

interface ProxyStore {
  status: ProxyStatus | null;
  summary: ProxySummary | null;
  loading: boolean;
  error: string | null;
  _pollingInterval: NodeJS.Timeout | null;

  fetchStatus: () => Promise<void>;
  startProxy: () => Promise<void>;
  stopProxy: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useProxyStore = create<ProxyStore>((set, get) => ({
  status: null,
  summary: null,
  loading: false,
  error: null,
  _pollingInterval: null,

  fetchStatus: async () => {
    try {
      set({ loading: true, error: null });
      const response = await proxyService.getProxyStatus();

      const isRunning = response.status === 'running';
      const uptime = isRunning ? response.providerRouter.uptime : undefined;

      set({
        status: {
          state: isRunning ? 'running' : 'stopped',
          uptime,
          startedAt: uptime ? new Date(Date.now() - uptime * 1000) : undefined
        },
        summary: {
          providersCount: response.providers.total,
          modelsCount: response.models.total,
          credentialsValid: response.credentials.valid
        },
        loading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch status',
        loading: false
      });
    }
  },

  startProxy: async () => {
    try {
      set({ loading: true, error: null });
      await proxyService.startProxy();
      await get().fetchStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start proxy',
        loading: false
      });
      throw error;
    }
  },

  stopProxy: async () => {
    try {
      set({ loading: true, error: null });
      await proxyService.stopProxy();
      await get().fetchStatus();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to stop proxy',
        loading: false
      });
      throw error;
    }
  },

  startPolling: () => {
    const { _pollingInterval } = get();
    if (_pollingInterval) return;

    get().fetchStatus();
    const interval = setInterval(() => get().fetchStatus(), 10000);
    set({ _pollingInterval: interval });
  },

  stopPolling: () => {
    const { _pollingInterval } = get();
    if (_pollingInterval) {
      clearInterval(_pollingInterval);
      set({ _pollingInterval: null });
    }
  }
}));
```

**File**: `src/hooks/useProxyStatus.ts`

```typescript
import { useEffect } from 'react';
import { useProxyStore } from '@/stores/proxyStore';

export const useProxyStatus = () => {
  const store = useProxyStore();

  useEffect(() => {
    store.startPolling();
    return () => store.stopPolling();
  }, []);

  return {
    status: store.status,
    summary: store.summary,
    loading: store.loading,
    error: store.error,
    startProxy: store.startProxy,
    stopProxy: store.stopProxy,
    refresh: store.fetchStatus
  };
};
```

### File Tree

```
src/
├── stores/
│   └── proxyStore.ts               [NEW]
├── hooks/
│   └── useProxyStatus.ts           [NEW]
├── services/
│   └── proxy.service.ts            [INTEGRATION]
└── types/
    └── proxy.types.ts              [INTEGRATION]
```

---

## Phase 3: UI Components

**Priority**: High

### Files to Create

```
src/components/proxy-status/StatusIndicator.tsx
src/components/proxy-status/StatusInfo.tsx
src/components/proxy-status/ActionButton.tsx
src/utils/time.ts
```

### Component Specifications

**StatusIndicator.tsx** - Shows ● RUNNING / ○ STOPPED

```typescript
import type { ProxyState } from '@/types/proxy.types';

export function StatusIndicator({ state }: { state: ProxyState }) {
  return (
    <div className="status-indicator">
      <span className={`status-dot status-dot--${state}`} />
      <span className="status-label">
        {state === 'running' ? 'RUNNING' : 'STOPPED'}
      </span>
    </div>
  );
}
```

**StatusInfo.tsx** - Shows start time and uptime

```typescript
import { formatTime, formatUptime } from '@/utils/time';

export function StatusInfo({ startedAt, uptime }: {
  startedAt?: Date;
  uptime?: number;
}) {
  if (!startedAt || !uptime) return null;

  return (
    <div className="status-info">
      <div className="status-info-item">
        <span className="status-info-label">Started:</span>
        <span className="status-info-value">{formatTime(startedAt)}</span>
      </div>
      <div className="status-info-item">
        <span className="status-info-label">Uptime:</span>
        <span className="status-info-value">{formatUptime(uptime)}</span>
      </div>
    </div>
  );
}
```

**ActionButton.tsx** - Start/Stop button

```typescript
import type { ProxyState } from '@/types/proxy.types';

export function ActionButton({ state, loading, onStart, onStop }: {
  state: ProxyState;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  return (
    <button
      className={`action-button action-button--${state}`}
      onClick={state === 'running' ? onStop : onStart}
      disabled={loading}
    >
      {loading
        ? (state === 'running' ? 'Stopping...' : 'Starting...')
        : (state === 'running' ? 'Stop Proxy' : 'Start Proxy')
      }
    </button>
  );
}
```

**time.ts** - Utility functions

```typescript
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`;
}
```

### File Tree

```
src/
├── components/
│   └── proxy-status/
│       ├── StatusIndicator.tsx     [NEW]
│       ├── StatusInfo.tsx          [NEW]
│       └── ActionButton.tsx        [NEW]
├── utils/
│   └── time.ts                     [NEW]
├── hooks/
│   └── useProxyStatus.ts           [INTEGRATION]
└── types/
    └── proxy.types.ts              [INTEGRATION]
```

---

## Phase 4: Page Assembly

**Priority**: Medium

### Files to Create

```
src/pages/ProxyStatusPage.tsx
```

### Files to Modify

```
src/index.css  (add shared CSS patterns)
```

### Page Implementation

**File**: `src/pages/ProxyStatusPage.tsx`

```typescript
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { StatusIndicator } from '@/components/proxy-status/StatusIndicator';
import { StatusInfo } from '@/components/proxy-status/StatusInfo';
import { ActionButton } from '@/components/proxy-status/ActionButton';

export function ProxyStatusPage() {
  const { status, summary, loading, error, startProxy, stopProxy, refresh } = useProxyStatus();

  const handleStop = async () => {
    if (!confirm('Stop the proxy? Active connections will be terminated.')) return;
    try {
      await stopProxy();
    } catch (error) {
      // Error handled in store
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
        <h1 className="page-title">Proxy Status</h1>
        <button
          className="refresh-button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="status-card">
        {status && <StatusIndicator state={status.state} />}
        {status?.state === 'running' && (
          <StatusInfo startedAt={status.startedAt} uptime={status.uptime} />
        )}
        {status && (
          <ActionButton
            state={status.state}
            loading={loading}
            onStart={startProxy}
            onStop={handleStop}
          />
        )}
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">Providers</div>
          <div className="summary-card-value">{summary?.providersCount ?? '-'}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Models</div>
          <div className="summary-card-value">{summary?.modelsCount ?? '-'}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Credentials</div>
          <div className="summary-card-value">
            {summary?.credentialsValid ? '✓ Valid' : '○ Invalid'}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Shared CSS Patterns

**File**: `src/index.css` (append - these styles shared across all pages)

```css
/* ============================================
   SHARED PAGE PATTERNS
   Used by all pages - define once, use everywhere
   ============================================ */

/* Page Container */
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--foreground);
}

.refresh-button {
  padding: 0.5rem;
  background: var(--secondary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--secondary-foreground);
  transition: background-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: var(--secondary-hover);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Summary Cards Grid */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.summary-card-label {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin-bottom: 0.5rem;
}

.summary-card-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--foreground);
}

/* Data Table (for providers, models, etc) */
.data-table {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  border-collapse: collapse;
  overflow: hidden;
}

.data-table thead {
  background: var(--muted);
  border-bottom: 1px solid var(--border);
}

.data-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--foreground);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.data-table tbody tr:hover {
  background: var(--accent);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge--enabled {
  background: var(--success-bg);
  color: var(--success-foreground);
}

.status-badge--disabled {
  background: var(--muted);
  color: var(--muted-foreground);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Error State */
.error-state {
  background: var(--destructive-bg);
  border: 1px solid var(--destructive);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}

.error-message {
  color: var(--destructive-foreground);
  margin-bottom: 1rem;
}

.error-retry {
  padding: 0.5rem 1.5rem;
  background: var(--destructive);
  color: var(--destructive-foreground);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

/* Empty State */
.empty-state {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
}

.empty-state-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 0.5rem;
}

.empty-state-description {
  color: var(--muted-foreground);
}

/* Responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .page-container {
    padding: 1rem;
  }
}

/* ============================================
   PROXY STATUS PAGE SPECIFIC
   Only styles unique to this page
   ============================================ */

.status-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.status-dot--running {
  width: 12px;
  height: 12px;
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
  border-radius: 50%;
}

.status-dot--stopped {
  width: 12px;
  height: 12px;
  background: transparent;
  border: 2px solid var(--muted-foreground);
  border-radius: 50%;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.status-info-item {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  color: var(--muted-foreground);
}

.status-info-label {
  font-weight: 500;
}

.status-info-value {
  color: var(--foreground);
}

.action-button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button--stopped {
  background: var(--primary);
  color: var(--primary-foreground);
}

.action-button--stopped:hover:not(:disabled) {
  background: var(--primary-hover);
}

.action-button--running {
  background: var(--destructive);
  color: var(--destructive-foreground);
}

.action-button--running:hover:not(:disabled) {
  background: var(--destructive-hover);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### File Tree

```
src/
├── pages/
│   └── ProxyStatusPage.tsx         [NEW]
├── components/
│   └── proxy-status/               [INTEGRATION]
├── hooks/
│   └── useProxyStatus.ts           [INTEGRATION]
└── index.css                       [MODIFIED]
```

---

## Architecture Compliance

### DRY (Don't Repeat Yourself)
- ✅ **Shared CSS patterns** defined once in index.css
- ✅ `.page-container`, `.page-header`, `.summary-cards` used by all pages
- ✅ `.data-table` styles ready for providers/models pages
- ✅ Time formatting utilities in utils/time.ts

### SRP (Single Responsibility)
- ✅ StatusIndicator: Shows status dot + label
- ✅ StatusInfo: Shows times
- ✅ ActionButton: Shows start/stop button
- ✅ Page: Only composition
- ✅ Store: Only state management

### No Inline Tailwind
- ✅ All styling via semantic CSS classes
- ✅ BEM-like naming for page-specific styles

### Theme Variables Only
- ✅ All colors via var(--foreground), var(--success), etc.

---

## Related Documents

- **Doc 56**: UX Guide
- **Doc 01A**: Architecture Guide
- **Doc 19**: Backend Lifecycle

---

## Version History

- **v1.0**: Initial plan with too many components
- **v2.0**: Zustand + removed backend details
- **v3.0**: Shared CSS patterns following DRY - all pages use same base styles
