import { Database } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import type { ModelsCurlTabProps } from '@/types/components.types';

export function ModelsCurlTab({ providerRouterUrl }: ModelsCurlTabProps) {
  return (
    <div className="models-curl-container">
      <p className="models-curl-description">
        Use this curl command to fetch the list of available models from your Provider Router. This endpoint is OpenAI-compatible.
      </p>

      <CodeBlock
        label="Copy and run in your terminal:"
        code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/models \\
  -H "Authorization: Bearer any-key"`}
      />

      <div className="models-curl-response-container">
        <div className="models-curl-response-header">
          <div className="models-curl-response-label">
            <Database className="h-4 w-4 text-primary" />
            <span className="models-curl-response-label-text">Response Format</span>
          </div>
        </div>
        <div className="models-curl-response-content">
          <p className="models-curl-response-description">
            The endpoint returns a JSON object with a list of available models:
          </p>
          <pre className="models-curl-response-code">
{`{
  "object": "list",
  "data": [
    {
      "id": "qwen3-max",
      "object": "model",
      "created": 1234567890,
      "owned_by": "provider"
    },
    ...
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
