import { useState, useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useUIStore } from '@/stores/useUIStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from '@/pages/HomePage';
import { BrowserGuidePage } from '@/pages/BrowserGuidePage';
import { DesktopGuidePage } from '@/pages/DesktopGuidePage';
import { APIGuidePage } from '@/pages/APIGuidePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { ChatPage } from '@/pages/ChatPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  useDarkMode();
  const [currentRoute, setCurrentRoute] = useState('/');

  useEffect(() => {
    // Load settings once on mount
    useUIStore.getState().loadSettings();
  }, []);

  const renderPage = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage onNavigate={setCurrentRoute} />;
      case '/guide/browser':
        return <BrowserGuidePage onNavigate={setCurrentRoute} />;
      case '/guide/desktop':
        return <DesktopGuidePage onNavigate={setCurrentRoute} />;
      case '/guide/api':
        return <APIGuidePage onNavigate={setCurrentRoute} />;
      case '/providers':
        return <ProvidersPage />;
      case '/models':
        return <ModelsPage />;
      case '/chat':
        return <ChatPage />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <HomePage onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <>
      <AppLayout activeRoute={currentRoute} onNavigate={setCurrentRoute}>
        {renderPage()}
      </AppLayout>
      <Toaster />
    </>
  );
}

export default App;
