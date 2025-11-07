import { Button } from '@/components/ui/button';
import { RefreshCw, Cpu } from 'lucide-react';
import { ModelCard } from './ModelCard';
import type { ParsedModel } from '@/types/models.types';

interface ModelsGridProps {
  models: ParsedModel[];
  loading: boolean;
  error: string | null;
  onClearFilters: () => void;
}

export function ModelsGrid({ models, loading, error, onClearFilters }: ModelsGridProps) {
  if (error) {
    return (
      <div className="models-error-state">
        <p className="models-error-text">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="models-loading-state">
        <RefreshCw className="icon-lg models-loading-spinner" />
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="models-empty-state">
        <Cpu className="models-empty-icon" />
        <p className="models-empty-text">No models found matching your filters</p>
        <Button variant="outline" size="sm" className="models-empty-button" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="models-grid">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} />
      ))}
    </div>
  );
}
