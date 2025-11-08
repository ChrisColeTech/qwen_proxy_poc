// Types for ProvidersPage and related components

export interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  description: string;
  created_at: number;
  updated_at: number;
  runtime_status: string;
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
