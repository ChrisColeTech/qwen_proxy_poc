import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';

export function useChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState<string>('');

  const handleConversationClick = (conversationId: string) => {
    console.log('Conversation clicked:', conversationId);
    setSelectedConversation(conversationId);
    useAlertStore.showAlert(`Opened conversation: ${conversationId}`, 'success');
  };

  const handleNewChat = () => {
    console.log('Creating new chat');
    useAlertStore.showAlert('New chat created', 'success');
  };

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    setMessageText('');
    useAlertStore.showAlert('Message sent', 'success');
  };

  // Example: Fetch chat history would go here
  useEffect(() => {
    // TODO: Fetch conversations from API
  }, []);

  return {
    selectedConversation,
    messageText,
    handleConversationClick,
    handleNewChat,
    handleSendMessage,
    setMessageText,
  };
}
