// Re-export shared types
import type { ParsedModel, CapabilityFilter } from './models.types';
import type { Provider } from './providers.types';

export interface ModelsStepProps {
  models: ParsedModel[];
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
  capabilityFilter?: CapabilityFilter;
  providerFilter?: string;
  providers?: string[];
  setCapabilityFilter?: (filter: CapabilityFilter) => void;
  setProviderFilter?: (filter: string) => void;
  clearFilters?: () => void;
  error?: string | null;
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
  actionLoading?: string | null;
  onToggleEnabled?: (id: string) => void;
  onTest?: (id: string) => void;
  onDelete?: (provider: Provider) => void;
  onCreate?: () => void;
  onRowClick?: (providerId: string) => void;
}

export interface CodeBlockProps {
  label: string;
  code: string;
}
