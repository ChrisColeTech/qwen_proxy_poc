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

