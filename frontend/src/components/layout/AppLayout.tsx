import { type ReactNode, useState } from 'react';
import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [activeNavItem, setActiveNavItem] = useState('dashboard');
  const sidebarSide = useUIStore((state) => state.uiState.sidebarSide);

  const handleNavigate = (itemId: string) => {
    setActiveNavItem(itemId);
    // TODO: Implement actual navigation logic
    console.log('Navigate to:', itemId);
  };

  return (
    <div className="layout-root">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarSide === 'left' && (
          <Sidebar activeItem={activeNavItem} onNavigate={handleNavigate} />
        )}
        <main className="layout-main">
          {children}
        </main>
        {sidebarSide === 'right' && (
          <Sidebar activeItem={activeNavItem} onNavigate={handleNavigate} />
        )}
      </div>
      <StatusBar />
    </div>
  );
}
