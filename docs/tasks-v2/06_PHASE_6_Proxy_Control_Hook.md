# Phase 6: Proxy Control Hook

**Priority:** P1 (Core Functionality)
**Dependencies:** Phase 3, Phase 5
**Blocks:** Phase 8

## Files to Create

```
frontend/src/hooks/
└── useProxyControl.ts    # Proxy start/stop control
```

## Content

**frontend/src/hooks/useProxyControl.ts**
```typescript
import { useState } from 'react';
import { apiService } from '@/services/api.service';

export function useProxyControl() {
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startProxy = async () => {
    setStarting(true);
    setError(null);
    try {
      const result = await apiService.startProxy();
      if (!result.success) {
        throw new Error(result.error || 'Failed to start proxy');
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to start proxy:', err);
      throw err;
    } finally {
      setStarting(false);
    }
  };

  const stopProxy = async () => {
    setStopping(true);
    setError(null);
    try {
      const result = await apiService.stopProxy();
      if (!result.success) {
        throw new Error(result.error || 'Failed to stop proxy');
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to stop proxy:', err);
      throw err;
    } finally {
      setStopping(false);
    }
  };

  return {
    startProxy,
    stopProxy,
    starting,
    stopping,
    error,
  };
}
```

## Files to Modify

None

## Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)

## Structure After Phase 6

```
frontend/src/
├── hooks/
│   ├── useProxyStatus.ts     # ✅ From Phase 5
│   ├── useApiHealth.ts       # ✅ From Phase 5
│   └── useProxyControl.ts    # 🆕 New
```

## Validation

- [ ] Start/stop operations work
- [ ] Loading states update correctly
- [ ] Errors are captured and exposed
- [ ] Can be used in components
