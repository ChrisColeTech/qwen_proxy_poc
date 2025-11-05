import { Chrome, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExtensionInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtensionInstallModal({ open, onOpenChange }: ExtensionInstallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="modal-header-icon">
            <Chrome className="modal-icon" />
            <DialogTitle className="modal-title">Browser Extension Required</DialogTitle>
          </div>
          <DialogDescription>
            To use Qwen Proxy in your browser, you need to install the Chrome extension
          </DialogDescription>
        </DialogHeader>

        <div className="modal-content">
          <div className="modal-step">
            <div className="modal-step-number">
              1
            </div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">Open Chrome Extensions</h3>
              <p className="modal-step-description">
                Navigate to <code className="extension-code-inline">chrome://extensions/</code> in your Chrome browser
              </p>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">
              2
            </div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">Enable Developer Mode</h3>
              <p className="modal-step-description">
                Toggle the <strong>Developer mode</strong> switch in the top-right corner of the extensions page
              </p>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">
              3
            </div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">Load Unpacked Extension</h3>
              <p className="modal-step-description">
                Click <strong>Load unpacked</strong> and select the extension folder from your project directory
              </p>
              <code className="extension-code-block">
                /path/to/qwen_proxy_poc/extension
              </code>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">
              4
            </div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">You're Ready!</h3>
              <p className="modal-step-description">
                The extension icon should appear in your Chrome toolbar. Click "Connect to Qwen" again to continue.
              </p>
            </div>
          </div>

          <div className="extension-tip">
            <div className="extension-tip-content">
              <Download className="extension-tip-icon" />
              <div>
                <h4 className="extension-tip-title">Quick Tip</h4>
                <p className="extension-tip-text">
                  After installing the extension, it will automatically extract your credentials when you log in to Qwen.
                  The dashboard will update within 5 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
