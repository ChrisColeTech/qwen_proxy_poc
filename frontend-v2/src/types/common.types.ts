// Common types shared across the application

export interface UIState {
  theme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
  showStatusMessages: boolean;
}

export type ProxyStatus = 'running' | 'stopped';
