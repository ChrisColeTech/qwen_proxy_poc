# Quick-Guide Components - Detailed Structure Reference

## Component Dependency Graph

```
HomePage
├── ExploreSection
│   └── Router Links to: /providers, /models, /chat
│       (uses useUIStore.setCurrentRoute → needs refactoring to React Router)
├── BrowserGuideStep
│   └── Presentational only
├── DesktopGuideStep
│   └── Presentational only
└── QuickGuideContainer (wrapper)
    ├── ChatCompletionStep
    │   ├── CodeBlock
    │   ├── chatService.testChat()
    │   └── Requires: provider router URL, active model
    ├── ModelsStep
    │   ├── CodeBlock
    │   ├── modelsService.getModels()
    │   └── Requires: provider router URL
    └── ProviderSwitchStep
        ├── Tabs component
        │   ├── TabsList
        │   ├── TabsTrigger
        │   └── TabsContent
        ├── CodeBlock (in curl tab)
        ├── StatusIndicator
        ├── providersService.getProviders()
        ├── providersService.switchProvider()
        └── Requires: API base URL, provider list
```

## Detailed Component Specs

### 1. BrowserGuideStep
```
Inputs:
  - None (presentational)

Outputs:
  - Rendered guide card

Dependencies:
  - UI: Card, CardContent, CardHeader, CardTitle, Badge
  - Icons: Globe, Chrome, CheckCircle, ArrowRight (lucide-react)
  
CSS Classes:
  - card-title-with-icon
  - demo-container
  - demo-header
  - demo-label, demo-label-text
  - icon-sm, icon-sm-muted
  - guide-step-list
  - guide-step-item, guide-step-text, guide-step-icon
  - step-inline-code
  - vspace-md, vspace-sm
  - step-description

Lines of Code: ~95
Complexity: Very Low
Status: Ready to port as-is
```

### 2. DesktopGuideStep
```
Inputs:
  - None (presentational)

Outputs:
  - Rendered guide card

Dependencies:
  - UI: Card, CardContent, CardHeader, CardTitle, Badge
  - Icons: Monitor, Zap, Shield, Clock, CheckCircle
  
CSS Classes:
  - card-title-with-icon
  - demo-container
  - demo-header
  - demo-label, demo-label-text
  - icon-sm, icon-sm-muted
  - guide-benefits-grid
  - guide-benefit-item, guide-benefit-title, guide-benefit-description
  - guide-benefit-icon
  - guide-step-list
  - guide-step-item, guide-step-text, guide-step-icon
  - step-inline-code
  - vspace-md
  - step-description

Lines of Code: ~86
Complexity: Very Low
Status: Ready to port as-is
```

### 3. CodeBlock (UTILITY COMPONENT)
```
Inputs Props:
  {
    label: string      // "Try it yourself:", "Switch to...", etc
    code: string       // Curl command or code snippet
  }

Outputs:
  - <div> with code display and copy button

Dependencies:
  - UI: Button
  - Icons: Copy, Check (lucide-react)
  - Hooks: useState
  - API: navigator.clipboard
  
CSS Classes:
  - code-block-container
  - code-block-label
  - code-block-wrapper
  - code-block-pre, code-block-code
  - code-block-copy-button
  - status-icon-success

State Management:
  - copied: boolean (2-second timeout)

Interactions:
  - Copy button click → copies to clipboard → shows check icon → reverts

Lines of Code: ~39
Complexity: Low
Status: Ready to port as-is (very simple)
```

### 4. ChatCompletionStep (INTERACTIVE COMPONENT)
```
Inputs Props:
  {
    response: string              // API response text
    loading: boolean              // Loading state
    onTest: () => void            // Test button callback
    providerRouterUrl: string     // http://localhost:3001
    activeModel?: string          // "qwen3-max", etc
  }

Outputs:
  - Interactive card with test interface

Depends On:
  - Services: chatService (via parent)
  - Components: CodeBlock
  
Used By:
  - Parent component manages: loading, response, onTest callback
  - Parent calls chatService.testChat() in onTest handler

UI Components:
  - Card, CardContent, CardHeader, CardTitle
  - Badge (2x: for model, for loading status)
  - Button (Play icon)

Icons:
  - Zap, RefreshCw, Play, Database

CSS Classes:
  - flex, items-center, gap-2, space-y-4
  - demo-container, demo-header, demo-label, demo-label-text
  - demo-content, demo-empty-state
  - status-icon-inline
  - step-description

Parent State Management Needed:
  - response: string = ''
  - loading: boolean = false
  - onTest: async () => {
      setLoading(true);
      const result = await chatService.testChat(providerRouterUrl, activeModel);
      setResponse(result);
      setLoading(false);
    }

Lines of Code: ~82
Complexity: Medium
Status: Ready to port, update parent integration
```

