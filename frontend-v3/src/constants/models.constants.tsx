import { Filter, Database, Star, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from './home.constants';

export const MODELS_TABS = {
  ALL: {
    value: 'all',
    label: 'All Models',
    description: 'Browse all available AI models'
  },
  FAVORITES: {
    value: 'favorites',
    label: 'Favorites',
    description: 'Your favorite models for quick access'
  },
  RECENT: {
    value: 'recent',
    label: 'Recent',
    description: 'Recently used models'
  }
} as const;

export const MODELS_TITLE = 'Models';
export const MODELS_ICON = Database;
export const FILTER_ICON = Filter;

const createModelBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant}>{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

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
