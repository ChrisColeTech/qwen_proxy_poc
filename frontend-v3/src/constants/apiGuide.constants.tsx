import { Code, Copy, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { Button } from '@/components/ui/button';

export const API_GUIDE_TITLE = 'API Guide';
export const API_GUIDE_ICON = Code;

// Code examples
export const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="qwen3-max",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;

export const nodeExample = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3001/v1',
  apiKey: 'dummy-key'
});

const completion = await openai.chat.completions.create({
  model: 'qwen3-max',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);`;

export const curlExample = `curl http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hello!"}]}'`;

// Base URL Section Builder
export const buildBaseUrlSection = (params: {
  baseUrl: string;
  copiedUrl: boolean;
  handleCopyUrl: () => void;
}) => {
  const { baseUrl, copiedUrl, handleCopyUrl } = params;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Base URL</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono">
          {baseUrl}/v1
        </code>
        <Button
          onClick={handleCopyUrl}
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
  );
};

// Content Builder with nested tabs for code examples
export const buildApiGuideContent = (params: {
  baseUrl: string;
  copiedUrl: boolean;
  handleCopyUrl: () => void;
}) => {
  return (
    <div className="space-y-4">
      {buildBaseUrlSection(params)}

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
          <CodeBlock label="Using cURL (Command Line)" code={curlExample} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
