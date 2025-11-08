import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network } from 'lucide-react';
import type { ProviderSwitchStepProps } from '@/types/quick-guide.types';
import type { Provider } from '@/types/providers.types';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { ProvidersTable } from '@/components/features/providers/ProvidersTable';
import { ProviderSwitchTab } from './ProviderSwitchTab';

export function ProviderSwitchStep({
  providers,
  activeProvider,
  loading,
  onSwitch,
  apiBaseUrl,
  actionLoading,
  onToggleEnabled,
  onTest,
  onDelete,
  onCreate,
  onRowClick
}: ProviderSwitchStepProps) {
  // Create wrapper functions that convert string IDs to Provider objects for ProvidersTable
  const handleToggleEnabled = (provider: Provider) => {
    if (onToggleEnabled) {
      onToggleEnabled(provider.id);
    }
  };

  const handleTest = (provider: Provider) => {
    if (onTest) {
      onTest(provider.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="card-title-with-icon-sm">
          <Network className="icon-sm" />
          Providers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="switch" className="tab-container">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="switch">Switch Provider</TabsTrigger>
            <TabsTrigger value="all-providers">All Providers</TabsTrigger>
            <TabsTrigger value="curl">Try It Yourself</TabsTrigger>
          </TabsList>

          <TabsContent value="switch" className="tab-content">
            <ProviderSwitchTab
              providers={providers}
              activeProvider={activeProvider}
              loading={loading}
              onSwitch={onSwitch}
            />
          </TabsContent>

          <TabsContent value="all-providers" className="tab-content">
            {onToggleEnabled && onTest && onDelete && (
              <ProvidersTable
                providers={providers}
                actionLoading={actionLoading || null}
                onToggleEnabled={handleToggleEnabled}
                onTest={handleTest}
                onDelete={onDelete}
                onCreate={onCreate}
                onRowClick={onRowClick}
              />
            )}
          </TabsContent>

          <TabsContent value="curl" className="tab-content">
            <div className="vspace-md">
              <p className="step-description">
                Switch providers programmatically via the API:
              </p>

              <CodeBlock
                label="Switch to a specific provider:"
                code={`curl -X PUT ${apiBaseUrl || 'http://localhost:3002'}/api/settings/active_provider \\
  -H "Content-Type: application/json" \\
  -d '{"value": "qwen-proxy-default"}'`}
              />

              <CodeBlock
                label="Get current active provider:"
                code={`curl ${apiBaseUrl || 'http://localhost:3002'}/api/settings/active_provider`}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
