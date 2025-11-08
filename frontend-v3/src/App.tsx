import { useDarkMode } from '@/hooks/useDarkMode';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { QuickGuidePage } from '@/pages/QuickGuidePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { useUIStore } from '@/stores/useUIStore';

function App() {
  useDarkMode();
  const currentRoute = useUIStore((state) => state.currentRoute);

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
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
