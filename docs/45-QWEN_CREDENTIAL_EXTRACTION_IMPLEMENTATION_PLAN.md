# Document 45: Qwen Credential Extraction Implementation Plan

**Created:** 2025-11-05
**Status:** Active Implementation Plan
**Purpose:** Comprehensive implementation plan for Chrome Extension-based Qwen credential extraction

---

## Work Progression Tracking

| Phase | Priority | Status | Dependencies | Files Modified | Files Created |
|-------|----------|--------|--------------|----------------|---------------|
| Phase 1: Types & Interfaces | P0 | Pending | None | 1 | 0 |
| Phase 2: Backend API Endpoint | P0 | Pending | Phase 1 | 2 | 1 |
| Phase 3: Frontend Services | P1 | Pending | Phase 1, 2 | 2 | 0 |
| Phase 4: Frontend Hooks | P1 | Pending | Phase 3 | 1 | 0 |
| Phase 5: Extension Structure | P2 | Pending | None | 0 | 4 |
| Phase 6: Extension Cookie Logic | P2 | Pending | Phase 5 | 1 | 0 |
| Phase 7: Extension API Communication | P2 | Pending | Phase 2, 6 | 1 | 0 |
| Phase 8: Frontend Component Updates | P3 | Pending | Phase 4 | 1 | 0 |
| Phase 9: Testing & Validation | P3 | Pending | All | 0 | 1 |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Implementation Phases](#implementation-phases)
5. [Integration Points](#integration-points)
6. [Validation Criteria](#validation-criteria)

---

## Overview

### Problem Statement

The current Electron-based Qwen authentication approach has failed multiple times:
1. Service worker connection errors
2. Cookie extraction not working
3. Communication between extension and frontend failing

### Solution

Implement a simplified architecture:
1. **Chrome Extension** extracts cookies from `chat.qwen.ai`
2. **Extension POSTs** credentials directly to API Server (`http://localhost:3002/api/qwen/credentials`)
3. **Frontend polls** API Server every 5 seconds to detect credential updates
4. **No postMessage communication** between extension and frontend

### Key Benefits

- **Simpler**: No complex postMessage synchronization
- **More Reliable**: Extension works independently of frontend
- **Automatic**: User just logs in, extension handles everything
- **Testable**: Each component can be tested independently

---

## Architecture

### Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Workflow                             │
│                                                              │
│  1. User opens https://chat.qwen.ai in Chrome              │
│  2. User logs in with credentials                           │
│  3. Extension detects login, extracts cookies               │
│  4. Extension POSTs to API Server                           │
│  5. Frontend polls API, detects new credentials             │
│  6. UI updates to show "Authenticated"                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Technical Architecture                      │
│                                                              │
│  ┌────────────────┐         ┌─────────────────┐            │
│  │ Chrome         │         │  API Server     │            │
│  │ Extension      │  POST   │  Port 3002      │            │
│  │                ├────────►│                 │            │
│  │ - Extract      │         │ POST /api/qwen/ │            │
│  │   cookies      │         │      credentials│            │
│  │ - Decode JWT   │         │                 │            │
│  │ - Build        │         │ - Validate      │            │
│  │   payload      │         │ - Store in DB   │            │
│  └────────────────┘         └────────┬────────┘            │
│                                      │                      │
│                                      │ GET (poll)           │
│                                      │                      │
│                             ┌────────▼────────┐             │
│                             │   Frontend      │             │
│                             │   React App     │             │
│                             │                 │             │
│                             │ - Poll every 5s │             │
│                             │ - Update UI     │             │
│                             └─────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Extension Extraction:
  1. Monitor navigation to chat.qwen.ai
  2. Extract cookies: "token", "bx-umidtoken"
  3. Decode JWT to get expiration
  4. Build payload: { token, cookies, expiresAt }
  5. POST to http://localhost:3002/api/qwen/credentials

API Server Processing:
  1. Receive POST request
  2. Validate payload structure
  3. Validate token not expired
  4. Store in database (qwen_credentials table)
  5. Return success/failure

Frontend Polling:
  1. Every 5 seconds, GET /api/qwen/credentials
  2. Check hasCredentials and isValid
  3. Update component state
  4. UI reflects authentication status
```

---

## File Structure

### Final Project Structure

```
qwen_proxy_opencode/
├── extension/                          # Chrome Extension
│   ├── manifest.json                   # Extension manifest V3
│   ├── background.js                   # Background service worker
│   ├── content.js                      # Content script (chat.qwen.ai)
│   ├── utils/
│   │   └── jwt-decoder.js             # JWT decoding utility
│   └── icon/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── backend/
│   └── api-server/
│       └── src/
│           ├── routes/
│           │   └── qwen.routes.js      # MODIFIED: Add credentials endpoint
│           ├── controllers/
│           │   └── qwen.controller.js  # CREATED: Credential handling
│           └── services/
│               └── qwen.service.js     # MODIFIED: Add credential methods
│
└── frontend/
    └── src/
        ├── types/
        │   └── index.ts                # MODIFIED: QwenCredentials type
        ├── services/
        │   ├── api.service.ts          # INTEGRATION POINT (no changes)
        │   ├── credentials.service.ts  # INTEGRATION POINT (no changes)
        │   └── browser-extension.service.ts  # MODIFIED: Remove extractCredentials
        ├── hooks/
        │   └── useCredentials.ts       # MODIFIED: Add polling, simplify flows
        └── components/
            └── features/
                └── dashboard/
                    └── QwenLoginCard.tsx  # INTEGRATION POINT (no changes)
```

---

## Implementation Phases

---

## Phase 1: Types & Interfaces

**Priority:** P0 (Foundation)
**Dependencies:** None

### Objective

Ensure all TypeScript types are properly defined for credential handling across frontend and backend.

### Files Modified

#### 1. `/frontend/src/types/index.ts`

**Changes Required:**
- Verify `QwenCredentials` interface exists
- Verify `CredentialStatus` interface exists
- Add JSDoc comments if missing

**Expected Interface:**
```typescript
export interface QwenCredentials {
  token: string;           // JWT token value
  cookies: string;         // Cookie string for API calls
  expiresAt: number;       // Unix timestamp
}

export interface CredentialStatus {
  hasCredentials: boolean;
  isValid: boolean;
  expiresAt?: number;
}
```

### Integration Points

- Used by: `api.service.ts`, `credentials.service.ts`, `useCredentials.ts`
- Used by: Backend API controller

### Validation

- [ ] TypeScript compilation passes
- [ ] No type errors in dependent files
- [ ] Interfaces match backend expectations

---

## Phase 2: Backend API Endpoint

**Priority:** P0 (Foundation)
**Dependencies:** Phase 1

### Objective

Create API endpoint to receive credentials from extension and store in database.

### Files Created

#### 1. `/backend/api-server/src/controllers/qwen.controller.js`

**Purpose:** Handle credential-related requests

**Responsibilities:**
- Receive POST request with credentials
- Validate payload structure
- Validate token not expired
- Call service layer to store credentials
- Return success/failure response

**Key Functions:**
```javascript
async saveCredentials(req, res) {
  // 1. Validate request body
  // 2. Check token expiration
  // 3. Call qwenService.saveCredentials()
  // 4. Return 200 or 400/500
}

async getCredentials(req, res) {
  // 1. Call qwenService.getCredentials()
  // 2. Return credentials or null
}

async deleteCredentials(req, res) {
  // 1. Call qwenService.deleteCredentials()
  // 2. Return success
}
```

### Files Modified

#### 2. `/backend/api-server/src/routes/qwen.routes.js`

**Changes Required:**
- Add `POST /api/qwen/credentials` route
- Add `GET /api/qwen/credentials` route (may already exist)
- Add `DELETE /api/qwen/credentials` route (may already exist)
- Wire up to controller

**Expected Routes:**
```javascript
router.post('/credentials', qwenController.saveCredentials);
router.get('/credentials', qwenController.getCredentials);
router.delete('/credentials', qwenController.deleteCredentials);
```

#### 3. `/backend/api-server/src/services/qwen.service.js`

**Changes Required:**
- Add `saveCredentials(credentials)` method
- Add `getCredentials()` method (may already exist)
- Add `deleteCredentials()` method (may already exist)

**Database Operations:**
```javascript
async saveCredentials(credentials) {
  // 1. Upsert into qwen_credentials table
  // 2. Store: token, cookies, expiresAt
  // 3. Return success/failure
}
```

### Integration Points

- **Database:** `qwen_credentials` table (assumed to exist)
- **Used by:** Chrome Extension (POST), Frontend (GET/DELETE)

### Validation

- [ ] `POST /api/qwen/credentials` returns 200 on valid payload
- [ ] `POST /api/qwen/credentials` returns 400 on invalid payload
- [ ] `GET /api/qwen/credentials` returns stored credentials
- [ ] `DELETE /api/qwen/credentials` removes credentials
- [ ] Test with curl before building extension

**Test Commands:**
```bash
# Test POST
curl -X POST http://localhost:3002/api/qwen/credentials \
  -H "Content-Type: application/json" \
  -d '{"token":"test","cookies":"test","expiresAt":9999999999999}'

# Test GET
curl http://localhost:3002/api/qwen/credentials

# Test DELETE
curl -X DELETE http://localhost:3002/api/qwen/credentials
```

---

## Phase 3: Frontend Services

**Priority:** P1 (Foundation)
**Dependencies:** Phase 1, 2

### Objective

Update frontend services to support simplified credential flow (no postMessage).

### Files Modified

#### 1. `/frontend/src/services/browser-extension.service.ts`

**Changes Required:**
- **DELETE** `extractCredentials()` method (lines 22-45)
- **KEEP** `isExtensionInstalled()` method
- **KEEP** `openInstallInstructions()` method
- **KEEP** `openQwenLogin()` method

**Rationale:**
- Extension POSTs directly to API
- Frontend polls API (no need to request credentials from extension)
- Other methods are still useful utilities

**Before (lines 22-45):**
```typescript
async extractCredentials(): Promise<QwenCredentials> {
  // ... complex postMessage communication
}
```

**After:**
```typescript
// Method removed entirely
```

#### 2. `/frontend/src/services/credentials.service.ts`

**Changes Required:**
- Verify `getCredentialStatus()` method exists and works correctly
- Ensure it calls `apiService.getCredentials()`
- Ensure it checks `expiresAt > Date.now()`

**No changes needed if already correct** (from earlier review, this file looks good).

### Integration Points

- **Uses:** `apiService` (no changes needed)
- **Used by:** `useCredentials` hook

### Validation

- [ ] TypeScript compilation passes
- [ ] `browser-extension.service.ts` has 3 methods (not 4)
- [ ] `credentials.service.ts` correctly validates expiration

---

## Phase 4: Frontend Hooks

**Priority:** P1 (Foundation)
**Dependencies:** Phase 3

### Objective

Add polling to detect credential updates and simplify browser flows.

### Files Modified

#### 1. `/frontend/src/hooks/useCredentials.ts`

**Changes Required:**

**Change 1: Add Polling (lines 29-31)**

Before:
```typescript
useEffect(() => {
  loadStatus();
}, [refreshKey]);
```

After:
```typescript
useEffect(() => {
  loadStatus(); // Initial load

  // Poll every 5 seconds for credential updates
  const pollInterval = setInterval(() => {
    loadStatus();
  }, 5000);

  return () => clearInterval(pollInterval);
}, [refreshKey]);
```

**Change 2: Simplify Browser Login Flow (lines 43-58)**

Before:
```typescript
} else {
  // Web browser flow - just open login page
  const extensionInstalled = await browserExtensionService.isExtensionInstalled();

  if (!extensionInstalled) {
    browserExtensionService.openInstallInstructions();
    setError('Please install the browser extension to login');
    setLoading(false);
    return;
  }

  // Just open the login page - user will login manually
  // Then click Refresh button to extract credentials
  await browserExtensionService.openQwenLogin();
  setLoading(false);
}
```

After:
```typescript
} else {
  // Web browser flow - check extension installed
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
  // Polling will detect credentials within 5 seconds
}
```

**Change 3: Simplify Browser Refresh Flow (lines 76-86)**

Before:
```typescript
} else {
  // Web browser flow - extract from already logged in session
  const extensionInstalled = await browserExtensionService.isExtensionInstalled();

  if (!extensionInstalled) {
    setError('Please install the browser extension');
    return;
  }

  const credentials = await browserExtensionService.extractCredentials();
  await credentialsService.saveCredentials(credentials);
}
```

After:
```typescript
} else {
  // Web browser flow - just reload from API
  // Extension auto-posts credentials when logged in
  await loadStatus();
}
```

### Integration Points

- **Uses:** `credentialsService`, `browserExtensionService`
- **Used by:** `QwenLoginCard` component

### Validation

- [ ] Polling interval runs every 5 seconds
- [ ] Polling stops when component unmounts
- [ ] Browser login flow no longer calls `extractCredentials()`
- [ ] Browser refresh flow just reloads from API
- [ ] TypeScript compilation passes

---

## Phase 5: Extension Structure

**Priority:** P2 (Extension Foundation)
**Dependencies:** None (can work in parallel with frontend)

### Objective

Create basic Chrome Extension structure with manifest and placeholder files.

### Files Created

#### 1. `/extension/manifest.json`

**Purpose:** Chrome Extension Manifest V3 configuration

**Key Configuration:**
```json
{
  "manifest_version": 3,
  "name": "Qwen Credential Extractor",
  "version": "1.0.0",
  "description": "Extracts Qwen authentication credentials",

  "permissions": [
    "cookies"
  ],

  "host_permissions": [
    "*://*.qwen.ai/*",
    "http://localhost:3002/*"
  ],

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": ["*://chat.qwen.ai/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],

  "icons": {
    "16": "icon/icon16.png",
    "48": "icon/icon48.png",
    "128": "icon/icon128.png"
  }
}
```

#### 2. `/extension/background.js`

**Purpose:** Background service worker (minimal for now)

**Initial Content:**
```javascript
// Background service worker
console.log('[Qwen Extension] Background service worker loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message);

  if (message.type === 'CREDENTIALS_EXTRACTED') {
    console.log('[Background] Credentials extracted:', message.data);
    sendResponse({ success: true });
  }

  return true;
});
```

#### 3. `/extension/content.js`

**Purpose:** Content script that runs on chat.qwen.ai (placeholder)

**Initial Content:**
```javascript
// Content script for chat.qwen.ai
console.log('[Qwen Extension] Content script loaded on:', window.location.href);

