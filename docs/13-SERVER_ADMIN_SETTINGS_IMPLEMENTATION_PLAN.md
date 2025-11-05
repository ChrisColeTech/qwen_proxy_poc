# Server Admin Settings Implementation Plan

## Overview

This document outlines the comprehensive plan to add a server administration and configuration interface to the Qwen Proxy application. This feature will enable users to view and modify server settings (including the backend port), manage providers, and administer the system from the UI instead of editing configuration files manually.

---

## Work Progression Tracking

| Phase | Priority | Status | Dependencies |
|-------|----------|--------|--------------|
| Phase 1: Backend Settings API | 1 | Not Started | None |
| Phase 2: Frontend Settings Pages | 2 | Not Started | Phase 1 |
| Phase 3: Electron IPC for Settings | 3 | Not Started | Phase 1, Phase 2 |
| Phase 4: Server Control Integration | 4 | Not Started | Phase 3 |
| Phase 5: Settings Persistence & Validation | 5 | Not Started | Phase 4 |
| Phase 6: Testing & Validation | 6 | Not Started | All Phases |
| Phase 7: Documentation | 7 | Not Started | Phase 6 |

---

## Current State Analysis

### Hardcoded Configuration Points

1. **Electron main.ts:267**
   - Hardcoded port: `const port = process.env.PORT || '3001'`
   - Backend server started with hardcoded default port

2. **Backend config.js:58**
   - Server port: `port: parseInt(process.env.PORT) || 3001`
   - Server host: `host: process.env.HOST || '0.0.0.0'`

3. **Frontend ProxyServerControl.tsx:9**
   - Hardcoded URL: `const SERVER_URL = 'http://localhost:3001/v1'`
   - No dynamic configuration

4. **Frontend vite.config.ts:23**
   - Dev proxy target: `target: 'http://localhost:3001'`

### Existing Configuration Infrastructure

1. **Database-Driven Provider Config** (Already implemented)
   - Settings table exists
   - Provider management API exists
   - Provider configuration via database

2. **Settings Service**
   - backend/provider-router/src/database/services/settings-service.js
   - Key-value settings storage

3. **Provider Management**
   - Full CRUD API for providers
   - Provider configuration management
   - Model management

### Port Configuration Issues

**Critical Finding**: There's a port mismatch between components:
- Electron defaults to port `3001`
- Backend defaults to port `3001`
- Frontend hardcoded to `3001`
- Vite proxy uses `3001`

All components now use the correct port 3001.

---

## Architecture Overview

### Configuration Hierarchy

```
┌─────────────────────────────────┐
│   Electron Main Process         │
│   - Manages backend lifecycle   │
│   - Reads server config from DB │
│   - Passes config to backend    │
└─────────────────────────────────┘
              │
              ├─────────────────────────────┐
              ▼                             ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│   Backend Server            │   │   Frontend (React)          │
│   - REST API on port X      │   │   - Settings UI             │
│   - Settings API endpoints  │◄──│   - Communicates via IPC    │
│   - Config from database    │   │   - Updates settings        │
└─────────────────────────────┘   └─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│   SQLite Database           │
│   - settings table          │
│   - Server configuration    │
│   - Provider configuration  │
└─────────────────────────────┘
```

---

## Phase 1: Backend Settings API

### Objective
Create comprehensive API endpoints for server configuration management, including server settings (port, host), logging settings, and system settings.

### Files to Create

1. **backend/provider-router/src/routes/settings.js**
   - GET /v1/settings - Get all settings
   - GET /v1/settings/:key - Get specific setting
   - PUT /v1/settings/:key - Update specific setting
   - POST /v1/settings/bulk - Bulk update settings
   - DELETE /v1/settings/:key - Delete setting

2. **backend/provider-router/src/controllers/settings-controller.js**
   - Business logic for settings management
   - Validation for server settings
   - Settings categorization (server, logging, system)
   - Special handling for port changes

3. **backend/provider-router/src/middleware/settings-validation.js**
   - Validate port range (1-65535)
   - Validate host format
   - Validate log level values
   - Validate boolean settings

4. **backend/provider-router/src/database/migrations/schema-v5.sql**
   - Add new settings table columns if needed
   - Seed default server settings
   - Create indexes for settings

5. **backend/provider-router/src/database/seeders/default-settings.js**
   - Seed default server configuration
   - Default port: 3001
   - Default host: 0.0.0.0
   - Default log level: info

### Files to Modify

1. **backend/provider-router/src/server.js**
   - Add settings router
   - Add settings validation middleware

2. **backend/provider-router/src/database/services/settings-service.js**
   - Add getServerSettings() method
   - Add updateServerSetting(key, value) method
   - Add getSettingsByCategory(category) method
   - Add validation helpers

3. **backend/provider-router/src/config.js**
   - Load server settings from database first
   - Fallback to environment variables
   - Add migration notice for config-to-database

### Settings Schema

