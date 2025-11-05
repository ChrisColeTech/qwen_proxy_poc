**Goal:** Implement Electron main process with window management and IPC handlers.

## Files to Create:
- `electron/src/main.ts`

## Files to Modify:
- None

## Integration Points:
- Electron BrowserWindow API
- Electron IPC API
- electron-store for history persistence
- Frontend via IPC

## Tasks:

1. **Create main.ts** with Electron setup
   - Implement:
     - Frameless window 
     - Window configuration (width: 800, minWidth: 600, frame: false)
     - Loads frontend (dev: localhost:5173, prod: dist/index.html)
     - IPC handlers for clipboard, history, window controls
     - Minimize/close to tray behavior

2. **Install electron-store** (if not done in Initial Setup)
   ```bash
   cd electron
   npm install electron-store@^8.2.0
   cd ..
   ```

3. **Test Electron app** (requires Phase 7 preload first)
   ```bash
   # Build frontend first
   cd frontend
   npm run build
   cd ..

   # Build electron
   cd electron
   npm run build
   cd ..

   # Start electron
   npm run start
   ```

4. **Verify window configuration**
   - Should have no native title bar - mac and windows (frameless)

## Common Issues & Fixes:

- **Error: Cannot find module 'electron-store'**
  - Install electron-store v8.2.0 (CommonJS compatible)
  - Newer versions use ESM which doesn't work with Electron main process


- **Dev mode loads wrong URL**
  - Ensure process.env.NODE_ENV === 'development' check is correct
  - Verify frontend dev server runs on localhost:5173

- **Production mode can't find index.html**
  - Path should be: `path.join(__dirname, '../../frontend/dist/index.html')`
  - Verify frontend/dist exists after build

## Validation:

- [x] Window opens with correct dimensions
- [x] Frameless window (no native title bar)
- [x] Loads frontend in dev mode
- [x] Loads frontend in production mode
- [x] IPC handlers registered (test in Phase 7)

## Structure After Phase 6:

```
electron/
├── src/
│   └── main.ts
├── dist/
│   └── main.js (compiled)