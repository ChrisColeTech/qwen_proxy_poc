import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProxyStore } from '@/stores/useProxyStore';
import { Layers } from 'lucide-react';

export function ModelsListCard() {
  const proxyStatus = useProxyStore((state) => state.status);
  const models = proxyStatus?.models?.items || [];
  const totalCount = proxyStatus?.models?.total || 0;

  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    const providerId = model.providerId || 'unknown';
    if (!acc[providerId]) {
      acc[providerId] = [];
    }
    acc[providerId].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4" />
          Configured Models
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {totalCount} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Models configured across all providers in the system
        </p>
        {models.length === 0 ? (
          <div className="text-sm text-muted-foreground">No models configured</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(modelsByProvider).map(([providerId, providerModels]) => (
              <div key={providerId} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {providerId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {providerModels.length} {providerModels.length === 1 ? 'model' : 'models'}
                  </span>
                </div>
                <div className="space-y-1 ml-4">
                  {providerModels.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <code className="text-sm font-medium">{model.name}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
