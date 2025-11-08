import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CapabilityFilter } from '@/types/models.types';

interface ModelsFiltersProps {
  capabilityFilter: CapabilityFilter;
  providerFilter: string;
  providers: string[];
  modelCount: number;
  onCapabilityChange: (value: CapabilityFilter) => void;
  onProviderChange: (value: string) => void;
}

export function ModelsFilters({
  capabilityFilter,
  providerFilter,
  providers,
  modelCount,
  onCapabilityChange,
  onProviderChange,
}: ModelsFiltersProps) {
  return (
    <div className="models-filters-container">
      <div className="models-filters-row">
        <div className="models-filter-group">
          <span className="models-filter-label">Capability:</span>
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

        <div className="models-filter-group">
          <span className="models-filter-label">Provider:</span>
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

      <div className="models-count">
        {modelCount} {modelCount === 1 ? 'model' : 'models'}
      </div>
    </div>
  );
}
