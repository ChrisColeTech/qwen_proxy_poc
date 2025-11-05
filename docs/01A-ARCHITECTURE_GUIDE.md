# qwen-proxy - Architecture Guide

## Document Information
- **Document**: 01 - Architecture Guide
- **Version**: 1.0
- **Date**: October 7, 2025
- **Purpose**: Define architectural patterns, principles, and implementation guidelines

---

## 1. Architectural Principles

### 1.1 Core Principles

**Single Responsibility Principle (SRP):**
- Each component, function, and module should have only one reason to change
- Pages handle ONLY page-level layout and composition - no business logic
- Layout components handle ONLY structure - no feature logic
- Feature components handle ONLY feature-specific UI - no data management
- Stores handle ONLY state management - no UI concerns
- Services handle ONLY business logic - no state or UI
- Clear separation between presentation, business logic, and data access

**NO Inline Tailwind Classes:**
- ALL styling must be defined as custom CSS classes in `index.css`
- Components use semantic class names, never inline Tailwind utilities
- This enforces consistency, reusability, and maintainability
- Makes styling changes centralized and predictable
- Example: Use `.sidebar-item` instead of `className="w-full hover:bg-accent transition-colors"`

**Theme Variables Only:**
- NEVER use hardcoded colors like `text-white`, `bg-gray-100`, `border-blue-300`
- ALWAYS use theme variables: `text-foreground`, `bg-background`, `border-border`
- Ensures dark mode compatibility automatically
- Maintains visual consistency across the application
- Example: Use `text-foreground` not `text-gray-900`

**Don't Repeat Yourself (DRY):**
- All CSS patterns defined once in `index.css` and reused
- Shared logic extracted into utilities and services
- Common UI patterns componentized in reusable components
- Type definitions centralized in dedicated type files
- Configuration centralized in constants

**State Management via Zustand:**
- Global state managed through Zustand stores with automatic persistence
- No prop drilling - components access stores directly
- Selective subscriptions for optimal performance
- Actions colocated with state for clarity
- Persistence middleware handles localStorage automatically

### 1.2 Architectural Patterns

**Layered Architecture:**
- **Presentation Layer**: React Components (pure UI, no business logic)
- **Application Layer**: Zustand Stores & Services (state management, business logic)
- **Domain Layer**: Types & Constants (business rules, data structures)
- **Infrastructure Layer**: Browser APIs & Local Storage (external integrations)

**State Management Pattern:**
- Zustand stores as single source of truth
- Persistent state via middleware (localStorage)
- Selective subscriptions to prevent unnecessary re-renders
- Direct store access (no context providers or prop drilling)

**Component Composition:**
- Atomic design principles (atoms, molecules, organisms)
- Layout components provide structure
- Feature components provide functionality
- Pages compose layouts and features
- Clear hierarchy and responsibility boundaries

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │    Pages    │ │   Layout    │ │  Features   │          │
│  │             │ │  Components │ │ Components  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Zustand   │ │  Services   │ │    Hooks    │          │
│  │   Stores    │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │    Types    │ │  Constants  │ │ Validators  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ LocalStorage│ │ Browser APIs│ │ Electron IPC│          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Application Layout Architecture

