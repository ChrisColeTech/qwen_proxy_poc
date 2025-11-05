# Backend Lifecycle Management

## Overview

Since the Electron app does NOT spawn the backend as a child process, we need different strategies for managing the backend lifecycle (start, stop, restart, reload configuration).

## Key Principle

**Backend runs independently** - User starts it manually or as a system service. Electron just connects to it via HTTP.

---

## When Does Backend Need a Restart?

### ❌ Changes That DO NOT Require Restart

The backend supports **hot reloading** for these configuration changes:

1. **Provider Configuration Changes**
   - Base URL updates
   - API key changes
   - Provider enable/disable
   - **Solution**: Use `POST /v1/providers/:id/reload` endpoint
   - **Why**: Provider instances are reloaded from database without server restart

2. **Provider CRUD Operations**
   - Creating new providers
   - Deleting providers
   - Updating provider metadata (name, description, priority)
   - **Solution**: Backend automatically picks up database changes
   - **Why**: Providers are loaded from database on each request

3. **Model Management**
   - Adding/removing models
   - Provider-model mappings
   - **Solution**: No action needed
   - **Why**: Models are queried from database dynamically

4. **Settings Changes** (Most)
   - Logging level changes
   - Request/response logging toggles
   - **Solution**: Settings are loaded from database on each request
   - **Why**: Most settings are checked per-request

### ✅ Changes That DO Require Restart

Only **server-level configuration** requires a full restart:

1. **Port/Host Changes**
   - Changing `PORT` or `HOST` environment variables
   - **Why**: Server socket is bound on startup
   - **Solution**: Manual restart required

2. **Database File Path Changes**
   - Changing `DB_PATH` environment variable
   - **Why**: Database connection is established on startup
   - **Solution**: Manual restart required

3. **Legacy Mode Toggle**
   - Changing `USE_LEGACY_CONFIG=true/false`
   - **Why**: Configuration source is determined on startup
   - **Solution**: Manual restart required

4. **Major Code Updates**
   - Installing new dependencies
   - Updating backend code via git pull
   - **Why**: Node.js doesn't hot-reload code changes
   - **Solution**: Manual restart required

---

## Backend Lifecycle Management Strategies

### Strategy 1: Manual Management (Simplest) ✅ RECOMMENDED

**How it works:**
- User starts backend manually: `npm start` or `node src/index.js`
- User stops backend with `Ctrl+C`
- User restarts manually when needed

**Pros:**
- Simple, no complexity
- User has full control
- Works on all platforms
- Easy to debug (logs in terminal)

**Cons:**
- User must remember to start backend
- No auto-restart on crash
- Terminal must stay open

**Best for:**
- Development
- Users comfortable with command line
- Testing and debugging

---

### Strategy 2: System Service (Production) ✅ RECOMMENDED FOR DEPLOYMENT

**How it works:**
- Backend runs as OS service (systemd on Linux, launchd on macOS, Windows Service)
- Starts automatically on boot
- Restarts automatically on crash
- User controls via system tools

**Linux (systemd):**

```bash
# Create service file: /etc/systemd/system/qwen-proxy.service
[Unit]
Description=Qwen Proxy OpenCode Backend
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/qwen_proxy_opencode/backend/provider-router
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
```

**Control commands:**
```bash
sudo systemctl start qwen-proxy     # Start
sudo systemctl stop qwen-proxy      # Stop
sudo systemctl restart qwen-proxy   # Restart
sudo systemctl enable qwen-proxy    # Auto-start on boot
sudo systemctl status qwen-proxy    # Check status
journalctl -u qwen-proxy -f         # View logs
```

**macOS (launchd):**

```xml
<!-- ~/Library/LaunchAgents/com.qwen.proxy.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.qwen.proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/qwen_proxy_opencode/backend/provider-router/src/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/path/to/qwen_proxy_opencode/backend/provider-router</string>
    <key>StandardOutPath</key>
    <string>/tmp/qwen-proxy.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/qwen-proxy.error.log</string>
</dict>
</plist>
```

**Control commands:**
```bash
launchctl load ~/Library/LaunchAgents/com.qwen.proxy.plist    # Start
launchctl unload ~/Library/LaunchAgents/com.qwen.proxy.plist  # Stop
launchctl start com.qwen.proxy                                 # Start service
launchctl stop com.qwen.proxy                                  # Stop service
```

