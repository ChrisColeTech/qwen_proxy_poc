export function EnvironmentBadge() {
  const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

  return (
    <div className="flex items-center gap-2 flex-shrink-0 min-w-0 text-foreground">
      {/* Pulsing indicator */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
      </span>
      {/* Text label - hidden on small screens, visible on larger screens */}
      <span className="hidden sm:inline text-sm whitespace-nowrap">
        {isElectron ? 'Desktop' : 'Browser'}
      </span>
    </div>
  );
}
