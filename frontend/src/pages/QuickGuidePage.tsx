import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function QuickGuidePage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Quick guide content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