**VS Code-Inspired Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  TITLE BAR (Fixed, 48px)                        🌙 ⚙️      │
├──────────────┬──────────────────────────────────────────────┤
│              │                                               │
│  SIDEBAR     │         MAIN CONTENT AREA                    │
│  (Collapsible│         (Scrollable)                         │
│   48px/224px)│                                               │
│              │                                               │
│  🏠 Home     │   Dynamic page content renders here          │
│  ⚙️  Config  │   based on navigation state                  │
│  📺 Console  │                                               │
│  📊 Metrics  │                                               │
│  📦 Models   │                                               │
│              │                                               │
├──────────────┴──────────────────────────────────────────────┤
│  STATUS BAR (Fixed, 24px)                      ✓ Ready      │
└─────────────────────────────────────────────────────────────┘
```

**Layout Components:**
1. **AppLayout**: Root container (`h-screen flex flex-col`)
2. **TitleBar**: Fixed top bar with app title and controls
3. **Sidebar**: Collapsible navigation (48px collapsed, 224px expanded)
4. **MainContent**: Scrollable content area (`flex-1 overflow-auto`)
5. **StatusBar**: Fixed bottom bar with status indicators

**Layout Flow:**
- TitleBar is always visible at top
- Middle section uses flexbox for Sidebar + MainContent
- StatusBar is always visible at bottom
- MainContent handles all scrolling (not the entire page)
- Sidebar collapses to icon-only mode for more space

---

## 3. Frontend Architecture

### 3.1 Component Architecture

**Atomic Design Principles:**
- **Atoms**: Basic UI elements in `components/ui/` (Button, Input, Card from shadcn/ui)
- **Molecules**: Layout components in `components/layout/` (Sidebar, TitleBar, StatusBar)
- **Organisms**: Feature components in `components/features/` (ConfigForm, LogViewer, ModelCard)
- **Templates**: Reusable page layouts (currently using MainContent wrapper)
- **Pages**: Complete pages in `pages/` (HomePage, etc.)

**Component Responsibilities:**

**Pages (pages/):**
- Compose layout and feature components
- Handle page-level state coordination
- Wrap content in `<MainContent>` wrapper
- NO business logic or data fetching
- NO inline Tailwind classes
- Example: `HomePage.tsx`, `SettingsPage.tsx`

**Layout Components (components/layout/):**
- Provide application structure
- Handle layout-specific interactions (sidebar collapse, theme toggle)
- Access UI store for layout state
- Example: `Sidebar.tsx`, `TitleBar.tsx`, `AppLayout.tsx`

**Feature Components (components/features/):**
- Implement feature-specific UI and interactions
- Access appropriate stores for feature state
- Organized by domain (settings/, activity/, providers/, models/, etc)
- Example: `ProfileSelector.tsx`, `LogViewer.tsx`, `ModelCard.tsx`

**UI Components (components/ui/):**
- shadcn/ui primitives (Button, Input, Card, Dialog, etc.)
- Fully styled, accessible, and composable
- Never modified directly (use wrapper components if customization needed)

### 3.2 State Management with Zustand

**Store Architecture:**

**useUIStore:**
- Purpose: UI-specific state (theme, sidebar collapsed, current screen)
- Persistence: Yes (localStorage via persist middleware)
- Key: `qwen-proxy-ui-state`
- State:
  - `theme`: 'light' | 'dark'
  - `sidebarCollapsed`: boolean
  - `currentScreen`: ScreenType
  - `panelSizes`: Record<string, number>

**useConfigStore:**
- Purpose: Server configuration and profiles
- Persistence: Yes
- Key: `qwen-proxy-config-state`
- State:
  - `profiles`: Array of server configurations
  - `activeProfile`: Current profile ID
  - Configuration settings (host, port, model path, parameters)

**useProcessStore:**
- Purpose: Server process state, logs, and metrics
- Persistence: No (runtime state only)
- State:
  - `status`: ServerStatus ('stopped' | 'starting' | 'running' | 'stopping' | 'failed')
  - `logs`: Array of log entries
  - `metrics`: Performance metrics data

**useModelsStore:**
- Purpose: Model library management
- Persistence: Yes
- Key: `qwen-proxy-models-state`
- State:
  - `models`: Array of model definitions
  - `favorites`: Set of favorite model IDs

**Store Access Pattern:**
```typescript
// ✅ CORRECT - Selective subscription
const currentScreen = useUIStore((state) => state.uiState.currentScreen);
const setCurrentScreen = useUIStore((state) => state.setCurrentScreen);

// ❌ WRONG - Subscribes to entire state
const uiStore = useUIStore();
const currentScreen = uiStore.uiState.currentScreen;
```

**State Persistence:**
- Automatic via Zustand persist middleware
- Configured at store creation time
- Saves to localStorage on state changes
- Restores from localStorage on app load
- No manual save/load logic needed

### 3.3 Navigation Architecture

**State-Based Navigation (No React Router):**
- Navigation controlled via `useUIStore.currentScreen` state
- Sidebar items call `setCurrentScreen(screenName)`
- App.tsx renders appropriate page based on state
- Benefits:
  - No external routing library needed
  - Simple and predictable
  - State persists automatically via Zustand
  - Works seamlessly in Electron wrapper
  - No URL management complexity

**Navigation Flow:**
```typescript
// In Sidebar.tsx
onClick={() => setCurrentScreen('config')}

// In App.tsx
const currentScreen = useUIStore((state) => state.uiState.currentScreen);

