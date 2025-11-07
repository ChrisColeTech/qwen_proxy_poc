import { Home, HelpCircle, Code, Network, Database, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import type { SidebarProps } from '@/types/layout.types';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
}

const isElectron = () => {
  return typeof window !== 'undefined' && (window as any).electronAPI;
};

const mainNavItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home', route: '/' },
  { id: 'guide-api', icon: Code, label: 'API Guide', route: '/guide/api' },
  { id: 'providers', icon: Network, label: 'Providers', route: '/providers' },
  { id: 'models', icon: Database, label: 'Models', route: '/models' },
  { id: 'chat', icon: MessageSquare, label: 'Chat', route: '/chat' },
];

const guideNavItems: NavItem[] = [
  { id: 'guide-browser', icon: HelpCircle, label: 'Browser Guide', route: '/guide/browser' },
  { id: 'guide-desktop', icon: HelpCircle, label: 'Desktop Guide', route: '/guide/desktop' },
];

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);

  // Filter guide items based on environment
  const activeGuideItem = guideNavItems.find(item => {
    if (isElectron()) {
      // In Electron, show Desktop Guide
      return item.id === 'guide-desktop';
    } else {
      // In browser, show Browser Guide
      return item.id === 'guide-browser';
    }
  });

  const isSettingsActive = activeRoute === '/settings';

  return (
    <div className={cn(
      'sidebar sidebar-collapsed',
      sidebarPosition === 'left' ? 'border-r' : 'border-l'
    )}>
      <div className="flex flex-col items-center pt-2 flex-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.route;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.route)}
              title={item.label}
              className={cn(
                'w-full h-12 flex items-center justify-center transition-colors relative group',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <div className={cn(
                  'absolute w-0.5 h-12 bg-primary',
                  sidebarPosition === 'left' ? 'left-0' : 'right-0'
                )} />
              )}
              <Icon className="sidebar-icon h-6 w-6" />
            </button>
          );
        })}

        {activeGuideItem && (
          <button
            onClick={() => onNavigate(activeGuideItem.route)}
            title={activeGuideItem.label}
            className={cn(
              'w-full h-12 flex items-center justify-center transition-colors relative group mt-auto border-t border-border',
              activeRoute === activeGuideItem.route
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {activeRoute === activeGuideItem.route && (
              <div className={cn(
                'absolute w-0.5 h-12 bg-primary',
                sidebarPosition === 'left' ? 'left-0' : 'right-0'
              )} />
            )}
            <activeGuideItem.icon className="sidebar-icon h-6 w-6" />
          </button>
        )}

        <button
          onClick={() => onNavigate('/settings')}
          title="Settings"
          className={cn(
            'w-full h-12 flex items-center justify-center transition-colors relative group mb-2',
            isSettingsActive
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {isSettingsActive && (
            <div className={cn(
              'absolute w-0.5 h-12 bg-primary',
              sidebarPosition === 'left' ? 'left-0' : 'right-0'
            )} />
          )}
          <Settings className="sidebar-icon h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
