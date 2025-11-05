# Browser Flow Installation & Testing Guide

This guide explains how to set up and test the browser flow for Qwen credential extraction using the Chrome extension.

## Overview

The browser flow consists of:
- **Chrome Extension** (`/extension`) - Extracts credentials from chat.qwen.ai
- **Frontend Dashboard** (`/frontend`) - UI for managing credentials with polling
- **API Server** (`/backend/api-server`) - Stores and validates credentials

## Prerequisites

1. **API Server Running**: The backend API server must be running on `http://localhost:3002`
2. **Frontend Running**: The frontend dashboard must be running (typically `http://localhost:5173`)
3. **Google Chrome**: The extension requires Chrome or Chromium-based browser

## Installation Steps

### 1. Install Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select the `/extension` directory from this project
5. The extension should now appear with the name "Qwen Credential Extractor"

**Verification:**
- You should see the extension in your extensions list
- No errors should appear (if you see errors about icons, those are safe to ignore)

### 2. Start the API Server

```bash
cd backend/api-server
npm install  # if not already installed
npm start
```

**Verification:**
- Server should start on port 3002
- You should see "API Server listening on port 3002" in the console
- Test endpoint: `curl http://localhost:3002/api/qwen/credentials`

### 3. Start the Frontend Dashboard

```bash
cd frontend
npm install  # if not already installed
npm run dev
```

