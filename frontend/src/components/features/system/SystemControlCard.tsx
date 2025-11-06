import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useAuth } from '@/hooks/useAuth';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { formatDate, formatUptime } from '@/utils/formatters';
import { truncateToken, truncateCookies } from '@/utils/string.utils';
import { Activity, LogIn, LogOut, Play, Square, Copy } from 'lucide-react';

export function SystemControlCard() {
  const { handleConnect, handleRevoke, loading: authLoading } = useAuth();
  const { handleStart, handleStop, loading: proxyLoading } = useProxyControl();
  const credentials = useCredentialsStore((state) => state.credentials);
  const proxyStatus = useProxyStore((state) => state.status);
  const showAlert = useAlertStore((state) => state.showAlert);

  const credentialStatus = credentials
    ? credentials.isExpired
      ? 'expired'
      : 'active'
    : 'inactive';

  const isProxyRunning = proxyStatus?.qwenProxy?.running || false;
  const port = proxyStatus?.qwenProxy?.port;
  const uptime = proxyStatus?.qwenProxy?.uptime;
  const endpointUrl = port ? `http://localhost:${port}` : '';

  const handleCopy = async () => {
    if (endpointUrl) {
      await navigator.clipboard.writeText(endpointUrl);
      showAlert('Endpoint URL copied to clipboard', 'success');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            System Control
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              onClick={handleConnect}
              disabled={authLoading}
              size="icon"
              variant={credentials ? 'outline' : 'default'}
              title={credentials ? 'Re-authenticate' : 'Connect to Qwen'}
              className="h-8 w-8"
            >
              <LogIn className="h-4 w-4" />
            </Button>

            {credentials && (
              <Button
                onClick={handleRevoke}
                disabled={authLoading}
                size="icon"
                variant="destructive"
                title="Revoke credentials"
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}

            {!isProxyRunning ? (
              <Button
                onClick={handleStart}
                disabled={proxyLoading}
                size="icon"
                variant="default"
                title="Start proxy server"
                className="h-8 w-8"
              >
                <Play className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                disabled={proxyLoading}
                size="icon"
                variant="destructive"
                title="Stop proxy server"
                className="h-8 w-8"
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Credentials</span>
            <StatusIndicator status={credentialStatus} />
            <span className="text-sm font-medium">
              {credentialStatus.charAt(0).toUpperCase() + credentialStatus.slice(1)}
            </span>
          </div>
          {credentials && (
            <span className="text-sm text-muted-foreground">
              Expires {formatDate(credentials.expiresAt)}
            </span>
          )}
        </div>

        {credentials && (
          <div className="space-y-3 pl-6">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Token</div>
              <code className="block bg-muted px-3 py-2 rounded text-xs font-mono">
                {truncateToken(credentials.token)}
              </code>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Cookies</div>
              <code className="block bg-muted px-3 py-2 rounded text-xs font-mono">
                {truncateCookies(credentials.cookies)}
              </code>
            </div>
          </div>
        )}

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Proxy Server</span>
            <StatusIndicator status={isProxyRunning ? 'running' : 'stopped'} />
            <span className="text-sm font-medium">
              {isProxyRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {port && <span>Port {port}</span>}
            {isProxyRunning && uptime !== undefined && (
              <span>Uptime {formatUptime(uptime)}</span>
            )}
          </div>
        </div>

        {isProxyRunning && endpointUrl && (
          <>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-1.5 text-xs font-mono truncate">
                {endpointUrl}
              </code>
              <Button
                onClick={handleCopy}
                size="icon"
                variant="outline"
                title="Copy endpoint URL"
                className="h-8 w-8 shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
