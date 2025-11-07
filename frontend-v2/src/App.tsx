import { useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { QuickGuidePage } from '@/pages/QuickGuidePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ModelsPage } from '@/pages/ModelsPage';

function App() {
  useDarkMode();
  useWebSocket(); // Initialize WebSocket connection at app level
  const [currentRoute, setCurrentRoute] = useState('/');

  const renderPage = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/guide':
        return <QuickGuidePage />;
      case '/providers':
        return <ProvidersPage />;
      case '/models':
        return <ModelsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <AppLayout activeRoute={currentRoute} onNavigate={setCurrentRoute}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
