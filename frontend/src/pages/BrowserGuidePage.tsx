import { useProxyStatus } from '@/hooks/useProxyStatus';
import { BrowserGuideStep } from '@/components/features/quick-guide/BrowserGuideStep';

export function BrowserGuidePage() {
  useProxyStatus();

  return (
    <div className="page-container">
      <BrowserGuideStep />
    </div>
  );
}
