import { useState, useEffect } from 'react';
import { providersService } from '@/services/providers.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';

interface CreateProviderDialogProps {
  open: boolean;
  loading: boolean;
  onConfirm: (data: {
    id: string;
    name: string;
    type: string;
    description?: string;
    config?: Record<string, unknown>;
  }) => void;
  onCancel: () => void;
}

export function CreateProviderDialog({
  open,
  loading,
  onConfirm,
  onCancel,
}: CreateProviderDialogProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    description: '',
    baseURL: '',
  });

  const [errors, setErrors] = useState({
    id: '',
    name: '',
    type: '',
    baseURL: '',
  });

  const [providerTypes, setProviderTypes] = useState<Array<{ value: string; label: string; requiredConfig: string[]; configSchema: Record<string, any> }>>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await providersService.getProviderTypes();
        setProviderTypes(types);
      } catch (error) {
        console.error('Failed to fetch provider types:', error);
      }
    };
    if (open) {
      fetchTypes();
    }
  }, [open]);

  const validateForm = () => {
    const newErrors = {
      id: '',
      name: '',
      type: '',
      baseURL: '',
    };

    if (!formData.id.trim()) {
      newErrors.id = 'Provider ID is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = 'Provider ID must be lowercase letters, numbers, and hyphens only';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Provider name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Provider type is required';
    }

    // Validate baseURL dynamically based on provider type metadata
    const selectedType = providerTypes.find(t => t.value === formData.type);
    if (selectedType?.requiredConfig?.includes('baseURL')) {
      if (!formData.baseURL.trim()) {
        newErrors.baseURL = 'Base URL is required for this provider type';
      } else if (!/^https?:\/\/.+/.test(formData.baseURL)) {
        newErrors.baseURL = 'Base URL must be a valid HTTP/HTTPS URL';
      }
    }

    setErrors(newErrors);
    return !newErrors.id && !newErrors.name && !newErrors.type && !newErrors.baseURL;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const data: any = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
      };

      // Add config dynamically based on provider type
      const selectedType = providerTypes.find(t => t.value === formData.type);
      if (selectedType?.requiredConfig?.includes('baseURL') && formData.baseURL.trim()) {
        data.config = { baseURL: formData.baseURL.trim() };
      }

      onConfirm(data);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      setFormData({ id: '', name: '', type: '', description: '', baseURL: '' });
      setErrors({ id: '', name: '', type: '', baseURL: '' });
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Provider</DialogTitle>
          <DialogDescription>
            Add a new provider to the system. All providers are enabled by default.
          </DialogDescription>
        </DialogHeader>
        <div className="providers-dialog-form">
          <div className="providers-dialog-field">
            <Label htmlFor="provider-id">
              Provider ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provider-id"
              placeholder="my-provider"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              disabled={loading}
            />
            {errors.id && <p className="providers-dialog-error">{errors.id}</p>}
          </div>

          <div className="providers-dialog-field">
            <Label htmlFor="provider-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provider-name"
              placeholder="My Provider"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={loading}
            />
            {errors.name && <p className="providers-dialog-error">{errors.name}</p>}
          </div>

          <div className="providers-dialog-field">
            <Label htmlFor="provider-type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              disabled={loading}
            >
              <SelectTrigger id="provider-type">
                <SelectValue placeholder="Select provider type" />
              </SelectTrigger>
              <SelectContent>
                {providerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="providers-dialog-error">{errors.type}</p>}
          </div>

          <div className="providers-dialog-field">
            <Label htmlFor="provider-description">Description</Label>
            <Input
              id="provider-description"
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />
          </div>

          {formData.type && providerTypes.find(t => t.value === formData.type)?.requiredConfig?.includes('baseURL') && (
            <div className="providers-dialog-field">
              <Label htmlFor="provider-baseurl">
                Base URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="provider-baseurl"
                placeholder="http://localhost:1234"
                value={formData.baseURL}
                onChange={(e) => setFormData({ ...formData, baseURL: e.target.value })}
                disabled={loading}
              />
              {errors.baseURL && <p className="providers-dialog-error">{errors.baseURL}</p>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="icon-sm providers-dialog-spinner" />
                Creating...
              </>
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
