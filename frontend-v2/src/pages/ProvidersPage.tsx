import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProviders } from '@/hooks/useProviders';
import { useUIStore } from '@/stores/useUIStore';
import { API_BASE_URL } from '@/lib/constants';
import { ProviderSwitchStep } from '@/components/features/quick-guide/ProviderSwitchStep';
import { DeleteProviderDialog } from '@/components/features/providers/DeleteProviderDialog';
import type { Provider } from '@/types/providers.types';

export function ProvidersPage() {
  const { fetchSettings, settings } = useSettingsStore();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const {
    providers,
    loading,
    actionLoading,
    toggleEnabled,
    testConnection,
    deleteProvider,
    switchProvider: baseSwitchProvider,
  } = useProviders();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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

  const handleToggleEnabled = (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      toggleEnabled(provider);
    }
  };

  const handleTestConnection = (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (provider) {
      testConnection(provider);
    }
  };

  const handleCreateClick = () => {
    setCurrentRoute('/providers/new');
  };

  const handleRowClick = (providerId: string) => {
    setCurrentRoute(`/providers/${providerId}/edit`);
  };

  const switchProvider = async (providerId: string) => {
    await baseSwitchProvider(providerId);
    // Refetch settings to update the activeProvider in UI
    await fetchSettings();
  };

  const activeProvider = settings.active_provider || '';

  return (
    <div className="page-container">
      <ProviderSwitchStep
        providers={providers}
        activeProvider={activeProvider}
        loading={loading}
        onSwitch={switchProvider}
        apiBaseUrl={API_BASE_URL}
        actionLoading={actionLoading}
        onToggleEnabled={handleToggleEnabled}
        onTest={handleTestConnection}
        onDelete={handleDeleteClick}
        onCreate={handleCreateClick}
        onRowClick={handleRowClick}
      />

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