**Windows (NSSM - Non-Sucking Service Manager):**

```bash
# Install NSSM: choco install nssm

# Install service
nssm install QwenProxy "C:\Program Files\nodejs\node.exe" "C:\path\to\backend\src\index.js"
nssm set QwenProxy AppDirectory "C:\path\to\backend\provider-router"
nssm set QwenProxy AppEnvironmentExtra PORT=3001 HOST=0.0.0.0
nssm set QwenProxy Start SERVICE_AUTO_START

# Control commands
nssm start QwenProxy
nssm stop QwenProxy
nssm restart QwenProxy
nssm remove QwenProxy confirm
```

**Pros:**
- Auto-start on boot
- Auto-restart on crash
- Runs in background (no terminal needed)
- Standard OS management tools
- Production-ready

**Cons:**
- Requires system permissions
- More complex setup
- Different on each OS

**Best for:**
- Production deployments
- End users who want "set and forget"
- Electron apps distributed to non-technical users

---

### Strategy 3: Process Manager (PM2) ⚠️ OPTIONAL

**How it works:**
- Use PM2 to manage Node.js process
- PM2 handles auto-restart, logs, clustering

**Setup:**
```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend/provider-router
pm2 start src/index.js --name qwen-proxy

# Control commands
pm2 start qwen-proxy      # Start
pm2 stop qwen-proxy       # Stop
pm2 restart qwen-proxy    # Restart
pm2 logs qwen-proxy       # View logs
pm2 monit                 # Monitor
pm2 startup               # Auto-start on boot
pm2 save                  # Save current processes
```

**Pros:**
- Cross-platform (works on Windows, macOS, Linux)
- Easy to use
- Built-in logging and monitoring
- Auto-restart on crash
- Can run multiple instances (clustering)

**Cons:**
- Requires PM2 installation
- Another dependency to manage
- Slight overhead

**Best for:**
- Development with auto-restart
- Quick production setup
- Users familiar with PM2

---

### Strategy 4: Electron-Managed Backend (NOT RECOMMENDED) ❌

**How it works:**
- Electron spawns backend as child process
- Electron manages backend lifecycle

**Why NOT recommended:**
- Backend already has SQLite persistence (no need for Electron to manage)
- Complicates Electron responsibilities
- Harder to debug (backend logs mixed with Electron logs)
- Frontend can't work in browser
- Platform-specific issues (WSL on Windows, permissions, paths)
- Backend should be able to run independently

**When it might make sense:**
- If backend was stateless and ephemeral
- If you wanted a truly "double-click to run" desktop app with zero setup
- If backend was tightly coupled to Electron lifecycle

**But in our case:**
- Backend has database (persistent state)
- Backend can serve multiple frontends (browser, Electron, mobile)
- Backend is useful standalone (API server)

---

## Recommended Electron Integration

### Backend Connection Status

**Frontend detects if backend is running:**

```typescript
// frontend/src/hooks/useBackendConnection.ts
import { useQuery } from '@tanstack/react-query';

export function useBackendConnection() {
  const { data: isConnected } = useQuery({
    queryKey: ['backend-connection'],
    queryFn: async () => {
      try {
        const response = await fetch('http://localhost:3001/health', {
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    refetchInterval: 5000, // Check every 5 seconds
    retry: false
  });

  return isConnected ?? false;
}
```

**Show connection status in UI:**

```typescript
// frontend/src/components/layout/ConnectionStatus.tsx
import { useBackendConnection } from '@/hooks/useBackendConnection';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ConnectionStatus() {
  const isConnected = useBackendConnection();

  if (isConnected) {
    return (
      <Alert variant="success" className="mb-4">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Backend Connected</AlertTitle>
        <AlertDescription>
          Server is running on http://localhost:3001
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Backend Disconnected</AlertTitle>
      <AlertDescription>
        The backend server is not running. Start it with:
        <code className="block mt-2 p-2 bg-muted rounded">
          cd backend/provider-router && npm start
        </code>
      </AlertDescription>
    </Alert>
  );
}
```

**Add to HomePage:**

