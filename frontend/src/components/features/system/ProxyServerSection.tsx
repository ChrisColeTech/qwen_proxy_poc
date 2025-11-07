import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { formatUptime } from '@/utils/formatters';
import { Activity, Play, Square, AlertCircle } from 'lucide-react';

interface ProxyServerSectionProps {
  isRunning: boolean;
  uptime: number | undefined;
  lifecycleState: 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  lifecycleError: string | null;
  onStart: () => void;
  onStop: () => void;
  loading: boolean;
}

export function ProxyServerSection({
  isRunning,
  uptime,
  lifecycleState,
  lifecycleError,
  onStart,
  onStop,
  loading,
}: ProxyServerSectionProps) {
  return (
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
              <StatusIndicator status={isRunning ? 'running' : 'stopped'} />
              <span className="text-sm font-medium">
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRunning && uptime !== undefined && lifecycleState === 'running' && (
            <span className="text-sm text-muted-foreground">
              Uptime {formatUptime(uptime)}
            </span>
          )}
          {!isRunning ? (
            <Button
              onClick={onStart}
              disabled={loading}
              size="icon"
              variant="default"
              title="Start proxy server"
              className="h-8 w-8"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={onStop}
              disabled={loading}
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

      {lifecycleError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{lifecycleError}</span>
        </div>
      )}
    </div>
  );
}
