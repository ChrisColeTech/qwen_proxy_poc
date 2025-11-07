import { useProxyStatus } from '@/hooks/useProxyStatus';
import { AppearanceSettingsCard } from '@/components/features/settings/AppearanceSettingsCard';

export function SettingsPage() {
  useProxyStatus();

  return (
    <div className="page-container">
      <AppearanceSettingsCard />
    </div>
  );
}
