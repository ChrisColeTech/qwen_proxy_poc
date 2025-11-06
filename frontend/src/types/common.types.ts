// Common types shared across the application

export interface UIState {
  theme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
}

export type ProxyStatus = 'running' | 'stopped';

export type CredentialStatus = 'active' | 'inactive' | 'expired';
