import { useUIStore } from '@/stores/useUIStore';

export function StatusBar() {
  const statusMessage = useUIStore((state) => state.statusMessage);

  return (
    <div className="h-6 bg-muted border-t border-border px-4 flex items-center justify-end text-xs text-muted-foreground">
      <span>{statusMessage}</span>
    </div>
  );
}
