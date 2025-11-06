import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { truncateToken, truncateCookies } from '@/utils/string.utils';
import { formatDate } from '@/utils/formatters';
import { FileText } from 'lucide-react';

export function CredentialsDetailCard() {
  const credentials = useCredentialsStore((state) => state.credentials);

  if (!credentials) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1">
          <div className="text-muted-foreground">Token</div>
          <code className="block bg-muted px-3 py-2 rounded text-xs font-mono">
            {truncateToken(credentials.token)}
          </code>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Cookies</div>
          <code className="block bg-muted px-3 py-2 rounded text-xs font-mono">
            {truncateCookies(credentials.cookies)}
          </code>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Expires</div>
          <div className="font-medium">{formatDate(credentials.expiresAt)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
