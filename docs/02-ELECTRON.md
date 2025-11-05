# Qwen Proxy - Electron Desktop Application

A beautiful desktop application for managing your Qwen OpenAI-compatible proxy server.

## Features

### 🎯 Core Features
- **Beautiful Admin Dashboard** - Modern dark-themed UI for managing the proxy
- **System Tray Integration** - Runs in the background, accessible from system tray
- **Embedded Browser Login** - No need to manually copy cookies from DevTools
- **Automatic Cookie Extraction** - Seamlessly extracts Qwen credentials after login
- **Background Proxy Service** - Express server runs as a background service
- **Token Expiration Monitoring** - Automatic hourly checks with notifications
- **One-Click Controls** - Start/stop proxy server with a single click
- **Cross-Platform** - Works on Windows, macOS, and Linux

### 🔐 Security Features
- Context isolation enabled
- No Node.js integration in renderer
- Secure IPC communication via contextBridge
- Credentials stored in persistent session partition

## Installation

### Development Mode

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application:
   ```bash
   npm run electron        # Production mode
   npm run electron:dev    # Development mode (with DevTools)
   ```

### Building Distributables

Build for your platform:

```bash
# Windows
npm run build:win       # Creates .exe installer

# macOS
npm run build:mac       # Creates .dmg installer

# Linux
npm run build:linux     # Creates .AppImage
```

Output will be in the `dist/` directory.

## Usage

### First Time Setup

1. **Launch the Application**
   - Run `npm run electron` or double-click the built executable
   - The app will appear in your system tray

2. **Login to Qwen**
   - Click the "Login to Qwen" button
   - An embedded browser window will open to https://chat.qwen.ai
   - Login with your Qwen account credentials
   - The app will automatically extract your session cookies
   - You'll see a notification when credentials are extracted

3. **Start the Proxy**
   - Once logged in, click "Start Proxy"
   - The proxy server will start on port 3000
   - You'll see the status change to "Running ✓"

4. **Use the Proxy**
   - Click "Copy URL" to copy the endpoint URL
   - Use `http://localhost:3000/v1` as your OpenAI base URL
   - See the main README.md for usage examples

### System Tray Menu

Right-click the tray icon to access:
- **Show Dashboard** - Open the main window
- **Login to Qwen** - Open login window
- **Start/Stop Proxy** - Toggle the proxy server
- **Quit** - Exit the application

### Dashboard Overview

**Authentication Card**
- Token Status: Shows if you're logged in
- Expires: When your session expires
- Time Left: Hours/days remaining
- Login Button: Opens embedded login window
- Refresh Button: Manually refresh credentials

**Proxy Server Card**
- Status: Running or Stopped
- Endpoint URL: `http://localhost:3000/v1`
- Start/Stop Button: Toggle the proxy
- Copy URL Button: Copy endpoint to clipboard

**Quick Start Guide**
- Step-by-step instructions
- Code example with syntax highlighting
- Copy button for code snippet

## Architecture

### File Structure

```
qwen_proxy_opencode/
├── electron/
│   ├── src/
│   │   ├── main.ts                       # Main process (Node.js + TypeScript)
│   │   ├── ipc/
│   │   │   └── settings-handlers.ts      # [UNUSED] Settings IPC handlers (not called by frontend)
│   │   ├── services/
│   │   │   ├── backend-manager.ts        # Backend process lifecycle manager (USED)
│   │   │   └── settings-manager.ts       # [UNUSED] Settings coordination (not used by frontend)
│   │   └── utils/
│   │       └── logger.ts                 # Logging utility
│   ├── dist/
│   │   └── main.js                       # Compiled main process
│   ├── preload.js                        # IPC bridge (secure contextBridge)
│   ├── package.json                      # Electron dependencies
│   ├── tsconfig.json                     # TypeScript configuration
│   └── assets/
│       └── icons/
│           └── png/                      # Platform-specific icons
│               └── 16x16.png             # Tray icon
├── frontend/                             # React/Vite UI (served by Electron)
│   ├── dist/                             # Production build
│   └── src/                              # React components
├── backend/provider-router/              # Express proxy server
│   └── src/
│       └── index.js                      # Backend entry point
└── .env                                  # Environment variables (auto-managed)
```

