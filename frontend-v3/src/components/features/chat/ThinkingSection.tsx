import { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import type { ThinkingSectionProps } from '@/types/components.types';

export function ThinkingSection({ thinking }: ThinkingSectionProps) {
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div className="chat-thinking-container">
      <button
        onClick={() => setShowThinking(!showThinking)}
        className="chat-thinking-header"
      >
        <div className="chat-thinking-label">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <span className="chat-thinking-label-text">Thinking Process</span>
        </div>
        {showThinking ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {showThinking && (
        <div className="chat-thinking-content">
          {thinking}
        </div>
      )}
    </div>
  );
}
