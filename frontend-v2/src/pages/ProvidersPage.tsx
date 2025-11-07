import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Blocks } from 'lucide-react';

export function ProvidersPage() {
  return (
    <div className="container max-w-6xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Providers
          </CardTitle>
          <CardDescription>Manage API providers</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Providers content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
