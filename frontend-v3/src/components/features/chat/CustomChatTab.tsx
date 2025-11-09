import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, RefreshCw, Brain, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { chatService } from '@/services/chatService';

interface CustomChatTabProps {
  providerRouterUrl: string;
  activeModel: string;
}

export function CustomChatTab({ providerRouterUrl, activeModel }: CustomChatTabProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim() || !providerRouterUrl) return;

    setLoading(true);
    setResponse('');

    try {
      const result = await chatService.sendChatRequest(providerRouterUrl, activeModel, prompt);
      setResponse(result);
    } catch (error) {
      console.error('Failed to send chat:', error);
      setResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const parsedResponse = chatService.parseResponse(response);

  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <MessageSquare className="icon-primary" />
          <span className="demo-label-text">Custom Chat</span>
        </div>
      </div>

      <div className="vspace-md" style={{ flexShrink: 0 }}>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your own prompt and send it to the active provider. The response will appear below with thinking process parsing.
        </p>

        {/* Input Form */}
        <div className="vspace-md">
          <div className="flex-row-between mb-2">
            <label className="text-setting-label">Your Prompt</label>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[120px] mb-4"
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              variant="default"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Response Section */}
      {(response || loading) && (
        <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div className="vspace-md space-y-4">
            <div className="divider-horizontal" />

            {/* Thinking Process (if present) */}
            {parsedResponse.thinking && (
              <div className="demo-container">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="demo-header w-full cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="demo-label">
                    <Brain className="icon-primary" />
                    <span className="demo-label-text">Thinking Process</span>
                  </div>
                  {showThinking ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showThinking && (
                  <div className="p-4 rounded-lg bg-muted/50 border mt-2">
                    <pre className="text-sm whitespace-pre-wrap break-words font-mono text-muted-foreground">
                      {parsedResponse.thinking}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Main Response */}
            <div className="demo-container">
              <div className="demo-header">
                <div className="demo-label">
                  <MessageSquare className="icon-primary" />
                  <span className="demo-label-text">Response</span>
                </div>
                {loading && (
                  <Badge variant="secondary" className="min-w-[100px] justify-center">
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    Waiting...
                  </Badge>
                )}
              </div>
              {parsedResponse.mainResponse && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                    {parsedResponse.mainResponse}
                  </pre>
                </div>
              )}
              {loading && !parsedResponse.mainResponse && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Sending request...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
