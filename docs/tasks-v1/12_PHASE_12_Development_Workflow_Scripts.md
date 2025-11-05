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

1. **Verify root package.json has correct dev scripts**
   - See `docs/v1/03_CODE_EXAMPLES.md` → Phase 10 → Root package.json
   - Should have:
     - `dev`: Run frontend and Electron concurrently
     - `build`: Build both workspaces
     - `start`: Start Electron (production mode)
   - Scripts already added in Phase 1

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

- [x] `npm run dev` starts both processes
- [x] Frontend HMR works
- [x] Electron loads frontend correctly
- [x] `npm run build` builds both workspaces
- [x] `npm run start` runs production mode
- [x] Color-coded output (blue for frontend, green for Electron)

## Structure After Phase 10:

- No new files (package.json scripts verified)