import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { formatDate } from '@/utils/formatters';
import { LogIn } from 'lucide-react';

interface CredentialsSectionProps {
  credentials: { valid: boolean; expiresAt: number | null } | undefined;
  onConnect: () => void;
  loading: boolean;
}

export function CredentialsSection({ credentials, onConnect, loading }: CredentialsSectionProps) {
  const credentialStatus = credentials?.valid
    ? 'authenticated'
    : credentials
    ? 'invalid'
    : 'none';

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Credentials</span>
        <StatusIndicator status={credentialStatus} />
        <span className="text-sm font-medium">
          {credentialStatus.charAt(0).toUpperCase() + credentialStatus.slice(1)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {credentials?.valid && credentials.expiresAt && (
          <span className="text-sm text-muted-foreground">
            Expires {formatDate(credentials.expiresAt)}
          </span>
        )}
        <Button
          onClick={onConnect}
          disabled={loading}
          size="icon"
          variant={credentials ? 'outline' : 'default'}
          title={credentials ? 'Re-authenticate' : 'Connect to Qwen'}
          className="h-8 w-8"
        >
          <LogIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
