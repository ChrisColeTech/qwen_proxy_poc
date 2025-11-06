# Code Examples

This document contains code snippets and implementation examples referenced in the Implementation Plan.

---

## Phase 1: Project Initialization & Monorepo Setup

### Root package.json
```json
{
  "name": "root",
  "version": "1.0.0",
  "private": true,
  "author": "Your Name",
  "scripts": {
    "dev": "concurrently \"npm:dev:frontend\" \"npm:dev:electron\" \"npm:dev:backend\"",
    "build": "npm run build --workspace=frontend && npm run build --workspace=electron",
    "start": "npm run dev",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:electron": "wait-on http://localhost:5173 && npm run dev --workspace=electron",
    "dev:backend": "npm run dev -w backend",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux"
  },
  "devDependencies": {
    "concurrently": "^9.1.2",
    "electron-builder": "^26.0.12",
    "wait-on": "^8.0.1"
  },
  "workspaces": [
    "frontend",
    "electron",
    "backend"
  ]
}

```

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

### frontend/tsconfig.json
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

### frontend/src/index.css
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

### frontend/src/vite-env.d.ts (TypeScript Declarations)
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

**IMPORTANT**: This file extends the Window interface to include Electron API types. Without it, TypeScript will throw errors when accessing `window.electronAPI`. The `?` makes it optional since it's undefined in browser mode.

---

### electron/package.json
```json
{
  "name": "electron",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "electron .",
    "dev": "tsc && cross-env NODE_ENV=development electron ."
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "cross-env": "^10.1.0",
    "electron": "^27.0.0",
    "electron-builder": "^24.0.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "electron-store": "^8.2.0"
  }
}

```

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

### electron/src/main.ts
```typescript
import { app, BrowserWindow, ipcMain, clipboard } from 'electron';
import * as path from 'path';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('clipboard:read', () => clipboard.readText());
ipcMain.handle('clipboard:write', (_, text: string) => clipboard.writeText(text));
```

---

### backend/package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "npx kill-port 3001 && ts-node-dev src/index.ts",
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "axios": "^1.13.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.5",
    "@types/node": "^24.9.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.9.3"
  }
}

```

## Phase 2: Type Definitions Foundation

### frontend/src/types/path.types.ts
```typescript
// Path format types
export type PathFormat = 'windows' | 'wsl' | 'msys' | 'unc' | 'unknown';

// Path conversion result
export interface ConvertedPaths {
  windows: string;
  wsl: string;
  msys: string;
}

// Multi-line conversion result
export interface ConversionResult {
  original: string;
  windows: string[];
  wsl: string[];
  msys: string[];
  hasErrors: boolean;
}

// Path detection result
export interface PathDetectionResult {
  format: PathFormat;
  isValid: boolean;
  driveLetter?: string;
  path?: string;
}
```

### frontend/src/types/electron.types.ts
```typescript
// Electron IPC channels
export type IpcChannel =
  | 'clipboard:read'
  | 'clipboard:write'
  | 'app:quit'
  | 'window:minimize'
  | 'window:maximize'
  | 'window:close';

// Electron API exposed via contextBridge
export interface ElectronAPI {
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
  };
}
```

### frontend/src/types/index.ts
```typescript
export * from './path.types';
export * from './electron.types';
```

---

## Phase 3: Path Conversion Core Logic

### Conversion Logic Reference
```typescript
// Windows -> WSL: C:\path\to\file -> /mnt/c/path/to/file
// Windows -> MSYS: C:\path\to\file -> /c/path/to/file
// WSL -> Windows: /mnt/c/path/to/file -> C:\path\to\file
// WSL -> MSYS: /mnt/c/path/to/file -> /c/path/to/file
// MSYS -> Windows: /c/path/to/file -> C:\path\to\file
// MSYS -> WSL: /c/path/to/file -> /mnt/c/path/to/file
// UNC -> UNC: \\server\share -> \\server\share (Windows)
// UNC -> Unix: \\server\share -> //server/share (WSL/MSYS)
```

---

## Phase 4: Utility Functions & Validators

### frontend/src/utils/constants.ts
```typescript
export const APP_CONFIG = {
  WINDOW_WIDTH: 800,
  WINDOW_HEIGHT: 600,
  MIN_WIDTH: 600,
  MIN_HEIGHT: 500,
} as const;

