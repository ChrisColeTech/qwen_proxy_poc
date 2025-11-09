# Frontend V3 Code Documentation - Phases 1-3

This document contains the complete verbatim source code for Phases 1-3 of the Frontend V3 Rewrite Implementation Plan.

**Reference**: See `/Users/chris/Projects/qwen_proxy_poc/docs/implementation/01_FRONTEND_V3_REWRITE_IMPLEMENTATION_PLAN.md` for the complete implementation plan.

---

## Table of Contents

- [Phase 1: Project Setup](#phase-1-project-setup)
- [Phase 2: Core Setup](#phase-2-core-setup)
- [Phase 3: Configuration](#phase-3-configuration)

---

## Phase 1: Project Setup

### package.json
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/package.json`
**Lines**: 57

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "npx kill-port 5173 && vite",
    "build": "tsc -b",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toast": "^1.2.15",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "cmdk": "^1.1.1",
    "framer-motion": "^12.23.24",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "socket.io-client": "^4.8.1",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@types/node": "^24.10.0",
    "@types/react": "^18.3.26",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^5.0.4",
    "autoprefixer": "^10.4.21",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "eslint": "^9.36.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.22",
    "globals": "^16.4.0",
    "kill-port": "^2.0.1",
    "lucide-react": "^0.553.0",
    "postcss": "^8.5.6",
    "react-icons": "^5.5.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss": "^3.4.18",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.45.0",
    "vite": "^7.1.7"
  }
}
```

---

### tsconfig.json
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/tsconfig.json`
**Lines**: 14

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

---

### vite.config.ts
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/vite.config.ts`
**Lines**: 25

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

### tailwind.config.js
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/tailwind.config.js`
**Lines**: 90

```javascript
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

---

### postcss.config.js
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/postcss.config.js`
**Lines**: 7

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### index.html
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/index.html`
**Lines**: 14

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Phase 2: Core Setup

### src/main.tsx
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/main.tsx`
**Lines**: 8

```typescript
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
```

---

### src/App.tsx
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/App.tsx`
**Lines**: 80

```typescript
import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from '@/pages/HomePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ProviderFormPage } from '@/pages/ProviderFormPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { ModelFormPage } from '@/pages/ModelFormPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { BrowserGuidePage } from '@/pages/BrowserGuidePage';
import { DesktopGuidePage } from '@/pages/DesktopGuidePage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

function App() {
  useDarkMode();
  useWebSocket(); // Initialize WebSocket connection at app level
  const currentRoute = useUIStore((state) => state.currentRoute);
  const loadSettings = useUIStore((state) => state.loadSettings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  // Load persisted UI state and settings on mount
  useEffect(() => {
    loadSettings();
    fetchSettings();
  }, [loadSettings, fetchSettings]);

  const renderPage = () => {
    // Handle provider routes with IDs
    if (currentRoute.startsWith('/providers/')) {
      const path = currentRoute.substring('/providers/'.length);
      if (path === 'new') {
        return <ProviderFormPage />;
      } else if (path.endsWith('/edit')) {
        return <ProviderFormPage />;
      } else {
        return <ProviderFormPage readOnly={true} />;
      }
    }

    // Handle model routes with IDs
    if (currentRoute.startsWith('/models/')) {
      return <ModelFormPage />;
    }

    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/providers':
        return <ProvidersPage />;
      case '/models':
        return <ModelsPage />;
      case '/chat':
        return <ChatPage />;
      case '/settings':
        return <SettingsPage />;
      case '/browser-guide':
        return <BrowserGuidePage />;
      case '/desktop-guide':
        return <DesktopGuidePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <AppLayout>
        {renderPage()}
      </AppLayout>
      <Toaster />
    </>
  );
}

export default App;
```

---

### src/index.css
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/index.css`
**Lines**: 50

```css
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

---

## Phase 3: Configuration

### src/vite-env.d.ts
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/vite-env.d.ts`
**Lines**: 37

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

---

### tsconfig.app.json
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/tsconfig.app.json`
**Lines**: 34

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

---

### tsconfig.node.json
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/tsconfig.node.json`
**Lines**: 27

```json
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

### .gitignore
**Path**: `/Users/chris/Projects/qwen_proxy_poc/frontend/.gitignore`
**Lines**: 25

```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

---

## Summary

This document contains the complete verbatim source code for **Phases 1-3** of the Frontend V3 implementation:

### Phase 1: Project Setup (6 files)
- `package.json` - Dependencies and build scripts
- `tsconfig.json` - Root TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS theme configuration
- `postcss.config.js` - PostCSS configuration
- `index.html` - HTML entry point

### Phase 2: Core Setup (3 files)
- `src/main.tsx` - React application entry point
- `src/App.tsx` - Main app component with routing
- `src/index.css` - Main stylesheet with modular imports

### Phase 3: Configuration (4 files)
- `src/vite-env.d.ts` - TypeScript type definitions for Vite and Electron
- `tsconfig.app.json` - TypeScript configuration for app source
- `tsconfig.node.json` - TypeScript configuration for Node.js scripts
- `.gitignore` - Git ignore patterns

**Total Files**: 13
**Total Lines**: ~400 (approximate, excluding CSS imports)

---

**Document Version**: 2.0
**Date**: November 9, 2025
**Source**: `/Users/chris/Projects/qwen_proxy_poc/frontend/`
**Coverage**: Phases 1-3 Complete Source Code
