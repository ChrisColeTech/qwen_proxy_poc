import { Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModelsInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: {
    items: any[];
    total: number;
  };
}

export function ModelsInfoModal({ open, onOpenChange, models }: ModelsInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="modal-header-icon">
            <Layers className="modal-icon" />
            <DialogTitle className="modal-title">Models</DialogTitle>
          </div>
          <DialogDescription>
            Available LLM models across all providers
          </DialogDescription>
        </DialogHeader>

        <div className="modal-content">
          <div className="extension-tip">
            <div className="extension-tip-content">
              <Layers className="extension-tip-icon text-purple-500" />
              <div>
                <h4 className="extension-tip-title">Status: {models.total} Models Available</h4>
                <p className="extension-tip-text">
                  Models synced from enabled providers.
                </p>
              </div>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">1</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">How It Works</h3>
              <p className="text-sm text-muted-foreground">
                Models are automatically discovered from your enabled providers. When the proxy starts, it queries each provider's
                <code className="text-xs mx-1">/v1/models</code> endpoint and caches the results. The Provider Router uses these models
                for request routing with automatic fallback support.
              </p>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">2</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">Available Models</h3>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {models.items.length > 0 ? (
                  models.items.map((model) => (
                    <div key={model.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.id}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No models available. Enable providers and start the proxy to sync models.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
