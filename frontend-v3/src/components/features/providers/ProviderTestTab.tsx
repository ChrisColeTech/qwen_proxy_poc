import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCw, Play, Zap } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface ProviderTestTabProps {
  providerId: string;
  providerName: string;
  defaultModel?: string;
}

export function ProviderTestTab({ providerId, providerName, defaultModel }: ProviderTestTabProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

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
    <div className="vspace-md">
      <p className="text-sm text-muted-foreground mb-4">
        Send a test chat completion request to <strong>{providerName}</strong> to verify the configuration is working correctly.
        {defaultModel && ` Using model: ${defaultModel}`}
      </p>

      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Zap className="icon-primary" />
            <span className="demo-label-text">Test Response</span>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <Badge variant="secondary" className="min-w-[100px] justify-center">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Waiting...
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip content="Test provider configuration">
                <Button
                  onClick={handleTest}
                  disabled={loading}
                  size="icon"
                  variant="outline"
                  aria-label="Test provider"
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
    </div>
  );
}
