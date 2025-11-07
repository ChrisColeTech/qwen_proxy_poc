import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { useProxyStore } from '@/stores/useProxyStore';
import { Server } from 'lucide-react';

export function ProvidersListCard() {
  const proxyStatus = useProxyStore((state) => state.status);
  const providers = proxyStatus?.providers?.items || [];
  const enabledCount = proxyStatus?.providers?.enabled || 0;
  const totalCount = proxyStatus?.providers?.total || 0;

  const enabledProviders = providers.filter((p) => p.enabled);
  const allProviders = providers;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-4 w-4" />
          Providers
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {enabledCount} / {totalCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Providers</TabsTrigger>
            <TabsTrigger value="all">All Providers</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {enabledProviders.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No active providers
              </div>
            ) : (
              <div className="space-y-2">
                {enabledProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <StatusBadge status="running" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{provider.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{provider.baseUrl}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {allProviders.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No providers available
              </div>
            ) : (
              <div className="space-y-2">
                {allProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <StatusBadge status={provider.enabled ? 'running' : 'stopped'} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{provider.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{provider.baseUrl}</div>
                    </div>
                    {!provider.enabled && (
                      <span className="text-xs text-muted-foreground">Disabled</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