// Placeholder - will add logic in Phase 6
```

#### 4. `/extension/utils/jwt-decoder.js`

**Purpose:** Utility to decode JWT token and extract expiration

**Content:**
```javascript
/**
 * Decode JWT token and extract payload
 * @param {string} token - JWT token
 * @returns {object} Decoded payload
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[JWT Decoder] Failed to decode token:', error);
    return null;
  }
}

/**
 * Extract expiration timestamp from JWT
 * @param {string} token - JWT token
 * @returns {number|null} Unix timestamp in milliseconds, or null if invalid
 */
function getTokenExpiration(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // JWT exp is in seconds, convert to milliseconds
  return payload.exp * 1000;
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { decodeJWT, getTokenExpiration };
}
```

### Icons

**Note:** Use placeholder icons for now. Can be generated using:
```bash
# Create icon directory
mkdir -p extension/icon

# Use ImageMagick or online tool to create simple icons
# For now, copy any PNG and resize to 16x16, 48x48, 128x128
```

### Integration Points

- **None yet** - this is foundation only

### Validation

- [ ] Extension loads in Chrome without errors
- [ ] Navigate to `chrome://extensions/`
- [ ] Enable "Developer mode"
- [ ] Click "Load unpacked" and select `/extension` folder
- [ ] Extension appears in list
- [ ] Background service worker logs appear in service worker console
- [ ] Navigate to `chat.qwen.ai` and verify content script logs appear

