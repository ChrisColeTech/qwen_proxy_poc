import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, CheckCircle2, XCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrowseModelsTabProps } from '@/types/components.types';

export function BrowseModelsTab({
  models,
  loading,
  onRefresh,
  activeModel,
  onSelectModel
}: BrowseModelsTabProps) {
  return (
    <div className="models-browse-container">
      <p className="models-browse-description">
        Click on any model to set it as the active model for chat completions. The active model is used across all chat requests.
      </p>

      <div className="models-browse-demo">
        <div className="models-browse-header">
          <div className="models-browse-label">
            <Database className="h-4 w-4 text-primary" />
            <span className="models-browse-label-text">Available Models</span>
          </div>
          <div className="models-browse-actions">
            {loading && (
              <Badge variant="secondary" className="models-browse-badge">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading...
              </Badge>
            )}
            {!loading && models.length > 0 && (
              <Badge variant="secondary" className="models-browse-badge">
                <CheckCircle2 className="h-3 w-3 status-icon-success" />
                {models.length} models
              </Badge>
            )}
            <Button
              onClick={onRefresh}
              disabled={loading}
              size="icon"
              variant="outline"
              title="Refresh models"
              className="models-browse-button"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
        {models.length > 0 && (
          <div className="model-list-container">
            {models.map((model) => {
              const isActive = activeModel === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => onSelectModel?.(model.id)}
                  disabled={!onSelectModel}
                  className={cn(
                    'model-item',
                    onSelectModel && 'model-item-interactive',
                    isActive && 'model-item-active'
                  )}
                >
                  <div className="model-item-content">
                    {isActive && <Check className="h-3.5 w-3.5 status-icon-success" />}
                    <code className="model-item-code">{model.id}</code>
                  </div>
                  <Badge variant={isActive ? 'default' : 'outline'} className="model-item-badge">
                    {isActive ? 'Active' : 'Ready'}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
        {!loading && models.length === 0 && (
          <div className="models-empty-state">
            <XCircle className="h-4 w-4" />
            <span>No models available. Make sure the Provider Router is running.</span>
          </div>
        )}
      </div>
    </div>
  );
}
