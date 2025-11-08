import { useState, useEffect } from 'react';
import { ArrowLeft, Save, TestTube, Settings, RotateCcw, Trash2, Power, PowerOff, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TabCard } from '@/components/ui/tab-card';
import { useAlertStore } from '@/stores/useAlertStore';
import { useUIStore } from '@/stores/useUIStore';
import { providersService } from '@/services/providers.service';
import type { CreateProviderRequest, UpdateProviderRequest } from '@/types/providers.types';

interface ProviderFormPageProps {
  readOnly?: boolean;
}

export function ProviderFormPage({ readOnly = false }: ProviderFormPageProps = {}) {
  const currentRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  // Extract ID from current route
  const pathParts = currentRoute.split('/');
  const id = pathParts[2] !== 'new' ? pathParts[2] : undefined;
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    enabled: true,
    priority: 0,
    description: '',
    config: {} as Record<string, any>
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
        // Update existing provider
        const updateData: UpdateProviderRequest = {
          name: formData.name,
          type: formData.type,
          enabled: formData.enabled,
          priority: formData.priority,
          description: formData.description || null
        };
        await providersService.updateProvider(id, updateData);

        // Update config separately
        if (Object.keys(formData.config).length > 0) {
          await providersService.updateProviderConfig(id, formData.config);
        }

        useAlertStore.showAlert('Provider updated successfully', 'success');
      } else {
        // Create new provider
        const createData: CreateProviderRequest = {
          id: formData.id,
          name: formData.name,
          type: formData.type,
          enabled: formData.enabled,
          priority: formData.priority,
          description: formData.description || null,
          config: formData.config
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
    setFormData({
      id: '',
      name: '',
      type: '',
      enabled: true,
      priority: 0,
      description: '',
      config: {}
    });
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

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className="vspace-md p-4">
        {/* Provider ID */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">
              Provider ID <span className="text-destructive">*</span>
            </div>
            <div className="text-setting-description">
              Lowercase letters, numbers, and hyphens only
            </div>
          </div>
          <Input
            id="id"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="lm-studio-home"
            disabled={isEditMode || readOnly}
            required
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Display Name */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">
              Display Name <span className="text-destructive">*</span>
            </div>
            <div className="text-setting-description">
              Human-readable name for this provider
            </div>
          </div>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="LM Studio Home"
            disabled={readOnly}
            required
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Provider Type */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">
              Provider Type <span className="text-destructive">*</span>
            </div>
            <div className="text-setting-description">
              Type identifier (e.g., lm-studio, qwen-proxy, custom-type)
            </div>
          </div>
          <Input
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="lm-studio"
            disabled={isEditMode || readOnly}
            required
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Description */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">Description</div>
            <div className="text-setting-description">
              Optional description for this provider
            </div>
          </div>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            disabled={readOnly}
            className="flex-1 max-w-md"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Priority */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">Priority</div>
            <div className="text-setting-description">
              Higher values = higher priority for routing
            </div>
          </div>
          <Input
            id="priority"
            type="number"
            min="0"
            step="1"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            disabled={readOnly}
            className="w-32"
          />
        </div>

        <div className="divider-horizontal" />

        {/* Enabled */}
        <div className="flex-row-between">
          <div className="vspace-tight">
            <div className="text-setting-label">Enabled</div>
            <div className="text-setting-description">
              Whether this provider is active
            </div>
          </div>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            disabled={readOnly}
          />
        </div>

        {/* Configuration */}
        <>
          <div className="divider-horizontal" />
          <div className="text-lg font-semibold mb-4">Configuration</div>

          {/* baseURL */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">baseURL</div>
              <div className="text-setting-description">Base URL for the provider API endpoint</div>
            </div>
            <Input
              id="config-baseURL"
              type="text"
              value={formData.config.baseURL || ''}
              onChange={(e) => handleConfigChange('baseURL', e.target.value)}
              placeholder="http://localhost:1234"
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* timeout */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">timeout</div>
              <div className="text-setting-description">Request timeout in milliseconds</div>
            </div>
            <Input
              id="config-timeout"
              type="number"
              min="0"
              step="1000"
              value={formData.config.timeout || ''}
              onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value) || 0)}
              placeholder="30000"
              disabled={readOnly}
              className="w-32"
            />
          </div>

          <div className="divider-horizontal" />

          {/* defaultModel */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">defaultModel</div>
              <div className="text-setting-description">Default model to use if none specified</div>
            </div>
            <Input
              id="config-defaultModel"
              type="text"
              value={formData.config.defaultModel || ''}
              onChange={(e) => handleConfigChange('defaultModel', e.target.value)}
              placeholder="qwen-max"
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* token */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">token</div>
              <div className="text-setting-description">Authentication token for API access</div>
            </div>
            <Input
              id="config-token"
              type="password"
              value={formData.config.token || ''}
              onChange={(e) => handleConfigChange('token', e.target.value)}
              placeholder="your-api-token"
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* cookies */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">cookies</div>
              <div className="text-setting-description">Session cookies for authentication</div>
            </div>
            <Input
              id="config-cookies"
              value={formData.config.cookies || ''}
              onChange={(e) => handleConfigChange('cookies', e.target.value)}
              placeholder="cookie1=value1; cookie2=value2"
              disabled={readOnly}
              className="flex-1 max-w-md"
            />
          </div>

          <div className="divider-horizontal" />

          {/* expiresAt */}
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">expiresAt</div>
              <div className="text-setting-description">Token expiration timestamp (Unix milliseconds)</div>
            </div>
            <Input
              id="config-expiresAt"
              type="number"
              min="0"
              step="1"
              value={formData.config.expiresAt || ''}
              onChange={(e) => handleConfigChange('expiresAt', parseInt(e.target.value) || 0)}
              placeholder="1704067200000"
              disabled={readOnly}
              className="w-32"
            />
          </div>
        </>
      </div>
    </form>
  );

  const actions = readOnly ? (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setCurrentRoute('/providers')}
      >
        <ArrowLeft className="icon-sm mr-2" />
        Back
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleToggleEnabled}
        disabled={loading}
      >
        {formData.enabled ? (
          <><PowerOff className="icon-sm mr-2" />Disable</>
        ) : (
          <><Power className="icon-sm mr-2" />Enable</>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setCurrentRoute(`/providers/${id}/edit`)}
      >
        <Edit className="icon-sm mr-2" />
        Edit
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
      >
        <Trash2 className="icon-sm mr-2" />
        Delete
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setCurrentRoute('/providers')}
      >
        <ArrowLeft className="icon-sm mr-2" />
        Cancel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleReset}
      >
        <RotateCcw className="icon-sm mr-2" />
        Reset
      </Button>
      {isEditMode && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleTest}
          disabled={testing}
        >
          <TestTube className="icon-sm mr-2" />
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
      )}
      <Button
        type="submit"
        size="sm"
        disabled={loading}
        onClick={handleSubmit}
      >
        <Save className="icon-sm mr-2" />
        {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Provider')}
      </Button>
    </div>
  );

  const tabs = [
    {
      value: 'form',
      label: 'Configuration',
      content: formContent,
      contentCardTitle: 'Configuration',
      contentCardIcon: Settings,
      contentCardActions: actions
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={isEditMode ? 'Edit Provider' : 'Create Provider'}
        icon={Settings}
        tabs={tabs}
        defaultTab="form"
      />
    </div>
  );
}
