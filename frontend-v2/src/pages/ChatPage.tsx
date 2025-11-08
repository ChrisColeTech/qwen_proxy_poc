import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ChatTestCard } from '@/components/features/chat/ChatTestCard';

export function ChatPage() {
  const { settings, providerRouterUrl, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <div className="page-container">
      <ChatTestCard
        providerRouterUrl={providerRouterUrl || ''}
        activeModel={settings.active_model}
      />
    </div>
  );
}
