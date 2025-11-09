# Frontend V3 Rewrite - Code Documentation: Phases 4-5

This document contains the complete source code for **Phase 4 (Foundation Layer - Constants)** and **Phase 5 (Service Layer)** of the Frontend V3 Rewrite Implementation Plan.

## Table of Contents

- [Phase 4: Foundation Layer - Constants](#phase-4-foundation-layer---constants)
  - [home.constants.tsx](#homeconstantstsx)
  - [providers.constants.tsx](#providersconstantstsx)
  - [models.constants.tsx](#modelsconstantstsx)
  - [settings.constants.tsx](#settingsconstantstsx)
  - [chat.constants.tsx](#chatconstantstsx)
  - [modelForm.constants.tsx](#modelformconstantstsx)
  - [providerForm.constants.tsx](#providerformconstantstsx)
  - [browserGuide.constants.tsx](#browserguideconstantstsx)
  - [desktopGuide.constants.tsx](#desktopguideconstantstsx)
- [Phase 5: Service Layer](#phase-5-service-layer)
  - [api.service.ts](#apiservicets)
  - [websocket.service.ts](#websocketservicets)
  - [providers.service.ts](#providersservicets)
  - [models.service.ts](#modelsservicets)
  - [credentials.service.ts](#credentialsservicets)
  - [chatService.ts](#chatservicets)
  - [proxy.service.ts](#proxyservicets)

---

# Phase 4: Foundation Layer - Constants

## home.constants.tsx

**File:** `frontend/src/constants/home.constants.tsx`

```tsx
import type { ReactNode } from 'react';
import { ChevronRight, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import type { StatusType } from '@/components/ui/status-indicator';
import type { LifecycleState } from '@/stores/useLifecycleStore';
import { formatUptime, formatExpiryDate } from '@/utils/formatters';

export interface ActionItem {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  description?: string;
  hidden?: boolean;
}

export const getProxyBadge = (lifecycleState: LifecycleState) => {
  switch (lifecycleState) {
    case 'starting':
      return { text: 'Starting...', variant: 'secondary' as const };
    case 'stopping':
      return { text: 'Stopping...', variant: 'secondary' as const };
    case 'running':
      return { text: 'Running', variant: 'default' as const };
    case 'error':
      return { text: 'Error', variant: 'destructive' as const };
    default:
      return { text: 'Stopped', variant: 'destructive' as const };
  }
};

export const getStatusIndicatorState = (lifecycleState: LifecycleState): StatusType => {
  switch (lifecycleState) {
    case 'starting':
    case 'running':
      return 'running';
    case 'error':
      return 'invalid';
    case 'stopping':
    case 'stopped':
    case 'idle':
    default:
      return 'stopped';
  }
};

export const createActionBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[100px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

export const createActionIcon = (status: StatusType) => (
  <StatusIndicator status={status} />
);

export const buildOverviewActions = (params: {
  extensionDetected: boolean;
  needsExtension: boolean;
  credentialsValid: boolean;
  expiresAt: number | null | undefined;
  running: boolean;
  port: number | undefined;
  uptime: number | undefined;
  lifecycleState: LifecycleState;
  proxyLoading: boolean;
  handleExtensionClick: () => void;
  handleQwenLogin: () => void;
  handleProxyClick: () => void;
}): ActionItem[] => {
  const {
    extensionDetected,
    needsExtension,
    credentialsValid,
    expiresAt,
    running,
    port,
    uptime,
    lifecycleState,
    proxyLoading,
    handleExtensionClick,
    handleQwenLogin,
    handleProxyClick
  } = params;

  const proxyBadge = getProxyBadge(lifecycleState);

  return [
    {
      icon: createActionIcon(extensionDetected ? 'running' : 'stopped'),
      title: '1. Chrome Extension',
      description: extensionDetected ? 'Ready for authentication' : 'Click to install extension',
      actions: createActionBadge(
        extensionDetected ? 'default' : 'destructive',
        extensionDetected ? 'Detected' : 'Not Detected'
      ),
      onClick: handleExtensionClick,
      hidden: !needsExtension
    },
    {
      icon: createActionIcon(credentialsValid ? 'running' : 'stopped'),
      title: `${needsExtension ? '2' : '1'}. Qwen Credentials`,
      description: credentialsValid ? `Expires ${formatExpiryDate(expiresAt ?? null)}` : 'Click to login to Qwen',
      actions: createActionBadge(
        credentialsValid ? 'default' : 'destructive',
        credentialsValid ? 'Valid' : 'Invalid'
      ),
      onClick: handleQwenLogin
    },
    {
      icon: createActionIcon(getStatusIndicatorState(lifecycleState)),
      title: `${needsExtension ? '3' : '2'}. Provider Router`,
      description: running ? `Port ${port} • Uptime ${uptime !== undefined ? formatUptime(uptime) : 'N/A'}` : 'Click to start the proxy server',
      actions: createActionBadge(proxyBadge.variant, proxyBadge.text),
      onClick: handleProxyClick,
      disabled: proxyLoading
    }
  ];
};

export const HOME_TABS = {
  OVERVIEW: {
    value: 'overview',
    label: 'Overview',
    description: 'Click on any row to perform the action. Follow the steps in order:'
  },
  STATUS: {
    value: 'status',
    label: 'System Status',
    description: 'Test the OpenAI-compatible endpoints exposed by the Provider Router:'
  }
} as const;

export const HOME_TITLE = 'Proxy Dashboard';
export const SYSTEM_OVERVIEW_TITLE = 'System Overview';
export const SYSTEM_OVERVIEW_ICON = Gauge;
```

---

## providers.constants.tsx

**File:** `frontend/src/constants/providers.constants.tsx`

```tsx
import { Blocks, Settings, Zap, Plus, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import type { ActionItem } from './home.constants';
import type { Provider } from '@/types/providers.types';

export const PROVIDERS_TABS = {
  SWITCH: {
    value: 'switch',
    label: 'Switch Provider',
    description: 'The Provider Router can route to different backends. Switch providers dynamically:'
  },
  ALL: {
    value: 'all',
    label: 'All Providers',
    description: 'View and manage all configured LLM providers'
  },
  TEST: {
    value: 'test',
    label: 'Test Provider',
    description: 'Test your provider configuration with a live request'
  }
} as const;

export const PROVIDERS_TITLE = 'Providers';
export const PROVIDERS_ICON = Blocks;
export const PROVIDER_SETTINGS_ICON = Settings;
export const ACTIVE_ICON = Zap;
export const ADD_ICON = Plus;

const createProviderBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[100px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

export const buildProviderSwitchActions = (params: {
  providers: Provider[];
  activeProvider: string;
  onSwitch: (providerId: string) => void;
}): ActionItem[] => {
  const { providers, activeProvider, onSwitch } = params;

  return providers.map((provider) => {
    const isActive = provider.id === activeProvider;
    const canSwitch = !isActive && provider.enabled;

    return {
      icon: isActive ? <StatusIndicator status={isActive ? 'running' : 'stopped'} /> : undefined,
      title: provider.name,
      description: '',
      actions: createProviderBadge(isActive ? 'default' : 'secondary', provider.type),
      onClick: canSwitch ? () => onSwitch(provider.id) : undefined,
      disabled: !canSwitch
    };
  });
};

export const buildProviderActions = (params: {
  providers: Provider[];
  activeProvider: string;
  handleProviderClick: (providerId: string) => void;
}): ActionItem[] => {
  const { providers, activeProvider, handleProviderClick } = params;

  return providers.map((provider) => {
    const isActive = provider.id === activeProvider;

    // Determine status based on runtime_status if available, otherwise fall back to enabled state
    let status: "running" | "stopped" | "warning" | "inactive" = "stopped";
    let badgeText = "Disabled";
    let badgeVariant: "default" | "destructive" | "secondary" = "secondary";

    if (provider.enabled) {
      if (isActive) {
        status = "running";
        badgeText = "Running";
        badgeVariant = "default";
      } else if (provider.runtime_status === "error") {
        status = "warning";
        badgeText = "Error";
        badgeVariant = "destructive";
      } else {
        status = "inactive";
        badgeText = "Enabled";
        badgeVariant = "default";
      }
    }

    return {
      icon: isActive ? <StatusIndicator status={status} /> : undefined,
      title: provider.name,
      description: provider.type,
      actions: createProviderBadge(badgeVariant, badgeText),
      onClick: () => handleProviderClick(provider.id),
    };
  });
};
```

---

## models.constants.tsx

**File:** `frontend/src/constants/models.constants.tsx`

```tsx
import { Database, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import type { ActionItem } from './home.constants';
import type { Model, ParsedModel } from '@/types/models.types';

export const MODELS_TABS = {
  SELECT: {
    value: 'select',
    label: 'Select Model',
    description: 'Select an active model to use with the Provider Router:'
  },
  ALL: {
    value: 'all',
    label: 'All Models',
    description: 'Browse all available LLM models'
  },
  TEST: {
    value: 'test',
    label: 'Test Model',
    description: 'Test the currently selected model with the active provider'
  }
} as const;

export const MODELS_TITLE = 'Models';
export const MODELS_ICON = Database;

// Helper: Create a badge with chevron for action items
export const createModelBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[180px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

// Helper: Create active badge with chevron
export const createActiveBadge = () => (
  <>
    <Badge variant="default" className="min-w-[180px] justify-center">
      Active
    </Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

// Builder: Create action items for model selection
export const buildModelSelectActions = (params: {
  models: Model[];
  activeModel: string;
  onSelect: (modelId: string) => void;
}): ActionItem[] => {
  const { models, activeModel, onSelect } = params;

  return models.map((model) => {
    const isActive = model.id === activeModel;

    return {
      icon: isActive ? <StatusIndicator status="running" /> : undefined,
      title: model.id,
      description: model.description,
      actions: isActive ? createActiveBadge() : <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />,
      onClick: isActive ? undefined : () => onSelect(model.id),
      disabled: isActive,
    };
  });
};

// Builder: Create action items for browsing all models
export const buildModelActions = (params: {
  models: ParsedModel[];
  activeModel: string;
  handleModelClick: (modelId: string) => void;
}): ActionItem[] => {
  const { models, activeModel, handleModelClick } = params;

  return models.map((model) => {
    const isActive = model.id === activeModel;
    return {
      icon: isActive ? <StatusIndicator status="running" /> : undefined,
      title: model.id,
      description: model.description,
      actions: createModelBadge("default", model.provider),
      onClick: () => handleModelClick(model.id),
    };
  });
};
```

---

## settings.constants.tsx

**File:** `frontend/src/constants/settings.constants.tsx`

```tsx
import { Settings } from 'lucide-react';

export const SETTINGS_TABS = {
  APPEARANCE: {
    value: 'appearance',
    label: 'Appearance',
    description: 'Customize the look and feel of the application'
  },
  PROXY: {
    value: 'proxy',
    label: 'Proxy Settings',
    description: 'Configure proxy server settings'
  },
  DEBUG: {
    value: 'debug',
    label: 'Debug Settings',
    description: 'Developer and debugging options'
  }
} as const;

export const SETTINGS_TITLE = 'Settings';
export const SETTINGS_ICON = Settings;
```

---

## chat.constants.tsx

**File:** `frontend/src/constants/chat.constants.tsx`

```tsx
import { MessageSquare } from 'lucide-react';
import { CustomChatTab } from '@/components/features/chat/CustomChatTab';
import { CurlTab } from '@/components/features/chat/CurlTab';

export const CHAT_TABS = {
  CUSTOM: {
    value: 'chat',
    label: 'Custom Chat',
    description: 'Send custom prompts to the active model and see responses with thinking process parsing'
  },
  CURL: {
    value: 'curl',
    label: 'cURL Example',
    description: 'Test the chat completion endpoint directly from your terminal'
  }
} as const;

export const CHAT_TITLE = 'Chat Completions';
export const CHAT_ICON = MessageSquare;

export const buildCustomChatContent = (params: {
  providerRouterUrl: string;
  activeModel: string;
}) => {
  const { providerRouterUrl, activeModel } = params;

  return (
    <CustomChatTab
      providerRouterUrl={providerRouterUrl}
      activeModel={activeModel}
    />
  );
};

export const buildCurlExamplesContent = (params: {
  providerRouterUrl: string;
  activeModel: string;
}) => {
  const { providerRouterUrl, activeModel } = params;

  return (
    <CurlTab
      providerRouterUrl={providerRouterUrl}
      activeModel={activeModel}
    />
  );
};
```

---

## modelForm.constants.tsx

**File:** `frontend/src/constants/modelForm.constants.tsx`

```tsx
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
```

---

## providerForm.constants.tsx

**File:** `frontend/src/constants/providerForm.constants.tsx`

```tsx
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

  BASE_URL: 'Base URL',
  BASE_URL_DESC: 'Base URL for the provider API endpoint',
  BASE_URL_PLACEHOLDER: 'http://localhost:1234',

  TIMEOUT: 'Timeout',
  TIMEOUT_DESC: 'Request timeout in milliseconds',
  TIMEOUT_PLACEHOLDER: '30000',

  DEFAULT_MODEL: 'Default Model',
  DEFAULT_MODEL_DESC: 'Default model to use if none specified',
  DEFAULT_MODEL_PLACEHOLDER: 'qwen-max',

  API_KEY: 'API Key',
  API_KEY_DESC: 'API key for authentication (OpenAI-compatible providers)',
  API_KEY_PLACEHOLDER: 'sk-...',

  TOKEN: 'Token',
  TOKEN_DESC: 'Authentication token (Qwen providers)',
  TOKEN_PLACEHOLDER: 'your-api-token',

  COOKIES: 'Cookies',
  COOKIES_DESC: 'Session cookies for authentication',
  COOKIES_PLACEHOLDER: 'cookie1=value1; cookie2=value2',

  EXPIRES_AT: 'Expires At',
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
```

---

## browserGuide.constants.tsx

**File:** `frontend/src/constants/browserGuide.constants.tsx`

```tsx
import { Globe } from 'lucide-react';

export const BROWSER_GUIDE_TABS = {
  GUIDE: {
    value: 'guide',
    label: 'Quick Start Guide',
    description: 'Get running in 60 seconds with the Chrome extension'
  },
  API_EXAMPLES: {
    value: 'api-examples',
    label: 'API Examples',
    description: 'Code examples for using the proxy'
  }
} as const;

export const BROWSER_GUIDE_TITLE = 'Browser Quick Start';
export const BROWSER_GUIDE_ICON = Globe;
```

---

## desktopGuide.constants.tsx

**File:** `frontend/src/constants/desktopGuide.constants.tsx`

```tsx
import { Monitor } from 'lucide-react';

export const DESKTOP_GUIDE_TABS = {
  GUIDE: {
    value: 'guide',
    label: 'Quick Start Guide',
    description: 'Faster native authentication with Electron'
  },
  API_EXAMPLES: {
    value: 'api-examples',
    label: 'API Examples',
    description: 'Code examples for using the proxy'
  }
} as const;

export const DESKTOP_GUIDE_TITLE = 'Desktop Quick Start';
export const DESKTOP_GUIDE_ICON = Monitor;
```

---

# Phase 5: Service Layer

## api.service.ts

**File:** `frontend/src/services/api.service.ts`

```typescript
export type { Provider } from '@/types/proxy.types';

const API_BASE = 'http://localhost:3002';

export interface ProviderConfig {
  [key: string]: string | number | boolean;
}

export interface CreateProviderData {
  id: string;
  name: string;
  type: string;
  enabled?: boolean;
  priority?: number;
  description?: string;
  config?: ProviderConfig;
}

export interface UpdateProviderData {
  name?: string;
  type?: string;
  enabled?: boolean;
  priority?: number;
  description?: string;
}

export const apiService = {
  // Provider CRUD
  async getProviders() {
    try {
      const response = await fetch(`${API_BASE}/api/providers`);
      if (!response.ok) {
        throw new Error('Failed to get providers');
      }
      const json = await response.json();
      return {
        success: true,
        data: json.providers || []
      };
    } catch (error) {
      console.error('Error getting providers:', error);
      return { success: false, data: [] };
    }
  },

  async getProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}`);
      if (!response.ok) {
        throw new Error('Failed to get provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting provider:', error);
      throw error;
    }
  },

  async createProvider(data: CreateProviderData) {
    try {
      const response = await fetch(`${API_BASE}/api/providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  },

  async updateProvider(id: string, data: UpdateProviderData) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  },

  async deleteProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  },

  async enableProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/enable`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to enable provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error enabling provider:', error);
      throw error;
    }
  },

  async disableProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/disable`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to disable provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error disabling provider:', error);
      throw error;
    }
  },

  async testProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/test`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Provider test failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error testing provider:', error);
      throw error;
    }
  },

  // Provider Configuration
  async getProviderConfig(id: string, mask: boolean = true) {
    try {
      const response = await fetch(`${API_BASE}/api/${id}/config?mask=${mask}`);
      if (!response.ok) {
        throw new Error('Failed to get provider config');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting provider config:', error);
      throw error;
    }
  },

  async updateProviderConfig(id: string, config: ProviderConfig) {
    try {
      const response = await fetch(`${API_BASE}/api/${id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) {
        throw new Error('Failed to update provider config');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating provider config:', error);
      throw error;
    }
  },

  async updateProviderConfigKey(id: string, key: string, value: string | number | boolean, isSensitive?: boolean) {
    try {
      const body: { value: string | number | boolean; is_sensitive?: boolean } = { value };
      if (isSensitive !== undefined) {
        body.is_sensitive = isSensitive;
      }
      const response = await fetch(`${API_BASE}/api/${id}/config/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('Failed to update config key');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating config key:', error);
      throw error;
    }
  },

  async deleteProviderConfigKey(id: string, key: string) {
    try {
      const response = await fetch(`${API_BASE}/api/${id}/config/${key}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete config key');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting config key:', error);
      throw error;
    }
  },

  // Settings
  async getSettings() {
    try {
      const response = await fetch(`${API_BASE}/api/settings`);
      if (!response.ok) {
        throw new Error('Failed to get settings');
      }
      const json = await response.json();
      return {
        success: true,
        data: json.settings || {}
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { success: false, data: {} };
    }
  },

  async getSetting(key: string) {
    try {
      const response = await fetch(`${API_BASE}/api/settings/${key}`);
      if (!response.ok) {
        throw new Error('Failed to get setting');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  },

  async updateSetting(key: string, value: string) {
    try {
      const response = await fetch(`${API_BASE}/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update setting');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  },

  async setActiveProvider(id: string) {
    return this.updateSetting('active_provider', id);
  },
};
```

---

## websocket.service.ts

**File:** `frontend/src/services/websocket.service.ts`

```typescript
import { io, Socket } from 'socket.io-client';
import type {
  ProxyStatusEvent,
  CredentialsUpdatedEvent,
  ProvidersUpdatedEvent,
  ModelsUpdatedEvent,
  LifecycleUpdateEvent,
  WebSocketConnectionStatus,
} from '@/types';

type EventCallback<T> = (data: T) => void;

interface WebSocketCallbacks {
  onProxyStatus?: EventCallback<ProxyStatusEvent>;
  onCredentialsUpdated?: EventCallback<CredentialsUpdatedEvent>;
  onProvidersUpdated?: EventCallback<ProvidersUpdatedEvent>;
  onModelsUpdated?: EventCallback<ModelsUpdatedEvent>;
  onLifecycleUpdate?: EventCallback<LifecycleUpdateEvent>;
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private status: WebSocketConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor() {
    // Service is initialized but not connected
  }

  connect(url: string = 'http://localhost:3002', callbacks: WebSocketCallbacks = {}): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting to:', url);
    this.callbacks = callbacks;

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log('[WebSocket] Reconnection attempt:', attempt);
      this.reconnectAttempts = attempt;
      this.updateStatus('reconnecting');
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('[WebSocket] Reconnected after', attempt, 'attempts');
      this.reconnectAttempts = 0;
      this.updateStatus('connected');
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed');
      this.updateStatus('disconnected');
    });

    // Business events
    this.socket.on('proxy:status', (data: ProxyStatusEvent) => {
      console.log('[WebSocket] proxy:status', data);
      this.callbacks.onProxyStatus?.(data);
    });

    this.socket.on('credentials:updated', (data: CredentialsUpdatedEvent) => {
      console.log('[WebSocket] credentials:updated', data);
      this.callbacks.onCredentialsUpdated?.(data);
    });

    this.socket.on('providers:updated', (data: ProvidersUpdatedEvent) => {
      console.log('[WebSocket] providers:updated', data);
      this.callbacks.onProvidersUpdated?.(data);
    });

    this.socket.on('models:updated', (data: ModelsUpdatedEvent) => {
      console.log('[WebSocket] models:updated', data);
      this.callbacks.onModelsUpdated?.(data);
    });

    this.socket.on('lifecycle:update', (data: LifecycleUpdateEvent) => {
      console.log('[WebSocket] lifecycle:update', data);
      this.callbacks.onLifecycleUpdate?.(data);
    });
  }

  private updateStatus(status: WebSocketConnectionStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
      this.updateStatus('disconnected');
    }
  }

  getStatus(): WebSocketConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
```

---

## providers.service.ts

**File:** `frontend/src/services/providers.service.ts`

```typescript
import type {
  Provider,
  ProviderDetails,
  ProviderTypeInfo,
  ProvidersResponse,
  CreateProviderRequest,
  UpdateProviderRequest
} from '@/types/providers.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

const API_URL = 'http://localhost:3002';

class ProvidersService {
  // Get all providers
  async getProviders(): Promise<Provider[]> {
    const response = await fetch(`${API_URL}/api/providers`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data: ProvidersResponse = await response.json();
    return data.providers;
  }

  // Get provider details including config and models
  async getProviderDetails(providerId: string): Promise<ProviderDetails> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch provider details: ${response.statusText}`);
    }
    return await response.json();
  }

  // Get provider types metadata
  async getProviderTypes(): Promise<ProviderTypeInfo[]> {
    const response = await fetch(`${API_URL}/api/providers/types`);
    if (!response.ok) {
      throw new Error('Failed to fetch provider types');
    }
    const data = await response.json();
    return data.types;
  }

  // Create new provider
  async createProvider(data: CreateProviderRequest): Promise<ProviderDetails> {
    const response = await fetch(`${API_URL}/api/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create provider');
    }
    return await response.json();
  }

  // Update provider
  async updateProvider(providerId: string, data: UpdateProviderRequest): Promise<ProviderDetails> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to update provider');
    }
    return await response.json();
  }

  // Update provider config
  async updateProviderConfig(providerId: string, config: Record<string, any>): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to update provider config');
    }
  }

  async toggleEnabled(provider: Provider): Promise<void> {
    const action = provider.enabled ? 'disable' : 'enable';
    const response = await fetch(`${API_URL}/api/providers/${provider.id}/${action}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to ${action} provider`);
    }
  }

  async testConnection(providerId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${providerId}/test`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Connection test failed');
    }
  }

  async deleteProvider(providerId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${providerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete provider');
    }
  }

  // Switch active provider (updates settings)
  async switchProvider(providerId: string): Promise<void> {
    try {
      // Use the settings store's updateSetting method which handles both API call and store update
      await useSettingsStore.getState().updateSetting('active_provider', providerId);
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  // Reload provider in runtime
  async reloadProvider(providerId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}/reload`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to reload provider');
    }
  }
}

export const providersService = new ProvidersService();
```

---

## models.service.ts

**File:** `frontend/src/services/models.service.ts`

```typescript
import type { Model, ParsedModel, Capability, ModelDetails } from '@/types/models.types';

const API_BASE_URL = 'http://localhost:3002';

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

class ModelsService {
  // Get all models from API server database
  async getModels(): Promise<Model[]> {
    const response = await fetch(`${API_BASE_URL}/api/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  }

  // Get detailed information for a specific model
  async getModelDetails(modelId: string): Promise<ModelDetails> {
    const response = await fetch(`${API_BASE_URL}/api/models/${encodeURIComponent(modelId)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch model details: ${response.statusText}`);
    }

    const data = await response.json();
    return data.model;
  }

  // Get available models from Provider Router (OpenAI-compatible endpoint)
  async getAvailableModels(providerRouterUrl: string): Promise<Model[]> {
    const response = await fetch(`${providerRouterUrl}/v1/models`);

    if (!response.ok) {
      throw new Error(`Failed to fetch available models: ${response.statusText}`);
    }

    const data = await response.json();
    const openaiModels: OpenAIModel[] = data.data || [];

    // Convert OpenAI format to our Model format
    return openaiModels.map((model) => ({
      id: model.id,
      name: model.id,
      description: '',
      capabilities: '[]',
      status: 'active',
      created_at: model.created,
      updated_at: model.created
    }));
  }

  parseModel(model: Model): ParsedModel {
    let capabilities: Capability[] = [];
    try {
      capabilities = JSON.parse(model.capabilities);
    } catch {
      capabilities = [];
    }

    const providerMatch = model.description.match(/Discovered from (.+)$/);
    const provider = providerMatch ? providerMatch[1] : 'Unknown';

    return {
      id: model.id,
      name: model.name,
      description: '',
      capabilities,
      provider,
    };
  }

  getCapabilityDisplay(capability: Capability) {
    if (capability === 'chat' || capability === 'completion') {
      return { label: 'chat', color: 'models-capability-chat' };
    }
    if (capability === 'vision' || capability.includes('vl')) {
      return { label: 'vision', color: 'models-capability-vision' };
    }
    if (capability === 'tools' || capability === 'tool-call') {
      return { label: 'tool-call', color: 'models-capability-tools' };
    }
    if (capability === 'code') {
      return { label: 'code', color: 'models-capability-code' };
    }
    return null;
  }
}

export const modelsService = new ModelsService();
```

---

## credentials.service.ts

**File:** `frontend/src/services/credentials.service.ts`

```typescript
import type { CredentialStatus } from '@/types/credentials.types';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:3002';

class CredentialsService {
  async getStatus(): Promise<CredentialStatus> {
    const response = await fetch(`${API_URL}/api/qwen/credentials`);
    if (response.ok) {
      const data = await response.json();
      // Transform backend format to frontend format
      return {
        valid: data.isValid || false,
        expiresAt: data.expiresAt ? data.expiresAt * 1000 : null, // Convert seconds to milliseconds
      };
    } else if (response.status === 404) {
      return { valid: false, expiresAt: null };
    }
    throw new Error('Failed to fetch credentials status');
  }

  async deleteCredentials(): Promise<void> {
    const response = await fetch(`${API_URL}/api/qwen/credentials`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Failed to delete credentials');
    }
  }

  getStatusInfo(status: CredentialStatus) {
    if (!status.expiresAt) {
      return {
        icon: XCircle,
        label: 'NOT LOGGED IN',
        variant: 'secondary' as const,
        color: 'credentials-status-inactive',
      };
    }

    const now = Date.now();
    const isExpired = status.expiresAt < now;

    if (isExpired) {
      return {
        icon: AlertCircle,
        label: 'EXPIRED',
        variant: 'destructive' as const,
        color: 'credentials-status-expired',
      };
    }

    return {
      icon: CheckCircle,
      label: 'LOGGED IN',
      variant: 'default' as const,
      color: 'credentials-status-valid',
    };
  }

  formatExpiration(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  getTimeRemaining(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return 'Less than 1 hour';
  }
}

export const credentialsService = new CredentialsService();
```

---

## chatService.ts

**File:** `frontend/src/services/chatService.ts`

```typescript
import type { ParsedChatResponse } from '@/types/chat.types';

export const chatService = {
  testChat: async (providerRouterUrl: string, model?: string): Promise<string> => {
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model: model || 'qwen3-max',
          messages: [{ role: 'user', content: 'Say hello in one sentence' }]
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      return 'Error: No response from server';
    } catch (error) {
      console.error('Failed to test chat:', error);
      return 'Error: Could not connect to Provider Router';
    }
  },

  sendChatRequest: async (
    providerRouterUrl: string,
    model: string,
    prompt: string
  ): Promise<string> => {
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      return 'Error: No response from server';
    } catch (error) {
      console.error('Failed to send chat:', error);
      return 'Error: Could not connect to Provider Router';
    }
  },

  parseResponse: (text: string): ParsedChatResponse => {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);

    if (thinkMatch) {
      const thinking = thinkMatch[1].trim();
      const mainResponse = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      return { thinking, mainResponse };
    }

    return { thinking: null, mainResponse: text };
  },
};
```

---

## proxy.service.ts

**File:** `frontend/src/services/proxy.service.ts`

```typescript
import type { ProxyStatus } from '@/types/home.types';

const API_URL = 'http://localhost:3002';

class ProxyService {
  async getStatus(): Promise<ProxyStatus> {
    const response = await fetch(`${API_URL}/api/proxy/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch proxy status');
    }
    return response.json();
  }

  async start(): Promise<void> {
    const response = await fetch(`${API_URL}/api/proxy/start`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to start proxy');
    }
  }

  async stop(): Promise<void> {
    const response = await fetch(`${API_URL}/api/proxy/stop`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to stop proxy');
    }
  }

  formatUptime(seconds?: number): string {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.floor(seconds)}s`;
  }

  formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
}

export const proxyService = new ProxyService();
```

---

## Summary

This document contains the complete verbatim source code for:

**Phase 4: Foundation Layer - Constants (9 files)**
- home.constants.tsx (148 lines)
- providers.constants.tsx (100 lines)
- models.constants.tsx (87 lines)
- settings.constants.tsx (23 lines)
- chat.constants.tsx (48 lines)
- modelForm.constants.tsx (66 lines)
- providerForm.constants.tsx (86 lines)
- browserGuide.constants.tsx (18 lines)
- desktopGuide.constants.tsx (18 lines)

**Phase 5: Service Layer (7 files)**
- api.service.ts (286 lines)
- websocket.service.ts (146 lines)
- providers.service.ts (143 lines)
- models.service.ts (98 lines)
- credentials.service.ts (91 lines)
- chatService.ts (74 lines)
- proxy.service.ts (44 lines)

**Total: 16 files, 1,476 lines of code**
