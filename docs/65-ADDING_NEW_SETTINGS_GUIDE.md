# Adding New Settings to the Application

## Overview

This document describes the current (unnecessarily complex) process for adding new settings to the application. The settings system requires modifications in multiple locations due to a validation whitelist system that prevents simple CRUD operations.

## Current System Architecture

### Key Components

1. **Settings Controller** (`backend/provider-router/src/controllers/settings-controller.js`)
   - Handles CRUD operations via `SettingsService`
   - Simple database operations: `get()`, `set()`, `delete()`
   - Would work fine without validation middleware

2. **Settings Validation Middleware** (`backend/provider-router/src/middleware/settings-validation.js`)
   - **THE BOTTLENECK**: Maintains hardcoded whitelist of allowed setting keys
   - Blocks any setting key not in `VALID_SETTINGS` array
   - Requires custom validation function for each setting type
   - Re-exported by api-server: `backend/api-server/src/middleware/settings-validation.js`

3. **Settings Service** (`backend/provider-router/src/database/services/settings-service.js`)
   - Simple SQLite CRUD operations
   - No validation - just stores key-value pairs

4. **Frontend Store** (`frontend/src/stores/useSettingsStore.ts`)
   - Zustand store for settings state management
   - Calls `apiService.updateSetting()` which hits validation middleware

## The Problem

The validation middleware creates unnecessary complexity:
- Simple settings like `active_model` require code changes in 3+ places
- The SQLite database can store any key-value pair, but the API blocks it
- Adding a new setting requires backend code changes and redeployment
- The validation provides minimal value (most settings just check if non-empty string)

## Step-by-Step: Adding a New Setting

### Step 1: Add to VALID_SETTINGS Array

**File:** `backend/provider-router/src/middleware/settings-validation.js`

```javascript
// Valid setting keys
const VALID_SETTINGS = [
  'server.port',
  'server.host',
  'server.timeout',
  'logging.level',
  'logging.logRequests',
  'logging.logResponses',
  'system.autoStart',
  'system.minimizeToTray',
  'system.checkUpdates',
  'active_provider',
  'active_model',        // <-- ADD YOUR NEW SETTING HERE
  'your_new_setting'     // <-- Example
]
```

### Step 2: Add Validation Logic in validateSettingValue()

**File:** `backend/provider-router/src/middleware/settings-validation.js`

```javascript
export function validateSettingValue(req, res, next) {
  const { key } = req.params
  const { value } = req.body

  // ... existing code ...

  try {
    // Validate based on setting type
    if (key === 'server.port') {
      validatePort(value)
    } else if (key === 'server.host') {
      validateHost(value)
    } else if (key === 'server.timeout') {
      validateTimeout(value)
    } else if (key === 'logging.level') {
      validateLogLevel(value)
    } else if (key === 'active_provider') {
      validateActiveProvider(value)
    } else if (key === 'active_model') {
      validateActiveModel(value)
    } else if (key === 'your_new_setting') {  // <-- ADD YOUR VALIDATION
      validateYourNewSetting(value)
    } else if (key.startsWith('logging.log') || key.startsWith('system.')) {
      validateBoolean(value, key)
    }

    next()
  } catch (error) {
    // ... error handling ...
  }
}
```

### Step 3: Add Validation Logic in validateBulkSettings()

**File:** `backend/provider-router/src/middleware/settings-validation.js`

```javascript
export function validateBulkSettings(req, res, next) {
  // ... existing code ...

  for (const [key, value] of Object.entries(settings)) {
    // ... validation check ...

    try {
      if (key === 'server.port') {
        validatePort(value)
      } else if (key === 'server.host') {
        validateHost(value)
      } else if (key === 'server.timeout') {
        validateTimeout(value)
      } else if (key === 'logging.level') {
        validateLogLevel(value)
      } else if (key === 'active_provider') {
        validateActiveProvider(value)
      } else if (key === 'active_model') {
        validateActiveModel(value)
      } else if (key === 'your_new_setting') {  // <-- ADD YOUR VALIDATION
        validateYourNewSetting(value)
      } else if (key.startsWith('logging.log') || key.startsWith('system.')) {
        validateBoolean(value, key)
      }
    } catch (error) {
      // ... error handling ...
    }
  }
}
```

### Step 4: Create Validation Function

**File:** `backend/provider-router/src/middleware/settings-validation.js`

Add your validation function at the end of the file (before the exports):

```javascript
/**
 * Validate your new setting
 */
function validateYourNewSetting(value) {
  // Example: Simple string validation
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Your setting must be a non-empty string')
  }

  // Add any additional validation logic here
  // Most settings just check if non-empty string
}

// For boolean settings, use existing validateBoolean()
// For string settings, just check non-empty
// For numeric settings, check range/type
```

### Step 5: (Optional) Add Default Value

**File:** `backend/provider-router/src/controllers/settings-controller.js`

If your setting needs a default value:

