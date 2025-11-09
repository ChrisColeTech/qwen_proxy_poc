import type { ParsedChatResponse } from '@/types/chat.types';

export const chatService = {
  testChat: async (providerRouterUrl: string, model?: string): Promise<string> => {
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model: model || 'qwen3-max',
          messages: [{ role: 'user', content: 'Say hello in one sentence' }]
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      return 'Error: No response from server';
    } catch (error) {
      console.error('Failed to test chat:', error);
      return 'Error: Could not connect to Provider Router';
    }
  },

  sendChatRequest: async (
    providerRouterUrl: string,
    model: string,
    prompt: string
  ): Promise<string> => {
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      return 'Error: No response from server';
    } catch (error) {
      console.error('Failed to send chat:', error);
      return 'Error: Could not connect to Provider Router';
    }
  },

  parseResponse: (text: string): ParsedChatResponse => {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);

    if (thinkMatch) {
      const thinking = thinkMatch[1].trim();
      const mainResponse = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      return { thinking, mainResponse };
    }

    return { thinking: null, mainResponse: text };
  },
};
