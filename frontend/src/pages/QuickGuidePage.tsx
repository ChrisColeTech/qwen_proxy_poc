import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import {
  BookOpen,
  Copy,
  Check,
  Play,
  ArrowRight,
  Network,
  Database,
  RefreshCw,
  Zap,
  Settings,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api.service';

interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

interface Model {
  id: string;
  name?: string;
}

export function QuickGuidePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [testResponse, setTestResponse] = useState<string>('');
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(() => {
    loadProviders();
    loadModels();
  }, []);

  const loadProviders = async () => {
    setLoadingProviders(true);
    try {
      const result = await apiService.getProviders();
      if (result.success && result.data) {
        setProviders(result.data);
      }

      const settings = await apiService.getSettings();
      if (settings.success && settings.data) {
        setActiveProvider(settings.data.active_provider || '');
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const response = await fetch('http://localhost:3001/v1/models');
      const data = await response.json();
      if (data.data) {
        setModels(data.data.slice(0, 5)); // Show first 5 models
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleTestChat = async () => {
    setLoadingTest(true);
    setTestResponse('');
    try {
      const response = await fetch('http://localhost:3001/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model: 'qwen3-max',
          messages: [{ role: 'user', content: 'Say hello in one sentence' }]
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setTestResponse(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('Failed to test chat:', error);
      setTestResponse('Error: Could not connect to Provider Router');
    } finally {
      setLoadingTest(false);
    }
  };

  const handleSwitchProvider = async (providerId: string) => {
    try {
      await apiService.updateSetting('active_provider', providerId);
      setActiveProvider(providerId);
      setTestResponse(''); // Clear previous response
    } catch (error) {
      console.error('Failed to switch provider:', error);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Quick Start Guide
        </h1>
        <p className="text-muted-foreground">
          Learn how to use the Provider Router with interactive examples
        </p>
      </div>

      {/* Step 1: Getting Models */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              Get Available Models
            </CardTitle>
            <Button
              onClick={loadModels}
              disabled={loadingModels}
              size="icon"
              variant="outline"
              title="Refresh models"
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loadingModels ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Provider Router exposes an OpenAI-compatible endpoint at <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">http://localhost:3001/v1</code>.
            First, check which models are available:
          </p>

          {/* Interactive Demo */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Available Models</span>
              </div>
              {loadingModels && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              )}
              {!loadingModels && models.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {models.length} models
                </Badge>
              )}
            </div>
            {models.length > 0 && (
              <div className="space-y-2">
                {models.map((model) => (
                  <div key={model.id} className="flex items-center justify-between bg-background rounded px-3 py-2">
                    <code className="text-xs font-mono">{model.id}</code>
                    <Badge variant="outline" className="text-xs">Ready</Badge>
                  </div>
                ))}
              </div>
            )}
            {!loadingModels && models.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4" />
                <span>No models available. Make sure the Provider Router is running.</span>
              </div>
            )}
          </div>

          {/* Code Example */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Try it yourself:</div>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
                <code className="text-foreground">
{`curl http://localhost:3001/v1/models \\
  -H "Authorization: Bearer any-key"`}
                </code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleCopy('curl http://localhost:3001/v1/models \\\n  -H "Authorization: Bearer any-key"')}
                className="absolute top-2 right-2 h-7 w-7"
                title="Copy code"
              >
                {copiedCode === 'curl http://localhost:3001/v1/models \\\n  -H "Authorization: Bearer any-key"' ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Test Chat Completion */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              Send a Chat Completion
            </CardTitle>
            <Button
              onClick={handleTestChat}
              disabled={loadingTest}
              size="icon"
              variant="default"
              title="Test chat completion"
              className="h-8 w-8"
            >
              {loadingTest ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send a chat completion request to the active provider. The Provider Router automatically routes your request based on the configured provider.
          </p>

          {/* Interactive Demo */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Test Response</span>
              </div>
              {loadingTest && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Waiting...
                </Badge>
              )}
            </div>
            {testResponse && (
              <div className="bg-background rounded px-4 py-3 text-sm">
                {testResponse}
              </div>
            )}
            {!testResponse && !loadingTest && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Click the <Play className="inline h-3 w-3 mx-1" /> button to test a chat completion
              </div>
            )}
          </div>

          {/* Code Example */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Try it yourself:</div>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
                <code className="text-foreground">
{`curl http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "qwen3-max",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`}
                </code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleCopy('curl http://localhost:3001/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer any-key" \\\n  -d \'{\n    "model": "qwen3-max",\n    "messages": [\n      {"role": "user", "content": "Say hello in one sentence"}\n    ]\n  }\'')}
                className="absolute top-2 right-2 h-7 w-7"
                title="Copy code"
              >
                {copiedCode?.includes('chat/completions') ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Switch Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              3
            </div>
            Switch Between Providers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The Provider Router can route to different AI backends. Switch providers dynamically without restarting:
          </p>

          {/* Interactive Demo */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Available Providers</span>
              </div>
              {loadingProviders && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Loading...
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {providers.map((provider) => {
                const isActive = provider.id === activeProvider;
                return (
                  <div
                    key={provider.id}
                    className={`flex items-center justify-between bg-background rounded px-4 py-3 transition-colors ${
                      isActive ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIndicator status={isActive ? 'active' : provider.enabled ? 'inactive' : 'disabled'} />
                      <div>
                        <div className="text-sm font-medium">{provider.name}</div>
                        <div className="text-xs text-muted-foreground">{provider.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                      {!isActive && provider.enabled && (
                        <Button
                          onClick={() => handleSwitchProvider(provider.id)}
                          size="icon"
                          variant="outline"
                          title="Switch to this provider"
                          className="h-7 w-7"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!provider.enabled && (
                        <Badge variant="outline" className="text-xs">Disabled</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {providers.length === 0 && !loadingProviders && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4" />
                <span>No providers configured. Check the Providers page.</span>
              </div>
            )}
          </div>

          {/* Code Example */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Via API:</div>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto">
                <code className="text-foreground">
{`curl -X PUT http://localhost:3002/api/settings/active_provider \\
  -H "Content-Type: application/json" \\
  -d '{"value": "qwen-proxy-default"}'`}
                </code>
              </pre>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleCopy('curl -X PUT http://localhost:3002/api/settings/active_provider \\\n  -H "Content-Type: application/json" \\\n  -d \'{"value": "qwen-proxy-default"}\'')}
                className="absolute top-2 right-2 h-7 w-7"
                title="Copy code"
              >
                {copiedCode?.includes('active_provider') ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <div className="text-sm text-muted-foreground">
              Explore the <span className="font-medium text-foreground">Providers</span> page to add, configure, and test different AI backends
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <div className="text-sm text-muted-foreground">
              Check the <span className="font-medium text-foreground">Models</span> page to see all available models and their capabilities
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <div className="text-sm text-muted-foreground">
              View the <span className="font-medium text-foreground">Activity</span> page to monitor requests, responses, and provider performance
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <div className="text-sm text-muted-foreground">
              Visit the <span className="font-medium text-foreground">Settings</span> page to customize server configuration and behavior
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Endpoints</div>
              <div className="space-y-1 text-xs text-muted-foreground font-mono">
                <div className="bg-muted px-3 py-2 rounded">Provider Router: :3001</div>
                <div className="bg-muted px-3 py-2 rounded">API Server: :3002</div>
                <div className="bg-muted px-3 py-2 rounded">Qwen Proxy: :3000</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Key Paths</div>
              <div className="space-y-1 text-xs text-muted-foreground font-mono">
                <div className="bg-muted px-3 py-2 rounded">/v1/models</div>
                <div className="bg-muted px-3 py-2 rounded">/v1/chat/completions</div>
                <div className="bg-muted px-3 py-2 rounded">/v1/providers</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
