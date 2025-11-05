**Goal:** Add system tray icon with show/hide and quit functionality.

## Files to Create:
- None (modify main.ts)

## Files to Modify:
- `electron/src/main.ts`

## Integration Points:
- Electron Tray API
- Electron Menu API
- BrowserWindow show/hide methods
- Tray icon assets (will be added in Phase 9)

## Tasks:

1. **Update main.ts with tray functionality**
   - Add tray implementation:
     - `createTray()` function
     - Platform-specific icon loading
     - Tray context menu
     - Click to show/hide window
     - Lifecycle updates (isQuitting flag)

2. **Update window event handlers**
   - Minimize to tray instead of taskbar
   - Close to tray (don't quit app)
   - before-quit sets isQuitting flag
   - window-all-closed doesn't quit (keep in tray)

3. **Test tray functionality** (requires icon from Phase 9)
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
  - Check `path.join(__dirname, '../assets/icons/png/16x16.png')`
  - Icon file must exist (added in Phase 19)

- **App quits when window closed**
  - Ensure isQuitting flag is checked in close handler
  - before-quit must set isQuitting = true
  - Already implemented correctly

- **Tray icon wrong size/blurry**
  - Use 16x16 PNG for all platforms
  - macOS can use Template.png for dark mode
  - Ensure icon is actual 16x16 pixels (not scaled)

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