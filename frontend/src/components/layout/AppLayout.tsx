import type { ReactNode } from 'react';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { useUIStore } from '@/stores/useUIStore';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);
  const showStatusBar = useUIStore((state) => state.uiState.showStatusBar);
  const isLeft = sidebarPosition === 'left';

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {isLeft && <Sidebar />}

        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {!isLeft && <Sidebar />}
      </div>

      {showStatusBar && <StatusBar />}
    </div>
  );
}
