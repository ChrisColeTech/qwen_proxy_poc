**Goal:** Implement state management using Zustand for theme, credentials, proxy status, and alerts.

## Files to Create:
- `frontend/src/stores/useUIStore.ts` (with persistence)
- `frontend/src/stores/useCredentialsStore.ts`
- `frontend/src/stores/useProxyStore.ts`
- `frontend/src/stores/useAlertStore.ts`
- `frontend/src/hooks/useDarkMode.ts`
- `frontend/src/types/index.ts` (for UIState type)

## Files to Modify:
- `frontend/src/App.tsx` (to use the useDarkMode hook)

## Integration Points:
- Zustand state management library
- Zustand persist middleware for localStorage persistence
- Custom hook for applying theme to document

## Tasks:

1. **Install Zustand**
   ```bash
   cd frontend
   npm install zustand
   cd ..
   ```

2. **Create types directory and UIState type**
   ```bash
   mkdir -p frontend/src/types
   ```

   Create `frontend/src/types/index.ts`:
   ```typescript
   export interface UIState {
     theme: 'light' | 'dark';
     sidebarPosition: 'left' | 'right';
   }
   ```

3. **Create stores directory**
   ```bash
   mkdir -p frontend/src/stores
   ```

4. **Create useUIStore.ts** with Zustand store (PERSISTED)
   - Location: `frontend/src/stores/useUIStore.ts`
   - Implement:
     - Theme state ('light' | 'dark')
     - Sidebar position state ('left' | 'right')
     - Status message state
     - Actions: `setTheme`, `toggleTheme`, `setSidebarPosition`, `toggleSidebarPosition`, `setStatusMessage`
     - **Persist middleware** for localStorage with key 'qwen-proxy-ui-state'
     - This store persists user preferences across sessions

4a. **Create useCredentialsStore.ts** with Zustand store (NON-PERSISTED)
   - Location: `frontend/src/stores/useCredentialsStore.ts`
   - Implement:
     - Credentials state (QwenCredentials | null)
     - Loading state
     - Actions: `setCredentials`, `setLoading`
     - No persistence - credentials are runtime only for security
     - Used by StatusBar and HomePage for credential status

4b. **Create useProxyStore.ts** with Zustand store (NON-PERSISTED)
   - Location: `frontend/src/stores/useProxyStore.ts`
   - Implement:
     - Proxy status state (ProxyStatusResponse | null)
     - Loading state
     - Actions: `setStatus`, `setLoading`
     - No persistence - status is fetched on app load
     - Used by StatusBar and SystemControlCard

4c. **Create useAlertStore.ts** with Zustand store (NON-PERSISTED)
   - Location: `frontend/src/stores/useAlertStore.ts`
   - Implement:
     - Alert state (message + type: 'success' | 'error')
     - Actions: `showAlert`, `hideAlert`
     - No persistence - alerts are transient
     - Used by StatusAlert component for user feedback

5. **Create hooks directory**
   ```bash
   mkdir -p frontend/src/hooks
   ```

6. **Create useDarkMode.ts** hook
   - Location: `frontend/src/hooks/useDarkMode.ts`
   - Implement:
     - Reads theme from useUIStore
     - Applies theme class to document.documentElement
     - Returns theme and toggleTheme for convenience
     - Uses useEffect to sync theme changes to DOM

7. **Update App.tsx** to use the hook
   - Import and call `useDarkMode()` at top of App component
   - Hook automatically manages theme application to DOM
   - No provider wrapper needed (Zustand is provider-less)

8. **Verify main.tsx** renders App
   - Should already be correct from Vite template
   - Verify:
     - Imports App.tsx
     - Wraps with React.StrictMode
     - Renders to #root element

9. **Verify TypeScript compilation**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

## Common Issues & Fixes:

- **Theme flash on page load (shows wrong theme briefly)**
  - Zustand persist middleware loads from localStorage synchronously
  - useDarkMode hook applies theme in useEffect
  - Consider using useLayoutEffect if flash occurs

- **localStorage not persisting theme**
  - Verify localStorage is available (not in incognito mode)
  - Zustand persist middleware handles errors gracefully
  - Check browser console for storage quota errors

- **Theme not applied to document**
  - Ensure useDarkMode() hook is called in App component
  - Check that useEffect dependency array includes theme
  - Verify document.documentElement exists

## Validation:

- [x] Theme persists across page reloads
- [x] System theme detection works
- [x] Toggle switches between light and dark
- [x] No theme flash on load
- [x] Document root has correct class (`light` or `dark`)

## Store Persistence Strategy:

**Persisted Stores** (using Zustand persist middleware):
- `useUIStore` - User preferences (theme, sidebar position)
  - Key: 'qwen-proxy-ui-state'
  - Reason: User settings should persist across sessions

**Non-Persisted Stores** (runtime only):
- `useCredentialsStore` - Qwen credentials (security sensitive)
- `useProxyStore` - Proxy status (should be fresh on app start)
- `useAlertStore` - UI alerts (transient messages)

## Structure After Phase 5:

```
frontend/src/
├── types/
│   └── index.ts
├── stores/
│   ├── useUIStore.ts (persisted)
│   ├── useCredentialsStore.ts
│   ├── useProxyStore.ts
│   └── useAlertStore.ts
├── hooks/
│   └── useDarkMode.ts