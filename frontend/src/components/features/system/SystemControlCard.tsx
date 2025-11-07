import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useCredentialActions } from '@/hooks/useCredentialActions';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useLiveUptime } from '@/hooks/useLiveUptime';
import { useProviderRouterLifecycle } from '@/hooks/useProviderRouterLifecycle';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { formatDate, formatUptime } from '@/utils/formatters';
import { Activity, LogIn, Play, Square, Copy, AlertCircle } from 'lucide-react';

export function SystemControlCard() {
  const { handleConnect, loading: authLoading } = useCredentialActions();
  const { handleStart, handleStop, loading: proxyLoading } = useProxyControl();
  const { state: lifecycleState, error: lifecycleError } = useProviderRouterLifecycle();
  const proxyStatus = useProxyStore((state) => state.status);
  const showAlert = useAlertStore((state) => state.showAlert);

  const credentials = proxyStatus?.credentials;
  const credentialStatus = credentials?.valid
    ? 'authenticated'
    : credentials
    ? 'invalid'
    : 'none';

  // Use Provider Router (main entry point) instead of Qwen Proxy
  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const port = proxyStatus?.providerRouter?.port;
  const initialUptime = proxyStatus?.providerRouter?.uptime;
  const uptime = useLiveUptime(initialUptime);
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
          {credentials?.valid && credentials.expiresAt && (
            <span className="text-sm text-muted-foreground">
              Expires {formatDate(credentials.expiresAt)}
            </span>
          )}
        </div>


        <div className="h-px bg-border" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Proxy Server</span>
              {lifecycleState === 'starting' || lifecycleState === 'stopping' ? (
                <>
                  <Activity className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    {lifecycleState === 'starting' ? 'Starting...' : 'Stopping...'}
                  </span>
                </>
              ) : (
                <>
                  <StatusIndicator status={isProxyRunning ? 'running' : 'stopped'} />
                  <span className="text-sm font-medium">
                    {isProxyRunning ? 'Running' : 'Stopped'}
                  </span>
                </>
              )}
            </div>
            {isProxyRunning && uptime !== undefined && lifecycleState === 'running' && (
              <span className="text-sm text-muted-foreground">
                Uptime {formatUptime(uptime)}
              </span>
            )}
          </div>

          {lifecycleError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{lifecycleError}</span>
            </div>
          )}
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
