import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Blocks } from 'lucide-react';

export function ProvidersPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Providers content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
