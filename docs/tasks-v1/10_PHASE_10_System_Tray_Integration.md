**Goal:** Add system tray icon with show/hide, quit functionality, and platform-specific icons.

## Files to Create:
- None (tray implementation is integrated into main.ts from Phase 8)

## Files to Modify:
- None (already implemented in `electron/src/main.ts`)

## Integration Points:
- Electron Tray API
- Electron Menu API
- Electron nativeImage for cross-platform icons
- BrowserWindow show/hide/focus methods
- Tray icon assets (platform-specific)

## Implementation (Already Complete in Phase 8)

The system tray is **already implemented** in `electron/src/main.ts`. This phase documents what was built:

1. **createTray() function** - Called in app.whenReady()
   - **Platform-specific icon paths**:
     - macOS: 16x16.png (small tray icon)
     - Windows: icon.ico (ICO format preferred)
     - Linux: 32x32.png (standard tray size)
   - **Context menu** with Menu.buildFromTemplate:
     - "Show" - Shows and focuses main window
     - "Quit" - Sets isQuitting flag and quits app
   - **Tooltip**: "Qwen Proxy POC"
   - **Click handler**: Toggles window visibility (show/hide)
   - **Right-click**: Shows context menu (Windows/Linux)

2. **Window lifecycle integration**
   - **close event**: preventDefault() and hide window (unless isQuitting)
   - **before-quit event**: Sets isQuitting = true
   - **window-all-closed event**: Logs but doesn't quit (stays in tray)
   - **isQuitting flag**: Prevents hide-to-tray during actual quit

3. **Test tray functionality**
   ```bash
   npm run build
   npm run start

   # Test:
   # - Click tray icon to show/hide
   # - Right-click for context menu
   # - Minimize window → should hide to tray
   # - Close window → should hide to tray
   # - Quit from tray menu → should exit
   ```

## Common Issues & Fixes:

- **Tray icon not appearing**
  - Icon path must be correct relative to compiled main.js
  - Paths: `path.join(__dirname, '../assets/icons/...')`
  - Icon files must exist in electron/assets/icons/ directory
  - Verify icon file extensions (ICO for Windows, PNG for others)

- **App quits when window closed instead of hiding**
  - Check isQuitting flag is set to false initially
  - Verify close event handler calls event.preventDefault()
  - Ensure before-quit sets isQuitting = true
  - ✅ Already implemented correctly in main.ts

- **Tray icon wrong size/blurry**
  - macOS: Use 16x16 PNG (doubles for retina automatically)
  - Windows: Use ICO format with multiple sizes embedded
  - Linux: Use 32x32 or 48x48 PNG
  - Don't scale icons - use actual pixel dimensions

- **Tray menu doesn't appear on Windows**
  - Windows shows menu on right-click, not left-click
  - Tray.on('right-click') may be needed for explicit handling
  - ✅ Context menu is set globally with setContextMenu()

- **App doesn't quit from tray menu**
  - Ensure "Quit" menu item calls app.quit()
  - isQuitting flag must be set before quit
  - ✅ Implemented correctly with isQuitting = true in handler

## Validation:

- [x] Tray icon appears in system tray
- [x] Click toggles window visibility
- [x] Right-click shows context menu
- [x] Minimize hides to tray
- [x] Close hides to tray
- [x] Quit from tray exits app
- [x] App stays running when window closed

## Structure After Phase 8:

- No new files (main.ts updated with tray code)