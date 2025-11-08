import { BookOpen } from 'lucide-react';

interface QuickGuideSuccessProps {
  providerRouterUrl: string;
}

export function QuickGuideSuccess({ providerRouterUrl }: QuickGuideSuccessProps) {
  return (
    <div className="quick-guide-success">
      <div className="quick-guide-success-content">
        <BookOpen className="quick-guide-success-icon" />
        <div>
          <p className="quick-guide-success-title">Success!</p>
          <p className="quick-guide-success-message">
            Your Qwen Proxy is configured correctly and ready to use. Point your application to{' '}
            <code className="step-inline-code">{providerRouterUrl}</code> to start making requests.
          </p>
        </div>
      </div>
    </div>
  );
}
