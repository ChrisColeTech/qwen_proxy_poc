# Frontend V3 Rewrite Implementation Plan

## Work Progress Tracking

| Phase | Priority | Status | Files Created | Files Modified | Description |
|-------|----------|--------|---------------|----------------|-------------|
| **Phase 1: Project Initialization** | **P0** | ⬜ | 15 | 0 | Workspace setup with Vite, React 18, TypeScript, Tailwind |
| Phase 1.1: Create Vite Workspace | P0 | ⬜ | 5 | 0 | Initialize Vite with React + TypeScript template |
| Phase 1.2: Install Dependencies | P0 | ⬜ | 0 | 2 | Install React 18, Tailwind CSS, and base dependencies |
| Phase 1.3: Configuration Files | P0 | ⬜ | 0 | 8 | Configure Vite, TypeScript, Tailwind, PostCSS |
| **Phase 2: Foundation Layer - Types** | **P0** | ⬜ | 11 | 0 | **Complete type system for domain-driven design** |
| Phase 2.1: Common & Domain Types | P0 | ⬜ | 6 | 0 | Shared types and core domain models |
| Phase 2.2: Component & Feature Types | P0 | ⬜ | 4 | 0 | UI component and page-specific types |
| Phase 2.3: Type System Integration | P0 | ⬜ | 1 | 0 | Central type barrel export |
| **Phase 3: Foundation Layer - Utilities** | **P0** | ⬜ | 7 | 0 | **Reusable utilities following DRY** |
| Phase 3.1: Core Utilities | P0 | ⬜ | 3 | 0 | Platform detection, formatters, validators |
| Phase 3.2: Library Utilities | P0 | ⬜ | 4 | 0 | cn() utility, constants, router, API examples |
| **Phase 4: Foundation Layer - Constants** | **P0** | ⬜ | 10 | 0 | **Application constants and configurations** |
| Phase 4.1: Page Constants | P0 | ⬜ | 6 | 0 | Home, Providers, Models, Settings, Chat constants |
| Phase 4.2: Guide Constants | P0 | ⬜ | 3 | 0 | API Guide, Browser Guide, Desktop Guide constants |
| Phase 4.3: Constants Integration | P0 | ⬜ | 1 | 0 | Central constants barrel export |
| **Phase 5: Service Layer** | **P0** | ⬜ | 9 | 0 | **Business logic and API communication** |
| Phase 5.1: Core API Service | P0 | ⬜ | 1 | 0 | HTTP communication layer with error handling |
| Phase 5.2: WebSocket Service | P0 | ⬜ | 1 | 0 | Real-time communication service |
| Phase 5.3: Domain Services | P0 | ⬜ | 7 | 0 | Providers, Models, Credentials, Chat, Proxy services |
| **Phase 6: State Management Layer** | **P0** | ⬜ | 6 | 0 | **Zustand stores for application state** |
| Phase 6.1: UI & Settings Stores | P0 | ⬜ | 2 | 0 | Theme, sidebar, settings persistence |
| Phase 6.2: Domain Stores | P0 | ⬜ | 4 | 0 | Credentials, Proxy, Lifecycle, Alert stores |
| **Phase 7: Hooks Layer** | **P0** | ⬜ | 18 | 0 | **Custom React hooks encapsulating business logic** |
| Phase 7.1: Core Hooks | P0 | ⬜ | 6 | 0 | Dark mode, WebSocket, Toast, Extension detection |
| Phase 7.2: Domain Hooks | P0 | ⬜ | 3 | 0 | Providers, Models, Credentials management |
| Phase 7.3: Page Hooks | P0 | ⬜ | 9 | 0 | Page-specific logic hooks (Home, Chat, Settings, etc.) |
| **Phase 8: UI Components - Base** | **P1** | ⬜ | 23 | 0 | **shadcn/ui base components and custom UI elements** |
| Phase 8.1: Install shadcn/ui | P1 | ⬜ | 19 | 1 | Initialize shadcn and install base components |
| Phase 8.2: Custom UI Components | P1 | ⬜ | 4 | 0 | Status indicators, badges, action lists, cards |
| **Phase 9: UI Components - Features** | **P1** | ⬜ | 21 | 0 | **Feature-specific components following SRP** |
| Phase 9.1: Home Feature Components | P1 | ⬜ | 2 | 0 | Credentials, Proxy status sections |
| Phase 9.2: Chat Feature Components | P1 | ⬜ | 6 | 0 | Chat testing, responses, thinking sections |
| Phase 9.3: Providers & Models Components | P1 | ⬜ | 3 | 0 | Tables, cards, dialogs |
| Phase 9.4: Credentials Components | P1 | ⬜ | 3 | 0 | Status cards, login instructions, logout dialog |
| Phase 9.5: Quick Guide Components | P1 | ⬜ | 7 | 0 | Step components, code blocks, tabs |
| **Phase 10: Layout Components** | **P1** | ⬜ | 4 | 0 | **Application layout structure** |
| Phase 10.1: Core Layout Components | P1 | ⬜ | 4 | 0 | AppLayout, Sidebar, TitleBar, StatusBar |
| **Phase 11: Pages** | **P1** | ⬜ | 7 | 0 | **Main application pages** |
| Phase 11.1: Core Pages | P1 | ⬜ | 5 | 0 | Home, Providers, Models, Settings, Chat |
| Phase 11.2: Guide Pages | P1 | ⬜ | 2 | 0 | Browser Guide, Desktop Guide |
| **Phase 12: Application Entry & Routing** | **P1** | ⬜ | 3 | 0 | **App initialization and navigation** |
| Phase 12.1: Application Root | P1 | ⬜ | 3 | 0 | App.tsx, main.tsx, vite-env.d.ts |
| **Phase 13: Styling System** | **P1** | ⬜ | 24 | 0 | **CSS architecture and theme system** |
| Phase 13.1: Base Styles | P1 | ⬜ | 2 | 0 | Theme CSS variables, global styles |
| Phase 13.2: Layout & Page Styles | P1 | ⬜ | 3 | 0 | Layout structure, page containers |
| Phase 13.3: Component Styles | P1 | ⬜ | 19 | 0 | Feature-specific component styles (chat, credentials, guides) |

**Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## Code Documentation Reference

Complete source code for all phases is available in separate documentation files:

