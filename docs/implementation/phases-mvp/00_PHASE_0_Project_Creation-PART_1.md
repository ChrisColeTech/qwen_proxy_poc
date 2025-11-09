

**Goal:** Configure the monorepo root workspace with npm workspaces, development scripts, and build tools.

## Step 1: Initialize Root Workspace

```bash
# In project root directory
npm init -y
```

## Step 2: Configure Root package.json

Update the root `package.json` with the following configuration:

```json
{
  "name": "root",
  "version": "1.0.0",
  "private": true,
  "author": "Your Name",
  "scripts": {
    "dev": "start-server-and-test \"npm run dev:frontend\" http://localhost:5173 \"npm run dev:electron:start\"",
    "build": "npm run build --workspace=frontend && npm run build --workspace=electron",
    "start": "npm run dev",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:electron": "npm run dev --workspace=electron",
    "dev:electron:start": "wait-on http://localhost:5173 && npm run dev --workspace=electron",
    "dev:backend": "npm run dev -w backend || true",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux"
  },
  "devDependencies": {
    "@types/electron": "^1.4.38",
    "concurrently": "^9.2.1",
    "electron-builder": "^26.0.12",
    "start-server-and-test": "^2.1.2",
    "wait-on": "^8.0.5"
  },
  "workspaces": [
    "frontend",
    "electron",
    "backend"
  ]
}
```

## Step 3: Install Root Development Dependencies

```bash
# Install development dependencies at root level
npm install -D "concurrently@^9.1.2" "wait-on@^8.0.1" "start-server-and-test@^2.1.2"
```


```bash
# Create electron directory and src folder
mkdir -p electron/src
```

## Step 2: Create electron/package.json

Create `electron/package.json` manually with the following content:

```json
{
  "name": "electron",
  "version": "1.0.0",
  "description": "Electron main process",
  "main": "dist/main.js",
  "scripts": {
    "dev": "tsc && electron .",
    "build": "tsc"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "electron": "^27.0.0",
    "typescript": "^5.3.0"
  },
  "dependencies": {
    "electron-store": "^8.2.0"
  }
}
```

**NOTE:** electron-store@^8.2.0 is included in the package.json dependencies for persistent storage.

## Step 3: Create electron/tsconfig.json

Create `electron/tsconfig.json` with the following content:

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

## Step 4: Install Electron Dependencies

```bash
# Navigate to electron and install dependencies
cd electron
npm install
cd ..
```

## Step 5: Install Additional Electron Development Dependencies

```bash
# Install additional dependencies for Electron (from root)
npm install -D "@types/electron" "electron-builder" "@types/node"
```

## Validation

- [x] `electron/` directory created
- [x] `electron/src/` directory created
- [x] `electron/package.json` created with correct configuration
- [x] `electron/tsconfig.json` created with correct configuration
- [x] Dependencies installed successfully
- [x] electron-store@^8.2.0 included in dependencies
- [x] `npm run build` executed successfully with no errors or warnings

# Electron App Rewrite Implementation Plan

## Work Progression Tracking

| Phase | Status | Priority | Description |
|-------|--------|----------|-------------|
| 1. Project Structure & Setup | ⏳ Pending | High | Establish modular project structure, update dependencies, and configure build system |
| 2. Core Application Framework | ⏳ Pending | High | Implement main process architecture with window management and tray functionality |
| 3. IPC Communication Layer | ⏳ Pending | High | Create secure IPC handlers and preload script with proper API exposure |
| 4. Qwen Authentication System | ⏳ Pending | High | Rewrite login detection using modern navigation-based approach (as shown in current main.ts) |
| 5. Data Management & Persistence | ⏳ Pending | Medium | Implement settings store and history management with improved error handling |
| 6. Build System & Packaging | ⏳ Pending | Medium | Configure electron-builder and ensure cross-platform compatibility |
| 7. Testing & Quality Assurance | ⏳ Pending | Low | Add unit tests, integration tests, and CI/CD pipeline |

## Phase 1: Project Structure & Setup

**Goal**: Establish a clean, modular project structure with updated dependencies and proper TypeScript configuration.

**Files to Modify:**
- `electron/package.json` - Update dependencies to latest versions, add dev dependencies for testing
- `electron/tsconfig.json` - Add path mapping for cleaner imports
- `electron-builder.json` - Update build configuration for new structure
- `electron/src/main.ts` - Refactor into modular structure with separate files for window management, tray functionality, and preload script
- `electron/src/preload.ts` - Update to use new modular IPC structure

**Integration Points:**
- Root `package.json` - Update workspace scripts for new electron structure
- `electron/dist/` - Ensure built electron code is properly packaged

