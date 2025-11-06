import { credentialsService } from '@/services/credentialsService';

export function EnvironmentBadge() {
  const isElectron = credentialsService.isElectron();

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium status-info">
      <span className="h-1.5 w-1.5 rounded-full status-info-dot" />
      {isElectron ? 'Desktop' : 'Browser'}
    </div>
  );
}
