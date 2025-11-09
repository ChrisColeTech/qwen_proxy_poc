import { MessageSquare } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';

interface CurlTabProps {
  providerRouterUrl: string;
  activeModel: string;
}

export function CurlTab({ providerRouterUrl, activeModel }: CurlTabProps) {
  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <MessageSquare className="icon-primary" />
          <span className="demo-label-text">cURL Examples</span>
        </div>
      </div>

      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div className="vspace-md space-y-6">
          <p className="text-sm text-muted-foreground">
            Use this curl command to test the chat completion endpoint directly from your terminal. The active model and provider will be used automatically.
          </p>

          <CodeBlock
            label="Copy and run in your terminal:"
            code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "${activeModel}",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`}
          />

          <div className="divider-horizontal" />

          <div className="demo-container">
            <div className="demo-header">
              <div className="demo-label">
                <MessageSquare className="icon-primary" />
                <span className="demo-label-text">Response Format</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                The endpoint returns a JSON object with the completion response:
              </p>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <pre className="text-sm whitespace-pre-wrap break-words font-mono">
{`{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "${activeModel}",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
