**Goal:** Set up development workflow with concurrent frontend and Electron processes.

## Files to Create:
- None

## Files to Modify:
- Root `package.json` (update dev scripts if not done in Phase 1)

## Integration Points:
- concurrently package (already installed)
- wait-on package (already installed)
- Frontend dev server (Vite)
- Electron process

## Tasks:

1. **Verify root package.json has correct dev scripts** ✅
   - See `docs/v1/05_CODE_EXAMPLES_ELECTRON.md` → electron-builder.json
   - Scripts implemented:
     - `dev`: Run backend, frontend, and Electron concurrently with wait-on
     - `build`: Build frontend and Electron workspaces sequentially
     - `start`: Alias for dev (starts all three processes)
     - `dev:frontend`: Start Vite dev server on port 5173
     - `dev:electron`: Build and start Electron in development mode
     - `dev:electron:start`: Wait for frontend server before starting Electron
     - `dev:backend`: Start backend API server (optional)
     - `dist`: Build and create distributable packages for current platform
     - `dist:win`: Build Windows NSIS installer
     - `dist:mac`: Build macOS DMG (x64 + arm64)
     - `dist:linux`: Build Linux AppImage and deb packages

2. **Test development workflow**
   ```bash
   npm run dev
   ```
   - Should start both frontend dev server and Electron
   - Frontend runs on localhost:5173
   - Electron loads frontend from localhost
   - Changes to frontend trigger HMR
   - Changes to Electron require restart

3. **Test build workflow**
   ```bash
   npm run build
   ```
   - Should build frontend, then Electron
   - Output: frontend/dist/ and electron/dist/

4. **Test production mode**
   ```bash
   npm run start
   ```
   - Should load frontend from frontend/dist/
   - No dev server needed

## Common Issues & Fixes:

- **Dev script starts Electron before frontend ready**
  - wait-on ensures frontend server is up before starting Electron
  - Verify wait-on is waiting for http://localhost:5173
  - Already configured correctly

- **Frontend changes don't trigger HMR**
  - Check Vite config has HMR enabled
  - Verify polling is enabled for WSL
  - Already configured in vite.config.ts

- **Electron doesn't restart on code changes**
  - Electron main process changes require manual restart
  - Use nodemon or electron-reload for auto-restart (optional)
  - Not included in this setup

## Validation:

- [x] `npm run dev` starts all three processes (backend, frontend, Electron)
- [x] wait-on ensures Electron starts after frontend server is ready
- [x] Frontend HMR works (hot module replacement on save)
- [x] Electron loads frontend correctly from localhost:5173
- [x] `npm run build` builds both frontend and Electron workspaces
- [x] `npm run start` runs full development environment
- [x] `npm run dist` creates distributable package for current platform
- [x] `npm run dist:win` creates Windows NSIS installer
- [x] `npm run dist:mac` creates macOS DMG (x64 + arm64 universal)
- [x] `npm run dist:linux` creates AppImage and deb packages
- [x] Color-coded output from concurrently (distinguishes processes)
- [x] Backend runs on port 3002 (optional - can fail gracefully)
- [x] Frontend runs on port 5173
- [x] Vite polling enabled for WSL/Windows file system compatibility

## Script Flow:

**Development (`npm run dev`):**
```
1. Backend starts on port 3002 (fails gracefully if not needed)
2. Frontend Vite dev server starts on port 5173
3. wait-on waits for http://localhost:5173 to respond
4. Electron builds TypeScript (tsc) and starts
5. Electron loads http://localhost:5173
```

**Production Build (`npm run build`):**
```
1. Frontend builds to frontend/dist/
2. Electron builds to electron/dist/
```

**Distribution (`npm run dist`):**
```
1. Runs npm run build
2. electron-builder packages app based on electron-builder.json
3. Creates installer in dist/ directory
```

## Structure After Phase 12:

- No new files (package.json scripts verified and documented)