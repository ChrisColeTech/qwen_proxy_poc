# Frontend v1 Quick-Guide Step Components Analysis & Migration Plan

## Overview
This document provides a comprehensive analysis of the quick-guide step components in frontend v1 and identifies what needs to be migrated to frontend-v2. The analysis covers all step components, their dependencies, UI components, and interactions.

---

## 1. QUICK-GUIDE STEP COMPONENTS INVENTORY

### 1.1 BrowserGuideStep Component
**File:** `/frontend/src/components/features/quick-guide/BrowserGuideStep.tsx`

**Purpose:**
- Provides browser extension setup instructions for the Qwen proxy
- Guides users through Chrome extension installation and authentication flow
- Explains how to extract Qwen credentials via the extension
- Shows how to start the proxy and use the API

**UI Components Used:**
- Card (from @/components/ui/card)
- CardContent, CardHeader, CardTitle
- Badge (from @/components/ui/badge)
- Lucide icons: Globe, Chrome, CheckCircle, ArrowRight

**Dependencies:**
- No hooks or services required
- Purely presentational component
- Uses CSS classes for styling (demo-container, guide-step-list, guide-step-item, etc.)

**Interactions:**
- Display only (no interactions)

---

### 1.2 DesktopGuideStep Component
**File:** `/frontend/src/components/features/quick-guide/DesktopGuideStep.tsx`

**Purpose:**
- Provides native desktop app authentication instructions
- Explains advantages of desktop app over browser extension
- Shows authentication flow using Electron integration
- Demonstrates instant credential extraction without browser extension

**UI Components Used:**
- Card (from @/components/ui/card)
- CardContent, CardHeader, CardTitle
- Badge (from @/components/ui/badge)
- Lucide icons: Monitor, Zap, Shield, Clock, CheckCircle

**Dependencies:**
- No hooks or services required
- Purely presentational component
- Uses CSS classes for styling (guide-benefits-grid, guide-benefit-item, etc.)

**Interactions:**
- Display only (no interactions)

---

### 1.3 ChatCompletionStep Component
**File:** `/frontend/src/components/features/quick-guide/ChatCompletionStep.tsx`

**Purpose:**
- Allows users to test chat completion API calls
- Displays a curl example for testing
- Shows response from chat completion endpoint
- Displays active model and provides test button

**Props Interface:**
```typescript
interface ChatCompletionStepProps {
  response: string;
  loading: boolean;
  onTest: () => void;
  providerRouterUrl: string;
  activeModel?: string;
}
```

**UI Components Used:**
- Card, CardContent, CardHeader, CardTitle
- Badge
- Button (from @/components/ui/button)
- CodeBlock (custom component)
- Lucide icons: Zap, RefreshCw, Play, Database

**Dependencies:**
- CodeBlock component (local import)
- Lucide icons

**Interactions:**
- onTest callback: Triggered when user clicks Play button
- Displays loading state with spinner
- Shows response in demo-content area

---

### 1.4 ModelsStep Component
**File:** `/frontend/src/components/features/quick-guide/ModelsStep.tsx`

**Purpose:**
- Displays available models from the provider router
- Shows curl example to fetch models
- Allows user to select active model
- Shows model count and refresh status

**Props Interface:**
```typescript
interface ModelsStepProps {
  models: Model[];
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}
```

**UI Components Used:**
- Card, CardContent, CardHeader, CardTitle
- Badge
- Button (size="icon", variant="outline")
- CodeBlock
- Lucide icons: Database, RefreshCw, CheckCircle2, XCircle, Check
- Custom styling: model-list-container, model-item

**Dependencies:**
- CodeBlock component
- cn utility function from @/lib/utils
- Model type from quick-guide.types

**Interactions:**
- onRefresh callback: Triggered when user clicks refresh button
- onSelectModel callback: Triggered when user clicks a model item
- Loading state with spinner
- Error state for no models available

---

### 1.5 ProviderSwitchStep Component
**File:** `/frontend/src/components/features/quick-guide/ProviderSwitchStep.tsx`

**Purpose:**
- Allows users to switch between configured providers
- Provides both UI switching and curl-based API switching examples
- Shows provider status and enabled/disabled state
- Displays curl commands for programmatic switching

