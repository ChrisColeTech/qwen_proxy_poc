import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { Activity } from 'lucide-react';

export function SystemStatsCard() {
  const credentials = useCredentialsStore((state) => state.credentials);
  const proxyStatus = useProxyStore((state) => state.status);

  const credentialStatus = credentials
    ? credentials.isExpired
      ? 'expired'
      : 'active'
    : 'inactive';

  const isProxyRunning = proxyStatus?.qwenProxy?.running || false;
  const proxyPort = proxyStatus?.qwenProxy?.port;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Credentials</span>
          <StatusBadge status={credentialStatus} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Proxy</span>
          <div className="flex items-center gap-2">
            <StatusBadge status={isProxyRunning ? 'running' : 'stopped'} />
            {isProxyRunning && proxyPort && (
              <span className="text-xs text-muted-foreground">:{proxyPort}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Providers</span>
          <span className="text-sm font-medium">
            {proxyStatus?.providers?.enabled || 0} / {proxyStatus?.providers?.total || 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Models</span>
          <span className="text-sm font-medium">{proxyStatus?.models?.total || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}