### Process Communication

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Process (Node.js/TypeScript)       │
│                                                              │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────┐ │
│  │   main.ts   │──▶│ Backend Manager  │──▶│ Child Process│ │
│  │             │   │  (Singleton)     │   │ (Backend)    │ │
│  │  - Window   │   │  - Start/Stop    │   │              │ │
│  │  - Cookies  │   │  - Restart       │   │  Node.js     │ │
│  │  - Tray     │   │  - Credentials   │   │  Express     │ │
│  └──────┬──────┘   └──────────────────┘   └───────┬──────┘ │
│         │                                          │        │
│         │                                          │        │
│         │          [UNUSED COMPONENTS]             │        │
│         │          ┌──────────────────┐            │        │
│         │          │ Settings Manager │            │        │
│         │          │  [NOT CALLED]    │            │        │
│         │          └──────────────────┘            │        │
│         │                                          │        │
│         ┌──────────────────────────────────────────┐        │
│         │       IPC Handlers                       │        │
│         │  - settings-handlers.ts [UNUSED]         │        │
│         │  - Credential handlers                   │        │
│         │  - Proxy control handlers                │        │
│         │  - Window control handlers               │        │
│         └──────────────────────────────────────────┘        │
└────────────────────────────┬─────────────────────────────────┘
                             │ IPC (secure)
                             │
                  ┌──────────▼─────────────┐
                  │   Preload Script       │
                  │   - preload.js         │
                  │   - contextBridge API  │
                  │   - Event listeners    │
                  │   - Security layer     │
                  │   [Settings IPC = UNUSED]
                  └──────────┬─────────────┘
                             │
                  ┌──────────▼─────────────┐
                  │  Renderer Process      │
                  │  (React/Vite)          │
                  │  - Frontend UI         │
                  │  - State management    │
                  │  - User interactions   │
                  │                        │
                  │  Settings Management:  │
                  │  Direct HTTP to Backend│
                  │  (NOT via IPC)         │
                  └──────────┬─────────────┘
                             │
                             │ Direct HTTP
                             │ (fetch API)
                             ▼
                  ┌────────────────────────┐
                  │  Backend REST API      │
                  │  localhost:3001        │
                  │  /v1/settings          │
                  └────────────────────────┘
```

### Key Components

**Main Process (`electron/src/main.ts`)**

Core Functions:
- `createMainWindow()` - Creates frameless window, loads React app (dev: Vite server, prod: built files)
- `createLoginWindow()` - Opens embedded Qwen login with persistent session
- `extractQwenCookies()` - Extracts cookies from persist:qwen session partition
- `decodeJWT(token)` - Decodes JWT token to check expiration
- `startProxyServer(credentials)` - Starts backend via BackendManager with settings
- `stopProxyServer()` - Stops backend gracefully with 5s timeout
- `updateEnvFile(credentials)` - Persists credentials to .env file
- `createTray()` - Creates system tray with platform-specific icons
- `updateTrayMenu()` - Updates tray menu based on backend running state
- `updateUICredentials(credentials)` - Sends credentials to renderer via IPC

Window Management:
- Custom title bar (frameless window)
- Minimize to tray instead of taskbar
- Close to tray (doesn't quit app)
- Single instance lock (prevents multiple instances)

**Backend Manager (`electron/src/services/backend-manager.ts`)**

Singleton class managing backend process lifecycle:

Methods:
- `getInstance()` - Get singleton instance
- `setCredentials(credentials)` - Store credentials for backend
- `start(settings, credentials)` - Spawn backend process with WSL/Node.js
- `stop()` - Gracefully stop backend (SIGTERM, 5s timeout, then SIGKILL)
- `restart(newSettings, credentials)` - Stop and restart with new settings
- `isBackendRunning()` - Check if backend process is running
- `getPort()` - Get current backend port
- `getSettings()` - Get current server settings

Process Management:
- Spawns backend using WSL bash with full Node.js path
- Converts Windows paths to WSL paths automatically
- Sets environment variables (QWEN_TOKEN, QWEN_COOKIES, PORT, HOST)
- Captures stdout/stderr for logging
- Handles process errors and exit events

**[UNUSED/REDUNDANT] Settings Manager (`electron/src/services/settings-manager.ts`)**

> **NOTE:** This component is NOT used by the frontend. Settings are managed via direct HTTP calls to the backend REST API (`http://localhost:3001/v1/settings`). The Settings page uses `frontend/src/services/settings-api.service.ts` instead.

~~Singleton class coordinating settings with backend API:~~

