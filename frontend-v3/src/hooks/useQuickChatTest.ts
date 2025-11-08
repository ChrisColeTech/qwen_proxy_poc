import { useState } from 'react';
import { chatService } from '@/services/chatService';

export function useQuickChatTest() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async (providerRouterUrl: string, model: string) => {
    if (!providerRouterUrl) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await chatService.sendChatRequest(
        providerRouterUrl,
        model,
        'Say hello in one sentence'
      );
      setResponse(result);
    } catch (error) {
      console.error('Failed to test chat:', error);
      setResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoading(false);
    }
  };

  return {
    response,
    loading,
    handleTest,
  };
}
