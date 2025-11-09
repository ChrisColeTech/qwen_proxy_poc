# Frontend V3 Rewrite Implementation Plan MVP

## Overview

This implementation plan provides a complete, phase-by-phase guide for building the frontend application from scratch. The plan follows a proven architecture pattern that emphasizes:

- **Pages → Hooks (logic) → Feature Components (layout) → Constants (data)**
- **Single Responsibility Principle (SRP)**: Each file has one clear purpose
- **Don't Repeat Yourself (DRY)**: Shared logic is abstracted into reusable utilities
- **Domain-Driven Design**: Business logic organized by domain (providers, models, credentials, etc.)
- **Type Safety**: Comprehensive TypeScript coverage with no `any` types

For detailed architecture patterns and best practices, see `docs/70-PAGE_ARCHITECTURE_GUIDE.md`.

## Code Documentation Reference

Complete source code for all phases is available in separate documentation files:

- **Phases 1-3** (Init, Types, Utils): `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`
- **Phases 4-5** (Constants, Services): `docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`
- **Phases 6-7** (Stores, Hooks): `docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`
- **Phases 8-10** (UI Components, Features, Layout): `docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`
- **Phases 11-13** (Pages, App Entry, Styling): `docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`
- **Complete CSS** (Phase 13 Styling): `docs/implementation/09_FRONTEND_COMPLETE_CSS.md`

This document focuses on **planning, architecture, and implementation steps**. Refer to the code documentation files above for complete source code.

---

**Technology Stack:**
- React 18.3.1
- TypeScript 5.9.3
- Vite 7.1.7 (build system)
- Tailwind CSS 3.4.18 (styling framework)
- Zustand 5.0.8 (state management)
- Radix UI (component primitives)
- Socket.io Client 4.8.1 (WebSocket)
- Lucide React 0.553.0 (icons)
- Framer Motion 12.23.24 (animations)

---

## Phase 1: Project Initialization

**Objective**: Set up the Vite + React + TypeScript workspace with all required dependencies.

### Phase 1.1: Create Vite Workspace

**Commands:**
```bash
# From project root
npm create vite@latest frontend -- --template react-ts --no-interactive
cd frontend
npm install
cd ..
```

**Files Created:**
- `frontend/index.html`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`

**Code Reference**: See Phase 1.1 in `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

### Phase 1.2: Install Dependencies

**Commands:**
```bash
cd frontend

# Install React 18 (Vite defaults to React 19)
npm install "react@^18.3.1" "react-dom@^18.3.1"
npm install -D "@types/react@^18.3.26" "@types/react-dom@^18.3.7"

# Install Tailwind CSS and dependencies
npm install -D "tailwindcss@^3.4.18" "postcss@^8.5.6" "autoprefixer@^10.4.21" "tailwindcss-animate@^1.0.7" "class-variance-authority@^0.7.1" "clsx@^2.1.1" "tailwind-merge@^2.6.0" "lucide-react@^0.553.0" "react-icons@^5.5.0"

# Install Radix UI components (for shadcn)
npm install "@radix-ui/react-dialog@^1.1.15" "@radix-ui/react-dropdown-menu@^2.1.16" "@radix-ui/react-label@^2.1.8" "@radix-ui/react-popover@^1.1.15" "@radix-ui/react-select@^2.2.6" "@radix-ui/react-slot@^1.2.4" "@radix-ui/react-switch@^1.2.6" "@radix-ui/react-tabs@^1.1.13" "@radix-ui/react-toast@^1.2.15" "@radix-ui/react-toggle@^1.1.10" "@radix-ui/react-toggle-group@^1.1.11" "@radix-ui/react-tooltip@^1.2.8"

# Install state management and other utilities
npm install "zustand@^5.0.8" "socket.io-client@^4.8.1" "cmdk@^1.1.1" "framer-motion@^12.23.24"

# Install dev dependencies
npm install -D "@types/node@^24.10.0" "kill-port@^2.0.1"

# Initialize Tailwind CSS
npx tailwindcss init -p

cd ..
```