---

## Phase 6: Extension Cookie Logic

**Priority:** P2 (Extension Core)
**Dependencies:** Phase 5

### Objective

Implement cookie extraction logic in content script.

### Files Modified

#### 1. `/extension/content.js`

**Changes Required:**
Replace placeholder with full extraction logic.

**Implementation:**

```javascript
// Content script for chat.qwen.ai
console.log('[Qwen Extension] Content script loaded on:', window.location.href);

// Import JWT decoder
// Note: In manifest, add jwt-decoder.js to content_scripts
const { getTokenExpiration } = (() => {
  // Inline the JWT decoder or import it
  function decodeJWT(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('[JWT Decoder] Failed:', error);
      return null;
    }
  }

  function getTokenExpiration(token) {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return null;
    return payload.exp * 1000; // Convert to milliseconds
  }

  return { getTokenExpiration };
})();

/**
 * Extract Qwen cookies from current page
 */
async function extractCredentials() {
  console.log('[Content Script] Extracting credentials...');

  try {
    // Get all cookies for qwen.ai domain
    const cookies = await chrome.cookies.getAll({ domain: '.qwen.ai' });
    console.log('[Content Script] Found cookies:', cookies.length);

    // Find required cookies
    const tokenCookie = cookies.find(c => c.name === 'token');
    const umidTokenCookie = cookies.find(c => c.name === 'bx-umidtoken');

    if (!tokenCookie || !umidTokenCookie) {
      console.log('[Content Script] Required cookies not found');
      return null;
    }

    console.log('[Content Script] Found required cookies');

    // Extract values
    const token = tokenCookie.value;
    const umidToken = umidTokenCookie.value;

    // Decode JWT to get expiration
    const expiresAt = getTokenExpiration(token);

    if (!expiresAt) {
      console.error('[Content Script] Failed to decode JWT expiration');
      return null;
    }

    // Build credentials object
    const credentials = {
      token: umidToken,           // API uses umidToken
      cookies: `token=${token}; bx-umidtoken=${umidToken}`,
      expiresAt: expiresAt
    };

    console.log('[Content Script] Credentials extracted:', {
      hasToken: !!credentials.token,
      hasCookies: !!credentials.cookies,
      expiresAt: new Date(credentials.expiresAt).toISOString()
    });

    return credentials;

  } catch (error) {
    console.error('[Content Script] Extraction failed:', error);
    return null;
  }
}

/**
 * Check if user is logged in by looking for auth indicators
 */
function isLoggedIn() {
  // Check for common logged-in indicators on chat.qwen.ai
  // This may need adjustment based on actual page structure

  // Check if URL indicates logged-in state
  const url = window.location.href;
  if (url.includes('/login') || url.includes('/signin')) {
    return false;
  }

  // Check for user profile elements (adjust selectors as needed)
  const hasUserProfile = document.querySelector('[data-user-id]') !== null ||
                         document.querySelector('.user-profile') !== null ||
                         document.querySelector('[class*="avatar"]') !== null;

  return hasUserProfile;
}

/**
 * Monitor for login completion
 */
function monitorLogin() {
  console.log('[Content Script] Monitoring for login...');

  // Check immediately
  if (isLoggedIn()) {
    console.log('[Content Script] Already logged in, extracting credentials');
    handleLoginDetected();
    return;
  }

  // Watch for navigation/DOM changes indicating login
  const observer = new MutationObserver((mutations) => {
    if (isLoggedIn()) {
      console.log('[Content Script] Login detected via DOM change');
      observer.disconnect();
      handleLoginDetected();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also listen for URL changes
  let lastUrl = window.location.href;
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('[Content Script] URL changed:', currentUrl);

      if (isLoggedIn()) {
        observer.disconnect();
        handleLoginDetected();
      }
    }
  }, 1000);
}

/**
 * Handle login detection - extract and send credentials
 */
async function handleLoginDetected() {
  console.log('[Content Script] Handling login...');

  // Wait a bit for cookies to be set
  await new Promise(resolve => setTimeout(resolve, 2000));

  const credentials = await extractCredentials();

  if (!credentials) {
    console.error('[Content Script] Failed to extract credentials');
    return;
  }

  // Notify background script (for logging)
  chrome.runtime.sendMessage({
    type: 'CREDENTIALS_EXTRACTED',
    data: credentials
  });

  // POST will be added in Phase 7
  console.log('[Content Script] Ready to POST credentials (Phase 7)');
}

// Start monitoring when script loads
monitorLogin();
```

