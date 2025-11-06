import { useProxyStatus } from '@/hooks/useProxyStatus';
import { StatusAlert } from '@/components/features/alerts/StatusAlert';
import { SystemControlCard } from '@/components/features/system/SystemControlCard';
import { ProvidersListCard } from '@/components/features/providers/ProvidersListCard';
import { ModelsListCard } from '@/components/features/models/ModelsListCard';

export function HomePage() {
  useProxyStatus();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <StatusAlert />

      <div className="space-y-6">
        <SystemControlCard />

        <div className="grid md:grid-cols-2 gap-6">
          <ProvidersListCard />
          <ModelsListCard />
        </div>
      </div>
    </div>
  );
}
