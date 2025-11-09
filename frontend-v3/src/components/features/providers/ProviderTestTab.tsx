import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCw, Play, Zap, FlaskConical } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProviderTestTabProps {
  providerId: string;
  providerName: string;
  defaultModel?: string;
}

export function ProviderTestTab({ providerId, providerName, defaultModel }: ProviderTestTabProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

  const port = providerRouterUrl ? new URL(providerRouterUrl).port || '3001' : '3001';
  const model = defaultModel || 'default';

  const pythonExample = `from openai import OpenAI

# Configure client to use Provider Router
client = OpenAI(
    base_url="${providerRouterUrl || 'http://localhost:3001'}/v1",
    api_key="any-key"  # Authentication via Qwen credentials
)

# Test ${providerName} provider
response = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Say hello in one sentence"}]
)

print(response.choices[0].message.content)`;

  const nodeExample = `import OpenAI from 'openai';

// Configure client to use Provider Router
const openai = new OpenAI({
  baseURL: '${providerRouterUrl || 'http://localhost:3001'}/v1',
  apiKey: 'any-key'  // Authentication via Qwen credentials
});

// Test ${providerName} provider
const completion = await openai.chat.completions.create({
  model: '${model}',
  messages: [{ role: 'user', content: 'Say hello in one sentence' }]
});

console.log(completion.choices[0].message.content);`;

  const curlExample = `# Test ${providerName} provider
curl ${providerRouterUrl || `http://localhost:${port}`}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "${model}",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`;

  const handleTest = async () => {
    if (!providerRouterUrl) {
      setResponse('Error: Provider Router URL not configured');
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      // First, switch to this provider
      const switchResponse = await fetch(`${providerRouterUrl}/v1/provider/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: providerId }),
      });

      if (!switchResponse.ok) {
        throw new Error('Failed to switch provider');
      }

      // Then send a test message
      const model = defaultModel || 'default';
      const chatResponse = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say hello in one sentence' }],
        }),
      });

      const data = await chatResponse.json();

      if (data.choices && data.choices[0]) {
        setResponse(data.choices[0].message.content);
      } else if (data.error) {
        setResponse(`Error: ${data.error.message || JSON.stringify(data.error)}`);
      } else {
        setResponse('Error: No response from server');
      }
    } catch (error) {
      console.error('Failed to test provider:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Could not connect to Provider Router'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <Zap className="icon-primary" />
          <span className="demo-label-text">Provider Test</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <Badge variant="secondary" className="min-w-[100px] justify-center">
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              Waiting...
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip content={loading ? "Testing provider..." : "Test provider configuration"}>
              <Button
                onClick={handleTest}
                disabled={loading}
                size="icon"
                variant="outline"
                aria-label="Test provider configuration"
              >
                {loading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div className="vspace-md space-y-6">
          {/* Test Request Section */}
          <div className="vspace-md">
            <p className="text-sm text-muted-foreground mb-4">
              Send a test chat completion request to <strong>{providerName}</strong> to verify the configuration is working correctly.
              {defaultModel && ` Using model: ${defaultModel}`}
            </p>

            {response && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <pre className="text-sm whitespace-pre-wrap break-words font-mono">{response}</pre>
              </div>
            )}
            {!response && !loading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Click the <Play className="h-3.5 w-3.5 mx-1 inline" /> button above to test this provider
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* SDK Integration Examples */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="icon-primary" />
              <h3 className="text-sm font-semibold tracking-tight">SDK Integration Examples</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Use these code examples to integrate <strong>{providerName}</strong> into your application using the OpenAI-compatible SDK.
            </p>
            <Tabs defaultValue="python" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="node">Node.js</TabsTrigger>
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <TabsContent value="python" className="mt-4">
                <CodeBlock label="Using OpenAI Python SDK" code={pythonExample} />
              </TabsContent>
              <TabsContent value="node" className="mt-4">
                <CodeBlock label="Using OpenAI Node.js SDK" code={nodeExample} />
              </TabsContent>
              <TabsContent value="curl" className="mt-4">
                <CodeBlock label="Manual API request" code={curlExample} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