### Integration Points

- **Uses:** Chrome Cookies API
- **Uses:** JWT decoder utility
- **Prepares for:** Phase 7 (API communication)

### Validation

- [ ] Extension logs "Content script loaded" when visiting chat.qwen.ai
- [ ] After logging in, extension logs "Login detected"
- [ ] Extension logs "Credentials extracted" with details
- [ ] Credentials object has `token`, `cookies`, `expiresAt` properties
- [ ] `expiresAt` is a valid future timestamp
- [ ] Test by opening chat.qwen.ai, logging in, checking console

---

## Phase 7: Extension API Communication

**Priority:** P2 (Extension Complete)
**Dependencies:** Phase 2 (API endpoint), Phase 6 (Cookie extraction)

### Objective

Add HTTP POST to send extracted credentials to API Server.

### Files Modified

#### 1. `/extension/content.js`

**Changes Required:**
Add POST logic to `handleLoginDetected()` function.

**Implementation:**

Replace this line in `handleLoginDetected()`:
```javascript
// POST will be added in Phase 7
console.log('[Content Script] Ready to POST credentials (Phase 7)');
```

With:
```javascript
// POST credentials to API Server
await postCredentials(credentials);
```

And add this new function:
```javascript
/**
 * POST credentials to API Server
 * @param {object} credentials - Extracted credentials
 */
async function postCredentials(credentials) {
  const apiUrl = 'http://localhost:3002/api/qwen/credentials';

  console.log('[Content Script] POSTing credentials to:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[Content Script] POST successful:', result);

    // Show user notification (optional)
    showNotification('Qwen credentials saved successfully!');

  } catch (error) {
    console.error('[Content Script] POST failed:', error);
    showNotification('Failed to save credentials: ' + error.message, true);
  }
}

/**
 * Show user notification
 * @param {string} message - Notification message
 * @param {boolean} isError - Whether this is an error notification
 */
function showNotification(message, isError = false) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${isError ? '#ef4444' : '#10b981'};
    color: white;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);
```

