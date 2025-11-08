import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TabCard } from '@/components/ui/tab-card';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { useUIStore } from '@/stores/useUIStore';
import { modelsService } from '@/services/models.service';
import type { ModelDetails } from '@/types/models.types';

export function ModelFormPage() {
  const currentRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);

  // Extract ID from current route
  const pathParts = currentRoute.split('/');
  const id = decodeURIComponent(pathParts[2]);

  const [model, setModel] = useState<ModelDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const data = await modelsService.getModelDetails(id);
        setModel(data);
      } catch (error) {
        console.error('Failed to load model:', error);
        setCurrentRoute('/models');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadModel();
    }
  }, [id, setCurrentRoute]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseCapabilities = (capabilitiesStr: string) => {
    try {
      return JSON.parse(capabilitiesStr);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading model...</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return null;
  }

  const capabilities = parseCapabilities(model.capabilities);

  const formContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="vspace-md p-4"
    >
      {/* Model ID */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">Model ID</div>
          <div className="text-setting-description">Unique identifier for this model</div>
        </div>
        <Input
          value={model.id}
          disabled
          className="flex-1 max-w-md"
          aria-label="Model ID"
        />
      </div>

      <div className="divider-horizontal" />

      {/* Model Name */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">Model Name</div>
          <div className="text-setting-description">Display name for this model</div>
        </div>
        <Input
          value={model.name}
          disabled
          className="flex-1 max-w-md"
          aria-label="Model Name"
        />
      </div>

      <div className="divider-horizontal" />

      {/* Description */}
      {model.description && (
        <>
          <div className="flex-row-between">
            <div className="vspace-tight">
              <div className="text-setting-label">Description</div>
              <div className="text-setting-description">Model description and details</div>
            </div>
            <Input
              value={model.description}
              disabled
              className="flex-1 max-w-md"
              aria-label="Description"
            />
          </div>
          <div className="divider-horizontal" />
        </>
      )}

      {/* Capabilities */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">Capabilities</div>
          <div className="text-setting-description">Model capabilities and features</div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end flex-1 max-w-md">
          {capabilities.length > 0 ? (
            capabilities.map((cap: string) => {
              const display = modelsService.getCapabilityDisplay(cap as any);
              return display ? (
                <Badge key={cap} variant="default" className="min-w-[80px] justify-center">
                  {display.label}
                </Badge>
              ) : null;
            })
          ) : (
            <span className="text-sm text-muted-foreground">No capabilities specified</span>
          )}
        </div>
      </div>

      <div className="divider-horizontal" />

      {/* Status */}
      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">Status</div>
          <div className="text-setting-description">Current model status</div>
        </div>
        <Badge variant={model.status === 'active' ? 'default' : 'secondary'} className="min-w-[100px] justify-center">
          {model.status}
        </Badge>
      </div>

      {/* Linked Providers */}
      {model.providers && model.providers.length > 0 && (
        <>
          <div className="divider-horizontal" />
          <div className="vspace-tight mb-4">
            <div className="text-lg font-semibold">Linked Providers ({model.providers.length})</div>
          </div>
          <div className="space-y-2">
            {model.providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex-1">
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-muted-foreground">{provider.type}</div>
                </div>
                <div className="flex gap-2 items-center">
                  {provider.is_default && (
                    <Badge variant="default">Default</Badge>
                  )}
                  <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                    {provider.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Metadata */}
      <div className="divider-horizontal" />
      <div className="vspace-tight mb-4">
        <div className="text-lg font-semibold">Metadata</div>
      </div>

      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">Created</div>
          <div className="text-setting-description">Model creation timestamp</div>
        </div>
        <Input
          value={formatDate(model.created_at)}
          disabled
          className="flex-1 max-w-md"
          aria-label="Created date"
        />
      </div>

      <div className="divider-horizontal" />

      <div className="flex-row-between">
        <div className="vspace-tight">
          <div className="text-setting-label">Last Updated</div>
          <div className="text-setting-description">Last modification timestamp</div>
        </div>
        <Input
          value={formatDate(model.updated_at)}
          disabled
          className="flex-1 max-w-md"
          aria-label="Updated date"
        />
      </div>
    </motion.div>
  );

  const actions = (
    <div className="flex gap-2">
      <TooltipProvider>
        <Tooltip content="Back to models list">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentRoute('/models')}
            aria-label="Back to models list"
          >
            <ArrowLeft className="icon-sm" />
          </Button>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  const tabs = [
    {
      value: 'details',
      label: 'Model Details',
      content: formContent,
      contentCardTitle: 'Model Details',
      contentCardIcon: Database,
      contentCardActions: actions
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title="Model Information"
        icon={Database}
        tabs={tabs}
        defaultTab="details"
        pageKey={`/models/${id}`}
      />
    </div>
  );
}
