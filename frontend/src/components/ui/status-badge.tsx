import { Badge } from '@/components/ui/badge';

type Status = 'active' | 'inactive' | 'expired' | 'running' | 'stopped';

interface StatusBadgeProps {
  status: Status;
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const variantMap: Record<Status, 'default' | 'secondary' | 'destructive'> = {
    active: 'default',
    running: 'default',
    inactive: 'secondary',
    stopped: 'secondary',
    expired: 'destructive',
  };

  return (
    <Badge variant={variantMap[status]}>
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
