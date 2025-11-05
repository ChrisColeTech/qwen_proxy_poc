# Electron & Dashboard Modernization Plan

## Executive Summary

The current docs (02-ELECTRON.md and 03-FRONTEND_DASHBOARD_MIGRATION.md) describe an **OUTDATED ARCHITECTURE** that was designed before the current CRUD implementation. This document outlines how to modernize and synthesize these features into the existing application seamlessly.

## Current State Analysis

### What's Outdated

#### Doc 02 (Electron Setup)
❌ **Old UI Location**: References `/electron/ui/` which conflicts with our React app
❌ **Duplicate Settings**: Has unused IPC-based settings system
❌ **Backend Management**: Hardcoded Node.js paths, WSL-specific
❌ **Manual Credential Extraction**: Requires embedded browser login
❌ **No Database Integration**: Doesn't use the SQLite persistence we built
❌ **Old Dashboard**: Vanilla JS UI replaced by our React implementation

#### Doc 03 (Dashboard Migration)
❌ **Incomplete Migration**: Stopped at Phase 11, never integrated CRUD
❌ **Separate Dashboard**: Treated as standalone, not integrated with CRUD
❌ **Settings Duplication**: Has its own settings system (Phases 12-14)
❌ **No Provider/Model Management**: Doesn't connect to our CRUD pages
❌ **Authentication Focus**: Qwen login-only, no multi-provider support

### What's Still Useful

#### From Doc 02 (Electron)
✅ **System Tray Integration** - Hide to tray, background running
✅ **Custom Title Bar** - Frameless window with window controls
✅ **IPC Architecture** - Secure contextBridge pattern
✅ **Background Service** - Backend runs as child process
✅ **Token Expiration Monitoring** - Hourly checks with notifications

#### From Doc 03 (Dashboard)
✅ **Type-Safe IPC Service** - `electron-ipc.service.ts` pattern
✅ **Credentials Hooks** - `useCredentials`, `useProxyControl`
✅ **Formatters** - Date/time formatting utilities
✅ **Quick Start Guide** - User onboarding component
✅ **Code Examples** - Copy-to-clipboard code snippets

### What We Already Have (Better)

Our current implementation (from doc 14) provides:

✅ **Complete CRUD System** - Providers, Models, Sessions, Requests
✅ **React Router Integration** - Full navigation with 17 routes
✅ **Database Persistence** - SQLite with proper migrations
✅ **Multi-Provider Support** - LM Studio, Qwen Proxy, Qwen Direct
✅ **Settings Page** - Already exists in our CRUD
✅ **Modern UI** - shadcn/ui components, Tailwind CSS
✅ **Type Safety** - Full TypeScript with strict mode

## Modernization Strategy

### Phase 1: Electron Integration (P0)

**Goal**: Make the existing React CRUD app work in Electron without duplicating functionality.

#### 1.1 Simplify Backend Management

**Current (Doc 02)**: Complex WSL spawning, hardcoded paths
**Modernized**: Use existing backend API, no process management needed

```typescript
// electron/src/services/backend-connector.ts
class BackendConnector {
  private baseUrl = 'http://localhost:3002';

  async checkBackend(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Removed: spawn, WSL paths, credentials injection
  // Backend runs independently, Electron just connects to it
}
```

**Why**:
- Backend already has SQLite persistence
- No need for .env file management
- Simplifies Electron responsibilities
- User starts backend manually or via system service

#### 1.2 Update IPC Bridge

**Current (Doc 02)**: Extensive IPC for credentials, settings, proxy control
**Modernized**: Minimal IPC for Electron-specific features only

```typescript
// electron/preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls (keep)
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },

  // System features (keep)
  system: {
    copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
    openExternal: (url) => ipcRenderer.invoke('open-external', url)
  },

  // Tray controls (keep)
  tray: {
    show: () => ipcRenderer.send('tray:show'),
    hide: () => ipcRenderer.send('tray:hide'),
    setTooltip: (text) => ipcRenderer.send('tray:set-tooltip', text)
  },

  // REMOVED: credentials (use backend API)
  // REMOVED: proxy control (use backend API)
  // REMOVED: settings (use backend API)
});
```

**Why**:
- Everything else goes through the backend REST API
- Reduces IPC complexity
- Frontend works in both browser and Electron
- Single source of truth (backend database)

#### 1.3 Integrate Custom Title Bar

**Current**: TitleBar exists but only has theme toggle and sidebar position
**Modernized**: Add window controls for Electron

