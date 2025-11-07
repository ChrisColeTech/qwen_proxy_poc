import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

interface EndpointUrlSectionProps {
  endpointUrl: string;
  onCopy: () => void;
}

export function EndpointUrlSection({ endpointUrl, onCopy }: EndpointUrlSectionProps) {
  return (
    <>
      <div className="h-px bg-border" />
      <div className="flex items-center justify-between gap-2">
        <code className="flex-1 rounded bg-muted px-3 py-1.5 text-xs font-mono truncate">
          {endpointUrl}
        </code>
        <Button
          onClick={onCopy}
          size="icon"
          variant="outline"
          title="Copy endpoint URL"
          className="h-8 w-8 shrink-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </>
  );
}
