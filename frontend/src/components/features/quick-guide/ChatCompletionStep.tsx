import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw, Zap } from 'lucide-react';
import type { ChatCompletionStepProps } from '@/types/quick-guide.types';
import { CodeBlock } from './CodeBlock';

export function ChatCompletionStep({ response, loading, onTest, providerRouterUrl }: ChatCompletionStepProps) {
  return (
    <Card>
      <CardHeader>
        <div className="step-card-header-row">
          <CardTitle className="step-card-title">
            <div className="step-number-badge">2</div>
            Send a Chat Completion
          </CardTitle>
          <Button
            onClick={onTest}
            disabled={loading}
            size="icon"
            variant="default"
            title="Test chat completion"
            className="h-8 w-8"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="step-description">
          Send a chat completion request to the active provider. The Provider Router automatically routes your request based on the configured provider.
        </p>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <Zap className="h-4 w-4 text-primary" />
              <span className="demo-label-text">Test Response</span>
            </div>
            {loading && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Waiting...
              </Badge>
            )}
          </div>
          {response && (
            <div className="demo-content">{response}</div>
          )}
          {!response && !loading && (
            <div className="demo-empty-state">
              Click the <Play className="status-icon-inline" /> button to test a chat completion
            </div>
          )}
        </div>

        <CodeBlock
          label="Try it yourself:"
          code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`}
        />
      </CardContent>
    </Card>
  );
}