```javascript
// Default settings
const DEFAULT_SETTINGS = {
  'server.port': 3001,
  'server.host': '0.0.0.0',
  'server.timeout': 120000,
  'logging.level': 'info',
  'logging.logRequests': true,
  'logging.logResponses': true,
  'system.autoStart': false,
  'system.minimizeToTray': true,
  'system.checkUpdates': true,
  'your_new_setting': 'default_value'  // <-- ADD DEFAULT
}
```

### Step 6: (Optional) Mark as Restart-Required

**File:** `backend/provider-router/src/controllers/settings-controller.js`

If changing this setting requires server restart:

```javascript
// Settings that require server restart to apply
const RESTART_REQUIRED_SETTINGS = [
  'server.port',
  'server.host',
  'logging.level',
  'your_new_setting'  // <-- ADD IF RESTART NEEDED
]
```

### Step 7: Update Frontend Store (if needed)

**File:** `frontend/src/stores/useSettingsStore.ts`

Add TypeScript interface and helper method:

```typescript
interface Settings {
  'server.port'?: string;
  'server.host'?: string;
  active_provider?: string;
  active_model?: string;
  your_new_setting?: string;  // <-- ADD TYPE
  [key: string]: string | number | boolean | undefined;
}

interface SettingsStore {
  settings: Settings;
  loading: boolean;
  providerRouterUrl: string;
  fetchSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
  setActiveModel: (modelId: string) => Promise<void>;
  setYourNewSetting: (value: string) => Promise<void>;  // <-- ADD HELPER
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // ... existing code ...

  setYourNewSetting: async (value: string) => {
    return get().updateSetting('your_new_setting', value);
  }
}));
```

### Step 8: Restart Backend

The settings validation middleware is loaded at server startup, so you must restart the backend for changes to take effect.

```bash
# Restart provider-router or api-server
npm run dev  # or however you start the backend
```

## Example: Adding `active_model` Setting

Here's the actual code changes made to add `active_model`:

**1. Added to whitelist:**
```javascript
const VALID_SETTINGS = [
  // ... existing settings ...
  'active_provider',
  'active_model'  // Added
]
```

**2. Added validation calls:**
```javascript
// In validateSettingValue()
} else if (key === 'active_model') {
  validateActiveModel(value)
}

// In validateBulkSettings()
} else if (key === 'active_model') {
  validateActiveModel(value)
}
```

**3. Created validation function:**
```javascript
function validateActiveModel(modelId) {
  if (typeof modelId !== 'string' || modelId.trim().length === 0) {
    throw new Error('Model ID must be a non-empty string')
  }
  // Model validation is lenient - we just ensure it's a non-empty string
  // The actual model existence check happens when making API calls
}
```

**4. Updated frontend store:**
```typescript
interface Settings {
  // ... existing ...
  active_model?: string;
}

interface SettingsStore {
  // ... existing ...
  setActiveModel: (modelId: string) => Promise<void>;
}

// Implementation
setActiveModel: async (modelId: string) => {
  return get().updateSetting('active_model', modelId);
}
```

## Common Validation Patterns

### String Setting (non-empty)
```javascript
function validateYourSetting(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('Setting must be a non-empty string')
  }
}
```

### Boolean Setting
```javascript
// Use existing validateBoolean() function
// Just add to the else-if check for logging.log or system. settings
else if (key.startsWith('logging.log') || key.startsWith('system.') || key === 'your_boolean_setting') {
  validateBoolean(value, key)
}
```

### Numeric Setting
```javascript
function validateYourNumericSetting(value) {
  const num = Number(value)

  if (!Number.isInteger(num)) {
    throw new Error('Setting must be an integer')
  }

  if (num < 0 || num > 100) {
    throw new Error('Setting must be between 0 and 100')
  }
}
```

### Enum Setting
```javascript
const VALID_VALUES = ['option1', 'option2', 'option3']

function validateYourEnumSetting(value) {
  if (typeof value !== 'string') {
    throw new Error('Setting must be a string')
  }

  if (!VALID_VALUES.includes(value)) {
    throw new Error(`Setting must be one of: ${VALID_VALUES.join(', ')}`)
  }
}
```

## Why This is Problematic

1. **Unnecessary Complexity**: Most settings just need "is non-empty string" validation
2. **Code Duplication**: Validation logic appears in 2 places (single + bulk update)
3. **Deployment Friction**: Adding a setting requires backend code changes and restart
4. **Breaks CRUD Principles**: The database supports any key, but the API blocks it
5. **Poor DX**: Developers expect simple CRUD operations for settings
6. **Maintenance Burden**: Every new setting = 5+ file edits

## The Right Way Forward

See `47-SETTINGS_CRUD_SIMPLIFICATION_PLAN.md` for a proper implementation plan that:
- Removes the validation whitelist
- Allows arbitrary key-value pairs
- Maintains type safety on frontend
- Provides validation only where needed (e.g., port numbers)
- Follows standard CRUD patterns

## Summary

Adding a new setting requires:
1. Add to `VALID_SETTINGS` array
2. Add validation call in `validateSettingValue()`
3. Add validation call in `validateBulkSettings()`
4. Create validation function
5. (Optional) Add default value
6. (Optional) Mark as restart-required
7. Update frontend TypeScript types
8. Restart backend

This is significantly more complex than it needs to be for a simple key-value store.
