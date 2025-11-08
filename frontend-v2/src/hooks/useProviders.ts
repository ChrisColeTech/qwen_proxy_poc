import { useState, useEffect } from 'react';
import { providersService } from '@/services/providers.service';
import { websocketService } from '@/services/websocket.service';
import type { Provider } from '@/types/providers.types';

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      setError(null);
      const data = await providersService.getProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    websocketService.connect('http://localhost:3002', {
      onProvidersUpdated: () => fetchProviders(),
    });
  }, []);

  const toggleEnabled = async (provider: Provider) => {
    const action = provider.enabled ? 'disable' : 'enable';
    setProviders((prev) =>
      prev.map((p) => (p.id === provider.id ? { ...p, enabled: !p.enabled } : p))
    );
    setActionLoading(`${action}-${provider.id}`);

    try {
      await providersService.toggleEnabled(provider);
      await fetchProviders();
    } catch (err) {
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, enabled: provider.enabled } : p))
      );
      setError(err instanceof Error ? err.message : `Failed to ${action} provider`);
    } finally {
      setActionLoading(null);
    }
  };

  const testConnection = async (provider: Provider) => {
    setActionLoading(`test-${provider.id}`);
    setError(null);

    try {
      await providersService.testConnection(provider.id);
    } catch (err) {
      setError(
        err instanceof Error ? `${provider.name}: ${err.message}` : 'Connection test failed'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const deleteProvider = async (providerId: string) => {
    setActionLoading(`delete-${providerId}`);

    try {
      await providersService.deleteProvider(providerId);
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    } finally {
      setActionLoading(null);
    }
  };

  const switchProvider = async (providerId: string) => {
    try {
      await providersService.switchProvider(providerId);
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch provider');
      throw err;
    }
  };

  const createProvider = async (data: {
    id: string;
    name: string;
    type: string;
    description?: string;
    config?: Record<string, unknown>;
  }) => {
    setActionLoading(`create-${data.id}`);
    setError(null);

    try {
      await providersService.createProvider(data);
      await fetchProviders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
      throw err;
    } finally {
      setActionLoading(null);
    }
  };

  const refresh = () => {
    setLoading(true);
    fetchProviders();
  };

  return {
    providers,
    loading,
    error,
    actionLoading,
    toggleEnabled,
    testConnection,
    deleteProvider,
    switchProvider,
    createProvider,
    refresh,
  };
}
