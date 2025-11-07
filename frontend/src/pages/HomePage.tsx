import { useProxyStatus } from '@/hooks/useProxyStatus';
import { SystemControlCard } from '@/components/features/system/SystemControlCard';
import { ExploreSection } from '@/components/features/quick-guide/ExploreSection';

export function HomePage() {
  useProxyStatus();

  return (
    <div className="page-container">
      <SystemControlCard />
      <ExploreSection />
    </div>
  );
}
