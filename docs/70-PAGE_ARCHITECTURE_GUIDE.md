# Page Architecture Documentation

## Overview
This document describes the established methodology for creating pages in frontend. All pages should follow this pattern for consistency and maintainability.

## Architecture Pattern

### File Structure
```
src/
├── pages/
│   └── [PageName]Page.tsx                    # Main page component (thin, presentational only)
├── hooks/
│   └── use[PageName]Page.ts                  # Custom hook for page logic and state
├── constants/
│   └── [pageName].constants.tsx              # Constants and data builders ONLY
└── components/
    └── features/
        └── [pageName]/
            ├── [FeatureName]Tab.tsx          # Feature components for complex tab layouts
            └── [FeatureName]Section.tsx      # Feature components for reusable sections
```

### Component Responsibilities

#### 1. Page Component (`/src/pages/[PageName]Page.tsx`)
**Purpose:** Thin presentation layer that wires everything together

**Responsibilities:**
- Import and call the custom hook
- Import feature components for tab content
- Call data builder functions from constants (to create ActionItem arrays)
- Render the TabCard component with feature components
- NO business logic
- NO complex inline JSX
- NO inline event handlers beyond simple wrappers

**Example:**
```tsx
import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import { ModelSelectTab } from '@/components/features/models/ModelSelectTab';
import { AllModelsTab } from '@/components/features/models/AllModelsTab';
import {
  buildModelSelectActions,
  buildModelActions,
  MODELS_TABS,
  MODELS_TITLE,
  MODELS_ICON
} from '@/constants/models.constants';

export function ModelsPage() {
  const {
    availableModels,
    filteredModels,
    activeModel,
    activeProvider,
    providers,
    handleModelSelect,
    handleProviderSwitch
  } = useModelsPage();

  // Build data structures (not JSX)
  const selectActions = buildModelSelectActions({
    models: availableModels,
    activeModel,
    onSelect: handleModelSelect
  });

  const modelActions = buildModelActions({
    models: filteredModels,
    activeModel,
    handleModelClick: (id) => console.log(id)
  });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: (
        <ModelSelectTab
          selectActions={selectActions}
          activeProvider={activeProvider}
          providers={providers}
          onProviderChange={handleProviderSwitch}
        />
      )
    },
    {
      ...MODELS_TABS.ALL,
      content: (
        <AllModelsTab
          modelActions={modelActions}
          capabilityFilter="all"
          onCapabilityChange={() => {}}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODELS_TITLE}
        icon={MODELS_ICON}
        tabs={tabs}
        defaultTab={MODELS_TABS.SELECT.value}
      />
    </div>
  );
}
```

#### 2. Custom Hook (`/src/hooks/use[PageName]Page.ts`)
**Purpose:** Encapsulate all state management and business logic

**Responsibilities:**
- Manage component state (useState)
- Handle side effects (useEffect)
- Call API services
- Consume stores (Zustand)
- Define event handlers
- Return state and handlers

**Example:**
```tsx
import { useState, useEffect } from 'react';
import { useAlertStore } from '@/stores/useAlertStore';

export function useModelsPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleModelClick = (modelId: string) => {
    console.log('Model clicked:', modelId);
    useAlertStore.showAlert(`Selected model: ${modelId}`, 'success');
  };

  useEffect(() => {
    // Fetch data, subscribe to stores, etc.
  }, []);

  return {
    selectedFilter,
    handleModelClick,
  };
}
```

#### 3. Constants File (`/src/constants/[pageName].constants.tsx`)
**Purpose:** Centralize configuration, string constants, and data transformation

**Responsibilities:**
- ✅ Define tab configurations (objects with value, label, description)
- ✅ Export all string constants
- ✅ Export all icon constants
- ✅ Define simple helper functions (badge creators with minimal JSX)
- ✅ Create data builder functions that return **data structures** (like ActionItem[])
- ❌ **NEVER** create builder functions that return complex JSX layouts (use feature components instead)

