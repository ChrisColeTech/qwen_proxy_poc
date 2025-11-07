import { cn } from '@/lib/utils';

type Status = 'authenticated' | 'none' | 'invalid' | 'running' | 'stopped';

interface StatusBadgeProps {
  status: Status;
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const textClass: Record<Status, string> = {
    authenticated: 'status-success',
    running: 'status-success',
    none: 'status-neutral',
    stopped: 'status-neutral',
    invalid: 'status-error',
  };

  const dotClass: Record<Status, string> = {
    authenticated: 'status-success-dot',
    running: 'status-success-dot',
    none: 'status-neutral-dot',
    stopped: 'status-neutral-dot',
    invalid: 'status-error-dot',
  };

  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-medium', textClass[status])}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass[status])} />
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}
