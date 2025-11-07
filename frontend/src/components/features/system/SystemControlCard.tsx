import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCredentialActions } from '@/hooks/useCredentialActions';
import { useProxyControl } from '@/hooks/useProxyControl';
import { useLiveUptime } from '@/hooks/useLiveUptime';
import { useProviderRouterLifecycle } from '@/hooks/useProviderRouterLifecycle';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { Activity } from 'lucide-react';
import { CredentialsSection } from '@/components/features/system/CredentialsSection';
import { ProxyServerSection } from '@/components/features/system/ProxyServerSection';
import { EndpointUrlSection } from '@/components/features/system/EndpointUrlSection';

export function SystemControlCard() {
  const { handleConnect, loading: authLoading } = useCredentialActions();
  const { handleStart, handleStop, loading: proxyLoading } = useProxyControl();
  const { state: lifecycleState, error: lifecycleError } = useProviderRouterLifecycle();
  const proxyStatus = useProxyStore((state) => state.status);
  const { showAlert } = useAlertStore;

  const credentials = proxyStatus?.credentials;
  const isProxyRunning = proxyStatus?.providerRouter?.running || false;
  const port = proxyStatus?.providerRouter?.port;
  const initialUptime = proxyStatus?.providerRouter?.uptime;
  const uptime = useLiveUptime(initialUptime);
  const endpointUrl = port ? `http://localhost:${port}` : '';

  const handleCopy = async () => {
    if (endpointUrl) {
      await navigator.clipboard.writeText(endpointUrl);
      showAlert('Endpoint URL copied to clipboard', 'success');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          System Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CredentialsSection
          credentials={credentials}
          onConnect={handleConnect}
          loading={authLoading}
        />

        <div className="h-px bg-border" />

        <ProxyServerSection
          isRunning={isProxyRunning}
          uptime={uptime}
          lifecycleState={lifecycleState}
          lifecycleError={lifecycleError}
          onStart={handleStart}
          onStop={handleStop}
          loading={proxyLoading}
        />

        {isProxyRunning && endpointUrl && (
          <EndpointUrlSection endpointUrl={endpointUrl} onCopy={handleCopy} />
        )}
      </CardContent>
    </Card>
  );
}