```typescript
// frontend/src/components/layout/TitleBar.tsx
export const TitleBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { sidebarPosition, setSidebarPosition } = useSettingsStore();
  const isElectron = window.electronAPI !== undefined;

  return (
    <div className="h-8 bg-background border-b flex items-center justify-between"
         style={{ WebkitAppRegion: 'drag' }}>

      {/* Left: App icon + name */}
      <div className="flex items-center gap-2 pl-2">
        <img src="./icon-32.png" alt="App Icon" className="h-5 w-5" />
        <span className="text-sm font-semibold">Qwen Proxy OpenCode</span>
      </div>

      {/* Right: Controls */}
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Existing: Sidebar position toggle */}
        <button onClick={toggleSidebarPosition}>...</button>

        {/* Existing: Theme toggle */}
        <button onClick={toggleTheme}>...</button>

        {/* NEW: Electron window controls */}
        {isElectron && (
          <>
            <button onClick={() => window.electronAPI.window.minimize()}>
              <VscChromeMinimize />
            </button>
            <button onClick={() => window.electronAPI.window.maximize()}>
              <VscChromeMaximize />
            </button>
            <button onClick={() => window.electronAPI.window.close()}>
              <VscChromeClose />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
```

#### 1.4 System Tray Integration

**Current**: None
**Modernized**: Add system tray for background running

```typescript
// electron/src/main.ts
function createTray() {
  const iconPath = path.join(__dirname, '../assets/icons/png/16x16.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Dashboard', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: 'Providers', click: () => navigateTo('/providers') },
    { label: 'Models', click: () => navigateTo('/models') },
    { label: 'Sessions', click: () => navigateTo('/sessions') },
    { label: 'Requests', click: () => navigateTo('/requests') },
    { type: 'separator' },
    { label: 'Settings', click: () => navigateTo('/settings') },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Qwen Proxy OpenCode');
}

// Hide to tray instead of quit
mainWindow.on('close', (event) => {
  if (!app.isQuitting) {
    event.preventDefault();
    mainWindow?.hide();
  }
});
```

### Phase 2: Dashboard Features (P1)

**Goal**: Add missing dashboard features from Doc 03 to our existing pages.

#### 2.1 HomePage Enhancements

**Current**: Basic welcome with navigation cards
**Modernized**: Add authentication status and quick actions

```typescript
// frontend/src/pages/HomePage.tsx
export default function HomePage() {
  const { data: providers } = useProviders();
  const { data: sessions } = useSessions();
  const backendConnected = useBackendConnection(); // New hook

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        {/* NEW: Connection Status */}
        <Card>
          <CardHeader>
            <h2>Backend Status</h2>
          </CardHeader>
          <CardContent>
            <div className={backendConnected ? 'text-green-600' : 'text-destructive'}>
              {backendConnected ? '● Connected' : '○ Disconnected'}
            </div>
            {!backendConnected && (
              <p className="text-sm text-muted-foreground mt-2">
                Start the backend server: <code>npm start</code>
              </p>
            )}
          </CardContent>
        </Card>

        {/* NEW: Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{providers?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Providers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{sessions?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {providers?.filter(p => p.enabled).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Enabled Providers</div>
            </CardContent>
          </Card>
        </div>

        {/* NEW: Quick Start Guide (from Doc 03) */}
        <QuickStartGuide />

        {/* NEW: Code Example (from Doc 03) */}
        <CodeExample />

        {/* Existing: Navigation Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* ... existing cards ... */}
        </div>
      </div>
    </PageLayout>
  );
}
```

#### 2.2 Create QuickStartGuide Component

**From Doc 03**, adapt for our multi-provider system:

