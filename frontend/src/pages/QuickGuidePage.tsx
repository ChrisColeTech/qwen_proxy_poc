import { useProxyStatus } from '@/hooks/useProxyStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function QuickGuidePage() {
  useProxyStatus();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
