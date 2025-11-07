# Dashboard Refactoring Examples - Practical Implementation Guide

## Quick Reference for Critical Fixes

### 1. ERROR BOUNDARY COMPONENT

**File to Create: `frontend/src/components/core/ErrorBoundary.tsx`**

```tsx
import React, { ReactNode, ReactElement } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  cardName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.cardName}:`, error, errorInfo);
  }

  render(): ReactElement {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="card-gaming border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Something went wrong</p>
                  <p className="text-sm text-muted-foreground">
                    {this.props.cardName && `in ${this.props.cardName}`}
                    Please refresh the page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children as ReactElement;
  }
}
```

**Updated DashboardMainPage.tsx:**

```tsx
import { ErrorBoundary } from '@/components/core/ErrorBoundary';
import { QwenLoginCard } from '@/components/features/dashboard/QwenLoginCard';
import { ProxyControlCard } from '@/components/features/dashboard/ProxyControlCard';
import { StatisticsCard } from '@/components/features/dashboard/StatisticsCard';
import { CodeExample } from '@/components/features/dashboard/CodeExample';

export function DashboardMainPage() {
  return (
    <div className="dashboard-container">
      <ErrorBoundary cardName="Qwen Auth">
        <QwenLoginCard />
      </ErrorBoundary>
      
      <ErrorBoundary cardName="Proxy Control">
        <ProxyControlCard />
      </ErrorBoundary>
      
      <ErrorBoundary cardName="Statistics">
        <StatisticsCard />
      </ErrorBoundary>
      
      <ErrorBoundary cardName="Code Example">
        <CodeExample />
      </ErrorBoundary>
    </div>
  );
}
```

---

### 2. CENTRALIZED CONFIGURATION FOR PORTS

**File: `frontend/src/constants/proxy.ts` (Create New)**

```ts
/**
 * Proxy configuration constants
 * All proxy-related defaults should be centralized here
 */

export const PROXY_DEFAULTS = {
  DEFAULT_PORT: 3001,
  DEFAULT_HOST: 'localhost',
  DEFAULT_VERSION: 'v1',
  POLLING_INTERVAL: 5000, // 5 seconds
} as const;

export const getProxyUrl = (port?: number | null): string => {
  const portNum = port ?? PROXY_DEFAULTS.DEFAULT_PORT;
  return `http://${PROXY_DEFAULTS.DEFAULT_HOST}:${portNum}/${PROXY_DEFAULTS.DEFAULT_VERSION}`;
};

export const getProxyCompleteUrl = (port?: number | null, endpoint = 'chat/completions'): string => {
  return `${getProxyUrl(port)}/${endpoint}`;
};

export const getProxyPort = (port?: number | null): number => {
  return port ?? PROXY_DEFAULTS.DEFAULT_PORT;
};
```

**Updated ProxyControlCard.tsx:**

```tsx
import { PROXY_DEFAULTS, getProxyUrl } from '@/constants/proxy';

export function ProxyControlCard() {
  const { status, loading } = useProxyStatus();
  const { startProxy, stopProxy, starting, stopping } = useProxyControl();
  const [copySuccess, setCopySuccess] = useState(false);

  const proxyUrl = getProxyUrl(status?.port);
  
  // ... rest of component
}
```

**Updated CodeExample.tsx:**

```tsx
import { getProxyCompleteUrl } from '@/constants/proxy';

export function CodeExample() {
  const [copied, setCopied] = useState(false);
  const { status } = useProxyStatus();

  const proxyUrl = getProxyCompleteUrl(status?.port);

  const exampleCode = `const response = await fetch('${proxyUrl}', {
  // ... rest of code
});`;

  // ... rest of component
}
```

**Updated useProxyStatus.ts:**

```tsx
import { PROXY_DEFAULTS } from '@/constants/proxy';

export function useProxyStatus(pollingInterval = PROXY_DEFAULTS.POLLING_INTERVAL) {
  const [status, setStatus] = useState<ProxyStatus>({
    running: false,
    port: PROXY_DEFAULTS.DEFAULT_PORT,
  });
  
  // ... rest of hook
  
  catch (err) {
    // ...
    setStatus({ running: false, port: PROXY_DEFAULTS.DEFAULT_PORT });
  }
}
```

---

### 3. EXTRACT REUSABLE HOOKS FROM MOBILE PAGE

**File to Create: `frontend/src/hooks/useCopyClipboard.ts`**

```ts
import { useState } from 'react';