**Files Modified:**
- `frontend/package.json` (dependencies added)
- `frontend/postcss.config.js` (created by tailwindcss init)
- `frontend/tailwind.config.js` (created by tailwindcss init)

**Code Reference**: See Phase 1.2 in `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

### Phase 1.3: Configuration Files

**Files to Create/Modify:**
1. `frontend/vite.config.ts` - Vite configuration with path aliases
2. `frontend/tsconfig.json` - TypeScript project references
3. `frontend/tsconfig.app.json` - TypeScript app configuration
4. `frontend/tailwind.config.js` - Tailwind theme configuration
5. `frontend/src/index.css` - Main CSS entry point with Tailwind directives
6. `frontend/src/vite-env.d.ts` - Electron API type definitions
7. `frontend/package.json` - Add dev scripts

**Code Reference**: See Phase 1.3 in `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

**Validation:**
- Run `npm run build` - should succeed
- Vite config has `@/` path alias
- TypeScript strict mode enabled
- Tailwind dark mode configured

---

## Phase 2: Foundation Layer - Types

**Objective**: Build the complete type system for type-safe development.

### Files to Create:

1. `frontend/src/types/common.types.ts` - Common types (Route, APIResponse, Platform, Theme, SidebarPosition)
2. `frontend/src/types/providers.types.ts` - Provider domain types
3. `frontend/src/types/models.types.ts` - Model domain types (Model, ParsedModel, Capability, CapabilityFilter)
4. `frontend/src/types/chat.types.ts` - Chat functionality types
5. `frontend/src/types/home.types.ts` - Home page types
6. `frontend/src/types/index.ts` - Type barrel export (re-exports all types)

**Code Reference**: See Phase 2 in `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

**Validation:**
- All types exported from `index.ts`
- No `any` types used
- TypeScript compilation succeeds
- No circular dependencies

---

## Phase 3: Foundation Layer - Utilities

**Objective**: Create reusable utility functions following DRY principle.

### Files to Create:

**Core Utilities (2 files):**
1. `frontend/src/utils/platform.ts` - Platform detection (isElectron, isBrowser, getPlatform)
2. `frontend/src/utils/formatters.ts` - Data formatters (formatUptime, formatTimestamp, formatTimeRemaining)

**Library Utilities (4 files):**
3. `frontend/src/lib/utils.ts` - Tailwind `cn()` utility for class merging
4. `frontend/src/lib/constants.ts` - Application-wide constants (APP_NAME, API_BASE_URL, poll intervals, heights)
5. `frontend/src/lib/router.ts` - Simple routing utilities for param extraction
6. `frontend/src/lib/api-guide-examples.ts` - Code examples for API guide (Python, Node.js, cURL)

**Code Reference**: See Phase 3 in `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

**Validation:**
- All functions are pure (no side effects)
- Proper TypeScript typing
- `cn()` utility works with Tailwind classes

---

## Phase 4: Foundation Layer - Constants

**Objective**: Centralize all page-level constants, tab configurations, and data builders.

### Files to Create:

**Page Constants:**
1. `frontend/src/constants/home.constants.tsx` - Home page tabs, icons, data builders
2. `frontend/src/constants/providers.constants.tsx` - Providers page configuration
3. `frontend/src/constants/models.constants.tsx` - Models page configuration
4. `frontend/src/constants/settings.constants.tsx` - Settings page tabs
5. `frontend/src/constants/chat.constants.tsx` - Chat page tabs

**Code Reference**: See Phase 4 in `docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`

**Key Concepts:**
- Constants define tab configurations (value, label, description)
- Data builder functions return ActionItem[] arrays (not complex JSX)
- Simple helper functions create badges/status indicators
- No business logic in constants files

**Validation:**
- All constants properly typed
- No magic strings in codebase
- Tab configurations complete

---

## Phase 5: Service Layer

**Objective**: Implement business logic and API communication layer.

### Files to Create:

