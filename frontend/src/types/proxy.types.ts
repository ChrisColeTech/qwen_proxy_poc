// Types for proxy management matching /api/proxy/* endpoints

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
}

export interface Model {
  id: string;
  name: string;
  providerId: string;
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
    hasCredentials: boolean;
    isValid: boolean;
    expiresAt?: number;
  };
  message: string;
}

export interface ProxyControlResponse {
  status: 'running' | 'stopped' | 'already_running' | 'error';
  message: string;
  qwenProxy?: ProxyServerInfo;
  providerRouter?: ProxyServerInfo;
}
