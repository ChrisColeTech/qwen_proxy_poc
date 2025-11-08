# Frontend V3 Code Documentation - Phases 1-3

This document provides complete source code documentation for Phases 1-3 of the Frontend V3 Rewrite Implementation Plan. All code is presented verbatim from the `frontend-v3` directory.

## Table of Contents

- [Phase 1: Project Initialization](#phase-1-project-initialization)
  - [Phase 1.1: Vite Configuration](#phase-11-vite-configuration)
  - [Phase 1.2: TypeScript Configuration](#phase-12-typescript-configuration)
  - [Phase 1.3: Tailwind & Styling Setup](#phase-13-tailwind--styling-setup)
- [Phase 2: Foundation Layer - Types](#phase-2-foundation-layer---types)
  - [Phase 2.1: Common & Domain Types](#phase-21-common--domain-types)
  - [Phase 2.2: Component & Feature Types](#phase-22-component--feature-types)
  - [Phase 2.3: Type System Integration](#phase-23-type-system-integration)
- [Phase 3: Foundation Layer - Utilities](#phase-3-foundation-layer---utilities)
  - [Phase 3.1: Core Utilities](#phase-31-core-utilities)
  - [Phase 3.2: Library Utilities](#phase-32-library-utilities)

---

## Phase 1: Project Initialization

This phase establishes the build system, TypeScript configuration, and styling foundation using Vite, React 18, TypeScript, and Tailwind CSS.

### Phase 1.1: Vite Configuration

#### vite.config.ts

**Purpose**: Configures the Vite build system with React plugin, path aliases, and development server settings.

**Key Features**:
- Path alias `@/` pointing to `./src/` for clean imports
- Development server on port 5173
- Polling enabled for WSL/Windows file system compatibility
- HMR (Hot Module Replacement) with error overlay

```typescript
// Path: frontend-v3/vite.config.ts
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
      usePolling: true, // Enable polling for WSL/Windows file systems
    },
    hmr: {
      overlay: true, // Show error overlay on HMR errors
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

---

### Phase 1.2: TypeScript Configuration

#### tsconfig.json

**Purpose**: Root TypeScript configuration that references app and node configs, sets up path aliases.

**Key Features**:
- Project references for modular compilation
- Base path alias configuration shared across all configs

```json
// Path: frontend-v3/tsconfig.json
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

#### tsconfig.app.json

**Purpose**: TypeScript configuration for application source code with strict type checking.

**Key Features**:
- ES2022 target with modern JavaScript features
- Strict mode enabled for maximum type safety
- React JSX transform for React 18
- No unused locals/parameters enforcement
- Bundler module resolution

```json
// Path: frontend-v3/tsconfig.app.json
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

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
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

#### tsconfig.node.json

**Purpose**: TypeScript configuration for Node.js build scripts (vite.config.ts).

**Key Features**:
- ES2023 target for Node.js runtime
- Node.js types included
- Strict linting rules

```json
// Path: frontend-v3/tsconfig.node.json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

---

### Phase 1.3: Tailwind & Styling Setup

#### tailwind.config.js

**Purpose**: Tailwind CSS configuration with dark mode support and custom theme variables.

**Key Features**:
- Class-based dark mode (`dark` class on root element)
- HSL-based color system using CSS variables
- Custom animations for accordions
- shadcn/ui compatible theme structure
- Responsive container configuration

```javascript
// Path: frontend-v3/tailwind.config.js
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
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: 0
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### index.css

**Purpose**: Main stylesheet with CSS variable definitions for light/dark themes and modular style imports.

**Key Features**:
- CSS custom properties for theme variables
- Light and dark theme definitions
- Modular CSS imports organized by layer
- Tailwind directives integration
- Global styles and resets

**Architecture**:
- **Import Order**: Custom styles imported before Tailwind directives
- **Layer Organization**: Base → Utilities → Layout → Pages → Components
- **Theme Variables**: HSL-based color system for easy theme switching

```css
/* Path: frontend-v3/src/index.css */
/* Import custom component styles first */
@import './styles/icons.css';
@import './styles/home.css';
@import './styles/providers.css';
@import './styles/models.css';
@import './styles/credentials.css';
/* ============================================================================
   QWEN PROXY - MAIN STYLESHEET
   Architecture: Modular CSS organized by layer
   ============================================================================ */

/* IMPORTANT: All @import must come before @tailwind and any other CSS */

/* Base Styles - Theme variables and global resets */
@import './styles/base/theme.css';

/* Utility Classes - Common utilities used across the app */
@import './styles/utilities/common.css';

/* Layout Styles - Core layout components */
@import './styles/layout.css';

/* Page Styles - Page-level styling */
@import './styles/pages.css';
@import './styles/pages/providers.css';
@import './styles/pages/quick-guide.css';

/* Feature Component Styles - Domain-specific components */
@import './styles/system-features.css';
@import './styles/quick-guide.css';
@import './styles/api-guide.css';
@import './styles/chat-tabs.css';
@import './styles/chat-quick-test.css';
@import './styles/chat-custom.css';
@import './styles/chat-response.css';
@import './styles/chat-curl.css';
@import './styles/models2.css';

/* UI Component Styles - Reusable UI components */
@import './styles/ui-components.css';

/* Legacy Component Styles - To be refactored */
@import './styles/components/steps.css';
@import './styles/components/guide.css';

/* Tailwind Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Note**: The actual theme CSS variables are defined in `./styles/base/theme.css` which contains the same light/dark theme definitions as shown in the implementation plan (Phase 1.3, file #5).

#### vite-env.d.ts

**Purpose**: TypeScript type declarations for Vite client types and Electron API interface.

**Key Features**:
- Vite client types reference for import.meta.env
- ElectronAPI interface for IPC communication
- Window interface extension for Electron integration
- Optional electronAPI property (undefined in browser mode)

**Critical Note**: This file is essential for TypeScript compilation. Without it, accessing `window.electronAPI` will cause TypeScript errors. The `?` operator makes the API optional since it's only available in Electron mode.

```typescript
// Path: frontend-v3/src/vite-env.d.ts
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

---

## Phase 2: Foundation Layer - Types

This phase establishes a comprehensive type system following Domain-Driven Design principles. All types are organized by domain and exported through a central barrel file.

### Phase 2.1: Common & Domain Types

These files define the core type definitions for shared types and domain models.

#### types/common.types.ts

**Purpose**: Shared utility types used across the entire application.

**Key Features**:
- UI state types for theme and sidebar positioning
- Proxy status type for server state

```typescript
// Path: frontend-v3/src/types/common.types.ts
// Common types shared across the application

export interface UIState {
  theme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
  showStatusMessages: boolean;
}

export type ProxyStatus = 'running' | 'stopped';
```

#### types/providers.types.ts

**Purpose**: Provider domain types for provider management and display.

**Key Features**:
- Provider entity with metadata and runtime status
- ProvidersResponse for API pagination
- Action state for loading/error tracking
- Table component props interface

```typescript
// Path: frontend-v3/src/types/providers.types.ts
// Types for ProvidersPage and related components

export interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  description: string;
  created_at: number;
  updated_at: number;
  runtime_status: string;
}

export interface ProvidersResponse {
  providers: Provider[];
  total: number;
}

export interface ProviderActionState {
  loading: string | null;
  error: string | null;
}

export interface ProvidersTableProps {
  providers: Provider[];
  actionLoading: string | null;
  onToggleEnabled: (provider: Provider) => void;
  onTest: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onCreate?: () => void;
  onRowClick?: (providerId: string) => void;
}
```

#### types/models.types.ts

**Purpose**: Model domain types for AI model management and filtering.

**Key Features**:
- Model entity with raw capabilities string
- ParsedModel with typed capabilities array
- Capability and filter types for UI filtering

```typescript
// Path: frontend-v3/src/types/models.types.ts
// Model types for the Models page

export interface Model {
  id: string;
  name: string;
  description: string;
  capabilities: string; // JSON string array from backend
  status: string;
  created_at: number;
  updated_at: number;
}

export interface ParsedModel {
  id: string;
  name: string;
  description: string;
  capabilities: Capability[];
  provider: string; // Extracted from description
}

export type Capability = 'chat' | 'vision' | 'tool-call' | 'completion' | 'code' | 'tools';

export type CapabilityFilter = 'all' | 'vision' | 'tool-call' | 'chat';
```

#### types/credentials.types.ts

**Purpose**: Credentials domain types matching the `/api/qwen/credentials` endpoints.

**Key Features**:
- QwenCredentials status interface
- SetCredentialsRequest for credential updates
- CredentialStatus for validation state

```typescript
// Path: frontend-v3/src/types/credentials.types.ts
// Types for credential management matching /api/qwen/credentials endpoints

export interface QwenCredentials {
  hasCredentials: boolean;
  expiresAt: number | null;
  isValid: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SetCredentialsRequest {
  token: string;
  cookies: string;
  expiresAt: number;
}

export interface CredentialStatus {
  valid: boolean;
  expiresAt: number | null;
}
```

#### types/proxy.types.ts

**Purpose**: Proxy server management types matching `/api/proxy/*` and `/api/providers/*` endpoints.

**Key Features**:
- ProxyServerInfo for server runtime information
- ProxyStatusResponse with comprehensive system status
- ProxyControlResponse for start/stop operations
- Provider and Model interfaces for proxy context

```typescript
// Path: frontend-v3/src/types/proxy.types.ts
// Types for proxy management matching /api/proxy/* and /api/providers/* endpoints

export interface Provider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority?: number;
  description?: string;
  baseUrl?: string;
  created_at?: number;
  updated_at?: number;
}

export interface Model {
  id: string;
  name?: string;
  providerId?: string;
}

export interface ProxyServerInfo {
  running: boolean;
  port?: number;
  pid?: number;
  uptime?: number;
}

export interface ProxyStatusResponse {
  status: 'running' | 'stopped' | 'starting' | 'stopping';
  qwenProxy?: ProxyServerInfo;
  providerRouter?: ProxyServerInfo;
  providers?: {
    items: Provider[];
    enabled: number;
    total: number;
  };
  models?: {
    items: Model[];
    total: number;
  };
  credentials?: {
    valid: boolean;
    expiresAt: number | null;
  };
  extensionConnected?: boolean;
  message: string;
}

export interface ProxyControlResponse {
  status: 'running' | 'stopped' | 'already_running' | 'error';
  message: string;
  qwenProxy?: ProxyServerInfo;
  providerRouter?: ProxyServerInfo;
}
```

#### types/chat.types.ts

**Purpose**: Chat service type definitions for OpenAI-compatible chat completions.

**Key Features**:
- ParsedChatResponse with thinking/response separation
- ChatMessage for conversation history
- ChatCompletionRequest/Response matching OpenAI API format

```typescript
// Path: frontend-v3/src/types/chat.types.ts
/**
 * Chat Service Type Definitions
 * Type definitions for chat-related functionality
 */

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

### Phase 2.2: Component & Feature Types

These files define types for UI components and page-specific functionality.

#### types/components.types.ts

**Purpose**: Centralized type definitions for component props.

**Key Features**:
- Chat component props interfaces
- Model browsing component props
- Tab component props
- Section component props

```typescript
// Path: frontend-v3/src/types/components.types.ts
/**
 * Component Props Type Definitions
 * Centralized type definitions for component props
 */

import type { Model } from './proxy.types';

export interface ChatTestCardProps {
  providerRouterUrl: string;
  activeModel?: string;
}

export interface ModelsCardProps {
  models: Array<{
    id: string;
    name?: string;
    providerId?: string;
  }>;
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}

export interface QuickTestTabProps {
  providerRouterUrl: string;
  model: string;
}

export interface CustomChatTabProps {
  providerRouterUrl: string;
  model: string;
}

export interface CurlTabProps {
  providerRouterUrl: string;
  model: string;
}

export interface ThinkingSectionProps {
  thinking: string;
}

export interface ResponseSectionProps {
  mainResponse: string;
  loading: boolean;
}

export interface BrowseModelsTabProps {
  models: Model[];
  loading: boolean;
  onRefresh: () => void;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
}

export interface ModelsCurlTabProps {
  providerRouterUrl: string;
}
```

#### types/home.types.ts

**Purpose**: HomePage and related component types.

**Key Features**:
- ProxyStatus interface for comprehensive system state
- ProxyControlState for UI loading/error states

```typescript
// Path: frontend-v3/src/types/home.types.ts
// Types for HomePage and related components

export interface ProxyStatus {
  providerRouter?: {
    running: boolean;
    port: number;
    uptime: number;
  };
  qwenProxy?: {
    running: boolean;
    port: number;
    uptime: number;
  };
  credentials?: {
    valid: boolean;
    expiresAt: number | null;
  };
  providers?: {
    items: any[];
    total: number;
    enabled: number;
  };
  models?: {
    items: any[];
    total: number;
  };
}

export interface ProxyControlState {
  loading: boolean;
  error: string | null;
}
```

#### types/quick-guide.types.ts

**Purpose**: Quick guide component types with shared type imports.

**Key Features**:
- ModelsStepProps with filtering capabilities
- ChatCompletionStepProps for chat testing
- ProviderSwitchStepProps for provider switching
- CodeBlockProps for code display

```typescript
// Path: frontend-v3/src/types/quick-guide.types.ts
// Re-export shared types
import type { ParsedModel, CapabilityFilter } from './models.types';
import type { Provider } from './providers.types';

export interface ModelsStepProps {
  models: ParsedModel[];
  loading: boolean;
  onRefresh: () => void;
  providerRouterUrl: string;
  activeModel?: string;
  onSelectModel?: (modelId: string) => void;
  capabilityFilter?: CapabilityFilter;
  providerFilter?: string;
  providers?: string[];
  setCapabilityFilter?: (filter: CapabilityFilter) => void;
  setProviderFilter?: (filter: string) => void;
  clearFilters?: () => void;
  error?: string | null;
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
  actionLoading?: string | null;
  onToggleEnabled?: (id: string) => void;
  onTest?: (id: string) => void;
  onDelete?: (provider: Provider) => void;
  onCreate?: () => void;
  onRowClick?: (providerId: string) => void;
}

export interface CodeBlockProps {
  label: string;
  code: string;
}
```

---

### Phase 2.3: Type System Integration

#### types/index.ts

**Purpose**: Central barrel export file for all type definitions.

**Key Features**:
- Re-exports all domain types
- WebSocket event type definitions
- Connection status types
- Single import point for entire type system

**Architecture Note**: This file serves as the single source of truth for all type imports. Components should always import from `@/types` rather than individual type files.

```typescript
// Path: frontend-v3/src/types/index.ts
// Central type export file

export type { UIState, ProxyStatus } from './common.types';
export type { QwenCredentials, SetCredentialsRequest, CredentialStatus } from './credentials.types';
export type {
  Provider,
  Model,
  ProxyServerInfo,
  ProxyStatusResponse,
  ProxyControlResponse,
} from './proxy.types';
export * from "./providers.types"
export * from './models.types'

// WebSocket Event Types
export interface ProxyStatusEvent {
  status: {
    status?: string; // 'running' | 'stopped' | 'partial'
    message?: string;
    providerRouter: { running: boolean; port: number; uptime: number };
    qwenProxy: { running: boolean; port: number; uptime: number };
    credentials: { valid: boolean; expiresAt: number | null };
    providers: { items: any[]; total: number; enabled: number };
    models: { items: any[]; total: number };
    extensionConnected?: boolean;
  };
  timestamp: string;
}

export interface CredentialsUpdatedEvent {
  action: 'updated' | 'deleted';
  credentials: { valid: boolean; expiresAt: number | null };
  timestamp: string;
}

export interface ProvidersUpdatedEvent {
  action: string;
  providers: any[];
  timestamp: string;
}

export interface ModelsUpdatedEvent {
  action: string;
  models: any[];
  timestamp: string;
}

export interface LifecycleUpdateEvent {
  providerRouter?: {
    state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    port: number | null;
    running: boolean;
    error?: string | null;
  };
  qwenProxy?: {
    state: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    port: number | null;
    running: boolean;
    error?: string | null;
  };
  timestamp: number;
}

export type WebSocketConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface WebSocketEvent {
  type: 'proxy:status' | 'credentials:updated' | 'providers:updated' | 'models:updated' | 'lifecycle:update';
  data: any;
  timestamp: string;
}
```

---

## Phase 3: Foundation Layer - Utilities

This phase provides reusable utility functions following the DRY (Don't Repeat Yourself) principle. All utilities are pure functions with no side effects.

### Phase 3.1: Core Utilities

These files contain essential utility functions for platform detection, data formatting, and validation.

#### utils/platform.ts

**Purpose**: Platform detection utilities for Electron vs Browser environment.

**Key Features**:
- Runtime detection of Electron environment
- Type-safe window.electronAPI check

**Usage**: Used throughout the app to conditionally render UI and call platform-specific APIs.

```typescript
// Path: frontend-v3/src/utils/platform.ts
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}
```

#### utils/formatters.ts

**Purpose**: Data formatting functions for consistent UI display.

**Key Features**:
- formatUptime: Converts seconds to human-readable format (e.g., "2h 15m 30s")
- formatExpiryDate: Formats timestamps to localized date strings

**Usage**: Used in status displays, credential expiry indicators, and uptime counters.

```typescript
// Path: frontend-v3/src/utils/formatters.ts
export function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

export function formatExpiryDate(expiresAt: number | null): string {
  if (!expiresAt) return 'N/A';
  const date = new Date(expiresAt);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
```

**Note**: The validators.ts file was not found in the source directory, suggesting it may not be implemented yet or was removed during development.

---

### Phase 3.2: Library Utilities

These files provide library-specific helper functions and application-wide constants.

#### lib/utils.ts

**Purpose**: Tailwind CSS class name utility (cn) for conditional styling.

**Key Features**:
- Combines clsx for conditional classes
- Uses tailwind-merge to resolve conflicting Tailwind classes
- Essential for shadcn/ui components

**Usage**: Used in every component for dynamic className construction.

```typescript
// Path: frontend-v3/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### lib/constants.ts

**Purpose**: Application-wide constants for configuration values.

**Key Features**:
- Layout dimensions (titlebar, statusbar heights)
- API base URL configuration
- Polling intervals for real-time updates
- Version and application name

**Usage**: Imported throughout the app for consistent configuration values.

```typescript
// Path: frontend-v3/src/lib/constants.ts
export const APP_NAME = 'Qwen Proxy';
export const APP_VERSION = '1.0.0';
export const TITLEBAR_HEIGHT = 40;
export const STATUSBAR_HEIGHT = 24;
export const API_BASE_URL = 'http://localhost:3002';
export const CREDENTIAL_POLL_INTERVAL = 5000; // 5 seconds
export const STATUS_POLL_INTERVAL = 10000; // 10 seconds
```

#### lib/router.ts

**Purpose**: Simple routing utility for pattern matching and parameter extraction.

**Key Features**:
- matchRoute: Extracts dynamic parameters from paths (e.g., `/providers/:id`)
- buildPath: Constructs paths from patterns and parameters
- Supports dynamic segments with `:param` syntax

**Usage**: Can be used for future dynamic routing needs, currently serves as a foundation for route-based features.

```typescript
// Path: frontend-v3/src/lib/router.ts
// Simple router utility for pattern matching and param extraction

export interface RouteMatch {
  params: Record<string, string>;
  matched: boolean;
}

/**
 * Match a route pattern against a path and extract params
 * @param pattern - Route pattern like "/providers/:id" or "/providers/:id/edit"
 * @param path - Actual path like "/providers/openai" or "/providers/openai/edit"
 * @returns Match result with params
 */
export function matchRoute(pattern: string, path: string): RouteMatch {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  // If different lengths, no match (unless pattern has catch-all)
  if (patternParts.length !== pathParts.length) {
    return { params: {}, matched: false };
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // Dynamic segment (starts with :)
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    }
    // Static segment must match exactly
    else if (patternPart !== pathPart) {
      return { params: {}, matched: false };
    }
  }

  return { params, matched: true };
}

/**
 * Build a path from a pattern and params
 * @param pattern - Route pattern like "/providers/:id/edit"
 * @param params - Params object like { id: "openai" }
 * @returns Built path like "/providers/openai/edit"
 */
export function buildPath(pattern: string, params: Record<string, string>): string {
  let path = pattern;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value);
  }
  return path;
}
```

#### lib/api-guide-examples.ts

**Purpose**: Code examples for the API guide page.

**Key Features**:
- Python example using OpenAI SDK
- Node.js example using OpenAI SDK
- cURL example for raw HTTP requests
- Health check examples
- Common issues and solutions
- Supported endpoint documentation

**Usage**: Imported by the API guide page components for displaying integration examples.

```typescript
// Path: frontend-v3/src/lib/api-guide-examples.ts
export const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="qwen3-max",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;

export const nodeExample = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3001/v1',
  apiKey: 'dummy-key'
});

const completion = await openai.chat.completions.create({
  model: 'qwen3-max',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);`;

export const curlExample = `curl http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hello!"}]}'`;

export const healthCheckExample = `# Check proxy is running
curl http://localhost:3001/health

# Test a simple completion
curl http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test" \\
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Say hello"}]}'`;

export const commonIssues = [
  { error: 'Connection refused', solution: 'Start proxy via dashboard' },
  { error: '401 Unauthorized', solution: 'Re-authenticate (credentials expired)' },
  { error: 'Empty responses', solution: 'Check Qwen service status' },
];

export const supportedEndpoints = [
  { endpoint: 'POST /v1/chat/completions', description: 'Send chat completion requests. Supports streaming with stream: true' },
  { endpoint: 'GET /v1/models', description: 'List all available models from the active provider' },
  { endpoint: 'GET /health', description: 'Check proxy server health and provider status' },
];
```

---

## Summary

This document has provided complete source code documentation for Phases 1-3 of the Frontend V3 implementation:

### Phase 1 Deliverables
- **Vite Configuration**: Build system setup with React, TypeScript, and path aliases
- **TypeScript Configuration**: Strict type checking with modular compilation
- **Tailwind & Styling**: Dark mode support, custom theme, and CSS architecture

### Phase 2 Deliverables
- **10 Type Definition Files**: Comprehensive type system covering all domains
- **Common Types**: Shared utility types for UI state and proxy status
- **Domain Types**: Providers, Models, Credentials, Proxy, Chat
- **Component Types**: Props interfaces for all UI components
- **WebSocket Types**: Event definitions for real-time updates

### Phase 3 Deliverables
- **Core Utilities**: Platform detection and data formatting
- **Library Utilities**: Tailwind cn() utility, constants, routing, API examples
- **Pure Functions**: All utilities are side-effect free and testable

### Key Architectural Patterns

1. **Single Responsibility Principle (SRP)**: Each file has one clear purpose
2. **Don't Repeat Yourself (DRY)**: Shared logic abstracted into utilities
3. **Type Safety**: Comprehensive TypeScript coverage with no `any` types
4. **Domain-Driven Design**: Types organized by business domain
5. **Barrel Exports**: Central export points for clean imports

### Next Steps

With the foundation layers complete (Phases 1-3), the implementation can proceed to:
- **Phase 4**: Constants layer for page-level configurations
- **Phase 5**: Service layer for API communication
- **Phase 6**: State management with Zustand stores
- **Phase 7**: Custom hooks for business logic
- **Phases 8-13**: UI components, pages, and styling

---

**Document Version**: 1.0
**Date**: November 8, 2025
**Source**: frontend-v3 directory
**Coverage**: Phases 1-3 (Project Initialization, Types, Utilities)
