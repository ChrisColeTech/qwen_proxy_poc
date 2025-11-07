import { useState } from 'react';
import { useProxyStatus } from '@/hooks/useProxyStatus';
import { useProxyStore } from '@/stores/useProxyStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, CheckCircle } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { pythonExample, nodeExample, curlExample, supportedEndpoints } from '@/lib/api-guide-examples';
import type { GuidePageProps } from '@/types/quick-guide.types';

export function APIGuidePage({}: GuidePageProps) {
  useProxyStatus();
  const proxyStatus = useProxyStore((state) => state.status);
  const { showAlert } = useAlertStore;
  const [copiedUrl, setCopiedUrl] = useState(false);

  const port = proxyStatus?.providerRouter?.port || 3001;
  const baseUrl = `http://localhost:${port}`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    showAlert('Base URL copied to clipboard', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="page-container">
      {/* Code Examples with Base URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-4 w-4" />
            Quick Start Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Base URL Section */}
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
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Authentication happens through stored Qwen credentials, so you can use any string as the API key.
            </p>
          </div>

          {/* Code Examples Tabs */}
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
        </CardContent>
      </Card>

      {/* Supported Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4" />
            OpenAI-Compatible Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {supportedEndpoints.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1 flex-1">
                  <code className="text-sm font-mono">{item.endpoint}</code>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
