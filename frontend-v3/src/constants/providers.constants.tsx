import { Blocks, Settings, Zap, Plus, ChevronRight, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      description: '',
      actions: createProviderBadge(isActive ? 'default' : 'secondary', provider.type),
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

export const buildAllProvidersContent = (params: {
  providerActions: ActionItem[];
  onAddProvider: () => void;
}) => {
  const { providerActions, onAddProvider } = params;

  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <Blocks className="icon-primary" />
          <span className="demo-label-text">Available Providers</span>
        </div>
      </div>

      {/* Add Provider Button Row */}
      <div className="model-filters-row" style={{ flexShrink: 0, justifyContent: 'flex-end' }}>
        <Button onClick={onAddProvider} variant="outline" size="sm">
          <Plus className="icon-sm mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Providers List */}
      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {providerActions.map((item, index) => (
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
                {item.description && (
                  <div className="provider-switch-type">{item.description}</div>
                )}
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
