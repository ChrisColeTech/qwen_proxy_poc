import type {
  Provider,
  ProviderDetails,
  ProviderTypeInfo,
  ProvidersResponse,
  CreateProviderRequest,
  UpdateProviderRequest
} from '@/types/providers.types';
import { useSettingsStore } from '@/stores/useSettingsStore';

const API_URL = 'http://localhost:3002';

class ProvidersService {
  // Get all providers
  async getProviders(): Promise<Provider[]> {
    const response = await fetch(`${API_URL}/api/providers`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data: ProvidersResponse = await response.json();
    return data.providers;
  }

  // Get provider details including config and models
  async getProviderDetails(providerId: string): Promise<ProviderDetails> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch provider details: ${response.statusText}`);
    }
    return await response.json();
  }

  // Get provider types metadata
  async getProviderTypes(): Promise<ProviderTypeInfo[]> {
    const response = await fetch(`${API_URL}/api/providers/types`);
    if (!response.ok) {
      throw new Error('Failed to fetch provider types');
    }
    const data = await response.json();
    return data.types;
  }

  // Create new provider
  async createProvider(data: CreateProviderRequest): Promise<ProviderDetails> {
    const response = await fetch(`${API_URL}/api/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create provider');
    }
    return await response.json();
  }

  // Update provider
  async updateProvider(providerId: string, data: UpdateProviderRequest): Promise<ProviderDetails> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to update provider');
    }
    return await response.json();
  }

  // Update provider config
  async updateProviderConfig(providerId: string, config: Record<string, any>): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to update provider config');
    }
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

  // Switch active provider (updates settings)
  async switchProvider(providerId: string): Promise<void> {
    try {
      // Use the settings store's updateSetting method which handles both API call and store update
      await useSettingsStore.getState().updateSetting('active_provider', providerId);
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw error;
    }
  }

  // Reload provider in runtime
  async reloadProvider(providerId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/providers/${encodeURIComponent(providerId)}/reload`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to reload provider');
    }
  }
}

export const providersService = new ProvidersService();
