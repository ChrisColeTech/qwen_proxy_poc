import { Database, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import type { ActionItem } from './home.constants';
import type { Model, ParsedModel } from '@/types/models.types';

export const MODELS_TABS = {
  SELECT: {
    value: 'select',
    label: 'Select Model',
    description: 'Select an active model to use with the Provider Router:'
  },
  ALL: {
    value: 'all',
    label: 'All Models',
    description: 'Browse all available LLM models'
  },
  TEST: {
    value: 'test',
    label: 'Test Model',
    description: 'Test the currently selected model with the active provider'
  }
} as const;

export const MODELS_TITLE = 'Models';
export const MODELS_ICON = Database;

// Helper: Create a badge with chevron for action items
export const createModelBadge = (variant: 'default' | 'destructive' | 'secondary', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[180px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

// Helper: Create active badge with chevron
export const createActiveBadge = () => (
  <>
    <Badge variant="default" className="min-w-[180px] justify-center">
      Active
    </Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

// Builder: Create action items for model selection
export const buildModelSelectActions = (params: {
  models: Model[];
  activeModel: string;
  onSelect: (modelId: string) => void;
}): ActionItem[] => {
  const { models, activeModel, onSelect } = params;

  return models.map((model) => {
    const isActive = model.id === activeModel;

    return {
      icon: isActive ? <StatusIndicator status="running" /> : undefined,
      title: model.id,
      description: model.description,
      actions: isActive ? createActiveBadge() : <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />,
      onClick: isActive ? undefined : () => onSelect(model.id),
      disabled: isActive,
    };
  });
};

// Builder: Create action items for browsing all models
export const buildModelActions = (params: {
  models: ParsedModel[];
  activeModel: string;
  handleModelClick: (modelId: string) => void;
}): ActionItem[] => {
  const { models, activeModel, handleModelClick } = params;

  return models.map((model) => {
    const isActive = model.id === activeModel;
    return {
      icon: isActive ? <StatusIndicator status="running" /> : undefined,
      title: model.id,
      description: model.description,
      actions: createModelBadge("default", model.provider),
      onClick: () => handleModelClick(model.id),
    };
  });
};