~~Methods:~~
~~- `getInstance()` - Get singleton instance~~
~~- `setBackendPort(port)` - Update backend API port for HTTP calls~~
~~- `loadSettings()` - Fetch settings from backend HTTP API~~
~~- `getSettings()` - Get cached settings or load if not cached~~
~~- `getServerSettings()` - Get server-specific settings (port, host, timeout)~~
~~- `updateSetting(key, value)` - Update single setting via HTTP API~~
~~- `bulkUpdateSettings(settings)` - Update multiple settings at once~~
~~- `validateSettings(settings)` - Validate settings before applying~~
~~- `clearCache()` - Clear cached settings~~
~~- `refreshSettings()` - Clear cache and reload from backend~~
~~- `getDefaultSettings()` - Return default settings if backend unavailable~~

**[UNUSED/REDUNDANT] Settings Handlers (`electron/src/ipc/settings-handlers.ts`)**

> **NOTE:** These IPC handlers are NOT called by the frontend. The Settings page makes direct HTTP requests to the backend REST API instead of using IPC.

~~IPC handlers for settings communication:~~

~~Handlers:~~
~~- `settings:get-all` - Get all settings from backend~~
~~- `settings:update` - Update single setting with validation~~
~~- `settings:bulk-update` - Bulk update settings with validation~~
~~- `settings:restart-server` - Restart backend with new settings~~
~~- `settings:refresh` - Refresh settings from backend~~

~~Features:~~
~~- Validates settings before applying~~
~~- Returns requiresRestart flag for critical settings~~
~~- Sends server-restarted event to all windows~~
~~- Handles errors gracefully with detailed error messages~~

**Logger (`electron/src/utils/logger.ts`)**

Simple logging utility:
- `logger.info(message, data?)` - Info level logs
- `logger.warn(message, data?)` - Warning level logs
- `logger.error(message, data?)` - Error level logs
- `logger.debug(message, data?)` - Debug logs (development only)

**Renderer Process (React/Vite Frontend)**

