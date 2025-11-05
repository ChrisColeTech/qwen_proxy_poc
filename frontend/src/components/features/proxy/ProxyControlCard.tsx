import { Server, AlertCircle, Play, Square } from 'lucide-react';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ProxyControlCard() {
  const { status, loading: statusLoading } = useProxyStatus();
  const { startProxy, stopProxy, starting, stopping, error } = useProxyControl();

  const handleStart = async () => {
    try {
      await startProxy();
    } catch (err) {
      console.error('Failed to start proxy:', err);
    }
  };

  const handleStop = async () => {
    try {
      await stopProxy();
    } catch (err) {
      console.error('Failed to stop proxy:', err);
    }
  };

  const getUptime = () => {
    if (!status.isRunning || !status.startedAt) return 'N/A';
    const seconds = Math.floor((Date.now() - status.startedAt) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="proxy-header">
          <div className="proxy-header-left">
            <Server className="proxy-icon" />
            <CardTitle>Proxy Server</CardTitle>
          </div>
          <div className="proxy-header-right">
            <button
              onClick={handleStart}
              disabled={status.isRunning || starting || stopping || statusLoading}
              className="proxy-button"
              title={starting ? 'Starting proxy...' : 'Start proxy server'}
            >
              <Play className="proxy-button-icon" />
            </button>
            <button
              onClick={handleStop}
              disabled={!status.isRunning || starting || stopping || statusLoading}
              className="proxy-button"
              title={stopping ? 'Stopping proxy...' : 'Stop proxy server'}
            >
              <Square className="proxy-button-icon" />
            </button>
          </div>
        </div>
        <CardDescription>
          Control the OpenAI-to-Qwen proxy server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="proxy-error">
            <AlertCircle className="proxy-error-icon" />
            <span>{error}</span>
          </div>
        )}

        {status.isRunning && (
          <div className="proxy-stats">
            <div>
              <p className="proxy-stat-label">Port</p>
              <p className="proxy-stat-value">{status.port}</p>
            </div>
            <div>
              <p className="proxy-stat-label">Uptime</p>
              <p className="proxy-stat-value">{getUptime()}</p>
            </div>
          </div>
        )}

        {status.isRunning && (
          <div className="proxy-endpoint">
            <p className="proxy-endpoint-label">Proxy Endpoint</p>
            <code className="proxy-endpoint-code">http://localhost:{status.port}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
