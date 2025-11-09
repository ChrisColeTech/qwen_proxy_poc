import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import type { ModelDetails, Capability } from '@/types/models.types';

interface ModelDetailsDialogProps {
  model: ModelDetails | null;
  open: boolean;
  onClose: () => void;
}

export function ModelDetailsDialog({ model, open, onClose }: ModelDetailsDialogProps) {
  if (!model) return null;

  // Parse capabilities
  let capabilities: Capability[] = [];
  try {
    capabilities = JSON.parse(model.capabilities);
  } catch {
    capabilities = [];
  }

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get capability display
  const getCapabilityBadge = (cap: Capability) => {
    const variants: Record<string, string> = {
      'chat': 'default',
      'completion': 'default',
      'vision': 'secondary',
      'tool-call': 'secondary',
      'tools': 'secondary',
      'code': 'secondary'
    };
    return <Badge key={cap} variant={variants[cap] as any}>{cap}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Model Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusIndicator status={model.status === 'active' ? 'running' : 'stopped'} />
              <div>
                <h3 className="text-lg font-semibold">{model.name}</h3>
                <p className="text-sm text-muted-foreground">{model.id}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {model.description && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{model.description}</p>
            </div>
          )}

          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {capabilities.map(cap => getCapabilityBadge(cap))}
              </div>
            </div>
          )}

          {/* Providers */}
          {model.providers && model.providers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Available Providers ({model.providers.length})
              </h4>
              <div className="space-y-2">
                {model.providers.map(provider => (
                  <div
                    key={provider.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={provider.enabled ? 'running' : 'stopped'} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{provider.name}</span>
                            {provider.is_default && (
                              <Badge variant="default" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">{provider.type}</Badge>
                            <span>Priority: {provider.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {provider.description && (
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Metadata</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">{formatDate(model.created_at)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Updated:</span>
                <span className="ml-2">{formatDate(model.updated_at)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="default" className="ml-2">{model.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