const renderScreen = () => {
  switch (currentScreen) {
    case 'config':
      return <ConfigPage />;
    case 'console':
      return <ConsolePage />;
    // ... other cases
  }
};
```

**Screen Persistence:**
- Last visited screen automatically persists
- User returns to same screen after app reload
- No manual save/restore logic needed

---

## 4. File Structure and Organization

### 4.1 Complete Directory Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/                      # Static assets
│   │   └── .gitkeep
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── popover.tsx
│   │   │   └── command.tsx
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── AppLayout.tsx        # Root container
│   │   │   ├── TitleBar.tsx         # Top bar with controls
│   │   │   ├── StatusBar.tsx        # Bottom status indicators
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   └── MainContent.tsx      # Scrollable content wrapper
│   │   │
│   │   └── features/                # Feature components
│   │
│   ├── pages/                       # Page components
│   │   ├── HomePage.tsx
│   │   ├── ModelsPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── useUIStore.ts
│   │   ├── useConfigStore.ts
│   │   ├── useProcessStore.ts
│   │   └── useModelsStore.ts
│   │
│   ├── services/                    # Business logic
│   │   ├── serverService.ts
│   │   ├── configService.ts
│   │   └── processService.ts
│   │
│   ├── types/                       # Type definitions
│   │   ├── common.types.ts
│   │   ├── server.types.ts
│   │   ├── model.types.ts
│   │   └── index.ts
│   │
│   ├── hooks/                       # Custom hooks
│   │   └── useDarkMode.ts
│   │
│   ├── lib/                         # Core utilities
│   │   ├── utils.ts                 # shadcn cn() function
│   │   └── constants.ts             # App constants
│   │
│   ├── utils/                       # Helper utilities
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Global styles & custom classes
│   └── vite-env.d.ts
│
├── docs/                            # Documentation
│   ├── 01-ARCHITECTURE_GUIDE.md
│   ├── 02-STYLE_GUIDE_V2.md
│   └── [phase documentation]
│
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

### 4.2 Why This Structure Works

**Technical Cohesion:**
- All pages together - consistent page patterns
- All layout components together - unified layout structure
- All feature components grouped by domain - clear boundaries
- All stores together - centralized state management
- All types together - easy cross-referencing

**Domain Organization:**
- Features organized by business domain (config, console, metrics, models)
- Related functionality grouped together
- Clear separation between different concerns

**Development Efficiency:**
- Working on configuration? All config components in one place
- Need to update types? All types centralized
- Adding new feature? Follow established component patterns
- Clear mental model of where everything lives

---

## 5. CSS Architecture & Styling System

### 5.1 NO Inline Tailwind Rule

**Critical Rule: NEVER use inline Tailwind classes in components**

**❌ WRONG:**
```tsx
<div className="flex items-center justify-between p-4 bg-gray-100">
  <span className="text-lg font-bold text-blue-600">Title</span>
</div>
```

**✅ CORRECT:**
```tsx
<div className="header-container">
  <span className="header-title">Title</span>
</div>

// In index.css:
.header-container {
  @apply flex items-center justify-between p-4 bg-background;
}

.header-title {
  @apply text-lg font-bold text-primary;
}
```

**Why This Rule Exists:**
1. **Consistency**: All styling decisions made once, applied everywhere
2. **Maintainability**: Change styling in one place, updates everywhere
3. **Readability**: Components focus on structure, not styling details
4. **Theme Support**: All colors use theme variables automatically
5. **Enforceability**: Easy to code review and enforce

### 5.2 Custom CSS Class Naming Convention

**Pattern: `.[component]-[element]-[modifier]`**

**Component Prefixes:**
- `.sidebar-*` - Sidebar component classes
- `.titlebar-*` - Title bar component classes
- `.statusbar-*` - Status bar component classes
- `.layout-*` - Layout utility classes
- `.page-*` - Page-level classes
- `.home-*` - Home page specific
- `.config-*` - Configuration page
- `.console-*` - Console page
- `.metrics-*` - Metrics page
- `.model-*` - Models page
- `.icon-*` - Icon utility classes

**Examples:**
```css
/* Sidebar classes */
.sidebar                      /* Base component */
.sidebar-collapsed            /* State variant */
.sidebar-expanded             /* State variant */
.sidebar-item                 /* Child element */
.sidebar-item-active          /* Element state */
.sidebar-item-border-top      /* Element modifier */
.sidebar-button               /* Child element */
.sidebar-button-shrink        /* Element modifier */
.sidebar-label                /* Child element */
.sidebar-label-nowrap         /* Element modifier */

