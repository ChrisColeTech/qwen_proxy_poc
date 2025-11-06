import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Package, Layers, Code, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const SETUP_STEPS = [
  {
    number: 1,
    title: 'Authenticate with Qwen',
    description: 'Click the "Connect" button in the System Control card on the Home page. This will open a browser window where you can log in to your Qwen account.',
    details: [
      'Credentials are automatically extracted after login',
      'Token and cookies are securely stored',
      'Expiration date is tracked automatically'
    ]
  },
  {
    number: 2,
    title: 'Start the Proxy Server',
    description: 'Once authenticated, click the "Start" button to launch the proxy server. The server will run on port 3000.',
    details: [
      'Qwen Proxy starts first (port 3000)',
      'Provider Router starts automatically (port 3001)',
      'Status indicators show when servers are ready'
    ]
  },
  {
    number: 3,
    title: 'Configure Your OpenAI Client',
    description: 'Point your OpenAI SDK or any OpenAI-compatible client to the proxy endpoint.',
    details: [
      'Base URL: http://localhost:3000/v1',
      'API Key: Use any non-empty string',
      'All OpenAI SDK features are supported'
    ]
  }
];

const TECH_STACK = {
  frontend: [
    { name: 'React', version: '18.3.1', description: 'UI library' },
    { name: 'TypeScript', version: '5.9.3', description: 'Type safety' },
    { name: 'Vite', version: '7.1.7', description: 'Build tool' },
    { name: 'Tailwind CSS', version: '3.4.18', description: 'Styling' },
    { name: 'Zustand', version: '5.0.8', description: 'State management' }
  ],
  uiComponents: [
    { name: 'shadcn/ui', description: 'Base components' },
    { name: 'Radix UI', description: 'Headless primitives' },
    { name: 'lucide-react', version: '0.552.0', description: 'Icons' },
    { name: 'react-icons', version: '5.5.0', description: 'VSCode icons' },
    { name: 'cmdk', version: '1.1.1', description: 'Command menu' }
  ],
  desktop: [
    { name: 'Electron', version: '27.0.0', description: 'Desktop runtime' },
    { name: 'electron-builder', version: '26.0.12', description: 'Packaging' }
  ]
};

const CODE_EXAMPLES = {
  javascript: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'any-key'  // Required but not validated
});

const response = await client.chat.completions.create({
  model: 'qwen3-max',
  messages: [
    { role: 'user', content: 'Hello! How are you?' }
  ]
});

console.log(response.choices[0].message.content);`,

  python: `from openai import OpenAI

client = OpenAI(
    base_url='http://localhost:3000/v1',
    api_key='any-key'  # Required but not validated
)

response = client.chat.completions.create(
    model='qwen3-max',
    messages=[
        {'role': 'user', 'content': 'Hello! How are you?'}
    ]
)

print(response.choices[0].message.content)`,

  curl: `curl http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between bg-muted/50 border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-xs font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
}

export function QuickGuidePage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8" />
          Quick Start Guide
        </h1>
        <p className="text-muted-foreground mt-2">
          Get started with Qwen Proxy in three simple steps. Learn about the tech stack and see code examples.
        </p>
      </div>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Setup Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {SETUP_STEPS.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {step.number}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <ul className="space-y-1 ml-4">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">JavaScript / TypeScript</h3>
              <CodeBlock code={CODE_EXAMPLES.javascript} language="JavaScript" />
            </div>

            <div>
              <h3 className="font-semibold mb-3">Python</h3>
              <CodeBlock code={CODE_EXAMPLES.python} language="Python" />
            </div>

            <div>
              <h3 className="font-semibold mb-3">cURL</h3>
              <CodeBlock code={CODE_EXAMPLES.curl} language="bash" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Frontend Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Frontend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TECH_STACK.frontend.map((pkg) => (
                <div key={pkg.name} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pkg.name}</div>
                    <div className="text-xs text-muted-foreground">{pkg.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    v{pkg.version}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* UI Components */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              UI Framework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TECH_STACK.uiComponents.map((pkg) => (
                <div key={pkg.name} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pkg.name}</div>
                    <div className="text-xs text-muted-foreground">{pkg.description}</div>
                  </div>
                  {pkg.version && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      v{pkg.version}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Desktop Runtime */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Desktop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {TECH_STACK.desktop.map((pkg) => (
                <div key={pkg.name} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{pkg.name}</div>
                    <div className="text-xs text-muted-foreground">{pkg.description}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    v{pkg.version}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Additional Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold">Documentation</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• OpenAI API Reference</li>
                <li>• Qwen API Documentation</li>
                <li>• Electron Documentation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Features</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• OpenAI-compatible API</li>
                <li>• Automatic credential management</li>
                <li>• Multi-provider support</li>
                <li>• Desktop and web compatibility</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
