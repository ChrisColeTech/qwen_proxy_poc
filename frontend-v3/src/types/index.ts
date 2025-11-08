// Central type export file

export type { UIState, ProxyStatus } from './common.types';
export type { QwenCredentials, SetCredentialsRequest, CredentialStatus } from './credentials.types';
export type {
  Provider,
  Model,
  ProxyServerInfo,
  ProxyStatusResponse,
  ProxyControlResponse,
} from './proxy.types';
export * from "./providers.types"
export * from './models.types'

// WebSocket Event Types
export interface ProxyStatusEvent {
  status: {
    status?: string; // 'running' | 'stopped' | 'partial'
    message?: string;
    providerRouter: { running: boolean; port: number; uptime: number };
    qwenProxy: { running: boolean; port: number; uptime: number };
    credentials: { valid: boolean; expiresAt: number | null };
    providers: { items: any[]; total: number; enabled: number };
    models: { items: any[]; total: number };
    extensionConnected?: boolean;
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

export interface LifecycleUpdateEvent {
  providerRouter?: {
    state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    port: number | null;
    running: boolean;
    error?: string | null;
  };
  qwenProxy?: {
    state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    port: number | null;
    running: boolean;
    error?: string | null;
  };
  timestamp: number;
}

export type WebSocketConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketEvent {
  type: 'proxy:status' | 'credentials:updated' | 'providers:updated' | 'models:updated' | 'lifecycle:update';
  data: any;
  timestamp: string;
}
