# Qwen Login Flow Guide

**Document 48** | Last Updated: 2025-11-05

Complete guide to understanding the Qwen credential authentication flow, including Chrome extension integration, polling mechanism, and UI interactions.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Browser vs Electron Flow](#browser-vs-electron-flow)
3. [Chrome Extension Architecture](#chrome-extension-architecture)
4. [Polling Mechanism](#polling-mechanism)
5. [UI Components and Buttons](#ui-components-and-buttons)
6. [State Management](#state-management)
7. [Complete Flow Diagrams](#complete-flow-diagrams)

---

## System Overview

The Qwen login system manages authentication credentials for AI proxy features. It supports two environments:

- **Browser Mode**: Uses Chrome extension to extract credentials from chat.qwen.ai
- **Electron Mode**: Direct credential extraction from embedded browser

### Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Dashboard UI                          │
│  (QwenLoginCard shows status, Re-login, Delete buttons)     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   useCredentials Hook                        │
│  - Manages credential state                                  │
│  - Handles polling (5s interval)                            │
│  - Coordinates login/delete operations                       │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              ▼                               ▼
┌──────────────────────────┐    ┌────────────────────────────┐
│ Browser Extension        │    │  API Server                 │
│ - Detection (PING/PONG)  │    │  - Stores credentials       │
│ - Credential extraction  │    │  - Validates tokens         │
│ - Auto-POST to API       │    │  - Returns status           │
└──────────────────────────┘    └────────────────────────────┘
```

---

## Browser vs Electron Flow

### Browser Flow

**Dependencies:**
- Chrome extension must be installed
- Extension runs on localhost (dashboard-bridge.js) and chat.qwen.ai (content.js)

**Process:**
1. User clicks "Login to Qwen" or "Re-login"
2. Dashboard checks if extension is installed (PING/PONG protocol)
3. Opens chat.qwen.ai in new tab
4. Extension detects login, extracts credentials
5. Extension POSTs credentials to API server
6. Dashboard polling detects credentials within 5 seconds

### Electron Flow

**Dependencies:**
- Electron app with native browser access
- Electron session API for cookie extraction

**Process:**
1. User clicks "Login to Qwen" or "Re-login"
2. Opens new BrowserWindow to chat.qwen.ai (1200x800)
3. User logs in manually in the Electron window
4. Window detects navigation to chat page (not /login)
5. Closes window after 1 second delay
6. Uses `session.defaultSession.cookies.get()` to extract all cookies
7. Parses JWT token to get expiration timestamp
8. Saves credentials to API server via HTTP
9. Updates UI immediately (no polling needed)

**Key Differences from Browser:**
- No extension needed - direct cookie access via Electron APIs
- Synchronous extraction - credentials available immediately after window closes
- Better security - credentials never leave the Electron process
- More reliable - no postMessage, no cross-origin issues

**Important:** Both Electron and Extension return `expiresAt` in **milliseconds** (JavaScript timestamp format compatible with `Date.now()`). JWT tokens have expiration in seconds, which is converted to milliseconds during extraction.

---

## Electron Implementation Details

### Main Process - Opening Login Window

**File:** `electron/src/main.ts`

```typescript
ipcMain.handle('qwen:open-login', async () => {
  return new Promise<void>((resolve, reject) => {
    // Create login window
    qwenLoginWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    qwenLoginWindow.loadURL('https://chat.qwen.ai');

    // Listen for navigation events
    qwenLoginWindow.webContents.on('did-navigate', (event, url) => {
      console.log('[Qwen Login] Navigated to:', url);

      // If user navigated to chat page, they're logged in
      if (url.includes('chat.qwen.ai') && !url.includes('/login')) {
        console.log('[Qwen Login] User appears to be logged in');

        // Close window after a short delay to let cookies settle
        setTimeout(() => {
          qwenLoginWindow?.close();
          qwenLoginWindow = null;
          resolve();
        }, 1000);
      }
    });

    qwenLoginWindow.on('closed', () => {
      qwenLoginWindow = null;
      resolve();
    });
  });
});
```

### Main Process - Extracting Credentials

**File:** `electron/src/main.ts`

```typescript
ipcMain.handle('qwen:extract-credentials', async () => {
  try {
    const defaultSession = session.defaultSession;

    // Get all cookies from qwen.ai domain
    const allCookies = await defaultSession.cookies.get({ domain: '.qwen.ai' });
    console.log('[Qwen Extract] Found cookies:', allCookies.length);

    if (allCookies.length === 0) {
      throw new Error('No cookies found. Please log in to chat.qwen.ai first.');
    }

    // Format cookies as a Cookie header string
    const cookieString = allCookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // Extract PRIMARY token (JWT)
    const tokenCookie = allCookies.find(c => c.name === 'token');

    // Extract SECONDARY bx-umidtoken
    const umidCookie = allCookies.find(c => c.name === 'bx-umidtoken');
    const umidToken = umidCookie?.value || null;

    // Must have at least one token
    if (!tokenCookie && !umidToken) {
      throw new Error('No authentication tokens found.');
    }

    // Decode JWT token to get expiration
    let expiresAt: number | null = null;
    if (tokenCookie?.value) {
      try {
        // Decode JWT (format: header.payload.signature)
        const parts = tokenCookie.value.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          expiresAt = payload.exp * 1000; // Convert seconds to milliseconds
          console.log('[Qwen Extract] Decoded JWT expiration:', new Date(expiresAt).toISOString());
        }
      } catch (error) {
        console.log('[Qwen Extract] Could not decode JWT:', error);
      }
    }

    // Fallback to cookie expiry or default 30 days
    if (!expiresAt) {
      // Electron cookie expirationDate is in seconds, convert to milliseconds
      expiresAt = allCookies.reduce((max, c) => {
        const expiry = c.expirationDate ? c.expirationDate * 1000 : null;
        return expiry && expiry > (max || 0) ? expiry : max;
      }, null as number | null) || (Date.now() + (30 * 24 * 60 * 60 * 1000));
    }

    return {
      token: umidToken || tokenCookie?.value,
      cookies: cookieString,
      expiresAt: expiresAt, // Now in milliseconds
    };

  } catch (error) {
    console.error('[Qwen Extract] Failed to extract credentials:', error);
    throw error;
  }
});
```

### Renderer Process - IPC Service

**File:** `frontend/src/services/electron-ipc.service.ts`

```typescript
class ElectronIPCService {
  private get api() {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI;
  }

  get isAvailable(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  // Qwen authentication
  async openQwenLogin(): Promise<void> {
    await this.api.qwen.openLogin();
  }

  async extractQwenCredentials(): Promise<QwenCredentials> {
    return await this.api.qwen.extractCredentials();
  }
}
```

### Credentials Service - Electron Flow

**File:** `frontend/src/services/credentials.service.ts`

```typescript
class CredentialsService {
  // Use Electron IPC to open login browser (Electron only)
  async openLogin(): Promise<void> {
    if (!electronIPCService.isAvailable) {
      throw new Error('Electron API not available. This feature requires the desktop app.');
    }
    await electronIPCService.openQwenLogin();
  }

  // Use Electron IPC to extract credentials from browser session
  async extractCredentials(): Promise<QwenCredentials> {
    if (!electronIPCService.isAvailable) {
      throw new Error('Electron API not available. This feature requires the desktop app.');
    }
    return await electronIPCService.extractQwenCredentials();
  }

  // Use HTTP API to save credentials to backend
  async saveCredentials(credentials: QwenCredentials): Promise<void> {
    const result = await apiService.saveCredentials(credentials);
    if (!result.success) {
      throw new Error(result.error || 'Failed to save credentials');
    }
  }
}
```

---

## Chrome Extension Architecture

### Extension Components

```
extension/
├── manifest.json          # Manifest V3 configuration
├── background.js         # Service worker (cookies API access)
├── content.js            # Runs on chat.qwen.ai (monitors login)
└── dashboard-bridge.js   # Runs on localhost (extension detection)
```

### Extension Detection (PING/PONG Protocol)

**Purpose:** Dashboard needs to know if extension is installed before attempting login

**Implementation:**

**Dashboard Side** - `frontend/src/services/browser-extension.service.ts`
```typescript
class BrowserExtensionService {
  async isExtensionInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);

      window.postMessage({ type: 'QWEN_PING' }, '*');

      const handler = (e: MessageEvent) => {
        if (e.data?.type === 'QWEN_PONG') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(true);
        }
      };

      window.addEventListener('message', handler);
    });
  }

  async openQwenLogin(): Promise<void> {
    // Delegates to extension via postMessage
    // Extension's dashboard-bridge.js will handle opening the URL
    window.postMessage({ type: 'QWEN_OPEN' }, '*');
  }
}

export const browserExtensionService = new BrowserExtensionService();
```

**Extension Side** - `extension/dashboard-bridge.js`
```javascript
// Dashboard bridge content script - runs on localhost to enable extension detection
console.log('[Qwen Extension] Dashboard bridge loaded on:', window.location.href);

// Listen for extension detection ping from dashboard
window.addEventListener('message', (event) => {
  // Only respond to messages from the same origin
  if (event.source !== window) {
    return;
  }

  if (event.data?.type === 'QWEN_PING') {
    console.log('[Dashboard Bridge] Received QWEN_PING, responding with QWEN_PONG');
    window.postMessage({ type: 'QWEN_PONG' }, '*');
  }

  if (event.data?.type === 'QWEN_OPEN') {
    console.log('[Dashboard Bridge] Received QWEN_OPEN, opening chat.qwen.ai');
    window.open('https://chat.qwen.ai', '_blank');
  }
});

console.log('[Qwen Extension] Dashboard bridge ready');
```

**Why Two Content Scripts?**
- `content.js` runs ONLY on chat.qwen.ai (credential extraction)
- `dashboard-bridge.js` runs ONLY on localhost (extension detection)
- Content scripts are isolated to their matched domains

### Credential Extraction Flow

```
User logs in to chat.qwen.ai
         ↓
content.js detects login (MutationObserver + URL checks)
         ↓
Sends chrome.runtime.sendMessage({ type: 'EXTRACT_CREDENTIALS' })
         ↓
background.js receives message
         ↓
Uses chrome.cookies API to get credentials
         ↓
POSTs credentials to http://localhost:3002/api/qwen/credentials
         ↓
Responds to content.js with success/error
         ↓
content.js shows notification to user
```

### Extension Background Script

**File:** `extension/background.js`

```javascript
/**
 * Extract Qwen credentials from cookies
 */
async function extractCredentials() {
  console.log('[Background] Extracting credentials...');

  try {
    // Get all cookies for qwen.ai domain (background script has access)
    const cookies = await chrome.cookies.getAll({ domain: '.qwen.ai' });

    // Find cookies
    const tokenCookie = cookies.find(c => c.name === 'token');
    const umidTokenCookie = cookies.find(c => c.name === 'bx-umidtoken');

    // Must have at least one token
    if (!tokenCookie && !umidTokenCookie) {
      throw new Error('No authentication tokens found. Please log in first.');
    }

    // Extract values - use umidToken if available, else JWT token
    const token = tokenCookie?.value;
    const umidToken = umidTokenCookie?.value || token;

    // Decode JWT to get expiration
    const expiresAt = token ? getTokenExpiration(token) : null;

    // Build cookie string
    const cookieParts = [];
    if (token) cookieParts.push(`token=${token}`);
    if (umidTokenCookie) cookieParts.push(`bx-umidtoken=${umidTokenCookie.value}`);
    const cookieString = cookieParts.join('; ');

    return {
      token: umidToken,
      cookies: cookieString,
      expiresAt: expiresAt || (Date.now() + (30 * 24 * 60 * 60 * 1000))
    };

  } catch (error) {
    console.error('[Background] Extraction failed:', error);
    throw error;
  }
}

/**
 * POST credentials to API Server
 */
async function postCredentials(credentials) {
  const apiUrl = 'http://localhost:3002/api/qwen/credentials';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

/**
 * Handle messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_CREDENTIALS') {
    (async () => {
      try {
        const credentials = await extractCredentials();
        await postCredentials(credentials);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Respond asynchronously
  }
});
```

---

## Polling Mechanism

### Overview

The dashboard polls the API server every 5 seconds to check credential status. Polling behavior changes based on credential state.

### Complete useCredentials Hook

**File:** `frontend/src/hooks/useCredentials.ts`

```typescript
export function useCredentials() {
  const [status, setStatus] = useState<CredentialStatus>({
    hasCredentials: false,
    isValid: false,
    expiresAt: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

  const loadStatus = async () => {
    try {
      const result = await credentialsService.getCredentialStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to load credential status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Polling effect
  useEffect(() => {
    loadStatus(); // Initial load

    // Only poll if we don't have valid credentials
    if (status.hasCredentials && status.isValid) {
      return; // STOP POLLING - we have valid credentials
    }

    // START POLLING - waiting for credentials or they're invalid
    const pollInterval = setInterval(() => {
      loadStatus();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [refreshKey, status.hasCredentials, status.isValid]);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      // Clear old credentials first to restart polling
      if (status.hasCredentials) {
        await credentialsService.deleteCredentials();
        setRefreshKey((k) => k + 1);
      }

      if (isElectron) {
        // Electron flow: direct extraction
        await credentialsService.openLogin();
        const credentials = await credentialsService.extractCredentials();
        await credentialsService.saveCredentials(credentials);
        setRefreshKey((k) => k + 1);
      } else {
        // Browser flow: extension handles extraction
        const extensionInstalled = await browserExtensionService.isExtensionInstalled();

        if (!extensionInstalled) {
          browserExtensionService.openInstallInstructions();
          setError('Please install the browser extension to login');
          setLoading(false);
          return;
        }

        // Open login page - extension will auto-extract and POST to API
        await browserExtensionService.openQwenLogin();
        setLoading(false);
        // Polling will detect new credentials within 5 seconds
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      console.error('Login failed:', err);
      setLoading(false);
      throw err;
    }
  };

  const deleteCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      await credentialsService.deleteCredentials();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete credentials';
      setError(message);
      console.error('Failed to delete credentials:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    status,
    loading,
    error,
    isElectron,
    login,
    deleteCredentials,
  };
}
```

### Polling States

### Polling Behavior Table

| Credential State           | Polling Active? | Reason                                    |
|----------------------------|-----------------|-------------------------------------------|
| No credentials             | ✅ Yes          | Waiting for extension to POST credentials |
| Has credentials (valid)    | ❌ No           | No need - we know expiry time             |
| Has credentials (expired)  | ✅ Yes          | Waiting for re-login                      |
| After delete              | ✅ Yes          | State changed, effect re-runs             |

### Why Stop Polling?

**Benefits:**
- Reduces unnecessary API calls (5 req/minute → 0 when authenticated)
- Credential expiry is known client-side (no need to poll)

**How It Restarts:**
- useEffect dependencies: `[refreshKey, status.hasCredentials, status.isValid]`
- When any dependency changes, effect re-runs
- Deleting credentials changes `status.hasCredentials` → polling restarts

---

## UI Components and Buttons

### QwenLoginCard Component

**Desktop:** `frontend/src/components/features/dashboard/QwenLoginCard.tsx`
**Mobile:** `frontend/src/pages/dashboard/MobileDashboardMainPage.tsx`

### Button Behaviors

#### Login / Re-login Button

**Label:**
- "Login to Qwen" (when no credentials)
- "Re-login" (when credentials exist)

**Behavior:**
```typescript
const login = async () => {
  // 1. Clear old credentials first (if they exist)
  if (status.hasCredentials) {
    await credentialsService.deleteCredentials();
    setRefreshKey((k) => k + 1); // Triggers polling restart
  }

  // 2. Check extension installed (browser mode only)
  if (!isElectron) {
    const extensionInstalled = await browserExtensionService.isExtensionInstalled();
    if (!extensionInstalled) {
      // Show extension install instructions
      return;
    }
  }

  // 3. Open Qwen login page
  if (isElectron) {
    // Electron: Open embedded browser, extract directly
    await credentialsService.openLogin();
    const credentials = await credentialsService.extractCredentials();
    await credentialsService.saveCredentials(credentials);
  } else {
    // Browser: Open in new tab, extension handles extraction
    await browserExtensionService.openQwenLogin();
    // Polling will detect new credentials within 5 seconds
  }
};
```

**Why Delete First?**
- Clears old token (actual "re-login")
- Changes `status.hasCredentials` to `false`
- Triggers useEffect to restart polling
- Ensures new credentials are detected

#### Delete Button

**Label:** Trash icon (🗑️)

**Behavior:**
```typescript
const deleteCredentials = async () => {
  // 1. Confirm with user
  if (!confirm('Delete credentials?')) return;

  // 2. Delete from API server
  await credentialsService.deleteCredentials();

  // 3. Trigger state refresh
  setRefreshKey((k) => k + 1);

  // Result: polling restarts automatically
};
```

### Credential Status Display

```typescript
interface CredentialStatus {
  hasCredentials: boolean;  // Do credentials exist?
  isValid: boolean;         // Are they unexpired?
  expiresAt?: number;       // Unix timestamp
}
```

**UI States:**

| State                    | Badge Color | Badge Text      | Buttons Shown   |
|--------------------------|-------------|-----------------|-----------------|
| No credentials           | Gray        | Not Logged In   | Login           |
| Valid credentials        | Green       | Authenticated   | Re-login, Delete|
| Expired credentials      | Red         | Expired         | Re-login, Delete|

---

## State Management

### useCredentials Hook

**Location:** `frontend/src/hooks/useCredentials.ts`

**State Variables:**
```typescript
const [status, setStatus] = useState<CredentialStatus>({
  hasCredentials: false,
  isValid: false,
  expiresAt: undefined,
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [refreshKey, setRefreshKey] = useState(0); // Triggers re-fetch
```

### refreshKey Pattern

**Purpose:** Force useEffect to re-run without changing actual data

**Usage:**
```typescript
// After any operation that changes credentials
setRefreshKey((k) => k + 1);

// useEffect dependency
useEffect(() => {
  // Re-runs when refreshKey changes
}, [refreshKey, ...]);
```

**Why Not Just Update State Directly?**
- Credentials are stored server-side
- Client state might be stale
- Incrementing refreshKey forces fresh fetch from API

---

## Complete Flow Diagrams

### First Time Login (Electron Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Login to Qwen"                              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend calls credentialsService.openLogin()            │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. IPC call to main process: qwen:open-login                │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Main process creates BrowserWindow (1200x800)            │
│    Loads https://chat.qwen.ai                               │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. User logs in manually in the Electron window             │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Main process detects navigation to chat page (not /login)│
│    Waits 1 second for cookies to settle                     │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Window closes, IPC promise resolves                      │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend calls credentialsService.extractCredentials()   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. IPC call to main process: qwen:extract-credentials       │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Main process uses session.defaultSession.cookies.get()  │
│     Extracts all cookies from .qwen.ai domain               │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Decodes JWT token to get expiration timestamp           │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. Returns credentials object to renderer process          │
│     { token, cookies, expiresAt }                           │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 13. Frontend calls credentialsService.saveCredentials()     │
│     POSTs to API server via HTTP                            │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 14. Increments refreshKey to trigger state refresh          │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 15. UI updates immediately, shows "Authenticated"           │
│     No polling needed - credentials already in state        │
└─────────────────────────────────────────────────────────────┘
```

### First Time Login (Browser Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Login to Qwen"                              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Check if extension installed (PING/PONG)                 │
└────────────────────────┬────────────────────────────────────┘
                         ▼
                   ┌─────┴─────┐
                   │ Installed?│
                   └─────┬─────┘
              No ◄───────┤───────► Yes
               │         │          │
               ▼         │          ▼
    ┌──────────────────┐│  ┌──────────────────────┐
    │ Show install     ││  │ Open chat.qwen.ai    │
    │ instructions     ││  │ in new tab           │
    └──────────────────┘│  └──────────┬───────────┘
                        │             ▼
                        │  ┌──────────────────────┐
                        │  │ User logs in to Qwen │
                        │  └──────────┬───────────┘
                        │             ▼
                        │  ┌──────────────────────┐
                        │  │ content.js detects   │
                        │  │ login via DOM watch  │
                        │  └──────────┬───────────┘
                        │             ▼
                        │  ┌──────────────────────┐
                        │  │ background.js gets   │
                        │  │ cookies, POSTs to API│
                        │  └──────────┬───────────┘
                        │             ▼
                        │  ┌──────────────────────┐
                        │  │ Polling detects new  │
                        │  │ credentials (< 5s)   │
                        │  └──────────┬───────────┘
                        │             ▼
                        │  ┌──────────────────────┐
                        │  │ UI updates, shows    │
                        │  │ "Authenticated"      │
                        │  └──────────────────────┘
                        │
                        ▼
                    (END)
```

### Re-login Flow (Browser Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User has valid credentials, clicks "Re-login"            │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Delete old credentials from API                          │
│    - status.hasCredentials changes to false                 │
│    - Triggers useEffect dependency change                   │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. useEffect re-runs                                        │
│    - Condition: if (false && false) return // FALSE         │
│    - Polling STARTS (setInterval)                           │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Open chat.qwen.ai (extension extracts credentials)       │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Polling detects new credentials within 5 seconds         │
│    - status.hasCredentials = true, isValid = true           │
│    - Triggers useEffect again                               │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. useEffect re-runs                                        │
│    - Condition: if (true && true) return // TRUE            │
│    - Polling STOPS (clearInterval)                          │
└────────────────────────┬────────────────────────────────────┘
                         ▼
                      (END)
```

### Credential Expiry Detection

```
┌─────────────────────────────────────────────────────────────┐
│ User has valid credentials, polling is STOPPED              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
                   Time passes...
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ expiresAt timestamp is reached                              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
                   ┌─────────────┐
                   │ How do we   │
                   │ detect it?  │
                   └─────┬───────┘
                         ▼
          CLIENT-SIDE CHECK ONLY
          (No polling needed!)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ UI checks: Date.now() > status.expiresAt                    │
│ - Badge shows "Expired" (red)                               │
│ - Button still says "Re-login"                              │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Re-login"                                      │
│ → Follows re-login flow above                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Issues and Solutions

### Extension Not Detected

**Symptom:** "Please install browser extension" message appears even though extension is installed

**Causes:**
1. Extension not reloaded after code changes
2. Dashboard-bridge.js not running on localhost
3. postMessage blocked by browser security

**Solution:**
1. Go to `chrome://extensions/`
2. Click reload on "Qwen Credential Extractor"
3. Hard refresh dashboard (Cmd+Shift+R)
4. Check browser console for `[Qwen Extension] Dashboard bridge loaded`

### Polling Not Detecting New Credentials

**Symptom:** Clicked re-login, logged in to Qwen, but dashboard still shows old/no credentials

**Causes:**
1. Extension didn't POST to API (check extension console)
2. API server not running on port 3002
3. Polling stopped (should restart on delete)

**Solution:**
1. Check extension console: `[Content Script] Background response: { success: true }`
2. Check API server running: `curl http://localhost:3002/api/qwen/credentials/status`
3. Manually click "Delete" then "Login" to force polling restart

### Credentials Not Clearing on Re-login

**Symptom:** Old credentials persist after re-login

**Cause:** Delete step missing from login flow

**Solution:**
- Fixed in current implementation (lines 49-53 of useCredentials.ts)
- Old credentials now deleted before opening login page

---

## Testing Checklist

### Browser Flow Testing

- [ ] Extension detection works (PING/PONG)
- [ ] First time login opens Qwen and extracts credentials
- [ ] Polling detects credentials within 5 seconds
- [ ] Re-login deletes old credentials first
- [ ] Polling restarts after re-login
- [ ] Delete button clears credentials
- [ ] UI shows correct status badges
- [ ] Expired credentials show as "Expired"

### Electron Flow Testing

- [ ] Login opens embedded browser
- [ ] Credentials extracted directly
- [ ] No polling delay
- [ ] Re-login clears old credentials
- [ ] Delete button works

### Edge Cases

- [ ] Login while already logged in (re-login)
- [ ] Network error during extraction
- [ ] API server offline
- [ ] Extension not installed
- [ ] Token expires while using app

---

## File Reference

### Frontend Files
- `frontend/src/hooks/useCredentials.ts` - Main hook managing credential state and polling
- `frontend/src/services/credentials.service.ts` - API communication
- `frontend/src/services/browser-extension.service.ts` - Extension detection
- `frontend/src/components/features/dashboard/QwenLoginCard.tsx` - Desktop UI
- `frontend/src/pages/dashboard/MobileDashboardMainPage.tsx` - Mobile UI

### Backend Files
- `backend/api-server/src/routes/qwen-credentials.routes.js` - API endpoints
- `backend/api-server/src/index.js` - Routes mounted at `/api/qwen/credentials`

### Extension Files
- `extension/manifest.json` - Extension configuration
- `extension/background.js` - Service worker (cookies API)
- `extension/content.js` - Runs on chat.qwen.ai
- `extension/dashboard-bridge.js` - Runs on localhost

---

## Future Improvements

### Potential Enhancements

1. **Adaptive Polling**
   - Slow down polling to 30s after initial detection
   - Speed up polling as expiry approaches
   - Stop completely when credentials valid

2. **Background Token Refresh**
   - Automatically refresh token 24 hours before expiry
   - Silent re-authentication without user action

3. **Multiple Account Support**
   - Store multiple Qwen accounts
   - Switch between accounts
   - Account-specific provider mappings

4. **Better Error Handling**
   - Implement global error handling (see doc 46)
   - Circuit breaker for failed extractions
   - Retry logic with exponential backoff

5. **Security Improvements**
   - Encrypt credentials in storage
   - Auto-delete on repeated failed validations
   - Session timeout configuration

---

## Related Documents

- **Doc 26**: Backend Architecture Complete Guide
- **Doc 45**: Chrome Extension Implementation Plan (Phase 8)
- **Doc 46**: Global Error Handling Implementation Plan
- **Doc 47**: Instructions System Guide

---

**Questions or Issues?**

If you encounter problems with the login flow:
1. Check browser console for extension logs
2. Check API server logs (`backend/api-server/logs/`)
3. Verify polling state with React DevTools
4. Review this guide's troubleshooting section
