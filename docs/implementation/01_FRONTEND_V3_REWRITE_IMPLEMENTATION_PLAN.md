# Frontend V3 Rewrite Implementation Plan

## Overview

This implementation plan provides a complete, phase-by-phase guide for building the frontend application from scratch. The plan follows a proven architecture pattern that emphasizes:

- **Pages → Hooks (logic) → Feature Components (layout) → Constants (data)**
- **Single Responsibility Principle (SRP)**: Each file has one clear purpose
- **Don't Repeat Yourself (DRY)**: Shared logic is abstracted into reusable utilities
- **Domain-Driven Design**: Business logic organized by domain (providers, models, credentials, etc.)
- **Type Safety**: Comprehensive TypeScript coverage with no `any` types

For detailed architecture patterns and best practices, see `/Users/chris/Projects/qwen_proxy_poc/docs/70-PAGE_ARCHITECTURE_GUIDE.md`.

## Code Documentation Reference

Complete source code for all phases is available in separate documentation files:

- **Phases 1-3** (Init, Types, Utils): `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`
- **Phases 4-5** (Constants, Services): `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`
- **Phases 6-7** (Stores, Hooks): `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`
- **Phases 8-10** (UI Components, Features, Layout): `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`
- **Phases 11-13** (Pages, App Entry, Styling): `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`
- **Complete CSS** (Phase 13 Styling): `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/09_FRONTEND_COMPLETE_CSS.md`

This document focuses on **planning, architecture, and implementation steps**. Refer to the code documentation files above for complete source code.

---

## Current Implementation Summary

**Architecture:**
- 9 Pages (100% using TypeScript .tsx)
- 13 Hooks (100% encapsulating business logic)
- 46 Components total:
  - 20 UI components (base shadcn + custom)
  - 4 Layout components
  - 22 Feature components (organized by domain)
- 9 Constants files (centralized configuration)
- 7 Services (API, WebSocket, domain services)
- 9 Type files (comprehensive type system)
- 6 Stores (Zustand state management)
- 23 CSS files (modular styling system)

**Technology Stack:**
- React 18.3.1
- TypeScript 5.9.3
- Vite 7.1.7 (build system)
- Tailwind CSS 3.4.18 (styling)
- Zustand 5.0.8 (state management)
- Radix UI (component primitives)
- Socket.io Client 4.8.1 (WebSocket)
- Lucide React 0.553.0 (icons)

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

**Code Reference**: See Phase 1.1 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

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

**Code Reference**: See Phase 1.2 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

### Phase 1.3: Configuration Files

**Files to Create/Modify:**
1. `frontend/vite.config.ts` - Vite configuration with path aliases
2. `frontend/tsconfig.json` - TypeScript project references
3. `frontend/tsconfig.app.json` - TypeScript app configuration
4. `frontend/tailwind.config.js` - Tailwind theme configuration
5. `frontend/src/index.css` - Main CSS entry point with Tailwind directives
6. `frontend/src/vite-env.d.ts` - Electron API type definitions
7. `frontend/package.json` - Add dev scripts

**Code Reference**: See Phase 1.3 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

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
4. `frontend/src/types/credentials.types.ts` - Credentials types
5. `frontend/src/types/proxy.types.ts` - Proxy server types
6. `frontend/src/types/chat.types.ts` - Chat functionality types
7. `frontend/src/types/home.types.ts` - Home page types
8. `frontend/src/types/quick-guide.types.ts` - Quick guide types
9. `frontend/src/types/index.ts` - Type barrel export (re-exports all types)

**Code Reference**: See Phase 2 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

**Validation:**
- All types exported from `index.ts`
- No `any` types used
- TypeScript compilation succeeds
- No circular dependencies

---

## Phase 3: Foundation Layer - Utilities

**Objective**: Create reusable utility functions following DRY principle.

### Files to Create:

**Core Utilities:**
1. `frontend/src/utils/platform.ts` - Platform detection (isElectron, isBrowser, getPlatform)
2. `frontend/src/utils/formatters.ts` - Data formatters (formatUptime, formatTimestamp, formatTimeRemaining)