### Integration Points

- **Posts to:** `POST /api/qwen/credentials` (Phase 2)
- **Used by:** Frontend polling (Phase 4)

### Validation

- [ ] Log in to chat.qwen.ai
- [ ] Extension shows notification: "Qwen credentials saved successfully!"
- [ ] Check API Server logs for incoming POST request
- [ ] Frontend QwenLoginCard updates to "Authenticated" within 5 seconds
- [ ] Check database to verify credentials are stored
- [ ] Test error case: Stop API Server, verify error notification appears

**Test Sequence:**
```bash
# 1. Start API Server
cd backend/api-server
npm run dev

# 2. Start Frontend
cd frontend
npm run dev

# 3. Load extension in Chrome
# 4. Open chat.qwen.ai and login
# 5. Verify notification appears
# 6. Check frontend dashboard - should show "Authenticated"
```

---

## Phase 8: Frontend Component Updates

**Priority:** P3 (Polish)
**Dependencies:** Phase 4

### Objective

Ensure UI properly reflects the new automatic credential extraction flow.

### Files Modified

#### 1. `/frontend/src/components/features/dashboard/QwenLoginCard.tsx`

**Changes Required:**

**Update button text and help text** to reflect automatic extraction:

Line 110 (help text when not logged in):
```typescript
// BEFORE
<p className="dashboard-description">
  Login to Qwen to enable AI-powered features
</p>

// AFTER
<p className="dashboard-description">
  Login to Qwen to enable AI-powered features. Extension will automatically extract credentials.
</p>
```