/* Icon utility classes */
.icon-xs                      /* Size: 12px */
.icon-sm                      /* Size: 16px */
.icon-md                      /* Size: 20px (default) */
.icon-lg                      /* Size: 32px */
.icon-xl                      /* Size: 64px */
```

### 5.3 Theme Variable System

**Available Theme Variables:**
```css
/* Backgrounds */
bg-background          /* Main background */
bg-card                /* Card backgrounds */
bg-popover             /* Popover/dropdown backgrounds */
bg-muted               /* Muted/secondary backgrounds */
bg-accent              /* Accent/hover backgrounds */
bg-primary             /* Primary button backgrounds */
bg-secondary           /* Secondary button backgrounds */
bg-destructive         /* Error/danger backgrounds */

/* Foregrounds (Text) */
text-foreground        /* Primary text */
text-card-foreground   /* Text on cards */
text-muted-foreground  /* Secondary/muted text */
text-primary           /* Primary accent text */
text-secondary         /* Secondary text */
text-destructive       /* Error/danger text */

/* Borders */
border-border          /* Standard borders */
border-input           /* Input borders */
border-primary         /* Primary accent borders */
border-destructive     /* Error borders */
```

**❌ NEVER USE HARDCODED COLORS:**
```css
/* WRONG */
.error-message {
  @apply text-red-500 bg-red-100 border-red-300;
}

.sidebar-item {
  @apply bg-gray-100 text-gray-900;
}
```

**✅ ALWAYS USE THEME VARIABLES:**
```css
/* CORRECT */
.error-message {
  @apply text-destructive bg-destructive/10 border-destructive;
}

.sidebar-item {
  @apply bg-background text-foreground hover:bg-accent;
}
```

### 5.4 Dark Mode Support

**Automatic via Theme Variables:**
- All colors defined in `:root` for light mode
- All colors redefined in `.dark` for dark mode
- Components using theme variables adapt automatically
- No manual dark mode logic needed in components

**Theme Variables in index.css:**
```css
:root {
  --background: 0 0% 100%;          /* White */
  --foreground: 0 0% 3.9%;          /* Near black */
  /* ... other light theme colors */
}

.dark {
  --background: 0 0% 3.9%;          /* Near black */
  --foreground: 0 0% 98%;           /* Off white */
  /* ... other dark theme colors */
}
```

**Theme Toggle:**
- Controlled by `useUIStore.toggleTheme()`
- Adds/removes `.dark` class on document element
- All components update automatically via CSS custom properties

---

## 6. Implementation Guidelines

### 6.1 The Golden Path: Adding New Features

**Step-by-Step Process:**

**1. Define Types (`types/`)**
```typescript
// types/feature.types.ts
export interface FeatureData {
  id: string;
  name: string;
  value: number;
}

export type FeatureStatus = 'idle' | 'loading' | 'success' | 'error';
```

**2. Add Store State (`stores/`)**
```typescript
// stores/useFeatureStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeatureStore {
  data: FeatureData[];
  status: FeatureStatus;
  addData: (data: FeatureData) => void;
  removeData: (id: string) => void;
}

export const useFeatureStore = create<FeatureStore>()(
  persist(
    (set) => ({
      data: [],
      status: 'idle',
      addData: (data) => set((state) => ({
        data: [...state.data, data]
      })),
      removeData: (id) => set((state) => ({
        data: state.data.filter(item => item.id !== id)
      })),
    }),
    { name: 'qwen-proxy-feature-state' }
  )
);
```

**3. Create Service (`services/`)**
```typescript
// services/featureService.ts
import type { FeatureData } from '@/types/feature.types';

export const featureService = {
  validate: (data: FeatureData): boolean => {
    return data.name.length > 0 && data.value > 0;
  },

  transform: (rawData: unknown): FeatureData => {
    // Transform external data to internal format
    return {
      id: crypto.randomUUID(),
      name: String(rawData.name),
      value: Number(rawData.value)
    };
  }
};
```

**4. Define CSS Classes (`index.css`)**
```css
/* Feature Component Styles */
.feature-container {
  @apply max-w-7xl mx-auto py-8 px-4;
}

.feature-header {
  @apply mb-6 flex items-center justify-between;
}

.feature-title {
  @apply text-3xl font-bold text-foreground;
}

