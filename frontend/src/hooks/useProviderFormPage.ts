import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { providersService } from '@/services/providers.service';
import type { CreateProviderRequest, UpdateProviderRequest } from '@/types/providers.types';

interface ProviderFormData {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  description: string;
  config: Record<string, any>;
}

export function useProviderFormPage(_readOnly: boolean = false) {
  const currentRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  // Extract ID from current route
  const pathParts = currentRoute.split('/');
  const id = pathParts[2] !== 'new' ? pathParts[2] : undefined;
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProviderFormData>({
    id: '',
    name: '',
    type: '',
    enabled: true,
    priority: 100, // Default priority
    description: '',
    config: {
      timeout: 30000 // Default timeout 30 seconds
    }
  });

  // Load provider data if editing
  useEffect(() => {
    if (isEditMode && id) {
      const loadProvider = async () => {
        try {
          const provider = await providersService.getProviderDetails(id);
          setFormData({
            id: provider.id,
            name: provider.name,
            type: provider.type,
            enabled: provider.enabled,
            priority: provider.priority,
            description: provider.description || '',
            config: provider.config || {}
          });
        } catch (error) {
          console.error('Failed to load provider:', error);
          useAlertStore.showAlert('Failed to load provider', 'error');
          setCurrentRoute('/providers');
        }
      };
      loadProvider();
    }
  }, [isEditMode, id, setCurrentRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode && id) {
        // Update existing provider - preserve all existing data including hidden fields
        const updateData: UpdateProviderRequest = {
          name: formData.name,
          type: formData.type,
          enabled: formData.enabled,
          priority: formData.priority, // Preserve existing priority
          description: formData.description || null
        };
        await providersService.updateProvider(id, updateData);

        // Update config separately - this preserves all existing config values
        if (Object.keys(formData.config).length > 0) {
          await providersService.updateProviderConfig(id, formData.config);
        }

        useAlertStore.showAlert('Provider updated successfully', 'success');
      } else {
        // Create new provider - auto-generate ID from name
        const generatedId = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const createData: CreateProviderRequest = {
          id: generatedId,
          name: formData.name,
          type: formData.type,
          enabled: formData.enabled,
          priority: formData.priority || 100, // Default to 100 if not set
          description: formData.description || null,
          config: {
            ...formData.config,
            timeout: formData.config.timeout || 30000 // Ensure timeout has default
          }
        };
        await providersService.createProvider(createData);
        useAlertStore.showAlert('Provider created successfully', 'success');
      }

      setCurrentRoute('/providers');
    } catch (error: any) {
      console.error('Failed to save provider:', error);
      useAlertStore.showAlert(error.message || 'Failed to save provider', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!id) {
      useAlertStore.showAlert('Save the provider first before testing', 'warning');
      return;
    }

    setTesting(true);
    try {
      await providersService.testConnection(id);
      useAlertStore.showAlert('Connection test successful', 'success');
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Connection test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const handleReset = () => {
    if (isEditMode && id) {
      // Reset to original loaded data - reload the provider
      const reloadProvider = async () => {
        try {
          const provider = await providersService.getProviderDetails(id);
          setFormData({
            id: provider.id,
            name: provider.name,
            type: provider.type,
            enabled: provider.enabled,
            priority: provider.priority,
            description: provider.description || '',
            config: provider.config || {}
          });
        } catch (error) {
          console.error('Failed to reload provider:', error);
        }
      };
      reloadProvider();
    } else {
      // Reset to empty form for new provider
      setFormData({
        id: '',
        name: '',
        type: '',
        enabled: true,
        priority: 100,
        description: '',
        config: {
          timeout: 30000
        }
      });
    }
  };

  const handleToggleEnabled = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await providersService.toggleEnabled({ ...formData, created_at: 0, updated_at: 0 } as any);
      useAlertStore.showAlert(
        `Provider ${formData.enabled ? 'disabled' : 'enabled'} successfully`,
        'success'
      );
      // Reload provider data
      const provider = await providersService.getProviderDetails(id);
      setFormData({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        enabled: provider.enabled,
        priority: provider.priority,
        description: provider.description || '',
        config: provider.config || {}
      });
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Failed to toggle provider', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm(`Are you sure you want to delete provider "${formData.name}"?`)) {
      return;
    }
    setLoading(true);
    try {
      await providersService.deleteProvider(id);
      useAlertStore.showAlert('Provider deleted successfully', 'success');
      setCurrentRoute('/providers');
    } catch (error: any) {
      useAlertStore.showAlert(error.message || 'Failed to delete provider', 'error');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentRoute('/providers');
  };

  const handleEdit = () => {
    if (id) {
      setCurrentRoute(`/providers/${id}/edit`);
    }
  };

  return {
    id,
    isEditMode,
    loading,
    testing,
    formData,
    setFormData,
    handleSubmit,
    handleTest,
    handleConfigChange,
    handleReset,
    handleToggleEnabled,
    handleDelete,
    handleBack,
    handleEdit
  };
}
