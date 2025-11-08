# Quick-Guide Components - At-a-Glance Summary

## Component Breakdown Table

| Component | Type | Purpose | Key Prop Dependencies | Services Used | Complexity |
|-----------|------|---------|----------------------|-----------------|------------|
| **BrowserGuideStep** | Presentational | Installation instructions | None | None | Very Low |
| **DesktopGuideStep** | Presentational | Desktop app benefits | None | None | Very Low |
| **ChatCompletionStep** | Interactive | Test chat API | response, loading, onTest, model | chatService | Medium |
| **ModelsStep** | Interactive | List & select models | models[], loading, onRefresh, onSelectModel | modelsService | Medium |
| **ProviderSwitchStep** | Interactive + Tabs | Switch providers | providers[], activeProvider, onSwitch | providersService | High |
| **CodeBlock** | Utility | Display code snippets | label, code | None | Low |
| **ExploreSection** | Navigation | Link to features | None | useUIStore | Low |

## Dependency Tree

```
ChatCompletionStep
└── chatService.testChat()
    └── Provider Router: /v1/chat/completions

ModelsStep
├── modelsService.getModels()
│   └── Provider Router: /v1/models
└── onSelectModel callback

ProviderSwitchStep
├── providersService.getProviders()
│   └── API: /api/providers
├── providersService.switchProvider()
│   └── API: /api/settings/active_provider (PUT)
├── CodeBlock component
└── Tabs component (UI)

ExploreSection
└── useUIStore.setCurrentRoute()
    └── Routes: /providers, /models, /chat

CodeBlock
└── navigator.clipboard API
```

## V1 vs V2 - Quick Comparison

### What Stays the Same
- Component visual structure (Card-based layouts)
- Lucide icon usage
- Button and Badge UI components
- CodeBlock utility component
- Basic PropTypes

### What Changes
| Aspect | V1 | V2 | Impact |
|--------|-----|-----|--------|
| **API Endpoints** | hardcoded localhost | VITE_API_BASE_URL | Update services |
| **Models endpoint** | /v1/models | /api/models | Update modelsService |
| **Settings Store** | useSettingsStore | WebSocket + stores | Refactor hooks |
| **Navigation** | setCurrentRoute | React Router | Refactor ExploreSection |
| **Chat Service** | chatService exists | MISSING | Create new |
| **Tabs Component** | Exists | MISSING | Port or restructure |
| **URL Management** | Settings-based | Part of config | Update patterns |

## Critical Missing Pieces

### In Frontend-V2:
1. **tabs.tsx** - UI component used by ProviderSwitchStep
2. **chat.service.ts** - Service for testing chat completions
3. **useChatTest.ts** - Hook for managing chat test state
4. **quick-guide.types.ts** - Type definitions (can integrate into existing types)

### To Verify:
- CSS classes for all quick-guide components
- Environment variable configuration
- API endpoint correctness
- Store integration for active provider/model

## Migration Priority Matrix

```
                HIGH EFFORT
                    │
     HIGH IMPACT ─ Priority 1 ─ Verify/Fix
                  │
              Priority 3 ─────── Priority 2
                  │                 │
                  └─────────────────┘
                LOW IMPACT

PRIORITY 1 (High Impact, Higher Effort):
  • Fix Tabs component issue
  • Create chat.service.ts
  • Update models endpoint
  • Store integration

PRIORITY 2 (High Impact, Lower Effort):
  • Port presentational components
  • Create type definitions
  • Update imports

PRIORITY 3 (Lower Impact):
  • CSS/styling verification
  • ExploreSection refactoring
  • Minor fixes
```

## File Changes Checklist

### New Files to Create
- [ ] `/frontend-v2/src/components/features/quick-guide/BrowserGuideStep.tsx`
- [ ] `/frontend-v2/src/components/features/quick-guide/DesktopGuideStep.tsx`
- [ ] `/frontend-v2/src/components/features/quick-guide/ChatCompletionStep.tsx`
- [ ] `/frontend-v2/src/components/features/quick-guide/ModelsStep.tsx`
- [ ] `/frontend-v2/src/components/features/quick-guide/ProviderSwitchStep.tsx`
- [ ] `/frontend-v2/src/components/features/quick-guide/CodeBlock.tsx`
- [ ] `/frontend-v2/src/components/features/quick-guide/ExploreSection.tsx`
- [ ] `/frontend-v2/src/components/ui/tabs.tsx` (or integrate from v1)
- [ ] `/frontend-v2/src/services/chat.service.ts` (NEW)
- [ ] `/frontend-v2/src/hooks/useChatTest.ts` (NEW)
- [ ] `/frontend-v2/src/types/quick-guide.types.ts` (or update existing)

