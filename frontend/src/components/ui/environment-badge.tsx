import { Badge } from '@/components/ui/badge';
import { credentialsService } from '@/services/credentialsService';

export function EnvironmentBadge() {
  const isElectron = credentialsService.isElectron();

  return (
    <Badge variant="outline" className="gap-1.5 text-xs h-5">
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {isElectron ? 'Desktop' : 'Browser'}
    </Badge>
  );
}
