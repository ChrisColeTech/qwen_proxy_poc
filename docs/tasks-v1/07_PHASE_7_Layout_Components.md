**Goal:** Create enhanced layout structure with custom title bar, sidebar navigation, main content area, and status bar.

## Files to Create:
- `frontend/src/components/layout/AppLayout.tsx`
- `frontend/src/components/layout/TitleBar.tsx`
- `frontend/src/components/layout/StatusBar.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/QuickGuidePage.tsx`
- `frontend/src/pages/ProvidersPage.tsx`
- `frontend/src/pages/ModelsPage.tsx`

## Files to Modify:
- `frontend/src/App.tsx` (add routing logic)

## Integration Points:
- `@/components/ui/button`
- `@/components/ui/badge`
- `@/components/ui/environment-badge`
- `@/components/ui/status-badge`
- `@/stores/useUIStore` for theme and UI state
- `@/stores/useCredentialsStore` for credential status
- `@/stores/useProxyStore` for proxy status
- `window.electronAPI` for window controls
- React Icons (VscChrome*) for window control icons
- Lucide React icons for UI elements

## Tasks:

1. **Create layout directory**
   ```bash
   mkdir -p frontend/src/components/layout
   ```

2. **Create AppLayout.tsx** with enhanced flexbox layout
   - Props: `children`, `activeRoute`, `onNavigate`
   - Implements:
     - Fixed title bar at top
     - Flexible middle section with sidebar and main content
     - Sidebar position (left or right) from useUIStore
     - Fixed status bar at bottom
     - Responsive layout with overflow handling

3. **Create Sidebar.tsx** with navigation
   - Props: `activeRoute`, `onNavigate`
   - Implements:
     - 48px (w-12) width vertical sidebar
     - Navigation items: Home, Quick Guide, Providers, Models
     - Icons from lucide-react (Home, BookOpen, Blocks, Cpu)
     - Active state indicator (colored bar on left or right edge)
     - Position-aware border (left or right based on sidebar position)
     - Hover states and transitions

4. **Create TitleBar.tsx** with enhanced controls
   - Implements:
     - App title "Qwen Proxy"
     - Sidebar position toggle (PanelLeft/PanelRight icons)
     - Theme toggle button (Moon/Sun icons)
     - Window controls (minimize, maximize/restore, close)
     - Draggable area (WebkitAppRegion: 'drag')
     - Non-draggable buttons (WebkitAppRegion: 'no-drag')
   - Uses icons from:
     - lucide-react: Moon, Sun, PanelLeft, PanelRight
     - react-icons/vsc: VscChromeMinimize, VscChromeMaximize, VscChromeClose
   - All state managed through useUIStore

5. **Create StatusBar.tsx** with comprehensive status display
   - Implements:
     - Left section: Environment badge, credential status badge, proxy status badge
     - Right section: Status message from useUIStore
     - Visual separators between badges
     - Uses custom components:
       - EnvironmentBadge (Desktop/Browser)
       - StatusBadge for credentials (active/inactive/expired)
       - StatusBadge for proxy (running/stopped)

6. **Create page components**

   ```bash
   mkdir -p frontend/src/pages
   ```

   **Create HomePage.tsx:**
   - Location: `frontend/src/pages/HomePage.tsx`
   - Purpose: Main dashboard page with system controls and status
   - Implementation:
     - Container with max-width and padding
     - StatusAlert component for credential/connection status
     - SystemControlCard for proxy controls
     - ProvidersListCard and ModelsListCard in grid
     - ConnectionGuideCard with setup instructions
     - Uses useCredentialPolling hook for real-time updates

   **Create QuickGuidePage.tsx (Placeholder):**
   - Location: `frontend/src/pages/QuickGuidePage.tsx`
   - Purpose: Quick start guide and documentation
   - Implementation:
     - Simple Card with BookOpen icon
     - Placeholder text: "Quick guide content coming soon..."
     - Ready for future content expansion

   **Create ProvidersPage.tsx (Placeholder):**
   - Location: `frontend/src/pages/ProvidersPage.tsx`
   - Purpose: Provider management and configuration
   - Implementation:
     - Simple Card with Blocks icon
     - Placeholder text: "Providers content coming soon..."
     - Ready for future content expansion

   **Create ModelsPage.tsx (Placeholder):**
   - Location: `frontend/src/pages/ModelsPage.tsx`
   - Purpose: Model management and selection
   - Implementation:
     - Simple Card with Cpu icon
     - Placeholder text: "Models content coming soon..."
     - Ready for future content expansion

7. **Update App.tsx** with routing and layout
   ```tsx
   import { useState } from 'react';
   import { useDarkMode } from '@/hooks/useDarkMode';
   import { AppLayout } from '@/components/layout/AppLayout';
   import { HomePage } from '@/pages/HomePage';
   import { QuickGuidePage } from '@/pages/QuickGuidePage';
   import { ProvidersPage } from '@/pages/ProvidersPage';
   import { ModelsPage } from '@/pages/ModelsPage';

   function App() {
     useDarkMode();
     const [currentRoute, setCurrentRoute] = useState('/');

     const renderPage = () => {
       switch (currentRoute) {
         case '/':
           return <HomePage />;
         case '/guide':
           return <QuickGuidePage />;
         case '/providers':
           return <ProvidersPage />;
         case '/models':
           return <ModelsPage />;
         default:
           return <HomePage />;
       }
     };

     return (
       <AppLayout activeRoute={currentRoute} onNavigate={setCurrentRoute}>
         {renderPage()}
       </AppLayout>
     );
   }

   export default App;
   ```

   Note: No ThemeProvider needed - theme is managed by Zustand store

8. **Verify TypeScript compilation**
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
  - Middle section uses `overflow-hidden` to contain scrollable content

- **Sidebar position not switching**
  - Verify useUIStore.toggleSidebarPosition() is working
  - Check that AppLayout conditionally renders sidebar based on position
  - Ensure sidebar border direction matches position (left: border-r, right: border-l)

- **Status badges not showing data**
  - Ensure stores are properly initialized (useCredentialsStore, useProxyStore)
  - Verify credentialsService is available for environment detection
  - Check that status data is being passed to StatusBar correctly

## Validation:

- [x] Title bar fixed at top with all controls functional
- [x] Sidebar renders on correct side (left or right)
- [x] Sidebar position toggle works
- [x] Navigation between pages works (Home, Guide, Providers, Models)
- [x] Active route indicator shows on sidebar
- [x] Status bar fixed at bottom
- [x] Status bar shows environment badge (Desktop/Browser)
- [x] Status bar shows credential status
- [x] Status bar shows proxy status
- [x] Main content scrolls properly
- [x] Theme toggle works
- [x] Layout responsive (works at 600px min width)
- [x] Window controls will work in Electron (tested after Electron setup)

## Structure After Phase 7:

```
frontend/src/
├── components/
│   └── layout/
│       ├── AppLayout.tsx
│       ├── TitleBar.tsx
│       ├── Sidebar.tsx
│       └── StatusBar.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── QuickGuidePage.tsx
│   ├── ProvidersPage.tsx
│   └── ModelsPage.tsx