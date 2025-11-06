import { useProxyStore } from '@/stores/useProxyStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { AlertCircle } from 'lucide-react';

export function StatusBar() {
  const proxyStatus = useProxyStore((state) => state.status);
  const lifecycleMessage = useLifecycleStore((state) => state.message);
  const lifecycleError = useLifecycleStore((state) => state.error);

  const credentialStatus = proxyStatus?.credentials?.valid
    ? 'authenticated'
    : proxyStatus?.credentials
    ? 'invalid'
    : 'none';

  const isProxyRunning = proxyStatus?.providerRouter?.running || false;

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
