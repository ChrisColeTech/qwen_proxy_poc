import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from 'lucide-react';
import type { ModelsStepProps } from '@/types/quick-guide.types';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { ModelsSelectTab } from './ModelsSelectTab';
import { ModelsBrowseTab } from './ModelsBrowseTab';

export function ModelsStep({
  models,
  loading,
  onRefresh,
  providerRouterUrl,
  activeModel,
  onSelectModel,
  capabilityFilter,
  providerFilter,
  providers,
  setCapabilityFilter,
  setProviderFilter,
  clearFilters,
  error
}: ModelsStepProps) {
  return (
    <Card className="page-card">
      <CardHeader>
        <CardTitle className="card-title-with-icon">
          <Database className="icon-sm" />
          Models
        </CardTitle>
      </CardHeader>
      <CardContent className="page-card-content">
        <Tabs defaultValue="select" className="tab-container">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select">Select Model</TabsTrigger>
            <TabsTrigger value="browse">Browse Models</TabsTrigger>
            <TabsTrigger value="curl">Try It Yourself</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="tab-content">
            <ModelsSelectTab
              models={models}
              loading={loading}
              onRefresh={onRefresh}
              activeModel={activeModel}
              onSelectModel={onSelectModel}
            />
          </TabsContent>

          <TabsContent value="browse" className="tab-content">
            {setCapabilityFilter && setProviderFilter && clearFilters && (
              <ModelsBrowseTab
                models={models}
                loading={loading}
                onRefresh={onRefresh}
                capabilityFilter={capabilityFilter || 'all'}
                providerFilter={providerFilter || 'all'}
                providers={providers || []}
                onCapabilityChange={setCapabilityFilter}
                onProviderChange={setProviderFilter}
                onClearFilters={clearFilters}
                error={error || null}
              />
            )}
          </TabsContent>

          <TabsContent value="curl" className="tab-content">
            <div className="vspace-md">
              <p className="step-description">
                Check which models are available via the API:
              </p>

              <CodeBlock
                label="Get available models:"
                code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/models \\
  -H "Authorization: Bearer any-key"`}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