**Example:**
```tsx
import { Database, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import type { ActionItem } from './home.constants';
import type { Model } from '@/types/models.types';

// Tab configuration
export const MODELS_TABS = {
  SELECT: {
    value: 'select',
    label: 'Select Model',
    description: 'Select an active model to use'
  },
  ALL: {
    value: 'all',
    label: 'All Models',
    description: 'Browse all available AI models'
  }
} as const;

// Constants
export const MODELS_TITLE = 'Models';
export const MODELS_ICON = Database;

// Helper: Create a badge with chevron (simple JSX helper is OK)
export const createModelBadge = (variant: 'default' | 'destructive', text: string) => (
  <>
    <Badge variant={variant} className="min-w-[180px] justify-center">{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

// Data builder: Returns ActionItem[] data structure (NOT JSX)
export const buildModelActions = (params: {
  models: Model[];
  activeModel: string;
  handleModelClick: (modelId: string) => void;
}): ActionItem[] => {
  const { models, activeModel, handleModelClick } = params;

  return models.map((model) => ({
    icon: model.id === activeModel ? <StatusIndicator status="running" /> : undefined,
    title: model.id,
    description: model.description,
    actions: createModelBadge('default', model.provider),
    onClick: () => handleModelClick(model.id)
  }));
};
```

**What NOT to do:**
```tsx
// ❌ BAD: Builder returns complex JSX layout
export const buildAllModelsContent = (modelActions: ActionItem[]) => (
  <div className="demo-container">
    <div className="demo-header">
      <Database className="icon-primary" />
      <span>Browse Models</span>
    </div>
    <div className="model-filters-row">
      <Select>...</Select>
    </div>
    <ActionList items={modelActions} />
  </div>
);
// This should be a feature component instead!
```

#### 4. Feature Components (`/src/components/features/[pageName]/[ComponentName].tsx`)
**Purpose:** Encapsulate complex tab layouts and reusable UI sections

**Responsibilities:**
- ✅ Render complex tab content with multiple elements
- ✅ Accept data via props (ActionItem arrays, state, callbacks)
- ✅ Handle layout and styling
- ✅ Keep components focused and single-purpose
- ❌ NO business logic (receive handlers via props)
- ❌ NO direct API calls (receive data via props)

**Example:**
```tsx
import { Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ActionItem } from '@/constants/home.constants';
import type { CapabilityFilter } from '@/types/models.types';

interface AllModelsTabProps {
  modelActions: ActionItem[];
  capabilityFilter: CapabilityFilter;
  providerFilter: string;
  providers: string[];
  onCapabilityChange: (value: CapabilityFilter) => void;
  onProviderChange: (value: string) => void;
}

export function AllModelsTab({
  modelActions,
  capabilityFilter,
  providerFilter,
  providers,
  onCapabilityChange,
  onProviderChange
}: AllModelsTabProps) {
  return (
    <div className="demo-container">
      <div className="demo-header">
        <div className="demo-label">
          <Database className="icon-primary" />
          <span className="demo-label-text">Browse Models</span>
        </div>
      </div>

      {/* Filters Row */}
      <div className="model-filters-row">
        <div className="model-filter-group">
          <span className="model-filter-label">Capability:</span>
          <Select value={capabilityFilter} onValueChange={onCapabilityChange}>
            <SelectTrigger className="models-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Capabilities</SelectItem>
              <SelectItem value="chat">Chat</SelectItem>
              <SelectItem value="vision">Vision</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="model-filter-group">
          <span className="model-filter-label">Provider:</span>
          <Select value={providerFilter} onValueChange={onProviderChange}>
            <SelectTrigger className="models-filter-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Models List */}
      <div className="provider-switch-list">
        {modelActions.map((item, index) => (
          <div
            key={index}
            className="provider-switch-item"
            onClick={item.onClick}
          >
            <div className="provider-switch-info">
              {item.icon}
              <div className="provider-switch-details">
                <div className="provider-switch-name">{item.title}</div>
                {item.description && (
                  <div className="provider-switch-type">{item.description}</div>
                )}
              </div>
            </div>
            {item.actions && (
              <div className="provider-switch-actions">
                {item.actions}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**When to create a feature component:**
- Tab content has more than 20 lines of JSX
- Multiple selects, filters, or form elements
- Complex layout with sections and headers
- Reusable across multiple tabs or pages

## Components Usage

### TabCard Component
The primary layout component for all pages with tabbed content.

**Props:**
- `title`: Page title (from constants)
- `icon`: Page icon (from constants)
- `tabs`: Array of tab configurations
- `defaultTab`: Default tab value (from constants)

**Tab Structure:**
```tsx
{
  value: string;        // Unique identifier
  label: string;        // Display text
  content: ReactNode;   // Tab content (from builder functions)
  description?: string; // Optional description shown above content
  hidden?: boolean;     // Conditionally hide tab
}
```

### ActionList Component
Displays a list of clickable action items with icons, badges, and descriptions.

**Props:**
- `title?`: Optional list title
- `icon?`: Optional icon next to title
- `items`: Array of action items

**ActionItem Structure:**
```tsx
{
  icon?: ReactNode;       // Status indicator or icon
  title: string;          // Item title
  description: string;    // Item description
  actions?: ReactNode;    // Badges, buttons (usually badge + chevron)
  onClick?: () => void;   // Click handler
  disabled?: boolean;     // Disable interaction
  hidden?: boolean;       // Conditionally hide item
}
```

## Conditional Visibility

### Hiding Tabs Based on State

Use the `hidden` property to conditionally show/hide tabs based on application state.

**Example: Hide API Examples tab when proxy is not running**
```tsx
import { useProxyStore } from '@/stores/useProxyStore';