.feature-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.feature-card {
  @apply border rounded-lg p-4 bg-card hover:shadow-md transition-all cursor-pointer;
}

.feature-card-active {
  @apply border-primary bg-primary/5;
}
```

**5. Create Feature Components (`components/features/feature/`)**
```typescript
// components/features/feature/FeatureCard.tsx
import { useFeatureStore } from '@/stores/useFeatureStore';
import type { FeatureData } from '@/types/feature.types';

interface FeatureCardProps {
  data: FeatureData;
}

export function FeatureCard({ data }: FeatureCardProps) {
  const removeData = useFeatureStore((state) => state.removeData);

  return (
    <div className="feature-card">
      <h3 className="feature-card-title">{data.name}</h3>
      <p className="feature-card-value">{data.value}</p>
      <button
        onClick={() => removeData(data.id)}
        className="feature-card-delete-button"
      >
        Delete
      </button>
    </div>
  );
}
```

**6. Create Page (`pages/`)**
```typescript
// pages/FeaturePage.tsx
import { MainContent } from '@/components/layout/MainContent';
import { FeatureCard } from '@/components/features/feature/FeatureCard';
import { useFeatureStore } from '@/stores/useFeatureStore';

export function FeaturePage() {
  const data = useFeatureStore((state) => state.data);
  const addData = useFeatureStore((state) => state.addData);

  return (
    <MainContent>
      <div className="feature-container">
        <div className="feature-header">
          <h1 className="feature-title">Feature Page</h1>
          <button
            onClick={() => addData({ id: crypto.randomUUID(), name: 'New', value: 100 })}
            className="feature-add-button"
          >
            Add Item
          </button>
        </div>

        <div className="feature-grid">
          {data.map(item => (
            <FeatureCard key={item.id} data={item} />
          ))}
        </div>
      </div>
    </MainContent>
  );
}
```

**7. Add Navigation**
- Add screen type to `types/common.types.ts`
- Add navigation item to `Sidebar.tsx`
- Add route case to `App.tsx`
- Test navigation flow

### 6.2 Component Creation Checklist

Before creating any component:

- [ ] **Types defined** in `types/` directory
- [ ] **CSS classes defined** in `index.css` with proper naming
- [ ] **Store created** if feature needs state management
- [ ] **Service created** if feature needs business logic
- [ ] **Component structure planned** (atoms → molecules → organisms)
- [ ] **No inline Tailwind classes** in component file
- [ ] **Only theme variables used** for colors
- [ ] **TypeScript strict mode compliant** (no `any` types)
- [ ] **Import paths use @ alias** (not relative paths)
- [ ] **Named exports used** (not default exports)

### 6.3 Store Integration Pattern

**Access Store in Component:**
```typescript
// ✅ CORRECT - Selective subscription
export function MyComponent() {
  const data = useMyStore((state) => state.data);
  const updateData = useMyStore((state) => state.updateData);

  return (
    <div onClick={() => updateData(newValue)}>
      {data}
    </div>
  );
}

// ❌ WRONG - Full store subscription (causes unnecessary re-renders)
export function MyComponent() {
  const store = useMyStore();

  return (
    <div onClick={() => store.updateData(newValue)}>
      {store.data}
    </div>
  );
}
```

**Multiple Store Access:**
```typescript
export function MyComponent() {
  // Access multiple stores - each subscription is selective
  const uiTheme = useUIStore((state) => state.uiState.theme);
  const serverStatus = useProcessStore((state) => state.status);
  const currentModel = useConfigStore((state) => state.activeProfile.modelPath);

  // Component only re-renders when these specific values change
}
```

---

## 7. Anti-Patterns to Avoid

### 7.1 Styling Anti-Patterns

**❌ Inline Tailwind Classes:**
```tsx
// NEVER DO THIS
<div className="flex items-center justify-between p-4 bg-gray-100">
  <span className="text-lg font-bold text-blue-600">Title</span>
</div>
```

**❌ Hardcoded Colors:**
```css
/* NEVER DO THIS */
.my-component {
  background-color: #ffffff;
  color: #000000;
  border: 1px solid #cccccc;
}
```

**❌ Mixed Styling Approaches:**
```tsx
// NEVER MIX INLINE AND CUSTOM CLASSES
<div className="my-component flex items-center">
  <span className="my-label text-lg font-bold">Title</span>