```javascript
// Settings categories
const SETTINGS_CATEGORIES = {
  SERVER: 'server',
  LOGGING: 'logging',
  SYSTEM: 'system',
  PROVIDER: 'provider'
}

// Default settings
const DEFAULT_SETTINGS = {
  // Server settings
  'server.port': 3001,
  'server.host': '0.0.0.0',
  'server.timeout': 120000,

  // Logging settings
  'logging.level': 'info',
  'logging.logRequests': true,
  'logging.logResponses': true,

  // System settings
  'system.autoStart': false,
  'system.minimizeToTray': true,
  'system.checkUpdates': true
}
```

### API Endpoint Specifications

#### Get All Settings
```
GET /v1/settings
Query params:
  - category: filter by category (server, logging, system)
Response:
{
  "settings": {
    "server.port": 3001,
    "server.host": "0.0.0.0",
    "logging.level": "info",
    ...
  }
}
```

#### Get Single Setting
```
GET /v1/settings/:key
Response:
{
  "key": "server.port",
  "value": 8000,
  "category": "server",
  "updated_at": 1234567890
}
```

#### Update Setting
```
PUT /v1/settings/:key
Body:
{
  "value": 9000
}
Response:
{
  "key": "server.port",
  "value": 9000,
  "requiresRestart": true,
  "updated_at": 1234567890
}
```

#### Bulk Update
```
POST /v1/settings/bulk
Body:
{
  "settings": {
    "server.port": 9000,
    "logging.level": "debug"
  }
}
Response:
{
  "updated": ["server.port", "logging.level"],
  "requiresRestart": true
}
```

### Integration Points

- **Used by**: Phase 2 (Frontend UI), Phase 3 (Electron IPC)
- **Depends on**: Existing settings-service.js, database connection
- **Integrates with**: src/server.js, src/config.js

### New Folder Structure After Phase 1

```
backend/provider-router/
├── src/
│   ├── routes/
│   │   ├── settings.js (NEW)
│   │   ├── providers.js
│   │   └── ...
│   ├── controllers/
│   │   ├── settings-controller.js (NEW)
│   │   ├── providers-controller.js
│   │   └── ...
│   ├── middleware/
│   │   ├── settings-validation.js (NEW)
│   │   ├── validation.js
│   │   └── ...
│   ├── database/
│   │   ├── migrations/
│   │   │   └── schema-v5.sql (NEW)
│   │   ├── seeders/
│   │   │   └── default-settings.js (NEW)
│   │   └── services/
│   │       └── settings-service.js (MODIFIED)
│   ├── config.js (MODIFIED)
│   └── server.js (MODIFIED)
```

---

## Phase 2: Frontend Settings Pages

### Objective
Create React components for the settings administration UI, allowing users to view and modify server configuration, logging settings, and system preferences.

### Files to Create

1. **frontend/src/pages/Settings.tsx**
   - Main settings page layout
   - Tab navigation (Server, Logging, System, About)
   - Settings form with validation
   - Save/reset functionality

2. **frontend/src/components/settings/ServerSettings.tsx**
   - Server port configuration
   - Server host configuration
   - Timeout settings
   - Connection testing
   - Restart required indicator

3. **frontend/src/components/settings/LoggingSettings.tsx**
   - Log level selection
   - Request/response logging toggles
   - Log file management (future)

4. **frontend/src/components/settings/SystemSettings.tsx**
   - Auto-start on boot
   - Minimize to tray
   - Check for updates
   - Theme settings (future)

5. **frontend/src/components/settings/AboutSettings.tsx**
   - Version information
   - Backend version
   - Electron version
   - Database info
   - License information

6. **frontend/src/components/settings/SettingItem.tsx**
   - Reusable setting item component
   - Input types: text, number, select, switch
   - Validation display
   - Help text

7. **frontend/src/hooks/useSettings.ts**
   - Fetch settings from backend
   - Update settings
   - Handle loading/error states
   - Cache settings locally

8. **frontend/src/hooks/useServerControl.ts**
   - Restart server with new settings
   - Check if restart is required
   - Restart confirmation dialog

9. **frontend/src/services/settings-api.service.ts**
   - API client for settings endpoints
   - Type-safe settings operations
   - Error handling

10. **frontend/src/types/settings.ts**
    - Settings type definitions
    - Setting categories enum
    - Validation schemas

### Files to Modify

1. **frontend/src/App.tsx**
   - Add Settings route
   - Add navigation to settings page

