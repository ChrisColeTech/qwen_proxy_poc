import { Blocks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import type { ActionItem } from '@/constants/home.constants';

interface AllProvidersTabProps {
  providerActions: ActionItem[];
  onAddProvider: () => void;
}

export function AllProvidersTab({ providerActions, onAddProvider }: AllProvidersTabProps) {
  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <Blocks className="icon-primary" />
          <span className="demo-label-text">Available Providers</span>
        </div>
      </div>

      {/* Add Provider Button Row */}
      <div className="model-filters-row" style={{ flexShrink: 0, justifyContent: 'flex-end' }}>
        <TooltipProvider>
          <Tooltip content="Add new provider">
            <Button
              onClick={onAddProvider}
              variant="outline"
              size="icon"
              aria-label="Add new provider"
            >
              <Plus className="icon-sm" />
            </Button>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Providers List */}
      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {providerActions.map((item, index) => (
          <div
            key={index}
            className="provider-switch-item"
            onClick={item.disabled ? undefined : item.onClick}
            style={{ cursor: item.disabled ? 'not-allowed' : item.onClick ? 'pointer' : 'default' }}
          >
            <div className="provider-switch-info">
              {item.icon}
              <div className="provider-switch-details">
                <div className="provider-switch-name">{item.title}</div>
                {item.description && (
                  <div className="provider-switch-type">{item.description}</div>
                )}
              </div>
            </div>
            {item.actions && (
              <div className="provider-switch-actions">
                {item.actions}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
