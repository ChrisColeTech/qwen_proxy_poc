import { useState } from 'react';
import { chatService } from '@/services/chatService';

export function useCustomChat() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (providerRouterUrl: string, model: string) => {
    if (!prompt.trim() || !providerRouterUrl) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await chatService.sendChatRequest(providerRouterUrl, model, prompt);
      setResponse(result);
    } catch (error) {
      console.error('Failed to send chat:', error);
      setResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>, providerRouterUrl: string, model: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(providerRouterUrl, model);
    }
  };

  const parsedResponse = chatService.parseResponse(response);

  return {
    prompt,
    setPrompt,
    response,
    loading,
    handleSend,
    handleKeyPress,
    thinking: parsedResponse.thinking,
    mainResponse: parsedResponse.mainResponse,
  };
}