export function useCopyClipboard(duration = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), duration);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  return { copied, copy };
}
```

**File to Create: `frontend/src/hooks/useFormatCredentialExpiry.ts`**

```ts
export function useFormatCredentialExpiry() {
  const formatExpiry = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeRemaining = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const remaining = timestamp - now;
    
    if (remaining < 0) return 'Expired';
    
    const days = Math.floor(remaining / (1000 * 3600 * 24));
    if (days > 0) return `${days} days`;
    
    const hours = Math.floor(remaining / (1000 * 3600));
    return `${hours} hours`;
  };

  return { formatExpiry, getTimeRemaining };
}
```

---

### 4. REFACTORED MOBILE DASHBOARD (Eliminating Duplication)

**File: `frontend/src/pages/dashboard/MobileDashboardMainPage.tsx` (Refactored)**

```tsx
import { usePageInstructions } from '@/hooks/core/usePageInstructions';
import { QwenLoginCard } from '@/components/features/dashboard/QwenLoginCard';
import { ProxyControlCard } from '@/components/features/dashboard/ProxyControlCard';
import { StatisticsCard } from '@/components/features/dashboard/StatisticsCard';
import { CodeExample } from '@/components/features/dashboard/CodeExample';
import { ResponsiveCardWrapper } from '@/components/core/ResponsiveCardWrapper';

export function MobileDashboardMainPage() {
  usePageInstructions('dashboard');

  return (
    <div className="dashboard-mobile-container">
      <ResponsiveCardWrapper variant="mobile">
        <QwenLoginCard />
      </ResponsiveCardWrapper>
      
      <ResponsiveCardWrapper variant="mobile">
        <ProxyControlCard />
      </ResponsiveCardWrapper>
      
      <ResponsiveCardWrapper variant="mobile">
        <StatisticsCard />
      </ResponsiveCardWrapper>
      
      <ResponsiveCardWrapper variant="mobile">
        <CodeExample />
      </ResponsiveCardWrapper>
    </div>
  );
}
```

**New Component: `frontend/src/components/core/ResponsiveCardWrapper.tsx`**

```tsx
import React from 'react';

interface ResponsiveCardWrapperProps {
  children: React.ReactNode;
  variant?: 'desktop' | 'mobile';
}

/**
 * Wraps dashboard cards with responsive styles and proper sizing
 * Handles differences between mobile and desktop layouts
 */
export function ResponsiveCardWrapper({ 
  children, 
  variant = 'desktop' 
}: ResponsiveCardWrapperProps) {
  const mobileStyles = variant === 'mobile' ? 'scale-mobile-optimized' : '';
  
  return (
    <div className={`dashboard-card-responsive ${mobileStyles}`}>
      {children}
    </div>
  );
}
```

---

### 5. FIX ERROR STATE DISPLAY

**Updated ProxyControlCard.tsx:**

```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Copy, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useState } from 'react';
import { getProxyUrl } from '@/constants/proxy';

