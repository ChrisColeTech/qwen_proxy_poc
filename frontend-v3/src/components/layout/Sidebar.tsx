import { Home, HelpCircle, Network, Database, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { isElectron } from '@/utils/platform';

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
  requiresServer?: boolean;
}

const mainNavItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home', route: '/', requiresServer: true },
  { id: 'providers', icon: Network, label: 'Providers', route: '/providers', requiresServer: true },
  { id: 'models', icon: Database, label: 'Models', route: '/models', requiresServer: true },
  { id: 'chat', icon: MessageSquare, label: 'Chat', route: '/chat', requiresServer: true },
];

const guideNavItems: NavItem[] = [
  { id: 'guide-browser', icon: HelpCircle, label: 'Browser Guide', route: '/browser-guide' },
  { id: 'guide-desktop', icon: HelpCircle, label: 'Desktop Guide', route: '/desktop-guide' },
];

export function Sidebar() {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);
  const activeRoute = useUIStore((state) => state.currentRoute);
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const connected = useProxyStore((state) => state.connected);
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);

  // Different buttons have different requirements:
  // - Home: Requires API server only
  // - Everything else: Requires API server AND proxy running
  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const activeGuideItem = guideNavItems.find(item => {
    if (isElectron()) {
      return item.id === 'guide-desktop';
    } else {
      return item.id === 'guide-browser';
    }
  });

  const isSettingsActive = activeRoute === '/settings';

  const getIndicatorClass = () => {
    return cn(
      'sidebar-nav-indicator',
      sidebarPosition === 'left' ? 'sidebar-nav-indicator-left' : 'sidebar-nav-indicator-right'
    );
  };

  return (
    <div className={cn(
      'sidebar sidebar-collapsed',
      sidebarPosition === 'left' ? 'border-r' : 'border-l'
    )}>
      <div className="sidebar-nav-container">
        {mainNavItems
          .filter(item => {
            if (!item.requiresServer) return true; // Always show if no server requirement
            if (!connected) return false; // Hide all server items if API offline
            if (item.id === 'home') return true; // Home only needs API server
            return proxyRunning; // Everything else needs proxy running
          })
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.route;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentRoute(item.route)}
                title={item.label}
                className={cn(
                  'sidebar-nav-button',
                  isActive ? 'sidebar-nav-button-active' : 'sidebar-nav-button-inactive'
                )}
              >
                {isActive && <div className={getIndicatorClass()} />}
                <Icon className="sidebar-icon h-6 w-6" />
              </button>
            );
          })}

        {activeGuideItem && (
          <button
            onClick={() => setCurrentRoute(activeGuideItem.route)}
            title={activeGuideItem.label}
            className={cn(
              'sidebar-guide-button',
              activeRoute === activeGuideItem.route
                ? 'sidebar-nav-button-active'
                : 'sidebar-nav-button-inactive'
            )}
          >
            {activeRoute === activeGuideItem.route && <div className={getIndicatorClass()} />}
            <activeGuideItem.icon className="sidebar-icon h-6 w-6" />
          </button>
        )}

        <button
          onClick={() => setCurrentRoute('/settings')}
          title="Settings"
          className={cn(
            'sidebar-settings-button',
            isSettingsActive
              ? 'sidebar-nav-button-active'
              : 'sidebar-nav-button-inactive'
          )}
        >
          {isSettingsActive && <div className={getIndicatorClass()} />}
          <Settings className="sidebar-icon h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
