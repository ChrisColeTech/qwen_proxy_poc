import type { Provider, ProvidersResponse } from '@/types/providers.types';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

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
}

export const providersService = new ProvidersService();
