import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Network, RefreshCw, ArrowRight, XCircle } from 'lucide-react';
import type { ProviderSwitchStepProps } from '@/types/quick-guide.types';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';

export function ProviderSwitchStep({ providers, activeProvider, loading, onSwitch, apiBaseUrl }: ProviderSwitchStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-4 w-4" />
          Switch Provider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CodeBlock
          label="Via API:"
          code={`curl -X PUT ${apiBaseUrl || 'http://localhost:3002'}/api/settings/active_provider \\
  -H "Content-Type: application/json" \\
  -d '{"value": "qwen-proxy-default"}'`}
        />

        <p className="step-description">
          The Provider Router can route to different AI backends. Switch providers dynamically without restarting:
        </p>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <Network className="h-4 w-4 text-primary" />
              <span className="demo-label-text">Available Providers</span>
            </div>
            {loading && (
              <Badge variant="secondary" className="gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </Badge>
            )}
          </div>

          <div className="provider-switch-list">
            {providers.map((provider) => {
              const isActive = provider.id === activeProvider;
              const itemClassName = isActive
                ? 'provider-switch-item provider-switch-item-active'
                : 'provider-switch-item';

              return (
                <div key={provider.id} className={itemClassName}>
                  <div className="provider-switch-info">
                    <StatusIndicator status={isActive ? 'running' : 'stopped'} />
                    <div className="provider-switch-details">
                      <div className="provider-switch-name">{provider.name}</div>
                      <div className="provider-switch-type">{provider.type}</div>
                    </div>
                  </div>
                  <div className="provider-switch-actions">
                    {isActive && (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    )}
                    {!isActive && provider.enabled && (
                      <Button
                        onClick={() => onSwitch(provider.id)}
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

          {providers.length === 0 && !loading && (
            <div className="demo-error-state">
              <XCircle className="h-4 w-4" />
              <span>No providers configured. Check the Providers page.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
