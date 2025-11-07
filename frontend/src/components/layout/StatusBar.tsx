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

  const displayMessage = lifecycleError || lifecycleMessage;
  const isError = !!lifecycleError;

  return (
    <div className="h-6 bg-muted border-t border-border px-4 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <EnvironmentBadge />
        <div className="h-3 w-px bg-border" />
        <StatusBadge status={credentialStatus} />
        <div className="h-3 w-px bg-border" />
        <StatusBadge status={isProxyRunning ? 'running' : 'stopped'} />
        {activeProvider && (
          <>
            <div className="h-3 w-px bg-border" />
            <Badge variant="secondary" className="h-4 text-xs px-1.5">
              {activeProvider}
            </Badge>
          </>
        )}
      </div>
      {displayMessage && (
        <div className={`flex items-center gap-1.5 ${isError ? 'text-destructive' : 'text-muted-foreground'}`}>
          {isError && <AlertCircle className="h-3 w-3" />}
          <span>{displayMessage}</span>
        </div>
      )}
    </div>
  );
}
