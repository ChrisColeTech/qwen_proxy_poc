import type { ProxyStatusResponse, ProxyControlResponse } from '@/types';

const API_BASE = 'http://localhost:3002';

export const proxyService = {
  async getStatus(): Promise<ProxyStatusResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/proxy/status`);
      if (!response.ok) {
        throw new Error('Failed to get proxy status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting proxy status:', error);
      throw error;
    }
  },

  async startProxy(): Promise<ProxyControlResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/proxy/start`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to start proxy');
      }
      return await response.json();
    } catch (error) {
      console.error('Error starting proxy:', error);
      throw error;
    }
  },

  async stopProxy(): Promise<ProxyControlResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/proxy/stop`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to stop proxy');
      }
      return await response.json();
    } catch (error) {
      console.error('Error stopping proxy:', error);
      throw error;
    }
  },
};
