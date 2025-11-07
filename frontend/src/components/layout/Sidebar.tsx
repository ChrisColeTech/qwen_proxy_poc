import { Activity, Globe, Monitor, Code, Network, Database, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';

interface SidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Activity, label: 'Home', route: '/' },
  { id: 'guide-browser', icon: Globe, label: 'Browser Guide', route: '/guide/browser' },
  { id: 'guide-desktop', icon: Monitor, label: 'Desktop Guide', route: '/guide/desktop' },
  { id: 'guide-api', icon: Code, label: 'API Guide', route: '/guide/api' },
  { id: 'providers', icon: Network, label: 'Providers', route: '/providers' },
  { id: 'models', icon: Database, label: 'Models', route: '/models' },
  { id: 'chat', icon: MessageSquare, label: 'Chat', route: '/chat' },
];

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);
  const isSettingsActive = activeRoute === '/settings';

  return (
    <div className={cn(
      'w-12 bg-card flex flex-col items-center pt-2',
      sidebarPosition === 'left' ? 'border-r' : 'border-l'
    )}>
      {navItems.map((item) => {
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
            <Icon className="h-6 w-6" />
          </button>
        );
      })}

      <button
        onClick={() => onNavigate('/settings')}
        title="Settings"
        className={cn(
          'w-full h-12 flex items-center justify-center transition-colors relative group mt-auto mb-2 border-t border-border pt-2',
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
        <Settings className="h-6 w-6" />
      </button>
    </div>
  );
}
