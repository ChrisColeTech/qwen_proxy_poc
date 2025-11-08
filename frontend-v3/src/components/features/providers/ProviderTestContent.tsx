import { useState, useEffect } from 'react';
import { FlaskConical } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProviderTestTab } from './ProviderTestTab';
import { providersService } from '@/services/providers.service';
import type { ProviderDetails } from '@/types/providers.types';

interface ProviderTestContentProps {
  activeProvider: string;
  providerName: string;
  providerRouterUrl: string;
}

export function ProviderTestContent({ activeProvider, providerName, providerRouterUrl }: ProviderTestContentProps) {
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviderDetails = async () => {
      try {
        setLoading(true);
        const details = await providersService.getProviderDetails(activeProvider);
        setProviderDetails(details);
      } catch (error) {
        console.error('Failed to fetch provider details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeProvider) {
      fetchProviderDetails();
    }
  }, [activeProvider]);

  const port = providerRouterUrl ? new URL(providerRouterUrl).port || '3001' : '3001';
  const defaultModel = providerDetails?.config?.defaultModel || 'default';

  const pythonExample = `from openai import OpenAI

# Configure client to use Provider Router
client = OpenAI(
    base_url="${providerRouterUrl || 'http://localhost:3001'}/v1",
    api_key="any-key"  # Authentication via Qwen credentials
)

# Switch to ${providerName}
# (Provider Router automatically routes to active provider)

# Send test message
response = client.chat.completions.create(
    model="${defaultModel}",
    messages=[{"role": "user", "content": "Say hello in one sentence"}]
)

print(response.choices[0].message.content)`;

  const nodeExample = `import OpenAI from 'openai';

// Configure client to use Provider Router
const openai = new OpenAI({
  baseURL: '${providerRouterUrl || 'http://localhost:3001'}/v1',
  apiKey: 'any-key'  // Authentication via Qwen credentials
});

// Switch to ${providerName}
// (Provider Router automatically routes to active provider)

// Send test message
const completion = await openai.chat.completions.create({
  model: '${defaultModel}',
  messages: [{ role: 'user', content: 'Say hello in one sentence' }]
});

console.log(completion.choices[0].message.content);`;

  const curlExample = `# First, switch to ${providerName}
curl ${providerRouterUrl || `http://localhost:${port}`}/v1/provider/switch \\
  -H "Content-Type: application/json" \\
  -d '{"provider": "${activeProvider}"}'

# Then send a test chat completion
curl ${providerRouterUrl || `http://localhost:${port}`}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "${defaultModel}",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`;

  if (loading) {
    return (
      <div className="vspace-md flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading provider details...</p>
      </div>
    );
  }

  return (
    <div className="vspace-md space-y-6">
      {/* Test Request Section */}
      <ProviderTestTab
        providerId={activeProvider}
        providerName={providerName}
        defaultModel={defaultModel}
      />

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
  );
}
