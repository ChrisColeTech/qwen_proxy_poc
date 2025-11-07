import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Blocks, RefreshCw, AlertCircle } from 'lucide-react';
import { useProviders } from '@/hooks/useProviders';
import { ProvidersSummary } from '@/components/features/providers/ProvidersSummary';
import { ProvidersTable } from '@/components/features/providers/ProvidersTable';
import { DeleteProviderDialog } from '@/components/features/providers/DeleteProviderDialog';
import type { Provider } from '@/types/providers.types';

export function ProvidersPage() {
  const {
    providers,
    loading,
    error,
    actionLoading,
    toggleEnabled,
    testConnection,
    deleteProvider,
    refresh,
  } = useProviders();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);

  const handleDeleteClick = (provider: Provider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!providerToDelete) return;
    await deleteProvider(providerToDelete.id);
    setDeleteDialogOpen(false);
    setProviderToDelete(null);
  };

  if (loading && providers.length === 0) {
    return (
      <div className="providers-container">
        <Card>
          <CardContent className="providers-loading">
            <RefreshCw className="icon-sm providers-loading-spinner" />
            <span>Loading providers...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="providers-container">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="icon-sm" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="providers-header">
        <div>
          <h1 className="providers-title">
            <Blocks className="icon-lg" />
            Providers
          </h1>
          <p className="providers-description">Manage API providers and their status</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw
            className={`icon-sm providers-refresh-icon ${loading ? 'providers-refresh-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <ProvidersSummary providers={providers} />

      <Card>
        <CardHeader>
          <CardTitle>All Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <ProvidersTable
            providers={providers}
            actionLoading={actionLoading}
            onToggleEnabled={toggleEnabled}
            onTest={testConnection}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      <DeleteProviderDialog
        open={deleteDialogOpen}
        provider={providerToDelete}
        loading={actionLoading !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
