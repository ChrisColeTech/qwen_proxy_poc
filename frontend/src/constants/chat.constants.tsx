import { MessageSquare } from 'lucide-react';
import { CustomChatTab } from '@/components/features/chat/CustomChatTab';
import { CurlTab } from '@/components/features/chat/CurlTab';

export const CHAT_TABS = {
  CUSTOM: {
    value: 'chat',
    label: 'Custom Chat',
    description: 'Send custom prompts to the active model and see responses with thinking process parsing'
  },
  CURL: {
    value: 'curl',
    label: 'cURL Example',
    description: 'Test the chat completion endpoint directly from your terminal'
  }
} as const;

export const CHAT_TITLE = 'Chat Completions';
export const CHAT_ICON = MessageSquare;

export const buildCustomChatContent = (params: {
  providerRouterUrl: string;
  activeModel: string;
}) => {
  const { providerRouterUrl, activeModel } = params;

  return (
    <CustomChatTab
      providerRouterUrl={providerRouterUrl}
      activeModel={activeModel}
    />
  );
};

export const buildCurlExamplesContent = (params: {
  providerRouterUrl: string;
  activeModel: string;
}) => {
  const { providerRouterUrl, activeModel } = params;

  return (
    <CurlTab
      providerRouterUrl={providerRouterUrl}
      activeModel={activeModel}
    />
  );
};
