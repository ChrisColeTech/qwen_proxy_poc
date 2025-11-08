import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Server } from 'lucide-react';
import type { ProxyStatus, ProxyControlState } from '@/types/home.types';
import type { CredentialStatus } from '@/types/credentials.types';
import { ProxyStatusSection } from './ProxyStatusSection';
import { CredentialsSection } from './CredentialsSection';

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
          <ProxyStatusSection
            isRunning={isRunning}
            startedTime={startedTime}
            uptime={uptime}
            loading={controlState.loading}
            onStart={onStart}
            onStop={onStop}
          />

          <div className="home-section-divider"></div>

          <CredentialsSection
            credStatus={credStatus}
            credLoading={credLoading}
            credError={credError}
            onLogin={onLogin}
            onLogout={onLogout}
            onRefreshCreds={onRefreshCreds}
          />
        </CardContent>
      </Card>
    </>
  );
}
