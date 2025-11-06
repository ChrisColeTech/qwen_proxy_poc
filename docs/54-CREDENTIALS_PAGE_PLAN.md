# 54 - Credentials Page Plan

## Document Information
- **Document**: 54 - Credentials Page Plan
- **Version**: 1.0
- **Date**: November 5, 2025
- **Purpose**: Implementation plan for Qwen Credentials status page
- **Related**: Doc 56 (UX Guide), Doc 01A (Architecture Guide), Doc 48 (Qwen Login Flow)

---

## Work Progression

| Phase | Name | Priority | Status | Description |
|-------|------|----------|--------|-------------|
| 1 | Types & Services | Highest | Not Started | Type definitions and service verification |
| 2 | State Management | Highest | Not Started | Zustand store for credentials |
| 3 | UI Components | High | Not Started | Status badge component only |
| 4 | Page Assembly | Medium | Not Started | Page with shared CSS patterns |

---

## Page Mockup

**When Logged In:**
```
┌─────────────────────────────────────────────────────────┐
│ Qwen Credentials                                   [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✓ LOGGED IN                                            │
│                                                         │
│  Expires: Nov 12, 2025 at 2:45 PM                      │
│  Time remaining: 6 days                                 │
│                                                         │
│  [Logout]                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ How to Log In                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Click "Login to Qwen"                               │
│  2. Follow extension installation (one-time)            │
│  3. Log in at chat.qwen.ai                              │
│  4. Extension captures credentials automatically        │
│                                                         │
│  → [Install Extension]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**When NOT Logged In:**
```
┌─────────────────────────────────────────────────────────┐
│ Qwen Credentials                                   [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ○ NOT LOGGED IN                                        │
│                                                         │
│  Log in to use Qwen models                              │
│                                                         │
│  [Login to Qwen]                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**When Expired:**
```
┌─────────────────────────────────────────────────────────┐
│ Qwen Credentials                                   [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️ EXPIRED                                             │
│                                                         │
│  Expired: Nov 5, 2025 at 10:30 AM                      │
│  Please log in again                                    │
│                                                         │
│  [Login to Qwen]                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## User Purpose

**Primary Questions**:
- Am I logged in?
- When do credentials expire?
- How do I log in/out?

**User Actions**:
1. Check login status
2. See expiration date
3. Login via extension
4. Logout

**What NOT to show**:
- ❌ Manual credential upload form
- ❌ Token/cookie input fields
- ❌ JSON editor
- ❌ Security documentation walls
- ❌ Multiple credential profiles
- ❌ API examples or curl commands

---

## Backend API Reference

**Verified from**: `/backend/provider-router/src/controllers/qwen-credentials-controller.js`

### GET /api/qwen/credentials
Response when credentials exist:
```json
{
  "hasCredentials": true,
  "expiresAt": 1699200000,
  "isValid": true,
  "createdAt": 1699100000,
  "updatedAt": 1699100000
}
```

Response when no credentials:
```json
{
  "hasCredentials": false,
  "expiresAt": null,
  "isValid": false
}
```

### DELETE /api/qwen/credentials
Response:
```json
{
  "success": true,
  "message": "Qwen credentials deleted",
  "deleted": 1
}
```

---

## Phase 1: Types & Services

**Priority**: Highest

### Files to Create

```
src/types/credentials.types.ts
```

### Files to Verify

```
src/services/credentials.service.ts  [Should exist]
src/services/api.service.ts          [Integration]
```

### Type Definitions

**File**: `src/types/credentials.types.ts`

```typescript
export type CredentialsStatus = 'valid' | 'expired' | 'missing';

export interface CredentialsResponse {
  hasCredentials: boolean;
  expiresAt: number | null;
  isValid: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface CredentialsDisplay {
  status: CredentialsStatus;
  expiresAt: Date | null;
  timeRemaining: string | null;
}
```

### File Tree

```
src/
├── types/
│   └── credentials.types.ts        [NEW]
└── services/
    ├── credentials.service.ts      [VERIFY]
    └── api.service.ts              [INTEGRATION]
```

---

## Phase 2: State Management

**Priority**: Highest

### Files to Create

```
src/stores/credentialsStore.ts
src/hooks/useCredentials.ts
src/utils/time.ts  [May already exist from Doc 51]
```

### Store Implementation

**File**: `src/stores/credentialsStore.ts`

```typescript
import { create } from 'zustand';
import { credentialsService } from '@/services/credentials.service';
import type { CredentialsDisplay, CredentialsStatus } from '@/types/credentials.types';

interface CredentialsStore {
  credentials: CredentialsDisplay | null;
  loading: boolean;
  error: string | null;
  _pollingInterval: NodeJS.Timeout | null;

  fetchCredentials: () => Promise<void>;
  logout: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useCredentialsStore = create<CredentialsStore>((set, get) => ({
  credentials: null,
  loading: false,
  error: null,
  _pollingInterval: null,

  fetchCredentials: async () => {
    try {
      set({ loading: true, error: null });
      const response = await credentialsService.getCredentials();

      let status: CredentialsStatus = 'missing';
      let expiresAt: Date | null = null;
      let timeRemaining: string | null = null;

      if (response.hasCredentials) {
        if (response.isValid) {
          status = 'valid';
        } else {
          status = 'expired';
        }

        if (response.expiresAt) {
          expiresAt = new Date(response.expiresAt * 1000);

          if (status === 'valid') {
            const now = Date.now();
            const expires = expiresAt.getTime();
            const diffMs = expires - now;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

            if (diffDays > 1) {
              timeRemaining = `${diffDays} days`;
            } else if (diffHours > 1) {
              timeRemaining = `${diffHours} hours`;
            } else {
              timeRemaining = 'Less than 1 hour';
            }
          }
        }
      }

      set({
        credentials: { status, expiresAt, timeRemaining },
        loading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch credentials',
        loading: false
      });
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      await credentialsService.deleteCredentials();
      await get().fetchCredentials();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to logout',
        loading: false
      });
      throw error;
    }
  },

  startPolling: () => {
    const { _pollingInterval } = get();
    if (_pollingInterval) return;

    get().fetchCredentials();
    const interval = setInterval(() => get().fetchCredentials(), 60000); // Every 60 seconds
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

**File**: `src/hooks/useCredentials.ts`

```typescript
import { useEffect } from 'react';
import { useCredentialsStore } from '@/stores/credentialsStore';

export const useCredentials = () => {
  const store = useCredentialsStore();

  useEffect(() => {
    store.startPolling();
    return () => store.stopPolling();
  }, []);

  return {
    credentials: store.credentials,
    loading: store.loading,
    error: store.error,
    logout: store.logout,
    refresh: store.fetchCredentials
  };
};
```

### File Tree

```
src/
├── stores/
│   └── credentialsStore.ts         [NEW]
├── hooks/
│   └── useCredentials.ts           [NEW]
├── services/
│   └── credentials.service.ts      [INTEGRATION]
└── types/
    └── credentials.types.ts        [INTEGRATION]
```

---

## Phase 3: UI Components

**Priority**: High

### Files to Create

```
src/components/credentials/StatusBadge.tsx
src/components/credentials/ExpirationInfo.tsx
src/components/credentials/ActionButton.tsx
src/components/credentials/HelpCard.tsx
```

### Component Specifications

**StatusBadge.tsx** - Shows ✓ / ○ / ⚠️ status

```typescript
import type { CredentialsStatus } from '@/types/credentials.types';

const STATUS_CONFIG: Record<CredentialsStatus, { icon: string; label: string }> = {
  valid: { icon: '✓', label: 'LOGGED IN' },
  expired: { icon: '⚠️', label: 'EXPIRED' },
  missing: { icon: '○', label: 'NOT LOGGED IN' }
};

export function StatusBadge({ status }: { status: CredentialsStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`credentials-status credentials-status--${status}`}>
      <span className="credentials-status-icon">{config.icon}</span>
      <span className="credentials-status-label">{config.label}</span>
    </div>
  );
}
```

**ExpirationInfo.tsx** - Shows expiration date and time remaining

```typescript
export function ExpirationInfo({
  expiresAt,
  timeRemaining,
  isExpired
}: {
  expiresAt: Date;
  timeRemaining: string | null;
  isExpired: boolean;
}) {
  const formattedDate = expiresAt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className="credentials-info">
      <div className="credentials-info-item">
        <span className="credentials-info-label">
          {isExpired ? 'Expired:' : 'Expires:'}
        </span>
        <span className="credentials-info-value">{formattedDate}</span>
      </div>
      {!isExpired && timeRemaining && (
        <div className="credentials-info-item">
          <span className="credentials-info-label">Time remaining:</span>
          <span className="credentials-info-value">{timeRemaining}</span>
        </div>
      )}
      {isExpired && (
        <p className="credentials-expired-message">Please log in again</p>
      )}
    </div>
  );
}
```

**ActionButton.tsx** - Login or Logout button

```typescript
export function ActionButton({
  isValid,
  loading,
  onLogin,
  onLogout
}: {
  isValid: boolean;
  loading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <button
      className={`credentials-action-button credentials-action-button--${
        isValid ? 'logout' : 'login'
      }`}
      onClick={isValid ? onLogout : onLogin}
      disabled={loading}
    >
      {isValid ? 'Logout' : 'Login to Qwen'}
    </button>
  );
}
```

**HelpCard.tsx** - Installation instructions

```typescript
export function HelpCard({ onInstall }: { onInstall: () => void }) {
  return (
    <div className="credentials-help-card">
      <h2 className="credentials-help-title">How to Log In</h2>
      <ol className="credentials-help-steps">
        <li>Click "Login to Qwen"</li>
        <li>Follow extension installation (one-time)</li>
        <li>Log in at chat.qwen.ai</li>
        <li>Extension captures credentials automatically</li>
      </ol>
      <button className="credentials-help-button" onClick={onInstall}>
        → Install Extension
      </button>
    </div>
  );
}
```

### File Tree

```
src/
├── components/
│   └── credentials/
│       ├── StatusBadge.tsx         [NEW]
│       ├── ExpirationInfo.tsx      [NEW]
│       ├── ActionButton.tsx        [NEW]
│       └── HelpCard.tsx            [NEW]
├── hooks/
│   └── useCredentials.ts           [INTEGRATION]
└── types/
    └── credentials.types.ts        [INTEGRATION]
```

---

## Phase 4: Page Assembly

**Priority**: Medium

### Files to Create

```
src/pages/CredentialsPage.tsx
```

### Files to Modify

```
src/index.css  (add credentials-specific styles)
```

### Files to Use

```
src/hooks/useCredentials.ts                         [Phase 2]
src/components/credentials/StatusBadge.tsx          [Phase 3]
src/components/credentials/ExpirationInfo.tsx       [Phase 3]
src/components/credentials/ActionButton.tsx         [Phase 3]
src/components/credentials/HelpCard.tsx             [Phase 3]
```

### Page Implementation

**File**: `src/pages/CredentialsPage.tsx`

```typescript
import { useCredentials } from '@/hooks/useCredentials';
import { StatusBadge } from '@/components/credentials/StatusBadge';
import { ExpirationInfo } from '@/components/credentials/ExpirationInfo';
import { ActionButton } from '@/components/credentials/ActionButton';
import { HelpCard } from '@/components/credentials/HelpCard';

export function CredentialsPage() {
  const { credentials, loading, error, logout, refresh } = useCredentials();

  const handleLogout = async () => {
    if (!confirm('Log out? You\'ll need to log in again to use Qwen.')) return;

    try {
      await logout();
    } catch (error) {
      // Error handled in store
    }
  };

  const handleLogin = () => {
    // Navigate to extension install/setup page
    window.open('https://chat.qwen.ai', '_blank');
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

  const isValid = credentials?.status === 'valid';
  const isExpired = credentials?.status === 'expired';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Qwen Credentials</h1>
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
      <div className="credentials-card">
        {credentials && <StatusBadge status={credentials.status} />}

        {/* Expiration Info */}
        {credentials?.expiresAt && (isValid || isExpired) && (
          <ExpirationInfo
            expiresAt={credentials.expiresAt}
            timeRemaining={credentials.timeRemaining}
            isExpired={isExpired}
          />
        )}

        {/* Missing Credentials Message */}
        {credentials?.status === 'missing' && (
          <p className="credentials-missing-message">Log in to use Qwen models</p>
        )}

        {/* Action Button */}
        <ActionButton
          isValid={isValid}
          loading={loading}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </div>

      {/* Help Card - only show when not logged in */}
      {!isValid && <HelpCard onInstall={handleLogin} />}
    </div>
  );
}
```

### Page-Specific CSS

**File**: `src/index.css` (append - page-specific styles only)

```css
/* ============================================
   CREDENTIALS PAGE SPECIFIC
   Only styles unique to this page
   Note: Shared styles (.page-container, etc.)
   already defined in Proxy Status Page section
   ============================================ */

.credentials-card {
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

.credentials-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.credentials-status-icon {
  font-size: 1.5rem;
}

.credentials-status--valid {
  color: var(--success);
}

.credentials-status--expired {
  color: var(--destructive);
}

.credentials-status--missing {
  color: var(--muted-foreground);
}

.credentials-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
  width: 100%;
}

.credentials-info-item {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

.credentials-info-label {
  font-weight: 500;
}

.credentials-info-value {
  color: var(--foreground);
}

.credentials-expired-message {
  color: var(--destructive);
  font-size: 0.875rem;
  margin: 0.5rem 0 0;
}

.credentials-missing-message {
  color: var(--muted-foreground);
  font-size: 0.875rem;
  margin: 0;
}

.credentials-action-button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.credentials-action-button--login {
  background: var(--primary);
  color: var(--primary-foreground);
}

.credentials-action-button--login:hover:not(:disabled) {
  background: var(--primary-hover);
}

.credentials-action-button--logout {
  background: var(--destructive);
  color: var(--destructive-foreground);
}

.credentials-action-button--logout:hover:not(:disabled) {
  background: var(--destructive-hover);
}

.credentials-action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Help Card */
.credentials-help-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
}

.credentials-help-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 1rem;
}

.credentials-help-steps {
  margin: 0 0 1.5rem;
  padding-left: 1.5rem;
  color: var(--muted-foreground);
  line-height: 1.8;
}

.credentials-help-steps li {
  margin-bottom: 0.5rem;
}

.credentials-help-button {
  padding: 0.75rem 1.5rem;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.credentials-help-button:hover {
  background: var(--secondary-hover);
}
```

### File Tree

```
src/
├── pages/
│   └── CredentialsPage.tsx         [NEW]
├── components/
│   └── credentials/
│       ├── StatusBadge.tsx         [INTEGRATION]
│       ├── ExpirationInfo.tsx      [INTEGRATION]
│       ├── ActionButton.tsx        [INTEGRATION]
│       └── HelpCard.tsx            [INTEGRATION]
├── hooks/
│   └── useCredentials.ts           [INTEGRATION]
└── index.css                       [MODIFIED]
```

---

## Architecture Compliance

### DRY (Don't Repeat Yourself)
- ✅ **Uses shared CSS** from Doc 51: `.page-container`, `.page-header`, `.error-state`
- ✅ **Only page-specific CSS** added (.credentials-card, .credentials-status, etc.)
- ✅ Time formatting utilities from Doc 51
- ✅ StatusBadge reusable pattern

### SRP (Single Responsibility)
- ✅ StatusBadge: Shows login status with icon
- ✅ Page: Composition + user interactions
- ✅ Store: State management and polling

### No Inline Tailwind
- ✅ All styling via semantic CSS classes
- ✅ Shared styles in one place

### Theme Variables Only
- ✅ All colors via var(--success), var(--destructive), var(--foreground), etc.

---

## Related Documents

- **Doc 56**: UX Guide
- **Doc 01A**: Architecture Guide
- **Doc 48**: Qwen Login Flow

---

## Version History

- **v1.0**: Initial plan following shared CSS pattern from Docs 51 & 52 v3.0