```typescript
// frontend/src/pages/HomePage.tsx
import { ConnectionStatus } from '@/components/layout/ConnectionStatus';

export default function HomePage() {
  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <ConnectionStatus />
        {/* ... rest of home page ... */}
      </div>
    </PageLayout>
  );
}
```

---

## Provider Hot Reload (No Restart Needed)

**When provider config changes, reload the provider:**

```typescript
// frontend/src/hooks/useProviders.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { providerService } from '@/services/provider.service';

export const useReloadProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetch(`http://localhost:3001/v1/providers/${id}/reload`, {
        method: 'POST'
      }).then(res => res.json()),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['providers', id] });
      // Show success toast
      toast.success('Provider reloaded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to reload provider: ${error.message}`);
    }
  });
};
```

**Add reload button to provider form:**

```typescript
// frontend/src/components/providers/ProviderDetailPage.tsx
import { useReloadProvider } from '@/hooks/useProviders';

export function ProviderDetailPage() {
  const { id } = useParams();
  const { data: provider } = useProvider(id);
  const reloadMutation = useReloadProvider();

  const handleReload = () => {
    reloadMutation.mutate(id);
  };

  return (
    <PageLayout>
      <div className="flex justify-between items-center mb-4">
        <h1>Provider: {provider?.name}</h1>
        <Button
          onClick={handleReload}
          disabled={reloadMutation.isLoading}
        >
          {reloadMutation.isLoading ? 'Reloading...' : 'Reload Provider'}
        </Button>
      </div>
      {/* ... provider details ... */}
    </PageLayout>
  );
}
```

---

## Settings Hot Reload (No Restart Needed)

**Most settings are loaded from database per-request:**

```typescript
// Backend automatically picks up settings changes
// No reload needed for:
// - Logging level
// - Request/response logging
// - Database settings (not port/host)
```

**Settings that require restart:**

```typescript
// frontend/src/pages/SettingsPage.tsx
const RESTART_REQUIRED_SETTINGS = ['server.port', 'server.host', 'database.path'];

export function SettingsPage() {
  const [needsRestart, setNeedsRestart] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    // Save setting to database
    updateSetting(key, value);

    // Check if restart required
    if (RESTART_REQUIRED_SETTINGS.includes(key)) {
      setNeedsRestart(true);
    }
  };

  return (
    <PageLayout>
      {needsRestart && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Restart Required</AlertTitle>
          <AlertDescription>
            Some settings require a server restart to take effect.
            {isElectron ? (
              <div className="mt-2">
                <Button onClick={restartBackend}>Restart Backend</Button>
              </div>
            ) : (
              <div className="mt-2">
                Please restart the backend server manually:
                <code className="block mt-2 p-2 bg-muted rounded">
                  # Stop with Ctrl+C, then restart:<br/>
                  npm start
                </code>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      {/* ... settings form ... */}
    </PageLayout>
  );
}
```

---

## Electron Helper Functions (Optional)

**If you DO want Electron to help manage the backend:**

```typescript
// electron/src/services/backend-helper.ts
import { spawn, exec } from 'child_process';
import path from 'path';
import { app } from 'electron';

class BackendHelper {
  private backendPath: string;

  constructor() {
    // Path to backend directory
    this.backendPath = path.join(app.getAppPath(), '..', 'backend', 'provider-router');
  }

  /**
   * Check if backend is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health', {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Start backend (does NOT spawn as child - just runs npm start in background)
   * User can still manage it independently
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32';

      // Run npm start in detached mode (background)
      const child = spawn(
        isWindows ? 'npm.cmd' : 'npm',
        ['start'],
        {
          cwd: this.backendPath,
          detached: true,
          stdio: 'ignore',
          shell: isWindows
        }
      );

      child.unref(); // Allow parent to exit independently

      // Wait a bit for backend to start
      setTimeout(async () => {
        if (await this.isRunning()) {
          resolve();
        } else {
          reject(new Error('Backend failed to start'));
        }
      }, 3000);
    });
  }

  /**
   * Stop backend (sends HTTP request to /shutdown endpoint)
   * Requires adding shutdown endpoint to backend
   */
  async stop(): Promise<void> {
    try {
      await fetch('http://localhost:3001/v1/admin/shutdown', {
        method: 'POST'
      });
    } catch (error) {
      // Backend might already be stopped
      console.warn('Failed to stop backend:', error);
    }
  }

  /**
   * Restart backend
   */
  async restart(): Promise<void> {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    await this.start();
  }

  /**
   * Open backend logs in system viewer
   */
  openLogs(): void {
    const logPath = path.join(this.backendPath, 'logs', 'combined.log');
    const { shell } = require('electron');
    shell.openPath(logPath);
  }
}

export const backendHelper = new BackendHelper();
```

**Expose to frontend via IPC:**

```typescript
// electron/preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing window/system APIs ...

  backend: {
    isRunning: () => ipcRenderer.invoke('backend:is-running'),
    start: () => ipcRenderer.invoke('backend:start'),
    stop: () => ipcRenderer.invoke('backend:stop'),
    restart: () => ipcRenderer.invoke('backend:restart'),
    openLogs: () => ipcRenderer.send('backend:open-logs')
  }
});
```

**Add handlers in main process:**

```typescript
// electron/src/main.ts
import { backendHelper } from './services/backend-helper';