**Library Utilities:**
3. `frontend/src/lib/utils.ts` - Tailwind `cn()` utility for class merging
4. `frontend/src/lib/constants.ts` - Application-wide constants (APP_NAME, API_BASE_URL, poll intervals, heights)
5. `frontend/src/lib/router.ts` - Simple routing utilities for param extraction
6. `frontend/src/lib/api-guide-examples.ts` - Code examples for API guide (Python, Node.js, cURL)

**Code Reference**: See Phase 3 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

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
6. `frontend/src/constants/modelForm.constants.tsx` - Model form configuration
7. `frontend/src/constants/providerForm.constants.tsx` - Provider form configuration

**Guide Constants:**
8. `frontend/src/constants/browserGuide.constants.tsx` - Browser guide content
9. `frontend/src/constants/desktopGuide.constants.tsx` - Desktop guide content

**Code Reference**: See Phase 4 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`

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
2. `frontend/src/services/websocket.service.ts` - WebSocket service (connect, disconnect, on, off, emit)

**Domain Services:**
3. `frontend/src/services/providers.service.ts` - Provider operations (getProviders, switchProvider, etc.)
4. `frontend/src/services/models.service.ts` - Model operations (getModels, getAvailableModels, etc.)
5. `frontend/src/services/credentials.service.ts` - Credentials operations
6. `frontend/src/services/chatService.ts` - Chat operations (sendMessage, streamChat)
7. `frontend/src/services/proxy.service.ts` - Proxy management (getStatus, start, stop)

**Code Reference**: See Phase 5 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`

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
3. `frontend/src/stores/useCredentialsStore.ts` - Credentials state with WebSocket sync
4. `frontend/src/stores/useProxyStore.ts` - Proxy server state with WebSocket sync
5. `frontend/src/stores/useLifecycleStore.ts` - Application lifecycle state
6. `frontend/src/stores/useAlertStore.ts` - Toast notifications with auto-dismiss

**Code Reference**: See Phase 6 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`

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

**Core Hooks (6 files):**
1. `frontend/src/hooks/useDarkMode.ts` - Theme management (syncs with DOM)
2. `frontend/src/hooks/useWebSocket.ts` - WebSocket connection management
3. `frontend/src/hooks/useToast.ts` - Toast notifications interface
4. `frontend/src/hooks/useExtensionDetection.ts` - Browser extension detection
5. `frontend/src/hooks/useApiGuidePage.ts` - API guide logic (clipboard operations)
6. `frontend/src/hooks/useBrowserGuidePage.ts` - Browser guide logic

**Page-Specific Hooks (7 files):**
7. `frontend/src/hooks/useHomePage.ts` - Home page logic (credentials, proxy status)
8. `frontend/src/hooks/useProvidersPage.ts` - Providers page logic (list, switch)
9. `frontend/src/hooks/useModelsPage.ts` - Models page logic (filtering, selection)
10. `frontend/src/hooks/useSettingsPage.ts` - Settings page logic (fetch, update)
11. `frontend/src/hooks/useDesktopGuidePage.ts` - Desktop guide logic
12. `frontend/src/hooks/useModelFormPage.ts` - Model form logic
13. `frontend/src/hooks/useProviderFormPage.ts` - Provider form logic

**Code Reference**: See Phase 7 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`

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

**Files Created (shadcn):**
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

**Code Reference**: See Phase 8.1 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

### Phase 8.2: Custom UI Components

**Files to Create:**
1. `frontend/src/components/ui/toaster.tsx` - Toast container with sidebar awareness
2. `frontend/src/components/ui/status-indicator.tsx` - Status dot with pulse animation
3. `frontend/src/components/ui/status-label.tsx` - Status label component
4. `frontend/src/components/ui/environment-badge.tsx` - Desktop/Browser badge
5. `frontend/src/components/ui/action-list.tsx` - Reusable action list for clickable items
6. `frontend/src/components/ui/content-card.tsx` - Content card wrapper
7. `frontend/src/components/ui/tab-card.tsx` - Tab card component (primary page layout)
8. `frontend/src/components/ui/tooltip.tsx` - Tooltip component

**Code Reference**: See Phase 8.2 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

**Validation:**
- All components render correctly
- Theme support working
- TypeScript types complete

---

## Phase 9: UI Components - Feature Layer

**Objective**: Create feature-specific components organized by domain.

### Files to Create (22 feature components):

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