**Core Services:**
1. `frontend/src/services/api.service.ts` - HTTP API service (get, post, put, delete, getSettings, updateSetting)

**Domain Services:**
2. `frontend/src/services/providers.service.ts` - Provider operations (getProviders, switchProvider, etc.)
3. `frontend/src/services/models.service.ts` - Model operations (getModels, getAvailableModels, etc.)
4. `frontend/src/services/chatService.ts` - Chat operations (sendMessage, streamChat)

**Code Reference**: See Phase 5 in `docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`

**Architecture:**
- All API calls go through `api.service.ts`
- Domain services encapsulate business logic
- Proper error handling throughout
- Type-safe request/response handling

**Validation:**
- All services export typed functions
- Error handling implemented
- No direct fetch calls in components

---

## Phase 6: State Management Layer

**Objective**: Implement Zustand stores for application state management.

### Files to Create:

**UI & Settings Stores:**
1. `frontend/src/stores/useUIStore.ts` - UI state (theme, sidebar, routing) with localStorage persistence
2. `frontend/src/stores/useSettingsStore.ts` - Application settings (server config, active provider/model)

**Domain Stores:**
3. `frontend/src/stores/useAlertStore.ts` - Toast notifications with auto-dismiss

**Code Reference**: See Phase 6 in `docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`

**Architecture:**
- Zustand for lightweight state management
- Persistence middleware for UI state
- WebSocket integration for real-time updates
- Clear domain boundaries

**Validation:**
- Stores properly typed
- Persistence works correctly
- WebSocket sync functional

---

## Phase 7: Hooks Layer

**Objective**: Create custom React hooks encapsulating all business logic.

### Files to Create:

**Core Hooks:**
1. `frontend/src/hooks/useDarkMode.ts` - Theme management (syncs with DOM)
2. `frontend/src/hooks/useToast.ts` - Toast notifications interface

**Page-Specific Hooks**
3. `frontend/src/hooks/useHomePage.ts` - Home page logic (credentials, proxy status)
4. `frontend/src/hooks/useProvidersPage.ts` - Providers page logic (list, switch)
5. `frontend/src/hooks/useModelsPage.ts` - Models page logic (filtering, selection)
6. `frontend/src/hooks/useSettingsPage.ts` - Settings page logic (fetch, update)

**Code Reference**: See Phase 7 in `docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`

**Architecture Pattern:**
- Hooks encapsulate ALL business logic
- Pages only call hooks and render UI
- Hooks manage state, effects, and event handlers
- Clean separation of concerns

**Validation:**
- All hooks properly typed
- Proper cleanup on unmount
- Return clean API for components

---

## Phase 8: UI Components - Base Layer

**Objective**: Set up shadcn/ui base components and create custom UI components.

### Phase 8.1: Install shadcn/ui

**Commands:**
```bash
cd frontend

# Initialize shadcn/ui with defaults
npx shadcn@latest init -d

# Add all required shadcn components
npx shadcn@latest add button input textarea label card tabs select switch toggle toggle-group toast badge

cd ..
```

**Files Created (shadcn - 12 base components):**
- `frontend/components.json` - shadcn config
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/textarea.tsx`
- `frontend/src/components/ui/label.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/tabs.tsx`
- `frontend/src/components/ui/select.tsx`
- `frontend/src/components/ui/switch.tsx`
- `frontend/src/components/ui/toggle.tsx`
- `frontend/src/components/ui/toggle-group.tsx`
- `frontend/src/components/ui/toast.tsx`
- `frontend/src/components/ui/badge.tsx`

**Note:** These are the foundational Radix UI-based components from shadcn/ui. The tooltip component is also created here but will be listed in Phase 8.2.

**Code Reference**: See Phase 8.1 in `docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

### Phase 8.2: Custom UI Components

