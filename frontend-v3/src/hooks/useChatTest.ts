import { useState } from 'react';
import { chatService, type ChatTestResult } from '@/services/chat.service';

export interface ChatTestState {
  testing: boolean;
  result: ChatTestResult | null;
  error: string | null;
}

export function useChatTest() {
  const [state, setState] = useState<ChatTestState>({
    testing: false,
    result: null,
    error: null,
  });

  const testChat = async (model?: string, message?: string) => {
    setState({
      testing: true,
      result: null,
      error: null,
    });

    try {
      const result = await chatService.testChat(model, message);

      setState({
        testing: false,
        result,
        error: result.success ? null : result.error || 'Unknown error',
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        testing: false,
        result: null,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const reset = () => {
    setState({
      testing: false,
      result: null,
      error: null,
    });
  };

  return {
    testing: state.testing,
    result: state.result,
    error: state.error,
    testChat,
    reset,
  };
}
