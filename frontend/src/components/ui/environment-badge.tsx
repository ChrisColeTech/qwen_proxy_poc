import { Badge } from './badge';

export function EnvironmentBadge() {
  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

  return (
    <Badge variant={isElectron ? 'default' : 'secondary'} className="gap-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
      </span>
      {isElectron ? 'Desktop' : 'Browser'}
    </Badge>
  );
}
