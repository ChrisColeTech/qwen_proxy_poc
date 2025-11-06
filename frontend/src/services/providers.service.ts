import { apiService } from './api.service';

export interface Provider {
  id: string;
  name: string;
  type: 'lm-studio' | 'qwen-proxy' | 'qwen-direct';
  enabled: boolean;
  priority: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProvidersResponse {
  providers: Provider[];
  total: number;
  enabled: number;
  disabled: number;
}

export interface CreateProviderRequest {
  id: string;
  name: string;
  type: 'lm-studio' | 'qwen-proxy' | 'qwen-direct';
  enabled?: boolean;
  priority?: number;
  description?: string;
  config?: Record<string, unknown>;
}

export interface UpdateProviderRequest {
  name?: string;
  type?: 'lm-studio' | 'qwen-proxy' | 'qwen-direct';
  enabled?: boolean;
  priority?: number;
  description?: string;
}

class ProvidersService {
  async listProviders(params?: { type?: string; enabled?: boolean }): Promise<ProvidersResponse> {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return apiService.get<ProvidersResponse>(`/api/providers${queryString}`);
  }

  async getProvider(id: string): Promise<{ provider: Provider }> {
    return apiService.get<{ provider: Provider }>(`/api/providers/${id}`);
  }

  async createProvider(data: CreateProviderRequest): Promise<{ provider: Provider }> {
    return apiService.post<{ provider: Provider }>('/api/providers', data);
  }

  async updateProvider(id: string, data: UpdateProviderRequest): Promise<{ provider: Provider }> {
    return apiService.put<{ provider: Provider }>(`/api/providers/${id}`, data);
  }

  async deleteProvider(id: string): Promise<{ success: boolean; message: string; provider_id: string }> {
    return apiService.delete<{ success: boolean; message: string; provider_id: string }>(`/api/providers/${id}`);
  }

  async enableProvider(id: string): Promise<{ success: boolean; provider: Provider }> {
    return apiService.post<{ success: boolean; provider: Provider }>(`/api/providers/${id}/enable`);
  }

  async disableProvider(id: string): Promise<{ success: boolean; provider: Provider }> {
    return apiService.post<{ success: boolean; provider: Provider }>(`/api/providers/${id}/disable`);
  }

  async testProvider(id: string): Promise<{ success: boolean; message: string; result?: unknown }> {
    return apiService.post<{ success: boolean; message: string; result?: unknown }>(`/api/providers/${id}/test`);
  }

  async reloadProvider(id: string): Promise<{ success: boolean; provider: Provider }> {
    return apiService.post<{ success: boolean; provider: Provider }>(`/api/providers/${id}/reload`);
  }
}

export const providersService = new ProvidersService();
