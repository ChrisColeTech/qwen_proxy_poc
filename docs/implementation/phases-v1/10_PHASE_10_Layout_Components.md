## Phase 10: Layout Components

**Objective**: Create core application layout structure.

### Files to Create (4 layout components):

1. `frontend/src/components/layout/AppLayout.tsx` - Main layout container with sidebar positioning
2. `frontend/src/components/layout/Sidebar.tsx` - Navigation sidebar with route management
3. `frontend/src/components/layout/TitleBar.tsx` - Title bar with window controls and theme toggle
4. `frontend/src/components/layout/StatusBar.tsx` - Status bar with environment badge and lifecycle status

**Code Reference**: See Phase 10 in `docs/implementation/07_FRONTEND_CODE_PHASES_8-10.md`

**Features:**
- Responsive layout behavior
- Sidebar position switching (left/right)
- Window controls for Electron
- Theme toggle integration
- Lifecycle status display

**Validation:**
- Run `npm run build` - should succeed