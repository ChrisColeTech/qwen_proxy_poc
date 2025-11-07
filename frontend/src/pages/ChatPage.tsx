import { useEffect } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useChatTest } from '@/hooks/useChatTest';
import { ChatCompletionStep } from '@/components/features/quick-guide/ChatCompletionStep';
import { CustomChat } from '@/components/features/chat/CustomChat';

export function ChatPage() {
  useProxyStatus();
  const { settings, providerRouterUrl, fetchSettings } = useSettingsStore();
  const { testResponse, loading, testChat } = useChatTest();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleTest = () => {
    if (providerRouterUrl) {
      testChat(providerRouterUrl, settings.active_model);
    }
  };

  return (
    <div className="page-container">
      <CustomChat
        providerRouterUrl={providerRouterUrl || ''}
        activeModel={settings.active_model}
      />
      <ChatCompletionStep
        response={testResponse}
        loading={loading}
        onTest={handleTest}
        providerRouterUrl={providerRouterUrl}
        activeModel={settings.active_model}
      />
    </div>
  );
}
