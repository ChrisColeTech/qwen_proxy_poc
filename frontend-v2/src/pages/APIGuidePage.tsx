import { useProxyStore } from '@/stores/useProxyStore';
import { CodeExamplesCard } from '@/components/features/api-guide/CodeExamplesCard';

export function APIGuidePage() {
  const proxyStatus = useProxyStore((state) => state.status);

  const port = proxyStatus?.providerRouter?.port || 3001;
  const baseUrl = `http://localhost:${port}`;

  return (
    <div className="page-container">
      <CodeExamplesCard baseUrl={baseUrl} />
    </div>
  );
}