ipcMain.handle('backend:is-running', () => backendHelper.isRunning());
ipcMain.handle('backend:start', () => backendHelper.start());
ipcMain.handle('backend:stop', () => backendHelper.stop());
ipcMain.handle('backend:restart', () => backendHelper.restart());
ipcMain.on('backend:open-logs', () => backendHelper.openLogs());
```

**Use in frontend:**

```typescript
// frontend/src/components/layout/ConnectionStatus.tsx
export function ConnectionStatus() {
  const isConnected = useBackendConnection();
  const [isRestarting, setIsRestarting] = useState(false);
  const isElectron = window.electronAPI !== undefined;

  const handleStart = async () => {
    setIsRestarting(true);
    try {
      await window.electronAPI.backend.start();
      toast.success('Backend started successfully');
    } catch (error) {
      toast.error('Failed to start backend');
    } finally {
      setIsRestarting(false);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await window.electronAPI.backend.restart();
      toast.success('Backend restarted successfully');
    } catch (error) {
      toast.error('Failed to restart backend');
    } finally {
      setIsRestarting(false);
    }
  };

  if (!isConnected) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Backend Disconnected</AlertTitle>
        <AlertDescription>
          {isElectron ? (
            <div className="mt-2 space-x-2">
              <Button onClick={handleStart} disabled={isRestarting}>
                Start Backend
              </Button>
              <Button variant="outline" onClick={() => window.electronAPI.backend.openLogs()}>
                View Logs
              </Button>
            </div>
          ) : (
            <code className="block mt-2 p-2 bg-muted rounded">
              cd backend/provider-router && npm start
            </code>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="success">
      <CheckCircle className="h-4 w-4" />
      <AlertTitle>Backend Connected</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Server is running on http://localhost:3001</span>
        {isElectron && (
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestart}
              disabled={isRestarting}
            >
              {isRestarting ? 'Restarting...' : 'Restart'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.electronAPI.backend.openLogs()}
            >
              View Logs
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

---

## Summary: Recommended Approach

### For Development
**Manual Management** (Strategy 1)
- User starts backend: `npm start`
- User stops with `Ctrl+C`
- Simple, easy to debug

### For Production/Distribution
**System Service** (Strategy 2) OR **PM2** (Strategy 3)
- Auto-start on boot
- Auto-restart on crash
- Background running

### Electron's Role
**Helper, Not Manager**
- Show connection status
- Optionally provide start/restart buttons
- But backend can run independently
- Frontend works in browser AND Electron

### Configuration Hot Reload
**Most changes don't need restart:**
- Provider config: Use `POST /v1/providers/:id/reload`
- Settings: Auto-loaded from database per-request
- Only port/host/database path require full restart

---

## Next Steps

1. **Implement Backend Connection Status** (see `useBackendConnection` hook above)
2. **Add Connection Status UI** to HomePage
3. **Add Provider Reload Button** to provider detail pages
4. **Optional: Add Electron Backend Helper** for one-click start/restart
5. **Document deployment** options (systemd, launchd, PM2, NSSM)

This approach keeps Electron simple while giving users flexibility in how they run the backend.
