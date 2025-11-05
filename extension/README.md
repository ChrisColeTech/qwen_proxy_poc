# Qwen Credential Extractor - Chrome Extension

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this directory: `/Users/chris/Projects/qwen_proxy_opencode/extension`

## Architecture

The extension uses a two-part architecture:

1. **Content Script** (`content.js`) - Runs on chat.qwen.ai
   - Detects when user logs in (DOM monitoring)
   - Sends message to background script to extract credentials
   - Shows user notification with result

2. **Background Service Worker** (`background.js`) - Has full Chrome API access
   - Listens for extraction requests from content script
   - Extracts cookies using `chrome.cookies` API
   - Decodes JWT token to get expiration
   - POSTs credentials to API server at `http://localhost:3002/api/qwen/credentials`

## Testing

1. Make sure API Server is running on port 3002:
   ```bash
   curl http://localhost:3002/api/health
   ```

2. Navigate to `https://chat.qwen.ai`

3. Open Chrome DevTools (F12) → Console tab

4. Log in to Qwen

5. Watch console logs:
   - `[Qwen Extension] Content script loaded`
   - `[Content Script] Login detected`
   - `[Content Script] Requesting credential extraction from background...`
   - `[Background] Extracting credentials...`
   - `[Background] POST successful`

6. Check for green notification: "Qwen credentials saved successfully!"

7. Verify API Server received POST:
   ```bash
   # Check API logs or query:
   curl http://localhost:3002/api/qwen/credentials
   ```

8. Frontend should update within 5 seconds

## Troubleshooting

**No console logs?**
- Refresh page after loading extension
- Check extension is enabled

**POST failed?**
- Check API Server is running: `curl http://localhost:3002/api/health`
- Check CORS errors in console

**No cookies found?**
- Make sure you're actually logged in
- Check cookies exist: DevTools → Application → Cookies → chat.qwen.ai
- Background script (not content script) extracts cookies - check background service worker logs in `chrome://extensions/` → Extension → "service worker" link

**Frontend not updating?**
- Check frontend is running
- Check polling is working (should call API every 5 seconds)
