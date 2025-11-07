import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useProxyStore } from '@/stores/useProxyStore';
import { SystemControlCard } from '@/components/features/system/SystemControlCard';
import { ExploreSection } from '@/components/features/quick-guide/ExploreSection';

export function HomePage() {
  useProxyStatus();
  const proxyStatus = useProxyStore((state) => state.status);

  const isServerRunning = proxyStatus?.providerRouter?.running || false;

  return (
    <div className="page-container">
      <SystemControlCard />
      {isServerRunning && <ExploreSection />}
    </div>
  );
}
