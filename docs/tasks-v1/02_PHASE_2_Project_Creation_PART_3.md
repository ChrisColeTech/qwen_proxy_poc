**Goal:** Initialize Backend workspace with Express, TypeScript, and necessary dependencies.

**Prerequisites:** Project root directory must exist.

## Create Backend Directory Structure

```bash
# Create backend directory and src folder
mkdir -p backend
```

## Initialize Backend Package

```bash
# Navigate to backend directory
cd backend

# Initialize package.json
npm init -y
```
## Update `backend/package.json` 


### backend/package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "license": "ISC",
  "author": "",
  "type": "commonjs",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev":"cd provider-router && npm run dev",
    "start":"npm run dev"
  }
}

```
