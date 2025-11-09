import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, LogIn } from 'lucide-react';
import { credentialsService } from '@/services/credentials.service';
import type { CredentialStatus } from '@/types/credentials.types';

interface CredentialsStatusCardProps {
  status: CredentialStatus;
  loading: boolean;
  error: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export function CredentialsStatusCard({
  status,
  loading,
  error,
  onLogin,
  onLogout,
  onRefresh,
}: CredentialsStatusCardProps) {
  const statusInfo = credentialsService.getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader>
        <div className="credentials-card-header">
          <div className="credentials-card-title-row">
            <Key className="icon-md credentials-icon" />
            <CardTitle>Qwen Credentials</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="credentials-card-content">
        <div className="credentials-status-row">
          <StatusIcon className={`credentials-status-icon ${statusInfo.color}`} />
          <Badge variant={statusInfo.variant} className="credentials-status-badge">
            {statusInfo.label}
          </Badge>
        </div>

        {error && (
          <div className="credentials-error-message">
            <p className="credentials-error-text">{error}</p>
          </div>
        )}

        {status.expiresAt && (
          <div className="credentials-info-section">
            <div className="credentials-info-row">
              <p className="credentials-info-label">Expires</p>
              <p className="credentials-info-value">
                {credentialsService.formatExpiration(status.expiresAt)}
              </p>
            </div>
            <div className="credentials-info-row">
              <p className="credentials-info-label">Time remaining</p>
              <p className="credentials-info-value">
                {credentialsService.getTimeRemaining(status.expiresAt)}
              </p>
            </div>
            <div className="credentials-action-section">
              <Button variant="destructive" onClick={onLogout} disabled={loading}>
                Logout
              </Button>
            </div>
          </div>
        )}

        {!status.expiresAt && (
          <div className="credentials-logged-out-section">
            <p className="credentials-logged-out-text">Log in to use Qwen models</p>
            <Button onClick={onLogin} disabled={loading}>
              <LogIn className="icon-sm credentials-button-icon" />
              Login to Qwen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
