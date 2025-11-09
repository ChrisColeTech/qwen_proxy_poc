import type { QwenCredentials, SetCredentialsRequest } from '@/types';

const API_BASE = 'http://localhost:3002';

export const credentialsService = {
  async getCredentials(): Promise<QwenCredentials | null> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to get credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  },

  async setCredentials(request: SetCredentialsRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to set credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error setting credentials:', error);
      throw error;
    }
  },

  async revokeCredentials(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE}/api/qwen/credentials`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to revoke credentials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error revoking credentials:', error);
      throw error;
    }
  },

  isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  },
};