export const PATH_CONFIG = {
  MAX_PATH_LENGTH: 32767,
  CONVERSION_DEBOUNCE_MS: 150,
  COPY_FEEDBACK_DURATION_MS: 2000,
} as const;

export const KEYBOARD_SHORTCUTS = {
  PASTE: 'Ctrl+V',
  CLEAR: 'Ctrl+Shift+C',
  COPY_WINDOWS: 'Ctrl+1',
  COPY_WSL: 'Ctrl+2',
  COPY_MSYS: 'Ctrl+3',
  QUIT: 'Ctrl+Q',
} as const;

export const PATH_FORMATS = {
  WINDOWS: 'windows',
  WSL: 'wsl',
  MSYS: 'msys',
  UNC: 'unc',
  UNKNOWN: 'unknown',
} as const;
```

---

## Phase 5: Custom Hooks - Clipboard Operations

### frontend/src/hooks/useClipboard.ts
```typescript
interface UseClipboardReturn {
  copyToClipboard: (text: string) => Promise<boolean>;
  readFromClipboard: () => Promise<string>;
  isCopying: boolean;
  copyError: Error | null;
}

export function useClipboard(): UseClipboardReturn
```

### electron/src/preload.ts (IPC Setup)
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  clipboard: {
    readText: () => ipcRenderer.invoke('clipboard:read'),
    writeText: (text: string) => ipcRenderer.invoke('clipboard:write', text),
  },
});
```

### IPC Handlers in electron/src/main.ts
```typescript
import { ipcMain, clipboard } from 'electron';

ipcMain.handle('clipboard:read', () => clipboard.readText());
ipcMain.handle('clipboard:write', (_, text: string) => clipboard.writeText(text));
```

---

## Phase 6: Custom Hooks - Path Conversion State

### frontend/src/hooks/usePathConverter.ts
```typescript
interface UsePathConverterReturn {
  inputText: string;
  conversionResult: ConversionResult;
  setInputText: (text: string) => void;
  clearInput: () => void;
  isConverting: boolean;
}

export function usePathConverter(): UsePathConverterReturn
```

---

## Phase 5 (Updated): State Management with Zustand

### frontend/src/types/index.ts
```typescript
export * from './path.types';
export * from './electron.types';

export interface UIState {
  theme: 'light' | 'dark';
  sidebarPosition: 'left' | 'right';
}
```

### frontend/src/stores/useUIStore.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from '@/types';

interface UIStore {
  uiState: UIState;
  statusMessage: string;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  toggleSidebarPosition: () => void;
  setStatusMessage: (message: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      uiState: {
        theme: 'dark',
        sidebarPosition: 'left',
      },
      statusMessage: 'Ready',
      setTheme: (theme) =>
        set((state) => ({
          uiState: { ...state.uiState, theme },
        })),
      toggleTheme: () =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            theme: state.uiState.theme === 'light' ? 'dark' : 'light',
          },
        })),
      setSidebarPosition: (position) =>
        set((state) => ({
          uiState: { ...state.uiState, sidebarPosition: position },
        })),
      toggleSidebarPosition: () =>
        set((state) => ({
          uiState: {
            ...state.uiState,
            sidebarPosition: state.uiState.sidebarPosition === 'left' ? 'right' : 'left',
          },
        })),
      setStatusMessage: (message) => set({ statusMessage: message }),
    }),
    {
      name: 'qwen-proxy-ui-state',
    }
  )
);
```

### frontend/src/stores/useCredentialsStore.ts
```typescript
import { create } from 'zustand';
import type { QwenCredentials } from '@/types';

