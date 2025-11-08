import type { ProxyStatus } from '@/types/home.types';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

class ProxyService {
  async getStatus(): Promise<ProxyStatus> {
    const response = await fetch(`${API_URL}/api/proxy/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch proxy status');
    }
    return response.json();
  }

  async start(): Promise<void> {
    const response = await fetch(`${API_URL}/api/proxy/start`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to start proxy');
    }
  }

  async stop(): Promise<void> {
    const response = await fetch(`${API_URL}/api/proxy/stop`, { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to stop proxy');
    }
  }

  formatUptime(seconds?: number): string {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${Math.floor(seconds)}s`;
  }

  formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
}

export const proxyService = new ProxyService();
