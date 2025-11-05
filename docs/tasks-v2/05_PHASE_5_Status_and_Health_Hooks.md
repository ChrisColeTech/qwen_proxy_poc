# Phase 5: Status and Health Hooks

**Priority:** P1 (Core Functionality)
**Dependencies:** Phase 3
**Blocks:** Phase 8, Phase 10

## Files to Create

```
frontend/src/hooks/
├── useProxyStatus.ts    # Proxy status polling
├── useApiHealth.ts      # API health check
├── useCredentials.ts    # Credential management with login/refresh/delete
└── useStatistics.ts     # Provider and session statistics
```

## Content

**frontend/src/hooks/useProxyStatus.ts**
```typescript
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';
import type { ProxyStatus } from '@/types';

export function useProxyStatus(pollingInterval = 5000) {
  const [status, setStatus] = useState<ProxyStatus>({
    running: false,
    port: 8000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const result = await apiService.getProxyStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to get proxy status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus({ running: false, port: 8000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshStatus();

    // Poll every pollingInterval
    const interval = setInterval(refreshStatus, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  return { status, loading, error, refreshStatus };
}
```

**frontend/src/hooks/useApiHealth.ts**
```typescript
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';
import type { HealthCheckResponse } from '@/types';

export function useApiHealth(checkInterval = 30000) {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      const result = await apiService.checkHealth();
      setHealth(result);
      setIsHealthy(result.status === 'healthy');
    } catch (err) {
      console.error('API health check failed:', err);
      setHealth(null);
      setIsHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkHealth();

    // Check periodically
    const interval = setInterval(checkHealth, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval]);

  return { health, isHealthy, loading, checkHealth };
}
```

**frontend/src/hooks/useCredentials.ts**
```typescript
import { useState, useEffect } from 'react';
import { credentialsService } from '@/services/credentials.service';
import type { CredentialStatus } from '@/types';

export function useCredentials() {
  const [status, setStatus] = useState<CredentialStatus>({
    hasCredentials: false,
    isValid: false,
    expiresAt: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

  const loadStatus = async () => {
    try {
      const result = await credentialsService.getCredentialStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to load credential status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    loadStatus();
  }, [refreshKey]);

  const login = async () => {
    if (!isElectron) {
      setError('Login requires Electron desktop app');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await credentialsService.openLogin();
      const credentials = await credentialsService.extractCredentials();
      await credentialsService.saveCredentials(credentials);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    return login(); // Same flow as login
  };

  const deleteCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      await credentialsService.deleteCredentials();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete credentials';
      setError(message);
      console.error('Failed to delete credentials:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    error,
    isElectron,
    login,
    refresh,
    deleteCredentials,
  };
}
```

**frontend/src/hooks/useStatistics.ts**
```typescript
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api.service';
import type { Provider } from '@/types';

interface Statistics {
  totalProviders: number;
  activeSessions: number;
  enabledProviders: number;
}

export function useStatistics() {
  const [stats, setStats] = useState<Statistics>({
    totalProviders: 0,
    activeSessions: 0,
    enabledProviders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [providers, sessions] = await Promise.all([
        apiService.listProviders(),
        apiService.listSessions(),
      ]);
      setStats({
        totalProviders: providers.length,
        activeSessions: sessions.length,
        enabledProviders: providers.filter((p: Provider) => p.enabled).length,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { stats, loading, error, refreshStats: loadStats };
}
```

## Files to Modify

None

## Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/services/credentials.service.ts` (Phase 7)
- `frontend/src/types/api.types.ts` (Phase 1)
- `frontend/src/types/proxy.types.ts` (Phase 1)
- `frontend/src/types/credentials.types.ts` (Phase 1)

## Structure After Phase 5

```
frontend/src/
├── hooks/
│   ├── useProxyStatus.ts    # 🆕 New
│   ├── useApiHealth.ts      # 🆕 New
│   ├── useCredentials.ts    # 🆕 New
│   └── useStatistics.ts     # 🆕 New
├── services/
│   └── ...                  # ✅ From Phase 3-4, 7
```

## Validation

- [ ] Status polling starts automatically
- [ ] Polling interval can be customized
- [ ] Hooks clean up intervals on unmount
- [ ] Error states handled correctly
- [ ] useCredentials hook manages login/refresh/delete operations
- [ ] useStatistics hook loads provider and session counts
- [ ] All hooks follow same error handling pattern
