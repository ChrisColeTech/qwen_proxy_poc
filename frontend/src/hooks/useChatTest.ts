import { useState } from 'react';
import { chatService } from '@/services/chatService';

export function useChatTest() {
  const [testResponse, setTestResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testChat = async (providerRouterUrl: string, model?: string) => {
    if (!providerRouterUrl) return;

    setLoading(true);
    setTestResponse('');

    const response = await chatService.testChat(providerRouterUrl, model);
    setTestResponse(response);
    setLoading(false);
  };

  return {
    testResponse,
    loading,
    testChat,
  };
}
