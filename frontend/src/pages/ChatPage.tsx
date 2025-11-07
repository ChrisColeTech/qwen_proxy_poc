import { useState, useEffect } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ChatCompletionStep } from '@/components/features/quick-guide/ChatCompletionStep';

export function ChatPage() {
  useProxyStatus();
  const { providerRouterUrl, fetchSettings } = useSettingsStore();
  const [testResponse, setTestResponse] = useState<string>('');
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleTestChat = async () => {
    if (!providerRouterUrl) return;
    setLoadingTest(true);
    setTestResponse('');
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Say hello in one sentence' }]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setTestResponse(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('Failed to test chat:', error);
      setTestResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="page-container">
      <ChatCompletionStep
        response={testResponse}
        loading={loadingTest}
        onTest={handleTestChat}
        providerRouterUrl={providerRouterUrl}
      />
    </div>
  );
}
