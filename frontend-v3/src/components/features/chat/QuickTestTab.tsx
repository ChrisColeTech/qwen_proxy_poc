import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCw, Play, Zap } from 'lucide-react';
import { useQuickChatTest } from '@/hooks/useQuickChatTest';
import type { QuickTestTabProps } from '@/types/components.types';

export function QuickTestTab({ providerRouterUrl, model }: QuickTestTabProps) {
  const { response, loading, handleTest } = useQuickChatTest();

  return (
    <div className="chat-quick-test-container">
      <p className="chat-quick-test-description">
        Send a chat completion request to the active provider. The Provider Router automatically routes your request based on the configured provider.
      </p>

      <div className="chat-quick-test-demo">
        <div className="chat-quick-test-header">
          <div className="chat-quick-test-label">
            <Zap className="h-4 w-4 text-primary" />
            <span className="chat-quick-test-label-text">Test Response</span>
          </div>
          <div className="chat-quick-test-actions">
            {loading && (
              <Badge variant="secondary" className="chat-quick-test-badge">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Waiting...
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip content={loading ? "Testing chat completion..." : "Test chat completion"}>
                <Button
                  onClick={() => handleTest(providerRouterUrl, model)}
                  disabled={loading}
                  size="icon"
                  variant="outline"
                  aria-label="Test chat completion"
                  className="chat-quick-test-button"
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
          <div className="chat-quick-test-content">{response}</div>
        )}
        {!response && !loading && (
          <div className="chat-quick-test-empty">
            Click the <Play className="status-icon-inline" /> button above to test a chat completion
          </div>
        )}
      </div>
    </div>
  );
}
