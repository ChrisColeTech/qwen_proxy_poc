// Background service worker for Qwen Credential Extractor
console.log('[Qwen Extension] Background service worker loaded');

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
