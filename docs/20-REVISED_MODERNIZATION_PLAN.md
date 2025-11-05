# Revised Electron & Dashboard Modernization Plan

## Critical Realization

The original plan to **remove backend spawning was flawed**. The Electron architecture has critical UX features that would be lost:

❌ **What We Were About to Lose:**
1. Embedded browser login with automatic cookie extraction
2. One-click start/stop backend
3. Seamless credentials management
4. True desktop app experience (double-click → works)
5. Background service with system tray

✅ **What We Should Keep:**
1. Backend spawning from Electron
2. Credential extraction from embedded login
3. One-click proxy controls
4. Process lifecycle management
5. System tray integration

---

## The Real Problems to Fix

### Problem 1: Duplicate UI Systems

**Issue:** Doc 02 describes vanilla JS UI in `/electron/ui/`, but we have React CRUD already

**Solution:**
- Delete `/electron/ui/` vanilla JS
- Keep React CRUD app as the UI
- Add dashboard features (login, proxy control) to React app
- Electron loads React app (Vite in dev, built files in prod)

### Problem 2: Outdated Authentication Flow

**Issue:** Original plan assumes Qwen-only authentication with embedded login

**Solution:**
- Keep embedded login for Qwen providers
- Add support for other auth methods (LM Studio doesn't need login, API keys for other providers)
- Store credentials in database (not just .env)
- Credential extraction creates/updates Qwen provider in database

### Problem 3: Duplicate Settings Management

**Issue:** Settings exist in both IPC handlers (unused) and backend REST API

**Solution:**
- Remove unused IPC settings handlers
- Keep settings in backend database
- Frontend uses REST API for settings
- Backend restart when needed via BackendManager

### Problem 4: No Integration with CRUD Pages

**Issue:** Dashboard features (login, proxy control) not connected to Providers/Models/Sessions CRUD

**Solution:**
- Add "Proxy Control" card to HomePage
- Add "Qwen Login" button to create Qwen provider
- Provider detail page shows if provider needs auth
- Session management works with spawned backend

---

## Architecture: Keep Spawning, Modernize UI

### Current Architecture (Keep This)

```
┌─────────────────────────────────────────────┐
│         Electron Main Process               │
│  ┌──────────────────────────────────────┐   │
│  │     Backend Manager (Singleton)      │   │
│  │  - Spawns backend as child process   │   │
│  │  - Passes credentials via env vars   │   │
│  │  - Manages lifecycle (start/stop)    │   │
│  │  - Restarts on config changes        │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│                 ▼                            │
│  ┌──────────────────────────────────────┐   │
│  │      Child Process (Backend)         │   │
│  │  - Express server                    │   │
│  │  - SQLite database                   │   │
│  │  - Provider routing                  │   │
│  │  - REST API for CRUD                 │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                 ▲
                 │ HTTP (fetch)
                 │
┌─────────────────────────────────────────────┐
│      Electron Renderer (React App)          │
│  ┌──────────────────────────────────────┐   │
│  │  React CRUD Pages (Keep & Enhance)   │   │
│  │  - Providers, Models, Sessions        │   │
│  │  - Settings                           │   │
│  │  - Activity                           │   │
│  │                                       │   │
│  │  NEW: Dashboard Features (Add)        │   │
│  │  - Qwen Login Card                    │   │
│  │  - Proxy Control Card                 │   │
│  │  - Backend Status                     │   │
│  │  - Quick Start Guide                  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Communicates via:                           │
│  - IPC for Electron features (login, tray)  │
│  - HTTP for data (CRUD, settings)           │
└──────────────────────────────────────────────┘
```

---

## Modernization Strategy (Revised)

### Phase 1: Update Backend Manager for Database Credentials

**Goal:** Backend manager reads Qwen credentials from database, not just .env

**Current Flow:**
1. User logs in via embedded browser
2. Electron extracts cookies
3. Saves to `.env` file
4. Spawns backend with `QWEN_TOKEN` and `QWEN_COOKIES` env vars
5. Backend reads from env vars

**Modernized Flow:**
1. User logs in via embedded browser
2. Electron extracts cookies
3. **Creates/updates Qwen provider in database** via REST API
4. Spawns backend (backend reads credentials from database)
5. **No .env needed for credentials** (only for server config like PORT)

**Changes Needed:**

```typescript
// electron/src/services/backend-manager.ts

export class BackendManager {
  async start(settings: ServerSettings): Promise<void> {
    const { port, host } = settings;

    // OLD: Pass credentials as env vars
    // spawn('wsl', ['bash', '-c',
    //   `QWEN_TOKEN="${token}" QWEN_COOKIES="${cookies}" ...`
    // ]);

    // NEW: Just spawn backend, it reads credentials from database
    this.backendProcess = spawn('wsl', ['bash', '-c',
      `cd "${wslDir}" && PORT="${port}" HOST="${host}" ${nodeFullPath} "${wslPath}"`
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    // Wait for backend to be ready
    await this.waitForBackend(port);
  }

  private async waitForBackend(port: number): Promise<void> {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) return;
      } catch {
        // Not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Backend failed to start');
  }
}
```

**Update login flow:**

```typescript
// electron/src/main.ts

async function handleQwenLogin() {
  // Open embedded login window
  const loginWindow = createLoginWindow();

  // Wait for successful login
  loginWindow.webContents.on('did-navigate', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract cookies
    const cookies = await extractQwenCookies();
    const token = cookies.find(c => c.name === 'bx-umidtoken')?.value;

    if (token && cookies) {
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

      // Decode JWT to get expiration
      const decoded = decodeJWT(token);

      // NEW: Create/update Qwen provider in database via REST API
      const backendPort = backendManager.getPort();
      try {
        await fetch(`http://localhost:${backendPort}/v1/providers/qwen-default`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Qwen (Default)',
            type: 'qwen-direct',
            enabled: true,
            config: {
              base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
              credentials: {
                token,
                cookies: cookieString,
                expires_at: decoded.exp
              }
            }
          })
        });

        logger.info('Qwen provider created/updated in database');

        // Notify UI
        mainWindow?.webContents.send('credentials-updated', {
          hasToken: true,
          tokenExpiry: decoded.exp
        });

        // Show notification
        new Notification({
          title: 'Login Successful',
          body: 'Qwen credentials extracted and saved'
        }).show();

      } catch (error) {
        logger.error('Failed to save Qwen provider', error);
      }

      loginWindow.close();
    }
  });
}
```

---

### Phase 2: Add Dashboard Features to React App

**Goal:** Integrate proxy control and Qwen login into existing React CRUD

**Add to HomePage:**

```typescript
// frontend/src/pages/HomePage.tsx
import { ProxyControlCard } from '@/components/dashboard/ProxyControlCard';
import { QwenLoginCard } from '@/components/dashboard/QwenLoginCard';
import { QuickStartGuide } from '@/components/dashboard/QuickStartGuide';
import { CodeExample } from '@/components/dashboard/CodeExample';