Line 118 (button text when loading):
```typescript
// BEFORE
{loading ? 'Logging in...' : 'Login to Qwen'}

// AFTER
{loading ? 'Opening login page...' : 'Login to Qwen'}
```

**Add help text for extension requirement** (add after button):
```typescript
<Button
  onClick={login}
  className="w-full"
  disabled={loading}
>
  <LogIn className="h-4 w-4 mr-2" />
  {loading ? 'Opening login page...' : 'Login to Qwen'}
</Button>

{/* New help text */}
{!isElectron && (
  <p className="text-xs text-muted-foreground mt-2">
    Requires Chrome extension. Credentials will be detected automatically after login.
  </p>
)}
```

**Optional: Add loading state during polling**
Show a subtle indicator that polling is active:

```typescript
{!status.hasCredentials && (
  <p className="text-xs text-muted-foreground">
    Checking for credentials...
  </p>
)}
```

### Integration Points

- **Uses:** `useCredentials` hook (Phase 4)
- **Displays:** Status from polling

### Validation

- [ ] UI shows "Opening login page..." when clicking Login
- [ ] UI shows help text about Chrome extension
- [ ] UI updates to "Authenticated" automatically within 5 seconds of login
- [ ] No manual "Refresh" button click required
- [ ] Error states display properly if extension not installed

---

## Phase 9: Testing & Validation

**Priority:** P3 (Quality Assurance)
**Dependencies:** All previous phases

### Objective

Comprehensive end-to-end testing and validation of the complete flow.

### Files Created

#### 1. `/docs/45-QWEN_CREDENTIAL_EXTRACTION_TEST_PLAN.md`

**Purpose:** Test plan document with all test cases

**Contents:**
```markdown
# Qwen Credential Extraction - Test Plan

## Test Cases

### TC1: Fresh Installation (Chrome Extension Not Installed)
1. Open frontend dashboard
2. Click "Login to Qwen"
3. Verify: Error message shown
4. Verify: Directed to install extension

### TC2: Fresh Installation (Extension Installed, Not Logged In)
1. Install extension
2. Open frontend dashboard
3. Click "Login to Qwen"
4. Verify: chat.qwen.ai opens in new tab
5. Log in to Qwen
6. Wait 5 seconds
7. Verify: Extension shows success notification
8. Verify: Frontend dashboard shows "Authenticated"

### TC3: Already Logged In to Qwen
1. Already logged in to chat.qwen.ai in Chrome
2. Install extension
3. Open chat.qwen.ai
4. Wait 2 seconds
5. Verify: Extension detects existing session
6. Verify: Extension POSTs credentials
7. Verify: Frontend polls and updates

### TC4: Token Expiration
1. Have valid credentials
2. Mock credential expiration (set expiresAt to past)
3. Refresh frontend
4. Verify: Shows "Expired" status
5. Click "Re-login"
6. Verify: Can re-authenticate

### TC5: API Server Offline
1. Stop API Server
2. Log in to Qwen
3. Verify: Extension shows error notification
4. Start API Server
5. Click "Refresh" in frontend
6. Verify: Can retry extraction

### TC6: Invalid Credentials
1. Mock invalid JWT token
2. Extension attempts POST
3. Verify: API returns 400 error
4. Verify: Extension shows error notification

### TC7: Concurrent Sessions
1. Open frontend in multiple tabs
2. Log in to Qwen
3. Verify: All tabs update simultaneously (via polling)

### TC8: Logout Flow
1. Have valid credentials
2. Log out of Qwen
3. Click "Delete" in frontend
4. Verify: Credentials removed from DB
5. Verify: UI shows "Not Logged In"

## Integration Tests

### IT1: Extension → API Server
- Extension successfully POSTs to localhost:3002
- API validates and stores credentials
- Returns success response

### IT2: Frontend → API Server
- Frontend polls every 5 seconds
- Receives updated credentials
- Updates UI state

### IT3: End-to-End Flow
- User logs in
- Extension extracts within 2 seconds
- API stores within 1 second
- Frontend detects within 5 seconds
- Total time: < 8 seconds

## Performance Tests

### PT1: Polling Performance
- Monitor network requests
- Verify 5-second interval
- Verify no memory leaks over 1 hour

### PT2: Extension Performance
- Monitor CPU usage while running
- Should be < 1% idle
- Should be < 5% during extraction

## Security Tests

### ST1: HTTPS Validation
- Extension only runs on https://chat.qwen.ai
- No credential extraction on other sites

### ST2: Credential Storage
- Credentials stored securely in database
- No credentials logged to console (production mode)

### ST3: CORS Protection
- API Server validates origin
- Rejects requests from unauthorized origins
```

