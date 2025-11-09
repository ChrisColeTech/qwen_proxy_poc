import { FlaskConical } from 'lucide-react';
import { ModelTestContent } from './ModelTestContent';
import type { Provider } from '@/types/providers.types';

interface ModelTestWrapperProps {
  activeModel: string;
  activeProvider: string;
  providers: Provider[];
  providerRouterUrl: string;
}

export function ModelTestWrapper({
  activeModel,
  activeProvider,
  providers,
  providerRouterUrl
}: ModelTestWrapperProps) {
  const provider = providers.find(p => p.id === activeProvider);
  const providerName = provider?.name || 'Unknown Provider';

  if (!activeModel) {
    return (
      <div className="vspace-md flex flex-col items-center justify-center py-12 gap-4">
        <FlaskConical className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          No model selected
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Select a model from the "Select Model" tab to test it.
        </p>
      </div>
    );
  }

  if (!activeProvider) {
    return (
      <div className="vspace-md flex flex-col items-center justify-center py-12 gap-4">
        <FlaskConical className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          No provider selected
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Select a provider from the Providers page to test the model.
        </p>
      </div>
    );
  }

  return (
    <ModelTestContent
      key={`${activeModel}-${activeProvider}`} // Force re-render when model/provider changes
      modelId={activeModel}
      modelName={activeModel}
      providerName={providerName}
      providerRouterUrl={providerRouterUrl}
    />
  );
}
