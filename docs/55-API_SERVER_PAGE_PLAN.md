# 55 - API Server Page Plan

## Document Information
- **Document**: 55 - API Server Page Plan
- **Version**: 1.0
- **Date**: November 5, 2025
- **Purpose**: Implementation plan for API Server health check page
- **Related**: Doc 56 (UX Guide), Doc 01A (Architecture Guide), Doc 19 (Backend Lifecycle)

---

## Work Progression

| Phase | Name | Priority | Status | Description |
|-------|------|----------|--------|-------------|
| 1 | Types & Services | Highest | Not Started | Type definitions and service verification |
| 2 | State Management | Highest | Not Started | Zustand store for API server health |
| 3 | UI Components | High | Not Started | Status badge component only |
| 4 | Page Assembly | Medium | Not Started | Page with shared CSS patterns |

---

## Page Mockup

**When Connected:**
```
┌─────────────────────────────────────────────────────────┐
│ API Server                                         [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ● CONNECTED                                            │
│                                                         │
│  URL: http://localhost:3002                             │
│  Response time: 12ms                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Providers  │ │   Models    │ │  Sessions   │
│      3      │ │     12      │ │      8      │
└─────────────┘ └─────────────┘ └─────────────┘

Quick Test:
┌─────────────────────────────────────────────────────────┐
│ curl http://localhost:3002/api/health           [Copy] │
└─────────────────────────────────────────────────────────┘
```

**When Offline:**
```
┌─────────────────────────────────────────────────────────┐
│ API Server                                         [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ○ NOT CONNECTED                                        │
│                                                         │
│  Cannot reach API server                                │
│                                                         │
│  Troubleshooting:                                       │
│  • Check if server is running                           │
│  • Expected at: http://localhost:3002                   │
│  • Try: cd backend/api-server && npm run dev            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## User Purpose

**Primary Questions**:
- Is the API server working?
- What URL is it at?
- How do I troubleshoot if it's down?

**User Actions**:
1. Check API server status
2. See response time
3. Copy health check command
4. Get troubleshooting help

**What NOT to show**:
- ❌ Complete API endpoint documentation (53 endpoints)
- ❌ Request/response schemas for every endpoint
- ❌ Section-by-section API reference
- ❌ curl examples for all operations
- ❌ Query parameter documentation
- ❌ Endpoint categories and organization
- ❌ API playground or request builder

---

## Backend API Reference

**Verified from**: `/backend/api-server/src/server.js` and `/backend/api-server/src/routes/proxy-control.js`

### GET /api/health
Response:
```json
{
  "status": "ok",
  "service": "api-server",
  "timestamp": "2025-11-05T10:30:00.000Z"
}
```

### GET /api/proxy/status
Response (used for summary stats):
```json
{
  "status": "running",
  "providers": {
    "items": [...],
    "total": 3,
    "enabled": 2
  },
  "models": {
    "items": [...],
    "total": 12
  },
  "credentials": {
    "valid": true
  }
}
```

---

## Phase 1: Types & Services

**Priority**: Highest

### Files to Create

```
src/types/api-server.types.ts
```

### Files to Verify

```
src/services/api.service.ts  [Integration - base API client]
```

### Type Definitions

**File**: `src/types/api-server.types.ts`

```typescript
export type ApiServerStatus = 'connected' | 'disconnected';

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface ApiServerHealth {
  status: ApiServerStatus;
  url: string;
  responseTime: number | null;
  lastCheck: Date;
}

export interface ApiServerStats {
  providers: number;
  models: number;
  sessions: number;
}
```

### Service Method

**File**: `src/services/api.service.ts` (add method)

```typescript
// Add to existing api.service.ts
export async function checkHealth(): Promise<{ data: HealthResponse; responseTime: number }> {
  const startTime = performance.now();
  const response = await fetch(`${API_BASE_URL}/api/health`);
  const endTime = performance.now();

  if (!response.ok) {
    throw new Error('Health check failed');
  }

  const data = await response.json();
  return {
    data,
    responseTime: Math.round(endTime - startTime)
  };
}
```

### File Tree

```
src/
├── types/
│   └── api-server.types.ts         [NEW]
└── services/
    └── api.service.ts              [MODIFY - add checkHealth method]
