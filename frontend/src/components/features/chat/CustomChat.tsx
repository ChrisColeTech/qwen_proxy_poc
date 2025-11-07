import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, RefreshCw, MessageSquare, Database, ChevronDown, ChevronRight, Brain } from 'lucide-react';

interface CustomChatProps {
  providerRouterUrl: string;
  activeModel?: string;
}

export function CustomChat({ providerRouterUrl, activeModel }: CustomChatProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim() || !providerRouterUrl) return;

    setLoading(true);
    setResponse('');
    setShowThinking(false);

    try {
      const res = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model: activeModel || 'qwen3-max',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await res.json();

      if (data.choices && data.choices[0]) {
        setResponse(data.choices[0].message.content);
      } else {
        setResponse('Error: No response from server');
      }
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

  const parseResponse = (text: string) => {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);

    if (thinkMatch) {
      const thinking = thinkMatch[1].trim();
      const mainResponse = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      return { thinking, mainResponse };
    }

    return { thinking: null, mainResponse: text };
  };

  const { thinking, mainResponse } = parseResponse(response);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Custom Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="step-description">
          Enter your own prompt and send it to the active provider. The response will appear below.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Prompt</label>
            <Badge variant="secondary" className="gap-1">
              <Database className="h-3 w-3" />
              {activeModel || 'qwen3-max'}
            </Badge>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[100px] resize-none"
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              size="sm"
              className="gap-2"
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
          <div className="space-y-3">
            {thinking && (
              <div className="demo-container">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="demo-header w-full hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="demo-label">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="demo-label-text text-muted-foreground">Thinking Process</span>
                  </div>
                  {showThinking ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showThinking && (
                  <div className="demo-content whitespace-pre-wrap text-muted-foreground text-sm italic border-l-2 border-muted pl-3">
                    {thinking}
                  </div>
                )}
              </div>
            )}

            <div className="demo-container">
              <div className="demo-header">
                <div className="demo-label">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="demo-label-text">Response</span>
                </div>
                {loading && (
                  <Badge variant="secondary" className="gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Waiting...
                  </Badge>
                )}
              </div>
              {mainResponse && (
                <div className="demo-content whitespace-pre-wrap">{mainResponse}</div>
              )}
              {loading && !response && (
                <div className="demo-content text-muted-foreground">
                  Sending request...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
