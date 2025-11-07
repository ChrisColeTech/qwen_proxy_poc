import { TitleBar } from '@/components/layout/TitleBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUIStore } from '@/stores/useUIStore';
import type { AppLayoutProps } from '@/types/layout.types';

export function AppLayout({ children, activeRoute, onNavigate }: AppLayoutProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);

  return (
    <div className="app-layout-root">
      <TitleBar />
      <div className="app-layout-body">
        {sidebarPosition === 'left' && (
          <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />
        )}
        <main className="app-layout-main">
          {children}
        </main>
        {sidebarPosition === 'right' && (
          <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />
        )}
      </div>
      <StatusBar />
    </div>
  );
}
