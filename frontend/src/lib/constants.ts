/**
 * Application Constants
 * All constants used throughout the application
 */

// Application metadata
export const APP_NAME = 'Qwen Proxy';
export const APP_VERSION = '1.0.0';

// UI Constants
export const SIDEBAR_WIDTH_COLLAPSED = 48;
export const SIDEBAR_WIDTH_EXPANDED = 224;
export const TITLEBAR_HEIGHT = 32;
export const STATUSBAR_HEIGHT = 24;

// Theme constants
export const THEME_STORAGE_KEY = 'qwen-proxy-ui-state';

// Navigation screens
export const SCREENS = {
  HOME: 'home',
  EXTENSION_INSTALL: 'extension-install',
} as const;

// API endpoints (if needed)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Storage keys
export const STORAGE_KEYS = {
  UI_STATE: 'qwen-proxy-ui-state',
  CREDENTIALS: 'qwen-proxy-credentials-state',
  PROXY: 'qwen-proxy-proxy-state',
  ALERT: 'qwen-proxy-alert-state',
} as const;

// Default values
export const DEFAULTS = {
  THEME: 'light',
  SIDEBAR_COLLAPSED: false,
  CURRENT_SCREEN: 'home',
} as const;
