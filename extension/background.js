// Background service worker for Qwen Credential Extractor
console.log('[Qwen Extension] Background service worker loaded');

// Import Socket.io client library
importScripts('socket.io.min.js');

/**
 * WebSocket connection to backend for extension detection
 */
let socket = null;
const BACKEND_URL = 'http://localhost:3002';

/**
 * Connect to backend Socket.io server
 */
function connectToBackend() {
  try {
    console.log('[Background] Connecting to backend:', BACKEND_URL);

    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('[Background] Connected to backend:', socket.id);

      // Identify as extension client
      socket.emit('extension:connect');
      console.log('[Background] Sent extension:connect event');
    });

    socket.on('disconnect', (reason) => {
      console.log('[Background] Disconnected from backend:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Background] Connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[Background] Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Background] Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('[Background] Reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Background] Reconnection failed');
    });

  } catch (error) {
    console.error('[Background] Error connecting to backend:', error);
  }
}

// Connect to backend when extension loads
connectToBackend();

/**
 * Decode JWT token to extract expiration
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('[Background] JWT decode failed:', error);
    return null;
  }
}

function getTokenExpiration(token) {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000; // Convert seconds to milliseconds
}

/**
 * Extract Qwen credentials from cookies
 */
async function extractCredentials() {
  console.log('[Background] Extracting credentials...');

  try {
    // Get all cookies for qwen.ai domain (background script has access)
    const cookies = await chrome.cookies.getAll({ domain: '.qwen.ai' });
    console.log('[Background] Found cookies:', cookies.length);
    console.log('[Background] Cookie names:', cookies.map(c => c.name).join(', '));

    // Find cookies
    const tokenCookie = cookies.find(c => c.name === 'token');
    const umidTokenCookie = cookies.find(c => c.name === 'bx-umidtoken');

    // Must have at least one token
    if (!tokenCookie && !umidTokenCookie) {
      const error = 'No authentication tokens found. Please log in to chat.qwen.ai first. Available: ' + cookies.map(c => c.name).join(', ');
      console.error('[Background]', error);
      throw new Error(error);
    }

    console.log('[Background] Found cookies:', {
      hasToken: !!tokenCookie,
      hasUmidToken: !!umidTokenCookie
    });

    // Extract values - use umidToken if available, else JWT token
    const token = tokenCookie?.value;
    const umidToken = umidTokenCookie?.value || token; // Fallback to token if no umidToken

    // Decode JWT to get expiration from token cookie
    const expiresAt = token ? getTokenExpiration(token) : null;

    if (!expiresAt) {
      console.warn('[Background] Failed to decode JWT expiration, using default 30 days');
    }

    // Build cookie string with ALL cookies
    const cookieString = cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    // Build credentials object
    const credentials = {
      token: umidToken,           // API uses umidToken (or token fallback)
      cookies: cookieString,
      expiresAt: expiresAt || (Date.now() + (30 * 24 * 60 * 60 * 1000)) // Default 30 days
    };

    console.log('[Background] Credentials extracted:', {
      hasToken: !!credentials.token,
      hasCookies: !!credentials.cookies,
      expiresAt: new Date(credentials.expiresAt).toISOString()
    });

    return credentials;

  } catch (error) {
    console.error('[Background] Extraction failed:', error);
    throw error; // Throw instead of return null so we get the error message
  }
}

/**
 * POST credentials to API Server
 */
async function postCredentials(credentials) {
  const apiUrl = 'http://localhost:3002/api/qwen/credentials';

  console.log('[Background] POSTing credentials to:', apiUrl);

  // Backend expects expiresAt in seconds (Unix timestamp), but we use milliseconds internally
  const backendCredentials = {
    ...credentials,
    expiresAt: Math.floor(credentials.expiresAt / 1000),
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendCredentials),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[Background] POST successful:', result);

    return { success: true };

  } catch (error) {
    console.error('[Background] POST failed:', error);
    throw error;
  }
}

/**
 * Handle messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);

  if (message.type === 'EXTRACT_CREDENTIALS') {
    // Handle async operation
    (async () => {
      try {
        console.log('[Background] Starting credential extraction...');

        // Extract credentials
        const credentials = await extractCredentials();
        console.log('[Background] Credentials extracted successfully');

        // POST to API
        console.log('[Background] Posting to API...');
        await postCredentials(credentials);
        console.log('[Background] Posted successfully');

        sendResponse({ success: true });

      } catch (error) {
        console.error('[Background] Error handling EXTRACT_CREDENTIALS:', error);
        sendResponse({ success: false, error: error.message || String(error) });
      }
    })();

    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

/**
 * Handle messages from external websites (via externally_connectable)
 * This allows the dashboard webpage to detect if the extension is installed
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received external message:', message.type, 'from:', sender.url);

  if (message.type === 'PING') {
    // Respond to ping from dashboard to confirm extension is installed
    sendResponse({ type: 'PONG', installed: true });
    return true;
  }
});
