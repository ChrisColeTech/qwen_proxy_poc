import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from 'lucide-react';
import { BrowseModelsTab } from './BrowseModelsTab';
import { ModelsCurlTab } from './ModelsCurlTab';
import type { ModelsCardProps } from '@/types/components.types';

export function ModelsCard({
  models,
  loading,
  onRefresh,
  providerRouterUrl,
  activeModel,
  onSelectModel
}: ModelsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="models-card-title">
          <Database className="h-4 w-4" />
          Available Models
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Models</TabsTrigger>
            <TabsTrigger value="curl">Try It Yourself</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            <BrowseModelsTab
              models={models}
              loading={loading}
              onRefresh={onRefresh}
              activeModel={activeModel}
              onSelectModel={onSelectModel}
            />
          </TabsContent>

          <TabsContent value="curl" className="mt-4">
            <ModelsCurlTab providerRouterUrl={providerRouterUrl} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
