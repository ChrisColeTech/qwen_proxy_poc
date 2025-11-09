# Electron App Rewrite Implementation Plan

## Work Progression Tracking

| Phase | Description | Status | Priority |
|-------|-------------|--------|----------|
| Phase 1 | Project Setup and Configuration | Not Started | 1 |
| Phase 2 | Main Process: Basic Window Management | Not Started | 2 |
| Phase 3 | Main Process: System Tray and App Lifecycle | Not Started | 3 |
| Phase 4 | Main Process: IPC Handlers for Window Controls | Not Started | 4 |
| Phase 5 | Main Process: Qwen Authentication Integration | Not Started | 5 |
| Phase 6 | Main Process: Settings and Storage Management | Not Started | 6 |
| Phase 7 | Main Process: History Management | Not Started | 7 |
| Phase 8 | Main Process: Clipboard Operations | Not Started | 8 |
| Phase 9 | Preload Script: API Exposure | Not Started | 9 |
| Phase 10 | Build Configuration and Packaging | Not Started | 10 |
| Phase 11 | Integration Testing and Validation | Not Started | 11 |

## Overview
This implementation plan outlines the rewrite of the Electron application for the Qwen Proxy POC project. The current Electron app provides a desktop wrapper for the frontend, handles system tray functionality, manages Qwen authentication via cookie extraction, exposes IPC for settings/history/clipboard, and integrates with the backend at `http://localhost:3002`. 

The rewrite aims to:
- Modernize the structure for better maintainability (e.g., modular IPC handlers).
- Enhance security (e.g., stricter context isolation, improved cookie handling).
- Improve integration with the frontend (Vite-based) and backend.
- Add error handling and logging.
- Ensure cross-platform compatibility (macOS, Windows, Linux).

The new structure will maintain the existing `electron/` directory but introduce subdirectories for better organization: `src/main/`, `src/preload/`, `src/handlers/`, and `src/types/`. Icons and assets remain unchanged.

No timelines are included; phases are ordered by dependency and priority.

## New File and Folder Structure
```
electron/
├── package.json                  # Updated with new dependencies and scripts
├── tsconfig.json                 # Enhanced for stricter typing and modules
├── electron-builder.json         # New: Packaging configuration (moved from root if exists)
├── assets/                       # Unchanged: Icons for cross-platform
│   ├── icons/
│   │   ├── mac/
│   │   │   ├── icon.icns
│   │   │   └── icon.iconset/
│   │   │       ├── icon_16x16.png
│   │   │       ├── icon_16x16@2x.png
│   │   │       ├── icon_32x32.png
│   │   │       ├── icon_32x32@2x.png
│   │   │       ├── icon_128x128.png
│   │   │       ├── icon_128x128@2x.png
│   │   │       ├── icon_256x256.png
│   │   │       ├── icon_256x256@2x.png
│   │   │       ├── icon_512x512.png
│   │   │       └── icon_512x512@2x.png
│   │   ├── png/
│   │   │   ├── 16x16.png
│   │   │   ├── 32x32.png
│   │   │   ├── 48x48.png
│   │   │   ├── 64x64.png
│   │   │   ├── 128x128.png
│   │   │   ├── 256x256.png
│   │   │   ├── 512x512.png
│   │   │   └── 1024x1024.png
│   │   └── win/
│   │       └── icon.ico
├── src/
│   ├── main/
│   │   ├── index.ts              # Entry point: App lifecycle, window/tray creation
│   │   ├── windowManager.ts      # Window creation, events, controls
│   │   └── trayManager.ts        # System tray setup and menu
│   ├── handlers/
│   │   ├── ipcHandlers.ts        # All IPC event/invoke handlers (window, app, etc.)
│   │   ├── qwenAuthHandler.ts    # Qwen login and credential extraction
│   │   ├── settingsHandler.ts    # electron-store integration
│   │   └── historyHandler.ts     # File-based history management
│   ├── preload/
│   │   └── index.ts              # Expose electronAPI to renderer
│   └── types/
│       └── index.ts              # Shared TypeScript interfaces (e.g., Credentials, HistoryEntry)
└── dist/                         # Build output (generated)
    ├── main.js
    └── preload.js
```

