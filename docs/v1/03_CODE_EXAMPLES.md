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

## Phase 7: UI Components - Base Layout

### frontend/src/components/layout/AppLayout.tsx
```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  statusMessage?: string;
}

export function AppLayout({ children, statusMessage }: AppLayoutProps)
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
