import { MessageSquare } from 'lucide-react';
import { TabCard } from '@/components/ui/tab-card';
import { QuickTestTab } from './QuickTestTab';
import { CustomChatTab } from './CustomChatTab';
import { CurlTab } from './CurlTab';
import type { ChatTestCardProps } from '@/types/components.types';

export function ChatTestCard({ providerRouterUrl, activeModel }: ChatTestCardProps) {
  const modelToUse = activeModel || 'qwen3-max';

  const tabs = [
    {
      value: 'quick',
      label: 'Quick Test',
      description: 'Send a quick test message to verify the connection',
      content: (
        <QuickTestTab
          providerRouterUrl={providerRouterUrl}
          model={modelToUse}
        />
      )
    },
    {
      value: 'custom',
      label: 'Custom Chat',
      description: 'Send custom prompts and see responses with thinking process parsing',
      content: (
        <CustomChatTab
          providerRouterUrl={providerRouterUrl}
          activeModel={modelToUse}
        />
      )
    },
    {
      value: 'curl',
      label: 'Try It Yourself',
      description: 'Test the endpoint directly from your terminal',
      content: (
        <CurlTab
          providerRouterUrl={providerRouterUrl}
          activeModel={modelToUse}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title="Chat Completions"
        icon={MessageSquare}
        tabs={tabs}
        defaultTab="quick"
        pageKey="/chat-test"
      />
    </div>
  );
}
