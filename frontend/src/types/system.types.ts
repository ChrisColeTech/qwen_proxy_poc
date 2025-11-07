/**
 * System Feature Component Type Definitions
 * Contains all interfaces and types for system feature components
 */

export interface CredentialsSectionProps {
  credentials: { token?: string; cookies?: string } | null;
  onConnect: () => void;
  loading: boolean;
}

export interface ProxyServerSectionProps {
  proxyRunning: boolean;
  proxyUrl: string;
  uptime: string | null;
  onStart: () => void;
  onStop: () => void;
  loading: boolean;
}

export interface EndpointUrlSectionProps {
  providerRouterUrl: string;
  showAlert: (message: string, type: 'info' | 'success' | 'error') => void;
}