2. **frontend/src/components/ui/** (if needed)
   - Add form components (Input, Select, Switch)
   - Add Tab components

### Component Structure

```typescript
// Settings.tsx structure
interface SettingsTab {
  id: string;
  label: string;
  component: React.ComponentType;
}

const tabs: SettingsTab[] = [
  { id: 'server', label: 'Server', component: ServerSettings },
  { id: 'logging', label: 'Logging', component: LoggingSettings },
  { id: 'system', label: 'System', component: SystemSettings },
  { id: 'about', label: 'About', component: AboutSettings }
];
```

```typescript
// useSettings.ts hook
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => { ... };
  const updateSetting = async (key: string, value: any) => { ... };
  const bulkUpdate = async (updates: Record<string, any>) => { ... };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
    bulkUpdate,
    refetch: fetchSettings
  };
}
```

### Settings UI Design

```
┌─────────────────────────────────────────────────┐
│ Settings                                    [X] │
├─────────────────────────────────────────────────┤
│ [Server] [Logging] [System] [About]            │
├─────────────────────────────────────────────────┤
│                                                 │
│ Server Configuration                            │
│ ┌─────────────────────────────────────────┐    │
│ │ Port                                    │    │
│ │ [8000               ]                   │    │
│ │ The port the backend server listens on │    │
│ │ ⚠ Requires restart to apply            │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ Host                                    │    │
│ │ [0.0.0.0            ]                   │    │
│ │ The host address to bind to             │    │
│ │ ⚠ Requires restart to apply            │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ [Save Changes]  [Reset]  [Test Connection]     │
└─────────────────────────────────────────────────┘
```

### Integration Points

- **Used by**: Phase 3 (Electron IPC)
- **Depends on**: Phase 1 (Backend API)
- **Integrates with**: Frontend routing, UI components

### New Folder Structure After Phase 2

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Settings.tsx (NEW)
│   │   └── Dashboard.tsx
│   ├── components/
│   │   ├── settings/
│   │   │   ├── ServerSettings.tsx (NEW)
│   │   │   ├── LoggingSettings.tsx (NEW)
│   │   │   ├── SystemSettings.tsx (NEW)
│   │   │   ├── AboutSettings.tsx (NEW)
│   │   │   └── SettingItem.tsx (NEW)
│   │   ├── dashboard/
│   │   └── ui/
│   ├── hooks/
│   │   ├── useSettings.ts (NEW)
│   │   ├── useServerControl.ts (NEW)
│   │   └── ...
│   ├── services/
│   │   ├── settings-api.service.ts (NEW)
│   │   └── electron-ipc.service.ts
│   ├── types/
│   │   ├── settings.ts (NEW)
│   │   └── ...
│   └── App.tsx (MODIFIED)
```

---

## Phase 3: Electron IPC for Settings

### Objective
Implement IPC communication between Electron main process and renderer for settings management, including the ability to restart the backend server with new configuration.

### Files to Create

1. **electron/src/ipc/settings-handlers.ts**
   - IPC handlers for settings operations
   - get-settings handler
   - update-setting handler
   - restart-server-with-settings handler

2. **electron/src/services/backend-manager.ts**
   - Backend process lifecycle management
   - Start backend with config
   - Stop backend gracefully
   - Restart backend with new port
   - Monitor backend health

3. **electron/src/services/settings-manager.ts**
   - Load settings from backend API
   - Cache settings locally
   - Validate settings before applying
   - Coordinate backend restart

### Files to Modify

1. **electron/src/main.ts**
   - Import and register settings IPC handlers
   - Use backend-manager for server lifecycle
   - Replace hardcoded port with settings-based port
   - Load settings on startup

2. **electron/preload.js**
   - Expose settings IPC methods
   - getSettings()
   - updateSetting(key, value)
   - restartServer()
   - onServerRestarted(callback)

3. **frontend/src/services/electron-ipc.service.ts**
   - Add settings methods
   - getSettings()
   - updateSetting()
   - restartServer()

4. **frontend/src/window.d.ts**
   - Add settings method types

### IPC API Design

```typescript
// Main Process -> Renderer
interface SettingsIPC {
  // Get all settings
  getSettings(): Promise<Settings>;

  // Update single setting
  updateSetting(key: string, value: any): Promise<{
    success: boolean;
    requiresRestart: boolean;
  }>;

  // Restart server with new settings
  restartServer(newSettings?: Partial<Settings>): Promise<{
    success: boolean;
    message: string;
  }>;

  // Event listeners
  onSettingsChanged(callback: (settings: Settings) => void): () => void;
  onServerRestarted(callback: (status: ServerStatus) => void): () => void;
}
```

### Backend Manager Design

```typescript
// backend-manager.ts
class BackendManager {
  private process: ChildProcess | null = null;
  private settings: ServerSettings | null = null;

  /**
   * Load settings from backend API or database
   */
  async loadSettings(): Promise<ServerSettings> { ... }

  /**
   * Start backend server with settings
   */
  async start(settings: ServerSettings): Promise<void> { ... }

  /**
   * Stop backend server gracefully
   */
  async stop(): Promise<void> { ... }

  /**
   * Restart backend with new settings
   */
  async restart(newSettings: ServerSettings): Promise<void> {
    await this.stop();
    await this.start(newSettings);
  }

  /**
   * Check if backend is running
   */
  isRunning(): boolean { ... }

  /**
   * Get current port
   */
  getPort(): number { ... }
}
```

### Settings Flow

```
User changes port in UI
       ↓
Frontend updates setting via API
       ↓
Backend saves to database
       ↓
Frontend calls restartServer() via IPC
       ↓
Electron stops backend process
       ↓
Electron loads new settings from DB
       ↓
Electron starts backend with new port
       ↓
Frontend receives onServerRestarted event
       ↓