**Guide Features (2 components):**
16. `frontend/src/components/features/browserGuide/BrowserGuideTab.tsx`
17. `frontend/src/components/features/desktopGuide/DesktopGuideTab.tsx`

**Model Form Features (2 components):**
18. `frontend/src/components/features/modelForm/ModelDetailsTab.tsx`
19. `frontend/src/components/features/modelForm/ModelFormActions.tsx`

**Provider Form Features (3 components):**
20. `frontend/src/components/features/providerForm/ProviderFormActionsEdit.tsx`
21. `frontend/src/components/features/providerForm/ProviderFormActionsReadOnly.tsx`
22. `frontend/src/components/features/providerForm/ProviderFormContent.tsx`

**Code Reference**: See Phase 9 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

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

**Code Reference**: See Phase 10 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

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
6. `frontend/src/pages/ModelFormPage.tsx` - Model details/form
7. `frontend/src/pages/ProviderFormPage.tsx` - Provider details/form

**Guide Pages:**
8. `frontend/src/pages/BrowserGuidePage.tsx` - Browser extension installation guide
9. `frontend/src/pages/DesktopGuidePage.tsx` - Desktop app installation guide

**Code Reference**: See Phase 11 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`

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

**Code Reference**: See Phase 12 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`

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

**Objective**: Create modular CSS architecture.

### Files to Create (23 CSS files):

**Base Styles:**
1. `frontend/src/styles/base/theme.css` - CSS variables for theming
2. `frontend/src/styles/utilities/common.css` - Utility classes

**Layout & Page Styles:**
3. `frontend/src/styles/layout.css` - Core layout styles
4. `frontend/src/styles/pages.css` - Page-level styles
5. `frontend/src/styles/pages/providers.css` - Providers page styles
6. `frontend/src/styles/pages/quick-guide.css` - Quick guide styles

**Feature Component Styles:**
7. `frontend/src/styles/home.css` - Home page features
8. `frontend/src/styles/providers.css` - Provider components
9. `frontend/src/styles/models.css` - Model components
10. `frontend/src/styles/models2.css` - Additional model styles
11. `frontend/src/styles/credentials.css` - Credentials components
12. `frontend/src/styles/system-features.css` - System feature components
13. `frontend/src/styles/quick-guide.css` - Quick guide components
14. `frontend/src/styles/api-guide.css` - API guide styles

**Chat Component Styles:**
15. `frontend/src/styles/chat-tabs.css` - Chat tab layout
16. `frontend/src/styles/chat-quick-test.css` - Quick test tab
17. `frontend/src/styles/chat-custom.css` - Custom chat tab
18. `frontend/src/styles/chat-response.css` - Response display
19. `frontend/src/styles/chat-curl.css` - cURL examples tab

**UI Component Styles:**
20. `frontend/src/styles/ui-components.css` - Reusable UI components
21. `frontend/src/styles/components/steps.css` - Step components
22. `frontend/src/styles/components/guide.css` - Guide components
23. `frontend/src/styles/icons.css` - Icon utilities

**Main Entry Point:**
24. `frontend/src/index.css` - Main CSS entry (imports all above files + Tailwind)

**Code Reference**: See Phase 13 in `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md` and `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/09_FRONTEND_COMPLETE_CSS.md`

**Architecture:**
- Modular CSS organized by layer
- Theme support via CSS variables
- Tailwind utilities for common patterns
- Feature-specific styles isolated

**Validation:**
- All styles compile correctly
- Theme switching works
- Responsive design functional
- No style conflicts

---

