import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useProxyStore } from '@/stores/useProxyStore';
import { Server } from 'lucide-react';

export function ProvidersListCard() {
  const proxyStatus = useProxyStore((state) => state.status);
  const providers = proxyStatus?.providers?.items || [];
  const enabledCount = proxyStatus?.providers?.enabled || 0;
  const totalCount = proxyStatus?.providers?.total || 0;

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
        {providers.length === 0 ? (
          <div className="text-sm text-muted-foreground">No providers available</div>
        ) : (
          <div className="space-y-2">
            {providers
              .filter((p) => p.enabled)
              .map((provider) => (
                <div key={provider.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <StatusBadge status="active" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{provider.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{provider.baseUrl}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
