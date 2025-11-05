# Phase 8: Proxy Control Components

**Priority:** P2 (Feature Components)
**Dependencies:** Phase 5, Phase 6
**Blocks:** Phase 10

## Files to Create

```
frontend/src/components/features/
└── proxy/
    ├── ProxyStatusIndicator.tsx    # Visual status indicator
    ├── ProxyControlButtons.tsx     # Start/Stop buttons
    └── ProxyConfigForm.tsx         # Configuration form
```

## Content

**frontend/src/components/features/proxy/ProxyStatusIndicator.tsx**
```typescript
import { useProxyStatus } from '@/hooks/useProxyStatus';

export function ProxyStatusIndicator() {
  const { status, loading, error } = useProxyStatus();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Checking status...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          status.running ? 'bg-green-500' : 'bg-muted'
        }`}
      />
      <span className={status.running ? 'text-foreground' : 'text-muted-foreground'}>
        {status.running ? `Running on port ${status.port}` : 'Stopped'}
      </span>
    </div>
  );
}
```

**frontend/src/components/features/proxy/ProxyControlButtons.tsx**
```typescript
import { Button } from '@/components/ui/button';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useProxyStatus } from '@/hooks/useProxyStatus';

export function ProxyControlButtons() {
  const { status, refreshStatus } = useProxyStatus();
  const { startProxy, stopProxy, starting, stopping } = useProxyControl();

  const handleStart = async () => {
    try {
      await startProxy();
      await refreshStatus();
    } catch (err) {
      // Error already handled in hook
    }
  };

  const handleStop = async () => {
    try {
      await stopProxy();
      await refreshStatus();
    } catch (err) {
      // Error already handled in hook
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleStart}
        disabled={status.running || starting}
        variant={status.running ? 'secondary' : 'default'}
      >
        {starting ? 'Starting...' : 'Start Proxy'}
      </Button>
      <Button
        onClick={handleStop}
        disabled={!status.running || stopping}
        variant="outline"
      >
        {stopping ? 'Stopping...' : 'Stop Proxy'}
      </Button>
    </div>
  );
}
```

**frontend/src/components/features/proxy/ProxyConfigForm.tsx**
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api.service';
import type { ProxyConfig } from '@/types';

export function ProxyConfigForm() {
  const [config, setConfig] = useState<ProxyConfig>({
    port: 8000,
    autoStart: false,
    logLevel: 'info',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateProxyConfig(config);
      // Show success message
    } catch (err) {
      console.error('Failed to save config:', err);
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="port">Port</Label>
        <Input
          id="port"
          type="number"
          value={config.port}
          onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="logLevel">Log Level</Label>
        <select
          id="logLevel"
          className="w-full border rounded px-3 py-2"
          value={config.logLevel}
          onChange={(e) => setConfig({ ...config, logLevel: e.target.value as any })}
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  );
}
```

## Files to Modify

None

## Integration Points

- `frontend/src/hooks/useProxyStatus.ts` (Phase 5)
- `frontend/src/hooks/useProxyControl.ts` (Phase 6)
- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/components/ui/*` (existing shadcn components)

## Structure After Phase 8

```
frontend/src/
├── components/
│   ├── features/
│   │   └── proxy/
│   │       ├── ProxyStatusIndicator.tsx    # 🆕 New
│   │       ├── ProxyControlButtons.tsx     # 🆕 New
│   │       └── ProxyConfigForm.tsx         # 🆕 New
│   ├── layout/
│   │   └── ...                             # ✅ Existing
│   └── ui/
│       └── ...                             # ✅ Existing
```

## Validation

- [ ] Status indicator updates in real-time
- [ ] Start/Stop buttons work correctly
- [ ] Configuration form saves properly
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
