import { useState } from 'react';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';

export function useApiGuidePage() {
  const proxyStatus = useProxyStore((state) => state.status);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const port = proxyStatus?.providerRouter?.port || 3001;
  const baseUrl = `http://localhost:${port}`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(`${baseUrl}/v1`);
    setCopiedUrl(true);
    useAlertStore.showAlert('Base URL copied to clipboard', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCode = async (code: string, label: string) => {
    await navigator.clipboard.writeText(code);
    useAlertStore.showAlert(`${label} copied to clipboard`, 'success');
  };

  return {
    baseUrl,
    port,
    copiedUrl,
    handleCopyUrl,
    handleCopyCode,
  };
}