Frontend updates UI with new port
```

### Integration Points

- **Used by**: Phase 2 (Frontend UI), Phase 4 (Server Control)
- **Depends on**: Phase 1 (Backend API)
- **Integrates with**: Electron main process, Backend server

### New Folder Structure After Phase 3

```
electron/
├── src/
│   ├── ipc/
│   │   └── settings-handlers.ts (NEW)
│   ├── services/
│   │   ├── backend-manager.ts (NEW)
│   │   └── settings-manager.ts (NEW)
│   └── main.ts (MODIFIED)
├── preload.js (MODIFIED)

frontend/
├── src/
│   ├── services/
│   │   └── electron-ipc.service.ts (MODIFIED)
│   └── window.d.ts (MODIFIED)
```

---

## Phase 4: Server Control Integration

### Objective
Integrate the new settings management with the existing proxy server control, ensuring seamless server restart when settings change.

### Files to Create

1. **frontend/src/components/settings/ServerControlPanel.tsx**
   - Display current server status
   - Show current port and host
   - Restart button with confirmation
   - Server logs viewer (future)

2. **frontend/src/hooks/useServerRestart.ts**
   - Handle server restart flow
   - Confirmation dialog
   - Progress tracking
   - Error handling

### Files to Modify

1. **frontend/src/components/dashboard/ProxyServerControl.tsx**
   - Remove hardcoded SERVER_URL
   - Load URL from settings
   - Update URL when settings change
   - Show "Settings changed, restart required" indicator

2. **frontend/src/hooks/useProxyControl.ts**
   - Integrate with settings
   - Handle port changes
   - Update server URL dynamically

3. **frontend/src/components/settings/ServerSettings.tsx**
   - Add ServerControlPanel component
   - Show restart required warning
   - Quick restart button

### Restart Flow Design

```typescript
// useServerRestart.ts
export function useServerRestart() {
  const [restarting, setRestarting] = useState(false);
  const [progress, setProgress] = useState<RestartProgress>('idle');

  const restart = async (newSettings?: Partial<Settings>) => {
    setRestarting(true);

    try {
      // 1. Validate settings
      setProgress('validating');
      await validateSettings(newSettings);

      // 2. Stop server
      setProgress('stopping');
      await electronIPC.stopProxy();

      // 3. Apply new settings
      if (newSettings) {
        setProgress('updating');
        await electronIPC.restartServer(newSettings);
      }

      // 4. Wait for server to be ready
      setProgress('starting');
      await waitForServer();

      setProgress('complete');
    } catch (error) {
      setProgress('error');
      throw error;
    } finally {
      setRestarting(false);
    }
  };

  return { restart, restarting, progress };
}
```

### Settings Change Indicator

```
┌─────────────────────────────────────────────────┐
│ Proxy Server                                [X] │
├─────────────────────────────────────────────────┤
│ ⚠ Settings have changed                        │
│ Server restart required to apply changes       │
│ [Restart Now]  [Dismiss]                       │
├─────────────────────────────────────────────────┤
│ Status: Running                                │
│ Endpoint: http://localhost:9000/v1            │
│ [Stop Proxy]  [Copy URL]                       │
└─────────────────────────────────────────────────┘
```

### Integration Points

- **Used by**: End users
- **Depends on**: Phase 1, 2, 3
- **Integrates with**: Dashboard, Settings page

### New Folder Structure After Phase 4

```
frontend/
├── src/
│   ├── components/
│   │   ├── settings/
│   │   │   ├── ServerControlPanel.tsx (NEW)
│   │   │   └── ServerSettings.tsx (MODIFIED)
│   │   └── dashboard/
│   │       └── ProxyServerControl.tsx (MODIFIED)
│   └── hooks/
│       ├── useServerRestart.ts (NEW)
│       └── useProxyControl.ts (MODIFIED)
```

---

## Phase 5: Settings Persistence & Validation

### Objective
Ensure settings are properly persisted, validated, and synchronized across all components. Handle edge cases and error scenarios.

### Files to Create

1. **backend/provider-router/src/utils/settings-validator.js**
   - Comprehensive settings validation
   - Port availability check
   - Host format validation
   - Cross-setting validation

2. **backend/provider-router/src/services/settings-sync.js**
   - Sync settings between database and runtime config
   - Notify when settings change
   - Handle setting conflicts

3. **frontend/src/utils/settings-validator.ts**
   - Client-side validation
   - Real-time validation feedback
   - Validation error messages

### Files to Modify

1. **backend/provider-router/src/config.js**
   - Prioritize database settings over env vars
   - Add setting migration helpers
   - Deprecation warnings for env-based config

2. **backend/provider-router/src/index.js**
   - Load settings from database on startup
   - Validate settings before server start
   - Handle invalid settings gracefully

3. **electron/src/main.ts**
   - Persist Electron-specific settings
   - Sync settings between Electron and backend
   - Handle setting load failures

### Validation Rules

```javascript
// Port validation
const validatePort = (port) => {
  if (!Number.isInteger(port)) {
    throw new ValidationError('Port must be an integer');
  }
  if (port < 1 || port > 65535) {
    throw new ValidationError('Port must be between 1 and 65535');
  }
  // Check if port is available
  if (!isPortAvailable(port)) {
    throw new ValidationError(`Port ${port} is already in use`);
  }
};