```

---

## Phase 2: State Management

**Priority**: Highest

### Files to Create

```
src/stores/apiServerStore.ts
src/hooks/useApiServer.ts
```

### Store Implementation

**File**: `src/stores/apiServerStore.ts`

```typescript
import { create } from 'zustand';
import { checkHealth } from '@/services/api.service';
import { proxyService } from '@/services/proxy.service';
import type { ApiServerHealth, ApiServerStats } from '@/types/api-server.types';

interface ApiServerStore {
  health: ApiServerHealth | null;
  stats: ApiServerStats | null;
  loading: boolean;
  error: string | null;
  _pollingInterval: NodeJS.Timeout | null;

  checkHealth: () => Promise<void>;
  fetchStats: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useApiServerStore = create<ApiServerStore>((set, get) => ({
  health: null,
  stats: null,
  loading: false,
  error: null,
  _pollingInterval: null,

  checkHealth: async () => {
    try {
      set({ loading: true, error: null });

      const result = await checkHealth();

      set({
        health: {
          status: 'connected',
          url: 'http://localhost:3002',
          responseTime: result.responseTime,
          lastCheck: new Date()
        },
        loading: false
      });
    } catch (error) {
      set({
        health: {
          status: 'disconnected',
          url: 'http://localhost:3002',
          responseTime: null,
          lastCheck: new Date()
        },
        error: error instanceof Error ? error.message : 'Failed to connect to API server',
        loading: false
      });
    }
  },

  fetchStats: async () => {
    try {
      // Get dashboard data from proxy status endpoint
      const status = await proxyService.getProxyStatus();

      set({
        stats: {
          providers: status.providers.total,
          models: status.models.total,
          sessions: 0 // TODO: Add sessions count when available
        }
      });
    } catch (error) {
      // Stats are optional, don't set error
      set({ stats: null });
    }
  },

  startPolling: () => {
    const { _pollingInterval } = get();
    if (_pollingInterval) return;

    // Initial check
    get().checkHealth();
    get().fetchStats();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      get().checkHealth();
      get().fetchStats();
    }, 10000);

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

**File**: `src/hooks/useApiServer.ts`

```typescript
import { useEffect } from 'react';
import { useApiServerStore } from '@/stores/apiServerStore';

export const useApiServer = () => {
  const store = useApiServerStore();

  useEffect(() => {
    store.startPolling();
    return () => store.stopPolling();
  }, []);

  return {
    health: store.health,
    stats: store.stats,
    loading: store.loading,
    error: store.error,
    refresh: store.checkHealth
  };
};
```

### File Tree

```
src/
├── stores/
│   └── apiServerStore.ts           [NEW]
├── hooks/
│   └── useApiServer.ts             [NEW]
├── services/
│   ├── api.service.ts              [INTEGRATION]
│   └── proxy.service.ts            [INTEGRATION]
└── types/
    └── api-server.types.ts         [INTEGRATION]
```

---

## Phase 3: UI Components

**Priority**: High

### Files to Create

```
src/components/api-server/StatusBadge.tsx
src/components/api-server/ConnectionInfo.tsx
src/components/api-server/TestCommand.tsx
src/components/api-server/TroubleshootingCard.tsx
```

### Component Specifications

**StatusBadge.tsx** - Shows ● / ○ connection status

```typescript
import type { ApiServerStatus } from '@/types/api-server.types';

export function StatusBadge({ status }: { status: ApiServerStatus }) {
  return (
    <div className={`api-status api-status--${status}`}>
      <span className={`api-status-dot api-status-dot--${status}`} />
      <span className="api-status-label">
        {status === 'connected' ? 'CONNECTED' : 'NOT CONNECTED'}
      </span>
    </div>
  );
}
```

**ConnectionInfo.tsx** - Shows URL and response time

```typescript
export function ConnectionInfo({
  url,
  responseTime
}: {
  url: string;
  responseTime: number | null;
}) {
  return (
    <div className="api-status-info">
      <div className="api-status-info-item">
        <span className="api-status-info-label">URL:</span>
        <span className="api-status-info-value">{url}</span>
      </div>
      {responseTime !== null && (
        <div className="api-status-info-item">
          <span className="api-status-info-label">Response time:</span>
          <span className="api-status-info-value">{responseTime}ms</span>
        </div>
      )}
    </div>
  );
}
```

**TestCommand.tsx** - Copy-to-clipboard test command

```typescript
import { toast } from 'react-hot-toast';

export function TestCommand({ url }: { url: string }) {
  const command = `curl ${url}/api/health`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    toast.success('Command copied to clipboard');
  };

  return (
    <div className="api-test-card">
      <h2 className="api-test-title">Quick Test:</h2>
      <div className="api-test-command">
        <code className="api-test-code">{command}</code>
        <button className="api-test-copy" onClick={handleCopy} aria-label="Copy command">
          Copy
        </button>
      </div>
    </div>
  );
}
```

**TroubleshootingCard.tsx** - Offline troubleshooting help

```typescript
export function TroubleshootingCard({ url }: { url: string }) {
  return (
    <div className="api-offline-message">
      <p className="api-offline-text">Cannot reach API server</p>

      <div className="api-troubleshooting">
        <p className="api-troubleshooting-title">Troubleshooting:</p>
        <ul className="api-troubleshooting-list">
          <li>Check if server is running</li>
          <li>Expected at: {url}</li>
          <li>Try: <code>cd backend/api-server && npm run dev</code></li>
        </ul>
      </div>
    </div>
  );
}
```

### File Tree

```
src/
├── components/
│   └── api-server/
│       ├── StatusBadge.tsx         [NEW]
│       ├── ConnectionInfo.tsx      [NEW]
│       ├── TestCommand.tsx         [NEW]
│       └── TroubleshootingCard.tsx [NEW]
├── hooks/
│   └── useApiServer.ts             [INTEGRATION]
└── types/
    └── api-server.types.ts         [INTEGRATION]
```

---

## Phase 4: Page Assembly

**Priority**: Medium

### Files to Create

```
src/pages/ApiServerPage.tsx
```

### Files to Modify

```
src/index.css  (add api-server-specific styles)
```

### Files to Use

```
src/hooks/useApiServer.ts                               [Phase 2]
src/components/api-server/StatusBadge.tsx               [Phase 3]
src/components/api-server/ConnectionInfo.tsx            [Phase 3]
src/components/api-server/TestCommand.tsx               [Phase 3]
src/components/api-server/TroubleshootingCard.tsx       [Phase 3]
```

### Page Implementation

**File**: `src/pages/ApiServerPage.tsx`

```typescript
import { useApiServer } from '@/hooks/useApiServer';
import { StatusBadge } from '@/components/api-server/StatusBadge';
import { ConnectionInfo } from '@/components/api-server/ConnectionInfo';
import { TestCommand } from '@/components/api-server/TestCommand';
import { TroubleshootingCard } from '@/components/api-server/TroubleshootingCard';

export function ApiServerPage() {
  const { health, stats, loading, error, refresh } = useApiServer();

  const isConnected = health?.status === 'connected';
  const apiUrl = health?.url || 'http://localhost:3002';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">API Server</h1>
        <button
          className="refresh-button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh"
        >
          ↻
        </button>
      </div>

      {/* Status Card */}
      <div className="api-status-card">
        {health && <StatusBadge status={health.status} />}

        {/* Connected State */}
        {isConnected && health && (
          <ConnectionInfo url={apiUrl} responseTime={health.responseTime} />
        )}

        {/* Disconnected State */}
        {!isConnected && <TroubleshootingCard url={apiUrl} />}
      </div>

      {/* Summary Stats - only show when connected */}
      {isConnected && stats && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-label">Providers</div>
            <div className="summary-card-value">{stats.providers}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Models</div>
            <div className="summary-card-value">{stats.models}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Sessions</div>
            <div className="summary-card-value">{stats.sessions}</div>
          </div>
        </div>
      )}

      {/* Quick Test - only show when connected */}
      {isConnected && <TestCommand url={apiUrl} />}
    </div>
  );
}
```

### Page-Specific CSS

**File**: `src/index.css` (append - page-specific styles only)

```css
/* ============================================
   API SERVER PAGE SPECIFIC
   Only styles unique to this page
   Note: Shared styles (.page-container, .summary-cards, etc.)
   already defined in Proxy Status Page section
   ============================================ */

.api-status-card {
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

.api-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.api-status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.api-status-dot--connected {
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
}

.api-status-dot--disconnected {
  background: transparent;
  border: 2px solid var(--muted-foreground);
}

.api-status--connected {
  color: var(--success);
}

.api-status--disconnected {
  color: var(--muted-foreground);
}

.api-status-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
  width: 100%;
}

.api-status-info-item {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

.api-status-info-label {
  font-weight: 500;
}

.api-status-info-value {
  color: var(--foreground);
  font-family: monospace;
}

.api-offline-message {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.api-offline-text {
  color: var(--muted-foreground);
  font-size: 0.875rem;
  margin: 0;
  text-align: center;
}

.api-troubleshooting {
  background: var(--muted);
  border-radius: 6px;
  padding: 1rem;
}

.api-troubleshooting-title {
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
}

.api-troubleshooting-list {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--muted-foreground);
  font-size: 0.875rem;
  line-height: 1.8;
}

.api-troubleshooting-list li {
  margin-bottom: 0.25rem;
}

.api-troubleshooting-list code {
  background: var(--background);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.8125rem;
}

/* Test Card */
.api-test-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
}

.api-test-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 1rem;
}

.api-test-command {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
}

.api-test-code {
  flex: 1;
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--foreground);
}

.api-test-copy {
  padding: 0.5rem 1rem;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.api-test-copy:hover {
  background: var(--secondary-hover);
}
```

### File Tree

```
src/
├── pages/
│   └── ApiServerPage.tsx           [NEW]
├── components/
│   └── api-server/
│       ├── StatusBadge.tsx         [INTEGRATION]
│       ├── ConnectionInfo.tsx      [INTEGRATION]
│       ├── TestCommand.tsx         [INTEGRATION]
│       └── TroubleshootingCard.tsx [INTEGRATION]
├── hooks/
│   └── useApiServer.ts             [INTEGRATION]
└── index.css                       [MODIFIED]
```

---

## Architecture Compliance

### DRY (Don't Repeat Yourself)
- ✅ **Uses shared CSS** from Doc 51: `.page-container`, `.page-header`, `.summary-cards`
- ✅ **Only page-specific CSS** added (.api-status-card, .api-test-card, etc.)
- ✅ Health check logic centralized in store
- ✅ StatusBadge reusable pattern

### SRP (Single Responsibility)
- ✅ StatusBadge: Shows connection status with dot
- ✅ Page: Composition + user interactions
- ✅ Store: Health checks and polling

### No Inline Tailwind
- ✅ All styling via semantic CSS classes
- ✅ Shared styles in one place

### Theme Variables Only
- ✅ All colors via var(--success), var(--muted-foreground), var(--card), etc.

---

## Related Documents

- **Doc 56**: UX Guide
- **Doc 01A**: Architecture Guide
- **Doc 19**: Backend Lifecycle

---

## Version History

- **v1.0**: Initial plan following shared CSS pattern from Docs 51, 52, 53, 54 v3.0
