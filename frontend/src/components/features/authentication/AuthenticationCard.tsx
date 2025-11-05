import { Lock, AlertCircle, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useCredentials } from '@/hooks/useCredentials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtensionInstallModal } from './ExtensionInstallModal';

export function AuthenticationCard() {
  const { status, loading, error, isElectron, login } = useCredentials();
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Login failed:', err);
      // Check if error is about missing extension
      if (err instanceof Error && err.message.includes('browser extension')) {
        setShowExtensionModal(true);
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="auth-header">
            <div className="auth-header-left">
              <Lock className="auth-icon" />
              <CardTitle>Qwen Authentication</CardTitle>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="auth-button"
              title={loading ? 'Connecting...' : status.hasCredentials ? 'Re-authenticate' : 'Connect to Qwen'}
            >
              <LogIn className="auth-button-icon" />
            </button>
          </div>
          <CardDescription>
            {isElectron ? 'Login to Qwen to extract credentials' : 'Browser extension required to extract credentials'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="auth-error">
              <AlertCircle className="auth-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {status.hasCredentials && status.expiresAt && (
            <div className="auth-credentials-info">
              <p>Expires: {new Date(status.expiresAt).toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ExtensionInstallModal open={showExtensionModal} onOpenChange={setShowExtensionModal} />
    </>
  );
}