export function ProxyControlCard() {
  const { status, loading, error: statusError } = useProxyStatus();
  const { startProxy, stopProxy, starting, stopping, error: actionError } = useProxyControl();
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Show most recent error (action error takes precedence)
  const error = actionError || statusError;

  const handleStart = async () => {
    try {
      await startProxy();
    } catch (error) {
      console.error('Failed to start proxy:', error);
      // Error state handled by hook
    }
  };

  const handleStop = async () => {
    try {
      await stopProxy();
    } catch (error) {
      console.error('Failed to stop proxy:', error);
      // Error state handled by hook
    }
  };

  const handleCopyUrl = async () => {
    const url = getProxyUrl(status?.port);
    await navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <Card className="card-gaming">
        <CardHeader>
          <h2 className="dashboard-card-title">Proxy Server</h2>
        </CardHeader>
        <CardContent>
          <p className="dashboard-description">Loading status...</p>
        </CardContent>
      </Card>
    );
  }

  const isRunning = status?.running || false;
  const proxyUrl = getProxyUrl(status?.port);

  return (
    <Card className="card-gaming">
      <CardHeader className="dashboard-card-header-row">
        <h2 className="dashboard-card-title">Proxy Server</h2>
        {error ? (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        ) : isRunning ? (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Running
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Stopped
          </Badge>
        )}
      </CardHeader>
      <CardContent className="dashboard-card-content">
        {error && (
          <div className="dashboard-error p-2 rounded mb-2">
            <p className="dashboard-error-text text-sm">{error}</p>
          </div>
        )}
        
        <div>
          <span className="dashboard-info-label">Endpoint URL:</span>
          <div className="dashboard-button-group">
            <code className="dashboard-code-block">
              {proxyUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              title="Copy URL"
            >
              {copySuccess ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {status?.port && (
          <div className="dashboard-info-row">
            <span className="dashboard-info-label">Port: </span>
            <span className="dashboard-info-value">{status.port}</span>
          </div>
        )}

        <div className="dashboard-button-group">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="flex-1"
              disabled={starting}
            >
              <Play className="h-4 w-4 mr-2" />
              {starting ? 'Starting...' : 'Start Proxy'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex-1"
              disabled={stopping}
            >
              <Square className="h-4 w-4 mr-2" />
              {stopping ? 'Stopping...' : 'Stop Proxy'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 6. IMPROVED USEPROXYSTATUS WITH ERROR DISPLAY

**File: `frontend/src/hooks/useProxyStatus.ts` (Updated)**

```ts
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api.service';
import { PROXY_DEFAULTS } from '@/constants/proxy';
import type { ProxyStatus } from '@/types';

export function useProxyStatus(pollingInterval = PROXY_DEFAULTS.POLLING_INTERVAL) {
  const [status, setStatus] = useState<ProxyStatus>({
    running: false,
    port: PROXY_DEFAULTS.DEFAULT_PORT,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const result = await apiService.getProxyStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch proxy status';
      console.error('Failed to get proxy status:', err);
      setError(message);
      // Keep last known status, don't reset to default
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshStatus();

    // Poll every pollingInterval, but don't poll if we already have valid status
    const interval = setInterval(refreshStatus, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval]);

  return { status, loading, error, refreshStatus };
}
```

---

### 7. FIX STATSCARD ERROR DISPLAY

**File: `frontend/src/components/features/dashboard/StatisticsCard.tsx` (Updated)**

```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useStatistics } from '@/hooks/useStatistics';
import { AlertCircle } from 'lucide-react';

export function StatisticsCard() {
  const { stats, loading, error } = useStatistics();

  if (loading) {
    return (
      <Card className="card-gaming">
        <CardHeader>
          <h2 className="dashboard-card-title">Statistics</h2>
        </CardHeader>
        <CardContent>
          <div className="dashboard-description">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-gaming border-destructive">
        <CardHeader>
          <h2 className="dashboard-card-title">Statistics</h2>
        </CardHeader>
        <CardContent>
          <div className="dashboard-error p-2 rounded">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="dashboard-error-text text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-gaming">
      <CardHeader>
        <h2 className="dashboard-card-title">Statistics</h2>
      </CardHeader>
      <CardContent className="dashboard-card-content">
        <div className="dashboard-info-grid">
          <div className="dashboard-info-row">
            <span className="dashboard-info-label">Total Providers</span>
            <span className="dashboard-stat-value">{stats.totalProviders}</span>
          </div>
          <div className="dashboard-info-row">
            <span className="dashboard-info-label">Active Sessions</span>
            <span className="dashboard-stat-value">{stats.activeSessions}</span>
          </div>
          <div className="dashboard-info-row">
            <span className="dashboard-info-label">Enabled Providers</span>
            <span className="dashboard-stat-value">{stats.enabledProviders}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 8. APPLY RESPONSIVE GRID LAYOUT

**File: `frontend/src/pages/dashboard/DashboardMainPage.tsx` (Updated)**

```tsx
import { QwenLoginCard } from '@/components/features/dashboard/QwenLoginCard';
import { ProxyControlCard } from '@/components/features/dashboard/ProxyControlCard';
import { StatisticsCard } from '@/components/features/dashboard/StatisticsCard';
import { CodeExample } from '@/components/features/dashboard/CodeExample';
import { usePageInstructions } from '@/hooks/core/usePageInstructions';
import { ErrorBoundary } from '@/components/core/ErrorBoundary';

export function DashboardMainPage() {
  usePageInstructions('dashboard');

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <ErrorBoundary cardName="Qwen Auth">
          <QwenLoginCard />
        </ErrorBoundary>
        
        <ErrorBoundary cardName="Proxy Control">
          <ProxyControlCard />
        </ErrorBoundary>
      </div>
      
      <div className="dashboard-grid">
        <ErrorBoundary cardName="Statistics">
          <StatisticsCard />
        </ErrorBoundary>
        
        <ErrorBoundary cardName="Code Example">
          <CodeExample />
        </ErrorBoundary>
      </div>
    </div>
  );
}
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `frontend/src/components/core/ErrorBoundary.tsx` | Create new | Prevents crashes from crashing entire dashboard |
| `frontend/src/constants/proxy.ts` | Create new | Centralizes port config, reduces duplication |
| `frontend/src/hooks/useCopyClipboard.ts` | Create new | Reusable clipboard logic |
| `frontend/src/hooks/useFormatCredentialExpiry.ts` | Create new | Consistent date formatting |
| `frontend/src/pages/dashboard/DashboardMainPage.tsx` | Update | Add error boundaries, apply grid layout |
| `frontend/src/pages/dashboard/MobileDashboardMainPage.tsx` | Refactor | Eliminate code duplication, reuse components |
| `frontend/src/components/features/dashboard/ProxyControlCard.tsx` | Update | Display error states |
| `frontend/src/components/features/dashboard/StatisticsCard.tsx` | Update | Display error states |
| `frontend/src/hooks/useProxyStatus.ts` | Update | Better error handling, use centralized config |

---

## Testing Checklist

After applying these changes:

- [ ] Dashboard loads without errors
- [ ] Error boundaries catch component errors
- [ ] Proxy URL displays consistently across desktop/mobile
- [ ] Copy-to-clipboard works on both views
- [ ] Error messages display when API calls fail
- [ ] Loading states show properly
- [ ] Mobile and desktop have responsive layouts
- [ ] No console errors or warnings

