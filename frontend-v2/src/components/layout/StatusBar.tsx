import { useProxyStore } from '@/stores/useProxyStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useUIStore } from '@/stores/useUIStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';

export function StatusBar() {
  const proxyStatus = useProxyStore((state) => state.status);
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const connected = useProxyStore((state) => state.connected);
  const lifecycleState = useLifecycleStore((state) => state.state);
  const lifecycleMessage = useLifecycleStore((state) => state.message);
  const lifecycleError = useLifecycleStore((state) => state.error);
  const settings = useSettingsStore((state) => state.settings);
  const showStatusMessages = useUIStore((state) => state.uiState.showStatusMessages);

  const apiServerStatus = connected ? 'running' : 'stopped';

  const credentialStatus = proxyStatus?.credentials?.valid
    ? 'authenticated'
    : proxyStatus?.credentials
    ? 'invalid'
    : 'none';

  const extensionStatus = wsProxyStatus?.extensionConnected ? 'running' : 'stopped';

  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const activeProvider = settings.active_provider as string || '';
  const activeModel = settings.active_model as string || '';

  const displayMessage = lifecycleError || lifecycleMessage;
  const isError = !!lifecycleError;
  const isTransitioning = lifecycleState === 'starting' || lifecycleState === 'stopping';

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        {showStatusMessages && (
          <>
            <EnvironmentBadge />
            <div className="statusbar-separator" />
            <StatusBadge status={apiServerStatus}>API Server</StatusBadge>
            <div className="statusbar-separator" />
            <StatusBadge status={extensionStatus}>Extension</StatusBadge>
            <div className="statusbar-separator" />
            <StatusBadge status={credentialStatus} />
            {activeProvider && (
              <>
                <div className="statusbar-separator" />
                <Badge variant="secondary" className="flex-shrink-0 min-w-0" style={{
                  height: 'clamp(0.875rem, 2vw, 1rem)',
                  paddingLeft: 'clamp(0.25rem, 0.5vw, 0.375rem)',
                  paddingRight: 'clamp(0.25rem, 0.5vw, 0.375rem)',
                  fontSize: 'inherit'
                }}>
                  <span className="whitespace-nowrap">{activeProvider}</span>
                </Badge>
              </>
            )}
            {activeModel && (
              <>
                <div className="statusbar-separator" />
                <Badge variant="secondary" className="flex-shrink-0 min-w-0" style={{
                  height: 'clamp(0.875rem, 2vw, 1rem)',
                  paddingLeft: 'clamp(0.25rem, 0.5vw, 0.375rem)',
                  paddingRight: 'clamp(0.25rem, 0.5vw, 0.375rem)',
                  fontSize: 'inherit'
                }}>
                  <span className="whitespace-nowrap">{activeModel}</span>
                </Badge>
              </>
            )}
          </>
        )}
      </div>
      {showStatusMessages && displayMessage && (
        <StatusBadge status={isError ? 'invalid' : isProxyRunning ? 'running' : 'stopped'}>
          {isTransitioning && (
            <svg
              className="animate-spin -ml-1 mr-2 h-3 w-3 inline-block"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {displayMessage}
        </StatusBadge>
      )}
    </div>
  );
}
