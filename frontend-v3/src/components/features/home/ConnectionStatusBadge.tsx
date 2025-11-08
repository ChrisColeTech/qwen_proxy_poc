import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusBadgeProps {
  status: string;
}

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  const variants = {
    connected: { variant: 'default' as const, icon: CheckCircle, text: 'Connected', className: 'connection-status-connected' },
    disconnected: { variant: 'destructive' as const, icon: XCircle, text: 'Disconnected', className: '' },
    reconnecting: { variant: 'secondary' as const, icon: AlertCircle, text: 'Reconnecting...', className: 'connection-status-reconnecting' },
  };

  const config = variants[status as keyof typeof variants] || variants.disconnected;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="connection-status-icon" />
      {config.text}
    </Badge>
  );
}
