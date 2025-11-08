import { TabCard } from '@/components/ui/tab-card';
import { useChatPage } from '@/hooks/useChatPage';
import {
  buildChatActions,
  buildActiveChatContent,
  buildHistoryContent,
  buildNewChatContent,
  CHAT_TABS,
  CHAT_TITLE,
  CHAT_ICON
} from '@/constants/chat.constants';

export function ChatPage() {
  const { handleConversationClick } = useChatPage();

  const chatActions = buildChatActions({ handleConversationClick });

  const tabs = [
    {
      ...CHAT_TABS.ACTIVE,
      content: buildActiveChatContent(chatActions)
    },
    {
      ...CHAT_TABS.HISTORY,
      content: buildHistoryContent()
    },
    {
      ...CHAT_TABS.NEW,
      content: buildNewChatContent()
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={CHAT_TITLE}
        icon={CHAT_ICON}
        tabs={tabs}
        defaultTab={CHAT_TABS.ACTIVE.value}
      />
    </div>
  );
}
