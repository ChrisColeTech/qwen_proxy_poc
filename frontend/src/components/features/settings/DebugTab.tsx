import { Bug } from 'lucide-react';

export function DebugTab() {
  return (
    <div className="vspace-md">
      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Bug className="icon-primary" />
            <span className="demo-label-text">Debug Options</span>
          </div>
        </div>
        <div className="provider-switch-list">
          <p className="text-muted-foreground text-center py-8">
            Debug settings coming soon. Enable verbose logging, request/response inspection, and developer tools.
          </p>
        </div>
      </div>
    </div>
  );
}