### 5. ModelsStep (INTERACTIVE COMPONENT)
```
Inputs Props:
  {
    models: Model[]                    // List of available models
    loading: boolean                   // Loading state
    onRefresh: () => void              // Refresh button callback
    providerRouterUrl: string          // http://localhost:3001
    activeModel?: string               // Currently selected model
    onSelectModel?: (id: string) => void // Model selection callback
  }

Outputs:
  - Interactive card with model list and selection

Depends On:
  - Services: modelsService (via parent)
  - Utils: cn from @/lib/utils
  
Used By:
  - Parent component manages: models[], loading, activeModel, callbacks

UI Components:
  - Card, CardContent, CardHeader, CardTitle
  - Badge (2x: loading, count)
  - Button (Refresh icon)
  - CodeBlock

Icons:
  - Database, RefreshCw, CheckCircle2, XCircle, Check

CSS Classes:
  - flex, items-center, gap-2, space-y-4
  - demo-container, demo-header, demo-label, demo-label-text
  - demo-content, demo-error-state
  - model-list-container, model-item, model-item-code
  - cursor-pointer, hover:bg-accent
  - bg-accent (active state)
  - status-icon-success
  - step-description, step-inline-code

Render Logic:
  1. If loading: show spinner badge
  2. If models.length > 0: 
     - Show count badge
     - Render clickable model items
     - Highlight active model
  3. If no models: show error state

Lines of Code: ~100
Complexity: Medium
Status: Ready to port, update parent integration
```

### 6. ProviderSwitchStep (INTERACTIVE + COMPLEX)
```
Inputs Props:
  {
    providers: Provider[]             // List of configured providers
    activeProvider: string            // Currently active provider ID
    loading: boolean                  // Loading state
    onSwitch: (id: string) => void    // Provider switch callback
    apiBaseUrl: string                // http://localhost:3002
  }

Outputs:
  - Tabbed interface with provider switching and API examples

Depends On:
  - Services: providersService (via parent)
  - Components: CodeBlock, StatusIndicator
  - UI: Tabs, TabsContent, TabsList, TabsTrigger
  
Used By:
  - Parent component manages: providers[], activeProvider, loading, onSwitch

UI Components:
  - Card, CardContent, CardHeader, CardTitle
  - Tabs, TabsContent, TabsList, TabsTrigger (CRITICAL - MISSING IN V2)
  - Badge (3x: loading, active, disabled)
  - Button (Switch arrow icon)
  - StatusIndicator
  - CodeBlock

Icons:
  - Network, RefreshCw, ArrowRight, XCircle

CSS Classes:
  - flex, items-center, gap-2, space-y-4, mt-4, w-full, grid
  - provider-switch-list
  - provider-switch-item, provider-switch-item-active
  - provider-switch-info
  - provider-switch-details
  - provider-switch-name, provider-switch-type
  - provider-switch-actions
  - cursor-pointer
  - demo-container, demo-header, demo-label, demo-label-text
  - demo-error-state
  - step-description

Tab Content:
  Tab 1 "Switch Provider":
    - Provider list with status indicators
    - Switch button for inactive providers
    - Active/Disabled badges
  
  Tab 2 "Try It Yourself":
    - Two curl examples
    - Switch provider API call example
    - Get active provider API call example

Parent State Management Needed:
  - providers: Provider[] (from service)
  - activeProvider: string (from settings/store)
  - loading: boolean
  - onSwitch: async (id: string) => {
      try {
        await providersService.switchProvider(id);
        // Refresh provider list
      } catch (error) {
        // Handle error
      }
    }

CRITICAL ISSUE:
  - Uses Tabs component which DOESN'T EXIST in frontend-v2
  - Either:
    a) Port tabs.tsx from v1 (recommended)
    b) Restructure to remove tabs (alternative)

Lines of Code: ~120
Complexity: HIGH
Status: Needs tabs.tsx component, then port
```

