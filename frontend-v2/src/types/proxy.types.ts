// Types for proxy management matching /api/proxy/* and /api/providers/* endpoints

export interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority?: number;
  description?: string;
  baseUrl?: string;
  created_at?: number;
  updated_at?: number;
}

export interface Model {
  id: string;
  name?: string;
  providerId?: string;
}

export interface ProxyServerInfo {
  running: boolean;
  port?: number;
  pid?: number;
  uptime?: number;
}

export interface ProxyStatusResponse {
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  qwenProxy?: ProxyServerInfo;
  providerRouter?: ProxyServerInfo;
  providers?: {
    items: Provider[];
    enabled: number;
    total: number;
  };
  models?: {
    items: Model[];
    total: number;
  };
  credentials?: {
    valid: boolean;
    expiresAt: number | null;
  };
  extensionConnected?: boolean;
  message: string;
}

export interface ProxyControlResponse {
  status: 'running' | 'stopped' | 'already_running' | 'error';
  message: string;
  qwenProxy?: ProxyServerInfo;
  providerRouter?: ProxyServerInfo;
}
