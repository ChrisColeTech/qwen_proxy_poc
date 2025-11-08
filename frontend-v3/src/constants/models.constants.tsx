import { Filter, Database, Star, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from './home.constants';
import type { Model } from '@/types/models.types';

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
    <Badge variant={variant} className="min-w-[100px] justify-center">{text}</Badge>
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
      description: model.description || model.name,
      actions: isActive
        ? createModelBadge('default', 'Active')
        : createModelBadge('secondary', 'Select'),
      onClick: isActive ? undefined : () => onSelect(model.id),
      disabled: isActive
    };
  });
};

export const buildModelActions = (params: {
  handleModelClick: (modelId: string) => void;
}): ActionItem[] => {
  const { handleModelClick } = params;

  return [
    {
      icon: <StatusIndicator status="running" />,
      title: 'GPT-4 Turbo',
      description: 'Most capable model, best for complex tasks',
      actions: createModelBadge('default', 'Available'),
      onClick: () => handleModelClick('gpt-4-turbo')
    },
    {
      icon: <StatusIndicator status="running" />,
      title: 'GPT-3.5 Turbo',
      description: 'Fast and efficient for most tasks',
      actions: createModelBadge('default', 'Available'),
      onClick: () => handleModelClick('gpt-3.5-turbo')
    },
    {
      icon: <StatusIndicator status="stopped" />,
      title: 'Claude 3 Opus',
      description: 'Advanced reasoning and analysis',
      actions: createModelBadge('secondary', 'Unavailable'),
      onClick: () => handleModelClick('claude-3-opus'),
      disabled: true
    }
  ];
};

export const buildModelSelectContent = (selectActions: ActionItem[]) => (
  <ActionList title="Available Models" icon={CheckCircle2} items={selectActions} />
);

export const buildAllModelsContent = (modelActions: ActionItem[]) => (
  <ActionList title="Available Models" icon={Database} items={modelActions} />
);

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
