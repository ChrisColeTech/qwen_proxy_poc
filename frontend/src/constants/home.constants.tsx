import type { ReactNode } from 'react';
import { ChevronRight, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import type { StatusType } from '@/components/ui/status-indicator';
import type { LifecycleState } from '@/stores/useLifecycleStore';
import { formatUptime, formatExpiryDate } from '@/utils/formatters';

export interface ActionItem {
  icon?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  hidden?: boolean;
}

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  description?: string;
  hidden?: boolean;
}

export const getProxyBadge = (lifecycleState: LifecycleState) => {
  switch (lifecycleState) {
    case 'starting':
      return { text: 'Starting...', variant: 'secondary' as const };
    case 'stopping':
      return { text: 'Stopping...', variant: 'secondary' as const };
    case 'running':
      return { text: 'Running', variant: 'default' as const };
    case 'error':
      return { text: 'Error', variant: 'destructive' as const };
    default:
      return { text: 'Stopped', variant: 'destructive' as const };
  }
};

export const getStatusIndicatorState = (lifecycleState: LifecycleState): StatusType => {
  switch (lifecycleState) {
    case 'starting':
    case 'running':
      return 'running';
    case 'error':
      return 'invalid';
    case 'stopping':
    case 'stopped':
    case 'idle':
    default:
      return 'stopped';
  }
};

export const createActionBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[100px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

export const createActionIcon = (status: StatusType) => (
  <StatusIndicator status={status} />
);

export const buildOverviewActions = (params: {
  extensionDetected: boolean;
  needsExtension: boolean;
  credentialsValid: boolean;
  expiresAt: number | null | undefined;
  running: boolean;
  port: number | undefined;
  uptime: number | undefined;
  lifecycleState: LifecycleState;
  proxyLoading: boolean;
  handleExtensionClick: () => void;
  handleQwenLogin: () => void;
  handleProxyClick: () => void;
}): ActionItem[] => {
  const {
    extensionDetected,
    needsExtension,
    credentialsValid,
    expiresAt,
    running,
    port,
    uptime,
    lifecycleState,
    proxyLoading,
    handleExtensionClick,
    handleQwenLogin,
    handleProxyClick
  } = params;

  const proxyBadge = getProxyBadge(lifecycleState);

  return [
    {
      icon: createActionIcon(extensionDetected ? 'running' : 'stopped'),
      title: '1. Chrome Extension',
      description: extensionDetected ? 'Ready for authentication' : 'Click to install extension',
      actions: createActionBadge(
        extensionDetected ? 'default' : 'destructive',
        extensionDetected ? 'Detected' : 'Not Detected'
      ),
      onClick: handleExtensionClick,
      hidden: !needsExtension
    },
    {
      icon: createActionIcon(credentialsValid ? 'running' : 'stopped'),
      title: `${needsExtension ? '2' : '1'}. Qwen Credentials`,
      description: credentialsValid ? `Expires ${formatExpiryDate(expiresAt ?? null)}` : 'Click to login to Qwen',
      actions: createActionBadge(
        credentialsValid ? 'default' : 'destructive',
        credentialsValid ? 'Valid' : 'Invalid'
      ),
      onClick: handleQwenLogin
    },
    {
      icon: createActionIcon(getStatusIndicatorState(lifecycleState)),
      title: `${needsExtension ? '3' : '2'}. Provider Router`,
      description: running ? `Port ${port} • Uptime ${uptime !== undefined ? formatUptime(uptime) : 'N/A'}` : 'Click to start the proxy server',
      actions: createActionBadge(proxyBadge.variant, proxyBadge.text),
      onClick: handleProxyClick,
      disabled: proxyLoading
    }
  ];
};

export const HOME_TABS = {
  OVERVIEW: {
    value: 'overview',
    label: 'Overview',
    description: 'Click on any row to perform the action. Follow the steps in order:'
  },
  STATUS: {
    value: 'status',
    label: 'System Status',
    description: 'Test the OpenAI-compatible endpoints exposed by the Provider Router:'
  }
} as const;

export const HOME_TITLE = 'Proxy Dashboard';
export const SYSTEM_OVERVIEW_TITLE = 'System Overview';
export const SYSTEM_OVERVIEW_ICON = Gauge;
