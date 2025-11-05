/**
 * Hash Utilities
 *
 * Provides MD5 hashing functionality for generating session IDs
 * Part of Phase 4: Session Manager
 */

const crypto = require('crypto');

/**
 * Generate MD5 hash of text
 * Used to create stable session IDs from message content
 *
 * @param {string} text - Text to hash
 * @returns {string} MD5 hash as hex string
 *
 * @example
 * generateMD5Hash("Hello world")
 * // Returns: "3e25960a79dbc69b674cd4ec67a72c62"
 */
function generateMD5Hash(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('generateMD5Hash requires a non-empty string');
  }

  return crypto
    .createHash('md5')
    .update(text)
    .digest('hex');
}

module.exports = {
  generateMD5Hash
};