// Host validation
const validateHost = (host) => {
  const validFormats = ['0.0.0.0', 'localhost', 'IP_ADDRESS'];
  // Validate IPv4 or hostname format
  if (!isValidHost(host)) {
    throw new ValidationError('Invalid host format');
  }
};

// Log level validation
const validateLogLevel = (level) => {
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(level)) {
    throw new ValidationError(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
  }
};
```

### Settings Sync Strategy

```javascript
// On startup
async function loadSettings() {
  // 1. Try loading from database
  let settings = await SettingsService.getAll();

  // 2. If no settings in DB, load from env and migrate
  if (!settings || Object.keys(settings).length === 0) {
    settings = loadFromEnvironment();
    await SettingsService.migrateFromEnv(settings);
  }

  // 3. Validate settings
  await validateSettings(settings);

  // 4. Apply settings
  config.applySettings(settings);

  return settings;
}

// On settings update
async function updateSetting(key, value) {
  // 1. Validate new value
  await validateSetting(key, value);

  // 2. Save to database
  await SettingsService.set(key, value);

  // 3. Determine if restart required
  const requiresRestart = RESTART_REQUIRED_SETTINGS.includes(key);

  // 4. If no restart needed, apply immediately
  if (!requiresRestart) {
    config.updateSetting(key, value);
  }

  return { requiresRestart };
}
```

### Error Handling

```typescript
// Frontend error handling
try {
  await updateSetting('server.port', 9000);
} catch (error) {
  if (error instanceof ValidationError) {
    showError('Invalid port: ' + error.message);
  } else if (error instanceof PortInUseError) {
    showError('Port 9000 is already in use. Please choose another port.');
  } else if (error instanceof NetworkError) {
    showError('Failed to update settings. Please check your connection.');
  } else {
    showError('An unexpected error occurred: ' + error.message);
  }
}
```

### Integration Points

- **Used by**: All components
- **Depends on**: All previous phases
- **Integrates with**: Database, Config, Server startup

### New Folder Structure After Phase 5

```
backend/provider-router/
├── src/
│   ├── utils/
│   │   ├── settings-validator.js (NEW)
│   │   └── ...
│   ├── services/
│   │   ├── settings-sync.js (NEW)
│   │   └── ...
│   ├── config.js (MODIFIED)
│   └── index.js (MODIFIED)

frontend/
├── src/
│   └── utils/
│       └── settings-validator.ts (NEW)
```

---

## Phase 6: Testing & Validation

### Objective
Comprehensive testing of all settings functionality, including edge cases, error handling, and cross-component integration.

### Files to Create

1. **backend/provider-router/tests/unit/controllers/settings-controller.test.js**
   - Test CRUD operations
   - Test validation
   - Test error handling

2. **backend/provider-router/tests/unit/utils/settings-validator.test.js**
   - Test port validation
   - Test host validation
   - Test log level validation

3. **backend/provider-router/tests/integration/api/settings-api.test.js**
   - Test all settings endpoints
   - Test bulk updates
   - Test validation errors

4. **backend/provider-router/tests/integration/settings-persistence.test.js**
   - Test settings persistence
   - Test database sync
   - Test migration from env

5. **frontend/src/components/settings/__tests__/ServerSettings.test.tsx**
   - Test settings UI
   - Test form validation
   - Test save/reset functionality

6. **frontend/src/hooks/__tests__/useSettings.test.ts**
   - Test settings hook
   - Test loading states
   - Test error handling

7. **electron/tests/backend-manager.test.ts**
   - Test backend lifecycle
   - Test restart flow
   - Test port changes

### Files to Modify

1. **backend/provider-router/tests/integration/server.test.js**
   - Add settings endpoint tests
   - Test server restart with new settings

### Test Scenarios

#### Unit Tests
- Settings validation (port, host, log level)
- Settings service CRUD operations
- Settings controller business logic
- Backend manager lifecycle

#### Integration Tests
- Settings API endpoints
- Settings persistence to database
- Settings sync between components
- Server restart with new port
- Frontend-backend communication

#### E2E Tests
- User changes port in UI
- Server restarts with new port
- Proxy functionality works on new port
- Settings persist across app restarts

### Test Coverage Goals
- Unit Tests: 80%+ coverage
- Integration Tests: All critical paths
- E2E Tests: Complete user workflows

### Integration Points
- **Depends on**: All previous phases
- **Uses**: Test database, Mock Electron IPC

### New Folder Structure After Phase 6

```
backend/provider-router/
├── tests/
│   ├── unit/
│   │   ├── controllers/
│   │   │   └── settings-controller.test.js (NEW)
│   │   └── utils/
│   │       └── settings-validator.test.js (NEW)
│   └── integration/
│       ├── api/
│       │   └── settings-api.test.js (NEW)
│       └── settings-persistence.test.js (NEW)