</div>
```

### 7.2 State Management Anti-Patterns

**❌ Prop Drilling:**
```tsx
// NEVER DRILL PROPS THROUGH MULTIPLE LEVELS
<Parent data={data}>
  <Child data={data}>
    <GrandChild data={data} />
  </Child>
</Parent>

// USE ZUSTAND STORE INSTEAD
// GrandChild directly accesses: const data = useMyStore((state) => state.data);
```

**❌ Local State for Global Data:**
```tsx
// NEVER USE useState FOR GLOBAL DATA
function MyComponent() {
  const [config, setConfig] = useState<Config>({});
  // This creates isolated state that doesn't sync across components
}

// USE ZUSTAND STORE INSTEAD
function MyComponent() {
  const config = useConfigStore((state) => state.config);
  const setConfig = useConfigStore((state) => state.setConfig);
}
```

**❌ Manual Persistence:**
```tsx
// NEVER MANUALLY SAVE TO LOCALSTORAGE
function MyComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
  }, [data]);
}

// ZUSTAND PERSIST MIDDLEWARE HANDLES THIS AUTOMATICALLY
```

### 7.3 Component Architecture Anti-Patterns

**❌ Business Logic in Components:**
```tsx
// NEVER PUT BUSINESS LOGIC IN COMPONENTS
function MyComponent() {
  const handleSubmit = (data: FormData) => {
    // Complex validation logic
    // API calls
    // Data transformation
    // State updates
  };
}

// PUT BUSINESS LOGIC IN SERVICES
function MyComponent() {
  const submitData = useMyStore((state) => state.submitData);

  const handleSubmit = (data: FormData) => {
    submitData(data); // Service handles everything
  };
}
```

**❌ Massive Components:**
```tsx
// NEVER CREATE 500+ LINE COMPONENTS
function GiantComponent() {
  // Hundreds of lines of JSX
  // Multiple concerns mixed together
  // Impossible to maintain
}

// BREAK INTO SMALLER COMPONENTS
function ParentComponent() {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  );
}
```

**❌ Default Exports:**
```tsx
// AVOID DEFAULT EXPORTS FOR COMPONENTS
export default function MyComponent() {}

// USE NAMED EXPORTS
export function MyComponent() {}
```

### 7.4 Type Safety Anti-Patterns

**❌ Using `any` Type:**
```typescript
// NEVER USE any
function processData(data: any) {
  return data.something;
}

// DEFINE PROPER TYPES
interface DataType {
  something: string;
}

function processData(data: DataType) {
  return data.something;
}
```

**❌ Inline Interfaces:**
```typescript
// NEVER DEFINE INLINE INTERFACES
function MyComponent({ name, age }: { name: string; age: number }) {}

// DEFINE INTERFACES IN TYPES FILES
interface MyComponentProps {
  name: string;
  age: number;
}

function MyComponent({ name, age }: MyComponentProps) {}
```

---

## 8. Performance Optimization

### 8.1 Zustand Selective Subscriptions

**Pattern: Subscribe only to what you need**

```typescript
// ✅ OPTIMAL - Only re-renders when currentScreen changes
const currentScreen = useUIStore((state) => state.uiState.currentScreen);

// ❌ SUBOPTIMAL - Re-renders on any uiState change
const uiState = useUIStore((state) => state.uiState);
const currentScreen = uiState.currentScreen;
```

### 8.2 Component Memoization

**Use React.memo for expensive components:**
```typescript
import { memo } from 'react';

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Expensive rendering logic
  return <div>{/* ... */}</div>;
});
```

### 8.3 CSS Performance

**Use CSS for animations (not JavaScript):**
```css
/* ✅ CORRECT - GPU accelerated */
.sidebar {
  @apply transition-[width] duration-300;
}

