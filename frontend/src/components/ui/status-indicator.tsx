import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'expired' | 'running' | 'stopped';
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'active':
      case 'running':
        return 'bg-green-500';
      case 'expired':
        return 'bg-yellow-500';
      case 'inactive':
      case 'stopped':
        return 'bg-red-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full animate-pulse',
        getStatusColor(),
        className
      )}
    />
  );
}
