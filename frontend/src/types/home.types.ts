// Types for HomePage and related components

export interface ProxyStatus {
  providerRouter?: {
    running: boolean;
    port: number;
    uptime: number;
  };
  qwenProxy?: {
    running: boolean;
    port: number;
    uptime: number;
  };
  credentials?: {
    valid: boolean;
    expiresAt: number | null;
  };
  providers?: {
    items: any[];
    total: number;
    enabled: number;
  };
  models?: {
    items: any[];
    total: number;
  };
}

export interface ProxyControlState {
  loading: boolean;
  error: string | null;
}
