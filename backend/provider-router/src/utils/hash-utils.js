/**
 * Hash Utilities
 * Provides hashing functions for session ID generation
 */

import crypto from 'crypto'

/**
 * Generate MD5 hash from input string
 * Used for creating session IDs from first user message
 *
 * @param {string} input - Input string to hash
 * @returns {string} MD5 hash (32 character hex string)
 */
export function generateMD5Hash(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string')
  }

  return crypto.createHash('md5').update(input).digest('hex')
}

/**
 * Generate SHA256 hash from input string
 *
 * @param {string} input - Input string to hash
 * @returns {string} SHA256 hash (64 character hex string)
 */
export function generateSHA256Hash(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string')
  }

  return crypto.createHash('sha256').update(input).digest('hex')
}

export default {
  generateMD5Hash,
  generateSHA256Hash
}
