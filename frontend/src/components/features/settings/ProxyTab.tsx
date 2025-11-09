import { Network } from 'lucide-react';

export function ProxyTab() {
  return (
    <div className="vspace-md">
      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Network className="icon-primary" />
            <span className="demo-label-text">Proxy Configuration</span>
          </div>
        </div>
        <div className="provider-switch-list">
          <p className="text-muted-foreground text-center py-8">
            Proxy settings coming soon. Configure default port, timeout settings, and connection options.
          </p>
        </div>
      </div>
    </div>
  );
}