## Final Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── features/          # 22 feature components organized by domain
│   │   │   ├── browserGuide/
│   │   │   │   └── BrowserGuideTab.tsx
│   │   │   ├── chat/
│   │   │   │   ├── CurlTab.tsx
│   │   │   │   └── CustomChatTab.tsx
│   │   │   ├── desktopGuide/
│   │   │   │   └── DesktopGuideTab.tsx
│   │   │   ├── home/
│   │   │   │   └── StatusTab.tsx
│   │   │   ├── modelForm/
│   │   │   │   ├── ModelDetailsTab.tsx
│   │   │   │   └── ModelFormActions.tsx
│   │   │   ├── models/
│   │   │   │   ├── AllModelsTab.tsx
│   │   │   │   ├── ModelSelectTab.tsx
│   │   │   │   ├── ModelTestContent.tsx
│   │   │   │   └── ModelTestWrapper.tsx
│   │   │   ├── providerForm/
│   │   │   │   ├── ProviderFormActionsEdit.tsx
│   │   │   │   ├── ProviderFormActionsReadOnly.tsx
│   │   │   │   └── ProviderFormContent.tsx
│   │   │   ├── providers/
│   │   │   │   ├── AllProvidersTab.tsx
│   │   │   │   ├── ProviderSwitchTab.tsx
│   │   │   │   ├── ProviderTestContent.tsx
│   │   │   │   └── ProviderTestWrapper.tsx
│   │   │   ├── quick-guide/
│   │   │   │   └── CodeBlock.tsx
│   │   │   └── settings/
│   │   │       ├── AppearanceTab.tsx
│   │   │       ├── DebugTab.tsx
│   │   │       └── ProxyTab.tsx
│   │   ├── layout/            # 4 layout components
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── TitleBar.tsx
│   │   └── ui/                # 20 UI components (shadcn + custom)
│   │       ├── action-list.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── content-card.tsx
│   │       ├── environment-badge.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── status-indicator.tsx
│   │       ├── status-label.tsx
│   │       ├── switch.tsx
│   │       ├── tab-card.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toast.tsx
│   │       ├── toaster.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       └── tooltip.tsx
│   ├── constants/             # 9 constants files
│   │   ├── browserGuide.constants.tsx
│   │   ├── chat.constants.tsx
│   │   ├── desktopGuide.constants.tsx
│   │   ├── home.constants.tsx
│   │   ├── modelForm.constants.tsx
│   │   ├── models.constants.tsx
│   │   ├── providerForm.constants.tsx
│   │   ├── providers.constants.tsx
│   │   └── settings.constants.tsx
│   ├── hooks/                 # 13 hooks
│   │   ├── useApiGuidePage.ts
│   │   ├── useBrowserGuidePage.ts
│   │   ├── useDarkMode.ts
│   │   ├── useDesktopGuidePage.ts
│   │   ├── useExtensionDetection.ts
│   │   ├── useHomePage.ts
│   │   ├── useModelFormPage.ts
│   │   ├── useModelsPage.ts
│   │   ├── useProviderFormPage.ts
│   │   ├── useProvidersPage.ts
│   │   ├── useSettingsPage.ts
│   │   ├── useToast.ts
│   │   └── useWebSocket.ts
│   ├── lib/                   # 4 library utilities
│   │   ├── api-guide-examples.ts
│   │   ├── constants.ts
│   │   ├── router.ts
│   │   └── utils.ts
│   ├── pages/                 # 9 pages
│   │   ├── BrowserGuidePage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── DesktopGuidePage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ModelFormPage.tsx
│   │   ├── ModelsPage.tsx
│   │   ├── ProviderFormPage.tsx
│   │   ├── ProvidersPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/              # 7 services
│   │   ├── api.service.ts
│   │   ├── chatService.ts
│   │   ├── credentials.service.ts
│   │   ├── models.service.ts
│   │   ├── providers.service.ts
│   │   ├── proxy.service.ts
│   │   └── websocket.service.ts
│   ├── stores/                # 6 Zustand stores
│   │   ├── useAlertStore.ts
│   │   ├── useCredentialsStore.ts
│   │   ├── useLifecycleStore.ts
│   │   ├── useProxyStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── useUIStore.ts
│   ├── styles/                # 23 CSS files
│   │   ├── base/
│   │   │   └── theme.css
│   │   ├── components/
│   │   │   ├── guide.css
│   │   │   └── steps.css
│   │   ├── pages/
│   │   │   ├── providers.css
│   │   │   └── quick-guide.css
│   │   ├── utilities/
│   │   │   └── common.css
│   │   ├── api-guide.css
│   │   ├── chat-curl.css
│   │   ├── chat-custom.css
│   │   ├── chat-quick-test.css
│   │   ├── chat-response.css
│   │   ├── chat-tabs.css
│   │   ├── credentials.css
│   │   ├── home.css
│   │   ├── icons.css
│   │   ├── layout.css
│   │   ├── models.css
│   │   ├── models2.css
│   │   ├── pages.css
│   │   ├── providers.css
│   │   ├── quick-guide.css
│   │   ├── system-features.css
│   │   └── ui-components.css
│   ├── types/                 # 9 type files
│   │   ├── chat.types.ts
│   │   ├── common.types.ts
│   │   ├── credentials.types.ts
│   │   ├── home.types.ts
│   │   ├── index.ts
│   │   ├── models.types.ts
│   │   ├── providers.types.ts
│   │   ├── proxy.types.ts
│   │   └── quick-guide.types.ts
│   ├── utils/                 # 2 utility files
│   │   ├── formatters.ts
│   │   └── platform.ts
│   ├── App.tsx                # Main app component
│   ├── index.css              # Main CSS entry point
│   ├── main.tsx               # React entry point
│   └── vite-env.d.ts          # Vite/Electron type definitions
├── components.json            # shadcn configuration
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Implementation Guidelines

