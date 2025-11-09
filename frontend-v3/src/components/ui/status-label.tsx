import type { ReactNode } from 'react';

export type Status = 'active' | 'inactive' | 'expired' | 'running' | 'stopped' | 'none' | 'authenticated' | 'invalid';

interface StatusLabelProps {
  status: Status;
  children?: ReactNode;
}

export function StatusLabel({ status, children }: StatusLabelProps) {
  // Use theme foreground color for normal states, destructive for errors/disconnected
  const isError = status === 'expired' || status === 'invalid' || status === 'stopped' || status === 'inactive' || status === 'none';
  const textColor = isError ? 'text-destructive' : 'text-foreground';

  const text = children || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className={`flex items-center gap-2 flex-shrink-0 min-w-0 ${textColor}`}>
      {/* Pulsing indicator */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
      </span>
      {/* Text label - hidden on small screens, visible on larger screens */}
      <span className="hidden sm:inline text-sm whitespace-nowrap">
        {text}
      </span>
    </div>
  );
}
