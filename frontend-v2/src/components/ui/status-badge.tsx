import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import type { badgeVariants } from '@/components/ui/badge';

type Status = 'active' | 'inactive' | 'expired' | 'running' | 'stopped';

interface StatusBadgeProps {
  status: Status;
  children?: React.ReactNode;
}

const statusToVariant: Record<Status, VariantProps<typeof badgeVariants>['variant']> = {
  active: 'default',
  running: 'default',
  inactive: 'secondary',
  stopped: 'secondary',
  expired: 'destructive',
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const variant = statusToVariant[status];
  const displayText = children || status.charAt(0).toUpperCase() + status.slice(1);

  return <Badge variant={variant}>{displayText}</Badge>;
}
