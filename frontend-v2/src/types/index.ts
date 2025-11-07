export interface UIState {
  theme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
}

export interface QwenCredentials {
  token: string;
  cookies: string;
  expiresAt: number;
}

export interface ProxyStatusResponse {
  isRunning: boolean;
  port?: number;
  message?: string;
}

export type AlertType = 'success' | 'error';

export interface AlertState {
  message: string;
  type: AlertType;
}

// WebSocket Event Types
export interface ProxyStatusEvent {
  status: {
    providerRouter: { running: boolean; port: number; uptime: number };
    qwenProxy: { running: boolean; port: number; uptime: number };
    credentials: { valid: boolean; expiresAt: number | null };
    providers: { items: any[]; total: number; enabled: number };
    models: { items: any[]; total: number };
  };
  timestamp: string;
}

export interface CredentialsUpdatedEvent {
  action: 'updated' | 'deleted';
  credentials: { valid: boolean; expiresAt: number | null };
  timestamp: string;
}

export interface ProvidersUpdatedEvent {
  action: string;
  providers: any[];
  timestamp: string;
}

export interface ModelsUpdatedEvent {
  action: string;
  models: any[];
  timestamp: string;
}

export type WebSocketConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketEvent {
  type: 'proxy:status' | 'credentials:updated' | 'providers:updated' | 'models:updated';
  data: ProxyStatusEvent | CredentialsUpdatedEvent | ProvidersUpdatedEvent | ModelsUpdatedEvent;
  timestamp: string;
}