export default function HomePage() {
  const { data: providers } = useProviders();
  const { data: sessions } = useSessions();

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* NEW: Qwen Login Card */}
            <QwenLoginCard />

            {/* NEW: Proxy Control Card */}
            <ProxyControlCard />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader><h2>Statistics</h2></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Providers</span>
                    <span className="font-bold">{providers?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-bold">{sessions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enabled Providers</span>
                    <span className="font-bold">
                      {providers?.filter(p => p.enabled).length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Width Sections */}
        <QuickStartGuide />
        <CodeExample />
      </div>
    </PageLayout>
  );
}
```

**Create QwenLoginCard:**

```typescript
// frontend/src/components/dashboard/QwenLoginCard.tsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function QwenLoginCard() {
  const [credentials, setCredentials] = useState<{
    hasToken: boolean;
    tokenExpiry?: number;
  }>({ hasToken: false });

  const isElectron = window.electronAPI !== undefined;

  useEffect(() => {
    if (!isElectron) return;

    // Get initial credentials
    window.electronAPI.getCredentials().then(setCredentials);

    // Listen for updates
    const unsubscribe = window.electronAPI.onCredentialsUpdated(setCredentials);

    return () => unsubscribe();
  }, [isElectron]);

  const handleLogin = () => {
    if (isElectron) {
      window.electronAPI.openLogin();
    }
  };

  const handleRefresh = async () => {
    if (isElectron) {
      const newCreds = await window.electronAPI.refreshCredentials();
      setCredentials(newCreds);
    }
  };

  const formatExpiry = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const getTimeRemaining = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const now = Date.now() / 1000;
    const remaining = timestamp - now;
    if (remaining < 0) return 'Expired';
    const hours = Math.floor(remaining / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} days`;
    return `${hours} hours`;
  };

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <h2>Qwen Authentication</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Qwen login is only available in the Electron desktop app.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2>Qwen Authentication</h2>
        {credentials.hasToken ? (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Authenticated
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Logged In
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {credentials.hasToken ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <p className="font-medium">{formatExpiry(credentials.tokenExpiry)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time Left:</span>
                <p className="font-medium">{getTimeRemaining(credentials.tokenExpiry)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleLogin} variant="outline" className="flex-1">
                <LogIn className="h-4 w-4 mr-2" />
                Re-login
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Login to Qwen to enable AI-powered features
            </p>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="h-4 w-4 mr-2" />
              Login to Qwen
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

**Create ProxyControlCard:**

```typescript
// frontend/src/components/dashboard/ProxyControlCard.tsx
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Copy, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function ProxyControlCard() {
  const [proxyStatus, setProxyStatus] = useState({ running: false });
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();

  const isElectron = window.electronAPI !== undefined;

  useEffect(() => {
    if (!isElectron) return;

    // Get initial status
    window.electronAPI.getProxyStatus().then(setProxyStatus);

    // Listen for updates
    const unsubscribe = window.electronAPI.onProxyStatusChanged(setProxyStatus);

    return () => unsubscribe();
  }, [isElectron]);

  const handleStart = async () => {
    if (!isElectron) return;

    setIsStarting(true);
    try {
      const result = await window.electronAPI.startProxy();
      if (result.success) {
        toast({
          title: 'Proxy Started',
          description: `Backend running on port ${result.port || 8000}`
        });
      } else {
        toast({
          title: 'Failed to Start',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!isElectron) return;

    try {
      const result = await window.electronAPI.stopProxy();
      if (result.success) {
        toast({
          title: 'Proxy Stopped',
          description: 'Backend server stopped successfully'
        });
      } else {
        toast({
          title: 'Failed to Stop',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleCopyUrl = () => {
    const url = 'http://localhost:8000/v1';
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'Endpoint URL copied to clipboard'
    });
  };

  if (!isElectron) {
    return (
      <Card>
        <CardHeader>
          <h2>Proxy Control</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Proxy control is only available in the Electron desktop app.
            <br />
            Start the backend manually: <code className="bg-muted px-1 py-0.5 rounded">npm start</code>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2>Proxy Server</h2>
        {proxyStatus.running ? (
          <Badge variant="success">
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
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Endpoint URL:</span>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
              http://localhost:8000/v1
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              disabled={!proxyStatus.running}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          {proxyStatus.running ? (
            <Button onClick={handleStop} variant="destructive" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Stop Proxy
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={isStarting} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              {isStarting ? 'Starting...' : 'Start Proxy'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Phase 3: Enhance System Tray with CRUD Pages

**Update system tray to include CRUD navigation:**

```typescript
// electron/src/main.ts

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icons/png/16x16.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/');
      }
    },
    { type: 'separator' },
    {
      label: 'Login to Qwen',
      click: () => handleQwenLogin(),
      enabled: !credentials?.hasToken
    },
    {
      label: proxyStatus.running ? 'Stop Proxy' : 'Start Proxy',
      click: () => {
        if (proxyStatus.running) {
          stopProxyServer();
        } else {
          startProxyServer();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Providers',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/providers');
      }
    },
    {
      label: 'Models',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/models');
      }
    },
    {
      label: 'Sessions',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/sessions');
      }
    },
    {
      label: 'Activity',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/activity');
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('navigate', '/settings');
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(`Qwen Proxy ${proxyStatus.running ? '(Running)' : '(Stopped)'}`);
}
```

---

### Phase 4: Remove Redundant Code

**Delete:**
- `/electron/ui/` - Old vanilla JS UI
- `/electron/src/ipc/settings-handlers.ts` - Unused settings IPC
- `/electron/src/services/settings-manager.ts` - Unused settings manager

**Keep:**
- `/electron/src/services/backend-manager.ts` - Backend spawning (CRITICAL)
- `/electron/src/main.ts` - Main process (update as shown above)
- `/electron/preload.js` - IPC bridge (update to remove settings methods)

---

## Summary: What This Plan Does Right

✅ **Keeps the good parts:**
1. Backend spawning from Electron (essential for UX)
2. Embedded browser login (automatic cookie extraction)
3. One-click proxy control
4. System tray integration
5. Desktop app experience

✅ **Fixes the real problems:**
1. Removes duplicate vanilla JS UI (use React CRUD)
2. Credentials stored in database (not just .env)
3. Removes unused settings IPC (use REST API)
4. Integrates dashboard features into CRUD pages

✅ **Modernizes properly:**
1. React app with full CRUD capabilities
2. Database-backed configuration
3. Multi-provider support (not just Qwen)
4. Clean architecture (Electron for OS, backend for data)

---

## Implementation Checklist

### Phase 1: Backend Manager Updates
- [ ] Update BackendManager to not pass credentials via env vars
- [ ] Backend reads credentials from database providers table
- [ ] Update login flow to create/update provider in database
- [ ] Test backend spawning with database credentials

### Phase 2: Dashboard Features
- [ ] Create QwenLoginCard component
- [ ] Create ProxyControlCard component
- [ ] Add dashboard features to HomePage
- [ ] Test login flow end-to-end
- [ ] Test proxy control end-to-end

### Phase 3: System Tray
- [ ] Update tray menu with CRUD navigation
- [ ] Add navigate IPC handler
- [ ] Test tray navigation
- [ ] Update tray tooltip with status

### Phase 4: Cleanup
- [ ] Delete /electron/ui/ directory
- [ ] Remove settings IPC handlers
- [ ] Remove settings manager service
- [ ] Update preload.js (remove settings methods)
- [ ] Test build

---

## Why This Plan Is Better

**Original (incorrect) plan:**
- Removed backend spawning → breaks desktop app UX
- No credential management → users can't login
- Manual backend start → not a desktop app anymore

**Revised plan:**
- Keeps backend spawning → seamless UX
- Keeps embedded login → automatic credentials
- Modernizes UI → React CRUD + dashboard features
- Fixes duplication → single source of truth (database)

This plan respects the original architecture's **core value proposition** (desktop app with automatic setup) while fixing the **actual problems** (duplicate UI, outdated patterns, missing CRUD integration).
