# Quick-Guide Code Reference Guide

## 1. Type Definitions to Create in V2

### quick-guide.types.ts
Location: `/frontend-v2/src/types/quick-guide.types.ts`

```typescript
// Re-export shared types from providers.types and models.types
export type { Provider } from '@/types/providers.types';
export type { Model, ParsedModel } from '@/types/models.types';

export interface ModelsStepProps {
  models: Model[];
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}

export interface ChatCompletionStepProps {
  response: string;
  loading: boolean;
  onTest: () => void;
  providerRouterUrl: string;
  activeModel?: string;
}

export interface ProviderSwitchStepProps {
  providers: Provider[];
  activeProvider: string;
  loading: boolean;
  onSwitch: (providerId: string) => void;
  apiBaseUrl: string;
}

export interface CodeBlockProps {
  label: string;
  code: string;
}
```

### chat.types.ts (Update existing or create)
Location: `/frontend-v2/src/types/chat.types.ts`

```typescript
export interface ParsedChatResponse {
  thinking: string | null;
  mainResponse: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## 2. Chat Service (NEW - Must Create)

### chat.service.ts
Location: `/frontend-v2/src/services/chat.service.ts`

```typescript
import type { ParsedChatResponse } from '@/types/chat.types';

class ChatService {
  async testChat(providerRouterUrl: string, model?: string): Promise<string> {
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model: model || 'qwen3-max',
          messages: [{ role: 'user', content: 'Say hello in one sentence' }]
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      return 'Error: No response from server';
    } catch (error) {
      console.error('Failed to test chat:', error);
      return 'Error: Could not connect to Provider Router';
    }
  }

  async sendChatRequest(
    providerRouterUrl: string,
    model: string,
    prompt: string
  ): Promise<string> {
    try {
      const response = await fetch(`${providerRouterUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer any-key'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      return 'Error: No response from server';
    } catch (error) {
      console.error('Failed to send chat:', error);
      return 'Error: Could not connect to Provider Router';
    }
  }

  parseResponse(text: string): ParsedChatResponse {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);

    if (thinkMatch) {
      const thinking = thinkMatch[1].trim();
      const mainResponse = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      return { thinking, mainResponse };
    }

    return { thinking: null, mainResponse: text };
  }
}

export const chatService = new ChatService();
```

---

## 3. Chat Test Hook (NEW - Must Create)

### useChatTest.ts
Location: `/frontend-v2/src/hooks/useChatTest.ts`

```typescript
import { useState } from 'react';
import { chatService } from '@/services/chat.service';

export function useChatTest() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testChat = async (providerRouterUrl: string, model?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await chatService.testChat(providerRouterUrl, model);
      setResponse(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to test chat';
      setError(errorMsg);
      setResponse('');
    } finally {
      setLoading(false);
    }
  };

  return {
    response,
    loading,
    error,
    testChat,
  };
}
```

---

## 4. Tabs Component (MUST PORT FROM V1 OR ADD)

### tabs.tsx
Location: `/frontend-v2/src/components/ui/tabs.tsx`

This needs to be ported from `/frontend/src/components/ui/tabs.tsx` 

Key content:
- Uses Radix UI React Tabs primitive
- Exports: Tabs, TabsList, TabsTrigger, TabsContent
- Provides styling through classnames

---

## 5. CodeBlock Component

### CodeBlock.tsx
Location: `/frontend-v2/src/components/features/quick-guide/CodeBlock.tsx`

```typescript
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
```

---

## 6. BrowserGuideStep Component (Simple Presentational)

### BrowserGuideStep.tsx
Location: `/frontend-v2/src/components/features/quick-guide/BrowserGuideStep.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Chrome, CheckCircle, ArrowRight } from 'lucide-react';

export function BrowserGuideStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="card-title-with-icon">
          <Globe className="icon-sm" />
          Browser Quick Start - Get Running in 60 Seconds
        </CardTitle>
      </CardHeader>
      <CardContent className="vspace-md">
        <p className="step-description">
          Use the Chrome extension to extract Qwen credentials and proxy requests to Qwen's API.
          The extension handles authentication automatically after you log in.
        </p>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <Chrome className="icon-sm-muted" />
              <span className="demo-label-text">Step 1: Install Chrome Extension (First Time)</span>
            </div>
          </div>
          <div className="guide-step-list">
            {/* Steps here - same as v1 */}
          </div>
        </div>
        
        {/* Additional sections... */}
      </CardContent>
    </Card>
  );
}
```

---

## 7. ChatCompletionStep Component (Interactive)

### ChatCompletionStep.tsx
Location: `/frontend-v2/src/components/features/quick-guide/ChatCompletionStep.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw, Zap, Database } from 'lucide-react';
import type { ChatCompletionStepProps } from '@/types/quick-guide.types';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';

export function ChatCompletionStep({ 
  response, 
  loading, 
  onTest, 
  providerRouterUrl, 
  activeModel 
}: ChatCompletionStepProps) {
  const modelToUse = activeModel || 'qwen3-max';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4" />
          Test Chat Completion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CodeBlock
          label="Try it yourself:"
          code={`curl ${providerRouterUrl || 'http://localhost:3001'}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{
    "model": "${modelToUse}",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence"}
    ]
  }'`}
        />

        <p className="step-description">
          Send a chat completion request to the active provider. The Provider Router automatically 
          routes your request based on the configured provider.
        </p>

        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-label">
              <Zap className="h-4 w-4 text-primary" />
              <span className="demo-label-text">Test Response</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Database className="h-3 w-3" />
                {modelToUse}
              </Badge>
              {loading && (
                <Badge variant="secondary" className="gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Waiting...
                </Badge>
              )}
              <Button
                onClick={onTest}
                disabled={loading}
                size="icon"
                variant="outline"
                title="Test chat completion"
                className="h-7 w-7"
              >
                {loading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          {response && (
            <div className="demo-content">{response}</div>
          )}
          {!response && !loading && (
            <div className="demo-empty-state">
              Click the <Play className="status-icon-inline" /> button above to test a chat completion
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 8. ProviderSwitchStep Component (Uses Tabs)

### ProviderSwitchStep.tsx
Location: `/frontend-v2/src/components/features/quick-guide/ProviderSwitchStep.tsx`

Key imports needed:
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock';
```

Structure:
- First verify Tabs component is available
- If not, consider restructuring without tabs or porting it
- Rest of component can be copy-pasted from v1 with import updates

---

## 9. Key CSS Classes Needed

All quick-guide components use these CSS classes. Ensure these are defined:

```css
/* Demo containers */
.demo-container { }
.demo-header { }
.demo-label { }
.demo-label-text { }
.demo-content { }
.demo-empty-state { }
.demo-error-state { }

/* Guide steps */
.guide-step-list { }
.guide-step-item { }
.guide-step-text { }
.guide-step-icon { }

/* Benefits grid */
.guide-benefits-grid { }
.guide-benefit-item { }
.guide-benefit-title { }
.guide-benefit-description { }
.guide-benefit-icon { }

/* Models list */
.model-list-container { }
.model-item { }
.model-item-code { }

/* Provider switch */
.provider-switch-list { }
.provider-switch-item { }
.provider-switch-item-active { }
.provider-switch-info { }
.provider-switch-details { }
.provider-switch-name { }
.provider-switch-type { }
.provider-switch-actions { }

/* Code block */
.code-block-container { }
.code-block-label { }
.code-block-wrapper { }
.code-block-pre { }
.code-block-code { }
.code-block-copy-button { }

/* Typography */
.step-description { }
.step-inline-code { }
.card-title-with-icon { }
.icon-sm { }
.icon-sm-muted { }
.vspace-md { }
.vspace-sm { }
.status-icon-inline { }
.status-icon-success { }
.text-setting-description { }
```

---

## 10. Service Updates Required

### Update models.service.ts endpoint
**Current (likely):**
```typescript
const response = await fetch(`${API_BASE_URL}/api/models`);
```

**Check if this should be:**
```typescript
// For provider router models
const response = await fetch(`${providerRouterUrl}/v1/models`);

// OR for backend API models
const response = await fetch(`${API_BASE_URL}/api/models`);
```

### Verify providers.service.ts
Endpoints should match:
```typescript
GET    ${API_URL}/api/providers
POST   ${API_URL}/api/providers/{id}/enable
POST   ${API_URL}/api/providers/{id}/disable
POST   ${API_URL}/api/providers/{id}/test
```

---

## 11. Store Integration Notes

### V1 Pattern (to be replaced):
```typescript
const { settings, fetchSettings } = useSettingsStore();
const { providerRouterUrl } = useSettingsStore();
```

### V2 Pattern (verify):
```typescript
// Check how to get active provider and URLs in v2
// Likely through useProxyStore or environment variables
const { status } = useProxyStore();
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## 12. Routing/Navigation Updates

### V1 Pattern:
```typescript
const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
setCurrentRoute('/providers');
```

### V2 Pattern (likely):
```typescript
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/providers');
```

---

## Summary of Code Changes Required

1. **Port 7 React components** - Mostly copy/paste with import updates
2. **Create 1 service** - chatService from v1 code
3. **Create 1 hook** - useChatTest from v1 code
4. **Port 1 UI component** - tabs.tsx 
5. **Create/verify types** - 4 prop interfaces
6. **Update 2 services** - models and providers endpoint verification
7. **Refactor 1 component** - ExploreSection for new routing
8. **Verify CSS classes** - Ensure all custom classes are defined

All source code can be found in original v1 files. This is largely a migration task with minimal new code to write.

---

For detailed component breakdown, see QUICK_GUIDE_MIGRATION_ANALYSIS.md
