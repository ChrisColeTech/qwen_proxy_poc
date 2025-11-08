import { Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function ModelsPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Models
          </CardTitle>
          <CardDescription>
            Manage your AI models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Models content coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
