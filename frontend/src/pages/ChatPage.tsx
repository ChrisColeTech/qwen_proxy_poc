import { TabCard } from '@/components/ui/tab-card';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  buildCustomChatContent,
  buildCurlExamplesContent,
  CHAT_TABS,
  CHAT_TITLE,
  CHAT_ICON
} from '@/constants/chat.constants';

export function ChatPage() {
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeModel = (settings.active_model as string) || 'qwen3-max';

  const tabs = [
    {
      ...CHAT_TABS.CUSTOM,
      content: buildCustomChatContent({
        providerRouterUrl: providerRouterUrl || 'http://localhost:3001',
        activeModel
      })
    },
    {
      ...CHAT_TABS.CURL,
      content: buildCurlExamplesContent({
        providerRouterUrl: providerRouterUrl || 'http://localhost:3001',
        activeModel
      })
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={CHAT_TITLE}
        icon={CHAT_ICON}
        tabs={tabs}
        defaultTab={CHAT_TABS.CUSTOM.value}
        pageKey="/chat"
      />
    </div>
  );
}
