**Goal:** Install and configure shadcn/ui base components.

## Files to Create:
- `frontend/src/components/ui/button.tsx` (via shadcn CLI)
- `frontend/src/components/ui/input.tsx` (via shadcn CLI)
- `frontend/src/components/ui/textarea.tsx` (via shadcn CLI)
- `frontend/src/components/ui/label.tsx` (via shadcn CLI)
- `frontend/src/components/ui/card.tsx` (via shadcn CLI)
- `frontend/src/components/ui/popover.tsx` (via shadcn CLI)
- `frontend/src/components/ui/command.tsx` (via shadcn CLI)
- `frontend/src/components/ui/dialog.tsx` (via shadcn CLI)
- `frontend/src/components/ui/badge.tsx` (via shadcn CLI)
- `frontend/src/components/ui/alert.tsx` (via shadcn CLI)
- `frontend/src/components/ui/environment-badge.tsx` (custom component)
- `frontend/src/components/ui/status-badge.tsx` (custom component)
- `frontend/src/components/ui/status-indicator.tsx` (custom component)

## Files to Modify:
- `frontend/src/lib/utils.ts` (already created in Phase 1 by shadcn init)

## Integration Points:
- Tailwind CSS
- Radix UI primitives (installed by shadcn)
- `@/lib/utils` for cn utility

## Tasks:

1. **Install shadcn/ui components** (if not done in Phase 1)

---

**Note: if a components.json exists, delete it and create it with the shadcn sli properly**

## shadcn/ui Setup

```bash
cd frontend

# Initialize shadcn/ui (use -d flag for defaults/non-interactive)
npx shadcn@latest init -d

# Add all required shadcn components
npx shadcn@latest add button input textarea label card popover command dialog badge alert

cd ..
```

This creates:
- `frontend/src/components/ui/` directory
- `frontend/src/lib/utils.ts` with cn() utility
- `frontend/components.json` config file


2. **Verify components created**
   ```bash
   ls frontend/src/components/ui/
   # Should see: button.tsx, input.tsx, label.tsx, card.tsx, badge.tsx, alert.tsx, etc.
   ```

3. **Create custom status components**

   **Create environment-badge.tsx:**
   - Location: `frontend/src/components/ui/environment-badge.tsx`
   - Purpose: Display whether app is running in Desktop (Electron) or Browser mode
   - Implementation:
     - Uses Badge component from shadcn
     - Detects environment via credentialsService.isElectron()
     - Shows animated pulse indicator
     - Displays "Desktop" or "Browser" text

   **Create status-badge.tsx:**
   - Location: `frontend/src/components/ui/status-badge.tsx`
   - Purpose: Reusable status badge for various states
   - Implementation:
     - Accepts status prop: 'active' | 'inactive' | 'expired' | 'running' | 'stopped'
     - Maps status to Badge variants (default, secondary, destructive)
     - Auto-capitalizes status text or accepts custom children

   **Create status-indicator.tsx:**
   - Location: `frontend/src/components/ui/status-indicator.tsx`
   - Purpose: Visual indicator for connection/service status
   - Implementation:
     - Small colored dot with optional pulse animation
     - Color-coded: green (success), yellow (warning), red (error), gray (inactive)

4. **Verify theme support**
   - Components should respond to light/dark theme
   - Check that Tailwind theme variables are applied

5. **Verify TypeScript compilation**
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

## Common Issues & Fixes:

- **shadcn CLI fails with "path alias not configured"**
  - Ensure tsconfig.json has path aliases (Phase 1)
  - Run from frontend directory, not root

- **Components don't have correct styling**
  - Verify index.css has Tailwind directives
  - Check tailwind.config.js content paths include components/

- **Dark mode not working on components**
  - Verify tailwind.config.js has `darkMode: ['class']`
  - Check ThemeProvider is wrapping app

## Validation:

- [x] All components render correctly
- [x] Theme support works (light/dark)
- [x] Components are accessible (keyboard navigation works)
- [x] No TypeScript errors
- [x] Tailwind classes apply correctly


## Files to Create:
- `frontend/src/components/ui/` directory
- `frontend/src/lib/utils.ts` with cn() utility
- `frontend/components.json` config file

## Structure After Phase 6:

```
frontend/src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── label.tsx
│       ├── card.tsx
│       ├── popover.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       ├── alert.tsx
│       ├── environment-badge.tsx (custom)
│       ├── status-badge.tsx (custom)
│       └── status-indicator.tsx (custom)