import { useEffect, useState } from 'react';
import { Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProxyStore } from '@/stores/useProxyStore';
import type { WebSocketEvent } from '@/types';

function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function EventLogPage() {
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

    setEventLog((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
  }, [lastUpdate, wsProxyStatus]);

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Event Log
            <Badge variant="secondary" className="ml-2">
              Last 100 events
            </Badge>
          </CardTitle>
          <CardDescription>Real-time WebSocket events and system updates</CardDescription>
        </CardHeader>
        <CardContent>
          {eventLog.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events received yet</p>
              <p className="text-sm mt-2">Events will appear here as they occur</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
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
