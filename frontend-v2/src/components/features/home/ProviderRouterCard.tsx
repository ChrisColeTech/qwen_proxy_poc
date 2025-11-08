import { Server, Play, Square } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUptime } from '@/utils/formatters';

interface ProviderRouterCardProps {
  running: boolean;
  port: number | undefined;
  uptime: number | undefined;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ProviderRouterCard({ running, port, uptime, loading, onStart, onStop }: ProviderRouterCardProps) {
  return (
    <Card className="home-service-card">
      <CardHeader>
        <div className="home-service-header">
          <CardTitle className="home-service-title">
            <Server className="icon-sm" />
            Provider Router
          </CardTitle>
          <Badge variant={running ? 'default' : 'destructive'}>
            {running ? 'Running' : 'Stopped'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="home-service-content">
        <div className="home-service-row">
          <span className="home-service-label">Port</span>
          <span className="home-service-value">{port ?? 'N/A'}</span>
        </div>
        <div className="home-service-row">
          <span className="home-service-label">Uptime</span>
          <span className="home-service-value">
            {uptime !== undefined ? formatUptime(uptime) : 'N/A'}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        {!running ? (
          <Button onClick={onStart} disabled={loading} size="sm" className="home-service-footer">
            <Play className="icon-sm" />
            Start Proxy
          </Button>
        ) : (
          <Button onClick={onStop} disabled={loading} size="sm" variant="destructive" className="home-service-footer">
            <Square className="icon-sm" />
            Stop Proxy
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
