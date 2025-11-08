import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, RefreshCw } from 'lucide-react';
import { useCustomChat } from '@/hooks/useCustomChat';
import { ThinkingSection } from './ThinkingSection';
import { ResponseSection } from './ResponseSection';
import type { CustomChatTabProps } from '@/types/components.types';

export function CustomChatTab({ providerRouterUrl, model }: CustomChatTabProps) {
  const {
    prompt,
    setPrompt,
    response,
    loading,
    handleSend,
    handleKeyPress,
    thinking,
    mainResponse,
  } = useCustomChat();

  return (
    <div className="chat-custom-container">
      <p className="chat-custom-description">
        Enter your own prompt and send it to the active provider. The response will appear below.
      </p>

      <div className="chat-custom-form">
        <label className="chat-custom-label">Your Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => handleKeyPress(e, providerRouterUrl, model)}
          placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
          className="chat-custom-textarea"
          disabled={loading}
        />
        <div className="chat-custom-actions">
          <Button
            onClick={() => handleSend(providerRouterUrl, model)}
            disabled={loading || !prompt.trim()}
            size="sm"
            className="chat-custom-send-button"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>

      {(response || loading) && (
        <div className="chat-custom-response-container">
          {thinking && <ThinkingSection thinking={thinking} />}
          <ResponseSection mainResponse={mainResponse} loading={loading} />
        </div>
      )}
    </div>
  );
}
