import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, RefreshCw, LogIn } from 'lucide-react';
import type { CredentialStatus } from '@/types/credentials.types';
import { credentialsService } from '@/services/credentials.service';

interface CredentialsSectionProps {
  credStatus: CredentialStatus;
  credLoading: boolean;
  credError: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onRefreshCreds: () => void;
}

export function CredentialsSection({
  credStatus,
  credLoading,
  credError,
  onLogin,
  onLogout,
  onRefreshCreds
}: CredentialsSectionProps) {
  const statusInfo = credentialsService.getStatusInfo(credStatus);
  const StatusIcon = statusInfo.icon;

  return (
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
  );
}
