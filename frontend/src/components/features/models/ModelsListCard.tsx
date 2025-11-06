import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProxyStore } from '@/stores/useProxyStore';
import { Layers } from 'lucide-react';

export function ModelsListCard() {
  const proxyStatus = useProxyStore((state) => state.status);
  const models = proxyStatus?.models?.items || [];
  const totalCount = proxyStatus?.models?.total || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4" />
          Models
          <span className="ml-auto text-xs text-muted-foreground font-normal">{totalCount}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <div className="text-sm text-muted-foreground">No models available</div>
        ) : (
          <div className="space-y-2">
            {models.map((model) => (
              <div key={model.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div className="text-sm font-medium">{model.name}</div>
                <div className="text-xs text-muted-foreground">{model.providerId}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