**Props Interface:**
```typescript
interface ProviderSwitchStepProps {
  providers: Provider[];
  activeProvider: string;
  loading: boolean;
  onSwitch: (providerId: string) => void;
  apiBaseUrl: string;
}
```

**UI Components Used:**
- Card, CardContent, CardHeader, CardTitle
- Tabs, TabsContent, TabsList, TabsTrigger (from @/components/ui/tabs)
- Badge
- Button (size="icon", variant="outline")
- StatusIndicator (custom component)
- CodeBlock
- Lucide icons: Network, RefreshCw, ArrowRight, XCircle

**Dependencies:**
- CodeBlock component
- StatusIndicator component
- Provider type from quick-guide.types
- Tabs component (Radix UI)

**Interactions:**
- Tab switching between "Switch Provider" and "Try It Yourself"
- onSwitch callback: Triggered when user clicks switch button for a provider
- Loading state with spinner
- Error state for no providers configured

---

### 1.6 CodeBlock Component
**File:** `/frontend/src/components/features/quick-guide/CodeBlock.tsx`

**Purpose:**
- Displays code snippets (curl commands, JSON, etc.)
- Provides copy-to-clipboard functionality
- Shows visual feedback when code is copied

**Props Interface:**
```typescript
interface CodeBlockProps {
  label: string;
  code: string;
}
```

**UI Components Used:**
- Button (size="icon", variant="ghost")
- Lucide icons: Copy, Check

**Dependencies:**
- React hooks: useState
- navigator.clipboard API
- CodeBlockProps type

**Interactions:**
- Copy button: Copies code to clipboard
- Shows success feedback (check icon) for 2 seconds
- Returns to copy icon after timeout

---

### 1.7 ExploreSection Component
**File:** `/frontend/src/components/features/quick-guide/ExploreSection.tsx`

**Purpose:**
- Navigation section showing available features/pages
- Encourages users to explore providers, models, and chat testing
- Provides quick navigation to other parts of the app

**UI Components Used:**
- Card, CardContent, CardHeader, CardTitle
- Lucide icons: Network, Database, Zap, ArrowRight, Compass

**Dependencies:**
- useUIStore from @/stores/useUIStore
- cn utility function from @/lib/utils

**Interactions:**
- setCurrentRoute callback: Navigation to feature pages
- Hover effects on feature cards
- Routes to: /providers, /models, /chat

---

## 2. TYPES DEPENDENCIES

### quick-guide.types.ts
**File:** `/frontend/src/types/quick-guide.types.ts`

**Exports:**
```typescript
// Re-exports from proxy.types
export type { Provider, Model } from './proxy.types';

export interface ModelsStepProps { ... }
export interface ChatCompletionStepProps { ... }
export interface ProviderSwitchStepProps { ... }
export interface CodeBlockProps { ... }
```

### proxy.types.ts
**File:** `/frontend/src/types/proxy.types.ts`

**Key Types:**
```typescript
interface Provider {
  id: string;
  name: string;
  type: 'lm-studio' | 'qwen-proxy' | 'qwen-direct' | string;
  enabled: boolean;
  priority?: number;
  description?: string;
  baseUrl?: string;
  created_at?: number;
  updated_at?: number;
}

interface Model {
  id: string;
  name?: string;
  providerId?: string;
}

interface ProxyServerInfo { ... }
interface ProxyStatusResponse { ... }
interface ProxyControlResponse { ... }
```

### chat.types.ts
**File:** `/frontend/src/types/chat.types.ts`

**Key Types:**
```typescript
interface ParsedChatResponse {
  thinking: string | null;
  mainResponse: string;
}

interface ChatMessage { ... }
interface ChatCompletionRequest { ... }
interface ChatCompletionResponse { ... }
```

---

## 3. SERVICES DEPENDENCIES

### modelsService
**File:** `/frontend/src/services/modelsService.ts`

**Functions:**
- `getModels(providerRouterUrl: string): Promise<Model[]>`
  - Fetches available models from provider router
  - Used by: ModelsStep component

### providersService
**File:** `/frontend/src/services/providersService.ts`

**Functions:**
- `getProviders(): Promise<Provider[]>`
  - Fetches available providers from API
  - Used by: ProviderSwitchStep, useProviders hook
  
- `switchProvider(providerId: string): Promise<void>`
  - Changes active provider
  - Used by: ProviderSwitchStep, useProviders hook

