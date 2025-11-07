import { useProxyStatus } from '@/hooks/useProxyStatus';
import { StatusAlert } from '@/components/features/alerts/StatusAlert';
import { SystemControlCard } from '@/components/features/system/SystemControlCard';
import { ExploreSection } from '@/components/features/quick-guide/ExploreSection';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  useProxyStatus();

  return (
    <div className="page-container">
      <StatusAlert />
      <SystemControlCard />
      <ExploreSection onNavigate={onNavigate} />
    </div>
  );
}
