import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, RefreshCw, Database, ChevronDown, ChevronRight, Brain, Play, Zap } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';

interface ChatTestCardProps {
  providerRouterUrl: string;
  activeModel?: string;
}

export function ChatTestCard({ providerRouterUrl, activeModel }: ChatTestCardProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const [quickResponse, setQuickResponse] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  const modelToUse = activeModel || 'qwen3-max';

  const sendChatRequest = async (prompt: string) => {
    const res = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer any-key'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();

    if (data.choices && data.choices[0]) {
      return data.choices[0].message.content;
    }
    return 'Error: No response from server';
  };

  const handleCustomSend = async () => {
    if (!customPrompt.trim() || !providerRouterUrl) return;

    setCustomLoading(true);
    setCustomResponse('');
    setShowThinking(false);

    try {
      const response = await sendChatRequest(customPrompt);
      setCustomResponse(response);
    } catch (error) {
      console.error('Failed to send chat:', error);
      setCustomResponse('Error: Could not connect to Provider Router');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleQuickTest = async () => {
    if (!providerRouterUrl) return;

    setQuickLoading(true);
    setQuickResponse('');

    try {
      const response = await sendChatRequest('Say hello in one sentence');
      setQuickResponse(response);
    } catch (error) {
      console.error('Failed to test chat:', error);
      setQuickResponse('Error: Could not connect to Provider Router');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSend();
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

  const { thinking, mainResponse } = parseResponse(customResponse);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Chat Completions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Test</TabsTrigger>
            <TabsTrigger value="custom">Custom Chat</TabsTrigger>
            <TabsTrigger value="curl">Try It Yourself</TabsTrigger>
          </TabsList>

          {/* Quick Test Tab */}
          <TabsContent value="quick" className="mt-4 space-y-4">
            <p className="step-description">
              Send a chat completion request to the active provider. The Provider Router automatically routes your request based on the configured provider.
            </p>

            <div className="demo-container">
              <div className="demo-header">
                <div className="demo-label">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="demo-label-text">Test Response</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Database className="h-3 w-3" />
                    {modelToUse}
                  </Badge>
                  {quickLoading && (
                    <Badge variant="secondary" className="gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Waiting...
                    </Badge>
                  )}
                  <Button
                    onClick={handleQuickTest}
                    disabled={quickLoading}
                    size="icon"
                    variant="outline"
                    title="Test chat completion"
                    className="h-7 w-7"
                  >
                    {quickLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              {quickResponse && (
                <div className="demo-content">{quickResponse}</div>
              )}
              {!quickResponse && !quickLoading && (
                <div className="demo-empty-state">
                  Click the <Play className="status-icon-inline" /> button above to test a chat completion
                </div>
              )}
            </div>
          </TabsContent>

          {/* Custom Chat Tab */}
          <TabsContent value="custom" className="mt-4 space-y-4">
            <p className="step-description">
              Enter your own prompt and send it to the active provider. The response will appear below.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Your Prompt</label>
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  {modelToUse}
                </Badge>
              </div>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[100px] resize-none"
                disabled={customLoading}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleCustomSend}
                  disabled={customLoading || !customPrompt.trim()}
                  size="sm"
                  className="gap-2"
                >
                  {customLoading ? (
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

            {(customResponse || customLoading) && (
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
                    {customLoading && (
                      <Badge variant="secondary" className="gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Waiting...
                      </Badge>
                    )}
                  </div>
                  {mainResponse && (
                    <div className="demo-content whitespace-pre-wrap">{mainResponse}</div>
                  )}
                  {customLoading && !customResponse && (
                    <div className="demo-content text-muted-foreground">
                      Sending request...
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Try It Yourself Tab */}
          <TabsContent value="curl" className="mt-4 space-y-4">
            <p className="step-description">
              Use this curl command to test the chat completion endpoint directly from your terminal.
            </p>

            <CodeBlock
              label="Copy and run in your terminal:"
              code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "${modelToUse}",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`}
            />

            <div className="demo-container">
              <div className="demo-header">
                <div className="demo-label">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="demo-label-text">Active Model</span>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Database className="h-3 w-3" />
                  {modelToUse}
                </Badge>
              </div>
              <div className="demo-content">
                <p className="text-sm text-muted-foreground">
                  The curl command above will send a request to your active provider using the <code className="text-xs bg-muted px-1 py-0.5 rounded">{modelToUse}</code> model. Make sure the Provider Router is running on <code className="text-xs bg-muted px-1 py-0.5 rounded">{providerRouterUrl || 'http://localhost:3001'}</code>.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
