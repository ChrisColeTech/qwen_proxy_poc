import { Filter, Database, Star, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionItem } from './home.constants';
import type { Model, ParsedModel, CapabilityFilter } from '@/types/models.types';

export const MODELS_TABS = {
  SELECT: {
    value: 'select',
    label: 'Select Model',
    description: 'Select an active model to use with the Provider Router:'
  },
  ALL: {
    value: 'all',
    label: 'All Models',
    description: 'Browse all available AI models'
  },
  FAVORITES: {
    value: 'favorites',
    label: 'Favorites',
    description: 'Your favorite models for quick access'
  }
} as const;

export const MODELS_TITLE = 'Models';
export const MODELS_ICON = Database;
export const FILTER_ICON = Filter;

const createModelBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[180px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

export const buildModelSelectActions = (params: {
  models: Model[];
  activeModel: string;
  onSelect: (modelId: string) => void;
}): ActionItem[] => {
  const { models, activeModel, onSelect } = params;

  return models.map((model) => {
    const isActive = model.id === activeModel;

    return {
      icon: <StatusIndicator status={isActive ? 'running' : 'stopped'} />,
      title: model.id,
      description: model.description,
      actions: isActive ? (
        <>
          <Badge variant="default" className="min-w-[180px] justify-center">Active</Badge>
          <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
        </>
      ) : (
        <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
      ),
      onClick: isActive ? undefined : () => onSelect(model.id),
      disabled: isActive
    };
  });
};

export const buildModelActions = (params: {
  models: ParsedModel[];
  handleModelClick: (modelId: string) => void;
}): ActionItem[] => {
  const { models, handleModelClick } = params;

  return models.map((model) => ({
    icon: <StatusIndicator status="running" />,
    title: model.id,
    description: model.description,
    actions: createModelBadge('default', model.provider),
    onClick: () => handleModelClick(model.id)
  }));
};

export const buildModelSelectContent = (params: {
  selectActions: ActionItem[];
  activeProvider: string;
  providers: { id: string; name: string }[];
  onProviderChange: (providerId: string) => void;
}) => {
  const { selectActions, activeProvider, providers, onProviderChange } = params;

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
};

export const buildAllModelsContent = (params: {
  modelActions: ActionItem[];
  capabilityFilter: CapabilityFilter;
  providerFilter: string;
  providers: string[];
  onCapabilityChange: (value: CapabilityFilter) => void;
  onProviderChange: (value: string) => void;
}) => {
  const { modelActions, capabilityFilter, providerFilter, providers, onCapabilityChange, onProviderChange } = params;

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
};

export const buildFavoritesContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Star className="icon-primary" />
          <span className="demo-label-text">Favorite Models</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <p className="text-muted-foreground text-center py-8">
          No favorite models yet. Click the star icon on any model to add it to your favorites.
        </p>
      </div>
    </div>
  </div>
);

export const buildRecentContent = () => (
  <div className="vspace-md">
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Clock className="icon-primary" />
          <span className="demo-label-text">Recently Used</span>
        </div>
      </div>
      <div className="provider-switch-list">
        <p className="text-muted-foreground text-center py-8">
          No recently used models. Start using models to see them here.
        </p>
      </div>
    </div>
  </div>
);
