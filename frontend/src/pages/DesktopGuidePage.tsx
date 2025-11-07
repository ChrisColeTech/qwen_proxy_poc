import { useProxyStatus } from '@/hooks/useProxyStatus';
import { DesktopGuideStep } from '@/components/features/quick-guide/DesktopGuideStep';
import type { GuidePageProps } from '@/types/quick-guide.types';

export function DesktopGuidePage({}: GuidePageProps) {
  useProxyStatus();

  return (
    <div className="page-container">
      <DesktopGuideStep />
    </div>
  );
}
