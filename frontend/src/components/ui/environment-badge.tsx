import { Badge } from '@/components/ui/badge';
import { credentialsService } from '@/services/credentialsService';

export function EnvironmentBadge() {
  const isElectron = credentialsService.isElectron();

  return (
    <Badge variant={isElectron ? 'default' : 'secondary'} className="gap-2">
      <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
      {isElectron ? 'Desktop Mode' : 'Browser Mode'}
    </Badge>
  );
}
