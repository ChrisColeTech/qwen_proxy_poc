import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/useUIStore';
import { apiService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import type { Provider } from '@/types/providers.types';

interface ProviderEditPageProps {
  providerId: string;
}

export function ProviderEditPage({ providerId }: ProviderEditPageProps) {
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const { toast } = useToast();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [configData, setConfigData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchProvider();
  }, [providerId]);

  const fetchProvider = async () => {
    try {
      setLoading(true);

      // Fetch provider data
      const providerData = await apiService.getProvider(providerId);
      setProvider(providerData);
      setFormData({
        name: providerData.name,
        description: providerData.description || '',
      });

      // Try to fetch config, but don't fail if endpoint doesn't exist
      try {
        const configResponse = await apiService.getProviderConfig(providerId, false);
        setConfigData(configResponse.config || {});
      } catch (configError) {
        console.warn('Config endpoint not available, skipping config load');
        setConfigData({});
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load provider',
        variant: 'destructive',
      });
      console.error('Failed to fetch provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentRoute('/providers');
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update basic info
      await apiService.updateProvider(providerId, {
        name: formData.name,
        description: formData.description,
      });

      // Update config
      await apiService.updateProviderConfig(providerId, configData);

      toast({
        title: 'Success',
        description: 'Provider updated successfully',
      });

      setCurrentRoute('/providers');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update provider',
        variant: 'destructive',
      });
      console.error('Failed to update provider:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="page-container">
        <p>Provider not found</p>
        <Button onClick={() => setCurrentRoute('/providers')} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Providers
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={handleCancel} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} size="sm" disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="vspace-md">
        {/* Basic Info Form */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update provider name and description</CardDescription>
          </CardHeader>
          <CardContent className="vspace-md">
            <div className="providers-dialog-field">
              <Label htmlFor="provider-id">Provider ID</Label>
              <Input
                id="provider-id"
                value={provider.id}
                disabled
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Provider ID cannot be changed</p>
            </div>

            <div className="providers-dialog-field">
              <Label htmlFor="provider-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="provider-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Provider name"
              />
            </div>

            <div className="providers-dialog-field">
              <Label htmlFor="provider-description">Description</Label>
              <Textarea
                id="provider-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="providers-dialog-field">
              <Label htmlFor="provider-type">Type</Label>
              <Input
                id="provider-type"
                value={provider.type}
                disabled
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Provider type cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Update provider configuration settings</CardDescription>
          </CardHeader>
          <CardContent className="vspace-md">
            {Object.keys(configData).length > 0 ? (
              Object.entries(configData).map(([key, value]) => (
                <div key={key} className="providers-dialog-field">
                  <Label htmlFor={`config-${key}`}>{key}</Label>
                  <Input
                    id={`config-${key}`}
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value ?? ''}
                    onChange={(e) => {
                      const newValue = typeof value === 'number' ? Number(e.target.value) : e.target.value;
                      setConfigData({ ...configData, [key]: newValue });
                    }}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No configuration settings</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