**File/Folder Tree:**
```
electron/
├── src/
│   ├── main.ts                    # Refactored main process
│   └── preload.ts                 # Updated preload script
├── assets/                        # Icons and resources
├── dist/                          # Build output
├── package.json                   # Updated dependencies
├── tsconfig.json                  # Enhanced config
└── tsconfig.build.json            # Build-specific config
```

**Reference**: See `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md` for current package.json, tsconfig.json, and source code patterns.

## Phase 2: Core Application Framework

**Goal**: Implement the core application framework with proper window and tray management.

**Files to Modify:**
- `electron/src/main.ts` - Integrate new services
- `electron/src/preload.ts` - Ensure preload is loaded correctly

**File/Folder Tree:**
```
electron/src/
├── main.ts                        # Main process with window/tray management
└── preload.ts                      # Preload script
```

**Reference**: See `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md` for current main.ts and preload.ts implementations.

## Phase 3: IPC Communication Layer

**Goal**: Create a secure and well-structured IPC communication layer.

**Files to Modify:**
- `electron/src/main.ts` - Register IPC handlers
- `electron/src/preload.ts` - Expose APIs securely

**Integration Points:**
- Frontend components - Will use exposed APIs

**File/Folder Tree:**
```
electron/src/
├── main.ts                        # IPC handlers registered
└── preload.ts                      # APIs exposed to renderer
```

**Reference**: See `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md` for current IPC patterns in main.ts and preload.ts.

## Phase 4: Qwen Authentication System

**Goal**: Rewrite the Qwen authentication system using the improved navigation-based detection approach from the current code.

**Files to Modify:**
- `electron/src/main.ts` - Add Qwen IPC handlers
- `electron/src/preload.ts` - Expose Qwen APIs

**Integration Points:**
- Backend API (`http://localhost:3002/api/qwen/credentials`) - Send extracted credentials

**File/Folder Tree:**
```
electron/src/
├── main.ts                        # Qwen auth handlers
└── preload.ts                      # Qwen APIs exposed
```

**Reference**: See `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md` for current Qwen authentication implementation in main.ts.

## Phase 5: Data Management & Persistence

**Goal**: Implement robust data management with improved error handling and validation.

**Files to Modify:**
- `electron/src/main.ts` - Add data management handlers
- `electron/src/preload.ts` - Expose data APIs

**Integration Points:**
- User data directory - Store persistent data

**File/Folder Tree:**
```
electron/src/
├── main.ts                        # Data management handlers
└── preload.ts                      # Data APIs exposed
```

**Reference**: See `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md` for current settings and history management in main.ts.

## Phase 6: Build System & Packaging

**Goal**: Configure the build system for production deployment across platforms.

**Files to Modify:**
- `electron/package.json` - Update build scripts
- Root `package.json` - Update workspace scripts
- `electron-builder.json` - Platform-specific configurations

**Integration Points:**
- `electron/dist/` - Built electron code
- `electron/assets/` - Include icons and resources

**File/Folder Tree:**
```
electron/
├── package.json                   # Updated build scripts
├── assets/                        # Platform icons
└── dist/                          # Build output
```

**Reference**: See `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md` for current package.json and build configuration.

## Phase 7: Testing & Quality Assurance

**Goal**: Add comprehensive testing and quality assurance measures.

**Files to Modify:**
- `electron/package.json` - Add test scripts
- `electron/tsconfig.json` - Add test configuration

**Integration Points:**
- CI/CD pipeline - Integrate testing
- Code coverage reports - Generate coverage data

**File/Folder Tree:**
```
electron/
├── package.json                   # Test scripts added
├── tsconfig.json                  # Test configuration
└── coverage/                      # Test coverage reports
```

**Reference**: See `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md` for current project structure and configuration patterns.

## Implementation Notes

- **Code References**: All implementations should reference the patterns and approaches documented in `docs/implementation/10_ELECTRON_CODE_EXAMPLES.md`
- **Security**: Follow the secure IPC patterns shown in the current preload.ts and main.ts
- **Error Handling**: Implement comprehensive error handling as demonstrated in the current Qwen authentication code
- **Platform Compatibility**: Ensure cross-platform compatibility for Windows, macOS, and Linux
- **Performance**: Maintain the efficient cookie extraction and JWT parsing logic from the current implementation
- **User Experience**: Preserve the tray functionality and window management behavior users expect

## Success Criteria

- [ ] Application builds successfully on all target platforms
- [ ] Qwen authentication works reliably using navigation-based detection
- [ ] System tray functionality operates correctly
- [ ] IPC communication is secure and efficient
- [ ] Settings and history persist correctly
- [ ] No regressions in existing functionality
- [ ] Code is well-structured and maintainable