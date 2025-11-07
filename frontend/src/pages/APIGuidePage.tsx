import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useProxyStore } from '@/stores/useProxyStore';
import { CodeExamplesCard } from '@/components/features/api-guide/CodeExamplesCard';
import { SupportedEndpointsCard } from '@/components/features/api-guide/SupportedEndpointsCard';
import type { GuidePageProps } from '@/types/quick-guide.types';

export function APIGuidePage({}: GuidePageProps) {
  useProxyStatus();
  const proxyStatus = useProxyStore((state) => state.status);

  const port = proxyStatus?.providerRouter?.port || 3001;
  const baseUrl = `http://localhost:${port}`;

  return (
    <div className="page-container">
      <CodeExamplesCard baseUrl={baseUrl} />
      <SupportedEndpointsCard />
    </div>
  );
}
