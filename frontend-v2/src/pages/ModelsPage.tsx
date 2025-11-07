import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';

export function ModelsPage() {
  return (
    <div className="container max-w-6xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Models
          </CardTitle>
          <CardDescription>Manage AI models</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Models content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
