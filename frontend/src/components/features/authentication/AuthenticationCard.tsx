import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/hooks/useAuth';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { credentialsService } from '@/services/credentialsService';
import { formatDate } from '@/utils/formatters';
import { Lock, LogIn, LogOut, Info } from 'lucide-react';

export function AuthenticationCard() {
  const { handleConnect, handleRevoke, loading } = useAuth();
  const credentials = useCredentialsStore((state) => state.credentials);

  const credentialStatus = credentials
    ? credentials.isExpired
      ? 'expired'
      : 'active'
    : 'inactive';

  const isElectron = credentialsService.isElectron();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Authentication
          </CardTitle>
          <StatusBadge status={credentialStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {credentials && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Expires</div>
            <div className="text-sm font-medium">{formatDate(credentials.expiresAt)}</div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={loading}
            size="icon"
            variant={credentials ? 'outline' : 'default'}
            title={credentials ? 'Re-authenticate' : 'Connect to Qwen'}
          >
            <LogIn className="h-4 w-4" />
          </Button>

          {credentials && (
            <Button
              onClick={handleRevoke}
              disabled={loading}
              size="icon"
              variant="destructive"
              title="Revoke credentials"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <div>
            {isElectron
              ? 'Click connect to open Qwen login window'
              : 'Install Chrome extension and log in to chat.qwen.ai'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
