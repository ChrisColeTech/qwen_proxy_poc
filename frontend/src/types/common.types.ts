// Common types shared across the application

export interface UIState {
  theme: 'light' | 'dark';
}

export type ProxyStatus = 'running' | 'stopped';

export type CredentialStatus = 'active' | 'inactive' | 'expired';
