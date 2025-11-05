**Goal:** Implement theme context for light/dark mode management with system preference detection.

## Files to Create:
- `frontend/src/contexts/ThemeContext.tsx`

## Files to Modify:
- None

## Integration Points:
- React Context API
- localStorage for persistence
- `window.matchMedia` for system theme detection

## Tasks:

1. **Create contexts directory**
   ```bash
   mkdir -p frontend/src/contexts
   ```

2. **Create ThemeContext.tsx** with theme provider
   - Implement:
     - `ThemeProvider` component wrapper
     - `useTheme()` hook for accessing theme state
     - Theme persistence in localStorage
     - System theme detection
     - Applies theme class to document root

3. **Update App.tsx** with complete integration
   - See `docs/v1/03_CODE_EXAMPLES.md`
   - Copy complete file content
   - Implements:
     - Wraps with ThemeProvider
     - Uses AppLayout with status message
     - Renders ConverterPanel as main content
     - Minimal logic (all state in ConverterPanel)

4. **Verify main.tsx** renders App
   - Should already be correct from Vite template
   - Verify:
     - Imports App.tsx
     - Wraps with React.StrictMode
     - Renders to #root element

5. **Verify TypeScript compilation**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

## Common Issues & Fixes:

- **Theme flash on page load (shows wrong theme briefly)**
  - ThemeProvider applies theme class before React hydration
  - Uses useLayoutEffect to prevent flash
  - Already implemented in context

- **System theme detection not working**
  - Check that window.matchMedia is supported
  - Context includes fallback to 'light' if unsupported

- **localStorage not persisting theme**
  - Verify localStorage is available (not in incognito mode)
  - Context handles localStorage errors gracefully

## Validation:

- [x] Theme persists across page reloads
- [x] System theme detection works
- [x] Toggle switches between light and dark
- [x] No theme flash on load
- [x] Document root has correct class (`light` or `dark`)

## Structure After Phase 2:

```
frontend/src/
├── contexts/
│   └── ThemeContext.tsx