```typescript
// frontend/src/components/dashboard/QuickStartGuide.tsx
export function QuickStartGuide() {
  const STEPS = [
    {
      number: 1,
      title: 'Configure Providers',
      description: 'Add one or more AI providers (LM Studio, Qwen, etc.)',
      link: '/providers/create'
    },
    {
      number: 2,
      title: 'Start Backend Server',
      description: 'Run npm start in backend directory',
      code: 'npm start'
    },
    {
      number: 3,
      title: 'Use with OpenAI SDK',
      description: 'Point your OpenAI client to http://localhost:8000/v1',
      link: null
    },
  ];

  return (
    <Card>
      <CardHeader>
        <FileText className="h-5 w-5" />
        <h2>Quick Start</h2>
      </CardHeader>
      <CardContent>
        {STEPS.map(step => (
          <div key={step.number} className="flex gap-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground">
              {step.number}
            </div>
            <div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {step.link && (
                <Link to={step.link} className="text-sm text-primary">
                  Go →
                </Link>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

#### 2.3 Create CodeExample Component

**From Doc 03**, update for our multi-provider system:

```typescript
// frontend/src/components/dashboard/CodeExample.tsx
export function CodeExample() {
  const { data: providers } = useProviders({ enabled: true });
  const firstProvider = providers?.[0];

  const CODE_EXAMPLE = `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'any-key'  // Not used, but required by SDK
});

const response = await client.chat.completions.create({
  model: '${firstProvider?.id || 'qwen-max'}',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);`;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CODE_EXAMPLE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="bg-muted/50 border-b px-4 py-2 flex justify-between">
          <span className="text-xs font-medium">Example (JavaScript)</span>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm">
          <code className="font-mono">{CODE_EXAMPLE}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
```

#### 2.4 ActivityPage Enhancements

**Current**: Placeholder
**Modernized**: Real-time activity feed from request logs

```typescript
// frontend/src/pages/ActivityPage.tsx
export default function ActivityPage() {
  const { data: recentRequests } = useRequests({ limit: 50 });
  const { data: sessions } = useSessions();

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Activity</h1>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <h2>Recent Requests</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRequests?.slice(0, 10).map(req => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <StatusBadge variant={req.status < 400 ? 'success' : 'error'}>
                      {req.status}
                    </StatusBadge>
                    <span className="font-mono text-sm">{req.method}</span>
                    <span className="text-sm truncate">{req.endpoint}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(req.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <h2>Active Sessions</h2>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions?.length || 0}</div>
            <p className="text-sm text-muted-foreground">
              Chat sessions in progress
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
```

### Phase 3: Remove Redundancies (P2)

**Goal**: Clean up duplicated/outdated code.

#### 3.1 Remove Old Electron UI

```bash
# Delete old vanilla JS UI
rm -rf electron/ui/

# Update electron/src/main.ts to only load React build
```

#### 3.2 Remove Unused IPC Handlers

```typescript
// electron/src/main.ts
// REMOVE these handlers (use backend API instead):
❌ ipcMain.handle('get-credentials')
❌ ipcMain.handle('refresh-credentials')
❌ ipcMain.handle('start-proxy')
❌ ipcMain.handle('stop-proxy')
❌ ipcMain.handle('settings:get-all')
❌ ipcMain.handle('settings:update')

// KEEP these handlers (Electron-specific):
✅ ipcMain.on('window:minimize')
✅ ipcMain.on('window:maximize')
✅ ipcMain.on('window:close')
✅ ipcMain.handle('copy-to-clipboard')
✅ ipcMain.handle('show-notification')
✅ ipcMain.handle('open-external')
```

#### 3.3 Remove Unused Services

```bash
# Delete redundant service files
rm electron/src/services/backend-manager.ts
rm electron/src/services/settings-manager.ts
rm electron/src/ipc/settings-handlers.ts
```

### Phase 4: Enhanced Features (P3)

**Goal**: Add nice-to-have features that enhance UX.

#### 4.1 Token Expiration Monitoring

**From Doc 02**, adapt for multi-provider:

```typescript
// frontend/src/hooks/useProviderHealth.ts
export function useProviderHealth() {
  const { data: providers } = useProviders({ enabled: true });
  const [unhealthy, setUnhealthy] = useState<Provider[]>([]);

  useEffect(() => {
    // Check each provider every hour
    const interval = setInterval(async () => {
      for (const provider of providers || []) {
        try {
          await testProvider(provider.id);
        } catch (error) {
          setUnhealthy(prev => [...prev, provider]);

          // Show notification
          if (window.electronAPI?.system?.showNotification) {
            window.electronAPI.system.showNotification(
              'Provider Unhealthy',
              `${provider.name} is not responding`
            );
          }
        }
      }
    }, 60 * 60 * 1000); // Hourly

    return () => clearInterval(interval);
  }, [providers]);

  return { unhealthy };
}
```

#### 4.2 Global Notifications

```typescript
// frontend/src/components/layout/NotificationProvider.tsx
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { unhealthy } = useProviderHealth();

  useEffect(() => {
    if (unhealthy.length > 0) {
      toast.error(`${unhealthy.length} provider(s) unhealthy`);
    }
  }, [unhealthy]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
```

## Implementation Checklist

### Phase 1: Electron Integration (P0)
- [ ] Simplify backend connector (remove spawning)
- [ ] Update preload.js (minimal IPC)
- [ ] Add window controls to TitleBar
- [ ] Implement system tray
- [ ] Add hide-to-tray behavior
- [ ] Test in Electron build

### Phase 2: Dashboard Features (P1)
- [ ] Create QuickStartGuide component
- [ ] Create CodeExample component
- [ ] Enhance HomePage with stats
- [ ] Add backend connection status
- [ ] Enhance ActivityPage with real data
- [ ] Test all new components

### Phase 3: Remove Redundancies (P2)
- [ ] Delete electron/ui/ directory
- [ ] Remove unused IPC handlers
- [ ] Delete unused services
- [ ] Clean up preload.js
- [ ] Update main.ts
- [ ] Test build

### Phase 4: Enhanced Features (P3)
- [ ] Add provider health monitoring
- [ ] Implement notifications
- [ ] Add toast notifications
- [ ] Test notification flow
- [ ] Document new features

## Benefits of This Approach

1. **No Duplication**: Single source of truth (backend database)
2. **Simpler Electron**: Only handles OS integration
3. **Reusable Frontend**: Works in browser AND Electron
4. **Better Architecture**: Clear separation of concerns
5. **Easier Maintenance**: Less code to maintain
6. **Type Safety**: Full TypeScript throughout
7. **Modern Stack**: Uses our existing CRUD infrastructure

## Migration Path

1. **Week 1**: Phase 1 (Electron Integration)
2. **Week 2**: Phase 2 (Dashboard Features)
3. **Week 3**: Phase 3 (Cleanup)
4. **Week 4**: Phase 4 (Enhanced Features)

## Next Steps

Ready to proceed? I recommend starting with Phase 1.1 (Backend Connector) to establish the foundation.
