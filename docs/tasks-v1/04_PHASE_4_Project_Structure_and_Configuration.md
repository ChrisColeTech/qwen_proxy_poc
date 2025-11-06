**Goal:** Initialize monorepo with separate frontend and electron workspaces. Configure build tools, TypeScript, and package management.

**Prerequisites:** Complete "Initial Setup" and "Configuration Files" sections above.


## Initial Setup

**Important:** Complete this entire section.

## Configuration Files

All complete file contents are in `docs/v1/03_CODE_EXAMPLES.md`. Update these files:

### frontend/package.json
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
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-slot": "^1.2.4",
    "cmdk": "^1.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@types/node": "^24.6.0",
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
    "lucide-react": "^0.552.0",
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

1. **frontend/vite.config.ts** - Add path aliases and HMR polling for WSL

### frontend/vite.config.ts
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

2. **frontend/tsconfig.app.json**
### frontend/tsconfig.app.json
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
  "include": ["src"],
}

```
3. **frontend/tailwind.config.js** - Configure theme and animations
### frontend/tailwind.config.js
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
4. **frontend/postcss.config.js** - Default generated file
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```
5. **frontend/src/index.css** - Add Tailwind directives and theme variables (CRITICAL for theming)
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
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
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
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
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

6. **frontend/src/vite-env.d.ts** - Add Electron API TypeScript declarations (CRITICAL)

### frontend/src/vite-env.d.ts
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
}

interface Window {
  electronAPI?: ElectronAPI;
}
```

**Why this is CRITICAL:**
- Extends the Window interface with Electron API types
- Prevents TypeScript errors: `Property 'electronAPI' does not exist on type 'Window'`
- Enables autocomplete for `window.electronAPI` methods
- Makes API optional (`?`) so it works in both Electron and browser modes
- Required for TitleBar window controls, useAuth hook, and all Electron IPC

7. **electron/tsconfig.json** - Configure CommonJS output for Electron

### electron/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Files to Create:
- None (all created fresh or updated from templates)

## Files to Modify:
- `package.json` (root workspace) ✅ Created in Initial Setup
- `frontend/package.json` ✅ Updated
- `frontend/vite.config.ts` - Update with path aliases
- `frontend/tsconfig.json` - Update with path aliases
- `frontend/tsconfig.app.json` - Already has path aliases
- `frontend/tsconfig.node.json` ✅ Created by Vite
- `frontend/tailwind.config.js` - **CRITICAL**: Update with theme config, darkMode, and animations
- `frontend/postcss.config.js` ✅ Created by Tailwind init
- `frontend/index.html` ✅ Created by Vite
- `frontend/src/index.css` - **CRITICAL**: Update with Tailwind directives and CSS variables for light/dark themes
- `frontend/src/main.tsx` ✅ Created by Vite
- `frontend/src/vite-env.d.ts` - **CRITICAL**: Update with Electron API type declarations
- `backend/package.json` - Updated
- `electron/package.json` - Create with CommonJS config
- `electron/tsconfig.json` - Create with CommonJS target

## CSS Requirements (IMPORTANT)

The `frontend/src/index.css` and `frontend/tailwind.config.js` files are **critical** for the entire theming system to work. These files define:

1. **CSS Custom Properties** (CSS Variables):
   - All color tokens for light and dark themes
   - Border radius variables
   - Chart color variables

2. **Tailwind Configuration**:
   - darkMode: ['class'] - Enables class-based dark mode toggling
   - Extended color palette using HSL color space
   - Custom animations for UI components
   - Border radius utilities

3. **Base Styles**:
   - Default border colors
   - Body background and text colors
   - Font family (Inter, system-ui)

**Without these CSS configurations, the following will not work:**
- Theme switching (light/dark mode)
- shadcn/ui components styling
- Custom component colors (badges, status indicators)
- Layout component borders and backgrounds
- Smooth transitions and animations

## Integration Points:
- Node.js runtime
- npm workspaces
- Vite build system
- TypeScript compiler
- Tailwind CSS

---

## Structure After Phase 1:

```
project root /
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── node_modules/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
├── electron/
│   ├── src/
│   ├── node_modules/
│   ├── package.json
│   └── tsconfig.json
├── node_modules/
├── package.json
├── package-lock.json
└── .gitignore