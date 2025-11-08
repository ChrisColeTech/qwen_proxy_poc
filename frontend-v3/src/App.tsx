import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { BrowserGuidePage } from '@/pages/BrowserGuidePage';
import { DesktopGuidePage } from '@/pages/DesktopGuidePage';
import { useUIStore } from '@/stores/useUIStore';

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
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
