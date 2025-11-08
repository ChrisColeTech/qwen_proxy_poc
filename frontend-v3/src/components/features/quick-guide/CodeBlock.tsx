import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { CodeBlockProps } from '@/types/quick-guide.types';

export function CodeBlock({ label, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-container">
      <div className="code-block-label">{label}</div>
      <div className="code-block-wrapper">
        <pre className="code-block-pre">
          <code className="code-block-code">{code}</code>
        </pre>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          className="code-block-copy-button"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 status-icon-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
