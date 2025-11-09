import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Network, RefreshCw, ArrowRight, XCircle } from 'lucide-react';
import type { Provider } from '@/types/providers.types';

interface ProviderSwitchTabProps {
  providers: Provider[];
  activeProvider: string;
  loading: boolean;
  onSwitch: (providerId: string) => void;
}

export function ProviderSwitchTab({
  providers,
  activeProvider,
  loading,
  onSwitch
}: ProviderSwitchTabProps) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <p className="step-description">
        The Provider Router can route to different AI backends. Switch providers dynamically without restarting:
      </p>

      <div className="demo-container flex-1">
        <div className="demo-header">
          <div className="demo-label">
            <Network className="icon-primary" />
            <span className="demo-label-text">Available Providers</span>
          </div>
          {loading && (
            <Badge variant="secondary" className="provider-loading-badge">
              <RefreshCw className="provider-loading-icon" />
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
                    <Badge variant="default" className="provider-badge-sm">Active</Badge>
                  )}
                  {!isActive && provider.enabled && (
                    <TooltipProvider>
                      <Tooltip content="Switch to this provider">
                        <Button
                          onClick={() => onSwitch(provider.id)}
                          size="icon"
                          variant="outline"
                          aria-label={`Switch to ${provider.name} provider`}
                          className="provider-switch-button"
                        >
                          <ArrowRight className="provider-switch-icon" />
                        </Button>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {!provider.enabled && (
                    <Badge variant="outline" className="provider-badge-sm">Disabled</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {providers.length === 0 && !loading && (
          <div className="demo-error-state">
            <XCircle className="icon-sm" />
            <span>No providers configured. Check the Providers page.</span>
          </div>
        )}
      </div>
    </div>
  );
}