frontend/
├── src/
│   ├── components/
│   │   └── settings/
│   │       └── __tests__/
│   │           └── ServerSettings.test.tsx (NEW)
│   └── hooks/
│       └── __tests__/
│           └── useSettings.test.ts (NEW)

electron/
└── tests/
    └── backend-manager.test.ts (NEW)
```

---

## Phase 7: Documentation

### Objective
Comprehensive documentation for the settings feature, including user guides, API documentation, and developer guides.

### Files to Create

1. **docs/guides/server-settings-management.md**
   - User guide for settings UI
   - How to change server port
   - How to configure logging
   - System settings explained

2. **docs/api/settings-api.md**
   - Settings API reference
   - Endpoint documentation
   - Request/response examples
   - Error codes

3. **docs/architecture/settings-architecture.md**
   - Settings system architecture
   - Component interaction diagrams
   - Data flow diagrams
   - IPC communication flow

4. **docs/development/adding-new-settings.md**
   - Developer guide for adding settings
   - Settings validation guidelines
   - UI component patterns
   - Testing requirements

### Files to Modify

1. **README.md**
   - Add settings management section
   - Link to settings documentation
   - Update screenshots

2. **docs/CHANGELOG.md**
   - Document settings feature
   - Breaking changes (if any)
   - Migration notes

### Documentation Structure

```
docs/
├── guides/
│   └── server-settings-management.md (NEW)
├── api/
│   └── settings-api.md (NEW)
├── architecture/
│   └── settings-architecture.md (NEW)
├── development/
│   └── adding-new-settings.md (NEW)
├── CHANGELOG.md (MODIFIED)
└── README.md (MODIFIED - in parent directory)
```

### Integration Points
- **Depends on**: All previous phases
- **Used by**: Users, Developers

---

## Complete File & Folder Structure

### Final Structure After All Phases

```
qwen_proxy_opencode/
├── backend/
│   └── provider-router/
│       ├── src/
│       │   ├── routes/
│       │   │   ├── settings.js (NEW)
│       │   │   └── ...
│       │   ├── controllers/
│       │   │   ├── settings-controller.js (NEW)
│       │   │   └── ...
│       │   ├── middleware/
│       │   │   ├── settings-validation.js (NEW)
│       │   │   └── ...
│       │   ├── database/
│       │   │   ├── migrations/
│       │   │   │   └── schema-v5.sql (NEW)
│       │   │   ├── seeders/
│       │   │   │   └── default-settings.js (NEW)
│       │   │   └── services/
│       │   │       └── settings-service.js (MODIFIED)
│       │   ├── services/
│       │   │   └── settings-sync.js (NEW)
│       │   ├── utils/
│       │   │   └── settings-validator.js (NEW)
│       │   ├── config.js (MODIFIED)
│       │   ├── index.js (MODIFIED)
│       │   └── server.js (MODIFIED)
│       └── tests/
│           ├── unit/
│           │   ├── controllers/
│           │   │   └── settings-controller.test.js (NEW)
│           │   └── utils/
│           │       └── settings-validator.test.js (NEW)
│           └── integration/
│               ├── api/
│               │   └── settings-api.test.js (NEW)
│               └── settings-persistence.test.js (NEW)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Settings.tsx (NEW)
│       │   └── ...
│       ├── components/
│       │   ├── settings/
│       │   │   ├── ServerSettings.tsx (NEW)
│       │   │   ├── LoggingSettings.tsx (NEW)
│       │   │   ├── SystemSettings.tsx (NEW)
│       │   │   ├── AboutSettings.tsx (NEW)
│       │   │   ├── SettingItem.tsx (NEW)
│       │   │   ├── ServerControlPanel.tsx (NEW)
│       │   │   └── __tests__/
│       │   │       └── ServerSettings.test.tsx (NEW)
│       │   └── dashboard/
│       │       └── ProxyServerControl.tsx (MODIFIED)
│       ├── hooks/
│       │   ├── useSettings.ts (NEW)
│       │   ├── useServerControl.ts (NEW)
│       │   ├── useServerRestart.ts (NEW)
│       │   ├── useProxyControl.ts (MODIFIED)
│       │   └── __tests__/
│       │       └── useSettings.test.ts (NEW)
│       ├── services/
│       │   ├── settings-api.service.ts (NEW)
│       │   └── electron-ipc.service.ts (MODIFIED)
│       ├── types/
│       │   └── settings.ts (NEW)
│       ├── utils/
│       │   └── settings-validator.ts (NEW)
│       ├── App.tsx (MODIFIED)
│       └── window.d.ts (MODIFIED)
├── electron/
│   ├── src/
│   │   ├── ipc/
│   │   │   └── settings-handlers.ts (NEW)
│   │   ├── services/
│   │   │   ├── backend-manager.ts (NEW)
│   │   │   └── settings-manager.ts (NEW)
│   │   └── main.ts (MODIFIED)
│   ├── preload.js (MODIFIED)
│   └── tests/
│       └── backend-manager.test.ts (NEW)
└── docs/
    ├── guides/
    │   └── server-settings-management.md (NEW)
    ├── api/
    │   └── settings-api.md (NEW)
    ├── architecture/
    │   └── settings-architecture.md (NEW)
    ├── development/
    │   └── adding-new-settings.md (NEW)
    ├── CHANGELOG.md (MODIFIED)
    └── 13-SERVER_ADMIN_SETTINGS_IMPLEMENTATION_PLAN.md (THIS FILE)
