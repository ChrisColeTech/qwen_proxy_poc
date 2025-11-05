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

# Add all required components
npx shadcn@latest add button input textarea label card popover command dialog

cd ..
```

This creates:
- `frontend/src/components/ui/` directory
- `frontend/src/lib/utils.ts` with cn() utility
- `frontend/components.json` config file


2. **Verify components created**
   ```bash
   ls frontend/src/components/ui/
   # Should see: button.tsx, input.tsx, label.tsx, card.tsx, etc.
   ```

3. **Verify theme support**
   - Components should respond to light/dark theme
   - Check that Tailwind theme variables are applied

4. **Verify TypeScript compilation**
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

## Structure After Phase 3:

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
│       └── dialog.tsx