- **Phases 1-3** (Init, Types, Utils): [`04_FRONTEND_CODE_PHASES_1-3.md`](./04_FRONTEND_CODE_PHASES_1-3.md)
- **Phases 4-5** (Constants, Services): [`05_FRONTEND_CODE_PHASES_4-5.md`](./05_FRONTEND_CODE_PHASES_4-5.md)
- **Phases 6-7** (Stores, Hooks): [`06_FRONTEND_CODE_PHASES_6-7.md`](./06_FRONTEND_CODE_PHASES_6-7.md)
- **Phases 8-10** (UI Components, Features, Layout): [`07_FRONTEND_CODE_PHASES_8-10.md`](./07_FRONTEND_CODE_PHASES_8-10.md)
- **Phases 11-13** (Pages, App Entry, Styling): [`08_FRONTEND_CODE_PHASES_11-13.md`](./08_FRONTEND_CODE_PHASES_11-13.md)

This document focuses on **planning, architecture, and implementation steps**. Refer to the code documentation files above for complete source code.

---

## Overview

This implementation plan outlines the complete rewrite of the frontend application from scratch in the `frontend` folder, following the proven patterns from `frontend-v3` while implementing strict adherence to SRP, DRY, and Domain-Driven Design principles.

### Key Principles

1. **Single Responsibility Principle (SRP)**: Each file, module, and component has exactly one reason to change
2. **Don't Repeat Yourself (DRY)**: All shared logic is abstracted into reusable utilities and services
3. **Domain-Driven Design**: Business logic is organized by domain (providers, models, credentials, etc.)
4. **Foundation First**: Build from bottom-up (types → utils → services → stores → hooks → components → pages)
5. **Type Safety**: Comprehensive TypeScript coverage with no `any` types

### Architecture Overview

```
frontend/
├── src/
│   ├── types/           # Type definitions (Phase 2) - Foundation
│   ├── utils/           # Utility functions (Phase 3) - Foundation
│   ├── constants/       # Application constants (Phase 4) - Foundation
│   ├── services/        # API and business services (Phase 5) - Foundation
│   ├── stores/          # State management (Phase 6) - Foundation
│   ├── hooks/           # Custom React hooks (Phase 7) - Foundation
│   ├── components/      # UI components (Phases 8-10)
│   │   ├── ui/          # Base UI components
│   │   ├── features/    # Feature-specific components
│   │   └── layout/      # Layout components
│   ├── pages/           # Application pages (Phase 11)
│   ├── styles/          # CSS/styling (Phase 13)
│   ├── lib/             # Library utilities
│   ├── App.tsx          # Application root (Phase 12)
│   └── main.tsx         # Entry point (Phase 12)
```

---

## Phase 1: Project Initialization

### Phase 1.1: Create Vite Workspace (Priority: P0)

**Objective**: Initialize frontend workspace with Vite + React + TypeScript template.

**Commands**:
```bash
# From project root
npm create vite@latest frontend -- --template react-ts --no-interactive
cd frontend
npm install
cd ..
```

**Files Created**:
- `frontend/index.html`
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`

**Validation**:
- [ ] `frontend/` directory exists
- [ ] Vite template files generated
- [ ] Dependencies installed

### Phase 1.2: Install Dependencies (Priority: P0)

**Objective**: Install React 18 and all base dependencies.

**Commands**:
```bash
cd frontend

# Install React 18 (Vite defaults to React 19)
npm install "react@^18.3.1" "react-dom@^18.3.1"
npm install -D "@types/react@^18.3.26" "@types/react-dom@^18.3.7"

# Install Tailwind CSS and dependencies
npm install -D "tailwindcss@^3.4.18" "postcss@^8.5.6" "autoprefixer@^10.4.21" "tailwindcss-animate@^1.0.7" "class-variance-authority@^0.7.1" "clsx@^2.1.1" "tailwind-merge@^2.6.0" "lucide-react@^0.553.0" "react-icons@^5.5.0"

# Install Radix UI components (for shadcn)
npm install "@radix-ui/react-dialog@^1.1.15" "@radix-ui/react-dropdown-menu@^2.1.16" "@radix-ui/react-label@^2.1.8" "@radix-ui/react-popover@^1.1.15" "@radix-ui/react-select@^2.2.6" "@radix-ui/react-slot@^1.2.4" "@radix-ui/react-switch@^1.2.6" "@radix-ui/react-tabs@^1.1.13" "@radix-ui/react-toast@^1.2.15" "@radix-ui/react-toggle@^1.1.10" "@radix-ui/react-toggle-group@^1.1.11"

# Install state management and other utilities
npm install "zustand@^5.0.8" "socket.io-client@^4.8.1" "cmdk@^1.1.1"

# Install dev dependencies
npm install -D "@types/node@^24.10.0" "kill-port@^2.0.1"

# Initialize Tailwind CSS
npx tailwindcss init -p

cd ..
```

**Files Modified**:
- `frontend/package.json` (dependencies added)
- `frontend/postcss.config.js` (created by tailwindcss init)
- `frontend/tailwind.config.js` (created by tailwindcss init)

**Validation**:
- [ ] React 18 installed
- [ ] Tailwind CSS installed
- [ ] Radix UI components installed
- [ ] Zustand and Socket.io client installed
- [ ] Icon libraries installed

### Phase 1.3: Configuration Files (Priority: P0)

**Objective**: Configure Vite, TypeScript, Tailwind, and create essential configuration files.

**Files to Modify**:

1. **frontend/vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

2. **frontend/tsconfig.json**
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

3. **frontend/tsconfig.app.json**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

4. **frontend/tailwind.config.js**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

5. **frontend/src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: Inter, system-ui, sans-serif;
  }
}
```

6. **frontend/src/vite-env.d.ts**
```typescript
/// <reference types="vite/client" />

interface ElectronAPI {
  qwen: {
    openLogin: () => Promise<void>;
    extractCredentials: () => Promise<{ token: string; cookies: string; expiresAt: number }>;
  };
  clipboard: {
    readText: () => Promise<string>;
    writeText: (text: string) => Promise<void>;
  };
  app: {
    quit: () => void;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximize: (callback: () => void) => void;
    onUnmaximize: (callback: () => void) => void;
  };
  history: {
    read: () => Promise<any>;
    add: (entry: any) => Promise<any>;
    clear: () => Promise<any>;
  };
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
```

