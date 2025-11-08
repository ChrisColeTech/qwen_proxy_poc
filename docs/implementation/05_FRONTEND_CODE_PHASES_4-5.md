# Frontend V3 Rewrite - Code Documentation: Phases 4-5

This document contains the complete source code for **Phase 4 (Foundation Layer - Constants)** and **Phase 5 (Service Layer)** of the Frontend V3 Rewrite Implementation Plan.

## Table of Contents

- [Phase 4: Foundation Layer - Constants](#phase-4-foundation-layer---constants)
  - [Phase 4.1: Page Constants](#phase-41-page-constants)
  - [Phase 4.2: Guide Constants](#phase-42-guide-constants)
  - [Phase 4.3: Constants Integration](#phase-43-constants-integration)
- [Phase 5: Service Layer](#phase-5-service-layer)
  - [Phase 5.1: Core API Service](#phase-51-core-api-service)
  - [Phase 5.2: WebSocket Service](#phase-52-websocket-service)
  - [Phase 5.3: Domain Services](#phase-53-domain-services)

---

## Phase 4: Foundation Layer - Constants

**Objective**: Centralize all page-level constants, tab configurations, and guide content to eliminate magic strings and enforce the DRY principle.

### Phase 4.1: Page Constants

Page constants provide centralized configuration for all page-level UI elements, tab structures, action builders, and content generators.

#### 1. Home Page Constants

```typescript
// frontend/src/constants/home.constants.tsx
import type { ReactNode } from 'react';
import { ChevronRight, Gauge, Copy, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="qwen3-max",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;

const nodeExample = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3001/v1',
  apiKey: 'dummy-key'
});

const completion = await openai.chat.completions.create({
  model: 'qwen3-max',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);`;

export const buildStatusTabContent = (
  port: number | undefined,
  baseUrl: string,
  copiedUrl: boolean,
  handleCopyUrl: () => void
) => (
  <div className="space-y-8">
    {/* Base URL Section */}
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono">
          {baseUrl}/v1
        </code>
        <Button
          onClick={handleCopyUrl}
          size="icon"
          variant="outline"
          title="Copy base URL"
          className="h-10 w-10 shrink-0"
        >
          {copiedUrl ? (
            <CheckCircle className="h-4 w-4 status-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Authentication happens through stored Qwen credentials, so you can use any string as the API key.
      </p>
    </div>

    {/* Divider */}
    <div className="border-t border-border" />

    {/* Quick Tests Section */}
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight">Quick Tests</h3>
      <div className="space-y-3">
        <CodeBlock
          label="Check proxy health"
          code={`curl http://localhost:${port || 3001}/health`}
        />
        <CodeBlock
          label="List available models"
          code={`curl http://localhost:${port || 3001}/v1/models`}
        />
      </div>
    </div>

    {/* Divider */}
    <div className="border-t border-border" />

    {/* SDK Integration Section */}
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight">SDK Integration</h3>
      <Tabs defaultValue="python" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="node">Node.js</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
        </TabsList>
        <TabsContent value="python" className="mt-4">
          <CodeBlock label="Using OpenAI Python SDK" code={pythonExample} />
        </TabsContent>
        <TabsContent value="node" className="mt-4">
          <CodeBlock label="Using OpenAI Node.js SDK" code={nodeExample} />
        </TabsContent>
        <TabsContent value="curl" className="mt-4">
          <CodeBlock
            label="Chat completion example"
            code={`curl http://localhost:${port || 3001}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hello!"}]}'`}
          />
        </TabsContent>
      </Tabs>
    </div>
  </div>
);

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

**Key Features**:
- Action item builders that dynamically create UI elements based on state
- Badge and icon helpers for consistent visual feedback
- Tab content builders with embedded code examples
- Centralized text constants for titles and descriptions

#### 2. Providers Page Constants

```typescript
// frontend/src/constants/providers.constants.tsx
import { Blocks, Settings, Zap, Plus, ChevronRight, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from './home.constants';
import type { Provider } from '@/types/providers.types';

export const PROVIDERS_TABS = {
  SWITCH: {
    value: 'switch',
    label: 'Switch Provider',
    description: 'The Provider Router can route to different AI backends. Switch providers dynamically:'
  },
  ALL: {
    value: 'all',
    label: 'All Providers',
    description: 'View and manage all configured AI providers'
  },
  SETTINGS: {
    value: 'settings',
    label: 'Settings',
    description: 'Configure provider settings and API keys'
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
      icon: <StatusIndicator status={isActive ? 'running' : 'stopped'} />,
      title: provider.name,
      description: provider.type,
      actions: isActive
        ? createProviderBadge('default', 'Active')
        : canSwitch
        ? createProviderBadge('secondary', 'Switch')
        : createProviderBadge('outline', 'Disabled'),
      onClick: canSwitch ? () => onSwitch(provider.id) : undefined,
      disabled: !canSwitch
    };
  });
};

export const buildProviderActions = (params: {
  providers: Provider[];
  handleProviderClick: (providerId: string) => void;
}): ActionItem[] => {
  const { providers, handleProviderClick } = params;

  return providers.map((provider) => ({
    icon: <StatusIndicator status={provider.enabled ? 'running' : 'stopped'} />,
    title: provider.name,
    description: provider.type,
    actions: createProviderBadge(
      provider.enabled ? 'default' : 'secondary',
      provider.enabled ? 'Enabled' : 'Disabled'
    ),
    onClick: () => handleProviderClick(provider.id)
  }));
};

export const buildProviderSwitchContent = (switchActions: ActionItem[]) => (
  <ActionList title="Available Providers" icon={Network} items={switchActions} />
);

export const buildAllProvidersContent = (providerActions: ActionItem[]) => (
  <ActionList title="Available Providers" icon={Blocks} items={providerActions} />
);

export const buildActiveProvidersContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Zap className="icon-primary" />
          <span className="demo-label-text">Active Providers</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIndicator status="running" />
              <div>
                <p className="font-medium">OpenAI</p>
                <p className="text-sm text-muted-foreground">2 models available</p>
              </div>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <StatusIndicator status="running" />
              <div>
                <p className="font-medium">Anthropic</p>
                <p className="text-sm text-muted-foreground">3 models available</p>
              </div>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const buildSettingsContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Settings className="icon-primary" />
          <span className="demo-label-text">Provider Settings</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Settings className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Configure API keys and settings for your providers.
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Click on a provider from the "All Providers" tab to configure its settings.
          </p>
        </div>
      </div>
    </div>
  </div>
);
```

**Key Features**:
- Provider switching logic with status-based badges
- Reusable content builders for different views
- Dynamic action item generation from provider list

#### 3. Models Page Constants

```typescript
// frontend/src/constants/models.constants.tsx
import { Filter, Database, Star, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionItem } from './home.constants';
import type { Model, CapabilityFilter } from '@/types/models.types';

export const MODELS_TABS = {
  SELECT: {
    value: 'select',
    label: 'Select Model',
    description: 'Select an active model to use with the Provider Router:'
  },
  ALL: {
    value: 'all',
    label: 'All Models',
    description: 'Browse all available AI models'
  },
  FAVORITES: {
    value: 'favorites',
    label: 'Favorites',
    description: 'Your favorite models for quick access'
  }
} as const;

export const MODELS_TITLE = 'Models';
export const MODELS_ICON = Database;
export const FILTER_ICON = Filter;

const createModelBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[100px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

export const buildModelSelectActions = (params: {
  models: Model[];
  activeModel: string;
  onSelect: (modelId: string) => void;
}): ActionItem[] => {
  const { models, activeModel, onSelect } = params;

  return models.map((model) => {
    const isActive = model.id === activeModel;

    return {
      icon: <StatusIndicator status={isActive ? 'running' : 'stopped'} />,
      title: model.id,
      description: model.description || model.name,
      actions: isActive
        ? createModelBadge('default', 'Active')
        : createModelBadge('secondary', 'Select'),
      onClick: isActive ? undefined : () => onSelect(model.id),
      disabled: isActive
    };
  });
};

export const buildModelActions = (params: {
  models: Model[];
  handleModelClick: (modelId: string) => void;
}): ActionItem[] => {
  const { models, handleModelClick } = params;

  return models.map((model) => ({
    icon: <StatusIndicator status="running" />,
    title: model.id,
    description: model.description || model.name,
    actions: createModelBadge('default', 'Available'),
    onClick: () => handleModelClick(model.id)
  }));
};

export const buildModelSelectContent = (selectActions: ActionItem[]) => (
  <ActionList title="Available Models" icon={CheckCircle2} items={selectActions} />
);

export const buildAllModelsContent = (params: {
  modelActions: ActionItem[];
  capabilityFilter: CapabilityFilter;
  providerFilter: string;
  providers: string[];
  onCapabilityChange: (value: CapabilityFilter) => void;
  onProviderChange: (value: string) => void;
}) => {
  const { modelActions, capabilityFilter, providerFilter, providers, onCapabilityChange, onProviderChange } = params;

  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <Database className="icon-primary" />
          <span className="demo-label-text">Browse Models</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="model-filters-row" style={{ flexShrink: 0 }}>
        <div className="model-filter-group">
          <span className="model-filter-label">Capability:</span>
          <Select value={capabilityFilter} onValueChange={onCapabilityChange}>
            <SelectTrigger className="models-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Capabilities</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="vision">Vision</SelectItem>
              <SelectItem value="tool-call">Tool Calling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="model-filter-group">
          <span className="model-filter-label">Provider:</span>
          <Select value={providerFilter} onValueChange={onProviderChange}>
            <SelectTrigger className="models-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Models List */}
      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {modelActions.map((item, index) => (
          <div
            key={index}
            className="provider-switch-item"
            onClick={item.disabled ? undefined : item.onClick}
            style={{ cursor: item.disabled ? 'not-allowed' : item.onClick ? 'pointer' : 'default' }}
          >
            <div className="provider-switch-info">
              {item.icon}
              <div className="provider-switch-details">
                <div className="provider-switch-name">{item.title}</div>
                <div className="provider-switch-type">{item.description}</div>
              </div>
            </div>
            {item.actions && (
              <div className="provider-switch-actions">
                {item.actions}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const buildFavoritesContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Star className="icon-primary" />
          <span className="demo-label-text">Favorite Models</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <p className="text-muted-foreground text-center py-8">
          No favorite models yet. Click the star icon on any model to add it to your favorites.
        </p>
      </div>
    </div>
  </div>
);

export const buildRecentContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Clock className="icon-primary" />
          <span className="demo-label-text">Recently Used</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <p className="text-muted-foreground text-center py-8">
          No recently used models. Start using models to see them here.
        </p>
      </div>
    </div>
  </div>
);
```

**Key Features**:
- Model selection with active/inactive states
- Advanced filtering UI with capability and provider filters
- Embedded filter controls within content builders

#### 4. Settings Page Constants

```typescript
// frontend/src/constants/settings.constants.tsx
import { Settings, Network, Bug, Palette } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ContentCard } from '@/components/ui/content-card';

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

// Setting row builder helper
const buildSettingRow = (
  label: string,
  description: string,
  control: React.ReactNode
) => (
  <div className="flex-row-between">
    <div className="vspace-tight">
      <div className="text-setting-label">{label}</div>
      <div className="text-setting-description">{description}</div>
    </div>
    {control}
  </div>
);

// Appearance Tab Builder
export const buildAppearanceContent = (params: {
  theme: string;
  sidebarPosition: string;
  showStatusMessages: boolean;
  handleThemeChange: (value: string) => void;
  handleSidebarPositionChange: (value: string) => void;
  handleStatusMessagesChange: (value: string) => void;
}) => {
  const {
    theme,
    sidebarPosition,
    showStatusMessages,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
  } = params;

  return (
    <ContentCard icon={Palette} title="Appearance Settings">
      <div className="vspace-md p-4">
        {buildSettingRow(
          'Theme',
          'Choose your preferred color theme',
          <ToggleGroup
            type="single"
            value={theme}
            onValueChange={handleThemeChange}
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        )}

        <div className="divider-horizontal" />

        {buildSettingRow(
          'Sidebar Position',
          'Choose where the sidebar appears',
          <ToggleGroup
            type="single"
            value={sidebarPosition}
            onValueChange={handleSidebarPositionChange}
          >
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        )}

        <div className="divider-horizontal" />

        {buildSettingRow(
          'Status Bar Messages',
          'Show all status information in the status bar',
          <ToggleGroup
            type="single"
            value={showStatusMessages ? 'show' : 'hide'}
            onValueChange={handleStatusMessagesChange}
          >
            <ToggleGroupItem value="show">Show</ToggleGroupItem>
            <ToggleGroupItem value="hide">Hide</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
    </ContentCard>
  );
};

// Proxy Settings Tab Builder
export const buildProxyContent = () => {
  return (
    <div className="vspace-md">
      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Network className="icon-primary" />
            <span className="demo-label-text">Proxy Configuration</span>
          </div>
        </div>
        <div className="provider-switch-list">
          <p className="text-muted-foreground text-center py-8">
            Proxy settings coming soon. Configure default port, timeout settings, and connection options.
          </p>
        </div>
      </div>
    </div>
  );
};

// Debug Settings Tab Builder
export const buildDebugContent = () => {
  return (
    <div className="vspace-md">
      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Bug className="icon-primary" />
            <span className="demo-label-text">Debug Options</span>
          </div>
        </div>
        <div className="provider-switch-list">
          <p className="text-muted-foreground text-center py-8">
            Debug settings coming soon. Enable verbose logging, request/response inspection, and developer tools.
          </p>
        </div>
      </div>
    </div>
  );
};
```

**Key Features**:
- Settings row builder for consistent layout
- Tab content builders with ToggleGroup controls
- Placeholder content for future features

#### 5. Chat Page Constants

```typescript
// frontend/src/constants/chat.constants.tsx
import { MessageSquare, History, Plus, ChevronRight, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from './home.constants';

export const CHAT_TABS = {
  ACTIVE: {
    value: 'active',
    label: 'Active Chats',
    description: 'Your current chat conversations'
  },
  HISTORY: {
    value: 'history',
    label: 'History',
    description: 'Browse past conversations'
  },
  NEW: {
    value: 'new',
    label: 'New Chat',
    description: 'Start a new conversation'
  }
} as const;

export const CHAT_TITLE = 'Chat';
export const CHAT_ICON = MessageSquare;
export const HISTORY_ICON = History;
export const NEW_CHAT_ICON = Plus;
export const SEND_ICON = Send;

const createChatBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[100px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

export const buildChatActions = (params: {
  handleConversationClick: (conversationId: string) => void;
}): ActionItem[] => {
  const { handleConversationClick } = params;

  return [
    {
      icon: <StatusIndicator status="running" />,
      title: 'Chat with GPT-4',
      description: 'Discussing project architecture - 15 messages',
      actions: createChatBadge('default', 'Active'),
      onClick: () => handleConversationClick('chat-1')
    },
    {
      icon: <StatusIndicator status="running" />,
      title: 'Code Review Session',
      description: 'React component refactoring - 8 messages',
      actions: createChatBadge('default', 'Active'),
      onClick: () => handleConversationClick('chat-2')
    },
    {
      icon: <StatusIndicator status="stopped" />,
      title: 'API Integration Help',
      description: 'REST API design discussion - 23 messages',
      actions: createChatBadge('secondary', 'Archived'),
      onClick: () => handleConversationClick('chat-3')
    }
  ];
};

export const buildActiveChatContent = (chatActions: ActionItem[]) => (
  <ActionList title="Active Conversations" icon={MessageSquare} items={chatActions} />
);

export const buildHistoryContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <History className="icon-primary" />
          <span className="demo-label-text">Chat History</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <p className="text-muted-foreground text-center py-8">
          No archived conversations. Your past chats will appear here.
        </p>
      </div>
    </div>
  </div>
);

export const buildNewChatContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Plus className="icon-primary" />
          <span className="demo-label-text">New Chat</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Start a new conversation with any configured AI model.
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Select a model from the dropdown and begin chatting. Your conversation will be saved automatically.
          </p>
        </div>
      </div>
    </div>
  </div>
);
```

**Key Features**:
- Chat conversation action builders
- Mock conversation data for demonstration
- Content builders for different chat views

### Phase 4.2: Guide Constants

Guide constants provide structured content for onboarding and help pages.

#### 6. API Guide Constants

```typescript
// frontend/src/constants/apiGuide.constants.tsx
import { Code, Copy, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { Button } from '@/components/ui/button';

export const API_GUIDE_TITLE = 'API Guide';
export const API_GUIDE_ICON = Code;

// Code examples
export const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="qwen3-max",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;

export const nodeExample = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3001/v1',
  apiKey: 'dummy-key'
});

const completion = await openai.chat.completions.create({
  model: 'qwen3-max',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);`;

export const curlExample = `curl http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hello!"}]}'`;

// Base URL Section Builder
export const buildBaseUrlSection = (params: {
  baseUrl: string;
  copiedUrl: boolean;
  handleCopyUrl: () => void;
}) => {
  const { baseUrl, copiedUrl, handleCopyUrl } = params;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Base URL</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono">
          {baseUrl}/v1
        </code>
        <Button
          onClick={handleCopyUrl}
          size="icon"
          variant="outline"
          title="Copy base URL"
          className="h-10 w-10 shrink-0"
        >
          {copiedUrl ? (
            <CheckCircle className="h-4 w-4 status-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Authentication happens through stored Qwen credentials, so you can use any string as the API key.
      </p>
    </div>
  );
};

// Content Builder with nested tabs for code examples
export const buildApiGuideContent = (params: {
  baseUrl: string;
  copiedUrl: boolean;
  handleCopyUrl: () => void;
}) => {
  return (
    <div className="space-y-4">
      {buildBaseUrlSection(params)}

      <Tabs defaultValue="python" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="node">Node.js</TabsTrigger>
          <TabsTrigger value="curl">cURL</TabsTrigger>
        </TabsList>
        <TabsContent value="python" className="mt-4">
          <CodeBlock label="Using OpenAI Python SDK" code={pythonExample} />
        </TabsContent>
        <TabsContent value="node" className="mt-4">
          <CodeBlock label="Using OpenAI Node.js SDK" code={nodeExample} />
        </TabsContent>
        <TabsContent value="curl" className="mt-4">
          <CodeBlock label="Using cURL (Command Line)" code={curlExample} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

**Key Features**:
- Multi-language code examples (Python, Node.js, cURL)
- Copy-to-clipboard functionality for base URL
- Embedded tabs for different SDK examples

#### 7. Browser Guide Constants

```typescript
// frontend/src/constants/browserGuide.constants.tsx
import { Globe, Chrome, CheckCircle, ArrowRight } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';

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

// All Steps Combined in One Tab
export const buildBrowserGuideContent = () => {
  return (
    <div className="vspace-md">
      <p className="step-description mb-6">
        Use the Chrome extension to extract Qwen credentials and proxy requests to Qwen's API.
        The extension handles authentication automatically after you log in.
      </p>

      <ContentCard icon={Chrome} title="Step 1: Install Chrome Extension (First Time)">
        <div className="guide-step-list">
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Go to <span className="step-inline-code">chrome://extensions/</span> and enable "Developer mode"
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click "Load unpacked" and select the <span className="step-inline-code">/extension</span> folder
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Extension is ready - no additional configuration needed
            </div>
          </div>
        </div>
      </ContentCard>

      <ContentCard icon={CheckCircle} title="Step 2: Authenticate">
        <div className="guide-step-list">
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click <span className="step-inline-code">Connect to Qwen</span> to open chat.qwen.ai
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">Log in with your Qwen account</div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Extension auto-extracts credentials and dashboard updates in 5 seconds
            </div>
          </div>
        </div>
      </ContentCard>

      <ContentCard icon={ArrowRight} title="Step 3: Start Proxy & Use API">
        <div className="demo-header">
          <Badge variant="secondary">Ready to Use</Badge>
        </div>
        <div className="vspace-sm p-4">
          <p className="text-setting-description">
            Click <span className="step-inline-code">Start Proxy</span>, wait for Running status,
            then point your code to <span className="step-inline-code">http://localhost:3001</span>
          </p>
        </div>
      </ContentCard>
    </div>
  );
};
```

**Key Features**:
- Step-by-step installation guide
- Chrome extension setup instructions
- Visual hierarchy with ContentCard components

#### 8. Desktop Guide Constants

```typescript
// frontend/src/constants/desktopGuide.constants.tsx
import { Monitor, Zap, Shield, Clock, CheckCircle } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { Badge } from '@/components/ui/badge';

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

// All Steps Combined in One Tab
export const buildDesktopGuideContent = () => {
  return (
    <div className="vspace-md">
      <p className="step-description mb-6">
        The desktop app uses native Electron integration for instant credential extraction.
        No Chrome extension required - authentication happens directly in a secure browser window.
      </p>

      <ContentCard icon={Zap} title="Advantages Over Browser">
        <div className="demo-header">
          <Badge variant="secondary">Recommended</Badge>
        </div>
        <div className="guide-benefits-grid">
          <div className="guide-benefit-item">
            <Zap className="guide-benefit-icon" />
            <div>
              <div className="guide-benefit-title">No Extension Required</div>
              <div className="guide-benefit-description">Native Electron integration</div>
            </div>
          </div>
          <div className="guide-benefit-item">
            <Clock className="guide-benefit-icon" />
            <div>
              <div className="guide-benefit-title">Instant Extraction</div>
              <div className="guide-benefit-description">No polling delay</div>
            </div>
          </div>
          <div className="guide-benefit-item">
            <Shield className="guide-benefit-icon" />
            <div>
              <div className="guide-benefit-title">More Secure</div>
              <div className="guide-benefit-description">Credentials never leave process</div>
            </div>
          </div>
        </div>
      </ContentCard>

      <ContentCard icon={CheckCircle} title="Authentication Steps">
        <div className="guide-step-list">
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click <span className="step-inline-code">Connect to Qwen</span> to open secure window
            </div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">Log in at chat.qwen.ai</div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">Window closes automatically, credentials saved instantly</div>
          </div>
          <div className="guide-step-item">
            <CheckCircle className="guide-step-icon" />
            <div className="guide-step-text">
              Click <span className="step-inline-code">Start Proxy</span> and point code to localhost:3001
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  );
};
```

**Key Features**:
- Highlights advantages over browser mode
- Benefits grid layout
- Clear authentication flow

### Phase 4.3: Constants Integration

#### 9. Constants Barrel Export

```typescript
// frontend/src/constants/index.ts
// Barrel file for constants
export * from './home.constants';
export * from './models.constants';
export * from './chat.constants';
export * from './providers.constants';
export * from './apiGuide.constants';
export * from './settings.constants';
export * from './browserGuide.constants';
export * from './desktopGuide.constants';
```

**Key Features**:
- Single import point for all constants
- Enables clean imports: `import { HOME_TABS, MODELS_TITLE } from '@/constants'`

---

## Phase 5: Service Layer

**Objective**: Implement business logic and API communication services following SRP (Single Responsibility Principle) and providing type-safe interfaces.

### Phase 5.1: Core API Service

#### 1. API Service

```typescript
// frontend/src/services/api.service.ts
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

**Key Features**:
- Complete CRUD operations for providers
- Provider configuration management with masking
- Settings management with dedicated methods
- Consistent error handling and logging
- Type-safe interfaces for all operations

### Phase 5.2: WebSocket Service

#### 2. WebSocket Service

```typescript
// frontend/src/services/websocket.service.ts
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

**Key Features**:
- Singleton pattern for single WebSocket connection
- Automatic reconnection with exponential backoff
- Type-safe event callbacks
- Connection status tracking
- Comprehensive logging for debugging

### Phase 5.3: Domain Services

#### 3. Providers Service

```typescript
// frontend/src/services/providers.service.ts
import type { Provider, ProvidersResponse } from '@/types/providers.types';
import { apiService } from './api.service';
import { useSettingsStore } from '@/stores/useSettingsStore';

const API_URL = 'http://localhost:3002';

class ProvidersService {
  async getProviders(): Promise<Provider[]> {
    const response = await fetch(`${API_URL}/api/providers`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data: ProvidersResponse = await response.json();
    return data.providers;
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

  async switchProvider(providerId: string): Promise<void> {
    try {
      // Use the settings store's updateSetting method which handles both API call and store update
      await useSettingsStore.getState().updateSetting('active_provider', providerId);
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  async createProvider(data: {
    id: string;
    name: string;
    type: string;
    enabled?: boolean;
    priority?: number;
    description?: string;
    config?: Record<string, unknown>;
  }): Promise<Provider> {
    const response = await fetch(`${API_URL}/api/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create provider');
    }
    return await response.json();
  }

  async getProviderTypes(): Promise<Array<{ value: string; label: string; description: string; requiredConfig: string[]; configSchema: Record<string, any> }>> {
    const response = await fetch(`${API_URL}/api/providers/types`);
    if (!response.ok) {
      throw new Error('Failed to fetch provider types');
    }
    const data = await response.json();
    return data.types;
  }
}

export const providersService = new ProvidersService();
```

**Key Features**:
- Domain-specific provider operations
- Integration with settings store
- Provider type discovery
- Connection testing capability

#### 4. Models Service

```typescript
// frontend/src/services/models.service.ts
import type { Model, ParsedModel, Capability } from '@/types/models.types';

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
      description: `Available via Provider Router`,
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
      description: model.description.split(' - Discovered from')[0].trim(),
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

**Key Features**:
- Dual data sources: API server database and Provider Router
- Model parsing and transformation
- Capability display formatting
- Provider extraction from model metadata

#### 5. Credentials Service (Primary)

```typescript
// frontend/src/services/credentials.service.ts
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

**Key Features**:
- Credential status checking with expiration handling
- Status badge and icon helpers
- Time formatting utilities
- Unit conversion (seconds to milliseconds)

#### 6. Credentials Service (Alternative)

```typescript
// frontend/src/services/credentialsService.ts
import type { QwenCredentials, SetCredentialsRequest } from '@/types';

const API_BASE = 'http://localhost:3002';

export const credentialsService = {
  async getCredentials(): Promise<QwenCredentials | null> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to get credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  },

  async setCredentials(request: SetCredentialsRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to set credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error setting credentials:', error);
      throw error;
    }
  },

  async revokeCredentials(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to revoke credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error revoking credentials:', error);
      throw error;
    }
  },

  isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  },
};
```

**Key Features**:
- Simple object-based service (not class-based)
- Platform detection utility
- CRUD operations for credentials

#### 7. Chat Service (Primary)

```typescript
// frontend/src/services/chat.service.ts
const API_BASE_URL = 'http://localhost:3002';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
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
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatTestResult {
  success: boolean;
  response?: ChatCompletionResponse;
  error?: string;
  latency?: number;
}

class ChatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async testChat(
    model: string = 'qwen-turbo',
    message: string = 'Hello! Can you respond with a brief greeting?'
  ): Promise<ChatTestResult> {
    const startTime = Date.now();

    try {
      const request: ChatCompletionRequest = {
        model,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 100,
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          latency,
        };
      }

      const data: ChatCompletionResponse = await response.json();

      return {
        success: true,
        response: data,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        latency,
      };
    }
  }

  async streamChat(
    model: string,
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const request: ChatCompletionRequest = {
        model,
        messages,
        stream: true,
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        onError(`HTTP ${response.status}: ${errorText}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body reader available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') {
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}

export const chatService = new ChatService();
```

**Key Features**:
- OpenAI-compatible chat completion interface
- Streaming support with SSE parsing
- Latency tracking
- Comprehensive error handling

#### 8. Chat Service (Alternative)

```typescript
// frontend/src/services/chatService.ts
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

**Key Features**:
- Simplified chat testing interface
- Response parsing for thinking tags
- Direct communication with Provider Router

#### 9. Proxy Service

```typescript
// frontend/src/services/proxy.service.ts
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

**Key Features**:
- Proxy lifecycle management (start/stop)
- Status polling
- Time formatting utilities
- Simple interface for proxy control

---

## Summary

### Phase 4 - Constants Layer

**Files Created**: 9 files
- 5 page constants files (home, providers, models, settings, chat)
- 3 guide constants files (API, browser, desktop)
- 1 barrel export file

**Key Achievements**:
- Eliminated all magic strings from components
- Centralized tab configurations
- Dynamic content builders for all pages
- Consistent action item generation
- Reusable badge and icon helpers

### Phase 5 - Service Layer

**Files Created**: 9 files
- 1 core API service (providers, settings, CRUD operations)
- 1 WebSocket service (real-time events)
- 7 domain services (providers, models, credentials x2, chat x2, proxy)

**Key Achievements**:
- Type-safe API communication
- WebSocket singleton with automatic reconnection
- Domain-specific business logic encapsulation
- Consistent error handling patterns
- Service abstraction for testing and maintenance

**Design Patterns Used**:
- Singleton pattern (WebSocket service)
- Service layer pattern (domain services)
- Factory pattern (content builders in constants)
- Repository pattern (API service)

**Integration Points**:
- Constants used by all page components
- Services used by hooks and stores
- WebSocket service integrated with lifecycle store
- API service as foundation for all domain services

---

**Document Version:** 1.0
**Date:** 2025-11-08
**Status:** Complete
**Phase Coverage:** Phases 4-5 of Frontend V3 Rewrite Implementation Plan
