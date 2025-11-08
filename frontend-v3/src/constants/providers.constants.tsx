import { Blocks, Settings, Zap, Plus, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from './home.constants';

export const PROVIDERS_TABS = {
  ALL: {
    value: 'all',
    label: 'All Providers',
    description: 'View and manage all configured AI providers'
  },
  ACTIVE: {
    value: 'active',
    label: 'Active',
    description: 'Currently enabled providers'
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

export const buildProviderActions = (params: {
  handleProviderClick: (providerId: string) => void;
}): ActionItem[] => {
  const { handleProviderClick } = params;

  return [
    {
      icon: <StatusIndicator status="running" />,
      title: 'OpenAI',
      description: 'GPT-4, GPT-3.5 Turbo, and DALL-E models',
      actions: createProviderBadge('default', 'Connected'),
      onClick: () => handleProviderClick('openai')
    },
    {
      icon: <StatusIndicator status="running" />,
      title: 'Anthropic',
      description: 'Claude 3 Opus, Sonnet, and Haiku models',
      actions: createProviderBadge('default', 'Connected'),
      onClick: () => handleProviderClick('anthropic')
    },
    {
      icon: <StatusIndicator status="stopped" />,
      title: 'Google AI',
      description: 'Gemini Pro and other Google models',
      actions: createProviderBadge('secondary', 'Not Configured'),
      onClick: () => handleProviderClick('google'),
      disabled: true
    },
    {
      icon: <StatusIndicator status="stopped" />,
      title: 'Qwen',
      description: 'Alibaba Qwen models via proxy',
      actions: createProviderBadge('secondary', 'Not Configured'),
      onClick: () => handleProviderClick('qwen'),
      disabled: true
    }
  ];
};

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