## Phase 1: Project Setup and Configuration
**Description**: Initialize the Electron project structure, update dependencies, and configure TypeScript/build tools. This establishes the foundation for modular code.

**Files Created/Modified**:
- `electron/package.json`: Add/update dependencies (e.g., `@electron-forge/cli`, `electron-builder` for packaging; update `electron` to latest stable; add `concurrently` for dev scripts). Update scripts: `dev` to use `electron-forge` or similar; add `build` and `package`.
- `electron/tsconfig.json`: Enhance with stricter options (e.g., `noImplicitAny: true`, `strictNullChecks: true`); add paths for modular imports.
- `electron/electron-builder.json`: New file for cross-platform packaging (icons, files, protocols).
- `electron/src/types/index.ts`: New: Define core types (e.g., `interface Credentials { token: string; cookies: string; expiresAt: number; }`, `interface HistoryEntry { path: string; timestamp: number; usageCount: number; }`).

**Integration Points**:
- Root `electron-builder.json` (if exists): Reference for global build config.
- `frontend/dist/index.html`: Loaded in production (no changes).
- Backend at `http://localhost:3002` (no direct integration yet).

## Phase 2: Main Process: Basic Window Management
**Description**: Implement core window creation, loading (dev/prod), and basic events (close, maximize). Ensure frameless window with custom titlebar support.

**Files Created/Modified**:
- `electron/src/main/index.ts`: New: App entry; import and initialize window/tray managers; handle `app.whenReady()`.
- `electron/src/main/windowManager.ts`: New: `createMainWindow()` function; handle dev (`http://localhost:5173`) vs prod loading; events for close (hide to tray), maximize/unmaximize (IPC emit).

**Integration Points**:
- `electron/src/preload/index.ts` (to be created): Preload script path in webPreferences.
- Assets icons (unchanged): Platform-specific icon loading.
- Frontend Vite server (dev mode, no changes).

## Phase 3: Main Process: System Tray and App Lifecycle
**Description**: Add system tray with context menu (Show/Quit); handle app events (activate, before-quit, window-all-closed) to persist in tray.

**Files Created/Modified**:
- `electron/src/main/trayManager.ts`: New: `createTray()`; platform-specific icons; menu with show/quit; click to toggle visibility.
- `electron/src/main/index.ts`: Modified: Call `createTray()` in `whenReady`; handle app events (e.g., `isQuitting` flag).

**Integration Points**:
- `electron/src/main/windowManager.ts` (used for show/focus).
- Assets icons (unchanged): Tray icon paths.

## Phase 4: Main Process: IPC Handlers for Window Controls
**Description**: Implement IPC for window operations (minimize, maximize, close, isMaximized). Centralize in handlers module.

**Files Created/Modified**:
- `electron/src/handlers/ipcHandlers.ts`: New: Event listeners for `window:minimize`, `window:maximize`, `window:close`; invoke for `window:is-maximized`.
- `electron/src/main/index.ts`: Modified: Register IPC handlers.

**Integration Points**:
- `electron/src/main/windowManager.ts` (used for actual window ops).
- Preload (to be created): Exposes these to renderer.

## Phase 5: Main Process: Qwen Authentication Integration
**Description**: Rewrite Qwen login window opening, script injection for detection, credential extraction (cookies, JWT decode), and backend POST. Split into focused handler.

**Files Created/Modified**:
- `electron/src/handlers/qwenAuthHandler.ts`: New: `openLogin()` (create window, inject monitor script, listen for title signal, extract/send credentials); `extractCredentials()` (direct cookie get/decode).
- `electron/src/main/index.ts`: Modified: Register `qwen:open-login` and `qwen:extract-credentials` invokes.
- `electron/src/types/index.ts`: Modified: Ensure `Credentials` type.

