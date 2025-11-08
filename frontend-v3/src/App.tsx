import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from '@/pages/HomePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ProviderFormPage } from '@/pages/ProviderFormPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { BrowserGuidePage } from '@/pages/BrowserGuidePage';
import { DesktopGuidePage } from '@/pages/DesktopGuidePage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

function App() {
  useDarkMode();
  useWebSocket(); // Initialize WebSocket connection at app level
  const currentRoute = useUIStore((state) => state.currentRoute);
  const loadSettings = useUIStore((state) => state.loadSettings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  // Load persisted UI state and settings on mount
  useEffect(() => {
    loadSettings();
    fetchSettings();
  }, [loadSettings, fetchSettings]);

  const renderPage = () => {
    // Handle provider routes with IDs
    if (currentRoute.startsWith('/providers/')) {
      const path = currentRoute.substring('/providers/'.length);
      if (path === 'new') {
        return <ProviderFormPage />;
      } else if (path.endsWith('/edit')) {
        return <ProviderFormPage />;
      } else {
        return <ProviderFormPage readOnly={true} />;
      }
    }

    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/providers':
        return <ProvidersPage />;
      case '/models':
        return <ModelsPage />;
      case '/chat':
        return <ChatPage />;
      case '/settings':
        return <SettingsPage />;
      case '/browser-guide':
        return <BrowserGuidePage />;
      case '/desktop-guide':
        return <DesktopGuidePage />;
      default:
        return <HomePage />;
    }
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
