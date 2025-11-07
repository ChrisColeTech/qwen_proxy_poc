import { TitleBar } from '@/components/layout/TitleBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUIStore } from '@/stores/useUIStore';

interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export function AppLayout({ children, activeRoute, onNavigate }: AppLayoutProps) {
  const sidebarPosition = useUIStore((state) => state.sidebarPosition);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        {sidebarPosition === 'left' && <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />}
        <main className="flex-1 overflow-auto">{children}</main>
        {sidebarPosition === 'right' && <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />}
      </div>
      <StatusBar />
    </div>
  );
}
