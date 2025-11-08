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
    <div className={cn('flex items-center font-medium min-w-0', textClass[status])} style={{
      gap: 'clamp(0.25rem, 0.5vw, 0.375rem)',
      fontSize: 'inherit'
    }}>
      <span className={cn('rounded-full flex-shrink-0', dotClass[status])} style={{
        height: 'clamp(0.25rem, 1vw, 0.375rem)',
        width: 'clamp(0.25rem, 1vw, 0.375rem)'
      }} />
      <span className="whitespace-nowrap">
        {children || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}
