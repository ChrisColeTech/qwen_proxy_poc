import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function QuickGuidePage() {
  return (
    <div className="container max-w-6xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Guide
          </CardTitle>
          <CardDescription>Getting started with Qwen Proxy</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Quick guide content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
