export interface ProxyStatus {
  isRunning: boolean;
  port?: number;
  startedAt?: number;
  providers?: {
    items: any[];
    total: number;
    enabled: number;
  };
  models?: {
    items: any[];
    total: number;
  };
  credentials?: {
    valid: boolean;
  };
}

export interface BackendProxyStatus {
  status: 'running' | 'stopped' | 'already_running';
  providerRouter?: {
    running?: boolean;
    port?: number;
    pid?: number;
    uptime?: number;
  };
  qwenProxy?: {
    running?: boolean;
    port?: number;
    pid?: number;
    uptime?: number;
  };
  message: string;
}