The frontend is a separate React application served by Electron:
- Development: Loaded from Vite dev server (http://localhost:5173)
- Production: Loaded from built files (frontend/dist/index.html)
- Communicates with main process via window.electronAPI
- Uses IPC event listeners for real-time updates

### IPC API

The IPC API is exposed through `window.electronAPI` via the preload script using contextBridge.

**Main → Renderer (Events)**

Events sent from main process to renderer:
- `credentials-updated` - Fired when credentials change (login, refresh, expiration check)
- `proxy-status-changed` - Fired when backend starts/stops
- ~~`settings-changed` - [UNUSED] Fired when settings are updated~~
- ~~`server-restarted` - [UNUSED] Fired when backend is restarted with new settings~~

**Renderer → Main (Invoke Handlers)**

Async handlers that return promises:

Credentials:
- `get-credentials` - Get current credentials from session
  - Returns: `{ cookieString, umidToken, hasToken, tokenExpiry }`
- `refresh-credentials` - Force refresh credentials from session
  - Returns: Same as get-credentials
- `open-login` - Open Qwen login window
  - Returns: void

Proxy Control:
- `start-proxy` - Start the backend server
  - Returns: `{ success, message, port? }`
- `stop-proxy` - Stop the backend server
  - Returns: `{ success, message }`
- `get-proxy-status` - Get current backend status
  - Returns: `{ running: boolean }`

**[UNUSED] Settings IPC Methods:**

> **NOTE:** These methods are defined in preload.js but are NOT used by the frontend. The Settings page makes direct HTTP requests to `http://localhost:3001/v1/settings` instead.

~~- `settings:get-all` - Get all settings from backend~~
~~  - Returns: `{ success, settings? }`~~
~~- `settings:update` - Update single setting~~
~~  - Args: `(key: string, value: any)`~~
~~  - Returns: `{ success, requiresRestart, message? }`~~
~~- `settings:bulk-update` - Update multiple settings~~
~~  - Args: `(settings: Record<string, any>)`~~
~~  - Returns: `{ success, requiresRestart, message? }`~~
~~- `settings:restart-server` - Restart backend with new settings~~
~~  - Args: `(options?: { newSettings?: { port?, host?, timeout? } })`~~
~~  - Returns: `{ success, message, requiresRestart? }`~~
~~- `settings:refresh` - Refresh settings from backend~~
~~  - Returns: `{ success, settings? }`~~

Utilities:
- `copy-to-clipboard` - Copy text to clipboard
  - Args: `(text: string)`
  - Returns: `{ success: boolean }`

**Renderer → Main (Send Events)**

One-way events (no return value):

Window Controls:
- `window:minimize` - Minimize window
- `window:maximize` - Toggle maximize/unmaximize window
- `window:close` - Close window (will hide to tray)

**Event Listener API**

The preload script provides event listener helpers that return cleanup functions:

```javascript
// Listen for credentials updates
const unsubscribe = window.electronAPI.onCredentialsUpdated((credentials) => {
  console.log('Credentials updated:', credentials);
});

// Listen for proxy status changes
const cleanup = window.electronAPI.onProxyStatusChanged((status) => {
  console.log('Proxy status:', status.running);
});

// [UNUSED] Listen for settings changes
// NOTE: These event listeners are NOT used by the Settings page
// const unsub = window.electronAPI.onSettingsChanged((settings) => {
//   console.log('Settings changed:', settings);
// });

// [UNUSED] Listen for server restart
// const unsubRestart = window.electronAPI.onServerRestarted((info) => {
//   console.log('Server restarted on:', info.port, info.host);
// });

// Clean up when component unmounts
unsubscribe();
cleanup();
```

## Features In Detail

### Backend Process Management

The Electron app manages the backend Node.js server as a child process using the BackendManager singleton.

**Architecture:**
- Backend runs as a separate child process spawned by Electron
- Process is managed via WSL bash commands (Windows/WSL environment)
- Credentials are passed as environment variables (QWEN_TOKEN, QWEN_COOKIES)
- Server settings (port, host, timeout) are configurable
- Graceful shutdown with SIGTERM (5s timeout) then SIGKILL

**Lifecycle:**
1. User clicks "Start Proxy"
2. Main process gets credentials from session
3. BackendManager spawns child process with settings
4. Process stdout/stderr captured for logging
5. Backend starts Express server on configured port
6. User clicks "Stop Proxy"
7. BackendManager sends SIGTERM to child process
8. If not stopped in 5s, sends SIGKILL
9. Process exits, cleanup handlers called

**Restart Functionality:**
- Settings changes can trigger backend restart
- Restart flow: Stop → Wait 1s → Start with new settings
- All windows notified via 'server-restarted' event
- Frontend can update UI with new port/host

### Settings Management

> **CRITICAL ARCHITECTURAL NOTE:**
>
> Settings are managed via **DIRECT HTTP requests** to the backend REST API (`http://localhost:3001/v1/settings`).
>
> The frontend does **NOT** use Electron IPC for settings operations.
>
> **The following are UNUSED and redundant:**
> - `electron/src/ipc/settings-handlers.ts` - Settings IPC handlers
> - `electron/src/services/settings-manager.ts` - Settings Manager service
> - Settings-related methods in `electron/preload.js`
> - Settings methods in `frontend/src/services/electron-ipc.service.ts`
>
> **The frontend uses:**
> - `frontend/src/services/settings-api.service.ts` (direct HTTP fetch to backend)

**Architecture:**

The Settings page in the frontend communicates directly with the backend REST API:

```
Frontend Settings Page
   └─> settings-api.service.ts (HTTP fetch)
         └─> Backend REST API (http://localhost:3001/v1/settings)
               └─> Persistent storage
```

**Actual Implementation:**

1. **Frontend Layer (`frontend/src/services/settings-api.service.ts`)**
   - Makes direct HTTP fetch calls to backend
   - No IPC communication
   - Handles all CRUD operations via REST API

2. **Backend API Layer (Express)**
   - Stores settings persistently
   - Exposes REST API at `/v1/settings`
   - Returns `requiresRestart` flag for critical settings
   - Handles settings validation and persistence

**Settings Flow:**

Get Settings:
1. Frontend calls `settingsApiService.getSettings()`
2. Direct HTTP GET to `http://localhost:3001/v1/settings`
3. Backend returns settings JSON
4. Frontend updates UI

Update Settings:
1. Frontend calls `settingsApiService.updateSetting(key, value)`
2. Direct HTTP PUT to `http://localhost:3001/v1/settings`
3. Backend validates and saves settings
4. Backend returns success + requiresRestart flag
5. If requiresRestart, frontend prompts user to restart backend
6. User confirms, frontend triggers backend restart

**Settings Categories:**

Server Settings (require restart):
- `server.port` - Backend listen port (1-65535)
- `server.host` - Backend listen host (e.g., 0.0.0.0, 127.0.0.1)
- `server.timeout` - Request timeout in milliseconds

Logging Settings:
- `logging.level` - Log level (debug/info/warn/error)
- `logging.logRequests` - Log incoming requests
- `logging.logResponses` - Log outgoing responses

System Settings:
- `system.autoStart` - Auto-start backend on app launch
- `system.minimizeToTray` - Minimize to tray instead of taskbar
- `system.checkUpdates` - Check for app updates

---

**[UNUSED/REDUNDANT] IPC-Based Settings Architecture:**

> **NOTE:** The following IPC-based architecture was implemented but is NOT used. It remains in the codebase but is not called by the frontend.

~~**Layer 1: Settings Manager (Electron)**~~
~~- Loads settings from backend HTTP API (`/v1/settings`)~~
~~- Caches settings in memory for fast access~~
~~- Validates settings before sending to backend~~
~~- Provides default settings if backend unavailable~~
~~- Communicates with backend via HTTP (axios)~~

~~Get Settings:~~
~~1. Frontend calls `window.electronAPI.settings.getAll()`~~
~~2. IPC handler calls SettingsManager.getSettings()~~
~~3. SettingsManager checks cache, or loads from backend API~~
~~4. Settings returned to frontend~~

~~Update Settings:~~
~~1. Frontend calls `window.electronAPI.settings.update(key, value)`~~
~~2. IPC handler validates settings via SettingsManager~~
~~3. SettingsManager sends HTTP PUT to backend API~~
~~4. Backend returns success + requiresRestart flag~~
~~5. If requiresRestart, frontend prompts user to restart~~
~~6. User confirms, frontend calls `settings:restart-server`~~
~~7. BackendManager restarts with new settings~~
~~8. All windows receive 'server-restarted' event~~

### Automatic Cookie Extraction

When you login via the embedded browser:
1. Browser loads `https://chat.qwen.ai`
2. You login with your credentials
3. On navigation, the app waits 2 seconds
4. Cookies are extracted from `persist:qwen` session
5. JWT token is decoded to get expiration
6. Credentials are sent to renderer process
7. Credentials are persisted to `.env` file
8. UI is updated with session info

### Token Expiration Monitoring

Every hour, the app:
1. Extracts current cookies from session
2. Decodes JWT to check expiration
3. If less than 24 hours remain, shows warning notification
4. If expired, shows expired notification and stops proxy
5. Updates UI with current status

### App Startup Behavior

On app launch:
1. Create main window and system tray
2. Register IPC handlers (credentials, proxy control, window controls)
3. Wait for user to manually start backend

Note:
- Backend does NOT auto-start on launch to prevent starting without valid credentials
- User must click "Start Proxy" button after logging in
- Settings are managed by frontend via direct HTTP to backend API

### Background Service

The app runs in the background:
- Clicking X hides the window (doesn't quit)
- App continues running in system tray
- Proxy server keeps running
- Only "Quit" from tray menu exits completely

## Development

### TypeScript Compilation

The Electron main process is written in TypeScript and must be compiled before running:

```bash
cd electron
npm run build    # Compiles src/*.ts to dist/*.js
```

TypeScript files:
- `src/main.ts` → `dist/main.js` (entry point)
- `src/ipc/settings-handlers.ts` → `dist/ipc/settings-handlers.js` [UNUSED]
- `src/services/backend-manager.ts` → `dist/services/backend-manager.js` (USED)
- `src/services/settings-manager.ts` → `dist/services/settings-manager.js` [UNUSED]
- `src/utils/logger.ts` → `dist/utils/logger.js` (USED)

TypeScript Configuration (`tsconfig.json`):
- Target: ES2020
- Module: CommonJS
- Output: dist/
- Source maps enabled for debugging

### Running in Development

**Option 1: Manual Build + Run**
```bash
cd electron
npm run build         # Compile TypeScript
npm run dev          # Run Electron with NODE_ENV=development
```

**Option 2: Watch Mode (Recommended)**
```bash
cd electron
npm run build -- --watch  # Auto-recompile on changes
# In another terminal:
npm run dev              # Run Electron
```

Development mode features:
- DevTools automatically opened
- Loads React app from Vite dev server (http://localhost:5173)
- Console messages logged to terminal
- Hot reload for frontend changes
- Manual restart required for Electron main process changes

### Regenerating Icons

If you modify the icon:

```bash
npm run icons
```

This regenerates all PNG sizes from `icon.svg`.

### Validating Structure

Before testing or building:

```bash
node scripts/validate-electron.js
```

This checks that all required files exist.

### Debugging

**Main Process (Electron)**
- Use `logger.info()`, `logger.warn()`, `logger.error()` in TypeScript files
- View output in terminal where you ran `npm run dev`
- All main process logs prefixed with [INFO], [WARN], [ERROR], [DEBUG]
- Check `electron/dist/` for compiled JavaScript if needed

**Backend Process (Node.js)**
- Backend stdout/stderr captured by BackendManager
- Logs prefixed with [Backend] or [Backend Error]
- Visible in same terminal as main process
- Backend process runs in WSL environment

**Renderer Process (React)**
- Use DevTools (F12 or Ctrl+Shift+I)
- Add `console.log()` in React components
- View in DevTools console
- React DevTools extension recommended

**IPC Communication**
- Main process logs show up in terminal
- Renderer logs show up in DevTools console
- Use `console.log('[Preload]', ...)` in preload.js for bridge debugging
- Check both terminals when debugging IPC issues

**Settings Debugging**
- Settings are managed via direct HTTP fetch in `frontend/src/services/settings-api.service.ts`
- Check browser DevTools Network tab for HTTP requests to `/v1/settings`
- Check backend logs for settings API responses
- No IPC communication for settings (IPC handlers are unused)

**Backend Manager Debugging**
- Check if backend is running: `backendManager.isBackendRunning()`
- View current settings: `backendManager.getSettings()`
- Check process spawn events in logs
- WSL path conversion logged for debugging

## Troubleshooting

### App Won't Start

**Error: Cannot find module 'electron'**
```bash
npm install
```

**Port 3000 already in use**
```bash
npx kill-port 3000
```

### Login Window Issues

**Login window blank**
- Check internet connection
- Try refreshing the login window
- Check if chat.qwen.ai is accessible

**Cookies not extracted**
- Make sure you successfully logged in
- Check that you see the Qwen chat interface
- Try closing and reopening login window

### Proxy Won't Start

**"Not logged in" error**
- Click "Login to Qwen" first
- Make sure credentials are extracted
- Check token hasn't expired

**Port already in use**
```bash
npx kill-port 3000
npm run electron
```

**Proxy starts but immediately stops**
- Check terminal for error messages
- Verify .env file has correct credentials
- Try refreshing credentials

### Token Expired

**Token shows as expired**
- Click "Login to Qwen"
- Login again with your credentials
- New token will be automatically extracted

**Proxy stops due to expiration**
- You'll get a notification
- Simply login again
- Proxy can be restarted after login

## Platform-Specific Notes

### Windows

- Icon: `electron/assets/icon.ico` (auto-generated by electron-builder)
- Installer: NSIS-based setup.exe
- Installation location: `C:\Program Files\Qwen Proxy\`
- System tray works natively

### macOS

- Icon: `electron/assets/icon.icns` (auto-generated)
- Package: DMG disk image
- Installation: Drag to Applications folder
- May need to allow in Security & Privacy settings

### Linux

- Icon: `electron/assets/icon.png`
- Package: AppImage (portable, no installation needed)
- Make executable: `chmod +x QwenProxy-*.AppImage`
- Run: `./QwenProxy-*.AppImage`

## Configuration

### Environment Variables

The app uses these environment variables (auto-managed):

```bash
QWEN_TOKEN=<bx-umidtoken value>
QWEN_COOKIES=<full cookie string>
PORT=3000
```

These are automatically updated when you login.

### Persistent Storage

- Cookies: Stored in Electron session (partition: `persist:qwen`)
- Credentials: Saved to `.env` file
- Window state: Managed by Electron

## Security Considerations

### What's Stored
- Qwen session cookies (in Electron session)
- JWT token (in .env file)
- No passwords are stored

### Network Access
- Login window: Only accesses chat.qwen.ai
- Proxy: Only communicates with Qwen API
- No telemetry or analytics

### Permissions
- No camera access
- No microphone access
- Only network access for Qwen API

## Building for Distribution

### Prerequisites

**All Platforms**
- Node.js 16+ installed
- Dependencies installed (`npm install`)

**Windows (for .ico generation)**
- electron-builder handles it automatically

**macOS (for .icns generation)**
- electron-builder handles it automatically

**Linux**
- No special requirements

### Build Process

1. Update version in package.json
2. Regenerate icons if needed: `npm run icons`
3. Validate structure: `node scripts/validate-electron.js`
4. Build: `npm run build:win|mac|linux`
5. Test the generated installer
6. Distribute from `dist/` folder

### Build Output

**Windows**
- `dist/Qwen Proxy Setup 1.0.0.exe` - Installer
- `dist/win-unpacked/` - Unpacked files

**macOS**
- `dist/Qwen Proxy-1.0.0.dmg` - Disk image
- `dist/mac/` - App bundle

**Linux**
- `dist/Qwen Proxy-1.0.0.AppImage` - Portable executable
- `dist/linux-unpacked/` - Unpacked files

## Technical Implementation Details

### Singleton Pattern

Both BackendManager and SettingsManager use the singleton pattern:

```typescript
export class BackendManager {
  private static instance: BackendManager | null = null;

  private constructor() {}

  static getInstance(): BackendManager {
    if (!BackendManager.instance) {
      BackendManager.instance = new BackendManager();
    }
    return BackendManager.instance;
  }
}

export const backendManager = BackendManager.getInstance();
```

Benefits:
- Single instance across entire app
- Shared state (running status, credentials, settings)
- Prevents multiple backend processes
- Centralized lifecycle management

### WSL Integration

The backend runs in WSL (Windows Subsystem for Linux) environment:

**Path Conversion:**
```typescript
const backendPath = path.join(__dirname, '../../../backend/provider-router/src/index.js');
// Convert: D:\Projects\qwen_proxy_opencode\backend\...
// To WSL:  /mnt/d/Projects/qwen_proxy_opencode/backend/...
const wslPath = backendPath.replace(/^([A-Z]):\\/, (_match, drive) =>
  `/mnt/${drive.toLowerCase()}/`
).replace(/\\/g, '/');
```

**Process Spawn:**
```typescript
spawn('wsl', [
  'bash', '-c',
  `cd "${wslDir}" && QWEN_TOKEN="${token}" QWEN_COOKIES="${cookies}"
   PORT="${port}" HOST="${host}" ${nodeFullPath} "${wslPath}"`
], {
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true
});
```

This allows:
- Running Node.js backend in Linux environment
- Using Linux-specific dependencies
- Consistent behavior across platforms
- Better process isolation

### Frameless Window

The main window uses a custom title bar:

```typescript
new BrowserWindow({
  frame: false,  // No default title bar
  webPreferences: {
    preload: path.join(__dirname, '../preload.js'),
    nodeIntegration: false,
    contextIsolation: true
  }
});
```

Window controls are implemented via IPC:
- `window:minimize` - Hide window to tray
- `window:maximize` - Toggle maximize state
- `window:close` - Hide to tray (not quit)

### Session Partitioning

The login window uses a persistent session partition:

```typescript
new BrowserWindow({
  webPreferences: {
    partition: 'persist:qwen',  // Separate cookie storage
  }
});
```

Benefits:
- Cookies isolated from main session
- Persistent across app restarts
- Can be cleared independently
- Security: main window can't access login cookies directly

### Credentials Security

**Storage:**
- Cookies stored in Electron session partition (encrypted)
- Tokens persisted to .env file (plain text, but local only)
- No passwords stored

**Access:**
- Main process extracts cookies via session.cookies.get()
- Credentials passed to backend as environment variables
- Frontend never directly accesses raw credentials
- IPC provides controlled access

**Best Practices:**
- .env file should be .gitignored
- Session data encrypted by Electron
- No network transmission of raw credentials
- Tokens have expiration (checked hourly)

## Changelog

### v2.0.0 (Current)
- **NEW:** TypeScript migration for main process
- **NEW:** Backend process lifecycle manager (singleton)
- **NEW:** Settings management system with HTTP API
- **NEW:** Settings IPC handlers with validation
- **NEW:** Server restart functionality
- **NEW:** Structured logging utility
- **NEW:** Frameless window with custom title bar
- **NEW:** Window control IPC handlers
- **NEW:** Event listener cleanup functions in preload
- **NEW:** Settings caching and refresh
- **NEW:** Graceful backend shutdown (SIGTERM/SIGKILL)
- **NEW:** WSL integration for backend process
- **IMPROVED:** Modular architecture (services, IPC, utils)
- **IMPROVED:** Better error handling and logging
- **IMPROVED:** React/Vite frontend integration
- **CHANGED:** Backend no longer auto-starts on launch

### v1.0.0 (Initial Release)
- Admin dashboard with modern UI
- System tray integration
- Embedded login browser
- Automatic cookie extraction
- Background proxy service
- Token expiration monitoring
- Cross-platform builds

## Quick Reference for Developers

### Key Files and Their Purpose

| File | Purpose | Language | Status |
|------|---------|----------|--------|
| `electron/src/main.ts` | Main process entry point | TypeScript | USED |
| `electron/src/services/backend-manager.ts` | Backend process lifecycle | TypeScript | USED |
| `electron/src/services/settings-manager.ts` | Settings coordination | TypeScript | UNUSED |
| `electron/src/ipc/settings-handlers.ts` | Settings IPC handlers | TypeScript | UNUSED |
| `electron/src/utils/logger.ts` | Logging utility | TypeScript | USED |
| `electron/preload.js` | IPC bridge (contextBridge) | JavaScript | USED (except settings methods) |
| `electron/dist/main.js` | Compiled main process | JavaScript | USED |
| `frontend/src/services/settings-api.service.ts` | Settings HTTP client | TypeScript | USED |
| `frontend/src/services/electron-ipc.service.ts` | IPC wrapper | TypeScript | USED (except settings methods) |
| `frontend/src/` | React UI components | TypeScript/JSX | USED |
| `backend/provider-router/src/index.js` | Express backend server | JavaScript | USED |

### Common Development Tasks

**Add a new IPC handler:**
1. Add handler in `electron/src/main.ts` or create new file in `ipc/`
2. Add method in `preload.js` contextBridge
3. Rebuild TypeScript: `cd electron && npm run build`
4. Use in frontend: `window.electronAPI.yourMethod()`

**Add a new setting:**
1. Update backend settings API to include the new setting
2. Update `frontend/src/services/settings-api.service.ts` types if needed
3. Access via direct HTTP: `settingsApiService.getSettings()` or `settingsApiService.updateSetting()`
4. NO IPC communication needed for settings

**Add a new service:**
1. Create file in `electron/src/services/`
2. Use singleton pattern if needed
3. Export instance: `export const yourService = YourService.getInstance()`
4. Import in main.ts
5. Rebuild TypeScript

**Debug IPC communication:**
1. Add logs in handler: `logger.info('IPC: handler called', { args })`
2. Add logs in preload: `console.log('[Preload] method called')`
3. Add logs in frontend: `console.log('[Frontend] calling IPC')`
4. Check terminal (main) and DevTools (renderer)

**Update backend process:**
1. Backend code changes don't require Electron rebuild
2. Restart backend via Settings or stop/start manually
3. Check logs in terminal (prefixed with [Backend])

### Architecture Patterns

**Main Process:**
- TypeScript with strict mode
- Singleton pattern for services
- Async/await for IPC handlers
- Error handling with try/catch
- Structured logging with logger utility

**IPC Communication:**
- contextBridge for security
- ipcRenderer.invoke() for async calls
- ipcRenderer.on() for events
- Return cleanup functions for event listeners

**Backend Management:**
- Child process spawning
- Environment variable injection
- Graceful shutdown (SIGTERM → SIGKILL)
- WSL path conversion for Windows

**Settings Management:**
- Direct HTTP fetch from frontend to backend REST API
- No IPC communication
- Backend handles validation and persistence
- requiresRestart flag handling in backend API response

### Environment Variables

Backend process receives:
- `QWEN_TOKEN` - bx-umidtoken cookie value
- `QWEN_COOKIES` - Full cookie string
- `PORT` - Backend listen port
- `HOST` - Backend listen host
- `NODE_ENV` - development/production

Electron receives:
- `NODE_ENV` - Determines dev server vs built files

### Important Notes

1. **TypeScript compilation required:** Always run `npm run build` in electron/ after TypeScript changes
2. **Backend path hardcoded:** Node.js path is hardcoded in BackendManager for nvm setup
3. **WSL required:** Backend runs in WSL on Windows
4. **Frameless window:** Custom title bar requires window control IPC
5. **Settings via HTTP:** Settings are managed via direct HTTP to backend REST API, NOT through IPC
6. **Settings require backend:** Settings API requires backend to be running (HTTP endpoint must be accessible)
7. **No auto-start:** User must manually start backend after login
8. **Session partition:** Login cookies isolated in persist:qwen partition
9. **Single instance:** App prevents multiple instances via lock
10. **Unused IPC code:** Settings IPC handlers and Settings Manager exist but are not called by frontend

## License

ISC

## Support

For issues or questions, please refer to the main README.md file.