### Files to Verify/Update
- [ ] `/frontend-v2/src/services/models.service.ts` - Check endpoints
- [ ] `/frontend-v2/src/services/providers.service.ts` - Check endpoints
- [ ] `/frontend-v2/src/hooks/useModels.ts` - Check implementation
- [ ] `/frontend-v2/src/hooks/useProviders.ts` - Check implementation
- [ ] `/frontend-v2/src/stores/useUIStore.ts` - Verify setCurrentRoute or replace with routing

### CSS/Styling Files to Check
- [ ] CSS classes: `demo-container`, `demo-header`, `demo-label`, etc.
- [ ] CSS classes: `guide-step-list`, `guide-step-item`, `guide-step-text`
- [ ] CSS classes: `guide-benefits-grid`, `guide-benefit-item`
- [ ] CSS classes: `model-list-container`, `model-item`
- [ ] CSS classes: `provider-switch-list`, `provider-switch-item`
- [ ] CSS classes: `code-block-*` classes

## Endpoint Reference

### V1 API Calls
```typescript
// Provider Router endpoints (port 3001)
GET  ${providerRouterUrl}/v1/models
POST ${providerRouterUrl}/v1/chat/completions

// Backend API endpoints (port 3002)
GET    http://localhost:3002/api/providers
GET    http://localhost:3002/api/settings
PUT    http://localhost:3002/api/settings/active_provider
GET    http://localhost:3002/api/settings/active_model
```

### V2 Expected Endpoints
```typescript
// Using VITE_API_BASE_URL environment variable
GET    ${API_URL}/api/providers
POST   ${API_URL}/api/providers/{id}/test
POST   ${API_URL}/api/providers/{id}/enable
POST   ${API_URL}/api/providers/{id}/disable

GET    ${API_URL}/api/models
GET    ${API_URL}/api/qwen/credentials

// Note: Provider Router endpoints may stay same
GET    ${PROVIDER_ROUTER_URL}/v1/models
POST   ${PROVIDER_ROUTER_URL}/v1/chat/completions
```

## Component Import Dependencies

### All Components Need
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// Lucide icons as needed
import { Globe, Chrome, // ... etc
```

### ChatCompletionStep Needs
```typescript
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock'
import type { ChatCompletionStepProps } from '@/types/quick-guide.types'
```

### ProviderSwitchStep Needs
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { CodeBlock } from '@/components/features/quick-guide/CodeBlock'
import type { ProviderSwitchStepProps } from '@/types/quick-guide.types'
```

### ExploreSection Needs (CHANGE NEEDED)
```typescript
// V1:
import { useUIStore } from '@/stores/useUIStore'

// V2 (will need refactoring):
import { useNavigate } from 'react-router-dom' // or use routing hook
```

## Key Statistics

- **Total Components to Migrate:** 7
- **Purely Presentational Components:** 2 (BrowserGuideStep, DesktopGuideStep)
- **Interactive Components:** 3 (ChatCompletionStep, ModelsStep, ProviderSwitchStep)
- **Utility Components:** 2 (CodeBlock, ExploreSection)

- **Services to Create:** 1 (chat.service.ts)
- **Services to Update:** 2 (models.service.ts endpoints, providers.service.ts)
- **Hooks to Create:** 1 (useChatTest.ts)
- **Hooks to Verify:** 2 (useModels, useProviders)

- **UI Components Missing:** 1 (tabs.tsx)
- **Types to Port:** 4 prop interfaces + types

- **Estimated Effort:** Medium (1-2 days for experienced developer)
- **Risk Level:** Low (mostly copy/paste with import updates)
- **Testing Required:** Medium (integration tests with v2 backend)

## Common Pitfalls to Avoid

1. **URL Hardcoding** - Use environment variables, not localhost
2. **Missing Tabs Component** - Don't forget to port or add this
3. **Endpoint Changes** - Double-check v2 API paths (/v1/ vs /api/)
4. **Store Integration** - useSettingsStore doesn't exist in v2
5. **Navigation** - setCurrentRoute pattern needs refactoring
6. **CSS Classes** - Verify all custom classes are defined
7. **Import Paths** - Update all @/ paths, verify they exist

---

For detailed information, see QUICK_GUIDE_MIGRATION_ANALYSIS.md
