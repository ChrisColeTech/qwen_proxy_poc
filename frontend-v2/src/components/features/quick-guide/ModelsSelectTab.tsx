import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, CheckCircle2, XCircle, Check } from 'lucide-react';
import type { Model } from '@/types/proxy.types';
import { cn } from '@/lib/utils';

interface ModelsSelectTabProps {
  models: Model[];
  loading: boolean;
  onRefresh: () => void;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}

export function ModelsSelectTab({
  models,
  loading,
  onRefresh,
  activeModel,
  onSelectModel
}: ModelsSelectTabProps) {
  return (
    <div className="vspace-md">
      <p className="step-description">
        The Provider Router exposes an OpenAI-compatible endpoint at{' '}
        <code className="step-inline-code">http://localhost:3001/v1</code>.
        Select an active model to use:
      </p>

      <div className="demo-container">
        <div className="demo-header">
          <div className="demo-label">
            <Database className="icon-sm-muted" />
            <span className="demo-label-text">Available Models</span>
          </div>
          <div className="model-header-actions">
            {loading && (
              <Badge variant="secondary" className="model-loading-badge">
                <RefreshCw className="model-loading-icon" />
                Loading...
              </Badge>
            )}
            {!loading && models.length > 0 && (
              <Badge variant="secondary" className="model-count-badge">
                <CheckCircle2 className="model-count-icon" />
                {models.length} models
              </Badge>
            )}
            <Button
              onClick={onRefresh}
              disabled={loading}
              size="icon"
              variant="outline"
              title="Refresh models"
              className="model-refresh-button"
            >
              <RefreshCw className={cn('model-refresh-icon', loading && 'animate-spin')} />
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
                    onSelectModel && 'cursor-pointer hover:bg-accent',
                    isActive && 'bg-accent'
                  )}
                >
                  <div className="model-item-left">
                    {isActive && <Check className="model-check-icon" />}
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
          <div className="demo-error-state">
            <XCircle className="icon-sm" />
            <span>No models available. Make sure the Provider Router is running.</span>
          </div>
        )}
      </div>
    </div>
  );
}
