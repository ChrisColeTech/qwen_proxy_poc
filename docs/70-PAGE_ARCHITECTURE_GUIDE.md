# Page Architecture Documentation

## Overview
This document describes the established methodology for creating pages in frontend-v3. All pages should follow this pattern for consistency and maintainability.

## Architecture Pattern

### File Structure
```
src/
├── pages/
│   └── [PageName]Page.tsx          # Main page component (thin, presentational only)
├── hooks/
│   └── use[PageName]Page.ts        # Custom hook for page logic and state
└── constants/
    └── [pageName].constants.tsx    # Constants, builders, and UI helpers
```

### Component Responsibilities

#### 1. Page Component (`/src/pages/[PageName]Page.tsx`)
**Purpose:** Thin presentation layer that wires everything together

**Responsibilities:**
- Import and call the custom hook
- Call builder functions from constants
- Render the TabCard component
- NO business logic
- NO inline JSX arrays
- NO inline event handlers beyond simple wrappers

**Example:**
```tsx
import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import {
  buildModelActions,
  buildAllModelsContent,
  MODELS_TABS,
  MODELS_TITLE,
  MODELS_ICON
} from '@/constants/models.constants';

export function ModelsPage() {
  const { handleModelClick } = useModelsPage();

  const modelActions = buildModelActions({ handleModelClick });

  const tabs = [
    {
      ...MODELS_TABS.ALL,
      content: buildAllModelsContent(modelActions)
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODELS_TITLE}
        icon={MODELS_ICON}
        tabs={tabs}
        defaultTab={MODELS_TABS.ALL.value}
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
**Purpose:** Centralize all UI configuration and builders

**Responsibilities:**
- Define tab configurations
- Define action list items
- Create builder functions for tab content
- Define helper functions (badge creators, icon creators)
- Export all string constants
- Export all icon constants

**Example:**
```tsx
import { Database, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ActionList } from '@/components/ui/action-list';
import type { ActionItem } from './home.constants';

// Tab configuration
export const MODELS_TABS = {
  ALL: {
    value: 'all',
    label: 'All Models',
    description: 'Browse all available AI models'
  }
} as const;

// Constants
export const MODELS_TITLE = 'Models';
export const MODELS_ICON = Database;

// Helper functions
const createModelBadge = (variant: 'default' | 'destructive', text: string) => (
  <>
    <Badge variant={variant}>{text}</Badge>
    <ChevronRight className="icon-sm" style={{ opacity: 0.5 }} />
  </>
);

// Builder functions
export const buildModelActions = (params: {
  handleModelClick: (modelId: string) => void;
}): ActionItem[] => {
  return [
    {
      icon: <StatusIndicator status="running" />,
      title: 'GPT-4 Turbo',
      description: 'Most capable model',
      actions: createModelBadge('default', 'Available'),
      onClick: () => params.handleModelClick('gpt-4-turbo')
    }
  ];
};

export const buildAllModelsContent = (modelActions: ActionItem[]) => (
  <ActionList title="Available Models" icon={Database} items={modelActions} />
);
```

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

## Best Practices

### DO:
✅ Use builder functions for all tab content
✅ Define all text as constants
✅ Keep page components thin (< 50 lines)
✅ Put all logic in hooks
✅ Put all UI configuration in constants
✅ Use the spread operator with tab constants
✅ Use ActionList for clickable lists
✅ Use TabCard for all tabbed pages

### DON'T:
❌ Write inline JSX arrays in page components
❌ Write business logic in page components
❌ Hardcode strings in page components
❌ Define event handlers inline
❌ Import stores directly in page components (use hooks)
❌ Use old Card component (use TabCard instead)
❌ Create custom tab layouts (use TabCard)

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
   - [ ] Create builder functions for all tab content
   - [ ] Extract all string literals to constants
   - [ ] Create helper functions (badge creators, etc.)

3. **Refactor Page Component**
   - [ ] Import and call the custom hook
   - [ ] Import constants and builders
   - [ ] Replace inline arrays with builder function calls
   - [ ] Replace old Card with TabCard
   - [ ] Remove all inline logic
   - [ ] Verify component is < 50 lines

4. **Test**
   - [ ] Run `npm run build` - ensure no errors
   - [ ] Test all tab switching
   - [ ] Test all click handlers
   - [ ] Test conditional rendering (hidden tabs/items)

## Example: Complete Implementation

See `/src/pages/ModelsPage.tsx` for a complete reference implementation demonstrating:
- ✅ TabCard usage with 3 tabs
- ✅ ActionList usage with clickable items
- ✅ Proper hook integration
- ✅ Builder functions for content
- ✅ Constants for all configuration
- ✅ Clean separation of concerns

## Reference Implementation

**Working Examples:**
- `/src/pages/HomePage.tsx` - Complex page with ActionList and dynamic tabs
- `/src/pages/ModelsPage.tsx` - Simple page demonstrating the pattern

**To Study:**
- `/src/components/ui/tab-card.tsx` - TabCard component
- `/src/components/ui/action-list.tsx` - ActionList component
- `/src/constants/home.constants.tsx` - Complex constants file
- `/src/hooks/useHomePage.ts` - Complex hook with multiple handlers

## Naming Conventions

### Hooks
- All hooks must use camelCase: `usePageName.ts`
- Page-specific hooks should follow: `use[PageName]Page.ts`
- Generic hooks follow: `use[Feature].ts`
- Examples: `useHomePage.ts`, `useModelsPage.ts`, `useChatPage.ts`, `useProvidersPage.ts`

### Constants
- All constants files use camelCase: `pageName.constants.tsx`
- Examples: `home.constants.tsx`, `models.constants.tsx`, `chat.constants.tsx`, `providers.constants.tsx`

### Barrel Files
- A barrel file (`index.ts`) exists at `/src/constants/index.ts` that re-exports all constants
- This allows imports like: `import { MODELS_TABS, CHAT_ICON } from '@/constants'`
- However, explicit imports are preferred for clarity: `import { MODELS_TABS } from '@/constants/models.constants'`
