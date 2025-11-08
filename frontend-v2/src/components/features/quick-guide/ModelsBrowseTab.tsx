import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModelDetailsDialog } from '@/components/features/models/ModelDetailsDialog';
import type { ParsedModel, CapabilityFilter } from '@/types/models.types';

interface ModelsBrowseTabProps {
  models: ParsedModel[];
  loading: boolean;
  onRefresh: () => void;
  capabilityFilter: CapabilityFilter;
  providerFilter: string;
  providers: string[];
  onCapabilityChange: (value: CapabilityFilter) => void;
  onProviderChange: (value: string) => void;
  onClearFilters: () => void;
  error: string | null;
}

export function ModelsBrowseTab({
  models,
  loading,
  onRefresh,
  capabilityFilter,
  providerFilter,
  providers,
  onCapabilityChange,
  onProviderChange,
  onClearFilters,
  error
}: ModelsBrowseTabProps) {
  const [selectedModel, setSelectedModel] = useState<ParsedModel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleModelClick = (model: ParsedModel) => {
    setSelectedModel(model);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedModel(null);
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      <p className="step-description">
        Browse all available models from enabled providers. Filter by capability or provider:
      </p>

      <div className="demo-container flex-1">
        {/* Header Row 1: Label + Actions */}
        <div className="demo-header">
          <div className="demo-label">
            <Database className="icon-sm-muted" />
            <span className="demo-label-text">Browse Models</span>
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
                {models.length} {models.length === 1 ? 'model' : 'models'}
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

        {/* Header Row 2: Filters */}
        <div className="model-filters-row">
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
        {!loading && !error && models.length > 0 && (
          <div className="model-list-container">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelClick(model)}
                className={cn('model-item', 'cursor-pointer hover:bg-accent')}
              >
                <div className="model-item-left">
                  <code className="model-item-code">{model.id}</code>
                </div>
                <Badge variant="outline" className="model-item-badge">
                  Available
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="demo-error-state">
            <XCircle className="icon-sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && models.length === 0 && (
          <div className="demo-error-state">
            <Database className="icon-sm" />
            <span>No models found matching your filters</span>
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="models-loading-state">
            <RefreshCw className="icon-lg models-loading-spinner" />
          </div>
        )}
      </div>

      <ModelDetailsDialog
        open={dialogOpen}
        model={selectedModel}
        onClose={handleDialogClose}
      />
    </div>
  );
}
