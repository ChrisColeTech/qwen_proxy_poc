import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Play, Square, RefreshCw } from 'lucide-react';
import { proxyService } from '@/services/proxy.service';

interface ProxyStatusSectionProps {
  isRunning: boolean;
  startedTime: Date | null;
  uptime: number | undefined;
  loading: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ProxyStatusSection({
  isRunning,
  startedTime,
  uptime,
  loading,
  onStart,
  onStop
}: ProxyStatusSectionProps) {
  return (
    <div className="home-section">
      <div className="home-section-title">Proxy Status</div>
      <div className="home-status-indicator">
        <div className="home-status-badge">
          {isRunning ? (
            <>
              <StatusIndicator status="running" />
              <span className="home-status-label">RUNNING</span>
            </>
          ) : (
            <>
              <StatusIndicator status="stopped" />
              <span className="home-status-label-inactive">STOPPED</span>
            </>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="home-uptime-section">
          <div className="home-uptime-row">
            <span className="home-uptime-label">Started:</span>
            <span className="home-uptime-value">{proxyService.formatTime(startedTime)}</span>
          </div>
          <div className="home-uptime-row">
            <span className="home-uptime-label">Uptime:</span>
            <span className="home-uptime-value">{proxyService.formatUptime(uptime)}</span>
          </div>
        </div>
      )}

      <div className="home-control-buttons">
        {!isRunning ? (
          <Button onClick={onStart} disabled={loading} className="home-start-button">
            {loading ? (
              <>
                <RefreshCw className="icon-sm home-button-icon-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="icon-sm" />
                Start Proxy
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={onStop}
            disabled={loading}
            className="home-stop-button"
          >
            {loading ? (
              <>
                <RefreshCw className="icon-sm home-button-icon-spin" />
                Stopping...
              </>
            ) : (
              <>
                <Square className="icon-sm" />
                Stop Proxy
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