/* ❌ WRONG - JavaScript animation */
// Animating width with useState and useEffect
```

---

## 9. Testing Strategy

### 9.1 Component Testing

**Test component rendering and interactions:**
- Verify correct CSS classes applied
- Test user interactions (clicks, inputs)
- Verify store subscriptions work correctly
- Test conditional rendering logic

### 9.2 Store Testing

**Test Zustand stores:**
- Verify initial state
- Test action functions update state correctly
- Test persistence middleware (if applicable)
- Test derived state and selectors

### 9.3 Service Testing

**Test business logic:**
- Unit test validation functions
- Test data transformations
- Test error handling
- Mock external dependencies

---

## 10. Development Workflow

### 10.1 Starting a New Feature

1. **Plan the feature** - Understand requirements and user flow
2. **Define types** - Create interfaces in `types/`
3. **Design CSS** - Define all classes in `index.css`
4. **Create store** (if needed) - Add Zustand store with persistence
5. **Create service** (if needed) - Add business logic
6. **Build components** - Start with smallest atoms, build up
7. **Create page** - Compose components in page component
8. **Add navigation** - Update sidebar and routing
9. **Test thoroughly** - Verify all interactions work
10. **Code review** - Ensure all guidelines followed

### 10.2 Code Review Checklist

**CSS & Styling:**
- [ ] No inline Tailwind classes in components
- [ ] All custom CSS classes defined in `index.css`
- [ ] Only theme variables used for colors (no hardcoded colors)
- [ ] Class names follow naming conventions (component-element-modifier)
- [ ] Dark mode tested and working

**TypeScript:**
- [ ] No `any` types used
- [ ] Explicit return types on functions
- [ ] Interfaces defined in `types/` files (not inline)
- [ ] Type imports use `import type` where possible
- [ ] No TypeScript errors or warnings

**Components:**
- [ ] Named exports (not default exports)
- [ ] Imports use `@/` path alias (not relative paths)
- [ ] Pages wrapped in `<MainContent>`
- [ ] Component follows single responsibility principle
- [ ] No business logic in components

**State Management:**
- [ ] Zustand stores accessed with selective subscriptions
- [ ] No prop drilling (components access stores directly)
- [ ] Store actions used for state updates (not direct mutations)
- [ ] Persistence configured correctly (if applicable)

**Code Quality:**
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings in browser
- [ ] Component tested manually in all states

---

## 11. Troubleshooting Guide

### 11.1 Common Build Errors

**Error: "Cannot find module '@/...'"**
- **Cause**: TypeScript path alias not configured
- **Fix**: Verify `tsconfig.json` and `vite.config.ts` have path alias configuration

**Error: "Property does not exist on type"**
- **Cause**: Type definitions missing or incorrect
- **Fix**: Add proper type definitions in `types/` directory

**Error: CSS classes not applying**
- **Cause**: Class names don't match `index.css` definitions
- **Fix**: Verify class names match exactly (check for typos)

### 11.2 Common Runtime Issues

**Issue: Component not re-rendering on state change**
- **Cause**: Incorrect Zustand subscription
- **Fix**: Use selective subscription pattern: `useStore((state) => state.value)`

**Issue: Dark mode not working**
- **Cause**: Hardcoded colors instead of theme variables
- **Fix**: Replace all hardcoded colors with theme variables

**Issue: Styles inconsistent across components**
- **Cause**: Mixing inline Tailwind with custom classes
- **Fix**: Remove all inline Tailwind, use only custom CSS classes

---

## 12. Future Enhancements

### 12.1 Planned Architecture Improvements

- Add React Router for deep linking support (optional)
- Implement error boundaries for better error handling
- Add service worker for offline support
- Implement virtual scrolling for large data sets
- Add comprehensive E2E test suite

### 12.2 Scalability Considerations

- Current architecture supports 50+ pages without refactoring
- Zustand stores can be split if they grow too large
- Feature components can be lazy-loaded if bundle size becomes an issue
- CSS can be split by page/feature if needed

---

## Summary

This architecture guide establishes the foundational patterns and principles for the qwen-proxyapplication:

**Core Principles:**
- NO inline Tailwind classes (all styling in `index.css`)
- Theme variables only (no hardcoded colors)
- Zustand for state management with automatic persistence
- State-based navigation (no React Router complexity)
- Clear separation of concerns (pages, layout, features, stores, services)

**Key Patterns:**
- Custom CSS class naming: `component-element-modifier`
- Selective Zustand subscriptions for performance
- Named exports for all components
- `@/` path alias for imports
- MainContent wrapper for all pages

**Development Flow:**
1. Define types → 2. Create CSS classes → 3. Build stores → 4. Create services → 5. Build components → 6. Compose pages → 7. Add navigation

Follow these guidelines religiously to maintain consistency, readability, and maintainability across the entire codebase.

---

**For specific implementation details, see:**
- `02-STYLE_GUIDE_V2.md` - Detailed style guide with examples
- Phase documentation in `/docs` - Step-by-step implementation guides
