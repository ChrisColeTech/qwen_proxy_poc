// Re-export shared types from proxy.types
export type { Provider, Model } from './proxy.types';
import type { Provider, Model } from './proxy.types';

export interface ModelsStepProps {
  models: Model[];
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}

export interface ChatCompletionStepProps {
  response: string;
  loading: boolean;
  onTest: () => void;
  providerRouterUrl: string;
  activeModel?: string;
}

export interface ProviderSwitchStepProps {
  providers: Provider[];
  activeProvider: string;
  loading: boolean;
  onSwitch: (providerId: string) => void;
  apiBaseUrl: string;
}

export interface CodeBlockProps {
  label: string;
  code: string;
}
