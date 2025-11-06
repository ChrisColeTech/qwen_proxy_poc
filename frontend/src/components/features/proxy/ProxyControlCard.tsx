import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { formatUptime } from '@/utils/formatters';
import { Server, Play, Square, Copy } from 'lucide-react';

export function ProxyControlCard() {
  const { handleStart, handleStop, loading } = useProxyControl();
  const proxyStatus = useProxyStore((state) => state.status);
  const showAlert = useAlertStore((state) => state.showAlert);

  const isRunning = proxyStatus?.qwenProxy?.running || false;
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
            <Server className="h-4 w-4" />
            Proxy Server
          </CardTitle>
          <StatusBadge status={isRunning ? 'running' : 'stopped'} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Port</div>
            <div className="font-medium">{port || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Uptime</div>
            <div className="font-medium">{isRunning ? formatUptime(uptime) : 'N/A'}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleStart}
            disabled={loading || isRunning}
            size="icon"
            variant="default"
            title="Start proxy server"
          >
            <Play className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleStop}
            disabled={loading || !isRunning}
            size="icon"
            variant="destructive"
            title="Stop proxy server"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>

        {isRunning && endpointUrl && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Endpoint</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono">
                {endpointUrl}
              </code>
              <Button
                onClick={handleCopy}
                size="icon"
                variant="outline"
                title="Copy endpoint URL"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
