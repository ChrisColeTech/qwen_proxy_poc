import { MessageSquare, History, Plus, ChevronRight, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from './home.constants';

export const CHAT_TABS = {
  ACTIVE: {
    value: 'active',
    label: 'Active Chats',
    description: 'Your current chat conversations'
  },
  HISTORY: {
    value: 'history',
    label: 'History',
    description: 'Browse past conversations'
  },
  NEW: {
    value: 'new',
    label: 'New Chat',
    description: 'Start a new conversation'
  }
} as const;

export const CHAT_TITLE = 'Chat';
export const CHAT_ICON = MessageSquare;
export const HISTORY_ICON = History;
export const NEW_CHAT_ICON = Plus;
export const SEND_ICON = Send;

const createChatBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant}>{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

export const buildChatActions = (params: {
  handleConversationClick: (conversationId: string) => void;
}): ActionItem[] => {
  const { handleConversationClick } = params;

  return [
    {
      icon: <StatusIndicator status="running" />,
      title: 'Chat with GPT-4',
      description: 'Discussing project architecture - 15 messages',
      actions: createChatBadge('default', 'Active'),
      onClick: () => handleConversationClick('chat-1')
    },
    {
      icon: <StatusIndicator status="running" />,
      title: 'Code Review Session',
      description: 'React component refactoring - 8 messages',
      actions: createChatBadge('default', 'Active'),
      onClick: () => handleConversationClick('chat-2')
    },
    {
      icon: <StatusIndicator status="stopped" />,
      title: 'API Integration Help',
      description: 'REST API design discussion - 23 messages',
      actions: createChatBadge('secondary', 'Archived'),
      onClick: () => handleConversationClick('chat-3')
    }
  ];
};

export const buildActiveChatContent = (chatActions: ActionItem[]) => (
  <ActionList title="Active Conversations" icon={MessageSquare} items={chatActions} />
);

export const buildHistoryContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <History className="icon-primary" />
          <span className="demo-label-text">Chat History</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <p className="text-muted-foreground text-center py-8">
          No archived conversations. Your past chats will appear here.
        </p>
      </div>
    </div>
  </div>
);

export const buildNewChatContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Plus className="icon-primary" />
          <span className="demo-label-text">New Chat</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            Start a new conversation with any configured AI model.
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Select a model from the dropdown and begin chatting. Your conversation will be saved automatically.
          </p>
        </div>
      </div>
    </div>
  </div>
);