interface CredentialsStore {
  credentials: QwenCredentials | null;
  loading: boolean;
  setCredentials: (credentials: QwenCredentials | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useCredentialsStore = create<CredentialsStore>((set) => ({
  credentials: null,
  loading: false,
  setCredentials: (credentials) => set({ credentials }),
  setLoading: (loading) => set({ loading }),
}));
```

### frontend/src/stores/useProxyStore.ts
```typescript
import { create } from 'zustand';
import type { ProxyStatusResponse } from '@/types';

interface ProxyStore {
  status: ProxyStatusResponse | null;
  loading: boolean;
  setStatus: (status: ProxyStatusResponse | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProxyStore = create<ProxyStore>((set) => ({
  status: null,
  loading: false,
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
}));
```

### frontend/src/stores/useAlertStore.ts
```typescript
import { create } from 'zustand';

interface AlertStore {
  alert: {
    message: string;
    type: 'success' | 'error';
  } | null;
  showAlert: (message: string, type: 'success' | 'error') => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alert: null,
  showAlert: (message, type) => set({ alert: { message, type } }),
  hideAlert: () => set({ alert: null }),
}));
```

### frontend/src/hooks/useDarkMode.ts
```typescript
import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';

export function useDarkMode() {
  const theme = useUIStore((state) => state.uiState.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return { theme, toggleTheme };
}
```

---

## Phase 6 (Updated): Enhanced UI Components

### Custom Component: frontend/src/components/ui/environment-badge.tsx
```typescript
import { Badge } from '@/components/ui/badge';
import { credentialsService } from '@/services/credentialsService';

export function EnvironmentBadge() {
  const isElectron = credentialsService.isElectron();

  return (
    <Badge variant="outline" className="gap-1.5 text-xs h-5">
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {isElectron ? 'Desktop' : 'Browser'}
    </Badge>
  );
}
```

### Custom Component: frontend/src/components/ui/status-badge.tsx
```typescript
import { Badge } from '@/components/ui/badge';

type Status = 'active' | 'inactive' | 'expired' | 'running' | 'stopped';

interface StatusBadgeProps {
  status: Status;
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const variantMap: Record<Status, 'default' | 'secondary' | 'destructive'> = {
    active: 'default',
    running: 'default',
    inactive: 'secondary',
    stopped: 'secondary',
    expired: 'destructive',
  };

  return (
    <Badge variant={variantMap[status]}>
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
```

### Custom Component: frontend/src/components/ui/status-indicator.tsx
```typescript
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'inactive';
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  pulse = false,
  className
}: StatusIndicatorProps) {
  const colorMap = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    inactive: 'bg-gray-400',
  };

  return (
    <div
      className={cn(
        'h-2 w-2 rounded-full',
        colorMap[status],
        pulse && 'animate-pulse',
        className
      )}
    />
  );
}
```

---

## Phase 7 (Updated): Enhanced Layout Components

### frontend/src/components/layout/AppLayout.tsx
```typescript
import { TitleBar } from './TitleBar';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/stores/useUIStore';

interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export function AppLayout({ children, activeRoute, onNavigate }: AppLayoutProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);

  return (
    <div className="h-screen flex flex-col">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        {sidebarPosition === 'left' && (
          <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        {sidebarPosition === 'right' && (
          <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />
        )}
      </div>
      <StatusBar />
    </div>
  );
}
```

### frontend/src/components/layout/Sidebar.tsx
```typescript
import { Home, BookOpen, Blocks, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/useUIStore';

interface SidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  route: string;
}

const navItems: NavItem[] = [
  { id: 'home', icon: Home, label: 'Home', route: '/' },
  { id: 'guide', icon: BookOpen, label: 'Quick Guide', route: '/guide' },
  { id: 'providers', icon: Blocks, label: 'Providers', route: '/providers' },
  { id: 'models', icon: Cpu, label: 'Models', route: '/models' },
];

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);

  return (
    <div className={cn(
      'w-12 bg-card flex flex-col items-center pt-2',
      sidebarPosition === 'left' ? 'border-r' : 'border-l'
    )}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeRoute === item.route;

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.route)}
            title={item.label}
            className={cn(
              'w-full h-12 flex items-center justify-center transition-colors relative group',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <div className={cn(
                'absolute w-0.5 h-12 bg-primary',
                sidebarPosition === 'left' ? 'left-0' : 'right-0'
              )} />
            )}
            <Icon className="h-6 w-6" />
          </button>
        );
      })}
    </div>
  );
}
```

### frontend/src/components/layout/TitleBar.tsx
```typescript
import { Moon, Sun, PanelLeft, PanelRight } from 'lucide-react';
import { VscChromeMinimize, VscChromeMaximize, VscChromeClose } from 'react-icons/vsc';
import { useUIStore } from '@/stores/useUIStore';

