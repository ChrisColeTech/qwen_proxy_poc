import { useProxyStore } from '@/stores/useProxyStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export function StatusBar() {
  const proxyStatus = useProxyStore((state) => state.status);
  const lifecycleMessage = useLifecycleStore((state) => state.message);
  const lifecycleError = useLifecycleStore((state) => state.error);
  const settings = useSettingsStore((state) => state.settings);

  const credentialStatus = proxyStatus?.credentials?.valid
    ? 'authenticated'
    : proxyStatus?.credentials
    ? 'invalid'
    : 'none';

  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const activeProvider = settings.active_provider as string || '';
  const activeModel = settings.active_model as string || '';

  const displayMessage = lifecycleError || lifecycleMessage;
  const isError = !!lifecycleError;

  return (
    <div className="statusbar">
      <div className="statusbar-left">
        <EnvironmentBadge />
        <div className="statusbar-separator" />
        <StatusBadge status={credentialStatus} />
        {activeProvider && (
          <>
            <div className="statusbar-separator" />
            <Badge variant="secondary" className="flex-shrink-0 min-w-0" style={{
              height: 'clamp(0.875rem, 2vw, 1rem)',
              paddingLeft: 'clamp(0.25rem, 0.5vw, 0.375rem)',
              paddingRight: 'clamp(0.25rem, 0.5vw, 0.375rem)',
              fontSize: 'inherit'
            }}>
              <span className="whitespace-nowrap">{activeProvider}</span>
            </Badge>
          </>
        )}
        {activeModel && (
          <>
            <div className="statusbar-separator" />
            <Badge variant="secondary" className="flex-shrink-0 min-w-0" style={{
              height: 'clamp(0.875rem, 2vw, 1rem)',
              paddingLeft: 'clamp(0.25rem, 0.5vw, 0.375rem)',
              paddingRight: 'clamp(0.25rem, 0.5vw, 0.375rem)',
              fontSize: 'inherit'
            }}>
              <span className="whitespace-nowrap">{activeModel}</span>
            </Badge>
          </>
        )}
      </div>
      {displayMessage && (
        <StatusBadge status={isError ? 'invalid' : isProxyRunning ? 'running' : 'stopped'}>
          {displayMessage}
        </StatusBadge>
      )}
    </div>
  );
}