```

---

## Implementation Best Practices

### Single Responsibility Principle (SRP)
- Each settings component handles one category
- Settings service only manages database operations
- Settings validator only handles validation logic
- Backend manager only handles process lifecycle

### Don't Repeat Yourself (DRY)
- Shared validation logic between frontend and backend
- Reusable SettingItem component
- Centralized settings types
- Common error handling patterns

### Separation of Concerns
- Database layer: Settings persistence
- API layer: Settings endpoints
- UI layer: Settings presentation
- IPC layer: Electron-renderer communication
- Process layer: Backend lifecycle management

### Error Handling
- Graceful degradation when settings load fails
- Clear error messages for validation failures
- Rollback on failed setting updates
- User confirmation for destructive operations

### Security Considerations
- Validate all settings server-side
- Sanitize user input
- Prevent arbitrary port binding
- Secure IPC communication

### Performance Optimization
- Cache settings in memory
- Debounce setting updates
- Lazy load settings pages
- Minimize server restarts

---

## Port Unification Strategy

### Current Port Issues (RESOLVED)
- Electron now uses port 3001
- Backend defaults to port 3001
- Frontend now uses port 3001
- Vite dev proxy uses port 3001

### Solution (IMPLEMENTED)
1. **Default to 3001 in database settings**
2. **Electron reads port from database/settings**
3. **Backend reads port from database/settings**
4. **Frontend fetches port from backend API**
5. **Vite proxy configured via environment variable**

### Migration Path
```javascript
// On first startup
if (!await SettingsService.exists('server.port')) {
  // Set default port to 3001 for consistency
  await SettingsService.set('server.port', 3001);
  await SettingsService.set('server.host', '0.0.0.0');
}

// Electron startup
const port = await SettingsService.get('server.port', 3001);
backendManager.start({ port, host: '0.0.0.0' });

