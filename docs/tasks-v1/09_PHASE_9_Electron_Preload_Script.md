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

1. **Create preload.ts** with comprehensive contextBridge API
   - See `docs/v1/03_CODE_EXAMPLES.md` → Electron section
   - Implements **Qwen API**:
     - `qwen.openLogin()` - Open Qwen login window
     - `qwen.extractCredentials()` - Extract credentials from session
     - Returns: Promise<{ token, cookies, expiresAt }>

   - Implements **Clipboard API**:
     - `clipboard.readText()` - Read from clipboard
     - `clipboard.writeText(text)` - Write to clipboard
     - All async with Promise returns

   - Implements **App Controls API**:
     - `app.quit()` - Quit application
     - Uses ipcRenderer.send (fire-and-forget)

   - Implements **Window Controls API**:
     - `window.minimize()` - Hide window to tray
     - `window.maximize()` - Toggle maximize/unmaximize
     - `window.close()` - Close window
     - `window.isMaximized()` - Query maximized state (async)
     - `window.onMaximize(callback)` - Listen for maximize events
     - `window.onUnmaximize(callback)` - Listen for unmaximize events

   - Implements **History API**:
     - `history.read()` - Load history from file
     - `history.add(entry)` - Add/update history entry
     - `history.clear()` - Clear all history
     - All async with Promise returns

   - **Security**:
     - Uses contextBridge.exposeInMainWorld for secure exposure
     - Context isolation enabled
     - No direct access to Node.js or Electron APIs
     - All communication through IPC only

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

- [x] window.electronAPI exists in renderer (check dev tools console)
- [x] Qwen login window opens on openLogin()
- [x] Credentials extraction works after login
- [x] Clipboard read/write works
- [x] Window controls work (minimize, maximize, close)
- [x] Window maximize events trigger callbacks
- [x] History persistence works (read, add, clear)
- [x] App quit works
- [x] No security warnings (contextIsolation enabled)
- [x] TypeScript autocomplete works for all methods

## Structure After Phase 7:

```
electron/
├── src/
│   ├── main.ts
│   └── preload.ts
├── dist/
│   ├── main.js
│   └── preload.js (compiled)