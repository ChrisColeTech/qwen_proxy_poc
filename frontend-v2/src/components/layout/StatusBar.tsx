import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { useUIStore } from '@/stores/useUIStore';

export function StatusBar() {
  const credentials = useCredentialsStore((state) => state.credentials);
  const proxyStatus = useProxyStore((state) => state.status);
  const statusMessage = useUIStore((state) => state.statusMessage);

  const getCredentialStatus = () => {
    if (!credentials) return 'inactive';
    if (credentials.expiresAt < Date.now()) return 'expired';
    return 'active';
  };

  const getProxyStatus = () => {
    if (!proxyStatus) return 'stopped';
    return proxyStatus.isRunning ? 'running' : 'stopped';
  };

  return (
    <div className="h-8 bg-background border-t border-border flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-2">
        <EnvironmentBadge />
        <div className="h-4 w-px bg-border" />
        <span className="text-muted-foreground">Credentials:</span>
        <StatusBadge status={getCredentialStatus()} />
        <div className="h-4 w-px bg-border" />
        <span className="text-muted-foreground">Proxy:</span>
        <StatusBadge status={getProxyStatus()} />
      </div>
      <div className="text-muted-foreground">{statusMessage}</div>
    </div>
  );
}
