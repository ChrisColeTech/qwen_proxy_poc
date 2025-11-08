import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';

export function useModelsPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleModelClick = (modelId: string) => {
    console.log('Model clicked:', modelId);
    useAlertStore.showAlert(`Selected model: ${modelId}`, 'success');
  };

  // Example: Fetch models data would go here
  useEffect(() => {
    // TODO: Fetch models from API
  }, []);

  return {
    selectedFilter,
    searchQuery,
    handleFilterChange,
    handleSearch,
    handleModelClick,
  };
}
