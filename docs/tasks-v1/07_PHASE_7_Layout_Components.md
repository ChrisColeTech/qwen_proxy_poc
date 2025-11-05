**Goal:** Create base layout structure with custom title bar, main content area, and status bar.

## Files to Create:
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/components/layout/TitleBar.tsx`
- `frontend/src/components/layout/StatusBar.tsx`

## Files to Modify:
- None

## Integration Points:
- `@/components/ui/button`
- `@/contexts/ThemeContext`
- `window.electronAPI` for window controls
- React Icons for window control icons

## Tasks:

1. **Create layout directory**
   ```bash
   mkdir -p frontend/src/components/layout
   ```

2. **Create AppLayout.tsx** with flexbox layout
   - Implement: Fixed title bar + status bar, scrollable main content
   - Props: `children`, `statusMessage`

3. **Create TitleBar.tsx** with custom window controls
   - Implement:
     - App icon and title
     - Theme toggle button
     - Window controls (minimize, maximize/restore, close)
     - Draggable area (WebkitAppRegion: 'drag')
   - Uses React Icons (VscChromeMinimize, VscChromeMaximize, VscChromeClose)

4. **Create StatusBar.tsx** with status display
   - Implements: Right-aligned status message display

5. **App.tsx layout** (wrap in App.tsx)
   ```tsx
   import { AppLayout } from '@/components/layout/AppLayout';
   import { ThemeProvider } from '@/contexts/ThemeContext';

   function App() {
     return (
       <ThemeProvider>
         <AppLayout statusMessage="Ready">
           <div>Main content here</div>
         </AppLayout>
       </ThemeProvider>
     );
   }
   ```

6. **Verify TypeScript compilation**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

## Common Issues & Fixes:

- **Title bar not draggable**
  - Ensure TitleBar has `style={{ WebkitAppRegion: 'drag' }}`
  - Buttons must have `style={{ WebkitAppRegion: 'no-drag' }}`
  - Only works in Electron, not browser

- **Window controls don't work**
  - Window controls use `window.electronAPI` (implemented in Phase 17)
  - Test in browser: controls will be visible but do nothing until Electron is set up

- **Layout height issues**
  - AppLayout uses flexbox with `flex-1` for main content
  - Ensure parent has `h-screen` class

## Validation:

- [x] Title bar fixed at top
- [x] Status bar fixed at bottom
- [x] Main content scrolls properly
- [x] Theme toggle works
- [x] Layout responsive (works at 600px min width)
- [x] Window controls will work in Electron (tested in Phase 7)

## Structure After Phase 4:

```
frontend/src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx
│       ├── TitleBar.tsx
│       └── StatusBar.tsx