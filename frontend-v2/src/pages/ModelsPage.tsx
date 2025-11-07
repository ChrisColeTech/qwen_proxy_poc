import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, RefreshCw } from 'lucide-react';
import { useModels } from '@/hooks/useModels';
import { ModelsFilters } from '@/components/features/models/ModelsFilters';
import { ModelsGrid } from '@/components/features/models/ModelsGrid';

export function ModelsPage() {
  const {
    models,
    loading,
    error,
    capabilityFilter,
    providerFilter,
    providers,
    setCapabilityFilter,
    setProviderFilter,
    clearFilters,
    refresh,
  } = useModels();

  return (
    <div className="models-container">
      <Card>
        <CardHeader>
          <div className="models-header">
            <div>
              <CardTitle className="models-title">
                <Cpu className="icon-md" />
                Models
              </CardTitle>
              <CardDescription>Browse available AI models</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
              <RefreshCw className={`icon-sm ${loading ? 'models-refresh-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="models-content">
          <ModelsFilters
            capabilityFilter={capabilityFilter}
            providerFilter={providerFilter}
            providers={providers}
            modelCount={models.length}
            onCapabilityChange={setCapabilityFilter}
            onProviderChange={setProviderFilter}
          />

          <ModelsGrid
            models={models}
            loading={loading}
            error={error}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
