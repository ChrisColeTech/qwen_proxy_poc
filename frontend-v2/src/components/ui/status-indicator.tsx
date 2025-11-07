import { cn } from '@/lib/utils';

type StatusType = 'success' | 'warning' | 'error' | 'inactive';

interface StatusIndicatorProps {
  status: StatusType;
  animated?: boolean;
  className?: string;
}

const statusColors: Record<StatusType, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  inactive: 'bg-gray-400',
};

export function StatusIndicator({ status, animated = false, className }: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        statusColors[status],
        animated && 'animate-pulse',
        className
      )}
    />
  );
}