### 7. ExploreSection (NAVIGATION)
```
Inputs Props:
  - None (feature config is internal)

Outputs:
  - Navigation card grid with 3 feature cards

Depends On:
  - Store: useUIStore.setCurrentRoute()
  - Utils: cn from @/lib/utils
  
Used By:
  - HomePage as quick navigation section

UI Components:
  - Card, CardContent, CardHeader, CardTitle
  - No Button components (styled divs with click handlers)

Icons:
  - Network, Database, Zap, ArrowRight, Compass (lucide-react)

CSS Classes:
  - grid, gap-4, md:grid-cols-3
  - p-4, rounded-lg, border, bg-card
  - hover:bg-muted/50, transition-colors, cursor-pointer, group
  - flex, items-start, justify-between, space-y-3
  - group-hover:text-foreground
  - font-semibold, text-sm, text-xs
  - text-muted-foreground
  - leading-relaxed
  - status-info, status-purple, status-success (icon colors)

Features Array:
  1. Manage Providers → /providers
  2. Explore Models → /models
  3. Test Chat API → /chat

REFACTORING NEEDED:
  - V1 uses useUIStore.setCurrentRoute()
  - V2 should use React Router (useNavigate)
  - Feature routes might have changed
  - Verify route paths in v2

Lines of Code: ~70
Complexity: Medium (routing refactor needed)
Status: Needs routing update for v2
```

## Props Interface Dependency Tree

```
Quick-Guide Step Components
    ├── BrowserGuideStep
    │   └── No props
    │
    ├── DesktopGuideStep
    │   └── No props
    │
    ├── ChatCompletionStep
    │   └── ChatCompletionStepProps
    │       ├── response: string
    │       ├── loading: boolean
    │       ├── onTest: () => void
    │       ├── providerRouterUrl: string
    │       └── activeModel?: string
    │
    ├── ModelsStep
    │   └── ModelsStepProps
    │       ├── models: Model[] (from proxy.types)
    │       ├── loading: boolean
    │       ├── onRefresh: () => void
    │       ├── providerRouterUrl: string
    │       ├── activeModel?: string
    │       └── onSelectModel?: (id: string) => void
    │
    ├── ProviderSwitchStep
    │   └── ProviderSwitchStepProps
    │       ├── providers: Provider[] (from proxy.types)
    │       ├── activeProvider: string
    │       ├── loading: boolean
    │       ├── onSwitch: (id: string) => void
    │       └── apiBaseUrl: string
    │
    └── CodeBlock
        └── CodeBlockProps
            ├── label: string
            └── code: string

Utility Types (from proxy.types):
    ├── Provider
    │   ├── id: string
    │   ├── name: string
    │   ├── type: string
    │   ├── enabled: boolean
    │   ├── priority?: number
    │   ├── description?: string
    │   ├── baseUrl?: string
    │   ├── created_at?: number
    │   └── updated_at?: number
    │
    └── Model
        ├── id: string
        ├── name?: string
        └── providerId?: string
```

## Service Call Patterns

### ChatCompletionStep Usage Pattern
```typescript
// Parent component
const [response, setResponse] = useState('');
const [loading, setLoading] = useState(false);

const handleTest = async () => {
  setLoading(true);
  try {
    const result = await chatService.testChat(providerRouterUrl, activeModel);
    setResponse(result);
  } finally {
    setLoading(false);
  }
};

<ChatCompletionStep
  response={response}
  loading={loading}
  onTest={handleTest}
  providerRouterUrl={providerRouterUrl}
  activeModel={activeModel}
/>
```

### ModelsStep Usage Pattern
```typescript
// Parent component
const { models, loading, loadModels } = useModels(providerRouterUrl);
const [selectedModel, setSelectedModel] = useState<string>();

const handleSelectModel = (modelId: string) => {
  setSelectedModel(modelId);
  // Optionally: await settingsStore.setActiveModel(modelId);
};

<ModelsStep
  models={models}
  loading={loading}
  onRefresh={loadModels}
  providerRouterUrl={providerRouterUrl}
  activeModel={selectedModel}
  onSelectModel={handleSelectModel}
/>
```

### ProviderSwitchStep Usage Pattern
```typescript
// Parent component
const { providers, activeProvider, loading, switchProvider } = useProviders();
const apiBaseUrl = 'http://localhost:3002';

const handleSwitch = async (providerId: string) => {
  try {
    await switchProvider(providerId);
    // List updates automatically
  } catch (error) {
    // Handle error
  }
};

<ProviderSwitchStep
  providers={providers}
  activeProvider={activeProvider}
  loading={loading}
  onSwitch={handleSwitch}
  apiBaseUrl={apiBaseUrl}
/>
```

---

This detailed reference shows exact component structure, props, CSS classes, and integration patterns needed for successful migration.

For complete analysis, see: QUICK_GUIDE_MIGRATION_ANALYSIS.md
For code templates, see: QUICK_GUIDE_CODE_REFERENCE.md
For quick summary, see: QUICK_GUIDE_SUMMARY.md
