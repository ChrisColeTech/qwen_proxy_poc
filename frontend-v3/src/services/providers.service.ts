import type { Provider, ProvidersResponse } from '@/types/providers.types';
import { apiService } from './api.service';

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
      await apiService.setActiveProvider(providerId);
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