export function TitleBar() {
  const theme = useUIStore((state) => state.uiState.theme);
  const sidebarPosition = useUIStore((state) => state.uiState.sidebarPosition);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const toggleSidebarPosition = useUIStore((state) => state.toggleSidebarPosition);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.window.maximize();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.window.close();
    }
  };

  return (
    <div
      className="h-10 bg-background border-b border-border flex items-center justify-between"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-4">
        <span className="text-sm font-semibold">Qwen Proxy</span>
      </div>

      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          className="h-full w-12 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={toggleSidebarPosition}
          title={sidebarPosition === 'left' ? 'Move sidebar to right' : 'Move sidebar to left'}
        >
          {sidebarPosition === 'left' ? (
            <PanelRight className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>

        <button
          className="h-full w-12 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>

        <button
          className="h-full w-12 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={handleMinimize}
          title="Minimize window"
        >
          <VscChromeMinimize className="h-4 w-4" />
        </button>

        <button
          className="h-full w-12 flex items-center justify-center hover:bg-accent transition-colors"
          onClick={handleMaximize}
          title="Maximize window"
        >
          <VscChromeMaximize className="h-4 w-4" />
        </button>

        <button
          className="h-full w-12 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={handleClose}
          title="Close window"
        >
          <VscChromeClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

### frontend/src/components/layout/StatusBar.tsx
```typescript
import { useUIStore } from '@/stores/useUIStore';
import { useCredentialsStore } from '@/stores/useCredentialsStore';
import { useProxyStore } from '@/stores/useProxyStore';
import { EnvironmentBadge } from '@/components/ui/environment-badge';
import { StatusBadge } from '@/components/ui/status-badge';

export function StatusBar() {
  const statusMessage = useUIStore((state) => state.statusMessage);
  const credentials = useCredentialsStore((state) => state.credentials);
  const proxyStatus = useProxyStore((state) => state.status);

  const credentialStatus = credentials
    ? credentials.isExpired
      ? 'expired'
      : 'active'
    : 'inactive';

  const isProxyRunning = proxyStatus?.qwenProxy?.running || false;

  return (
    <div className="h-6 bg-muted border-t border-border px-4 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <EnvironmentBadge />
        <div className="h-3 w-px bg-border" />
        <StatusBadge status={credentialStatus} />
        <div className="h-3 w-px bg-border" />
        <StatusBadge status={isProxyRunning ? 'running' : 'stopped'} />
      </div>
      <span className="text-muted-foreground">{statusMessage}</span>
    </div>
  );
}
```

### frontend/src/App.tsx (Updated with Routing)
```typescript
import { useState } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { QuickGuidePage } from '@/pages/QuickGuidePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ModelsPage } from '@/pages/ModelsPage';

function App() {
  useDarkMode();
  const [currentRoute, setCurrentRoute] = useState('/');

  const renderPage = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/guide':
        return <QuickGuidePage />;
      case '/providers':
        return <ProvidersPage />;
      case '/models':
        return <ModelsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <AppLayout activeRoute={currentRoute} onNavigate={setCurrentRoute}>
      {renderPage()}
    </AppLayout>
  );
}

export default App;
```

### Page Components

### frontend/src/pages/HomePage.tsx
```typescript
import { useCredentialPolling } from '@/hooks/useCredentialPolling';
import { StatusAlert } from '@/components/features/alerts/StatusAlert';
import { SystemControlCard } from '@/components/features/system/SystemControlCard';
import { ConnectionGuideCard } from '@/components/features/stats/ConnectionGuideCard';
import { ProvidersListCard } from '@/components/features/providers/ProvidersListCard';
import { ModelsListCard } from '@/components/features/models/ModelsListCard';

export function HomePage() {
  useCredentialPolling();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <StatusAlert />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SystemControlCard />

          <div className="grid md:grid-cols-2 gap-6">
            <ProvidersListCard />
            <ModelsListCard />
          </div>
        </div>

        <div className="space-y-6">
          <ConnectionGuideCard />
        </div>
      </div>
    </div>
  );
}
```

### frontend/src/pages/QuickGuidePage.tsx (Placeholder)
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function QuickGuidePage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Quick guide content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### frontend/src/pages/ProvidersPage.tsx (Placeholder)
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Blocks } from 'lucide-react';

export function ProvidersPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Blocks className="h-5 w-5" />
            Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Providers content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### frontend/src/pages/ModelsPage.tsx (Placeholder)
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';

export function ModelsPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Models content coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 8: UI Components - Input Section

### frontend/src/components/features/path-converter/PathInput.tsx
```typescript
interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
  onPaste: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function PathInput({
  value,
  onChange,
  onPaste,
  onClear,
  disabled = false,
}: PathInputProps)
```

---

## Phase 9: UI Components - Output Sections

### frontend/src/components/features/path-converter/PathOutput.tsx
```typescript
interface PathOutputProps {
  label: string; // "Windows", "WSL", "MSYS"
  value: string; // Single converted path
  onCopy: () => void;
  isCopied: boolean;
}

export function PathOutput({
  label,
  value,
  onCopy,
  isCopied,
}: PathOutputProps)
```

### frontend/src/components/features/path-converter/OutputSection.tsx
```typescript
interface OutputSectionProps {
  windowsPath: string;
  wslPath: string;
  msysPath: string;
}

export function OutputSection({
  windowsPath,
  wslPath,
  msysPath,
}: OutputSectionProps)
```

---

## Phase 10: Main Application Integration

### frontend/src/components/features/path-converter/ConverterPanel.tsx
```typescript
import { useCallback } from 'react';
import { PathInput } from './PathInput';
import { OutputSection } from './OutputSection';
import { usePathConverter } from '@/hooks/usePathConverter';
import { useClipboard } from '@/hooks/useClipboard';
import { usePathHistory } from '@/hooks/usePathHistory';

export function ConverterPanel() {
  const { inputText, conversionResult, setInputText, clearInput, isConverting } =
    usePathConverter();
  const { readFromClipboard } = useClipboard();
  const { addToHistory } = usePathHistory();

  const handlePaste = useCallback(async () => {
    const text = await readFromClipboard();
    if (text) {
      setInputText(text);
      // Assuming the pasted text is the original format, add it to history
      // A more robust solution might involve detecting format before adding
      addToHistory(text, 'unknown'); // 'unknown' as a placeholder, refine if needed
    }
  }, [readFromClipboard, setInputText, addToHistory]);

  const handleClear = useCallback(() => {
    clearInput();
  }, [clearInput]);

  return (
    <div className="p-4 space-y-4 w-full">
      <PathInput
        value={inputText}
        onChange={setInputText}
        onPaste={handlePaste}
        onClear={handleClear}
        disabled={isConverting}
      />
      <OutputSection
        windowsPath={conversionResult.windows.join('\n')}
        wslPath={conversionResult.wsl.join('\n')}
        msysPath={conversionResult.msys.join('\n')}
      />
    </div>
  );
}
```

### frontend/src/App.tsx
```typescript
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ConverterPanel } from '@/components/features/path-converter/ConverterPanel';

function App() {
  return (
    <ThemeProvider>
      <AppLayout statusMessage="Ready">
        <ConverterPanel />
      </AppLayout>
    </ThemeProvider>
  );
}

export default App;

```

---

## Phase 11: Electron IPC & Native Integration

### Electron Menu Example (electron/src/menu.ts)
```typescript
{
  label: 'File',
  submenu: [
    { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
  ]
},
{
  label: 'Edit',
  submenu: [
    { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
  ]
}
```

---

## Phase 12: Keyboard Shortcuts & Accessibility

### frontend/src/hooks/useKeyboardShortcuts.ts
```typescript
interface KeyboardShortcutHandlers {
  onPaste?: () => void;
  onClear?: () => void;
  onCopyWindows?: () => void;
  onCopyWSL?: () => void;
  onCopyMSYS?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers)
```

---

## Phase 13: Responsive Design & Polish

### AppLayout Changes
```tsx
// Before: <main className="flex-1 p-6">
// After:  <main className="flex-1 w-full overflow-auto">
```

### ConverterPanel Changes
```tsx
// Before: <div className="p-6 space-y-4">
// After:  <div className="p-4 space-y-4 w-full">

// Before:
//   grid-cols-[100px_1fr_auto] gap-4
//   <Label className="text-right">Label</Label>
// After:
//   grid-cols-[60px_1fr_auto] gap-3
//   <Label className="text-left text-xs">Label</Label>
```

---

## Phase 14: Build Configuration & Packaging

### electron-builder.json
```json
{
  "directories": {
    "output": "build",
    "buildResources": "electron/assets"
  },
  "files": [
    "frontend/dist/**/*",
    "backend/dist/**/*",
    "electron/dist/**/*",
    "electron/assets/**/*"
  ],
  "extraMetadata": {
    "main": "electron/dist/main.js"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "electron/assets/icons/win/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  },
  "mac": {
    "target": ["dmg", "zip"],
    "icon": "electron/assets/icons/mac/icon.icns",
    "category": "public.app-category.developer-tools"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "icon": "electron/assets/icons/png",
    "category": "Development"
  },
  "dmg": {
    "contents": [
      {
        "x": 130,
        "y": 220
      },
      {
        "x": 410,
        "y": 220,
        "type": "link",
        "path": "/Applications"
      }
    ]
  }
}
```

### Tray Icon Code (electron/src/main.ts)
```typescript
function createTray() {
  // Load platform-specific tray icon
  let iconPath: string;

  if (process.platform === 'darwin') {
    // macOS: Use 16x16 or 32x32 for Retina
    iconPath = path.join(__dirname, '../assets/icons/png/16x16.png');
  } else if (process.platform === 'win32') {
    // Windows: Use 16x16 or ICO file
    iconPath = path.join(__dirname, '../assets/icons/png/16x16.png');
  } else {
    // Linux: Use 16x16
    iconPath = path.join(__dirname, '../assets/icons/png/16x16.png');
  }

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('Path Converter');
  // ... rest of tray setup
}
```

---

## Phase 15: Path History & Recents

### frontend/src/types/history.types.ts
```typescript
export interface PathHistoryEntry {
  path: string;
  format: PathFormat;
  timestamp: number;
  usageCount: number;
}

export interface PathHistory {
  entries: PathHistoryEntry[];
  maxEntries: number; // Default: 50
}
```

### IPC Handlers (electron/src/main.ts)
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

let historyCache: PathHistory | null = null;

async function getHistoryFilePath(): Promise<string> {
  const userDataPath = app.getPath('userData');
  const historyDir = path.join(userDataPath, 'path-converter');
  await fs.mkdir(historyDir, { recursive: true });
  return path.join(historyDir, 'history.json');
}

ipcMain.handle('history:read', async () => {
  if (historyCache) return historyCache;

  try {
    const historyPath = await getHistoryFilePath();
    const data = await fs.readFile(historyPath, 'utf-8');
    historyCache = JSON.parse(data);
    return historyCache;
  } catch (error) {
    // File doesn't exist or is invalid, return empty history
    const defaultHistory: PathHistory = { entries: [], maxEntries: 50 };
    historyCache = defaultHistory;
    return defaultHistory;
  }
});

ipcMain.handle('history:add', async (_, entry: PathHistoryEntry) => {
  const history = await ipcMain.handle('history:read', () => {});

  // Check if path already exists
  const existingIndex = history.entries.findIndex(e => e.path === entry.path);

  if (existingIndex >= 0) {
    // Update existing entry
    history.entries[existingIndex].timestamp = entry.timestamp;
    history.entries[existingIndex].usageCount += 1;
  } else {
    // Add new entry
    history.entries.unshift(entry);

    // Trim to maxEntries
    if (history.entries.length > history.maxEntries) {
      history.entries = history.entries.slice(0, history.maxEntries);
    }
  }

  // Save to file
  const historyPath = await getHistoryFilePath();
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
  historyCache = history;

  return history;
});

ipcMain.handle('history:clear', async () => {
  const historyPath = await getHistoryFilePath();
  const defaultHistory: PathHistory = { entries: [], maxEntries: 50 };
  await fs.writeFile(historyPath, JSON.stringify(defaultHistory, null, 2));
  historyCache = defaultHistory;
  return defaultHistory;
});
```

### Preload API (electron/src/preload.ts)
```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing clipboard and window APIs
  history: {
    read: () => ipcRenderer.invoke('history:read'),
    add: (entry: PathHistoryEntry) => ipcRenderer.invoke('history:add', entry),
    clear: () => ipcRenderer.invoke('history:clear'),
  },
});
```

### frontend/src/hooks/usePathHistory.ts
```typescript
import { useState, useEffect, useCallback } from 'react';
import type { PathHistory, PathHistoryEntry } from '@/types/history.types';