**Integration Points**:
- Backend `/api/qwen/credentials` endpoint (POST, no changes).
- `session.defaultSession.cookies` (Electron API, no changes).
- Docs/48-QWEN_LOGIN_FLOW_GUIDE.md (reference for logic, no changes).

## Phase 6: Main Process: Settings and Storage Management
**Description**: Integrate `electron-store` for UI state (theme, sidebar); add get/set/delete/clear IPC.

**Files Created/Modified**:
- `electron/src/handlers/settingsHandler.ts`: New: Initialize store; IPC invokes for get/set/delete/clear.
- `electron/src/main/index.ts`: Modified: Register settings IPC.
- `electron/package.json`: Modified: Ensure `electron-store` dependency.

**Integration Points**:
- Frontend components (e.g., theme provider uses via IPC, no direct changes).
- Store defaults (uiState: { theme: 'dark', sidebarPosition: 'left' }, unchanged).

## Phase 7: Main Process: History Management
**Description**: File-based history (JSON in userData); IPC for read/add/clear with caching and trimming.

**Files Created/Modified**:
- `electron/src/handlers/historyHandler.ts`: New: `getHistoryFilePath()`; read (cache/load), add (update/trim/save), clear.
- `electron/src/main/index.ts`: Modified: Register history IPC.
- `electron/src/types/index.ts`: Modified: Ensure `HistoryEntry` type.

**Integration Points**:
- `fs/promises` and `path` (Node APIs, no changes).
- Frontend path-converter UI (uses history via IPC, no changes).

## Phase 8: Main Process: Clipboard Operations
**Description**: Simple IPC for read/write text.

**Files Created/Modified**:
- `electron/src/handlers/ipcHandlers.ts`: Modified: Add `clipboard:read` and `clipboard:write` invokes.
- `electron/src/main/index.ts`: Modified: Register clipboard IPC.

**Integration Points**:
- `clipboard` module (Electron API, no changes).
- Frontend components (e.g., copy buttons, no changes).

## Phase 9: Preload Script: API Exposure
**Description**: Expose modular `electronAPI` object to renderer with all handlers (qwen, clipboard, app, window, history, settings).

**Files Created/Modified**:
- `electron/src/preload/index.ts`: New: `contextBridge.exposeInMainWorld('electronAPI', { ... })`; nest APIs (e.g., `qwen: { openLogin, extractCredentials }`).

**Integration Points**:
- All handlers (imported and wrapped in async invokes/sends).
- Frontend renderer (uses `window.electronAPI`, no changes).

## Phase 10: Build Configuration and Packaging
**Description**: Configure building (TypeScript to JS), dev/prod modes, and packaging for distribution.

**Files Created/Modified**:
- `electron/package.json`: Modified: Update build script (e.g., `tsc && electron-builder`); add `postinstall` if needed.
- `electron/electron-builder.json`: Modified: Define build targets (dmg for macOS, exe for Windows, AppImage for Linux); include frontend dist, icons, protocols.
- `electron/tsconfig.json`: Modified: Ensure outDir `./dist`, rootDir `./src`.

**Integration Points**:
- Root build scripts (if any, e.g., concurrent frontend/backend build).
- Frontend `dist/` (included in package).

## Phase 11: Integration Testing and Validation
**Description**: Test full app flow: Launch, tray, Qwen auth, settings/history, window controls. Validate cross-platform.

**Files Created/Modified**:
- None (testing phase; add test scripts if needed in package.json).

**Integration Points**:
- Full stack: Frontend (Vite dev/prod), backend (localhost:3002), Electron (dev/build).
- Docs (e.g., 31-ELECTRON_FRONTEND_REBUILD_IMPLEMENTATION_PLAN.md for validation steps, no changes).