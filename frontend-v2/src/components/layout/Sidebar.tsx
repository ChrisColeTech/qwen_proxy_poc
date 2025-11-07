import { Home, BookOpen, Blocks, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

const navItems = [
  { route: '/', icon: Home, label: 'Home' },
  { route: '/guide', icon: BookOpen, label: 'Quick Guide' },
  { route: '/providers', icon: Blocks, label: 'Providers' },
  { route: '/models', icon: Cpu, label: 'Models' },
];

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const sidebarPosition = useUIStore((state) => state.sidebarPosition);

  return (
    <div
      className={cn(
        'w-12 bg-background flex flex-col items-center py-2 gap-1',
        sidebarPosition === 'left' ? 'border-r' : 'border-l',
        'border-border'
      )}
    >
      {navItems.map(({ route, icon: Icon, label }) => {
        const isActive = activeRoute === route;
        return (
          <div key={route} className="relative w-full flex items-center justify-center">
            {isActive && (
              <div
                className={cn(
                  'absolute w-1 h-8 bg-primary rounded-full',
                  sidebarPosition === 'left' ? 'left-0' : 'right-0'
                )}
              />
            )}
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onNavigate(route)}
              title={label}
              className="w-10 h-10"
            >
              <Icon className="h-5 w-5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
