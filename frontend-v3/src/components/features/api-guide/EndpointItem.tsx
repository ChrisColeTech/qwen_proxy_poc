import { CheckCircle } from 'lucide-react';

interface EndpointItemProps {
  endpoint: string;
  description: string;
}

export function EndpointItem({ endpoint, description }: EndpointItemProps) {
  return (
    <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div className="space-y-1 flex-1">
        <code className="text-sm font-mono">{endpoint}</code>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