7. **frontend/package.json** - Add scripts
```json
{
  "scripts": {
    "dev": "npx kill-port 5173 && vite",
    "build": "tsc -b",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**Validation**:
- [ ] Vite config has path aliases
- [ ] TypeScript config has strict mode enabled
- [ ] Tailwind config has dark mode and theme
- [ ] index.css has theme variables
- [ ] vite-env.d.ts has Electron API types
- [ ] Build succeeds: `npm run build`

**Integration Points**:
- Vite build system
- TypeScript compiler
- Tailwind CSS
- Electron API (for desktop mode)

**Folder Structure After Phase 1**:
```
frontend/
├── node_modules/
├── public/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Phase 2: Foundation Layer - Types

**Priority**: P0 (Must be completed before services, stores, and hooks)

### Phase 2.1: Common & Domain Types (Priority: P0)

**Objective**: Create core type definitions for shared types and domain models.

**Files to Create**:

1. **frontend/src/types/common.types.ts** - Shared utility types (Route, APIResponse, Platform, Theme, SidebarPosition)
2. **frontend/src/types/providers.types.ts** - Provider domain types (Provider, ProviderConfig)
3. **frontend/src/types/models.types.ts** - Model domain types (Model, ParsedModel, Capability, CapabilityFilter)
4. **frontend/src/types/credentials.types.ts** - Credentials domain types (QwenCredentials, CredentialsStatus)
5. **frontend/src/types/proxy.types.ts** - Proxy server types (ProxyStatus, ProxyStatusResponse, WsProxyStatus)
6. **frontend/src/types/chat.types.ts** - Chat functionality types (ChatMessage, ChatRequest, ChatResponse, ChatStreamChunk, ParsedChatResponse)

**Reference**: See complete source code in [`04_FRONTEND_CODE_PHASES_1-3.md`](./04_FRONTEND_CODE_PHASES_1-3.md) - Phase 2.1

**Validation**:
- [ ] All types properly exported
- [ ] No circular dependencies
- [ ] Comprehensive domain coverage

**Integration Points**:
- Will be imported by all services, stores, hooks
- Foundation for type-safe development

### Phase 2.2: Component & Feature Types (Priority: P0)

**Objective**: Create types for UI components and page-specific functionality.

**Files to Create**:

1. **frontend/src/types/components.types.ts** - UI component prop types (ActionItem, TabDefinition, StatusIndicatorProps, StatusBadgeProps)
2. **frontend/src/types/home.types.ts** - Home page specific types (SystemFeature, ProxyStatusDisplay)
3. **frontend/src/types/quick-guide.types.ts** - Quick guide component types (ModelsStepProps, ProviderSwitchStepProps)
4. **frontend/src/types/index.ts** - Central type barrel export

**Reference**: See complete source code in [`04_FRONTEND_CODE_PHASES_1-3.md`](./04_FRONTEND_CODE_PHASES_1-3.md) - Phase 2.2

**Validation**:
- [ ] All types exported from index.ts
- [ ] No duplicate type definitions
- [ ] Component types cover all UI needs

**Integration Points**:
- Used by components for props validation
- Used by pages for data structures
- Used by hooks for return types

### Phase 2.3: Type System Validation

**Validation Checklist**:
- [ ] All 11 type files created
- [ ] All types properly exported from index.ts
- [ ] No circular dependencies
- [ ] TypeScript compilation succeeds
- [ ] No `any` types used

**Folder Structure After Phase 2**:
```
frontend/src/
├── types/
│   ├── common.types.ts
│   ├── providers.types.ts
│   ├── models.types.ts
│   ├── credentials.types.ts
│   ├── proxy.types.ts
│   ├── chat.types.ts
│   ├── components.types.ts
│   ├── home.types.ts
│   ├── quick-guide.types.ts
│   └── index.ts
```

---

## Phase 3: Foundation Layer - Utilities

**Priority**: P0 (Must be completed before hooks and components)

### Phase 3.1: Core Utilities (Priority: P0)

**Objective**: Create reusable utility functions following DRY principle.

**Files to Create**:

1. **frontend/src/utils/platform.ts** - Platform detection utilities (isElectron, isBrowser, getPlatform)
2. **frontend/src/utils/formatters.ts** - Data formatting functions (formatUptime, formatTimestamp, formatTimeRemaining)
3. **frontend/src/utils/validators.ts** - Input validation utilities (isValidUrl, isValidPort, isValidModelId)

**Reference**: See complete source code in [`04_FRONTEND_CODE_PHASES_1-3.md`](./04_FRONTEND_CODE_PHASES_1-3.md) - Phase 3.1

**Validation**:
- [ ] All functions are pure (no side effects)
- [ ] Proper TypeScript typing
- [ ] Functions are testable

**Integration Points**:
- Used by hooks for data transformation
- Used by components for display formatting
- Used by services for validation

### Phase 3.2: Library Utilities (Priority: P0)

**Objective**: Create library helper functions (cn utility, constants, routing, API examples).

**Files to Create**:

1. **frontend/src/lib/utils.ts** - Tailwind cn() utility
2. **frontend/src/lib/constants.ts** - Application-wide constants (APP_NAME, API_BASE_URL, poll intervals, heights)
3. **frontend/src/lib/router.ts** - Simple routing utilities for param extraction
4. **frontend/src/lib/api-guide-examples.ts** - Code examples for API guide (Python, Node.js, cURL examples)

**Reference**: See complete source code in [`04_FRONTEND_CODE_PHASES_1-3.md`](./04_FRONTEND_CODE_PHASES_1-3.md) - Phase 3.2

**Validation**:
- [ ] cn() utility works with Tailwind classes
- [ ] Constants properly typed and exported
- [ ] Router utilities work for path matching
- [ ] API examples are complete and accurate

**Integration Points**:
- Used by all UI components (cn utility)
- Used throughout app for consistent values (constants)
- Used for future dynamic routing needs (router)
- Used by API guide pages (examples)

**Folder Structure After Phase 3**:
```
frontend/src/
├── utils/
│   ├── platform.ts
│   ├── formatters.ts
│   └── validators.ts
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   ├── router.ts
│   └── api-guide-examples.ts
```

---