export function BrowserGuidePage() {
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const { baseUrl, copiedUrl, handleCopyUrl } = useApiGuidePage();

  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...BROWSER_GUIDE_TABS.GUIDE,
      content: buildBrowserGuideContent()
    },
    {
      ...BROWSER_GUIDE_TABS.API_EXAMPLES,
      content: buildApiGuideContent({ baseUrl, copiedUrl, handleCopyUrl }),
      hidden: !proxyRunning  // Only show when proxy is running
    }
  ];

  return <TabCard title={BROWSER_GUIDE_TITLE} icon={BROWSER_GUIDE_ICON} tabs={tabs} />;
}
```

**Understanding Connection vs. Running States:**
- **`connected`** - API server is reachable (WebSocket connected)
  - Available at: `useProxyStore((state) => state.connected)`
  - Use when: You need to know if the backend API is available
- **`proxyRunning`** - Proxy server is actively running
  - Derived from: `wsProxyStatus?.providerRouter?.running || false`
  - Use when: You need to know if the proxy can handle requests

**Common Use Cases:**
- `hidden: !connected` - Show only when API server is connected
- `hidden: !proxyRunning` - Show only when proxy is running (most common for API-related tabs)
- `hidden: !credentialsValid` - Show only when credentials are available
- `hidden: !isElectron()` - Show only in desktop app
- `hidden: isElectron()` - Show only in browser

### Hiding Action Items

Similarly, use the `hidden` property on ActionItem objects:

```tsx
export const buildProviderActions = (params: {
  connected: boolean;
  handleProviderClick: (providerId: string) => void;
}): ActionItem[] => {
  return [
    {
      title: 'Add Provider',
      description: 'Configure a new AI provider',
      onClick: () => params.handleProviderClick('new'),
      hidden: !params.connected  // Only show when connected
    }
  ];
};
```

## Best Practices

### DO:
✅ Use feature components for complex tab content (> 20 lines of JSX)
✅ Use data builder functions that return ActionItem[] or other data structures
✅ Define all text as constants
✅ Keep page components thin (< 100 lines)
✅ Put all business logic in hooks
✅ Put all configuration and constants in constants files
✅ Use the spread operator with tab constants
✅ Use ActionList for clickable lists
✅ Use TabCard for all tabbed pages
✅ Use `hidden` property for conditional visibility
✅ Read state from stores in page components for conditional rendering
✅ Create simple helper functions in constants (e.g., badge creators with < 5 lines JSX)

### DON'T:
❌ Write complex inline JSX in page components
❌ Write business logic in page components or feature components
❌ Hardcode strings in page components
❌ Define event handlers inline (pass them from hooks)
❌ Create builder functions in constants that return complex JSX layouts
❌ Put business logic in constants files
❌ Import stores directly in page components for business logic (use hooks)
❌ Use old Card component (use TabCard instead)
❌ Create custom tab layouts (use TabCard)
❌ Use conditional array spreading (`...(condition ? [tab] : [])`) - use `hidden` instead
❌ Make API calls from feature components (pass data via props)

## Migration Checklist

When migrating an existing page:

1. **Create Hook File**
   - [ ] Create `/src/hooks/use[PageName]Page.ts`
   - [ ] Move all state management to hook
   - [ ] Move all event handlers to hook
   - [ ] Move all useEffect logic to hook

2. **Create Constants File**
   - [ ] Create `/src/constants/[pageName].constants.tsx`
   - [ ] Define tab configurations as constants
   - [ ] Create data builder functions that return ActionItem[] or other data structures
   - [ ] Extract all string literals to constants
   - [ ] Create simple helper functions (badge creators with < 5 lines JSX)
   - [ ] **DO NOT** create builders that return complex JSX layouts

3. **Create Feature Components**
   - [ ] Create `/src/components/features/[pageName]/` directory
   - [ ] For each complex tab layout (> 20 lines JSX), create a feature component
   - [ ] Move complex JSX from constants to feature components
   - [ ] Define TypeScript interfaces for component props
   - [ ] Ensure components only receive data/handlers via props

4. **Refactor Page Component**
   - [ ] Import and call the custom hook
   - [ ] Import constants and data builders
   - [ ] Import feature components for tab content
   - [ ] Call data builders to create ActionItem arrays
   - [ ] Pass data and handlers to feature components
   - [ ] Replace old Card with TabCard
   - [ ] Remove all inline logic
   - [ ] Verify component is < 100 lines

5. **Test**
   - [ ] Run `npm run build` - ensure no errors
   - [ ] Test all tab switching
   - [ ] Test all click handlers
   - [ ] Test all filters and selects
   - [ ] Test conditional rendering (hidden tabs/items)

## Example: Complete Implementation

See `/src/pages/ModelsPage.tsx` for a complete reference implementation demonstrating:
- ✅ TabCard usage with 3 tabs
- ✅ Feature components for complex tab layouts
- ✅ Proper hook integration
- ✅ Data builder functions (not JSX builders)
- ✅ Constants for all configuration
- ✅ Clean separation of concerns

## Reference Implementation

**Working Examples:**
- `/src/pages/ModelsPage.tsx` - Demonstrates feature components and data builders
  - Uses `ModelSelectTab` and `AllModelsTab` feature components
  - Constants file only has data builders, no complex JSX

**To Study:**
- **Page:** `/src/pages/ModelsPage.tsx` - Clean page component
- **Hook:** `/src/hooks/useModelsPage.ts` - Business logic and state
- **Constants:** `/src/constants/models.constants.tsx` - Data builders and config (NO complex JSX)
- **Feature Components:**
  - `/src/components/features/models/ModelSelectTab.tsx` - Complex tab layout
  - `/src/components/features/models/AllModelsTab.tsx` - Complex tab layout with filters
- **UI Components:**
  - `/src/components/ui/tab-card.tsx` - TabCard component
  - `/src/components/ui/action-list.tsx` - ActionList component

## Naming Conventions

### Hooks
- All hooks must use camelCase: `usePageName.ts`
- Page-specific hooks should follow: `use[PageName]Page.ts`
- Generic hooks follow: `use[Feature].ts`
- Examples: `useHomePage.ts`, `useModelsPage.ts`, `useChatPage.ts`, `useProvidersPage.ts`

### Constants
- All constants files use camelCase: `pageName.constants.tsx`
- Examples: `home.constants.tsx`, `models.constants.tsx`, `chat.constants.tsx`, `providers.constants.tsx`

### Feature Components
- Organized by page/feature area: `/src/components/features/[pageName]/`
- Use PascalCase for component names
- Descriptive names indicating purpose: `[Feature][Type].tsx`
- Examples:
  - `ModelSelectTab.tsx` - Tab for selecting models
  - `AllModelsTab.tsx` - Tab for browsing all models
  - `ProviderFormSection.tsx` - Section for provider form
  - `ModelTestWrapper.tsx` - Wrapper for model testing

### Barrel Files
- A barrel file (`index.ts`) exists at `/src/constants/index.ts` that re-exports all constants
- This allows imports like: `import { MODELS_TABS, CHAT_ICON } from '@/constants'`
- However, explicit imports are preferred for clarity: `import { MODELS_TABS } from '@/constants/models.constants'`

## Summary

**The Golden Rule:** Constants contain data and configuration. Feature components contain complex layouts. Pages wire everything together. Hooks contain business logic.

**Data Flow:**
1. **Hook** manages state and provides handlers
2. **Page** calls hook, calls data builders from constants, passes everything to feature components
3. **Constants** provide data builders that return ActionItem[] or config objects
4. **Feature Components** receive data/handlers via props and render complex layouts
