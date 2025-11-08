import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare } from 'lucide-react';
import { QuickTestTab } from './QuickTestTab';
import { CustomChatTab } from './CustomChatTab';
import { CurlTab } from './CurlTab';
import type { ChatTestCardProps } from '@/types/components.types';

export function ChatTestCard({ providerRouterUrl, activeModel }: ChatTestCardProps) {
  const modelToUse = activeModel || 'qwen3-max';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="chat-test-card-title">
          <MessageSquare className="h-4 w-4" />
          Chat Completions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Test</TabsTrigger>
            <TabsTrigger value="custom">Custom Chat</TabsTrigger>
            <TabsTrigger value="curl">Try It Yourself</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="mt-4">
            <QuickTestTab
              providerRouterUrl={providerRouterUrl}
              model={modelToUse}
            />
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <CustomChatTab
              providerRouterUrl={providerRouterUrl}
              model={modelToUse}
            />
          </TabsContent>

          <TabsContent value="curl" className="mt-4">
            <CurlTab
              providerRouterUrl={providerRouterUrl}
              model={modelToUse}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