## Phase 4: Foundation Layer - Constants

**Priority**: P0 (Must be completed before components and pages)

### Phase 4.1: Page Constants (Priority: P0)

**Objective**: Centralize all page-level constants and tab configurations.

**Files to Create**:

1. **frontend/src/constants/home.constants.tsx** - Home page constants (tabs, icons, titles)
2. **frontend/src/constants/providers.constants.tsx** - Providers page constants
3. **frontend/src/constants/models.constants.tsx** - Models page constants
4. **frontend/src/constants/settings.constants.tsx** - Settings page constants
5. **frontend/src/constants/chat.constants.tsx** - Chat page constants

**Reference**: See complete source code in [`05_FRONTEND_CODE_PHASES_4-5.md`](./05_FRONTEND_CODE_PHASES_4-5.md) - Phase 4.1

**Validation**:
- [ ] All constants properly typed
- [ ] No magic strings in components
- [ ] Tab configurations complete

### Phase 4.2: Guide Constants (Priority: P0)

**Objective**: Create constants for guide pages.

**Files to Create**:

1. **frontend/src/constants/apiGuide.constants.tsx** - API guide constants
2. **frontend/src/constants/browserGuide.constants.tsx** - Browser guide constants
3. **frontend/src/constants/desktopGuide.constants.tsx** - Desktop guide constants

**Reference**: See complete source code in [`05_FRONTEND_CODE_PHASES_4-5.md`](./05_FRONTEND_CODE_PHASES_4-5.md) - Phase 4.2

**Validation**:
- [ ] Guide content properly structured
- [ ] Code examples formatted correctly

### Phase 4.3: Constants Integration (Priority: P0)

**Objective**: Create central constants barrel export.

**Files to Create**:

1. **frontend/src/constants/index.ts** - Constants barrel export

**Reference**: See complete source code in [`05_FRONTEND_CODE_PHASES_4-5.md`](./05_FRONTEND_CODE_PHASES_4-5.md) - Phase 4.3

**Validation**:
- [ ] All constants accessible via single import
- [ ] No naming conflicts

**Folder Structure After Phase 4**:
```
frontend/src/
├── constants/
│   ├── home.constants.tsx
│   ├── providers.constants.tsx
│   ├── models.constants.tsx
│   ├── settings.constants.tsx
│   ├── chat.constants.tsx
│   ├── apiGuide.constants.tsx
│   ├── browserGuide.constants.tsx
│   ├── desktopGuide.constants.tsx
│   └── index.ts
```

---

## Phase 5: Service Layer

**Priority**: P0 (Must be completed before stores and hooks)

### Phase 5.1: Core API Service (Priority: P0)

**Objective**: Implement HTTP API communication layer.

**Files to Create**:

1. **frontend/src/services/api.service.ts** - Core API service (get, post, put, delete, getSettings, updateSetting)

**Reference**: See complete source code in [`05_FRONTEND_CODE_PHASES_4-5.md`](./05_FRONTEND_CODE_PHASES_4-5.md) - Phase 5.1

**Validation**:
- [ ] Error handling for all requests
- [ ] Proper TypeScript typing
- [ ] Consistent response format

**Integration Points**:
- Used by all domain services
- Single source of truth for API calls

### Phase 5.2: WebSocket Service (Priority: P0)

**Objective**: Implement real-time communication service.

**Files to Create**:

1. **frontend/src/services/websocket.service.ts** - WebSocket service (connect, disconnect, on, off, emit, isConnected)

**Reference**: See complete source code in [`05_FRONTEND_CODE_PHASES_4-5.md`](./05_FRONTEND_CODE_PHASES_4-5.md) - Phase 5.2

**Validation**:
- [ ] Automatic reconnection
- [ ] Proper cleanup on disconnect
- [ ] Event-driven architecture

**Integration Points**:
- Used by hooks for real-time updates
- Integrated with stores for state sync

### Phase 5.3: Domain Services (Priority: P0)

**Objective**: Implement business logic services for each domain.

**Files to Create**:

1. **frontend/src/services/providers.service.ts** - Provider domain logic (getProviders, switchProvider, etc.)
2. **frontend/src/services/models.service.ts** - Models domain logic (getModels, getAvailableModels, etc.)
3. **frontend/src/services/credentials.service.ts** - Credentials domain logic
4. **frontend/src/services/chat.service.ts** - Chat domain logic (sendMessage, streamChat, etc.)
5. **frontend/src/services/chatService.ts** - Alternative chat service
6. **frontend/src/services/credentialsService.ts** - Alternative credentials service
7. **frontend/src/services/proxy.service.ts** - Proxy server management (getStatus, start, stop, etc.)

**Reference**: See complete source code in [`05_FRONTEND_CODE_PHASES_4-5.md`](./05_FRONTEND_CODE_PHASES_4-5.md) - Phase 5.3

**Validation**:
- [ ] Clear separation of concerns
- [ ] Business logic abstracted from UI
- [ ] Proper error handling

**Integration Points**:
- Use api.service for HTTP calls
- Used by hooks for business operations
- Encapsulate domain-specific logic

**Folder Structure After Phase 5**:
```
frontend/src/
├── services/
│   ├── api.service.ts
│   ├── websocket.service.ts
│   ├── providers.service.ts
│   ├── models.service.ts
│   ├── credentials.service.ts
│   ├── chat.service.ts
│   ├── chatService.ts
│   ├── credentialsService.ts
│   └── proxy.service.ts
```

---

## Phase 6: State Management Layer

**Priority**: P0 (Must be completed before hooks)

### Phase 6.1: UI & Settings Stores (Priority: P0)

**Objective**: Implement Zustand stores for UI state and settings.

**Files to Create**:

1. **frontend/src/stores/useUIStore.ts** - UI state (theme, sidebar, routing with persistence middleware)
2. **frontend/src/stores/useSettingsStore.ts** - Application settings (server config, active provider/model)

**Reference**: See complete source code in [`06_FRONTEND_CODE_PHASES_6-7.md`](./06_FRONTEND_CODE_PHASES_6-7.md) - Phase 6.1

**Validation**:
- [ ] UI state persists across sessions
- [ ] Settings loaded on app start
- [ ] Proper state updates

**Integration Points**:
- Used by App.tsx for routing
- Used by TitleBar for theme toggle
- Used by all pages for settings

