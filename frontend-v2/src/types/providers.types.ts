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
