import { Activity } from 'lucide-react';
import { useCredentials } from '@/hooks/useCredentials';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SystemStatsCard() {
  const { status: credStatus, isElectron } = useCredentials();
  const { status: proxyStatus } = useProxyStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>System Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Credentials</span>
          <span className={`text-sm font-medium ${credStatus.isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {credStatus.isValid ? 'Valid' : 'None'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Proxy</span>
          <span className={`text-sm font-medium ${proxyStatus.isRunning ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {proxyStatus.isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Mode</span>
          <span className="text-sm font-medium">
            {isElectron ? 'Desktop' : 'Browser'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