### Phase 6.2: Domain Stores (Priority: P0)

**Objective**: Implement stores for domain-specific state.

**Files to Create**:

1. **frontend/src/stores/useCredentialsStore.ts** - Credentials state with WebSocket sync
2. **frontend/src/stores/useProxyStore.ts** - Proxy server state with WebSocket sync
3. **frontend/src/stores/useLifecycleStore.ts** - Application lifecycle state
4. **frontend/src/stores/useAlertStore.ts** - Toast notifications with auto-dismiss

**Reference**: See complete source code in [`06_FRONTEND_CODE_PHASES_6-7.md`](./06_FRONTEND_CODE_PHASES_6-7.md) - Phase 6.2

**Validation**:
- [ ] Proper state segregation by domain
- [ ] WebSocket integration for real-time updates
- [ ] Alert store auto-dismiss functionality

**Integration Points**:
- Used by hooks for state access
- Integrated with WebSocket service
- Used by components for display

**Folder Structure After Phase 6**:
```
frontend/src/
├── stores/
│   ├── useUIStore.ts
│   ├── useSettingsStore.ts
│   ├── useCredentialsStore.ts
│   ├── useProxyStore.ts
│   ├── useLifecycleStore.ts
│   └── useAlertStore.ts
```

---

## Phase 7: Hooks Layer

**Priority**: P0 (Must be completed before components and pages)

### Phase 7.1: Core Hooks (Priority: P0)

**Objective**: Create fundamental hooks for app-wide functionality.

**Files to Create**:

1. **frontend/src/hooks/useDarkMode.ts** - Theme management (dark/light mode sync with DOM)
2. **frontend/src/hooks/useWebSocket.ts** - WebSocket connection management
3. **frontend/src/hooks/useToast.ts** - Toast notifications interface
4. **frontend/src/hooks/useExtensionDetection.ts** - Browser extension detection
5. **frontend/src/hooks/useChatTest.ts** - Chat testing functionality
6. **frontend/src/hooks/useQuickChatTest.ts** - Quick chat testing

**Reference**: See complete source code in [`06_FRONTEND_CODE_PHASES_6-7.md`](./06_FRONTEND_CODE_PHASES_6-7.md) - Phase 7.1

**Validation**:
- [ ] Hooks properly encapsulate logic
- [ ] Proper cleanup on unmount
- [ ] WebSocket reconnection logic

**Integration Points**:
- Used by App.tsx for initialization
- Used by components for functionality
- Abstract store interactions

### Phase 7.2: Domain Hooks (Priority: P0)

**Objective**: Create hooks for domain-specific operations.

**Files to Create**:

1. **frontend/src/hooks/useProviders.ts** - Provider management (fetch, switch, refresh)
2. **frontend/src/hooks/useModels.ts** - Model management (fetch, filter by capabilities)
3. **frontend/src/hooks/useCredentials.ts** - Credentials management (status, polling, logout)

**Reference**: See complete source code in [`06_FRONTEND_CODE_PHASES_6-7.md`](./06_FRONTEND_CODE_PHASES_6-7.md) - Phase 7.2

**Validation**:
- [ ] Clear separation of concerns
- [ ] Proper error handling
- [ ] Loading states managed

**Integration Points**:
- Use domain services
- Update domain stores
- Used by page hooks

### Phase 7.3: Page Hooks (Priority: P0)

**Objective**: Create hooks for page-specific logic.

**Files to Create**:

1. **frontend/src/hooks/useHomePage.ts** - Home page logic (credentials, proxy status)
2. **frontend/src/hooks/useProvidersPage.ts** - Providers page logic (list, switch with auto-model-selection)
3. **frontend/src/hooks/useModelsPage.ts** - Models page logic (available vs all models, filtering)
4. **frontend/src/hooks/useSettingsPage.ts** - Settings page logic (fetch, update)
5. **frontend/src/hooks/useChatPage.ts** - Chat page logic (test, stream responses)
6. **frontend/src/hooks/useApiGuidePage.ts** - API guide logic
7. **frontend/src/hooks/useBrowserGuidePage.ts** - Browser guide logic
8. **frontend/src/hooks/useDesktopGuidePage.ts** - Desktop guide logic
9. **frontend/src/hooks/useCustomChat.ts** - Custom chat interface

**Reference**: See complete source code in [`06_FRONTEND_CODE_PHASES_6-7.md`](./06_FRONTEND_CODE_PHASES_6-7.md) - Phase 7.3

**Validation**:
- [ ] Single responsibility per hook
- [ ] Proper dependency management
- [ ] Return clean API for components

**Integration Points**:
- Used by pages exclusively
- Compose domain hooks
- Provide page-specific logic

**Folder Structure After Phase 7**:
```
frontend/src/
├── hooks/
│   ├── useDarkMode.ts
│   ├── useWebSocket.ts
│   ├── useToast.ts
│   ├── useExtensionDetection.ts
│   ├── useChatTest.ts
│   ├── useQuickChatTest.ts
│   ├── useProviders.ts
│   ├── useModels.ts
│   ├── useCredentials.ts
│   ├── useHomePage.ts
│   ├── useProvidersPage.ts
│   ├── useModelsPage.ts
│   ├── useSettingsPage.ts
│   ├── useChatPage.ts
│   ├── useApiGuidePage.ts
│   ├── useBrowserGuidePage.ts
│   ├── useDesktopGuidePage.ts
│   └── useCustomChat.ts
```

---

## Phase 8: UI Components - Base

**Priority**: P1 (Can start after Phase 7 complete)

### Phase 8.1: Install shadcn/ui (Priority: P1)

**Objective**: Initialize shadcn/ui and install base components.

**Commands**:
```bash
cd frontend

# Initialize shadcn/ui with defaults
npx shadcn@latest init -d

# Add all required shadcn components
npx shadcn@latest add button input textarea label card popover command dialog badge alert tabs select switch toggle toggle-group table dropdown-menu toast

cd ..
```