// Frontend startup
const settings = await settingsAPI.getSettings();
const serverUrl = `http://localhost:${settings['server.port']}/v1`;
```

---

## Restart Required Settings

Settings that require server restart:
- `server.port` - Changes listening port
- `server.host` - Changes listening host
- `logging.level` - Changes winston logger level (optional restart)

Settings that apply immediately:
- `logging.logRequests` - Toggle request logging
- `logging.logResponses` - Toggle response logging
- `system.minimizeToTray` - Electron setting
- `system.autoStart` - Electron setting

---

## User Experience Flow

### Changing Server Port

1. User opens Settings page
2. User navigates to Server tab
3. User changes port from 3001 to 9000
4. User clicks "Save Changes"
5. Warning appears: "Server restart required"
6. User clicks "Restart Now" button
7. Confirmation dialog: "Are you sure? This will stop the proxy."
8. User confirms
9. Progress indicator shows:
   - Validating settings...
   - Stopping server...
   - Applying changes...
   - Starting server...
   - Complete!
10. UI updates to show new port
11. Success message: "Server restarted on port 9000"

### Settings Validation Error

1. User enters invalid port (e.g., 99999)
2. Real-time validation shows error: "Port must be between 1-65535"
3. Save button is disabled
4. User corrects the value
5. Validation passes
6. Save button enabled

### Port Already in Use

1. User tries to change to port 3000
2. User clicks Save
3. Backend validates port availability
4. Error returned: "Port 3000 is already in use"
5. Frontend shows error message
6. Settings not saved
7. User can choose different port

---

## Success Criteria

### Functional Requirements
- ✅ Users can view all server settings
- ✅ Users can modify server port and host
- ✅ Users can change logging settings
- ✅ Settings persist to database
- ✅ Server restarts with new settings
- ✅ Frontend updates dynamically
- ✅ Validation prevents invalid settings
- ✅ Clear error messages

### Non-Functional Requirements
- ✅ Settings UI is intuitive
- ✅ Restart process is < 5 seconds
- ✅ No data loss during restart
- ✅ Settings sync across components
- ✅ Test coverage > 80%
- ✅ Complete documentation

### User Experience
- ✅ Easy to find settings page
- ✅ Clear indication of restart requirements
- ✅ Smooth restart process
- ✅ Helpful validation messages
- ✅ Persistent settings across app restarts

---

## Future Enhancements (Out of Scope)

1. **Advanced Logging**
   - Log file viewer in UI
   - Log rotation configuration
   - Log export functionality

2. **Backup/Restore**
   - Export all settings
   - Import settings from file
   - Reset to defaults

3. **Provider Presets**
   - Common provider configurations
   - Quick setup wizards
   - Import/export provider configs

4. **Health Monitoring**
   - Real-time server metrics
   - Request/response statistics
   - Error rate tracking

5. **Auto-Update**
   - Check for updates
   - Download and install updates
   - Changelog viewer

6. **Multi-Profile**
   - Multiple configuration profiles
   - Quick profile switching
   - Profile import/export

7. **Environment-Specific Settings**
   - Development vs Production profiles
   - Environment variable overrides

8. **Settings Search**
   - Search/filter settings
   - Quick navigation
   - Settings history

---

## Risk Mitigation

### Risk: Data Loss During Server Restart
**Mitigation**:
- Save all settings to database before restart
- Graceful shutdown with timeout
- Rollback on startup failure
- User confirmation before restart

### Risk: Port Conflicts
**Mitigation**:
- Check port availability before saving
- Clear error messages
- Suggest alternative ports
- Validation before restart

### Risk: Invalid Settings Breaking Server
**Mitigation**:
- Comprehensive validation (frontend and backend)
- Test settings before applying
- Rollback to last known good config
- Default fallback values

### Risk: Settings Sync Issues
**Mitigation**:
- Single source of truth (database)
- Settings loaded on startup
- Event-based updates
- Cache invalidation on changes

### Risk: User Confusion During Restart
**Mitigation**:
- Clear progress indicators
- Estimated time remaining
- Success/failure notifications
- Help text and documentation

---

## Dependencies

### External Libraries
- None (using existing dependencies)

### Internal Dependencies
- Existing settings-service.js
- Existing provider management system
- Existing database infrastructure
- Existing Electron IPC setup

---

## Rollout Plan

### Phase 1-3: Core Infrastructure (Week 1)
- Backend API
- Frontend UI
- Electron IPC

### Phase 4-5: Integration (Week 2)
- Server control integration
- Settings persistence
- Validation

### Phase 6: Testing (Week 3)
- Unit tests
- Integration tests
- E2E tests

### Phase 7: Documentation & Release (Week 4)
- User documentation
- API documentation
- Release notes

---

## Glossary

- **Setting**: A key-value configuration pair
- **Setting Category**: Group of related settings (server, logging, system)
- **Restart Required**: Setting that needs server restart to apply
- **Backend Manager**: Service that manages backend process lifecycle
- **Settings Sync**: Process of keeping settings consistent across components
- **Port**: Network port number for server to listen on
- **Host**: Network host address to bind to

---

## Appendix A: Settings Schema Reference

### Server Settings

| Key | Type | Default | Restart Required | Validation |
|-----|------|---------|------------------|------------|
| server.port | integer | 3001 | Yes | 1-65535, available |
| server.host | string | 0.0.0.0 | Yes | Valid IP or hostname |
| server.timeout | integer | 120000 | No | > 0 |

### Logging Settings

| Key | Type | Default | Restart Required | Validation |
|-----|------|---------|------------------|------------|
| logging.level | string | info | Optional | debug, info, warn, error |
| logging.logRequests | boolean | true | No | true, false |
| logging.logResponses | boolean | true | No | true, false |

### System Settings

| Key | Type | Default | Restart Required | Validation |
|-----|------|---------|------------------|------------|
| system.autoStart | boolean | false | No | true, false |
| system.minimizeToTray | boolean | true | No | true, false |
| system.checkUpdates | boolean | true | No | true, false |

---

## Appendix B: API Examples

### Get All Settings
```bash
GET http://localhost:3001/v1/settings

Response 200:
{
  "settings": {
    "server.port": 3001,
    "server.host": "0.0.0.0",
    "server.timeout": 120000,
    "logging.level": "info",
    "logging.logRequests": true,
    "logging.logResponses": true,
    "system.autoStart": false,
    "system.minimizeToTray": true,
    "system.checkUpdates": true
  }
}
```

### Update Single Setting
```bash
PUT http://localhost:3001/v1/settings/server.port
Content-Type: application/json

{
  "value": 9000
}

Response 200:
{
  "key": "server.port",
  "value": 9000,
  "requiresRestart": true,
  "updated_at": 1706745600000
}
```

### Bulk Update Settings
```bash
POST http://localhost:3001/v1/settings/bulk
Content-Type: application/json

{
  "settings": {
    "server.port": 9000,
    "logging.level": "debug",
    "logging.logRequests": false
  }
}

Response 200:
{
  "updated": ["server.port", "logging.level", "logging.logRequests"],
  "requiresRestart": true,
  "message": "3 settings updated. Server restart required."
}
```

### Validation Error Example
```bash
PUT http://localhost:3001/v1/settings/server.port
Content-Type: application/json

{
  "value": 99999
}

Response 400:
{
  "error": "Validation failed",
  "details": {
    "key": "server.port",
    "value": 99999,
    "message": "Port must be between 1 and 65535"
  }
}
```

---

## Document Version

- **Version**: 1.0
- **Date**: 2025-10-31
- **Author**: AI Assistant (Claude)
- **Status**: Draft for Review
- **Next Review**: After Phase 1 completion

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-31 | 1.0 | Initial document creation | Claude |

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Lead Developer | | | |
| QA Lead | | | |

---

**End of Document**
