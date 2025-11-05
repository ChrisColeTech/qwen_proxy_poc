import { Database, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProvidersInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providers: {
    items: any[];
    total: number;
    enabled: number;
  };
}

export function ProvidersInfoModal({ open, onOpenChange, providers }: ProvidersInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="modal-header-icon">
            <Database className="modal-icon" />
            <DialogTitle className="modal-title">Providers</DialogTitle>
          </div>
          <DialogDescription>
            LLM provider services configured in the system
          </DialogDescription>
        </DialogHeader>

        <div className="modal-content">
          <div className="extension-tip">
            <div className="extension-tip-content">
              <Database className="extension-tip-icon text-blue-500" />
              <div>
                <h4 className="extension-tip-title">
                  Status: {providers.enabled} of {providers.total} Enabled
                </h4>
                <p className="extension-tip-text">
                  {providers.enabled === 0
                    ? 'No providers enabled. Enable at least one to route requests.'
                    : `${providers.enabled} provider${providers.enabled > 1 ? 's' : ''} available for routing.`}
                </p>
              </div>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">1</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">What Are Providers?</h3>
              <p className="text-sm text-muted-foreground">
                Providers are LLM API services (like Qwen, OpenAI, Anthropic, etc.) that the proxy can route requests to.
                Each provider has a priority level - the router tries higher priority providers first and falls back to lower
                priority ones if a provider is unavailable or rate-limited.
              </p>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">2</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">Configured Providers</h3>
              <div className="space-y-2">
                {providers.items.length > 0 ? (
                  providers.items.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        {provider.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">{provider.type}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">Priority: {provider.priority}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No providers configured yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
