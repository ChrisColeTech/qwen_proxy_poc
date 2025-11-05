# Phase 9: Credentials Management Components

**Priority:** P2 (Feature Components)
**Dependencies:** Phase 7
**Blocks:** Phase 10, Phase 11

## Files to Create

```
frontend/src/components/features/
└── credentials/
    ├── CredentialStatusCard.tsx     # Shows credential status
    ├── LoginButton.tsx              # Qwen login button
    └── CredentialManager.tsx        # Full credential management
```

## Content

**frontend/src/components/features/credentials/CredentialStatusCard.tsx**
```typescript
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { credentialsService } from '@/services/credentials.service';
import type { CredentialStatus } from '@/types';

export function CredentialStatusCard() {
  const [status, setStatus] = useState<CredentialStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const result = await credentialsService.getCredentialStatus();
    setStatus(result);
    setLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Qwen Credentials</h3>
        <div className="text-sm">
          <div>
            Status:{' '}
            {status?.hasCredentials ? (
              <span className={status.isValid ? 'text-green-600' : 'text-yellow-600'}>
                {status.isValid ? 'Valid' : 'Expired'}
              </span>
            ) : (
              <span className="text-muted-foreground">Not configured</span>
            )}
          </div>
          {status?.expiresAt && (
            <div className="text-muted-foreground">
              Expires: {new Date(status.expiresAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

**frontend/src/components/features/credentials/LoginButton.tsx**
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { credentialsService } from '@/services/credentials.service';
import { electronIPCService } from '@/services/electron-ipc.service';

interface LoginButtonProps {
  onLoginComplete?: () => void;
}

export function LoginButton({ onLoginComplete }: LoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Open Electron browser to login
      await credentialsService.openLogin();

      // Extract credentials (happens automatically after login)
      const credentials = await credentialsService.extractCredentials();

      // Save to backend via HTTP API
      await credentialsService.saveCredentials(credentials);

      onLoginComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!electronIPCService.isAvailable) {
    return (
      <div className="text-sm text-muted-foreground">
        Login feature requires desktop app
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login to Qwen'}
      </Button>
      {error && <div className="text-sm text-destructive">{error}</div>}
    </div>
  );
}
```

**frontend/src/components/features/credentials/CredentialManager.tsx**
```typescript
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CredentialStatusCard } from './CredentialStatusCard';
import { LoginButton } from './LoginButton';
import { credentialsService } from '@/services/credentials.service';

export function CredentialManager() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete saved credentials?')) {
      return;
    }

    try {
      await credentialsService.deleteCredentials();
      setRefreshKey((k) => k + 1); // Force refresh
    } catch (err) {
      console.error('Failed to delete credentials:', err);
    }
  };

  return (
    <div className="space-y-4">
      <CredentialStatusCard key={refreshKey} />
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold">Manage Credentials</h3>
        <LoginButton onLoginComplete={() => setRefreshKey((k) => k + 1)} />
        <Button variant="destructive" onClick={handleDelete}>
          Delete Credentials
        </Button>
      </Card>
    </div>
  );
}
```

## Files to Modify

None

## Integration Points

- `frontend/src/services/credentials.service.ts` (Phase 7)
- `frontend/src/services/electron-ipc.service.ts` (Phase 4)
- `frontend/src/types/credentials.types.ts` (Phase 1)
- `frontend/src/components/ui/*` (existing shadcn components)

## Structure After Phase 9

```
frontend/src/
├── components/
│   ├── features/
│   │   ├── credentials/
│   │   │   ├── CredentialStatusCard.tsx    # 🆕 New
│   │   │   ├── LoginButton.tsx             # 🆕 New
│   │   │   └── CredentialManager.tsx       # 🆕 New
│   │   └── proxy/
│   │       └── ...                         # ✅ From Phase 8
```

## Validation

- [ ] Credential status displays correctly
- [ ] Login flow works in Electron
- [ ] Non-Electron graceful degradation
- [ ] Delete confirmation works
- [ ] UI refreshes after login/delete