### Test Execution Checklist

- [ ] TC1: Extension not installed - error handling ✓
- [ ] TC2: Fresh login flow ✓
- [ ] TC3: Already logged in detection ✓
- [ ] TC4: Token expiration handling ✓
- [ ] TC5: API offline resilience ✓
- [ ] TC6: Invalid credential handling ✓
- [ ] TC7: Concurrent session updates ✓
- [ ] TC8: Logout and cleanup ✓
- [ ] IT1: Extension-API integration ✓
- [ ] IT2: Frontend-API integration ✓
- [ ] IT3: End-to-end timing ✓
- [ ] PT1: Polling performance ✓
- [ ] PT2: Extension performance ✓
- [ ] ST1: HTTPS validation ✓
- [ ] ST2: Secure storage ✓
- [ ] ST3: CORS protection ✓

### Tools for Testing

**Browser DevTools:**
- Network tab: Monitor API requests
- Console: Check extension logs
- Application tab: Inspect cookies

**API Testing:**
```bash
# Monitor API Server logs
tail -f backend/api-server/logs/app.log

# Test endpoint manually
curl -X POST http://localhost:3002/api/qwen/credentials \
  -H "Content-Type: application/json" \
  -d '{"token":"test","cookies":"test","expiresAt":9999999999999}'
```

**Database Inspection:**
```bash
# Check stored credentials
sqlite3 backend/api-server/data/database.db "SELECT * FROM qwen_credentials;"
```

### Success Criteria

**Functional:**
- ✅ Extension extracts credentials automatically
- ✅ API Server receives and stores credentials
- ✅ Frontend detects credentials within 5 seconds
- ✅ UI updates to show authentication status
- ✅ Error cases handled gracefully

**Performance:**
- ✅ Extraction completes within 2 seconds of login
- ✅ Polling has minimal network overhead
- ✅ Extension has minimal CPU/memory impact

**Reliability:**
- ✅ Works consistently across sessions
- ✅ Handles network errors gracefully
- ✅ No memory leaks during extended use

**Security:**
- ✅ Only extracts from legitimate Qwen site
- ✅ Credentials stored securely
- ✅ No exposure in logs or network

---

## Integration Points

### System-Wide Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Points                        │
└─────────────────────────────────────────────────────────────┘

1. Chrome Extension → API Server
   - POST /api/qwen/credentials
   - Content-Type: application/json
   - Payload: { token, cookies, expiresAt }

2. Frontend → API Server
   - GET /api/qwen/credentials (polling every 5s)
   - DELETE /api/qwen/credentials
   - Returns: QwenCredentials | null

3. API Server → Database
   - Table: qwen_credentials
   - Operations: INSERT/UPDATE (upsert), SELECT, DELETE

4. Frontend Hook → Frontend Service
   - useCredentials → credentialsService
   - useCredentials → browserExtensionService

5. Frontend Service → API Service
   - credentialsService → apiService
   - Direct HTTP calls (axios)

6. Frontend Component → Hook
   - QwenLoginCard → useCredentials
   - Receives: status, loading, error, functions