export function usePathHistory() {
  const [history, setHistory] = useState<PathHistory>({ entries: [], maxEntries: 50 });
  const [isLoading, setIsLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    if (window.electronAPI?.history) {
      try {
        const data = await window.electronAPI.history.read();
        setHistory(data);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Fallback to localStorage for web
      const stored = localStorage.getItem('pathHistory');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
      setIsLoading(false);
    }
  }, []);

  const addToHistory = useCallback(async (path: string, format: PathFormat) => {
    const entry: PathHistoryEntry = {
      path,
      format,
      timestamp: Date.now(),
      usageCount: 1,
    };

    if (window.electronAPI?.history) {
      const updated = await window.electronAPI.history.add(entry);
      setHistory(updated);
    } else {
      // Fallback to localStorage
      const updated = { ...history };
      const existingIndex = updated.entries.findIndex(e => e.path === path);

      if (existingIndex >= 0) {
        updated.entries[existingIndex].timestamp = entry.timestamp;
        updated.entries[existingIndex].usageCount += 1;
      } else {
        updated.entries.unshift(entry);
        if (updated.entries.length > updated.maxEntries) {
          updated.entries = updated.entries.slice(0, updated.maxEntries);
        }
      }

      setHistory(updated);
      localStorage.setItem('pathHistory', JSON.stringify(updated));
    }
  }, [history]);

  const clearHistory = useCallback(async () => {
    if (window.electronAPI?.history) {
      const cleared = await window.electronAPI.history.clear();
      setHistory(cleared);
    } else {
      const cleared = { entries: [], maxEntries: 50 };
      setHistory(cleared);
      localStorage.removeItem('pathHistory');
    }
  }, []);

  return {
    history,
    isLoading,
    addToHistory,
    clearHistory,
  };
}
```

---

## Phase 16: System Tray Icon Integration

### electron/src/main.ts (Tray Implementation)
```typescript
import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;

function createTray() {
  // Load tray icon (platform-specific)
  const iconPath = process.platform === 'darwin'
    ? path.join(__dirname, '../../build/tray-icon-Template.png')
    : path.join(__dirname, '../../build/tray-icon.png');

  const icon = nativeImage.createFromPath(iconPath);

  // Create tray
  tray = new Tray(icon);

  // Set tooltip
  tray.setToolTip('Click to show/hide');

  // Build context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Hide Window',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Convert from Clipboard',
      click: async () => {
        // Quick convert: read clipboard, convert, write back
        // This could show a notification with the result
        const { clipboard } = require('electron');
        const text = clipboard.readText();
        // Conversion logic here...
        // Show notification with result
      }
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      click: () => {
        // Open preferences window (future feature)
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Click handler (left-click on tray icon)
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Right-click shows context menu (Windows/Linux)
  tray.on('right-click', () => {
    tray?.popUpContextMenu(contextMenu);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    show: false, // Don't show immediately, wait for ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Minimize to tray instead of taskbar (optional)
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  // Hide to tray on close (don't quit app)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../frontend/dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  // Keep app running in tray even when window is closed
  // Only quit on macOS when explicitly requested
  if (process.platform === 'darwin') {
    // macOS apps typically stay open
  }
});
```
