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
