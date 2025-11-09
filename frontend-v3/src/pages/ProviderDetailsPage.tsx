import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, TestTube, RefreshCw, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { useAlertStore } from '@/stores/useAlertStore';
import { useUIStore } from '@/stores/useUIStore';
import { providersService } from '@/services/providers.service';
import type { ProviderDetails } from '@/types/providers.types';

export function ProviderDetailsPage() {
  const currentRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  // Extract ID from current route
  const pathParts = currentRoute.split('/');
  const id = pathParts[2];

  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setCurrentRoute('/providers');
      return;
    }

    const loadProvider = async () => {
      try {
        const data = await providersService.getProviderDetails(id);
        setProvider(data);
      } catch (error) {
        console.error('Failed to load provider:', error);
        useAlertStore.showAlert('Failed to load provider', 'error');
        setCurrentRoute('/providers');
      } finally {
        setLoading(false);
      }
    };

    loadProvider();
  }, [id, setCurrentRoute]);

  const handleTest = async () => {
    if (!id) return;
    setActionLoading('test');
    try {
      await providersService.testConnection(id);
      useAlertStore.showAlert('Connection test successful', 'success');
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Connection test failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReload = async () => {
    if (!id) return;
    setActionLoading('reload');
    try {
      await providersService.reloadProvider(id);
      useAlertStore.showAlert('Provider reloaded successfully', 'success');
      // Refresh provider data
      const data = await providersService.getProviderDetails(id);
      setProvider(data);
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Failed to reload provider', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleEnabled = async () => {
    if (!provider) return;
    setActionLoading('toggle');
    try {
      await providersService.toggleEnabled(provider);
      useAlertStore.showAlert(
        `Provider ${provider.enabled ? 'disabled' : 'enabled'} successfully`,
        'success'
      );
      // Refresh provider data
      const data = await providersService.getProviderDetails(provider.id);
      setProvider(data);
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Failed to toggle provider', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!provider || !confirm(`Are you sure you want to delete provider "${provider.name}"?`)) {
      return;
    }

    setActionLoading('delete');
    try {
      await providersService.deleteProvider(provider.id);
      useAlertStore.showAlert('Provider deleted successfully', 'success');
      setCurrentRoute('/providers');
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Failed to delete provider', 'error');
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskSensitiveValue = (key: string, value: any) => {
    const isSensitive = key.toLowerCase().includes('token') ||
                       key.toLowerCase().includes('key') ||
                       key.toLowerCase().includes('secret') ||
                       key.toLowerCase().includes('password') ||
                       key.toLowerCase().includes('cookie');

    if (isSensitive && value) {
      return '••••••••';
    }
    return value;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading provider...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return null;
  }

  return (
    <div className="page-container">
      {/* Back button */}
      <div className="mb-4">
        <TooltipProvider>
          <Tooltip content="Back to providers list">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentRoute('/providers')}
              aria-label="Back to providers list"
            >
              <ArrowLeft className="icon-sm" />
            </Button>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Details Card */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <StatusIndicator status={provider.enabled ? 'running' : 'stopped'} />
              <div>
                <h1 className="card-title">{provider.name}</h1>
                <p className="text-sm text-muted-foreground">{provider.id}</p>
              </div>
            </div>

            <TooltipProvider>
              <div className="flex gap-2">
                <Tooltip content={provider.enabled ? "Disable provider" : "Enable provider"}>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleEnabled}
                    disabled={actionLoading === 'toggle'}
                    aria-label={provider.enabled ? "Disable provider" : "Enable provider"}
                  >
                    {provider.enabled ? (
                      <PowerOff className="icon-sm" />
                    ) : (
                      <Power className="icon-sm" />
                    )}
                  </Button>
                </Tooltip>
                <Tooltip content="Edit provider">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentRoute(`/providers/${provider.id}/edit`)}
                    aria-label="Edit provider"
                  >
                    <Edit className="icon-sm" />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete provider">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDelete}
                    disabled={actionLoading === 'delete'}
                    aria-label="Delete provider"
                  >
                    <Trash2 className="icon-sm" />
                  </Button>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>

        <div className="card-content space-y-6">

        {/* Basic Information */}
        <div className="border rounded-lg p-6 space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Provider Type</p>
              <Badge variant="default">{provider.type}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <p className="font-medium">{provider.priority}</p>
            </div>
          </div>

          {provider.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{provider.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                {provider.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            {provider.runtime_status && (
              <div>
                <p className="text-sm text-muted-foreground">Runtime Status</p>
                <Badge variant={provider.runtime_status === 'loaded' ? 'default' : 'secondary'}>
                  {provider.runtime_status}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Configuration */}
        {provider.config && Object.keys(provider.config).length > 0 && (
          <div className="border rounded-lg p-6 space-y-4 mb-6">
            <h2 className="text-lg font-semibold">Configuration</h2>
            <div className="space-y-3">
              {Object.entries(provider.config).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{key}</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {maskSensitiveValue(key, value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Models */}
        {provider.models && provider.models.length > 0 && (
          <div className="border rounded-lg p-6 space-y-4 mb-6">
            <h2 className="text-lg font-semibold">Linked Models ({provider.models.length})</h2>
            <div className="space-y-2">
              {provider.models.map((model) => (
                <div
                  key={model.model_id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <span className="font-medium">{model.model_id}</span>
                  {model.is_default && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border rounded-lg p-6 space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Actions</h2>
          <TooltipProvider>
            <div className="flex gap-2">
              <Tooltip content={actionLoading === 'test' ? 'Testing connection...' : 'Test connection'}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleTest}
                  disabled={actionLoading === 'test'}
                  aria-label="Test connection"
                >
                  <TestTube className="icon-sm" />
                </Button>
              </Tooltip>
              <Tooltip content={actionLoading === 'reload' ? 'Reloading provider...' : 'Reload provider'}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReload}
                  disabled={actionLoading === 'reload'}
                  aria-label="Reload provider"
                >
                  <RefreshCw className="icon-sm" />
                </Button>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Metadata */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Metadata</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{formatDate(provider.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p>{formatDate(provider.updated_at)}</p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