### chatService
**File:** `/frontend/src/services/chatService.ts`

**Functions:**
- `testChat(providerRouterUrl: string, model?: string): Promise<string>`
  - Tests chat completion endpoint
  - Used by: ChatCompletionStep component
  
- `sendChatRequest(...): Promise<string>`
  - Sends chat request with custom prompt
  
- `parseResponse(text: string): ParsedChatResponse`
  - Parses response with thinking tags

### api.service.ts
**File:** `/frontend/src/services/api.service.ts`

**Key Functions:**
- `getProviders(): Promise<ProviderResult>`
- `getSettings(): Promise<SettingsResult>`
- `getSetting(key: string): Promise<any>`
- `updateSetting(key: string, value: string): Promise<any>`
- `setActiveProvider(id: string): Promise<any>`

---

## 4. HOOKS DEPENDENCIES

### useModels
**File:** `/frontend/src/hooks/useModels.ts`

**Returns:**
```typescript
{
  models: Model[];
  loading: boolean;
  loadModels: () => Promise<void>;
}
```

**Dependencies:**
- modelsService.getModels()
- Uses providerRouterUrl prop

**Usage Pattern:**
- Takes providerRouterUrl as parameter
- Loads models on component mount
- Provides refresh capability

### useProviders
**File:** `/frontend/src/hooks/useProviders.ts`

**Returns:**
```typescript
{
  providers: Provider[];
  activeProvider: string;
  loading: boolean;
  loadProviders: () => Promise<void>;
  switchProvider: (providerId: string) => Promise<void>;
}
```

**Dependencies:**
- providersService.getProviders()
- providersService.switchProvider()
- useSettingsStore.fetchSettings()

**Usage Pattern:**
- Loads providers on component mount
- Tracks active provider from settings store
- Handles provider switching

### useProxyStatus
**File:** `/frontend/src/hooks/useProxyStatus.ts`

**Returns:**
```typescript
{
  status: ProxyStatusResponse | null;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  isRunning: boolean;
  providerRouterUrl: string;
  apiBaseUrl: string;
}
```

**Usage:** Provides proxy status and URLs for API calls

### useChatTest
**File:** `/frontend/src/hooks/useChatTest.ts`

**Returns:**
```typescript
{
  response: string;
  loading: boolean;
  error: string | null;
  testChat: () => Promise<void>;
}
```

**Dependencies:**
- chatService.testChat()

---

## 5. STORES DEPENDENCIES

### useSettingsStore
**File:** `/frontend/src/stores/useSettingsStore.ts`

**State:**
```typescript
{
  settings: Settings;
  loading: boolean;
  providerRouterUrl: string;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  setActiveModel: (modelId: string) => Promise<void>;
}
```

**Key Settings:**
- `active_provider`: Currently active provider ID
- `active_model`: Currently active model ID
- `server.port`: Provider router port
- `server.host`: Provider router host

### useUIStore
**File:** `/frontend/src/stores/useUIStore.ts` (v1)

**State:**
```typescript
{
  uiState: UIState;
  statusMessage: string;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  // ... other methods
}
```

**Usage in quick-guide:**
- ExploreSection uses setCurrentRoute for navigation

### useProxyStore
**File:** `/frontend/src/stores/useProxyStore.ts`

**State:**
```typescript
{
  status: ProxyStatusResponse | null;
  loading: boolean;
  refreshStatus: () => Promise<void>;
}
```

---

## 6. UI COMPONENTS USED

### From ShadCN UI (available in both versions):
- Card, CardContent, CardHeader, CardTitle
- Badge
- Button
- Tabs, TabsContent, TabsList, TabsTrigger
- StatusIndicator (custom)

### Custom Components:
- CodeBlock (defined in quick-guide folder)
- StatusIndicator (from @/components/ui/status-indicator)

### Lucide Icons Used:
- Globe, Chrome, ArrowRight (BrowserGuideStep)
- Monitor, Zap, Shield, Clock, CheckCircle (DesktopGuideStep)
- Zap, RefreshCw, Play, Database (ChatCompletionStep)
- Database, RefreshCw, CheckCircle2, XCircle, Check (ModelsStep)
- Network, RefreshCw, ArrowRight, XCircle (ProviderSwitchStep)
- Copy, Check (CodeBlock)
- Network, Database, Zap, ArrowRight, Compass (ExploreSection)

