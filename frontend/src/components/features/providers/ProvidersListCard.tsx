import { Blocks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProvidersListCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Blocks className="h-5 w-5" />
          Providers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Providers section placeholder</p>
      </CardContent>
    </Card>
  );
}
