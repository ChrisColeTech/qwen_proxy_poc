import { useEffect, useState } from 'react';
import { AuthenticationCard } from '@/components/features/authentication/AuthenticationCard';
import { ProxyControlCard } from '@/components/features/proxy/ProxyControlCard';
import { StatusCard } from '@/components/features/dashboard/StatusCard';
import { MainContent } from '@/components/layout/MainContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerOff } from 'lucide-react';
import { API_BASE_URL, API_SERVER_PORT } from '@/config/api.config';

export function HomePage() {
  const [apiConnected, setApiConnected] = useState(true);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        setApiConnected(response.ok);
      } catch {
        setApiConnected(false);
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MainContent>
      <div className="home-container">
        <div className="home-content">
          {!apiConnected ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ServerOff className="h-5 w-5 text-destructive" />
                  <CardTitle>API Server Offline</CardTitle>
                </div>
                <CardDescription>
                  Cannot connect to the API server on port {API_SERVER_PORT}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cannot connect to the API server on port {API_SERVER_PORT}. Please ensure the API server is running.
                </p>
                <code className="block mt-2 p-2 bg-muted rounded text-xs">
                  cd backend/api-server && npm run dev
                </code>
              </CardContent>
            </Card>
          ) : (
            <>
              <StatusCard />
              <AuthenticationCard />
              <ProxyControlCard />
            </>
          )}
        </div>
      </div>
    </MainContent>
  );
}