**Files to Create (9 custom components):**
1. `frontend/src/components/ui/toaster.tsx` - Toast container with sidebar awareness
2. `frontend/src/components/ui/status-indicator.tsx` - Status dot with pulse animation
3. `frontend/src/components/ui/status-label.tsx` - Status label component
4. `frontend/src/components/ui/action-list.tsx` - Reusable action list for clickable items
5. `frontend/src/components/ui/content-card.tsx` - Content card wrapper
6. `frontend/src/components/ui/tab-card.tsx` - Tab card component (primary page layout)
7. `frontend/src/components/ui/tooltip.tsx` - Tooltip component

**Note:** The current implementation uses 21 UI components total (12 shadcn + 9 custom). The original plan included an `environment-badge.tsx` component, but this was not implemented in the current codebase.

**Code Reference**: See Phase 8.2 in `docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

**Validation:**
- All components render correctly
- Theme support working
- TypeScript types complete

---

## Phase 9: UI Components - Feature Layer

**Objective**: Create feature-specific components organized by domain.

### Files to Create (feature components):

**Home Features (1 component):**
1. `frontend/src/components/features/home/StatusTab.tsx`

**Chat Features (3 components):**
2. `frontend/src/components/features/chat/CurlTab.tsx`
3. `frontend/src/components/features/chat/CustomChatTab.tsx`
4. `frontend/src/components/features/quick-guide/CodeBlock.tsx`

**Provider Features (4 components):**
5. `frontend/src/components/features/providers/AllProvidersTab.tsx`
6. `frontend/src/components/features/providers/ProviderSwitchTab.tsx`
7. `frontend/src/components/features/providers/ProviderTestContent.tsx`
8. `frontend/src/components/features/providers/ProviderTestWrapper.tsx`

**Model Features (4 components):**
9. `frontend/src/components/features/models/AllModelsTab.tsx`
10. `frontend/src/components/features/models/ModelSelectTab.tsx`
11. `frontend/src/components/features/models/ModelTestContent.tsx`
12. `frontend/src/components/features/models/ModelTestWrapper.tsx`

**Settings Features (3 components):**
13. `frontend/src/components/features/settings/AppearanceTab.tsx`
14. `frontend/src/components/features/settings/DebugTab.tsx`
15. `frontend/src/components/features/settings/ProxyTab.tsx`


**Note:** All feature components are organized in domain-specific folders:
- `features/home/` - 1 component (StatusTab)
- `features/chat/` - 2 components (CurlTab, CustomChatTab)
- `features/quick-guide/` - 1 component (CodeBlock)
- `features/providers/` - 4 components (AllProvidersTab, ProviderSwitchTab, ProviderTestContent, ProviderTestWrapper)
- `features/models/` - 4 components (AllModelsTab, ModelSelectTab, ModelTestContent, ModelTestWrapper)
- `features/settings/` - 3 components (AppearanceTab, DebugTab, ProxyTab)


**Code Reference**: See Phase 9 in `docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

**Architecture:**
- Feature components encapsulate complex tab layouts
- Receive data/handlers via props (no business logic)
- Organized by domain/page
- Reusable across different contexts

**Validation:**
- Components accept proper props
- No direct API calls
- No state management (use hooks)

---

## Phase 10: Layout Components

**Objective**: Create core application layout structure.

### Files to Create (4 layout components):

1. `frontend/src/components/layout/AppLayout.tsx` - Main layout container with sidebar positioning
2. `frontend/src/components/layout/Sidebar.tsx` - Navigation sidebar with route management
3. `frontend/src/components/layout/TitleBar.tsx` - Title bar with window controls and theme toggle
4. `frontend/src/components/layout/StatusBar.tsx` - Status bar with environment badge and lifecycle status

