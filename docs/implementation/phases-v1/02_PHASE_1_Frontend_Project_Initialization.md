# Phase 1: Frontend Project Initialization

## Overview
This phase initializes the frontend workspace with Vite, React 18, TypeScript, and Tailwind CSS. It sets up the foundational configuration files necessary for the entire project.

**Priority**: P0  
**Files Created**: 15  
**Files Modified**: 0  
**Description**: Workspace setup with Vite, React 18, TypeScript, Tailwind

## Subphases

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

## Code Documentation Reference
Complete source code for Phase 1 is available in [`04_FRONTEND_CODE_PHASES_1-3.md`](../code_examples/04_FRONTEND_CODE_PHASES_1-3.md)

## Success Criteria
- [ ] All configuration files created and validated
- [ ] Dependencies installed correctly
- [ ] Basic Vite dev server runs without errors