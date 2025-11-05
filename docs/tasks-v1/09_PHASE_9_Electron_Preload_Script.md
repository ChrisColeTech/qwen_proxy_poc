**Goal:** Set up secure IPC bridge between Electron and renderer process.

## Files to Create:
- `electron/src/preload.ts`

## Files to Modify:
- None

## Integration Points:
- Electron contextBridge API
- Electron ipcRenderer API
- Frontend via `window.electronAPI`

## Tasks:

1. **Create preload.ts** with contextBridge
   - See `docs/v1/03_CODE_EXAMPLES.md` → Phase 7 → preload.ts
   - Copy complete file content
   - Implements:
     - Exposes `electronAPI` on window object
     - Clipboard methods (readText, writeText)
     - Window controls (minimize, maximize, close)
     - App controls (quit)
     - History methods (read, add, clear)
   - Uses contextBridge for security
   - Uses ipcRenderer.invoke for async, .send for sync

2. **Verify preload path in main.ts**
   ```typescript
   webPreferences: {
     preload: path.join(__dirname, 'preload.js'),  // Note: .js not .ts
     contextIsolation: true,
     nodeIntegration: false,
   }
   ```

3. **Test IPC communication**
   ```bash
   # Build and run
   npm run build
   npm run start

   # In Electron dev tools console:
   window.electronAPI.clipboard.readText()
   ```

4. **Test all IPC methods**
   - Clipboard read/write
   - Window controls (minimize, maximize, close)
   - History operations

## Common Issues & Fixes:

- **window.electronAPI is undefined**
  - Verify preload script is specified in main.ts
  - Check contextIsolation: true is set
  - Ensure preload.ts is compiled to preload.js

- **IPC handler not found errors**
  - Verify IPC channel names match between main.ts and preload.ts
  - Check that ipcMain.handle is called before window loads

- **TypeScript errors in renderer**
  - Add global Window extension in electron.types.ts
  - Already implemented in Phase 2

## Validation:

- [x] window.electronAPI exists in renderer
- [x] Clipboard read/write works
- [x] Window controls work (minimize, maximize, close)
- [x] History persistence works via electron-store
- [x] No security warnings (contextIsolation works)

## Structure After Phase 7:

```
electron/
├── src/
│   ├── main.ts
│   └── preload.ts
├── dist/
│   ├── main.js
│   └── preload.js (compiled)