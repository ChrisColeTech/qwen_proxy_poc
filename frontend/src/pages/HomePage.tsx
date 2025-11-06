import { useCredentialPolling } from '@/hooks/useCredentialPolling';
import { StatusAlert } from '@/components/features/alerts/StatusAlert';
import { SystemControlCard } from '@/components/features/system/SystemControlCard';
import { ConnectionGuideCard } from '@/components/features/stats/ConnectionGuideCard';
import { ProvidersListCard } from '@/components/features/providers/ProvidersListCard';
import { ModelsListCard } from '@/components/features/models/ModelsListCard';

export function HomePage() {
  useCredentialPolling();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <StatusAlert />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SystemControlCard />

          <div className="grid md:grid-cols-2 gap-6">
            <ProvidersListCard />
            <ModelsListCard />
          </div>
        </div>

        <div className="space-y-6">
          <ConnectionGuideCard />
        </div>
      </div>
    </div>
  );
}
