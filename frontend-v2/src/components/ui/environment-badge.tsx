import { credentialsService } from '@/services/credentialsService';

export function EnvironmentBadge() {
  const isElectron = credentialsService.isElectron();

  return (
    <div className="flex items-center font-medium min-w-0 status-info" style={{
      gap: 'clamp(0.25rem, 0.5vw, 0.375rem)',
      fontSize: 'inherit'
    }}>
      <span className="rounded-full flex-shrink-0 status-info-dot" style={{
        height: 'clamp(0.25rem, 1vw, 0.375rem)',
        width: 'clamp(0.25rem, 1vw, 0.375rem)'
      }} />
      <span className="whitespace-nowrap">
        {isElectron ? 'Desktop' : 'Browser'}
      </span>
    </div>
  );
}