### Development Workflow

1. **Follow Phase Order**: Complete phases 1-13 in sequence
2. **Foundation First**: Build types → utils → constants → services → stores → hooks → components → pages
3. **Test Each Phase**: Validate each phase before moving to next
4. **Reference Code Docs**: Use the code documentation files for complete implementations

### Architecture Pattern (Pages → Hooks → Feature Components → Constants)

**The Golden Rule:**
- **Constants** contain data and configuration (tab configs, data builders)
- **Feature Components** contain complex layouts (receive data via props)
- **Hooks** contain business logic (state, effects, handlers)
- **Pages** wire everything together (call hooks, build data, render components)

**Example Flow:**
```
Page Component
  ├─> Calls Hook (business logic)
  ├─> Calls Data Builders from Constants (creates ActionItem[])
  ├─> Passes data to Feature Components (layout)
  └─> Renders TabCard with tabs
```

### Best Practices

**DO:**
- Use feature components for complex tab content (> 20 lines JSX)
- Use data builder functions that return ActionItem[] or other data structures
- Define all text as constants
- Keep page components thin (< 100 lines)
- Put all business logic in hooks
- Put all configuration in constants files
- Use `hidden` property for conditional visibility
- Import types from `@/types`
- Import constants from `@/constants`

**DON'T:**
- Write complex inline JSX in page components
- Write business logic in page or feature components
- Hardcode strings in page components
- Create builder functions that return complex JSX layouts (use feature components)
- Make API calls from components (use services)
- Use `any` types
- Skip TypeScript strict mode

### Quality Assurance

- **Type Safety**: 100% TypeScript coverage, no `any` types
- **Single Responsibility**: Each file has one clear purpose
- **DRY Principle**: No code duplication
- **Domain-Driven**: Clear domain boundaries
- **Performance**: Monitor bundle size and runtime performance

---

## Success Criteria

### Technical Criteria

- All phases implemented according to specifications
- 100% TypeScript coverage with no `any` types
- All services follow SRP (single responsibility)
- All shared logic abstracted (DRY principle)
- Build succeeds with no errors: `npm run build`
- Application runs without console errors

### Functional Criteria

- All 9 pages render correctly
- Routing works for all routes (including dynamic routes)
- WebSocket real-time updates work
- Theme switching works (light/dark)
- Settings persist correctly (localStorage)
- Provider/Model management works
- Chat functionality works
- All tabs functional with proper content

---

## Summary

This plan provides a complete guide for building the frontend application from scratch following proven architecture patterns. Each phase builds upon the previous, ensuring a solid foundation before adding complexity. The result is a maintainable, type-safe, and well-organized codebase that follows industry best practices.

**Key Statistics:**
- 9 Pages
- 13 Hooks
- 46 Components (20 UI + 4 Layout + 22 Feature)
- 9 Constants files
- 7 Services
- 9 Type files
- 6 Stores
- 23 CSS files
- 4 Library utilities
- 2 Core utilities

**Next Steps:**
1. Begin with Phase 1 (Project Initialization)
2. Follow phases in order
3. Validate each phase before proceeding
4. Refer to code documentation files for complete implementations
5. Follow the PAGE_ARCHITECTURE_GUIDE for detailed patterns

---

**Document Version:** 3.0
**Date:** November 9, 2025
**Status:** Updated to reflect current implementation
**Architecture Pattern:** Pages → Hooks → Feature Components → Constants
