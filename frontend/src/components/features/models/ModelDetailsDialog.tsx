import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Eye, Wrench, Cpu } from 'lucide-react';
import { modelsService } from '@/services/models.service';
import type { ParsedModel, Capability } from '@/types/models.types';

interface ModelDetailsDialogProps {
  open: boolean;
  model: ParsedModel | null;
  onClose: () => void;
}

const CAPABILITY_ICONS = {
  chat: MessageSquare,
  vision: Eye,
  'tool-call': Wrench,
  code: Cpu,
};

export function ModelDetailsDialog({
  open,
  model,
  onClose,
}: ModelDetailsDialogProps) {
  if (!model) return null;

  const getUniqueCapabilities = (capabilities: Capability[]) => {
    const uniqueDisplays = new Map();

    capabilities.forEach((cap) => {
      const display = modelsService.getCapabilityDisplay(cap);
      if (display && !uniqueDisplays.has(display.label)) {
        uniqueDisplays.set(display.label, display);
      }
    });

    return Array.from(uniqueDisplays.values());
  };

  const capabilities = getUniqueCapabilities(model.capabilities);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="model-details-dialog">
        <DialogHeader>
          <DialogTitle>{model.name}</DialogTitle>
          <DialogDescription>
            <code className="step-inline-code">{model.id}</code>
          </DialogDescription>
        </DialogHeader>

        <div className="model-details-content">
          {model.description && (
            <div className="model-details-section">
              <h4 className="model-details-label">Description</h4>
              <p className="model-details-text">{model.description}</p>
            </div>
          )}

          {capabilities.length > 0 && (
            <div className="model-details-section">
              <h4 className="model-details-label">Capabilities</h4>
              <div className="model-details-capabilities">
                {capabilities.map((display) => {
                  const Icon = CAPABILITY_ICONS[display.label as keyof typeof CAPABILITY_ICONS];
                  return (
                    <Badge key={display.label} variant="outline" className="models-capability-badge">
                      {Icon && <Icon className={`icon-xs ${display.color}`} />}
                      <span className="models-capability-label">{display.label}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {model.provider && model.provider !== 'Unknown' && (
            <div className="model-details-section">
              <h4 className="model-details-label">Provider</h4>
              <Badge variant="secondary">{model.provider}</Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
