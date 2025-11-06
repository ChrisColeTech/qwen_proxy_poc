import { Server, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApiServerInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isConnected: boolean;
  port?: number;
}

export function ApiServerInfoModal({ open, onOpenChange, isConnected, port }: ApiServerInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="modal-header-icon">
            <Server className="modal-icon" />
            <DialogTitle className="modal-title">API Server</DialogTitle>
          </div>
          <DialogDescription>
            Backend process manager and REST API (Port {port || 3002})
          </DialogDescription>
        </DialogHeader>

        <div className="modal-content">
          <div className="extension-tip">
            <div className="extension-tip-content">
              {isConnected ? (
                <CheckCircle2 className="extension-tip-icon text-green-500" />
              ) : (
                <XCircle className="extension-tip-icon text-red-500" />
              )}
              <div>
                <h4 className="extension-tip-title">Status: {isConnected ? 'Connected' : 'Offline'}</h4>
                <p className="extension-tip-text">
                  {isConnected ? 'Backend is running normally' : 'Cannot connect to backend server. Restart the app.'}
                </p>
              </div>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">1</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">What Is This?</h3>
              <p className="text-sm text-muted-foreground">
                The API Server is the backend Node.js process that manages the proxy servers, stores configuration in SQLite,
                and provides a REST API for this dashboard to interact with.
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="modal-step">
              <div className="modal-step-number">2</div>
              <div className="modal-step-content">
                <h3 className="modal-step-title">Available Endpoints</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><code className="text-xs">/api/proxy/status</code> - Proxy server status and dashboard data</li>
                  <li><code className="text-xs">/api/proxy/start</code> - Start proxy servers</li>
                  <li><code className="text-xs">/api/proxy/stop</code> - Stop proxy servers</li>
                  <li><code className="text-xs">/api/providers</code> - Manage LLM providers</li>
                  <li><code className="text-xs">/api/models</code> - List available models</li>
                  <li><code className="text-xs">/api/qwen/credentials</code> - Manage Qwen credentials</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
