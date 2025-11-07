export type { Provider } from '@/types/proxy.types';

const API_BASE = 'http://localhost:3002';

export interface ProviderConfig {
  [key: string]: string | number | boolean;
}

export interface CreateProviderData {
  id: string;
  name: string;
  type: 'lm-studio' | 'qwen-proxy' | 'qwen-direct';
  enabled?: boolean;
  priority?: number;
  description?: string;
  config?: ProviderConfig;
}

export interface UpdateProviderData {
  name?: string;
  type?: 'lm-studio' | 'qwen-proxy' | 'qwen-direct';
  enabled?: boolean;
  priority?: number;
  description?: string;
}

export const apiService = {
  // Provider CRUD
  async getProviders() {
    try {
      const response = await fetch(`${API_BASE}/api/providers`);
      if (!response.ok) {
        throw new Error('Failed to get providers');
      }
      const json = await response.json();
      return {
        success: true,
        data: json.providers || []
      };
    } catch (error) {
      console.error('Error getting providers:', error);
      return { success: false, data: [] };
    }
  },

  async getProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}`);
      if (!response.ok) {
        throw new Error('Failed to get provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting provider:', error);
      throw error;
    }
  },

  async createProvider(data: CreateProviderData) {
    try {
      const response = await fetch(`${API_BASE}/api/providers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  },

  async updateProvider(id: string, data: UpdateProviderData) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  },

  async deleteProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  },

  async enableProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/enable`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to enable provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error enabling provider:', error);
      throw error;
    }
  },

  async disableProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/disable`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to disable provider');
      }
      return await response.json();
    } catch (error) {
      console.error('Error disabling provider:', error);
      throw error;
    }
  },

  async testProvider(id: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/test`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Provider test failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error testing provider:', error);
      throw error;
    }
  },

  // Provider Configuration
  async getProviderConfig(id: string, mask: boolean = true) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/config?mask=${mask}`);
      if (!response.ok) {
        throw new Error('Failed to get provider config');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting provider config:', error);
      throw error;
    }
  },

  async updateProviderConfig(id: string, config: ProviderConfig) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });
      if (!response.ok) {
        throw new Error('Failed to update provider config');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating provider config:', error);
      throw error;
    }
  },

  async updateProviderConfigKey(id: string, key: string, value: any, isSensitive?: boolean) {
    try {
      const body: any = { value };
      if (isSensitive !== undefined) {
        body.is_sensitive = isSensitive;
      }
      const response = await fetch(`${API_BASE}/api/providers/${id}/config/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error('Failed to update config key');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating config key:', error);
      throw error;
    }
  },

  async deleteProviderConfigKey(id: string, key: string) {
    try {
      const response = await fetch(`${API_BASE}/api/providers/${id}/config/${key}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete config key');
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting config key:', error);
      throw error;
    }
  },

  // Settings
  async getSettings() {
    try {
      const response = await fetch(`${API_BASE}/api/settings`);
      if (!response.ok) {
        throw new Error('Failed to get settings');
      }
      const json = await response.json();
      return {
        success: true,
        data: json.settings || {}
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { success: false, data: {} };
    }
  },

  async getSetting(key: string) {
    try {
      const response = await fetch(`${API_BASE}/api/settings/${key}`);
      if (!response.ok) {
        throw new Error('Failed to get setting');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  },

  async updateSetting(key: string, value: string) {
    try {
      const response = await fetch(`${API_BASE}/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update setting');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  },

  async setActiveProvider(id: string) {
    return this.updateSetting('active_provider', id);
  },
};
