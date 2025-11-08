import { BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function QuickGuidePage() {
  return (
    <div className="container max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Guide
          </CardTitle>
          <CardDescription>
            Get started with Qwen Proxy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Quick guide content coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
