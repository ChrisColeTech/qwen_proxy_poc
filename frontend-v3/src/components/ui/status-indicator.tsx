import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'warning' | 'error' | 'inactive' | 'running' | 'stopped' | 'invalid' | 'none' | 'authenticated';

interface StatusIndicatorProps {
  status: StatusType;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({ status, pulse = true, className }: StatusIndicatorProps) {
  const colorMap: Record<StatusType, string> = {
    success: 'bg-green-500',
    running: 'bg-green-500',
    authenticated: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    invalid: 'bg-red-500',
    inactive: 'bg-gray-400',
    stopped: 'bg-gray-400',
    none: 'bg-gray-400',
  };

  const color = colorMap[status];

  return (
    <span className={cn('relative flex h-3 w-3', className)}>
      {pulse && (
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            color
          )}
        ></span>
      )}
      <span className={cn('relative inline-flex rounded-full h-3 w-3', color)}></span>
    </span>
  );
}
