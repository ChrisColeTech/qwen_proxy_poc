import { useProxyStore } from '@/stores/useProxyStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export function StatusBar() {
  const proxyStatus = useProxyStore((state) => state.status);
  const lifecycleMessage = useLifecycleStore((state) => state.message);
  const lifecycleError = useLifecycleStore((state) => state.error);
  const settings = useSettingsStore((state) => state.settings);

  const credentialStatus = proxyStatus?.credentials?.valid
    ? 'authenticated'
    : proxyStatus?.credentials
    ? 'invalid'
    : 'none';

  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const activeProvider = settings.active_provider as string || '';
  const activeModel = settings.active_model as string || '';

  const displayMessage = lifecycleError || lifecycleMessage;
  const isError = !!lifecycleError;

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <EnvironmentBadge />
        <div className="statusbar-separator" />
        <StatusBadge status={credentialStatus} />
        <div className="statusbar-separator" />
        <StatusBadge status={isProxyRunning ? 'running' : 'stopped'} />
        {activeProvider && (
          <>
            <div className="statusbar-separator" />
            <Badge variant="secondary" className="h-4 text-xs px-1.5">
              {activeProvider}
            </Badge>
          </>
        )}
        {activeModel && (
          <>
            <div className="statusbar-separator" />
            <Badge variant="secondary" className="h-4 text-xs px-1.5">
              {activeModel}
            </Badge>
          </>
        )}
      </div>
      {displayMessage && (
        <div className={isError ? 'statusbar-item-error' : 'statusbar-item'}>
          {isError && <AlertCircle className="statusbar-icon" />}
          <span>{displayMessage}</span>
        </div>
      )}
    </div>
  );
}
