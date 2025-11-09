import { Gauge, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatusTabProps {
  port: number | undefined;
  activeProvider: string;
  activeModel: string;
  baseUrl: string;
  copiedUrl: boolean;
  onCopyUrl: () => void;
}

const getPythonExample = (port: number, model: string) => `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:${port}/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;

const getNodeExample = (port: number, model: string) => `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:${port}/v1',
  apiKey: 'dummy-key'
});

const completion = await openai.chat.completions.create({
  model: '${model}',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);`;

export function StatusTab({
  port,
  activeProvider,
  activeModel,
  baseUrl,
  copiedUrl,
  onCopyUrl
}: StatusTabProps) {
  const effectivePort = port || 3001;
  const effectiveModel = activeModel !== 'None' ? activeModel : 'qwen3-max';

  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <Gauge className="icon-primary" />
          <span className="demo-label-text">System Status</span>
        </div>
      </div>

      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div className="space-y-8">
          {/* Active Configuration Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-tight">Active Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Provider</div>
                <code className="rounded-lg bg-muted px-3 py-2 text-sm font-mono block">
                  {activeProvider}
                </code>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Model</div>
                <code className="rounded-lg bg-muted px-3 py-2 text-sm font-mono block">
                  {activeModel}
                </code>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Base URL Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-tight">Base URL</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono">
                {baseUrl}/v1
              </code>
              <Button
                onClick={onCopyUrl}
                size="icon"
                variant="outline"
                title="Copy base URL"
                className="h-10 w-10 shrink-0"
              >
                {copiedUrl ? (
                  <CheckCircle className="h-4 w-4 status-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Authentication happens through stored Qwen credentials, so you can use any string as the API key.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Quick Tests Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight">Quick Tests</h3>
            <div className="space-y-4">
              <CodeBlock
                label="Check proxy health"
                code={`curl http://localhost:${effectivePort}/health`}
              />
              <div className="border-t border-border" />
              <CodeBlock
                label="List available models"
                code={`curl http://localhost:${effectivePort}/v1/models`}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* SDK Integration Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight">SDK Integration</h3>
            <Tabs defaultValue="python" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="node">Node.js</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <TabsContent value="python" className="mt-4">
                <CodeBlock label="Using OpenAI Python SDK" code={getPythonExample(effectivePort, effectiveModel)} />
              </TabsContent>
              <TabsContent value="node" className="mt-4">
                <CodeBlock label="Using OpenAI Node.js SDK" code={getNodeExample(effectivePort, effectiveModel)} />
              </TabsContent>
              <TabsContent value="curl" className="mt-4">
                <CodeBlock
                  label="Chat completion example"
                  code={`curl http://localhost:${effectivePort}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "${effectiveModel}", "messages": [{"role": "user", "content": "Hello!"}]}'`}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
