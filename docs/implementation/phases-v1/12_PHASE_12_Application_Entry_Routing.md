## Phase 12: Application Entry & Routing

**Objective**: Wire up the application with routing and initialization.

### Files to Create/Modify:

1. `frontend/src/App.tsx` - Main app component with routing logic
2. `frontend/src/main.tsx` - React 18 entry point

**Code Reference**: See Phase 12 in `docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`

**App.tsx Key Features:**
- Initialize dark mode (`useDarkMode()`)
- Initialize WebSocket (`useWebSocket()`)
- Load settings on mount
- Client-side routing via switch statement
- Handle dynamic routes (`/providers/:id`, `/models/:id`)
- Render Toaster component globally

**Validation:**
- Run `npm run build` - should succeed