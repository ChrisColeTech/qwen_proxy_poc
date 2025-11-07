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
};
