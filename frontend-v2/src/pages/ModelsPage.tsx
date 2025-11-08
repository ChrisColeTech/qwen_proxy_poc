import { TabCard } from '@/components/ui/tab-card';
import { Database } from 'lucide-react';

export function ModelsPage() {
  const tabs = [
    {
      value: 'select',
      label: 'Select Model',
      description: 'The Provider Router exposes an OpenAI-compatible endpoint at http://localhost:3001/v1. Select an active model to use:',
      contentCardTitle: 'Available Models',
      contentCardIcon: Database,
      content: <div className="p-4">Model list content</div>,
    },
    {
      value: 'browse',
      label: 'Browse Models',
      description: 'Browse and filter available models:',
      contentCardTitle: 'Browse Models',
      contentCardIcon: Database,
      content: <div className="p-4">Browse models content</div>,
    },
    {
      value: 'curl',
      label: 'Try It Yourself',
      description: 'Check which models are available via the API:',
      content: <div>Curl examples</div>,
    },
  ];

  return (
    <div className="page-container">
      <TabCard title="Models" icon={Database} tabs={tabs} defaultTab="select" />
    </div>
  );
}
