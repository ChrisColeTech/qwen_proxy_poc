import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';

export function HomePage() {
  return (
    <div className="container max-w-6xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home Dashboard
          </CardTitle>
          <CardDescription>Welcome to Qwen Proxy</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is the home page. The full dashboard with system controls, providers, and models will be implemented
            in later phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
