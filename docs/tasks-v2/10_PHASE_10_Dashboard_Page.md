# Phase 10: Dashboard Page

**Priority:** P3 (Pages)
**Dependencies:** Phase 5, Phase 8, Phase 9
**Blocks:** None

## Page Structure

Dashboard has no parent-child relationships - it's a standalone page.

## Files to Create

```
frontend/src/pages/dashboard/
├── DashboardPage.tsx              # Parent page router (mobile/desktop switching)
├── DashboardMainPage.tsx          # Desktop main page with 2-column grid
└── MobileDashboardMainPage.tsx    # Mobile main page with single column

frontend/src/components/features/dashboard/
├── QwenLoginCard.tsx              # Qwen authentication with expiry and refresh
├── ProxyControlCard.tsx           # Unified proxy status and controls
├── StatisticsCard.tsx             # Shows provider/session statistics
├── QuickStartGuide.tsx            # Getting started guide
└── CodeExample.tsx                # Example code for using the proxy
```

## Files to Modify

- `frontend/src/App.tsx` - Import and route to DashboardPage

## Content

**frontend/src/pages/dashboard/DashboardPage.tsx**
```typescript
// Parent router - switches between mobile and desktop
import { useIsMobile } from '@/hooks/useIsMobile';
import { DashboardMainPage } from './DashboardMainPage';
import { MobileDashboardMainPage } from './MobileDashboardMainPage';

export function DashboardPage() {
  const isMobile = useIsMobile();

  const CurrentPageComponent = isMobile ? MobileDashboardMainPage : DashboardMainPage;

  return <CurrentPageComponent />;
}
```

**frontend/src/pages/dashboard/DashboardMainPage.tsx**
```typescript
import { Card } from '@/components/ui/card';
import { QwenLoginCard } from '@/components/features/dashboard/QwenLoginCard';
import { ProxyControlCard } from '@/components/features/dashboard/ProxyControlCard';
import { StatisticsCard } from '@/components/features/dashboard/StatisticsCard';
import { QuickStartGuide } from '@/components/features/dashboard/QuickStartGuide';
import { CodeExample } from '@/components/features/dashboard/CodeExample';
import { useApiHealth } from '@/hooks/useApiHealth';

export function DashboardMainPage() {
  const { isHealthy, loading } = useApiHealth();

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Manage your Qwen Proxy configuration and status
        </p>
      </div>

      {/* API Health Warning */}
      {loading ? (
        <div>Checking API health...</div>
      ) : !isHealthy ? (
        <Card className="dashboard-error">
          <div className="dashboard-error-text">
            API Server is not responding. Please check if it's running.
          </div>
        </Card>
      ) : null}

      {/* Two Column Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-column">
          <QwenLoginCard />
          <ProxyControlCard />
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          <StatisticsCard />
        </div>
      </div>

      {/* Full Width Sections */}
      <QuickStartGuide />
      <CodeExample />
    </div>
  );
}
```

