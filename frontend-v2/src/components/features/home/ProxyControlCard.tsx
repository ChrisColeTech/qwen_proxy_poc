import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, RefreshCw, Server, Key, LogIn } from 'lucide-react';
import type { ProxyStatus, ProxyControlState } from '@/types/home.types';
import type { CredentialStatus } from '@/types/credentials.types';
import { proxyService } from '@/services/proxy.service';
import { credentialsService } from '@/services/credentials.service';

interface ProxyControlCardProps {
  proxyStatus: ProxyStatus | null;
  controlState: ProxyControlState;
  credStatus: CredentialStatus;
  credLoading: boolean;
  credError: string | null;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onRefreshCreds: () => void;
}

export function ProxyControlCard({
  proxyStatus,
  controlState,
  credStatus,
  credLoading,
  credError,
  onStart,
  onStop,
  onRefresh,
  onLogin,
  onLogout,
  onRefreshCreds,
}: ProxyControlCardProps) {
  const isRunning =
    proxyStatus?.providerRouter?.running || proxyStatus?.qwenProxy?.running || false;
  const uptime = proxyStatus?.providerRouter?.uptime || proxyStatus?.qwenProxy?.uptime;
  const startedTime = uptime ? new Date(Date.now() - uptime * 1000) : null;

  const statusInfo = credentialsService.getStatusInfo(credStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <>
      {controlState.error && (
        <Alert variant="destructive">
          <AlertDescription>{controlState.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="home-status-header">
            <CardTitle className="home-status-title">
              <Server className="icon-md" />
              Proxy Control
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={controlState.loading}>
              <RefreshCw className="icon-sm" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="home-unified-content">
          {/* Proxy Status Section */}
          <div className="home-section">
            <div className="home-section-title">Proxy Status</div>
            <div className="home-status-indicator">
              <div className="home-status-badge">
                {isRunning ? (
                  <>
                    <StatusIndicator status="success" animated />
                    <span className="home-status-label">RUNNING</span>
                  </>
                ) : (
                  <>
                    <StatusIndicator status="inactive" />
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
                <Button onClick={onStart} disabled={controlState.loading} className="home-start-button">
                  {controlState.loading ? (
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
                  disabled={controlState.loading}
                  className="home-stop-button"
                >
                  {controlState.loading ? (
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

          {/* Divider */}
          <div className="home-section-divider"></div>

          {/* Qwen Credentials Section */}
          <div className="home-section">
            <div className="home-section-header">
              <div className="home-section-title">
                <Key className="icon-sm" />
                Qwen Credentials
              </div>
              <Button variant="ghost" size="sm" onClick={onRefreshCreds} disabled={credLoading}>
                <RefreshCw className="icon-sm" />
              </Button>
            </div>

            <div className="credentials-status-row">
              <StatusIcon className={`credentials-status-icon ${statusInfo.color}`} />
              <Badge variant={statusInfo.variant} className="credentials-status-badge">
                {statusInfo.label}
              </Badge>
            </div>

            {credError && (
              <div className="credentials-error-message">
                <p className="credentials-error-text">{credError}</p>
              </div>
            )}

            {credStatus.expiresAt && (
              <div className="credentials-info-section-compact">
                <div className="home-uptime-row">
                  <span className="home-uptime-label">Expires:</span>
                  <span className="home-uptime-value">
                    {credentialsService.formatExpiration(credStatus.expiresAt)}
                  </span>
                </div>
                <div className="home-uptime-row">
                  <span className="home-uptime-label">Time remaining:</span>
                  <span className="home-uptime-value">
                    {credentialsService.getTimeRemaining(credStatus.expiresAt)}
                  </span>
                </div>
                <div className="home-control-buttons">
                  <Button variant="destructive" onClick={onLogout} disabled={credLoading} size="sm">
                    Logout
                  </Button>
                </div>
              </div>
            )}

            {!credStatus.expiresAt && (
              <div className="credentials-logged-out-section-compact">
                <p className="credentials-logged-out-text">Log in to use Qwen models</p>
                <Button onClick={onLogin} disabled={credLoading} size="sm">
                  <LogIn className="icon-sm credentials-button-icon" />
                  Login to Qwen
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