---

## 7. WHAT EXISTS IN FRONTEND-V2

### Services (EXIST - BUT WITH DIFFERENCES):
- `/frontend-v2/src/services/proxy.service.ts` - Similar to proxyService
- `/frontend-v2/src/services/models.service.ts` - Similar to modelsService (BUT fetches from /api/models, not /v1/models)
- `/frontend-v2/src/services/providers.service.ts` - Similar to providersService
- `/frontend-v2/src/services/credentials.service.ts` - NEW: Handles credentials

### Hooks (EXIST - BUT DIFFERENT STRUCTURE):
- `/frontend-v2/src/hooks/useProviders.ts` - Refactored version
- `/frontend-v2/src/hooks/useModels.ts` - Refactored version
- `/frontend-v2/src/hooks/useCredentials.ts` - NEW
- `/frontend-v2/src/hooks/useDarkMode.ts` - Different from v1
- `/frontend-v2/src/hooks/useWebSocket.ts` - NEW: WebSocket support

### Stores (EXIST - BUT SIMPLIFIED):
- `/frontend-v2/src/stores/useUIStore.ts` - Simplified with persist middleware
- `/frontend-v2/src/stores/useProxyStore.ts` - Enhanced with WebSocket support
- `/frontend-v2/src/stores/useAlertStore.ts` - EXISTS
- `/frontend-v2/src/stores/useCredentialsStore.ts` - NEW

### Types (EXIST - BUT REORGANIZED):
- `/frontend-v2/src/types/providers.types.ts` - Similar but renamed from quick-guide.types
- `/frontend-v2/src/types/models.types.ts` - Similar but reorganized
- `/frontend-v2/src/types/home.types.ts` - NEW: Proxy status types
- `/frontend-v2/src/types/credentials.types.ts` - NEW
- `/frontend-v2/src/types/index.ts` - Central exports

### UI Components (MISSING IN V2):
- **Tabs component NOT FOUND** in frontend-v2/src/components/ui/
  - This is used by ProviderSwitchStep
  - Will need to be added or component restructured

---

## 8. CRITICAL DIFFERENCES & GAPS

### API Endpoints:
**V1:**
- Models: `${providerRouterUrl}/v1/models`
- Chat: `${providerRouterUrl}/v1/chat/completions`
- Providers: `http://localhost:3002/api/providers`

**V2:**
- Models: `${API_URL}/api/models` (different endpoint!)
- Providers: `${API_URL}/api/providers`
- Using VITE_API_BASE_URL environment variable

### Missing Component:
- **Tabs Component**: ProviderSwitchStep uses Tabs which doesn't exist in v2
  - Option 1: Port tabs.tsx from v1
  - Option 2: Restructure ProviderSwitchStep to not use tabs

### Settings Store Removed:
- V2 doesn't have useSettingsStore
- Active provider/model management integrated into stores differently
- V2 uses WebSocket for real-time updates

### Navigation Pattern Changed:
- V1: Uses `setCurrentRoute` from useUIStore
- V2: Uses standard React Router (implied from project structure)
- ExploreSection will need refactoring

### Environment Configuration:
- V1: Uses hardcoded URLs (localhost:3001, localhost:3002)
- V2: Uses VITE_API_BASE_URL environment variable
- Need to update URL construction in services

### WebSocket Support:
- V2 has WebSocket support for real-time updates
- V1 uses polling/fetch patterns
- Quick-guide components don't use WebSocket yet

---

## 9. WHAT NEEDS TO BE MIGRATED

### Components to Port (WITH MODIFICATIONS):
1. **BrowserGuideStep** - Pure presentational, minimal changes
2. **DesktopGuideStep** - Pure presentational, minimal changes
3. **ChatCompletionStep** - Port as-is, update imports
4. **ModelsStep** - Port as-is, update imports
5. **ProviderSwitchStep** - NEEDS REFACTORING (Tabs component missing)
6. **CodeBlock** - Port as-is, very simple
7. **ExploreSection** - Needs routing refactor

### New Types to Create in V2:
```typescript
// frontend-v2/src/types/quick-guide.types.ts (or integrate into existing files)
export interface ChatCompletionStepProps { ... }
export interface CodeBlockProps { ... }
```