**Files Created**:
- `frontend/components.json` - shadcn config
- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/textarea.tsx`
- `frontend/src/components/ui/label.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/popover.tsx`
- `frontend/src/components/ui/command.tsx`
- `frontend/src/components/ui/dialog.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/alert.tsx`
- `frontend/src/components/ui/tabs.tsx`
- `frontend/src/components/ui/select.tsx`
- `frontend/src/components/ui/switch.tsx`
- `frontend/src/components/ui/toggle.tsx`
- `frontend/src/components/ui/toggle-group.tsx`
- `frontend/src/components/ui/table.tsx`
- `frontend/src/components/ui/dropdown-menu.tsx`
- `frontend/src/components/ui/toast.tsx`

**Files Modified**:
- `frontend/src/lib/utils.ts` - Updated by shadcn init

**Validation**:
- [ ] All shadcn components installed
- [ ] Components render correctly
- [ ] Theme support works

**Integration Points**:
- Tailwind CSS for styling
- Radix UI for accessibility
- Used by all feature components

### Phase 8.2: Custom UI Components (Priority: P1)

**Objective**: Create custom UI components.

**Files to Create**:

1. **frontend/src/components/ui/toaster.tsx** - Toast container with sidebar position awareness
2. **frontend/src/components/ui/status-indicator.tsx** - Status dot with pulse animation
3. **frontend/src/components/ui/status-badge.tsx** - Status badge component
4. **frontend/src/components/ui/environment-badge.tsx** - Environment detection badge (Desktop/Browser)
5. **frontend/src/components/ui/action-list.tsx** - Reusable action list for cards
6. **frontend/src/components/ui/content-card.tsx** - Content card wrapper
7. **frontend/src/components/ui/tab-card.tsx** - Tab card component with title and icon

**Reference**: See complete source code in [`07_FRONTEND_CODE_PHASES_8-10.md`](./07_FRONTEND_CODE_PHASES_8-10.md) - Phase 8.2

**Validation**:
- [ ] Custom components match design system
- [ ] Proper accessibility attributes
- [ ] Theme support for all components

**Integration Points**:
- Used by feature components
- Used by pages for layout

**Folder Structure After Phase 8**:
```
frontend/src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── label.tsx
│       ├── card.tsx
│       ├── popover.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       ├── alert.tsx
│       ├── tabs.tsx
│       ├── select.tsx
│       ├── switch.tsx
│       ├── toggle.tsx
│       ├── toggle-group.tsx
│       ├── table.tsx
│       ├── dropdown-menu.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── status-indicator.tsx
│       ├── status-badge.tsx
│       ├── environment-badge.tsx
│       ├── action-list.tsx
│       ├── content-card.tsx
│       └── tab-card.tsx
```

---

## Phase 9: UI Components - Features

**Priority**: P1 (Can start after Phase 8.1 complete)

### Phase 9.1: Home Feature Components (Priority: P1)

**Files to Create**:
- `frontend/src/components/features/home/CredentialsSection.tsx` - Qwen credentials display
- `frontend/src/components/features/home/ProxyStatusSection.tsx` - Provider Router and API Server status

### Phase 9.2: Chat Feature Components (Priority: P1)

**Files to Create**:
- `frontend/src/components/features/chat/ChatTestCard.tsx` - Chat test container
- `frontend/src/components/features/chat/CurlTab.tsx` - cURL examples tab
- `frontend/src/components/features/chat/CustomChatTab.tsx` - Custom chat interface tab
- `frontend/src/components/features/chat/QuickTestTab.tsx` - Quick chat test tab
- `frontend/src/components/features/chat/ResponseSection.tsx` - Chat response display
- `frontend/src/components/features/chat/ThinkingSection.tsx` - Thinking process display

### Phase 9.3: Providers & Models Components (Priority: P1)

**Files to Create**:
- `frontend/src/components/features/providers/ProvidersTable.tsx` - Providers list table
- `frontend/src/components/features/models/ModelCard.tsx` - Individual model card
- `frontend/src/components/features/models/ModelDetailsDialog.tsx` - Model details dialog

### Phase 9.4: Credentials Components (Priority: P1)

**Files to Create**:
- `frontend/src/components/features/credentials/CredentialsStatusCard.tsx` - Credentials status display
- `frontend/src/components/features/credentials/LoginInstructionsCard.tsx` - Login instructions
- `frontend/src/components/features/credentials/LogoutDialog.tsx` - Logout confirmation dialog

### Phase 9.5: Quick Guide Components (Priority: P1)

**Files to Create**:
- `frontend/src/components/features/quick-guide/ChatCompletionStep.tsx` - Chat completion guide step
- `frontend/src/components/features/quick-guide/CodeBlock.tsx` - Syntax highlighted code block
- `frontend/src/components/features/quick-guide/ModelsBrowseTab.tsx` - Browse models tab
- `frontend/src/components/features/quick-guide/ModelsSelectTab.tsx` - Select model tab
- `frontend/src/components/features/quick-guide/ModelsStep.tsx` - Models guide step
- `frontend/src/components/features/quick-guide/ProviderSwitchStep.tsx` - Provider switch guide step
- `frontend/src/components/features/quick-guide/ProviderSwitchTab.tsx` - Provider switch tab

**Reference**: See complete source code in [`07_FRONTEND_CODE_PHASES_8-10.md`](./07_FRONTEND_CODE_PHASES_8-10.md) - Phase 9

**Validation**:
- [ ] Components encapsulate specific features
- [ ] Proper separation from base UI components
- [ ] Reusable across different contexts

**Folder Structure After Phase 9**:
```
frontend/src/
├── components/
│   └── features/
│       ├── home/
│       │   ├── CredentialsSection.tsx
│       │   └── ProxyStatusSection.tsx
│       ├── chat/
│       │   ├── ChatTestCard.tsx
│       │   ├── CurlTab.tsx
│       │   ├── CustomChatTab.tsx
│       │   ├── QuickTestTab.tsx
│       │   ├── ResponseSection.tsx
│       │   └── ThinkingSection.tsx
│       ├── providers/
│       │   └── ProvidersTable.tsx
│       ├── models/
│       │   ├── ModelCard.tsx
│       │   └── ModelDetailsDialog.tsx
│       ├── credentials/
│       │   ├── CredentialsStatusCard.tsx
│       │   ├── LoginInstructionsCard.tsx
│       │   └── LogoutDialog.tsx
│       └── quick-guide/
│           ├── ChatCompletionStep.tsx
│           ├── CodeBlock.tsx
│           ├── ModelsBrowseTab.tsx
│           ├── ModelsSelectTab.tsx
│           ├── ModelsStep.tsx
│           ├── ProviderSwitchStep.tsx
│           └── ProviderSwitchTab.tsx
```

---

## Phase 10: Layout Components

**Priority**: P1 (Can start after Phase 8.1 complete)

### Phase 10.1: Core Layout Components (Priority: P1)

**Objective**: Create application layout structure.

**Files to Create**:

1. **frontend/src/components/layout/AppLayout.tsx** - Main layout container with sidebar positioning
2. **frontend/src/components/layout/Sidebar.tsx** - Navigation sidebar with route management
3. **frontend/src/components/layout/TitleBar.tsx** - Title bar with window controls (Electron) and theme toggle
4. **frontend/src/components/layout/StatusBar.tsx** - Status bar with environment badge and lifecycle status

**Reference**: See complete source code in [`07_FRONTEND_CODE_PHASES_8-10.md`](./07_FRONTEND_CODE_PHASES_8-10.md) - Phase 10

**Validation**:
- [ ] Responsive layout behavior
- [ ] Proper overflow handling
- [ ] Sidebar position switching works

**Folder Structure After Phase 10**:
```
frontend/src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx
│       ├── Sidebar.tsx
│       ├── TitleBar.tsx
│       └── StatusBar.tsx
```

---

## Phase 11: Pages

**Priority**: P1 (Can start after Phases 7, 8, 9, 10 complete)

### Phase 11.1: Core Pages (Priority: P1)

**Objective**: Implement main application pages.

**Files to Create**:

1. **frontend/src/pages/HomePage.tsx** - Dashboard/home page (credentials, proxy status, quick guide)
2. **frontend/src/pages/ProvidersPage.tsx** - Providers management (list, switch)
3. **frontend/src/pages/ModelsPage.tsx** - Models browsing (available models vs all models tabs)
4. **frontend/src/pages/SettingsPage.tsx** - Application settings (server config, active provider/model)
5. **frontend/src/pages/ChatPage.tsx** - Chat interface (quick test, custom chat, cURL examples)

**Reference**: See complete source code in [`08_FRONTEND_CODE_PHASES_11-13.md`](./08_FRONTEND_CODE_PHASES_11-13.md) - Phase 11.1

**Validation**:
- [ ] Pages use appropriate hooks
- [ ] Proper loading and error states
- [ ] Responsive design

**Integration Points**:
- Use page-specific hooks
- Compose feature components
- Render within AppLayout

### Phase 11.2: Guide Pages (Priority: P1)

**Objective**: Implement user guide pages.

**Files to Create**:

1. **frontend/src/pages/BrowserGuidePage.tsx** - Browser extension installation guide (single tab)
2. **frontend/src/pages/DesktopGuidePage.tsx** - Desktop app installation guide (single tab)

**Reference**: See complete source code in [`08_FRONTEND_CODE_PHASES_11-13.md`](./08_FRONTEND_CODE_PHASES_11-13.md) - Phase 11.2

**Validation**:
- [ ] Clear and helpful content
- [ ] Proper navigation flow

**Folder Structure After Phase 11**:
```
frontend/src/
├── pages/
│   ├── HomePage.tsx
│   ├── ProvidersPage.tsx
│   ├── ModelsPage.tsx
│   ├── SettingsPage.tsx
│   ├── ChatPage.tsx
│   ├── BrowserGuidePage.tsx
│   └── DesktopGuidePage.tsx
```

---

## Phase 12: Application Entry & Routing

**Priority**: P1 (Depends on Phase 11 complete)

### Phase 12.1: Application Root (Priority: P1)

**Objective**: Implement app initialization and routing.

**Files to Create/Modify**:

1. **frontend/src/App.tsx** - Main application component (initializes dark mode, WebSocket, routing)
2. **frontend/src/main.tsx** - Entry point (React 18 createRoot with StrictMode)
3. **frontend/src/vite-env.d.ts** - Ensure Electron API types are defined (already done in Phase 1.3)

**Reference**: See complete source code in [`08_FRONTEND_CODE_PHASES_11-13.md`](./08_FRONTEND_CODE_PHASES_11-13.md) - Phase 12

**Key Implementation Details**:
- App.tsx uses `useDarkMode()` and `useWebSocket()` hooks for initialization
- Client-side routing via switch statement based on `useUIStore.currentRoute`
- Settings loaded on mount via `useEffect` calling `loadSettings()` and `fetchSettings()`
- Toaster component rendered globally for toast notifications

**Validation**:
- [ ] App initializes correctly
- [ ] Routing works properly
- [ ] Settings load on mount
- [ ] WebSocket connects
- [ ] Theme applies correctly

**Integration Points**:
- Uses all stores for initialization
- Renders all pages
- Configures global providers

---

## Phase 13: Styling System

**Priority**: P1 (Can be done in parallel with components)

### Phase 13.1: Base Styles (Priority: P1)

**Files to Create**:
- `frontend/src/styles/base/theme.css` - Theme CSS variables
- `frontend/src/styles/index.css` - Main styles entry point

### Phase 13.2: Layout & Page Styles (Priority: P1)

**Files to Create**:
- `frontend/src/styles/layout.css` - Layout structure styles (sidebar, main content)
- `frontend/src/styles/pages.css` - Page-specific styles
- `frontend/src/styles/utilities/common.css` - Utility classes

### Phase 13.3: Component Styles (Priority: P1)

**Files to Create** (19 CSS files):
- Component-specific: `guide.css`, `steps.css`, `icons.css`, `ui-components.css`, `system-features.css`
- Page-specific: `home.css`, `models.css`, `models2.css`, `providers.css` (2 files), `quick-guide.css` (2 files)
- Feature-specific: `credentials.css`, `api-guide.css`
- Chat-specific: `chat-curl.css`, `chat-custom.css`, `chat-quick-test.css`, `chat-response.css`, `chat-tabs.css`

**Reference**: See complete source code in [`08_FRONTEND_CODE_PHASES_11-13.md`](./08_FRONTEND_CODE_PHASES_11-13.md) - Phase 13

**Validation**:
- [ ] All styles compile correctly
- [ ] Theme switching works
- [ ] Responsive design works
- [ ] Chat component styles are complete

**Integration Points**:
- Imported by components for feature-specific styling
- Integrated with Tailwind for theme support
- Used by chat, credentials, and guide components

**Folder Structure After Phase 13**:
```
frontend/src/
├── styles/
│   ├── base/
│   │   └── theme.css
│   ├── components/
│   │   ├── guide.css
│   │   └── steps.css
│   ├── pages/
│   │   ├── providers.css
│   │   └── quick-guide.css
│   ├── utilities/
│   │   └── common.css
│   ├── home.css
│   ├── models.css
│   ├── models2.css
│   ├── providers.css
│   ├── quick-guide.css
│   ├── icons.css
│   ├── layout.css
│   ├── pages.css
│   ├── ui-components.css
│   ├── system-features.css
│   ├── credentials.css
│   ├── api-guide.css
│   ├── chat-curl.css
│   ├── chat-custom.css
│   ├── chat-quick-test.css
│   ├── chat-response.css
│   ├── chat-tabs.css
│   └── index.css
```

---

## Final Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── features/
│   │   │   ├── chat/
│   │   │   ├── credentials/
│   │   │   ├── home/
│   │   │   ├── models/
│   │   │   ├── providers/
│   │   │   └── quick-guide/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── TitleBar.tsx
│   │   └── ui/
│   │       ├── (shadcn components)
│   │       ├── action-list.tsx
│   │       ├── content-card.tsx
│   │       ├── environment-badge.tsx
│   │       ├── status-badge.tsx
│   │       ├── status-indicator.tsx
│   │       ├── tab-card.tsx
│   │       └── toaster.tsx
│   ├── constants/
│   │   ├── apiGuide.constants.tsx
│   │   ├── browserGuide.constants.tsx
│   │   ├── chat.constants.tsx
│   │   ├── desktopGuide.constants.tsx
│   │   ├── home.constants.tsx
│   │   ├── index.ts
│   │   ├── models.constants.tsx
│   │   ├── providers.constants.tsx
│   │   └── settings.constants.tsx
│   ├── hooks/
│   │   ├── useApiGuidePage.ts
│   │   ├── useBrowserGuidePage.ts
│   │   ├── useChatPage.ts
│   │   ├── useChatTest.ts
│   │   ├── useCredentials.ts
│   │   ├── useCustomChat.ts
│   │   ├── useDarkMode.ts
│   │   ├── useDesktopGuidePage.ts
│   │   ├── useExtensionDetection.ts
│   │   ├── useHomePage.ts
│   │   ├── useModels.ts
│   │   ├── useModelsPage.ts
│   │   ├── useProviders.ts
│   │   ├── useProvidersPage.ts
│   │   ├── useQuickChatTest.ts
│   │   ├── useSettingsPage.ts
│   │   ├── useToast.ts
│   │   └── useWebSocket.ts
│   ├── lib/
│   │   ├── api-guide-examples.ts
│   │   ├── constants.ts
│   │   ├── router.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── BrowserGuidePage.tsx
│   │   ├── ChatPage.tsx
│   │   ├── DesktopGuidePage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ModelsPage.tsx
│   │   ├── ProvidersPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── chat.service.ts
│   │   ├── chatService.ts
│   │   ├── credentials.service.ts
│   │   ├── credentialsService.ts
│   │   ├── models.service.ts
│   │   ├── providers.service.ts
│   │   ├── proxy.service.ts
│   │   └── websocket.service.ts
│   ├── stores/
│   │   ├── useAlertStore.ts
│   │   ├── useCredentialsStore.ts
│   │   ├── useLifecycleStore.ts
│   │   ├── useProxyStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── useUIStore.ts
│   ├── styles/
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
│   │   ├── home.css
│   │   ├── icons.css
│   │   ├── index.css
│   │   ├── layout.css
│   │   ├── models.css
│   │   ├── models2.css
│   │   ├── pages.css
│   │   ├── providers.css
│   │   ├── quick-guide.css
│   │   ├── system-features.css
│   │   ├── credentials.css
│   │   ├── api-guide.css
│   │   ├── chat-curl.css
│   │   ├── chat-custom.css
│   │   ├── chat-quick-test.css
│   │   ├── chat-response.css
│   │   ├── chat-tabs.css
│   │   └── ui-components.css
│   ├── types/
│   │   ├── chat.types.ts
│   │   ├── common.types.ts
│   │   ├── components.types.ts
│   │   ├── credentials.types.ts
│   │   ├── home.types.ts
│   │   ├── index.ts
│   │   ├── models.types.ts
│   │   ├── providers.types.ts
│   │   ├── proxy.types.ts
│   │   └── quick-guide.types.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── platform.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── components.json
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

1. **Follow Phase Order**: Complete phases in priority order (P0 before P1)
2. **Foundation First**: Build types → utils → constants → services → stores → hooks → components → pages
3. **Test Each Phase**: Validate each phase before moving to next
4. **Code Reviews**: Ensure adherence to SRP and DRY
5. **TypeScript Strict**: No `any` types, comprehensive typing

### Quality Assurance

1. **Type Safety**: 100% TypeScript coverage
2. **Single Responsibility**: Each file has one clear purpose
3. **DRY Principle**: No code duplication
4. **Domain-Driven**: Clear domain boundaries
5. **Performance**: Monitor bundle size and runtime performance

### Best Practices

1. **Import from `@/types`**: Always use central type exports
2. **Import from `@/constants`**: No magic strings or hardcoded values
3. **Use Services**: All API calls through services layer
4. **Use Hooks**: All business logic in hooks, not components
5. **Consistent Naming**: Follow established naming conventions

---

## Success Criteria

### Technical Criteria

- [ ] All phases implemented according to specifications
- [ ] 100% TypeScript coverage with no `any` types
- [ ] All services follow SRP (single responsibility)
- [ ] All shared logic abstracted (DRY principle)
- [ ] Build succeeds with no errors
- [ ] Application runs without console errors

### Functional Criteria

- [ ] All pages render correctly
- [ ] Routing works properly
- [ ] WebSocket real-time updates work
- [ ] Theme switching works
- [ ] Settings persist correctly
- [ ] Model/Provider management works
- [ ] Chat functionality works

---

**Document Version:** 2.0
**Date:** November 8, 2025
**Status:** Ready for Implementation
**Next Steps:** Begin Phase 1.1 - Create Vite Workspace
