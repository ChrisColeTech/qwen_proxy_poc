import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';

export function ModelsPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Models content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