**Verification:**
- Frontend should start (typically on port 5173)
- Open browser to the URL shown (e.g., http://localhost:5173)
- You should see "Browser (requires extension)" in the Environment section

## Testing the Browser Flow

### Test 1: Extension Detection (PING/PONG)

1. Open the frontend dashboard in Chrome
2. Open browser DevTools (F12)
3. Go to the Console tab
4. Look for messages like:
   ```
   [Qwen Extension] Dashboard bridge loaded on: http://localhost:5173
   [Dashboard Bridge] Received QWEN_PING, responding with QWEN_PONG
   [Extension Service] Received QWEN_PONG - extension is installed
   ```

**Expected Result:**
- Dashboard detects extension via PING/PONG protocol
- No error messages about extension not being installed

**Troubleshooting:**
- If you don't see dashboard bridge logs, refresh the page
- If still not working, reload the extension from `chrome://extensions/`

### Test 2: First-Time Login Flow

1. On the dashboard, ensure you have no credentials (Status shows "Not Logged In")
2. Click **"Login to Qwen"** button
3. **Expected:** A new tab opens to `https://chat.qwen.ai`

**In the new tab (chat.qwen.ai):**
4. Open DevTools (F12) and go to Console tab
5. Look for message: `[Qwen Extension] Content script loaded on: https://chat.qwen.ai`
6. Log in to your Qwen account
7. After login completes, you should see:
   ```
   [Content Script] User is logged in, extracting credentials...
   [Content Script] Requesting credential extraction from background...
   [Content Script] Background response: {success: true}
   ```
8. A green notification should appear in the top-right corner: "Success! Credentials saved."

**Back on the dashboard:**
9. Within 5 seconds, the polling should detect new credentials
10. Status badge should change to "Authenticated" (green)
11. Expiration date should be displayed
12. "Re-login" and "Delete Credentials" buttons should appear

**Expected Console Logs (Dashboard):**
```
[App] Starting polling for credentials...
[Credentials Service] Credentials saved: {...}
[App] Credentials are valid, stopping polling
```

**Troubleshooting:**
- **No content script logs:** Check extension is loaded, refresh chat.qwen.ai tab
- **Extraction fails:** Check background service worker console (chrome://extensions/ > "service worker" link)
- **API errors:** Ensure API server is running on port 3002
- **Polling not detecting:** Check browser console for fetch errors

### Test 3: Re-login Flow

1. With valid credentials, click **"Re-login"** button
2. **Expected:** Old credentials are deleted, then login flow starts
3. Follow steps from Test 2
4. After new credentials are saved, dashboard should update within 5 seconds

**Expected Console Logs:**
```
[App] Clearing old credentials before re-login
[Credentials Service] Credentials deleted: {...}
[App] Starting polling for credentials...
[Credentials Service] Credentials saved: {...}
[App] Credentials are valid, stopping polling
```

### Test 4: Delete Credentials

1. With valid credentials, click **"Delete Credentials"** button
2. Confirm the deletion
3. **Expected:**
   - Status changes to "Not Logged In" (gray)
   - Only "Login to Qwen" button remains
   - Polling starts again

### Test 5: Polling Mechanism

**Test Polling Starts:**
- Delete credentials (if any)
- Open DevTools Console
- Look for: `[App] Starting polling for credentials...`
- Verify polling is active (you should see periodic status checks every 5 seconds)

**Test Polling Stops:**
- Login and wait for credentials to be detected
- Look for: `[App] Credentials are valid, stopping polling`
- Verify no more periodic requests (network tab should show no more activity)

**Test Polling Restarts:**
- With valid credentials, click "Re-login"
- Look for: `[App] Clearing old credentials before re-login`
- Then: `[App] Starting polling for credentials...`
- Verify polling is active again

## Extension Debugging

### Background Service Worker Console

1. Go to `chrome://extensions/`
2. Find "Qwen Credential Extractor"
3. Click the **"service worker"** link (appears when active)
4. This opens the background script console

**Look for:**
- `[Background] Extracting credentials...`
- `[Background] Found cookies: X`
- `[Background] POSTing credentials to API server...`
- `[Background] API response: {...}`

### Content Script Console

**On chat.qwen.ai:**
1. Open DevTools (F12)
2. Console tab shows content script logs
3. Look for:
   - `[Qwen Extension] Content script loaded on: ...`
   - `[Content Script] User is logged in, extracting credentials...`

**On localhost (dashboard):**
1. Open DevTools (F12)
2. Console tab shows dashboard bridge logs
3. Look for:
   - `[Qwen Extension] Dashboard bridge loaded on: ...`
   - `[Dashboard Bridge] Received QWEN_PING, responding with QWEN_PONG`

## Common Issues & Solutions

### Issue: Extension Not Detected

**Symptoms:**
- Alert appears: "Please install the browser extension to login"
- Console shows no PONG response

**Solutions:**
1. Verify extension is enabled in `chrome://extensions/`
2. Refresh the dashboard page (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
3. Reload the extension (click reload icon in chrome://extensions/)
4. Check browser console for errors

### Issue: Credentials Not Extracting

**Symptoms:**
- Login completes but no success notification
- No credentials appear on dashboard

**Solutions:**
1. Check background service worker console for errors
2. Verify you're fully logged in to Qwen (not on /login page)
3. Ensure API server is running on port 3002
4. Check CORS settings on API server

### Issue: Polling Not Detecting Credentials

**Symptoms:**
- Extension says "Success!" but dashboard doesn't update

**Solutions:**
1. Wait up to 5 seconds (polling interval)
2. Check Network tab for failed API requests
3. Manually refresh credential status (click Re-login then cancel)
4. Check API server logs for errors

### Issue: CORS Errors

**Symptoms:**
- Console shows: "blocked by CORS policy"
- Credentials not saving to API

**Solutions:**
1. Ensure API server has proper CORS configuration
2. Check that API server allows requests from localhost origins
3. Verify fetch requests use correct URL: `http://localhost:3002/api/qwen/credentials`

## Architecture Summary

### PING/PONG Protocol (Extension Detection)

1. Dashboard sends `QWEN_PING` via `window.postMessage()`
2. Extension's dashboard-bridge.js receives it
3. Extension responds with `QWEN_PONG`
4. Dashboard detects extension within 1 second (timeout)

### Credential Extraction Flow

1. Dashboard opens chat.qwen.ai in new tab
2. Extension's content.js monitors for login
3. After login detected, sends `EXTRACT_CREDENTIALS` message to background
4. Background script uses `chrome.cookies` API to get cookies
5. Background script POSTs credentials to API server
6. Dashboard polling detects new credentials within 5 seconds

### Polling Mechanism

- **Polls every 5 seconds** when credentials are missing or invalid
- **Stops polling** when valid credentials are detected
- **Restarts polling** when:
  - Credentials are deleted
  - Re-login is triggered
  - `refreshKey` state changes

## File Locations

```
/extension/
  ├── manifest.json              # Extension configuration
  ├── background.js              # Service worker (cookies API)
  ├── content.js                 # Runs on chat.qwen.ai
  ├── dashboard-bridge.js        # Runs on localhost
  ├── README.md                  # Extension documentation
  └── ICONS_NOTE.txt             # Note about missing icons

/frontend/src/
  ├── App.tsx                    # Main UI with polling logic
  └── services/
      ├── browser-extension.service.ts   # Extension detection
      └── credentials.service.ts         # API communication

/backend/api-server/src/
  ├── routes/qwen-credentials.js         # API routes
  └── controllers/qwen-credentials-controller.js  # Business logic
```

## Next Steps

After successful testing:
1. Consider adding proper icons to the extension (see ICONS_NOTE.txt)
2. Test edge cases (network failures, expired credentials, etc.)
3. Consider adding retry logic for failed extractions
4. Implement better error messages for users
5. Add telemetry/logging for production debugging

## Related Documentation

- **Doc 48** (`/docs/48-QWEN_LOGIN_FLOW_GUIDE.md`) - Complete flow documentation
- **Extension README** (`/extension/README.md`) - Extension-specific details

## Support

If you encounter issues:
1. Check all console logs (dashboard, content script, background worker)
2. Verify all services are running (API server, frontend)
3. Test with extension loaded in a fresh Chrome profile
4. Review this guide's troubleshooting section
