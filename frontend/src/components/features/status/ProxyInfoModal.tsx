import { Server, CheckCircle2, XCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProxyInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRunning: boolean;
  port?: number;
  uptime?: number;
}

export function ProxyInfoModal({ open, onOpenChange, isRunning, port, uptime }: ProxyInfoModalProps) {
  const formatUptime = () => {
    if (!uptime) return 'N/A';
    const seconds = uptime;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="modal-header-icon">
            <Server className="modal-icon" />
            <DialogTitle className="modal-title">Proxy Server Status</DialogTitle>
          </div>
          <DialogDescription>
            Qwen Proxy and Provider Router services
          </DialogDescription>
        </DialogHeader>

        <div className="modal-content">
          <div className="extension-tip">
            <div className="extension-tip-content">
              {isRunning ? (
                <CheckCircle2 className="extension-tip-icon text-green-500" />
              ) : (
                <XCircle className="extension-tip-icon text-red-500" />
              )}
              <div>
                <h4 className="extension-tip-title">
                  Status: {isRunning ? 'Running' : 'Stopped'}
                </h4>
                <p className="extension-tip-text">
                  {isRunning
                    ? `Active on port ${port}. Uptime: ${formatUptime()}`
                    : 'Click Start to launch the proxy server.'}
                </p>
              </div>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">1</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">What It Does</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The proxy server provides an OpenAI-compatible API that routes requests to multiple LLM providers.
                It includes the Qwen Proxy (converts Qwen API to OpenAI format) and the Provider Router (manages multiple providers with fallback support).
              </p>
            </div>
          </div>

          {isRunning && (
            <>
              <div className="modal-step">
                <div className="modal-step-number">2</div>
                <div className="modal-step-content">
                  <h3 className="modal-step-title">Base URL</h3>
                  <code className="extension-code-block block text-xs mb-2">
                    http://localhost:{port}
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Use this URL in your OpenAI-compatible client (like Continue, Cursor, or any app that supports OpenAI API).
                  </p>
                </div>
              </div>

              <div className="modal-step">
                <div className="modal-step-number">3</div>
                <div className="modal-step-content">
                  <h3 className="modal-step-title">Available Endpoints</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><code className="text-xs">/v1/chat/completions</code> - Chat completions (streaming supported)</li>
                    <li><code className="text-xs">/v1/models</code> - List available models</li>
                    <li><code className="text-xs">/health</code> - Health check</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
