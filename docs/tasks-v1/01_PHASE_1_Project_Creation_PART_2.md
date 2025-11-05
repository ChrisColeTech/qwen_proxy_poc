**Goal:** Initialize Frontend workspace with Vite, React, TypeScript, and Tailwind CSS.

**Prerequisites:** Project root directory must exist.

## Step 1: Create Frontend Workspace with Vite

```bash
# Create frontend with Vite + React + TypeScript
npm create vite@latest frontend -- --template react-ts --no-interactive 
```

## Step 2: Install Base Dependencies

```bash
# Navigate to frontend and install dependencies
cd frontend
npm install
```

## Step 3: Install React 18

Vite defaults to React 19, but we need React 18 for compatibility:

```bash
# Install React 18 (Vite defaults to React 19)
npm install "react@^18.2.0" "react-dom@^18.2.0"
npm install -D "@types/react@^18.2.0" "@types/react-dom@^18.2.0"
```

## Step 4: Update frontend/tsconfig.json

Update `frontend/tsconfig.json` to add path aliases:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Step 5: Install Tailwind CSS and Dependencies

```bash
# Still in frontend directory

# Install Tailwind CSS and dependencies
npm install -D "tailwindcss@^3.4.0" "postcss@^8.4.0" "autoprefixer@^10.4.0" "tailwindcss-animate@^1.0.7"  "class-variance-authority@^0.7.0" "clsx@^2.0.0" "tailwind-merge@^2.0.0" lucide-react react-icons

# Initialize Tailwind CSS
npx tailwindcss init -p
```

## Step 6: Return to Root Directory

```bash
cd ..
```

## Validation

- [x] `frontend/` directory created with Vite template
- [x] React 18 installed
- [x] `frontend/tsconfig.json` updated with path aliases
- [x] Tailwind CSS and dependencies installed
- [x] Icon libraries (lucide-react, react-icons) installed
- [x] Tailwind CSS initialized
