import { Settings } from 'lucide-react';

// Tab configuration
export const PROVIDER_FORM_TABS = {
  FORM: {
    value: 'form',
    label: 'Configuration'
  }
} as const;

// Page constants
export const PROVIDER_FORM_TITLE_EDIT = 'Edit Provider';
export const PROVIDER_FORM_TITLE_CREATE = 'Create Provider';
export const PROVIDER_FORM_ICON = Settings;

// Field labels and descriptions
export const FIELD_LABELS = {
  ID: 'Provider ID',
  ID_DESC: 'Lowercase letters, numbers, and hyphens only',
  ID_PLACEHOLDER: 'lm-studio-home',

  NAME: 'Display Name',
  NAME_DESC: 'Human-readable name for this provider',
  NAME_PLACEHOLDER: 'LM Studio Home',

  TYPE: 'Provider Type',
  TYPE_DESC: 'Type identifier (e.g., lm-studio, qwen-proxy, custom-type)',
  TYPE_PLACEHOLDER: 'lm-studio',

  DESCRIPTION: 'Description',
  DESCRIPTION_DESC: 'Optional description for this provider',
  DESCRIPTION_PLACEHOLDER: 'Optional description',

  PRIORITY: 'Priority',
  PRIORITY_DESC: 'Higher values = higher priority for routing',

  ENABLED: 'Enabled',
  ENABLED_DESC: 'Whether this provider is active',

  CONFIG_TITLE: 'Configuration',

  BASE_URL: 'baseURL',
  BASE_URL_DESC: 'Base URL for the provider API endpoint',
  BASE_URL_PLACEHOLDER: 'http://localhost:1234',

  TIMEOUT: 'timeout',
  TIMEOUT_DESC: 'Request timeout in milliseconds',
  TIMEOUT_PLACEHOLDER: '30000',

  DEFAULT_MODEL: 'defaultModel',
  DEFAULT_MODEL_DESC: 'Default model to use if none specified',
  DEFAULT_MODEL_PLACEHOLDER: 'qwen-max',

  API_KEY: 'apiKey',
  API_KEY_DESC: 'API key for authentication (OpenAI-compatible providers)',
  API_KEY_PLACEHOLDER: 'sk-...',

  TOKEN: 'token',
  TOKEN_DESC: 'Authentication token (Qwen providers)',
  TOKEN_PLACEHOLDER: 'your-api-token',

  COOKIES: 'cookies',
  COOKIES_DESC: 'Session cookies for authentication',
  COOKIES_PLACEHOLDER: 'cookie1=value1; cookie2=value2',

  EXPIRES_AT: 'expiresAt',
  EXPIRES_AT_DESC: 'Token expiration timestamp (Unix milliseconds)',
  EXPIRES_AT_PLACEHOLDER: '1704067200000'
} as const;

// Tooltip labels
export const TOOLTIP_LABELS = {
  BACK: 'Back to providers list',
  CANCEL: 'Cancel and go back',
  RESET: 'Reset form',
  TEST: 'Test connection',
  TEST_LOADING: 'Testing connection...',
  SAVE_EDIT: 'Save changes',
  SAVE_CREATE: 'Create provider',
  SAVE_LOADING: 'Saving...',
  TOGGLE_ENABLE: 'Enable provider',
  TOGGLE_DISABLE: 'Disable provider',
  EDIT: 'Edit provider',
  DELETE: 'Delete provider'
} as const;
