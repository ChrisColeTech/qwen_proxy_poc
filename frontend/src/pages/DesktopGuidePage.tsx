import { useProxyStatus } from '@/hooks/useProxyStatus';
import { DesktopGuideStep } from '@/components/features/quick-guide/DesktopGuideStep';

export function DesktopGuidePage() {
  useProxyStatus();

  return (
    <div className="page-container">
      <DesktopGuideStep />
    </div>
  );
}
