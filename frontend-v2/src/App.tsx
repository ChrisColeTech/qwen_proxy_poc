import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from '@/pages/HomePage';
import { QuickGuidePage } from '@/pages/QuickGuidePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ProviderDetailPage } from '@/pages/ProviderDetailPage';
import { ProviderEditPage } from '@/pages/ProviderEditPage';
import { ProviderCreatePage } from '@/pages/ProviderCreatePage';
import { ModelsPage } from '@/pages/ModelsPage';
import { EventLogPage } from '@/pages/EventLogPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { APIGuidePage } from '@/pages/APIGuidePage';
import { BrowserGuidePage } from '@/pages/BrowserGuidePage';
import { DesktopGuidePage } from '@/pages/DesktopGuidePage';
import { useUIStore } from '@/stores/useUIStore';
import { matchRoute } from '@/lib/router';

function App() {
  useDarkMode();
  useWebSocket(); // Initialize WebSocket connection at app level

  const currentRoute = useUIStore((state) => state.currentRoute);
  const loadSettings = useUIStore((state) => state.loadSettings);

  // Load persisted UI state on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const renderPage = () => {
    // Check static routes FIRST before trying dynamic patterns
    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/guide':
        return <QuickGuidePage />;
      case '/providers':
        return <ProvidersPage />;
      case '/providers/new':
        return <ProviderCreatePage />;
      case '/models':
        return <ModelsPage />;
      case '/events':
        return <EventLogPage />;
      case '/settings':
        return <SettingsPage />;
      case '/chat':
        return <ChatPage />;
      case '/api-guide':
        return <APIGuidePage />;
      case '/browser-guide':
        return <BrowserGuidePage />;
      case '/desktop-guide':
        return <DesktopGuidePage />;
    }

    // Try dynamic routes after static routes
    const editMatch = matchRoute('/providers/:id/edit', currentRoute);
    if (editMatch.matched) {
      return <ProviderEditPage providerId={editMatch.params.id} />;
    }

    const detailMatch = matchRoute('/providers/:id', currentRoute);
    if (detailMatch.matched) {
      return <ProviderDetailPage providerId={detailMatch.params.id} />;
    }

    // Default fallback
    return <HomePage />;
  };

  return (
    <>
      <AppLayout>
        {renderPage()}
      </AppLayout>
      <Toaster />
    </>
  );
}

export default App;
