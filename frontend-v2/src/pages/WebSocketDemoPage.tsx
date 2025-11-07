import { useEffect, useState } from 'react';
import { Activity, Clock, Server, Database, Key, Blocks, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useProxyStore } from '@/stores/useProxyStore';
import type { WebSocketEvent } from '@/types';

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatExpiryDate(expiresAt: number | null): string {
  if (!expiresAt) return 'N/A';
  const date = new Date(expiresAt);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function ConnectionStatusBadge({ status }: { status: string }) {
  const variants = {
    connected: { variant: 'default' as const, icon: CheckCircle, text: 'Connected', className: 'bg-green-500 hover:bg-green-600' },
    disconnected: { variant: 'destructive' as const, icon: XCircle, text: 'Disconnected', className: '' },
    reconnecting: { variant: 'secondary' as const, icon: AlertCircle, text: 'Reconnecting...', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  };

  const config = variants[status as keyof typeof variants] || variants.disconnected;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </Badge>
  );
}

export function WebSocketDemoPage() {
  const { connectionStatus, isConnected, reconnectAttempts } = useWebSocket();
  const { wsProxyStatus, lastUpdate } = useProxyStore();
  const [eventLog, setEventLog] = useState<WebSocketEvent[]>([]);

  // Listen to store changes to log events
  useEffect(() => {
    if (!wsProxyStatus) return;

    const newEvent: WebSocketEvent = {
      type: 'proxy:status',
      data: { status: wsProxyStatus, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    };

    setEventLog((prev) => [newEvent, ...prev].slice(0, 20));
  }, [lastUpdate, wsProxyStatus]);

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                WebSocket Demo
              </CardTitle>
              <CardDescription>Real-time WebSocket connection monitoring</CardDescription>
            </div>
            <ConnectionStatusBadge status={connectionStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Server:</span>
              <span className="ml-2 font-mono">localhost:3002</span>
            </div>
            <div>
              <span className="text-muted-foreground">Transport:</span>
              <span className="ml-2">WebSocket</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reconnect Attempts:</span>
              <span className="ml-2">{reconnectAttempts}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proxy Services Status */}
      {wsProxyStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provider Router */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-4 w-4" />
                Provider Router
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={wsProxyStatus.providerRouter?.running ? 'default' : 'destructive'}>
                  {wsProxyStatus.providerRouter?.running ? 'Running' : 'Stopped'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Port</span>
                <span className="text-sm font-mono">{wsProxyStatus.providerRouter?.port ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-mono">
                  {wsProxyStatus.providerRouter?.uptime !== undefined ? formatUptime(wsProxyStatus.providerRouter.uptime) : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Qwen Proxy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                Qwen Proxy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={wsProxyStatus.qwenProxy?.running ? 'default' : 'destructive'}>
                  {wsProxyStatus.qwenProxy?.running ? 'Running' : 'Stopped'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Port</span>
                <span className="text-sm font-mono">{wsProxyStatus.qwenProxy?.port ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-mono">
                  {wsProxyStatus.qwenProxy?.uptime !== undefined ? formatUptime(wsProxyStatus.qwenProxy.uptime) : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4" />
                Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={wsProxyStatus.credentials?.valid ? 'default' : 'destructive'}>
                  {wsProxyStatus.credentials?.valid ? 'Valid' : 'Invalid'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expires At</span>
                <span className="text-sm">
                  {formatExpiryDate(wsProxyStatus.credentials?.expiresAt ?? null)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Providers & Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Blocks className="h-4 w-4" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Providers</span>
                <Badge variant="secondary">{wsProxyStatus.providers?.total ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Enabled Providers</span>
                <Badge variant="default">{wsProxyStatus.providers?.enabled ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Models</span>
                <Badge variant="secondary">{wsProxyStatus.models?.total ?? 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Data Message */}
      {!wsProxyStatus && isConnected && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Connected to WebSocket. Waiting for data...</p>
          </CardContent>
        </Card>
      )}

      {!isConnected && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Not connected to WebSocket server</p>
            <p className="text-sm mt-2">Make sure the backend server is running on localhost:3002</p>
          </CardContent>
        </Card>
      )}

      {/* Event Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Event Log
            <Badge variant="secondary" className="ml-2">
              Last 20 events
            </Badge>
          </CardTitle>
          <CardDescription>Real-time WebSocket events</CardDescription>
        </CardHeader>
        <CardContent>
          {eventLog.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No events received yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {eventLog.map((event, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/50 border border-border font-mono text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {event.type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
