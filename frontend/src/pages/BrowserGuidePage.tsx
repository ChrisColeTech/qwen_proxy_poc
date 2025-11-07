import { useProxyStatus } from '@/hooks/useProxyStatus';
import { BrowserGuideStep } from '@/components/features/quick-guide/BrowserGuideStep';
import type { GuidePageProps } from '@/types/quick-guide.types';

export function BrowserGuidePage({}: GuidePageProps) {
  useProxyStatus();

  return (
    <div className="page-container">
      <BrowserGuideStep />
    </div>
  );
}
