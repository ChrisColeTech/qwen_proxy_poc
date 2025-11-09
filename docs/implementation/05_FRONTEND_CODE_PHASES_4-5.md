# Frontend V3 Rewrite - Code Documentation: Phases 4-5

This document contains the complete source code for **Phase 4 (Foundation Layer - Constants)** and **Phase 5 (Type Definitions)** of the Frontend V3 Rewrite Implementation Plan.

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
- [Phase 5: Type Definitions](#phase-5-type-definitions)
  - [common.types.ts](#commontypests)
  - [providers.types.ts](#providerstypests)
  - [models.types.ts](#modelstypests)
  - [credentials.types.ts](#credentialstypests)
  - [proxy.types.ts](#proxytypests)
  - [chat.types.ts](#chattypests)
  - [home.types.ts](#hometypests)
  - [quick-guide.types.ts](#quick-guidetypests)
  - [index.ts](#indexts)

---

# Phase 4: Foundation Layer - Constants

## home.constants.tsx

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/home.constants.tsx`
**Lines:** 147

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/providers.constants.tsx`
**Lines:** 100

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/models.constants.tsx`
**Lines:** 87

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/settings.constants.tsx`
**Lines:** 22

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/chat.constants.tsx`
**Lines:** 47

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/modelForm.constants.tsx`
**Lines:** 65

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/providerForm.constants.tsx`
**Lines:** 85

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/browserGuide.constants.tsx`
**Lines:** 18

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

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/constants/desktopGuide.constants.tsx`
**Lines:** 17

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

# Phase 5: Type Definitions

## common.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/common.types.ts`
**Lines:** 10

```typescript
// Common types shared across the application

export interface UIState {
  theme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
  showStatusMessages: boolean;
  showStatusBar: boolean;
}

export type ProxyStatus = 'running' | 'stopped';
```

---

## providers.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/providers.types.ts`
**Lines:** 93

```typescript
// Types for ProvidersPage and related components

export type ProviderType = string;

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  priority: number;
  description: string | null;
  created_at: number;
  updated_at: number;
  runtime_status?: string;
}

export interface ProviderConfig {
  baseURL?: string;
  timeout?: number;
  defaultModel?: string;
  token?: string;
  cookies?: string;
  expiresAt?: number;
}

export interface ProviderModel {
  id: string;
  name: string;
  description: string;
  capabilities: string;
  created_at: number;
  updated_at: number;
  is_default: boolean;
  provider_config: any | null;
}

export interface ProviderDetails extends Provider {
  config?: ProviderConfig;
  models?: ProviderModel[];
}

export interface ProviderTypeInfo {
  value: ProviderType;
  label: string;
  description: string;
  requiredConfig: string[];
  optionalConfig: string[];
  configSchema: Record<string, {
    type: string;
    description: string;
    example?: string;
    default?: any;
  }>;
  capabilities: string[];
}

export interface CreateProviderRequest {
  id: string;
  name: string;
  type: ProviderType;
  enabled?: boolean;
  priority?: number;
  description?: string | null;
  config?: ProviderConfig;
}

export interface UpdateProviderRequest {
  name?: string;
  type?: ProviderType;
  enabled?: boolean;
  priority?: number;
  description?: string | null;
}

export interface ProvidersResponse {
  providers: Provider[];
  total: number;
}

export interface ProviderActionState {
  loading: string | null;
  error: string | null;
}

export interface ProvidersTableProps {
  providers: Provider[];
  actionLoading: string | null;
  onToggleEnabled: (provider: Provider) => void;
  onTest: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onCreate?: () => void;
  onRowClick?: (providerId: string) => void;
}
```

---

## models.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/models.types.ts`
**Lines:** 40

```typescript
// Model types for the Models page

export interface Model {
  id: string;
  name: string;
  description: string;
  capabilities: string; // JSON string array from backend
  status: string;
  created_at: number;
  updated_at: number;
}

export interface ParsedModel {
  id: string;
  name: string;
  description: string;
  capabilities: Capability[];
  provider: string; // Extracted from description
}

export interface ModelProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  description: string | null;
  created_at: number;
  updated_at: number;
  is_default: boolean;
  model_config: any | null;
}

export interface ModelDetails extends Model {
  providers: ModelProvider[];
}

export type Capability = 'chat' | 'vision' | 'tool-call' | 'completion' | 'code' | 'tools';

export type CapabilityFilter = 'all' | 'vision' | 'tool-call' | 'chat';
```

---

## credentials.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/credentials.types.ts`
**Lines:** 20

```typescript
// Types for credential management matching /api/qwen/credentials endpoints

export interface QwenCredentials {
  hasCredentials: boolean;
  expiresAt: number | null;
  isValid: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SetCredentialsRequest {
  token: string;
  cookies: string;
  expiresAt: number;
}

export interface CredentialStatus {
  valid: boolean;
  expiresAt: number | null;
}
```

---

## proxy.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/proxy.types.ts`
**Lines:** 54

```typescript
// Types for proxy management matching /api/proxy/* and /api/providers/* endpoints

export interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority?: number;
  description?: string;
  baseUrl?: string;
  created_at?: number;
  updated_at?: number;
}

export interface Model {
  id: string;
  name?: string;
  providerId?: string;
}

export interface ProxyServerInfo {
  running: boolean;
  port?: number;
  pid?: number;
  uptime?: number;
}

export interface ProxyStatusResponse {
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  qwenProxy?: ProxyServerInfo;
  providerRouter?: ProxyServerInfo;
  providers?: {
    items: Provider[];
    enabled: number;
    total: number;
  };
  models?: {
    items: Model[];
    total: number;
  };
  credentials?: {
    valid: boolean;
    expiresAt: number | null;
  };
  extensionConnected?: boolean;
  message: string;
}

export interface ProxyControlResponse {
  status: 'running' | 'stopped' | 'already_running' | 'error';
  message: string;
  qwenProxy?: ProxyServerInfo;
  providerRouter?: ProxyServerInfo;
}
```

---

## chat.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/chat.types.ts`
**Lines:** 36

```typescript
/**
 * Chat Service Type Definitions
 * Type definitions for chat-related functionality
 */

export interface ParsedChatResponse {
  thinking: string | null;
  mainResponse: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## home.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/home.types.ts`
**Lines:** 32

```typescript
// Types for HomePage and related components

export interface ProxyStatus {
  providerRouter?: {
    running: boolean;
    port: number;
    uptime: number;
  };
  qwenProxy?: {
    running: boolean;
    port: number;
    uptime: number;
  };
  credentials?: {
    valid: boolean;
    expiresAt: number | null;
  };
  providers?: {
    items: any[];
    total: number;
    enabled: number;
  };
  models?: {
    items: any[];
    total: number;
  };
}

export interface ProxyControlState {
  loading: boolean;
  error: string | null;
}
```

---

## quick-guide.types.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/quick-guide.types.ts`
**Lines:** 4

```typescript
export interface CodeBlockProps {
  label: string;
  code: string;
}
```

---

## index.ts

**File:** `/Users/chris/Projects/qwen_proxy_poc/frontend/src/types/index.ts`
**Lines:** 70

```typescript
// Central type export file

export type { UIState, ProxyStatus } from './common.types';
export type { QwenCredentials, SetCredentialsRequest, CredentialStatus } from './credentials.types';
export type {
  Provider,
  Model,
  ProxyServerInfo,
  ProxyStatusResponse,
  ProxyControlResponse,
} from './proxy.types';
export * from "./providers.types"
export * from './models.types'

// WebSocket Event Types
export interface ProxyStatusEvent {
  status: {
    status?: string; // 'running' | 'stopped' | 'partial'
    message?: string;
    providerRouter: { running: boolean; port: number; uptime: number };
    qwenProxy: { running: boolean; port: number; uptime: number };
    credentials: { valid: boolean; expiresAt: number | null };
    providers: { items: any[]; total: number; enabled: number };
    models: { items: any[]; total: number };
    extensionConnected?: boolean;
  };
  timestamp: string;
}

export interface CredentialsUpdatedEvent {
  action: 'updated' | 'deleted';
  credentials: { valid: boolean; expiresAt: number | null };
  timestamp: string;
}

export interface ProvidersUpdatedEvent {
  action: string;
  providers: any[];
  timestamp: string;
}

export interface ModelsUpdatedEvent {
  action: string;
  models: any[];
  timestamp: string;
}

export interface LifecycleUpdateEvent {
  providerRouter?: {
    state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    port: number | null;
    running: boolean;
    error?: string | null;
  };
  qwenProxy?: {
    state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    port: number | null;
    running: boolean;
    error?: string | null;
  };
  timestamp: number;
}

export type WebSocketConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketEvent {
  type: 'proxy:status' | 'credentials:updated' | 'providers:updated' | 'models:updated' | 'lifecycle:update';
  data: any;
  timestamp: string;
}
```

---

## Summary

This document contains the complete verbatim source code for:

**Phase 4: Foundation Layer - Constants (9 files, 588 lines total)**
- home.constants.tsx (147 lines)
- providers.constants.tsx (100 lines)
- models.constants.tsx (87 lines)
- settings.constants.tsx (22 lines)
- chat.constants.tsx (47 lines)
- modelForm.constants.tsx (65 lines)
- providerForm.constants.tsx (85 lines)
- browserGuide.constants.tsx (18 lines)
- desktopGuide.constants.tsx (17 lines)

**Phase 5: Type Definitions (9 files, 359 lines total)**
- common.types.ts (10 lines)
- providers.types.ts (93 lines)
- models.types.ts (40 lines)
- credentials.types.ts (20 lines)
- proxy.types.ts (54 lines)
- chat.types.ts (36 lines)
- home.types.ts (32 lines)
- quick-guide.types.ts (4 lines)
- index.ts (70 lines)

**Total: 18 files, 947 lines of code**
