import { useUIStore } from '@/stores/useUIStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';

export function StatusBar() {
  const statusMessage = useUIStore((state) => state.statusMessage);

  return (
    <div className="h-6 bg-muted border-t border-border px-4 flex items-center justify-between text-xs text-muted-foreground">
      <EnvironmentBadge />
      <span>{statusMessage}</span>
    </div>
  );
}
