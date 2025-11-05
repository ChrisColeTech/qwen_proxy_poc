/**
 * Validation Utilities
 * Common validation functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate port number
 */
export function isValidPort(port: number | string): boolean {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * Validate hostname
 */
export function isValidHostname(hostname: string): boolean {
  const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
  return hostnameRegex.test(hostname) || hostname === 'localhost';
}

/**
 * Check if string is empty or whitespace only
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Validate required field
 */
export function isRequired(value: unknown): boolean {
  if (typeof value === 'string') {
    return !isEmpty(value);
  }
  return value !== null && value !== undefined;
}
