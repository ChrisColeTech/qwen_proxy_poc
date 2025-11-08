import { Key, LogIn } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatExpiryDate } from '@/utils/formatters';

interface CredentialsCardProps {
  valid: boolean;
  expiresAt: number | null | undefined;
  onLogin: () => void;
}

export function CredentialsCard({ valid, expiresAt, onLogin }: CredentialsCardProps) {
  return (
    <Card className="home-service-card">
      <CardHeader>
        <div className="home-service-header">
          <CardTitle className="home-service-title">
            <Key className="icon-sm" />
            Qwen Credentials
          </CardTitle>
          <Badge variant={valid ? 'default' : 'destructive'}>
            {valid ? 'Valid' : 'Invalid'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="home-service-content">
        <div className="home-service-row">
          <span className="home-service-label">Expires At</span>
          <span className="home-service-value">
            {formatExpiryDate(expiresAt ?? null)}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onLogin} size="sm" variant="outline" className="home-service-footer">
          <LogIn className="icon-sm" />
          {expiresAt ? 'Re-login to Qwen' : 'Login to Qwen'}
        </Button>
      </CardFooter>
    </Card>
  );
}
