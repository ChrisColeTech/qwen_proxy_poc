import { Server, Database, Key, Zap } from 'lucide-react';
import { useProxyStore } from '@/stores/useProxyStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface StatusIconProps {
  status: 'connected' | 'running' | 'authenticated' | 'stopped' | 'disconnected' | 'invalid' | 'starting' | 'stopping';
  icon: React.ElementType;
  label: string;
  details: React.ReactNode;
}

function StatusIcon({ status, icon: Icon, label, details }: StatusIconProps) {
  // Map status to indicator colors
  const getIndicatorColor = () => {
    switch (status) {
      case 'connected':
      case 'running':
      case 'authenticated':
        return 'bg-green-500';
      case 'starting':
      case 'stopping':
        return 'bg-yellow-500 animate-pulse';
      case 'stopped':
      case 'disconnected':
      case 'invalid':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 hover:bg-accent rounded-md transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${getIndicatorColor()}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <h4 className="font-semibold text-sm">{label}</h4>
          </div>
          <div className="text-sm text-muted-foreground">
            {details}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function StatusBar() {
  const proxyStatus = useProxyStore((state) => state.status);
  const connected = useProxyStore((state) => state.connected);
  const lifecycleState = useLifecycleStore((state) => state.state);
  const lifecycleMessage = useLifecycleStore((state) => state.message);
  const settings = useSettingsStore((state) => state.settings);

  const credentialStatus = proxyStatus?.credentials?.valid
    ? 'authenticated'
    : proxyStatus?.credentials
    ? 'invalid'
    : 'invalid';

  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const activeProvider = settings.active_provider as string || 'None';
  const activeModel = settings.active_model as string || 'None';

  // API Server (WebSocket) status
  const apiServerStatus = connected ? 'connected' : 'disconnected';
  const apiServerDetails = (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs">Status:</span>
        <Badge variant={connected ? 'default' : 'destructive'} className="h-5 text-xs">
          {connected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        WebSocket connection to API server at localhost:3002
      </p>
    </div>
  );

  // Provider Router status
  const providerRouterStatus = lifecycleState === 'starting' || lifecycleState === 'stopping'
    ? lifecycleState
    : isProxyRunning
    ? 'running'
    : 'stopped';

  const providerRouterDetails = (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs">Status:</span>
        <Badge
          variant={
            providerRouterStatus === 'running' ? 'default' :
            providerRouterStatus === 'stopped' ? 'destructive' :
            'secondary'
          }
          className="h-5 text-xs"
        >
          {providerRouterStatus === 'starting' && (
            <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {providerRouterStatus === 'stopping' && (
            <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {lifecycleMessage || (isProxyRunning ? 'Running' : 'Stopped')}
        </Badge>
      </div>
      {isProxyRunning && proxyStatus?.providerRouter?.port && (
        <div className="flex justify-between text-xs">
          <span>Port:</span>
          <span className="font-mono">{proxyStatus.providerRouter.port}</span>
        </div>
      )}
      {isProxyRunning && proxyStatus?.providerRouter?.uptime !== undefined && (
        <div className="flex justify-between text-xs">
          <span>Uptime:</span>
          <span className="font-mono">{Math.floor(proxyStatus.providerRouter.uptime / 60)}m {proxyStatus.providerRouter.uptime % 60}s</span>
        </div>
      )}
    </div>
  );

  // Credentials status
  const credentialsDetails = (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs">Status:</span>
        <Badge variant={credentialStatus === 'authenticated' ? 'default' : 'destructive'} className="h-5 text-xs">
          {credentialStatus === 'authenticated' ? 'Valid' : 'Invalid'}
        </Badge>
      </div>
      {proxyStatus?.credentials?.expiresAt && (
        <div className="flex justify-between text-xs">
          <span>Expires:</span>
          <span className="font-mono">
            {new Date(proxyStatus.credentials.expiresAt * 1000).toLocaleDateString()}
          </span>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Qwen API authentication credentials
      </p>
    </div>
  );

  // Active configuration
  const configurationDetails = (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>Provider:</span>
        <Badge variant="secondary" className="h-5 text-xs">
          {activeProvider}
        </Badge>
      </div>
      <div className="flex justify-between text-xs">
        <span>Model:</span>
        <Badge variant="secondary" className="h-5 text-xs">
          {activeModel}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Current routing configuration
      </p>
    </div>
  );

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <EnvironmentBadge />
        <div className="statusbar-separator" />

        {/* API Server Status */}
        <StatusIcon
          status={apiServerStatus}
          icon={Server}
          label="API Server"
          details={apiServerDetails}
        />

        {/* Provider Router Status */}
        <StatusIcon
          status={providerRouterStatus}
          icon={Database}
          label="Provider Router"
          details={providerRouterDetails}
        />

        {/* Credentials Status */}
        <StatusIcon
          status={credentialStatus}
          icon={Key}
          label="Credentials"
          details={credentialsDetails}
        />

        {/* Active Configuration */}
        <StatusIcon
          status={isProxyRunning ? 'running' : 'stopped'}
          icon={Zap}
          label="Configuration"
          details={configurationDetails}
        />
      </div>
    </div>
  );
}
