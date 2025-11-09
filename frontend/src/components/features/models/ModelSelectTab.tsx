import { CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionItem } from '@/constants/home.constants';

interface ModelSelectTabProps {
  selectActions: ActionItem[];
  activeProvider: string;
  providers: { id: string; name: string }[];
  onProviderChange: (providerId: string) => void;
}

export function ModelSelectTab({ selectActions, activeProvider, providers, onProviderChange }: ModelSelectTabProps) {
  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <CheckCircle2 className="icon-primary" />
          <span className="demo-label-text">Available Models</span>
        </div>
      </div>

      {/* Provider Filter */}
      <div className="model-filters-row" style={{ flexShrink: 0 }}>
        <div className="model-filter-group">
          <span className="model-filter-label">Provider:</span>
          <Select value={activeProvider} onValueChange={onProviderChange}>
            <SelectTrigger className="models-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Models List */}
      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {selectActions.map((item, index) => (
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
