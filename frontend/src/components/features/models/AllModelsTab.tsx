import { Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionItem } from '@/constants/home.constants';
import type { CapabilityFilter } from '@/types/models.types';

interface AllModelsTabProps {
  modelActions: ActionItem[];
  capabilityFilter: CapabilityFilter;
  providerFilter: string;
  providers: string[];
  onCapabilityChange: (value: CapabilityFilter) => void;
  onProviderChange: (value: string) => void;
}

export function AllModelsTab({
  modelActions,
  capabilityFilter,
  providerFilter,
  providers,
  onCapabilityChange,
  onProviderChange
}: AllModelsTabProps) {
  return (
    <div className="demo-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="demo-header" style={{ flexShrink: 0 }}>
        <div className="demo-label">
          <Database className="icon-primary" />
          <span className="demo-label-text">Browse Models</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="model-filters-row" style={{ flexShrink: 0 }}>
        <div className="model-filter-group">
          <span className="model-filter-label">Capability:</span>
          <Select value={capabilityFilter} onValueChange={onCapabilityChange}>
            <SelectTrigger className="models-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Capabilities</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="vision">Vision</SelectItem>
              <SelectItem value="tool-call">Tool Calling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="model-filter-group">
          <span className="model-filter-label">Provider:</span>
          <Select value={providerFilter} onValueChange={onProviderChange}>
            <SelectTrigger className="models-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Models List */}
      <div className="provider-switch-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {modelActions.map((item, index) => (
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
