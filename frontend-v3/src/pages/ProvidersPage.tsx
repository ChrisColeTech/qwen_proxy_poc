import { Blocks } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function ProvidersPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Providers
          </CardTitle>
          <CardDescription>
            Manage your AI providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Providers content coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
