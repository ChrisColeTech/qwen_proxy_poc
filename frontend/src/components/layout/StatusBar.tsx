import { useEffect, useState } from 'react';
import { Circle, CheckCircle2, XCircle, AlertCircle, Database, Layers } from 'lucide-react';
import { useCredentials } from '@/hooks/useCredentials';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { ApiServerInfoModal } from '@/components/features/status/ApiServerInfoModal';
import { CredentialsInfoModal } from '@/components/features/status/CredentialsInfoModal';
import { ProxyInfoModal } from '@/components/features/status/ProxyInfoModal';
import { ProvidersInfoModal } from '@/components/features/status/ProvidersInfoModal';
import { ModelsInfoModal } from '@/components/features/status/ModelsInfoModal';
import { API_BASE_URL, API_SERVER_PORT } from '@/config/api.config';

export function StatusBar() {
  const { status: credStatus } = useCredentials();
  const { status: proxyStatus } = useProxyStatus();
  const [apiConnected, setApiConnected] = useState(true);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [providersModalOpen, setProvidersModalOpen] = useState(false);
  const [modelsModalOpen, setModelsModalOpen] = useState(false);

  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        setApiConnected(response.ok);
      } catch {
        setApiConnected(false);
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const getProxyStatusIcon = () => {
    if (proxyStatus.isRunning) {
      return <Circle className="statusbar-icon-running" />;
    }
    return <Circle className="statusbar-icon-stopped" />;
  };

  const getCredentialsIcon = () => {
    if (credStatus.isValid) {
      return <CheckCircle2 className="statusbar-icon-success" />;
    }
    return <XCircle className="statusbar-icon-stopped" />;
  };

  const getApiIcon = () => {
    if (apiConnected) {
      return <CheckCircle2 className="statusbar-icon-success" />;
    }
    return <AlertCircle className="statusbar-icon-error" />;
  };

  return (
    <div className="statusbar">
      {/* Left: API Server Status */}
      <div className="statusbar-left">
        <button
          className="statusbar-indicator"
          title={apiConnected ? 'API Server connected' : 'API Server disconnected'}
          onClick={() => setApiModalOpen(true)}
        >
          {getApiIcon()}
          <span className="statusbar-text">{apiConnected ? 'API Server' : 'API Offline'}</span>
        </button>
      </div>

      {/* Right: Status Indicators */}
      <div className="statusbar-right">
        <button
          className="statusbar-indicator"
          title="Providers"
          onClick={() => setProvidersModalOpen(true)}
        >
          <Database className="statusbar-icon-success" />
          <span className="statusbar-text">
            {proxyStatus.providers ? `${proxyStatus.providers.enabled}/${proxyStatus.providers.total} Providers` : 'Providers'}
          </span>
        </button>

        <button
          className="statusbar-indicator"
          title="Models"
          onClick={() => setModelsModalOpen(true)}
        >
          <Layers className="statusbar-icon-success" />
          <span className="statusbar-text">
            {proxyStatus.models ? `${proxyStatus.models.total} Models` : 'Models'}
          </span>
        </button>

        <button
          className="statusbar-indicator"
          title={credStatus.isValid ? 'Credentials valid' : 'No credentials'}
          onClick={() => setCredModalOpen(true)}
        >
          {getCredentialsIcon()}
          <span className="statusbar-text">
            {credStatus.isValid ? 'Authenticated' : 'Not Authenticated'}
          </span>
        </button>

        <button
          className="statusbar-indicator"
          title={proxyStatus.isRunning ? `Proxy running on port ${proxyStatus.port}` : 'Proxy stopped'}
          onClick={() => setProxyModalOpen(true)}
        >
          {getProxyStatusIcon()}
          <span className="statusbar-text">
            {proxyStatus.isRunning ? `Port ${proxyStatus.port}` : 'Proxy Stopped'}
          </span>
        </button>
      </div>

      <ApiServerInfoModal
        open={apiModalOpen}
        onOpenChange={setApiModalOpen}
        isConnected={apiConnected}
        port={API_SERVER_PORT}
      />
      <CredentialsInfoModal
        open={credModalOpen}
        onOpenChange={setCredModalOpen}
        isValid={credStatus.isValid}
        expiresAt={credStatus.expiresAt}
      />
      <ProxyInfoModal
        open={proxyModalOpen}
        onOpenChange={setProxyModalOpen}
        isRunning={proxyStatus.isRunning}
        port={proxyStatus.port}
        uptime={proxyStatus.startedAt ? Math.floor((Date.now() - proxyStatus.startedAt) / 1000) : 0}
      />
      <ProvidersInfoModal
        open={providersModalOpen}
        onOpenChange={setProvidersModalOpen}
        providers={proxyStatus.providers || { items: [], total: 0, enabled: 0 }}
      />
      <ModelsInfoModal
        open={modelsModalOpen}
        onOpenChange={setModelsModalOpen}
        models={proxyStatus.models || { items: [], total: 0 }}
      />
    </div>
  );
}
