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

#### package.json

**Path**: `frontend/package.json`

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "npx kill-port 5173 && vite",
    "build": "tsc -b && vite build",
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

#### vite.config.ts

**Path**: `frontend/vite.config.ts`

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

#### tsconfig.json

**Path**: `frontend/tsconfig.json`

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

#### tsconfig.app.json

**Path**: `frontend/tsconfig.app.json`

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

#### tsconfig.node.json

**Path**: `frontend/tsconfig.node.json`

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

#### tailwind.config.js

**Path**: `frontend/tailwind.config.js`

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

#### postcss.config.js

**Path**: `frontend/postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

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


**Validation:**
- Run `npm run build` - should succeed
- Vite config has `@/` path alias
- TypeScript strict mode enabled
- Tailwind dark mode configured