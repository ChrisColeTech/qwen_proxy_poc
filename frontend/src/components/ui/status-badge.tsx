import { Badge } from './badge';
import type { ReactNode } from 'react';

export type Status = 'active' | 'inactive' | 'expired' | 'running' | 'stopped' | 'none' | 'authenticated' | 'invalid';

interface StatusBadgeProps {
  status: Status;
  children?: ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const variantMap: Record<Status, 'default' | 'secondary' | 'destructive'> = {
    active: 'default',
    running: 'default',
    authenticated: 'default',
    inactive: 'secondary',
    stopped: 'secondary',
    none: 'secondary',
    expired: 'destructive',
    invalid: 'destructive',
  };

  const variant = variantMap[status];
  const text = children || status.charAt(0).toUpperCase() + status.slice(1);

  return <Badge variant={variant}>{text}</Badge>;
}
