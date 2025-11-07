import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';

interface BaseUrlSectionProps {
  baseUrl: string;
}

export function BaseUrlSection({ baseUrl }: BaseUrlSectionProps) {
  const { showAlert } = useAlertStore;
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    showAlert('Base URL copied to clipboard', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Base URL</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono">
          {baseUrl}/v1
        </code>
        <Button
          onClick={handleCopyUrl}
          size="icon"
          variant="outline"
          title="Copy base URL"
          className="h-10 w-10 shrink-0"
        >
          {copiedUrl ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Authentication happens through stored Qwen credentials, so you can use any string as the API key.
      </p>
    </div>
  );
}
