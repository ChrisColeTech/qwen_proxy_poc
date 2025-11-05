/**
 * JWT Decoder Utility
 * Decodes JWT tokens and extracts expiration timestamps
 */

/**
 * Decode JWT token and extract payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    // Base64 decode (handle URL-safe base64)
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
