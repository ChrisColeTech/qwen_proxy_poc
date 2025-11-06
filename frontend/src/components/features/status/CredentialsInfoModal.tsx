import { Lock, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CredentialsInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isValid: boolean;
  expiresAt?: number;
}

export function CredentialsInfoModal({ open, onOpenChange, isValid, expiresAt }: CredentialsInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="modal-header-icon">
            <Lock className="modal-icon" />
            <DialogTitle className="modal-title">Qwen Credentials</DialogTitle>
          </div>
          <DialogDescription>
            Authentication tokens for Qwen API access
          </DialogDescription>
        </DialogHeader>

        <div className="modal-content">
          <div className="extension-tip">
            <div className="extension-tip-content">
              {isValid ? (
                <CheckCircle2 className="extension-tip-icon text-green-500" />
              ) : (
                <XCircle className="extension-tip-icon text-red-500" />
              )}
              <div>
                <h4 className="extension-tip-title">Status: {isValid ? 'Valid' : 'Missing'}</h4>
                <p className="extension-tip-text">
                  {isValid
                    ? expiresAt ? `Expires: ${new Date(expiresAt).toLocaleString()}` : 'Credentials available'
                    : 'Click the login button to authenticate.'}
                </p>
              </div>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">1</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">What Are These?</h3>
              <p className="text-sm text-muted-foreground">
                Qwen credentials are authentication tokens (bearer token and cookies) extracted from your chat.qwen.ai login session.
                These allow the proxy to make requests to Qwen's API on your behalf.
              </p>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">2</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">How to Get Them</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Option 1:</strong> Click the "Login to Qwen" button above to authenticate in your browser</p>
                <p><strong>Option 2:</strong> Install the Chrome extension to automatically extract credentials when you log in to chat.qwen.ai</p>
              </div>
            </div>
          </div>

          <div className="modal-step">
            <div className="modal-step-number">3</div>
            <div className="modal-step-content">
              <h3 className="modal-step-title">Security</h3>
              <p className="text-sm text-muted-foreground">
                Credentials are stored locally in an encrypted SQLite database and are never sent to any third-party servers.
                They're only used to authenticate with Qwen's official API.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
