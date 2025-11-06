import { Home, BookOpen, Blocks, Cpu } from 'lucide-react';
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
  { id: 'home', icon: Home, label: 'Home', route: '/' },
  { id: 'guide', icon: BookOpen, label: 'Quick Guide', route: '/guide' },
  { id: 'providers', icon: Blocks, label: 'Providers', route: '/providers' },
  { id: 'models', icon: Cpu, label: 'Models', route: '/models' },
];

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);

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
    </div>
  );
}
