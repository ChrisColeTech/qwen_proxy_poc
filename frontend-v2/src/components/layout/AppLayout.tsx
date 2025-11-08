import { TitleBar } from '@/components/layout/TitleBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUIStore } from '@/stores/useUIStore';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);

  return (
    <div className="app-layout-root">
      <TitleBar />
      <div className="app-layout-body">
        {sidebarPosition === 'left' && <Sidebar />}
        <main className="app-layout-main">
          {children}
        </main>
        {sidebarPosition === 'right' && <Sidebar />}
      </div>
      <StatusBar />
    </div>
  );
}
