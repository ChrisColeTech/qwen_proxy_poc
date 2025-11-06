**Goal:** Implement Electron main process with window management, IPC handlers, system tray, and Qwen credential extraction.

## Files to Create:
- `electron/src/main.ts`

## Files to Modify:
- None

## Integration Points:
- Electron BrowserWindow API
- Electron IPC API (ipcMain)
- Electron Session API for cookie management
- Electron Tray API for system tray
- File system (fs/promises) for history persistence
- Frontend via IPC (contextBridge)

## Tasks:

1. **Create main.ts** with comprehensive Electron setup
   - Implement **Window Management**:
     - Frameless window (frame: false)
     - Dimensions: 900x660, minWidth: 700, minHeight: 550
     - Platform-specific icons (ICO for Windows, ICNS for macOS, PNG for Linux)
     - Maximize/unmaximize events sent to renderer
     - Loads frontend (dev: localhost:5173, prod: dist/index.html)
     - **Note**: System tray integration is in Phase 10

   - Implement **Qwen Credential Extraction**:
     - `qwen:open-login` - Opens Qwen login window (1200x800)
     - `qwen:extract-credentials` - Extracts token and cookies from session
     - Cookie parsing and JWT token decoding
     - Expiration date extraction from JWT or cookie metadata
     - Returns: { token, cookies, expiresAt }

   - Implement **Window Control IPC Handlers**:
     - `window:minimize` - Hide to tray
     - `window:maximize` - Toggle maximize/unmaximize
     - `window:is-maximized` - Query maximized state
     - `window:close` - Close window

   - Implement **Clipboard IPC Handlers**:
     - `clipboard:read` - Read text from clipboard
     - `clipboard:write` - Write text to clipboard

   - Implement **History Management IPC Handlers**:
     - `history:read` - Load history from userData/path-converter/history.json
     - `history:add` - Add or update history entry
     - `history:clear` - Clear all history
     - In-memory caching for performance

   - Implement **App Controls**:
     - `app:quit` - Quit application

2. **No electron-store needed**
   - History is managed with native fs/promises module
   - Stored in app.getPath('userData')/path-converter/history.json

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

- **Dev mode loads wrong URL**
  - Ensure process.env.NODE_ENV === 'development' check is correct
  - Verify frontend dev server runs on localhost:5173

- **Production mode can't find index.html**
  - Path should be: `path.join(__dirname, '../../frontend/dist/index.html')`
  - Verify frontend/dist exists after build

- **Qwen credential extraction fails**
  - User must be logged in to chat.qwen.ai first
  - Cookies are stored in Electron's session (persistent)
  - Check for 'token' or 'bx-umidtoken' cookies
  - JWT decoding may fail if token format changes

- **History not persisting**
  - Check userData path: `app.getPath('userData')`
  - Ensure directory is created: `fs.mkdir(historyDir, { recursive: true })`
  - Verify JSON serialization doesn't fail

## Validation:

- [x] Window opens with correct dimensions (900x660)
- [x] Frameless window (no native title bar)
- [x] Loads frontend in dev mode (localhost:5173)
- [x] Loads frontend in production mode (dist/index.html)
- [x] Qwen login window opens (1200x800)
- [x] Credentials extraction works after login
- [x] Clipboard read/write works
- [x] History persistence works
- [x] Window maximize/unmaximize events trigger
- [x] All IPC handlers respond correctly
- [ ] System tray functionality (tested in Phase 10)

## Structure After Phase 6:

```
electron/
├── src/
│   └── main.ts
├── dist/
│   └── main.js (compiled)