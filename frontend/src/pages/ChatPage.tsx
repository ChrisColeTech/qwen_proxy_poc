import { useEffect } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useChatTest } from '@/hooks/useChatTest';
import { ChatCompletionStep } from '@/components/features/quick-guide/ChatCompletionStep';

export function ChatPage() {
  useProxyStatus();
  const { providerRouterUrl, fetchSettings } = useSettingsStore();
  const { testResponse, loading, testChat } = useChatTest();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleTest = () => {
    if (providerRouterUrl) {
      testChat(providerRouterUrl);
    }
  };

  return (
    <div className="page-container">
      <ChatCompletionStep
        response={testResponse}
        loading={loading}
        onTest={handleTest}
        providerRouterUrl={providerRouterUrl}
      />
    </div>
  );
}
