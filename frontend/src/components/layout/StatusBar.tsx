import { useUIStore } from '@/stores/useUIStore';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { StatusBadge } from '@/components/ui/status-badge';

export function StatusBar() {
  const statusMessage = useUIStore((state) => state.statusMessage);
  const credentials = useCredentialsStore((state) => state.credentials);
  const proxyStatus = useProxyStore((state) => state.status);

  const credentialStatus = credentials
    ? credentials.isExpired
      ? 'expired'
      : 'active'
    : 'inactive';

  const isProxyRunning = proxyStatus?.qwenProxy?.running || false;

  return (
    <div className="h-6 bg-muted border-t border-border px-4 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <EnvironmentBadge />
        <div className="h-3 w-px bg-border" />
        <StatusBadge status={credentialStatus} />
        <div className="h-3 w-px bg-border" />
        <StatusBadge status={isProxyRunning ? 'running' : 'stopped'} />
      </div>
      <span className="text-muted-foreground">{statusMessage}</span>
    </div>
  );
}
