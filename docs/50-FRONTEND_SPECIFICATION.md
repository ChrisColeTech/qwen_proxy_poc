# Qwen Proxy - Frontend Specification Document

**Version**: 1.0
**Date**: November 5, 2025
**Purpose**: Complete specification of frontend features, functionality, and architecture

---

## Table of Contents

1. [Overview](#overview)
2. [Core Functionality](#core-functionality)
3. [User Flows](#user-flows)
4. [Features Breakdown](#features-breakdown)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Services & API Integration](#services--api-integration)
8. [Styling & Theming](#styling--theming)
9. [Technology Stack](#technology-stack)
10. [File Structure](#file-structure)

---

## Overview

### Purpose
The Qwen Proxy frontend is a desktop/web application that provides a user interface for:
1. Extracting and managing Qwen credentials (tokens and cookies)
2. Controlling a local proxy server that translates OpenAI API calls to Qwen API
3. Monitoring credential status and proxy health
4. Supporting both Electron (desktop) and web browser modes

### Key Characteristics
- Dual-mode: Works as Electron app (with native window controls) and browser app
- Real-time credential polling and status monitoring
- Professional dark/light theme support
- Clean, modern UI with proper loading states and error handling

---

## Core Functionality

### 1. Credential Management

**Purpose**: Extract, store, and monitor Qwen authentication credentials

**Features**:
- **Extract Credentials** (Electron mode):
  - Opens a secure browser window to `chat.qwen.ai`
  - User logs in manually
  - App automatically extracts JWT token and cookies from browser session
  - Saves credentials to backend API server

- **Extract Credentials** (Browser mode):
  - Requires Chrome extension installation
  - Extension detects login on `chat.qwen.ai`
  - Automatically extracts and POSTs credentials to API server
  - Frontend polls API every 5 seconds to detect new credentials

- **Monitor Credentials**:
  - Display current credential status (valid/expired/missing)
  - Show expiration date/time
  - Visual indicators for credential health
  - Auto-refresh status periodically

- **Delete Credentials**:
  - Remove stored credentials from backend
  - Confirmation dialog before deletion
  - Clear UI state after deletion

### 2. Proxy Server Control

**Purpose**: Start, stop, and monitor the local proxy server

**Features**:
- **Start Proxy**:
  - POST request to `/api/proxy/start`
  - Display loading state during startup
  - Show success/error feedback
  - Update UI with running status

- **Stop Proxy**:
  - POST request to `/api/proxy/stop`
  - Display loading state during shutdown
  - Show success/error feedback
  - Update UI with stopped status

- **Monitor Proxy**:
  - Poll `/api/proxy/status` for current state
  - Display: running/stopped status, port number, uptime
  - Show proxy endpoint URL for client configuration
  - Visual indicators for proxy health

### 3. Status Monitoring & Feedback

**Purpose**: Provide real-time feedback on system state

**Features**:
- **Alert System**:
  - Success alerts (green) for completed operations
  - Error alerts (red) for failed operations
  - Auto-dismiss or manual close
  - Contextual messages

- **Status Indicators**:
  - Credential status badge (active/inactive/expired)
  - Proxy status badge (running/stopped)
  - Environment badge (Desktop/Browser mode)
  - Visual pulse animations for active states

- **Status Bar**:
  - Bottom bar showing current system state
  - Updates based on proxy and credential status
  - Always visible for quick glance

### 4. Dual-Mode Support

**Purpose**: Work seamlessly in both Electron and browser environments

**Features**:
- **Electron Mode**:
  - Frameless window with custom title bar
  - Window controls (minimize, maximize, close)
  - Draggable title bar region
  - Native window integration via IPC
  - Direct cookie extraction from Electron session

- **Browser Mode**:
  - Standard browser experience
  - No window controls displayed
  - Chrome extension for credential extraction
  - Works with any modern browser

### 5. Theme System

**Purpose**: Support light and dark themes with proper contrast

**Features**:
- **Theme Toggle**:
  - Button in title bar (sun/moon icon)
  - Switches between light and dark mode
  - Persists preference to localStorage
  - Instant visual update across all components

- **Theme Implementation**:
  - CSS custom properties (CSS variables)
  - Automatic theme switching via `.dark` class
  - All colors use theme variables (no hardcoded colors)
  - Professional color palettes for both modes

---

## User Flows

### Flow 1: First-Time Setup (Electron Mode)

1. User launches Electron app
2. Sees dashboard with "Not Connected" status
3. Clicks "Connect to Qwen" button
4. Secure browser window opens to `chat.qwen.ai`
5. User logs in with Qwen credentials
6. Window closes automatically after login detected
7. Credentials extracted and saved to API
8. Dashboard updates to show "Active" status with expiration date
9. User can now start the proxy server

### Flow 2: First-Time Setup (Browser Mode)

1. User opens web app in browser
2. Sees dashboard with "Not Connected" status
3. Clicks "Connect to Qwen" button
4. Detects Chrome extension not installed
5. Shows installation instructions
6. User installs extension from Chrome Web Store
7. User navigates to `chat.qwen.ai` and logs in
8. Extension auto-extracts credentials and POSTs to API
9. Frontend polls and detects new credentials within 5 seconds
10. Dashboard updates to show "Active" status

### Flow 3: Starting the Proxy

1. User has valid credentials (credential status shows "Active")
2. Proxy status shows "Stopped"
3. User clicks "Start Proxy" button
4. Button shows loading spinner
5. Backend starts proxy server on port 3001
6. UI updates to show "Running" status with port number
7. Proxy endpoint URL displayed for client configuration
8. Status bar updates to show "Proxy running on port 3001"

### Flow 4: Credential Re-authentication

1. Credentials expire (shows "Expired" status)
2. User clicks "Re-authenticate" button
3. Follows same flow as first-time setup
4. New credentials replace expired ones
5. Dashboard updates with new expiration date

### Flow 5: Theme Switching

1. User clicks theme toggle button in title bar
2. UI instantly switches between light and dark mode
3. Preference saved to localStorage
4. Theme persists across app restarts

---

## Features Breakdown

### Feature 1: Authentication Card

**Location**: Main dashboard, left side (2/3 width)

**Components**:
- Card header with lock icon and title
- Status badge (Active/Not Connected/Expired)
- Expiration date display (if credentials exist)
- Action buttons:
  - "Connect to Qwen" / "Re-authenticate" button (primary action)
  - "Revoke" button (danger action, only shown when credentials exist)
- Instructions footer with info icon

**Behavior**:
- Shows loading spinner when extracting credentials
- Disables buttons during operations
- Updates status badge in real-time
- Displays appropriate message based on mode (Electron vs Browser)

### Feature 2: Proxy Control Card

**Location**: Main dashboard, left side (2/3 width), below authentication

**Components**:
- Card header with server icon and title
- Status badge (Running/Stopped)
- Info grid showing:
  - Port number (e.g., 3001)
  - Uptime (if running)
- Action buttons:
  - "Start Proxy" button (disabled if already running)
  - "Stop Proxy" button (disabled if not running)
- Endpoint info box with:
  - Copy-able proxy URL
  - Configuration instructions

**Behavior**:
- Shows loading spinner when starting/stopping
- Disables buttons during state transitions
- Polls backend for status updates
- Updates uptime counter in real-time

### Feature 3: System Stats Card

**Location**: Main dashboard, right side (1/3 width)

**Components**:
- Card header with "System Status" title
- Stats grid showing:
  - Credentials status (Valid/None)
  - Proxy status (Running/Stopped)
  - Mode (Desktop/Browser)

**Behavior**:
- Updates automatically based on credential and proxy state
- Color-coded status indicators
- Compact, at-a-glance information

### Feature 4: Connection Guide Card

**Location**: Main dashboard, right side (1/3 width), below proxy control

**Components**:
- Card header with info icon and "Quick Guide" title
- Numbered steps:
  1. Authenticate with Qwen credentials
  2. Start the proxy server
  3. Configure OpenAI client with proxy URL

**Behavior**:
- Static instructional content
- Helps users understand the workflow

### Feature 5: Credentials Detail Card

**Location**: Bottom of dashboard (only shown when credentials exist)

**Components**:
- Card header with document icon and title
- Token display (truncated, first 80 characters)
- Expiration date
- Cookie string (truncated, first 40 characters)

**Behavior**:
- Only appears after successful authentication
- Shows last extracted credentials
- Read-only display

### Feature 6: Status Alert Banner

**Location**: Top of dashboard (appears when needed)

**Components**:
- Success/error icon
- Alert title
- Descriptive message
- Auto-dismiss or manual close option

**Behavior**:
- Appears after operations (success or failure)
- Color-coded (green for success, red for error)
- Slides in with animation
- Dismisses automatically or manually

### Feature 7: Environment Badge

**Location**: Top right of dashboard header

**Components**:
- Badge with animated indicator dot
- Text: "Desktop Mode" or "Browser Mode"
- Color-coded (purple for desktop, blue for browser)

**Behavior**:
- Automatically detects runtime environment
- Static display, no interaction

### Feature 8: Title Bar

**Location**: Top of application window

**Components**:
- Left side:
  - App logo (lightning bolt icon)
  - App title ("Qwen Proxy")
- Right side:
  - Theme toggle button (sun/moon icon)
  - Window controls (Electron only):
    - Minimize button
    - Maximize/restore button
    - Close button (red hover)

**Behavior**:
- Draggable (Electron mode) for window movement
- Theme toggle switches theme instantly
- Window controls only appear in Electron mode
- Close button has red hover state for danger

### Feature 9: Status Bar

**Location**: Bottom of application window

**Components**:
- Status indicator dot (green when proxy running)
- Status text message

**Behavior**:
- Updates based on proxy and credential status
- Shows "Ready", "Proxy running on port 3001", etc.
- Always visible at bottom

---

## Component Architecture

### Page Components

#### HomePage (`/pages/HomePage.tsx`)
- Main dashboard page
- Composes all feature components
- Manages page-level layout
- Initiates credential polling hook

### Layout Components

#### AppLayout (`/components/layout/AppLayout.tsx`)
- Root layout container
- Full-height flexbox layout
- Wraps: TitleBar, main content, StatusBar
- Background gradient

#### TitleBar (`/components/layout/TitleBar.tsx`)
- Custom title bar
- App logo and title
- Theme toggle button
- Window controls (Electron only)
- Draggable region

#### StatusBar (`/components/layout/StatusBar.tsx`)
- Bottom status bar
- Status indicator dot
- Status text message

### Feature Components

#### Authentication Card (`/components/features/authentication/AuthenticationCard.tsx`)
- Main authentication UI
- Status display
- Action buttons
- Instructions footer

#### AuthButtons (`/components/features/authentication/AuthButtons.tsx`)
- Connect/Re-authenticate button
- Revoke button
- Loading states

#### AuthCardFooter (`/components/features/authentication/AuthCardFooter.tsx`)
- Instructions text
- Info icon
- Contextual guidance

#### ProxyControlCard (`/components/features/proxy/ProxyControlCard.tsx`)
- Main proxy control UI
- Status display
- Info grid
- Action buttons

#### ProxyInfoGrid (`/components/features/proxy/ProxyInfoGrid.tsx`)
- Port number display
- Uptime display
- Icon headers

#### ProxyControlButtons (`/components/features/proxy/ProxyControlButtons.tsx`)
- Start button
- Stop button
- Loading states

#### ProxyEndpointInfo (`/components/features/proxy/ProxyEndpointInfo.tsx`)
- Proxy URL display
- Configuration instructions

#### SystemStatsCard (`/components/features/stats/SystemStatsCard.tsx`)
- System status overview
- Credentials status
- Proxy status
- Mode indicator

#### ConnectionGuideCard (`/components/features/stats/ConnectionGuideCard.tsx`)
- Quick start guide
- Numbered steps
- Instructional content

#### CredentialsDetailCard (`/components/features/credentials/CredentialsDetailCard.tsx`)
- Detailed credential display
- Token preview
- Expiration date
- Cookie string preview

#### StatusAlert (`/components/features/alerts/StatusAlert.tsx`)
- Success/error alerts
- Icon and message
- Color-coded styling

### UI Components

#### EnvironmentBadge (`/components/ui/EnvironmentBadge.tsx`)
- Desktop/Browser mode indicator
- Animated pulse dot
- Color-coded badge

---

## State Management

### Zustand Stores

#### useCredentialsStore (`/stores/useCredentialsStore.ts`)
**Purpose**: Manage credential state globally

**State**:
```typescript
{
  status: {
    hasCredentials: boolean;
    isValid: boolean;
    expiresAt: number | undefined;
  };
  credentials: {
    token: string;
    cookies: string;
    expiresAt: number;
  } | null;
  loading: boolean;
  error: string | null;
}
```

**Actions**:
- `setStatus(status)` - Update credential status
- `setCredentials(credentials)` - Store credential data
- `clearCredentials()` - Clear all credential data
- `setLoading(loading)` - Set loading state
- `setError(error)` - Set error message

**Persistence**: Saved to localStorage under key `qwen-proxy-credentials`

#### useProxyStore (`/stores/useProxyStore.ts`)
**Purpose**: Manage proxy server state globally

**State**:
```typescript
{
  status: {
    isRunning: boolean;
    port: number | undefined;
    startedAt: number | undefined;
  };
  loading: boolean;
  error: string | null;
}
```

**Actions**:
- `setStatus(status)` - Update proxy status
- `setLoading(loading)` - Set loading state
- `setError(error)` - Set error message

**Persistence**: No persistence (runtime state only)

#### useAlertStore (`/stores/useAlertStore.ts`)
**Purpose**: Manage alert/notification state globally

**State**:
```typescript
{
  alert: {
    type: 'success' | 'error';
    message: string;
  } | null;
}
```

**Actions**:
- `showAlert(type, message)` - Display alert
- `hideAlert()` - Hide alert

**Persistence**: No persistence

### Context Providers

#### ThemeContext (`/contexts/ThemeContext.tsx`)
**Purpose**: Manage theme state (light/dark)

**State**:
```typescript
{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**Behavior**:
- Loads saved theme from localStorage on mount
- Toggles `.dark` class on `document.documentElement`
- Saves theme to localStorage on change
- Defaults to `dark` mode

---

## Services & API Integration

### Services

#### authService (`/services/authService.ts`)
**Purpose**: Handle authentication operations

**Methods**:
- `openLogin()` - Open Qwen login window (Electron) or navigate to login (Browser)
- `extractCredentials()` - Extract credentials from Electron session
- `isElectron()` - Detect if running in Electron

**Dependencies**: window.electronAPI (Electron mode)

#### credentialsService (`/services/credentials.service.ts`)
**Purpose**: API communication for credential management

**Methods**:
- `getCredentialStatus()` - GET `/api/qwen/credentials/status`
- `saveCredentials(credentials)` - POST `/api/qwen/credentials`
- `deleteCredentials()` - DELETE `/api/qwen/credentials`

**Response Format**:
```typescript
{
  hasCredentials: boolean;
  isValid: boolean;
  expiresAt?: number;
}
```

#### proxyService (`/services/proxy.service.ts`)
**Purpose**: API communication for proxy control

**Methods**:
- `startProxy()` - POST `/api/proxy/start`
- `stopProxy()` - POST `/api/proxy/stop`
- `getProxyStatus()` - GET `/api/proxy/status`

**Backend Response Format**:
```typescript
{
  status: 'running' | 'stopped' | 'already_running';
  providerRouter?: {
    running?: boolean;
    port?: number;
    pid?: number;
    uptime?: number;
  };
  qwenProxy?: {
    running?: boolean;
    port?: number;
    pid?: number;
    uptime?: number;
  };
  message: string;
}
```

**Frontend Format** (after conversion):
```typescript
{
  isRunning: boolean;
  port?: number;
  startedAt?: number;
}
```

#### browserExtensionService (`/services/browser-extension.service.ts`)
**Purpose**: Handle browser extension integration

**Methods**:
- `isExtensionInstalled()` - Check if Chrome extension is installed
- `openQwenLogin()` - Open Qwen login page in new tab
- `openInstallInstructions()` - Open extension installation instructions

**Extension ID**: `qwen-proxy-extension`

### Custom Hooks

#### useCredentialPolling (`/hooks/useCredentialPolling.ts`)
**Purpose**: Poll credential status every 5 seconds

**Behavior**:
- Polls `/api/qwen/credentials/status` every 5 seconds
- Stops polling when valid credentials detected
- Updates `useCredentialsStore` with results
- Handles errors gracefully

#### useProxyControl (`/hooks/useProxyControl.ts`)
**Purpose**: Provide proxy control methods with loading states

**Returns**:
```typescript
{
  startProxy: () => Promise<ProxyStatus>;
  stopProxy: () => Promise<ProxyStatus>;
  starting: boolean;
  stopping: boolean;
  error: string | null;
}
```

#### useProxyStatus (`/hooks/useProxyStatus.ts`)
**Purpose**: Poll proxy status and manage state

**Returns**:
```typescript
{
  status: ProxyStatus;
  loading: boolean;
  refetch: () => Promise<void>;
}
```

**Behavior**:
- Polls `/api/proxy/status` periodically
- Updates `useProxyStore`
- Provides manual refetch method

---

## Styling & Theming

### Theme Variables

#### Light Mode Colors (`:root`)
```css
--background: 0 0% 100%;              /* White background */
--foreground: 222.2 84% 4.9%;         /* Dark text */
--card: 0 0% 100%;                    /* White cards */
--primary: 239 84% 67%;               /* Indigo primary */
--secondary: 210 40% 96.1%;           /* Light gray secondary */
--muted: 210 40% 96.1%;               /* Light muted */
--accent: 210 40% 96.1%;              /* Light accent */
--destructive: 0 84.2% 60.2%;         /* Red danger */
--success: 142 76% 36%;               /* Green success */
--border: 214.3 31.8% 91.4%;          /* Light borders */
```

#### Dark Mode Colors (`.dark`)
```css
--background: 222 47% 4%;             /* Near-black background */
--foreground: 210 40% 98%;            /* Off-white text */
--card: 217 33% 17%;                  /* Dark gray cards */
--primary: 239 84% 67%;               /* Indigo primary */
--secondary: 271 91% 65%;             /* Purple secondary */
--muted: 215 25% 27%;                 /* Dark muted */
--accent: 217 33% 22%;                /* Dark accent */
--destructive: 0 84% 60%;             /* Red danger */
--success: 142 76% 45%;               /* Emerald success */
--border: 215 25% 35%;                /* Dark borders */
```

### CSS Class Conventions

**Naming Pattern**: `.[component]-[element]-[modifier]`

**Examples**:
- `.card-base` - Base card styling
- `.card-hover` - Card hover state
- `.card-header` - Card header area
- `.btn-primary` - Primary button
- `.btn-danger` - Danger button
- `.status-badge-active` - Active status badge
- `.title-bar-button` - Title bar button
- `.page-container` - Page container

### Key CSS Classes

**Layout Classes**:
- `.app-layout` - Full-height app container
- `.page-container` - Max-width content container
- `.page-grid` - Grid layout for dashboard
- `.flex-layout-center` - Centered flex layout

**Card Classes**:
- `.card-base` - Base card with gradient, shadow, border
- `.card-hover` - Hover effect on cards
- `.card-header` - Card header with icon and title
- `.card-content` - Card content padding

**Button Classes**:
- `.btn-primary` - Primary action button (indigo/purple gradient)
- `.btn-success` - Success action button (emerald gradient)
- `.btn-danger` - Danger action button (red)
- `.btn-spinner` - Loading spinner in buttons

**Status Classes**:
- `.status-badge-active` - Active status (green pulse)
- `.status-badge-inactive` - Inactive status (gray)
- `.status-badge-expired` - Expired status (red)
- `.status-badge-running` - Running status (green pulse)
- `.status-badge-stopped` - Stopped status (gray)

**Title Bar Classes**:
- `.title-bar` - Title bar container
- `.title-bar-logo` - App logo container
- `.title-bar-button` - Title bar action button
- `.title-bar-button-close` - Close button (red hover)
- `.title-bar-button-icon` - Button icon styling

---

## Technology Stack

### Core Framework
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### State Management
- **Zustand** - Global state management
- **zustand/middleware** - Persistence middleware
- **React Context API** - Theme management

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **CSS Custom Properties** - Theme variables

### UI Components
- **react-icons** - Icon library (VSCode Chrome icons for window controls)
- Custom components - Built from scratch

### Electron Integration
- **Electron IPC** - Communication with main process
- **Context Bridge** - Secure API exposure
- **Session API** - Cookie extraction

### API Communication
- **Fetch API** - HTTP requests
- **REST API** - Backend communication

### Development Tools
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **Vite HMR** - Hot module replacement

### Browser Support
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **Electron** - Desktop application wrapper

---

## File Structure

```
frontend/
├── public/
│   └── extension-install.html         # Extension installation instructions
│
├── src/
│   ├── components/
│   │   ├── features/
│   │   │   ├── alerts/
│   │   │   │   └── StatusAlert.tsx
│   │   │   ├── authentication/
│   │   │   │   ├── AuthenticationCard.tsx
│   │   │   │   ├── AuthButtons.tsx
│   │   │   │   └── AuthCardFooter.tsx
│   │   │   ├── credentials/
│   │   │   │   └── CredentialsDetailCard.tsx
│   │   │   ├── proxy/
│   │   │   │   ├── ProxyControlCard.tsx
│   │   │   │   ├── ProxyControlButtons.tsx
│   │   │   │   ├── ProxyInfoGrid.tsx
│   │   │   │   └── ProxyEndpointInfo.tsx
│   │   │   └── stats/
│   │   │       ├── ConnectionGuideCard.tsx
│   │   │       └── SystemStatsCard.tsx
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── TitleBar.tsx
│   │   └── ui/
│   │       └── EnvironmentBadge.tsx
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/
│   │   ├── useCredentialPolling.ts
│   │   ├── useProxyControl.ts
│   │   └── useProxyStatus.ts
│   │
│   ├── pages/
│   │   └── HomePage.tsx
│   │
│   ├── services/
│   │   ├── authService.ts
│   │   ├── browser-extension.service.ts
│   │   ├── credentials.service.ts
│   │   └── proxy.service.ts
│   │
│   ├── stores/
│   │   ├── useAlertStore.ts
│   │   ├── useCredentialsStore.ts
│   │   └── useProxyStore.ts
│   │
│   ├── types/
│   │   ├── alert.types.ts
│   │   ├── credentials.types.ts
│   │   ├── electron-api.types.ts
│   │   └── proxy.types.ts
│   │
│   ├── App.tsx                        # Root component
│   ├── main.tsx                       # Entry point
│   ├── index.css                      # Global styles and CSS classes
│   └── vite-env.d.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## API Endpoints Required

### Credentials API

#### GET `/api/qwen/credentials/status`
**Purpose**: Get current credential status
**Response**:
```json
{
  "hasCredentials": true,
  "isValid": true,
  "expiresAt": 1699123456789
}
```

#### POST `/api/qwen/credentials`
**Purpose**: Save new credentials
**Body**:
```json
{
  "token": "eyJ...",
  "cookies": "token=...; bx-umidtoken=...",
  "expiresAt": 1699123456789
}
```
**Response**:
```json
{
  "success": true,
  "message": "Credentials saved"
}
```

#### DELETE `/api/qwen/credentials`
**Purpose**: Delete stored credentials
**Response**:
```json
{
  "success": true,
  "message": "Credentials deleted"
}
```

### Proxy API

#### POST `/api/proxy/start`
**Purpose**: Start the proxy server
**Response**:
```json
{
  "status": "running",
  "qwenProxy": {
    "running": true,
    "port": 3001,
    "pid": 12345,
    "uptime": 0
  },
  "message": "Proxy started successfully"
}
```

#### POST `/api/proxy/stop`
**Purpose**: Stop the proxy server
**Response**:
```json
{
  "status": "stopped",
  "message": "Proxy stopped successfully"
}
```

#### GET `/api/proxy/status`
**Purpose**: Get current proxy status
**Response**:
```json
{
  "status": "running",
  "qwenProxy": {
    "running": true,
    "port": 3001,
    "pid": 12345,
    "uptime": 123.45
  },
  "message": "Proxy is running"
}
```

---

## Electron IPC Requirements

### Preload Script Exposed APIs

#### `window.electronAPI.qwen.openLogin()`
**Purpose**: Open Qwen login window
**Returns**: `Promise<void>`
**IPC Channel**: `qwen:open-login`

#### `window.electronAPI.qwen.extractCredentials()`
**Purpose**: Extract credentials from Electron session
**Returns**: `Promise<{token: string, cookies: string, expiresAt: number}>`
**IPC Channel**: `qwen:extract-credentials`

#### `window.electronAPI.window.minimize()`
**Purpose**: Minimize application window
**Returns**: `void`
**IPC Channel**: `window:minimize`

#### `window.electronAPI.window.maximize()`
**Purpose**: Maximize/restore application window
**Returns**: `void`
**IPC Channel**: `window:maximize`

#### `window.electronAPI.window.close()`
**Purpose**: Close application window
**Returns**: `void`
**IPC Channel**: `window:close`

### Main Process IPC Handlers

#### `ipcMain.handle('qwen:open-login')`
**Purpose**: Create BrowserWindow, load chat.qwen.ai, detect login, extract cookies
**Behavior**: Closes window after successful login detected

#### `ipcMain.handle('qwen:extract-credentials')`
**Purpose**: Get all cookies from `.qwen.ai` domain, format as credential object
**Returns**: `{token, cookies, expiresAt}`

#### `ipcMain.on('window:minimize')`
**Purpose**: Call `BrowserWindow.minimize()`

#### `ipcMain.on('window:maximize')`
**Purpose**: Toggle `BrowserWindow.maximize()` / `unmaximize()`

#### `ipcMain.on('window:close')`
**Purpose**: Call `BrowserWindow.close()`

---

## Chrome Extension Requirements

### Extension Manifest
- Manifest V3
- Permissions: `cookies`, `tabs`, host permission for `https://chat.qwen.ai/*`
- Background service worker

### Extension Behavior
1. Monitors navigation to `chat.qwen.ai`
2. Detects successful login via cookie presence
3. Extracts JWT token and cookies
4. POSTs credentials to `http://localhost:3002/api/qwen/credentials`
5. Shows success notification

### Extension Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker for cookie monitoring
- `icons/` - Extension icons (16x16, 32x32, 48x48, 128x128)

---

## Known Issues & Limitations

### Current State
- Theme toggle exists but theme switching may not fully work across all components
- Window controls in Electron may not be fully functional (IPC handlers exist)
- Extension installation instructions are static HTML
- No error retry mechanisms
- No offline support
- Polling could be optimized with WebSockets

### Missing Features
- Settings page for configuration
- Credential history/management
- Proxy logs viewer
- Health check monitoring
- Notification system
- Multi-profile support

---

## Success Criteria

A successful frontend implementation should:

1. ✅ Extract credentials in both Electron and Browser modes
2. ✅ Store credentials to backend API
3. ✅ Poll and display credential status
4. ✅ Start and stop proxy server via API
5. ✅ Display proxy status and endpoint information
6. ✅ Show appropriate loading states during operations
7. ✅ Display success/error feedback to users
8. ✅ Support light and dark themes with toggle
9. ✅ Work seamlessly in both Electron and browser environments
10. ✅ Have professional, polished UI with smooth interactions
11. ✅ Follow architecture guide rules (no hardcoded colors, theme variables only)
12. ✅ Have all files under 125 lines
13. ✅ Use semantic CSS class names (no inline Tailwind)
14. ✅ Provide clear user guidance and instructions

---

## Recommended Implementation Order

### Phase 1: Core Infrastructure (1-2 hours)
1. Set up Vite + React + TypeScript project
2. Install dependencies (Tailwind, Zustand, react-icons)
3. Configure Tailwind with theme variables
4. Create base CSS classes in index.css
5. Set up path aliases (@/)

### Phase 2: State Management (30 min)
1. Create Zustand stores (credentials, proxy, alert)
2. Create ThemeContext
3. Set up localStorage persistence

### Phase 3: Services Layer (1 hour)
1. Implement credentialsService
2. Implement proxyService
3. Implement authService
4. Implement browserExtensionService
5. Add proper error handling

### Phase 4: Layout Components (1 hour)
1. Create AppLayout
2. Create TitleBar with theme toggle
3. Create StatusBar
4. Wire up window controls (Electron)

### Phase 5: Feature Components (2-3 hours)
1. Create AuthenticationCard + subcomponents
2. Create ProxyControlCard + subcomponents
3. Create SystemStatsCard
4. Create ConnectionGuideCard
5. Create CredentialsDetailCard
6. Create StatusAlert
7. Create EnvironmentBadge

### Phase 6: Hooks & Integration (1 hour)
1. Implement useCredentialPolling
2. Implement useProxyControl
3. Implement useProxyStatus
4. Wire up all state management

### Phase 7: HomePage & Testing (1 hour)
1. Compose HomePage with all components
2. Test all user flows
3. Test theme toggling
4. Test in both Electron and browser
5. Polish UI and animations

### Phase 8: Electron Integration (1 hour)
1. Set up Electron IPC handlers in main process
2. Create preload script with exposed APIs
3. Test window controls
4. Test credential extraction
5. Verify frameless window works

**Total Estimated Time**: 8-11 hours for complete implementation

---

## End of Specification

This document contains all necessary information to rebuild the frontend from scratch. Reference this specification when recreating the application to ensure all features and functionality are properly implemented.

**Last Updated**: November 5, 2025
**Document Version**: 1.0
