import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/useUIStore';
import { providersService } from '@/services/providers.service';
import { useToast } from '@/hooks/use-toast';

export function ProviderCreatePage() {
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const { toast } = useToast();

  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    description: '',
    baseURL: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCancel = () => {
    setCurrentRoute('/providers');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Provider ID is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = 'Provider ID must be lowercase letters, numbers, and hyphens only';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Provider name is required';
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Provider type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);

      const config: Record<string, any> = {};
      if (formData.baseURL.trim()) {
        config.baseURL = formData.baseURL.trim();
      }

      const provider = await providersService.createProvider({
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type.trim(),
        description: formData.description.trim() || undefined,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      toast({
        title: 'Success',
        description: 'Provider created successfully',
      });

      setCurrentRoute(`/providers/${provider.id}/edit`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create provider',
        variant: 'destructive',
      });
      console.error('Failed to create provider:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container">
      <Card className="page-card">
        <CardHeader>
          <CardTitle>Create New Provider</CardTitle>
          <CardDescription>Enter provider details. You can configure additional settings after creation.</CardDescription>
        </CardHeader>
        <CardContent className="page-card-content vspace-md">
          <div className="providers-dialog-field">
            <Label htmlFor="provider-id">
              Provider ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provider-id"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="my-provider"
              className="font-mono text-sm"
            />
            {errors.id && <p className="providers-dialog-error">{errors.id}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Unique identifier (lowercase letters, numbers, hyphens)
            </p>
          </div>

          <div className="providers-dialog-field">
            <Label htmlFor="provider-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provider-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Provider"
            />
            {errors.name && <p className="providers-dialog-error">{errors.name}</p>}
          </div>

          <div className="providers-dialog-field">
            <Label htmlFor="provider-type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provider-type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="lm-studio, qwen-proxy, qwen-direct, etc."
              className="font-mono text-sm"
            />
            {errors.type && <p className="providers-dialog-error">{errors.type}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Provider type identifier (e.g., lm-studio, qwen-proxy, qwen-direct)
            </p>
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
            <Label htmlFor="provider-baseurl">Base URL</Label>
            <Input
              id="provider-baseurl"
              value={formData.baseURL}
              onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
              placeholder="http://localhost:1234"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional base URL - you can add more configuration after creation
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <Button onClick={handleCancel} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleCreate} size="sm" disabled={creating}>
              <Plus className="h-4 w-4 mr-2" />
              {creating ? 'Creating...' : 'Create Provider'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
