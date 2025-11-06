import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAlertStore } from '@/stores/useAlertStore';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export function StatusAlert() {
  const alert = useAlertStore((state) => state.alert);
  const hideAlert = useAlertStore((state) => state.hideAlert);

  if (!alert) return null;

  const Icon = alert.type === 'success' ? CheckCircle2 : XCircle;

  return (
    <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0" />
      <AlertDescription className="flex-1">{alert.message}</AlertDescription>
      <button
        onClick={hideAlert}
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
