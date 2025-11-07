import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code } from 'lucide-react';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
import { pythonExample, nodeExample, curlExample } from '@/lib/api-guide-examples';
import { BaseUrlSection } from './BaseUrlSection';

interface CodeExamplesCardProps {
  baseUrl: string;
}

export function CodeExamplesCard({ baseUrl }: CodeExamplesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code className="h-4 w-4" />
          Quick Start Examples
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BaseUrlSection baseUrl={baseUrl} />

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
  );
}