**frontend/src/pages/dashboard/MobileDashboardMainPage.tsx**
```typescript
// Mobile version of Dashboard - compact single column layout
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, RefreshCw, CheckCircle, AlertCircle, Trash2, Play, Square, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useApiHealth } from '@/hooks/useApiHealth';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useCredentials } from '@/hooks/useCredentials';
import { useStatistics } from '@/hooks/useStatistics';

export function MobileDashboardMainPage() {
  const { isHealthy, loading: healthLoading } = useApiHealth();
  const { status: credStatus, loading: credLoading, isElectron, login, refresh, deleteCredentials } = useCredentials();
  const { status: proxyStatus, loading: proxyLoading } = useProxyStatus();
  const { startProxy, stopProxy, starting, stopping } = useProxyControl();
  const { stats, loading: statsLoading } = useStatistics();

  const [copyUrl, setCopyUrl] = useState(false);
  const [copyCode, setCopyCode] = useState(false);

  const handleDeleteCred = async () => {
    if (!confirm('Delete credentials?')) return;
    try {
      await deleteCredentials();
    } catch (error) {
      console.error('Failed to delete credentials:', error);
    }
  };

  const handleStartProxy = async () => {
    try {
      await startProxy();
    } catch (error) {
      console.error('Failed to start proxy:', error);
    }
  };

  const handleStopProxy = async () => {
    try {
      await stopProxy();
    } catch (error) {
      console.error('Failed to stop proxy:', error);
    }
  };

  const handleCopyUrl = async () => {
    const url = proxyStatus?.port
      ? `http://localhost:${proxyStatus.port}/v1`
      : 'http://localhost:3001/v1';
    await navigator.clipboard.writeText(url);
    setCopyUrl(true);
    setTimeout(() => setCopyUrl(false), 2000);
  };

  const proxyUrl = proxyStatus?.port
    ? `http://localhost:${proxyStatus.port}/v1/chat/completions`
    : 'http://localhost:3001/v1/chat/completions';

  const exampleCode = `const response = await fetch('${proxyUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});

const data = await response.json();`;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(exampleCode);
    setCopyCode(true);
    setTimeout(() => setCopyCode(false), 2000);
  };

  const formatExpiry = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getTimeRemaining = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const remaining = timestamp - now;
    if (remaining < 0) return 'Expired';
    const days = Math.floor(remaining / (1000 * 3600 * 24));
    if (days > 0) return `${days}d`;
    const hours = Math.floor(remaining / (1000 * 3600));
    return `${hours}h`;
  };

  return (
    <div className="dashboard-mobile-container">
      {/* Header */}
      <div className="dashboard-mobile-header">
        <h1 className="dashboard-mobile-title">Dashboard</h1>
        <p className="dashboard-mobile-subtitle">Qwen Proxy</p>
      </div>

      {/* API Health Warning */}
      {healthLoading ? (
        <div className="dashboard-mobile-loading">Checking...</div>
      ) : !isHealthy ? (
        <Card className="dashboard-mobile-error">
          <div className="dashboard-mobile-error-text">
            API Server not responding
          </div>
        </Card>
      ) : null}

      {/* Qwen Credentials - Compact */}
      <Card>
        <CardHeader className="dashboard-card-header">
          <div className="dashboard-card-header-row">
            <h2 className="dashboard-card-title">Qwen Auth</h2>
            {credStatus.hasCredentials && (
              <Badge variant={credStatus.isValid ? "default" : "destructive"} className="dashboard-badge-status">
                {credStatus.isValid ? "Active" : "Expired"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="dashboard-card-content">
          {isElectron ? (
            credStatus.hasCredentials ? (
              <>
                <div className="dashboard-info-grid">
                  <div className="dashboard-info-row">
                    <span className="dashboard-info-label">Expires</span>
                    <span className="dashboard-info-value">{formatExpiry(credStatus.expiresAt)}</span>
                  </div>
                  <div className="dashboard-info-row">
                    <span className="dashboard-info-label">Remaining</span>
                    <span className="dashboard-info-value">{getTimeRemaining(credStatus.expiresAt)}</span>
                  </div>
                </div>
                <div className="dashboard-button-group">
                  <Button onClick={login} variant="outline" size="sm" className="flex-1 dashboard-button-compact" disabled={credLoading}>
                    <LogIn className="h-3 w-3 mr-1" />
                    Re-login
                  </Button>
                  <Button onClick={refresh} variant="outline" size="sm" className="dashboard-button-icon" disabled={credLoading}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button onClick={handleDeleteCred} variant="destructive" size="sm" className="dashboard-button-icon" disabled={credLoading}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="dashboard-description">Login to enable AI features</p>
                <Button onClick={login} size="sm" className="w-full dashboard-button-compact" disabled={credLoading}>
                  <LogIn className="h-3 w-3 mr-1" />
                  {credLoading ? 'Logging in...' : 'Login to Qwen'}
                </Button>
              </>
            )
          ) : (
            <p className="dashboard-description">Desktop app only</p>
          )}
        </CardContent>
      </Card>

      {/* Proxy Control - Compact */}
      <Card>
        <CardHeader className="dashboard-card-header">
          <div className="dashboard-card-header-row">
            <h2 className="dashboard-card-title">Proxy Server</h2>
            {!proxyLoading && (
              <Badge variant={proxyStatus?.running ? "default" : "secondary"} className="dashboard-badge-status">
                {proxyStatus?.running ? "Running" : "Stopped"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="dashboard-card-content">
          <div>
            <div className="dashboard-button-group">
              <code className="dashboard-code-block">
                {proxyStatus?.port ? `localhost:${proxyStatus.port}/v1` : 'localhost:3001/v1'}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyUrl} className="dashboard-button-icon">
                {copyUrl ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          {proxyStatus?.running ? (
            <Button onClick={handleStopProxy} variant="destructive" size="sm" className="w-full dashboard-button-compact" disabled={stopping}>
              <Square className="h-3 w-3 mr-1" />
              {stopping ? 'Stopping...' : 'Stop'}
            </Button>
          ) : (
            <Button onClick={handleStartProxy} size="sm" className="w-full dashboard-button-compact" disabled={starting}>
              <Play className="h-3 w-3 mr-1" />
              {starting ? 'Starting...' : 'Start'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Statistics - Compact */}
      <Card>
        <CardHeader className="dashboard-card-header">
          <h2 className="dashboard-card-title">Statistics</h2>
        </CardHeader>
        <CardContent className="dashboard-card-content">
          {statsLoading ? (
            <div className="dashboard-description">Loading...</div>
          ) : (
            <div className="dashboard-stats-grid">
              <div>
                <div className="dashboard-stat-value">{stats.totalProviders}</div>
                <div className="dashboard-stat-label">Providers</div>
              </div>
              <div>
                <div className="dashboard-stat-value">{stats.activeSessions}</div>
                <div className="dashboard-stat-label">Sessions</div>
              </div>
              <div>
                <div className="dashboard-stat-value">{stats.enabledProviders}</div>
                <div className="dashboard-stat-label">Enabled</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start - Compact */}
      <Card>
        <CardHeader className="dashboard-card-header">
          <h2 className="dashboard-card-title">Quick Start</h2>
        </CardHeader>
        <CardContent className="dashboard-card-content">
          <div className="dashboard-info-grid">
            <div className="dashboard-button-group">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="dashboard-description">Login to Qwen above</span>
            </div>
            <div className="dashboard-button-group">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="dashboard-description">Start the proxy server</span>
            </div>
            <div className="dashboard-button-group">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="dashboard-description">Configure providers</span>
            </div>
            <div className="dashboard-button-group">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="dashboard-description">Make requests</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Example - Compact */}
      <Card>
        <CardHeader className="dashboard-card-header">
          <div className="dashboard-card-header-row">
            <h2 className="dashboard-card-title">Code Example</h2>
            <Button variant="outline" size="sm" onClick={handleCopyCode} className="h-6 px-2 text-xs">
              {copyCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="dashboard-card-content">
          <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
            <code className="font-mono">{exampleCode}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
```

**frontend/src/components/features/dashboard/QwenLoginCard.tsx**
```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useCredentials } from '@/hooks/useCredentials';

export function QwenLoginCard() {
  const { status, loading, isElectron, login, refresh, deleteCredentials } = useCredentials();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete saved credentials?')) {
      return;
    }

    try {
      await deleteCredentials();
    } catch (error) {
      console.error('Failed to delete credentials:', error);
    }
  };

  const formatExpiry = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeRemaining = (timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const remaining = timestamp - now;
    if (remaining < 0) return 'Expired';
    const hours = Math.floor(remaining / (1000 * 3600));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} days`;
    return `${hours} hours`;
  };

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <h2 className="dashboard-card-title">Qwen Authentication</h2>
        </CardHeader>
        <CardContent>
          <p className="dashboard-description">
            Qwen login is only available in the Electron desktop app.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="dashboard-card-header-row">
        <h2 className="dashboard-card-title">Qwen Authentication</h2>
        {status.hasCredentials ? (
          <Badge variant={status.isValid ? "default" : "destructive"}>
            {status.isValid ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Authenticated
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Expired
              </>
            )}
          </Badge>
        ) : (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Logged In
          </Badge>
        )}
      </CardHeader>
      <CardContent className="dashboard-card-content">
        {status.hasCredentials ? (
          <>
            <div className="dashboard-info-grid">
              <div className="dashboard-info-row">
                <span className="dashboard-info-label">Expires:</span>
                <p className="dashboard-info-value">{formatExpiry(status.expiresAt)}</p>
              </div>
              <div className="dashboard-info-row">
                <span className="dashboard-info-label">Time Left:</span>
                <p className="dashboard-info-value">{getTimeRemaining(status.expiresAt)}</p>
              </div>
            </div>

            <div className="dashboard-button-group">
              <Button
                onClick={refresh}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={login}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Re-login
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="icon"
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="dashboard-description">
              Login to Qwen to enable AI-powered features
            </p>
            <Button
              onClick={login}
              className="w-full"
              disabled={loading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? 'Logging in...' : 'Login to Qwen'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

**frontend/src/components/features/dashboard/ProxyControlCard.tsx**
```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Copy, CheckCircle, XCircle } from 'lucide-react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useState } from 'react';

export function ProxyControlCard() {
  const { status, loading } = useProxyStatus();
  const { startProxy, stopProxy, starting, stopping } = useProxyControl();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleStart = async () => {
    try {
      await startProxy();
    } catch (error) {
      console.error('Failed to start proxy:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopProxy();
    } catch (error) {
      console.error('Failed to stop proxy:', error);
    }
  };

  const handleCopyUrl = async () => {
    const url = status?.port
      ? `http://localhost:${status.port}/v1`
      : 'http://localhost:3001/v1';

    await navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <Card>
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
  const proxyUrl = status?.port
    ? `http://localhost:${status.port}/v1`
    : 'http://localhost:3001/v1';

  return (
    <Card>
      <CardHeader className="dashboard-card-header-row">
        <h2 className="dashboard-card-title">Proxy Server</h2>
        {isRunning ? (
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

**frontend/src/components/features/dashboard/StatisticsCard.tsx**
```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useStatistics } from '@/hooks/useStatistics';

export function StatisticsCard() {
  const { stats, loading } = useStatistics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="dashboard-card-title">Statistics</h2>
        </CardHeader>
        <CardContent>
          <div className="dashboard-description">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
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

**frontend/src/components/features/dashboard/QuickStartGuide.tsx**
```typescript
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function QuickStartGuide() {
  return (
    <Card>
      <CardHeader>
        <h2 className="dashboard-card-title">Quick Start Guide</h2>
      </CardHeader>
      <CardContent className="dashboard-card-content">
        <div className="dashboard-info-grid">
          <div className="dashboard-button-group">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="dashboard-info-value">1. Configure Qwen Credentials</div>
              <div className="dashboard-description">
                Click "Login to Qwen" above to authenticate with your Qwen account
              </div>
            </div>
          </div>
          <div className="dashboard-button-group">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="dashboard-info-value">2. Start the Proxy Server</div>
              <div className="dashboard-description">
                Click "Start Proxy" to begin routing requests
              </div>
            </div>
          </div>
          <div className="dashboard-button-group">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="dashboard-info-value">3. Configure Your Providers</div>
              <div className="dashboard-description">
                Add providers (OpenAI, Anthropic, Google, etc.) in the Providers page
              </div>
            </div>
          </div>
          <div className="dashboard-button-group">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="dashboard-info-value">4. Start Making Requests</div>
              <div className="dashboard-description">
                Use the example code below to send requests through the proxy
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**frontend/src/components/features/dashboard/CodeExample.tsx**
```typescript
import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useProxyStatus } from '@/hooks/useProxyStatus';

export function CodeExample() {
  const [copied, setCopied] = useState(false);
  const { status } = useProxyStatus();

  const proxyUrl = status?.port
    ? `http://localhost:${status.port}/v1/chat/completions`
    : 'http://localhost:3001/v1/chat/completions';

  const exampleCode = `const response = await fetch('${proxyUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Hello, world!' }
    ]
  })
});

const data = await response.json();
console.log(data);`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="dashboard-card-header-row">
        <h2 className="dashboard-card-title">Example Code</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="dashboard-button-group"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="dashboard-card-content">
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
          <code className="text-sm font-mono">{exampleCode}</code>
        </pre>
        <p className="dashboard-description">
          The proxy will automatically route your request to the appropriate provider
          based on your configuration and model mappings.
        </p>
      </CardContent>
    </Card>
  );
}
```

**frontend/src/App.tsx** (update)
```typescript
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

function App() {
  return (
    <ThemeProvider>
      <AppLayout statusMessage="Ready">
        <DashboardPage />
      </AppLayout>
    </ThemeProvider>
  );
}

export default App;
```

## Integration Points

- QwenLoginCard uses credentialsService (Phase 7)
- ProxyControlCard uses useProxyStatus and useProxyControl hooks (Phase 5, 6)
- StatisticsCard uses apiService (Phase 3)
- CodeExample uses useProxyStatus hook (Phase 5)
- All cards use shadcn/ui components
- Layout from existing implementation

## Structure After Phase 10

```
frontend/src/
├── pages/
│   └── dashboard/                          # 🆕 New
│       ├── DashboardPage.tsx               # Router
│       ├── DashboardMainPage.tsx           # Desktop 2-column layout
│       └── MobileDashboardMainPage.tsx     # Mobile single column
├── components/
│   └── features/
│       ├── dashboard/                      # 🆕 New
│       │   ├── QwenLoginCard.tsx          # Login with expiry/refresh
│       │   ├── ProxyControlCard.tsx       # Unified status+controls
│       │   ├── StatisticsCard.tsx
│       │   ├── QuickStartGuide.tsx
│       │   └── CodeExample.tsx
│       ├── proxy/                          # ✅ From Phase 8 (not used on dashboard)
│       └── credentials/                    # ✅ From Phase 9 (not used on dashboard)
├── App.tsx                                 # 🔧 Modified
```

## Validation

- [ ] Dashboard displays all 5 cards (Qwen Login, Proxy Control, Statistics, QuickStart, Code Example)
- [ ] Two-column layout on desktop, single column on mobile
- [ ] QwenLoginCard shows expiry timestamp and time remaining when logged in
- [ ] QwenLoginCard has Refresh, Re-login, and Delete buttons
- [ ] ProxyControlCard shows status badge (Running/Stopped)
- [ ] ProxyControlCard has Copy URL button
- [ ] Proxy controls work (Start/Stop)
- [ ] Health check warning appears when API down
- [ ] Statistics load and display correctly
- [ ] Code example shows correct proxy URL with dynamic port
- [ ] Copy buttons work for both URL and code
- [ ] All loading states display correctly
