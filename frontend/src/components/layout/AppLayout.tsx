import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/stores/useUIStore';
import { HomePage } from '@/pages/HomePage';
import { ProxyStatusPage } from '@/pages/ProxyStatusPage';
import { CredentialsPage } from '@/pages/CredentialsPage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { ApiServerPage } from '@/pages/ApiServerPage';

export function AppLayout() {
  const sidebarSide = useUIStore((state) => state.uiState.sidebarSide);
  const currentPage = useUIStore((state) => state.uiState.currentPage);
  const setCurrentPage = useUIStore((state) => state.setCurrentPage);

  const handleNavigate = (itemId: string) => {
    setCurrentPage(itemId as any);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <HomePage />;
      case 'proxy':
        return <ProxyStatusPage />;
      case 'credentials':
        return <CredentialsPage />;
      case 'providers':
        return <ProvidersPage />;
      case 'models':
        return <ModelsPage />;
      case 'api-server':
        return <ApiServerPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="layout-root">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarSide === 'left' && (
          <Sidebar activeItem={currentPage} onNavigate={handleNavigate} />
        )}
        <main className="layout-main">
          {renderPage()}
        </main>
        {sidebarSide === 'right' && (
          <Sidebar activeItem={currentPage} onNavigate={handleNavigate} />
        )}
      </div>
      <StatusBar />
    </div>
  );
}
