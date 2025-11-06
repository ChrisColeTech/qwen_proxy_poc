const API_BASE = 'http://localhost:3002';

export const apiService = {
  async getProviders() {
    try {
      const response = await fetch(`${API_BASE}/api/providers`);
      if (!response.ok) {
        throw new Error('Failed to get providers');
      }
      const json = await response.json();
      // API returns { "providers": [...] }
      return {
        success: true,
        data: json.providers || []
      };
    } catch (error) {
      console.error('Error getting providers:', error);
      return { success: false, data: [] };
    }
  },

  async getSettings() {
    try {
      const response = await fetch(`${API_BASE}/api/settings`);
      if (!response.ok) {
        throw new Error('Failed to get settings');
      }
      const json = await response.json();
      // API returns { "settings": { "active_provider": "..." } }
      return {
        success: true,
        data: json.settings || {}
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { success: false, data: {} };
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
};
