import { Database } from 'lucide-react';

// Tab configuration
export const MODEL_FORM_TABS = {
  DETAILS: {
    value: 'details',
    label: 'Model Details'
  }
} as const;

// Page constants
export const MODEL_FORM_TITLE = 'Model Information';
export const MODEL_FORM_ICON = Database;

// Field labels
export const FIELD_LABELS = {
  MODEL_ID: 'Model ID',
  MODEL_ID_DESC: 'Unique identifier for this model',

  MODEL_NAME: 'Model Name',
  MODEL_NAME_DESC: 'Display name for this model',

  DESCRIPTION: 'Description',
  DESCRIPTION_DESC: 'Model description and details',

  CAPABILITIES: 'Capabilities',
  CAPABILITIES_DESC: 'Model capabilities and features',

  STATUS: 'Status',
  STATUS_DESC: 'Current model status',

  LINKED_PROVIDERS_TITLE: 'Linked Providers',
  METADATA_TITLE: 'Metadata',

  CREATED: 'Created',
  CREATED_DESC: 'Model creation timestamp',

  LAST_UPDATED: 'Last Updated',
  LAST_UPDATED_DESC: 'Last modification timestamp'
} as const;

// Tooltip labels
export const TOOLTIP_LABELS = {
  BACK: 'Back to models list',
  SET_DEFAULT: 'Set as default model for linked providers'
} as const;

// Helper functions (simple utilities < 5 lines)
export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const parseCapabilities = (capabilitiesStr: string) => {
  try {
    return JSON.parse(capabilitiesStr);
  } catch {
    return [];
  }
};
