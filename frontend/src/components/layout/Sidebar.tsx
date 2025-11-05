import { Home, Server, Lock, Database, Layers, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'proxy', label: 'Proxy Status', icon: Activity },
  { id: 'credentials', label: 'Credentials', icon: Lock },
  { id: 'providers', label: 'Providers', icon: Database },
  { id: 'models', label: 'Models', icon: Layers },
  { id: 'api-server', label: 'API Server', icon: Server },
];

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (itemId: string) => void;
}

export function Sidebar({ activeItem = 'dashboard', onNavigate }: SidebarProps) {
  const sidebarSide = useUIStore((state) => state.uiState.sidebarSide);

  return (
    <aside className={cn('sidebar', sidebarSide === 'left' ? 'sidebar-left' : 'sidebar-right')}>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              className={cn('sidebar-item', isActive && 'sidebar-item-active')}
              onClick={() => onNavigate?.(item.id)}
              title={item.label}
            >
              <Icon className="sidebar-icon" />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
