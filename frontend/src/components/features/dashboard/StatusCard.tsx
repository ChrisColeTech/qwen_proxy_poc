import { Activity, Database, Lock, Layers } from 'lucide-react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function StatusCard() {
  const { status, loading } = useProxyStatus();

  const stats = [
    {
      label: 'Proxy Status',
      value: status.isRunning ? 'Running' : 'Stopped',
      icon: Activity,
      color: status.isRunning ? 'text-green-500' : 'text-gray-400',
    },
    {
      label: 'Providers',
      value: status.providers
        ? `${status.providers.enabled}/${status.providers.total}`
        : '0/0',
      icon: Database,
      color: 'text-blue-500',
    },
    {
      label: 'Models',
      value: status.models?.total || 0,
      icon: Layers,
      color: 'text-purple-500',
    },
    {
      label: 'Credentials',
      value: status.credentials?.valid ? 'Valid' : 'Missing',
      icon: Lock,
      color: status.credentials?.valid ? 'text-green-500' : 'text-red-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>
          Overview of proxy services and configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