**Code Reference**: See Phase 10 in `docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

**Features:**
- Responsive layout behavior
- Sidebar position switching (left/right)
- Window controls for Electron
- Theme toggle integration
- Lifecycle status display

**Validation:**
- Layout responsive on different screen sizes
- Sidebar positioning works
- Window controls work in Electron

---

## Phase 11: Pages

**Objective**: Implement main application pages following the architecture pattern.

### Files to Create (9 pages):

**Core Pages:**
1. `frontend/src/pages/HomePage.tsx` - Dashboard with credentials, proxy status, quick guide
2. `frontend/src/pages/ProvidersPage.tsx` - Provider management (list, switch)
3. `frontend/src/pages/ModelsPage.tsx` - Model browsing (select, browse all, test)
4. `frontend/src/pages/SettingsPage.tsx` - Application settings
5. `frontend/src/pages/ChatPage.tsx` - Chat interface (cURL, custom chat)


**Code Reference**: See Phase 11 in `docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`

**Architecture Pattern (Pages → Hooks → Feature Components → Constants):**
```tsx
// Example: ModelsPage.tsx
import { useModelsPage } from '@/hooks/useModelsPage';
import { ModelSelectTab } from '@/components/features/models/ModelSelectTab';
import { buildModelActions, MODELS_TABS } from '@/constants/models.constants';

export function ModelsPage() {
  // 1. Call hook for business logic
  const { models, activeModel, handleModelSelect } = useModelsPage();

  // 2. Build data structures using constants
  const modelActions = buildModelActions({ models, activeModel, handleModelSelect });

  // 3. Render feature components with data
  return (
    <TabCard tabs={[
      { ...MODELS_TABS.SELECT, content: <ModelSelectTab actions={modelActions} /> }
    ]} />
  );
}
```

**Validation:**
- Pages are thin (< 100 lines)
- No business logic in pages
- Proper loading/error states
- All tabs functional

---

## Phase 12: Application Entry & Routing

**Objective**: Wire up the application with routing and initialization.

### Files to Create/Modify:

1. `frontend/src/App.tsx` - Main app component with routing logic
2. `frontend/src/main.tsx` - React 18 entry point

**Code Reference**: See Phase 12 in `docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`

**App.tsx Key Features:**
- Initialize dark mode (`useDarkMode()`)
- Initialize WebSocket (`useWebSocket()`)
- Load settings on mount
- Client-side routing via switch statement
- Handle dynamic routes (`/providers/:id`, `/models/:id`)
- Render Toaster component globally

**Validation:**
- App initializes correctly
- Routing works for all pages
- Settings load on mount
- WebSocket connects
- Theme applies correctly

---

## Phase 13: Styling System

**Objective**: Create a unified CSS architecture with Tailwind CSS.

### Current CSS Architecture

The current implementation uses a **single consolidated CSS file** instead of multiple modular files:

**Files to Create:**
1. `frontend/src/styles/styles.css` - Single consolidated stylesheet containing:
   - CSS variables for theming (light/dark mode)
   - Base styles and typography
   - Layout component styles (AppLayout, Sidebar, TitleBar, StatusBar)
   - Page-specific styles
   - Feature component styles
   - UI component utilities
   - Custom Tailwind utilities

2. `frontend/src/index.css` - Main CSS entry point that imports:
   - `./styles/styles.css` (all custom styles)
   - `@tailwind base` (Tailwind base styles)
   - `@tailwind components` (Tailwind components)
   - `@tailwind utilities` (Tailwind utilities)

**Code Reference**: See Phase 13 in `docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md` and the complete CSS in `docs/implementation/09_FRONTEND_COMPLETE_CSS.md`

**Architecture:**
- Single consolidated CSS file for all custom styles
- CSS variables for theme support (light/dark mode)
- Tailwind CSS for utility-first styling
- Custom utility classes for common patterns
- Responsive design with Tailwind breakpoints

**Key Features:**
- CSS variables: `--background`, `--foreground`, `--primary`, `--status-*` colors
- Layout classes: `.app-layout-root`, `.sidebar`, `.titlebar`, `.statusbar`
- Component utilities: `.demo-container`, `.code-block-*`, `.provider-switch-*`
- Responsive utilities with `clamp()` for dynamic sizing
- Icon size utilities: `.icon-sm`, `.icon-md`, `.icon-lg`

**Validation:**
- All styles compile correctly
- Theme switching works (light/dark mode)
- Responsive design functional
- No style conflicts

---