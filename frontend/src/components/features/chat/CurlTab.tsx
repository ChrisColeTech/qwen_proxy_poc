import { MessageSquare } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import type { CurlTabProps } from '@/types/components.types';

export function CurlTab({ providerRouterUrl, model }: CurlTabProps) {
  return (
    <div className="chat-curl-container">
      <p className="chat-curl-description">
        Use this curl command to test the chat completion endpoint directly from your terminal. The model and provider shown in the status bar will be used automatically.
      </p>

      <CodeBlock
        label="Copy and run in your terminal:"
        code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`}
      />

      <div className="chat-curl-response-container">
        <div className="chat-curl-response-header">
          <div className="chat-curl-response-label">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="chat-curl-response-label-text">Response Format</span>
          </div>
        </div>
        <div className="chat-curl-response-content">
          <p className="chat-curl-response-description">
            The endpoint returns a JSON object with the completion response:
          </p>
          <pre className="chat-curl-response-code">
{`{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "${model}",
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
  );
}