### Services to Verify/Update:
1. **models.service.ts** - Already exists but different endpoint
2. **providers.service.ts** - Already exists, similar functionality
3. **Chat service** - NEEDS TO BE CREATED (doesn't exist in v2)
   - `testChat()`
   - `sendChatRequest()`
   - `parseResponse()`

### Hooks to Create/Update:
1. **useChatTest hook** - NEEDS TO BE CREATED
   - V1 has this, V2 doesn't
2. **useProviders** - Already exists but different
3. **useModels** - Already exists but different

### CSS/Styling:
- All custom CSS classes used by components need to be ported
- Check for missing Tailwind classes or custom styles

### Missing UI Components to Port:
1. **Tabs component** - Need to port from v1 or add from shadcn/ui

---

## 10. SUMMARY OF MIGRATION TASKS

### Priority 1 - Critical Path:
1. Create/verify Tabs component in frontend-v2
2. Create chat service in frontend-v2
3. Create useChatTest hook in frontend-v2
4. Port quick-guide type definitions
5. Port CodeBlock component
6. Port BrowserGuideStep and DesktopGuideStep

### Priority 2 - Interactive Components:
7. Port ChatCompletionStep
8. Port ModelsStep
9. Port ProviderSwitchStep
10. Update service imports and endpoint URLs

### Priority 3 - Navigation & Integration:
11. Refactor ExploreSection for v2 routing
12. Verify CSS classes and styling
13. Test all components with real API endpoints

### Priority 4 - Testing & Optimization:
14. Unit tests for each component
15. Integration tests with v2 stores and services
16. Performance optimization
17. WebSocket integration (optional enhancement)

---

## 11. FILE MAPPING FOR MIGRATION

```
FRONTEND V1 → FRONTEND-V2

Components:
/frontend/src/components/features/quick-guide/
  ├── BrowserGuideStep.tsx → /frontend-v2/src/components/features/quick-guide/
  ├── DesktopGuideStep.tsx → /frontend-v2/src/components/features/quick-guide/
  ├── ChatCompletionStep.tsx → /frontend-v2/src/components/features/quick-guide/
  ├── ModelsStep.tsx → /frontend-v2/src/components/features/quick-guide/
  ├── ProviderSwitchStep.tsx → /frontend-v2/src/components/features/quick-guide/
  ├── CodeBlock.tsx → /frontend-v2/src/components/features/quick-guide/
  └── ExploreSection.tsx → /frontend-v2/src/components/features/quick-guide/

Types:
/frontend/src/types/quick-guide.types.ts → /frontend-v2/src/types/quick-guide.types.ts
/frontend/src/types/chat.types.ts → /frontend-v2/src/types/chat.types.ts (or integrate)

Services:
/frontend/src/services/chatService.ts → /frontend-v2/src/services/chat.service.ts (NEW)
/frontend/src/services/modelsService.ts → ALREADY EXISTS (needs endpoint update)
/frontend/src/services/providersService.ts → ALREADY EXISTS

Hooks:
/frontend/src/hooks/useChatTest.ts → /frontend-v2/src/hooks/useChatTest.ts (NEW)
/frontend/src/hooks/useModels.ts → ALREADY EXISTS (may need updates)
/frontend/src/hooks/useProviders.ts → ALREADY EXISTS (may need updates)

UI Components:
/frontend/src/components/ui/tabs.tsx → /frontend-v2/src/components/ui/tabs.tsx (NEW)
/frontend/src/components/ui/status-indicator.tsx → ALREADY EXISTS
```

---

## 12. DETAILED MIGRATION NOTES

### Endpoint URL Changes:
- Remove hardcoded localhost URLs
- Use VITE_API_BASE_URL environment variable
- Update services to use new endpoints

### Import Path Changes:
- Update all @/components, @/services, @/types, @/hooks paths
- Verify all imports exist in v2

### Store Integration Changes:
- Remove useSettingsStore usage (doesn't exist in v2)
- Use WebSocket updates instead of polling where applicable
- Check how active provider/model are managed in v2

### Styling Considerations:
- Verify all CSS classes are defined
- Check for responsive design issues
- Test dark/light theme switching

---

END OF ANALYSIS
