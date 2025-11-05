import { apiService } from './api.service';
import type { ProxyStatus } from '@/types/proxy.types';

interface RealBackendProxyStatus {
  status: 'running' | 'stopped' | 'partial' | 'already_running' | 'started' | 'not_running';
  providerRouter?: {
    running?: boolean;
    port?: number;
    pid?: number | null;
    uptime?: number;
  };
  qwenProxy?: {
    running?: boolean;
    port?: number;
    pid?: number | null;
    uptime?: number;
  };
  message: string;
  success?: boolean;
  data?: {
    isRunning: boolean;
    port: number;
    startedAt: number | undefined;
  };
  metadata?: Record<string, unknown>;
}

class ProxyService {
  private convertBackendStatus(backend: RealBackendProxyStatus): ProxyStatus {
    const providerRouter = backend.providerRouter;

    return {
      isRunning: providerRouter?.running ?? false,
      port: providerRouter?.port,
      startedAt: providerRouter?.uptime
        ? Date.now() - providerRouter.uptime * 1000
        : undefined,
      providers: (backend as any).providers,
      models: (backend as any).models,
      credentials: (backend as any).credentials,
    };
  }

  async startProxy(): Promise<ProxyStatus> {
    const response = await apiService.post<RealBackendProxyStatus>('/api/proxy/start');
    return this.convertBackendStatus(response);
  }

  async stopProxy(): Promise<ProxyStatus> {
    const response = await apiService.post<RealBackendProxyStatus>('/api/proxy/stop');
    return this.convertBackendStatus(response);
  }

  async getProxyStatus(): Promise<ProxyStatus> {
    const response = await apiService.get<RealBackendProxyStatus>('/api/proxy/status');
    return this.convertBackendStatus(response);
  }
}

export const proxyService = new ProxyService();