```

### External Dependencies

**Chrome APIs:**
- `chrome.cookies` - Read cookies from .qwen.ai domain
- `chrome.runtime` - Message passing between scripts
- `fetch()` - HTTP requests from content script

**Frontend Dependencies:**
- `axios` - HTTP client
- `react` - UI framework
- TypeScript types - Shared interfaces

**Backend Dependencies:**
- `express` - API Server
- `better-sqlite3` - Database access
- `cors` - CORS middleware

---

## Validation Criteria

### Phase Completion Checklist

Each phase is considered complete when:

**Phase 1:** ✅ Types defined, TypeScript compiles without errors

**Phase 2:** ✅ API endpoints respond correctly to curl tests

**Phase 3:** ✅ Services updated, TypeScript compiles, tests pass

**Phase 4:** ✅ Hook polls correctly, browser flows simplified

**Phase 5:** ✅ Extension loads in Chrome without errors

**Phase 6:** ✅ Extension extracts credentials, logs details

**Phase 7:** ✅ Extension POSTs successfully, notification appears

**Phase 8:** ✅ UI updates automatically, help text accurate

**Phase 9:** ✅ All test cases pass, no regressions

### Overall Success Metrics

**User Experience:**
- User clicks "Login to Qwen"
- User completes login on chat.qwen.ai
- UI updates to "Authenticated" within 10 seconds
- No manual refresh required

**Technical Reliability:**
- 100% success rate for valid login sessions
- < 5 second credential detection time
- < 10 second total time to UI update
- 0% false positives (invalid credentials)

**Code Quality:**
- All TypeScript compilation errors resolved
- No console errors in production
- All services follow SRP (Single Responsibility)
- No code duplication (DRY principle)
- Proper error handling throughout

---

## Risk Mitigation

### Identified Risks

**Risk 1: Qwen website structure changes**
- **Impact:** Extension can't detect login
- **Mitigation:** Use multiple detection methods (URL, cookies, DOM)
- **Fallback:** Manual refresh button still available

**Risk 2: Cookie names/structure change**
- **Impact:** Extension extracts wrong data
- **Mitigation:** Validate cookie format before POSTing
- **Fallback:** API validates and rejects invalid credentials

**Risk 3: CORS blocks extension requests**
- **Impact:** Extension can't POST to localhost
- **Mitigation:** Ensure API Server has correct CORS headers
- **Fallback:** Extension shows error, directs user to check API Server

**Risk 4: Polling overhead**
- **Impact:** Excessive network requests
- **Mitigation:** 5 second interval is reasonable balance
- **Fallback:** Can increase interval to 10 seconds if needed

**Risk 5: Extension not installed**
- **Impact:** User can't extract credentials
- **Mitigation:** Clear error message and install instructions
- **Fallback:** Electron app still has built-in extraction method

---

## Appendix A: Cookie Structure Reference

### Expected Qwen Cookies

Based on previous implementation (doc 22):

**Primary Cookie: `token`**
- Name: `token`
- Domain: `.qwen.ai`
- Type: JWT (JSON Web Token)
- Contains: User ID, expiration timestamp
- Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature`

**Secondary Cookie: `bx-umidtoken`**
- Name: `bx-umidtoken`
- Domain: `.qwen.ai`
- Type: API authentication token
- Used for: API requests to Qwen backend

### JWT Payload Example

```json
{
  "userId": "user_abc123",
  "exp": 1730851200,
  "iat": 1730764800,
  "iss": "qwen.ai"
}
```

**Note:** `exp` is Unix timestamp in **seconds**, must convert to milliseconds for JavaScript Date.

---

## Appendix B: Error Codes

### API Server Error Responses

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | `INVALID_PAYLOAD` | Missing required fields in request |
| 400 | `INVALID_TOKEN` | JWT cannot be decoded |
| 400 | `TOKEN_EXPIRED` | Token expiration is in the past |
| 500 | `DATABASE_ERROR` | Failed to store credentials |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

### Extension Error Messages

| Message | Cause | User Action |
|---------|-------|-------------|
| "Required cookies not found" | Not logged in to Qwen | Log in to chat.qwen.ai |
| "Failed to decode JWT expiration" | Invalid token format | Re-login to Qwen |
| "HTTP 400: ..." | API rejected credentials | Check browser console |
| "HTTP 500: ..." | API Server error | Check API Server logs |
| "Failed to fetch: ..." | API Server offline | Start API Server |

---

## Appendix C: Development Commands

### Setup Commands

```bash
# Install dependencies (if needed)
cd backend/api-server
npm install

cd ../../frontend
npm install

# Start API Server
cd backend/api-server
npm run dev

# Start Frontend
cd frontend
npm run dev

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select: /Users/chris/Projects/qwen_proxy_opencode/extension
```

### Testing Commands

```bash
# Test API endpoint
curl -X POST http://localhost:3002/api/qwen/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-token",
    "cookies": "token=abc; bx-umidtoken=xyz",
    "expiresAt": 9999999999999
  }'

# Check database
sqlite3 backend/api-server/data/database.db \
  "SELECT * FROM qwen_credentials;"

# Monitor API logs
tail -f backend/api-server/logs/app.log

# Check extension logs
# Open Chrome → chrome://extensions/ → Extension details → Service worker → Console
```

### Debugging Commands

```bash
# Frontend debugging
# Open frontend in browser → F12 → Console
# Look for: "[API Service]", "[Credentials]", "[Browser Extension]"

# Extension debugging
# chrome://extensions/ → Extension details → "Inspect views: service worker"
# Also check content script console on chat.qwen.ai page

# API Server debugging
# Add DEBUG=* environment variable
DEBUG=* npm run dev
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Next Review:** After implementation completion
