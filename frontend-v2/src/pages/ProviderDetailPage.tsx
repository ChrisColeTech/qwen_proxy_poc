import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Trash2, TestTube2, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/useUIStore';
import { apiService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import type { Provider } from '@/types/providers.types';

interface ProviderDetailPageProps {
  providerId: string;
}

export function ProviderDetailPage({ providerId }: ProviderDetailPageProps) {
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const { toast } = useToast();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const [providerData, configData] = await Promise.all([
        apiService.getProvider(providerId),
        apiService.getProviderConfig(providerId, true), // masked
      ]);
      setProvider(providerData);
      setConfig(configData.config || {});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load provider details',
        variant: 'destructive',
      });
      console.error('Failed to fetch provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentRoute('/providers');
  };

  const handleEdit = () => {
    setCurrentRoute(`/providers/${providerId}/edit`);
  };

  const handleTest = async () => {
    try {
      setActionLoading('test');
      await apiService.testProvider(providerId);
      toast({
        title: 'Success',
        description: 'Provider connection test successful',
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error instanceof Error ? error.message : 'Connection test failed',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete provider "${provider?.name}"?`)) {
      return;
    }

    try {
      setActionLoading('delete');
      await apiService.deleteProvider(providerId);
      toast({
        title: 'Success',
        description: 'Provider deleted successfully',
      });
      setCurrentRoute('/providers');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete provider',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading provider...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="page-container">
        <p>Provider not found</p>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Providers
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card className="page-card">
        <CardHeader>
          <CardTitle className="card-title-with-icon">
            <Settings className="icon-sm" />
            Provider Details
          </CardTitle>
          <CardDescription>View provider information and configuration</CardDescription>
        </CardHeader>
        <CardContent className="page-card-content vspace-md">
          {/* Basic Info Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Provider Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Name</div>
                <div className="text-base mt-1">{provider.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">ID</div>
                <div className="text-base mt-1 font-mono text-sm">{provider.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Type</div>
                <div className="mt-1">
                  <Badge variant="outline">{provider.type}</Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">
                  <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              {provider.description && (
                <div className="col-span-2">
                  <div className="text-sm font-medium text-muted-foreground">Description</div>
                  <div className="text-base mt-1">{provider.description}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-muted-foreground">Priority</div>
                <div className="text-base mt-1">{provider.priority}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Runtime Status</div>
                <div className="text-base mt-1">{provider.runtime_status}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="text-base mt-1">{new Date(provider.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <div className="text-base mt-1">{new Date(provider.updated_at).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="divider-horizontal my-6" />

          {/* Configuration Section */}
          <div>
            <h3 className="text-sm font-medium mb-3">Configuration</h3>
            {config && Object.keys(config).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(config).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{key}</div>
                      <div className="text-sm text-muted-foreground mt-1 font-mono">
                        {typeof value === 'string' && value.includes('***')
                          ? value
                          : JSON.stringify(value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No configuration settings</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t mt-6">
            <Button onClick={handleBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Providers
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleTest} variant="outline" size="sm" disabled={actionLoading === 'test'}>
                <TestTube2 className="h-4 w-4 mr-2" />
                {actionLoading === 'test' ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleDelete} variant="destructive" size="sm" disabled={actionLoading === 'delete'}>
                <Trash2 className="h-4 w-4 mr-2" />
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
