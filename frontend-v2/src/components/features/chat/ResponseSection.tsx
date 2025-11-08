import { Badge } from '@/components/ui/badge';
import { MessageSquare, RefreshCw } from 'lucide-react';
import type { ResponseSectionProps } from '@/types/components.types';

export function ResponseSection({ mainResponse, loading }: ResponseSectionProps) {
  return (
    <div className="chat-response-container">
      <div className="chat-response-header">
        <div className="chat-response-label">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="chat-response-label-text">Response</span>
        </div>
        {loading && (
          <Badge variant="secondary" className="chat-response-badge">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Waiting...
          </Badge>
        )}
      </div>
      {mainResponse && (
        <div className="chat-response-content">{mainResponse}</div>
      )}
      {loading && !mainResponse && (
        <div className="chat-response-loading">
          Sending request...
        </div>
      )}
    </div>
  );
}
