import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'authenticated' | 'none' | 'invalid' | 'running' | 'stopped';
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const statusColorMap: Record<typeof status, string> = {
    authenticated: 'status-success-dot',
    running: 'status-success-dot',
    invalid: 'status-error-dot',
    none: 'status-neutral-dot',
    stopped: 'status-neutral-dot',
  };

  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full animate-pulse',
        statusColorMap[status],
        className
      )}
    />
  );
}
