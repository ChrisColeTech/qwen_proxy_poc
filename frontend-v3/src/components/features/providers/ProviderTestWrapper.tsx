import { FlaskConical } from 'lucide-react';
import { ProviderTestContent } from './ProviderTestContent';

interface ProviderTestWrapperProps {
  activeProvider: string;
  providerName: string;
  providerRouterUrl: string;
}

export function ProviderTestWrapper({
  activeProvider,
  providerName,
  providerRouterUrl
}: ProviderTestWrapperProps) {
  if (!activeProvider) {
    return (
      <div className="vspace-md flex flex-col items-center justify-center py-12 gap-4">
        <FlaskConical className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          No provider selected
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Select a provider from the "Switch Provider" tab to test it.
        </p>
      </div>
    );
  }

  return (
    <ProviderTestContent
      key={activeProvider} // Force re-render when provider changes
      providerId={activeProvider}
      providerName={providerName}
      providerRouterUrl={providerRouterUrl}
    />
  );
}
