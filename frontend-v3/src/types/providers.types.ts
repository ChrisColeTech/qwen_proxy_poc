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
