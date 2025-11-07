import { Badge } from '@/components/ui/badge';

export function EnvironmentBadge() {
  const isElectron = window.electronAPI !== undefined;

  return (
    <Badge variant={isElectron ? 'default' : 'secondary'} className="gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${isElectron ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      {isElectron ? 'Desktop' : 'Browser'}
    </Badge>
  );
}
