## Phase 7: Hooks Layer

**Objective**: Create custom React hooks encapsulating all business logic.

### Files to Create:

**Core Hooks:**
1. `frontend/src/hooks/useDarkMode.ts` - Theme management (syncs with DOM)
2. `frontend/src/hooks/useToast.ts` - Toast notifications interface

**Page-Specific Hooks**
3. `frontend/src/hooks/useHomePage.ts` - Home page logic (credentials, proxy status)
4. `frontend/src/hooks/useProvidersPage.ts` - Providers page logic (list, switch)
5. `frontend/src/hooks/useModelsPage.ts` - Models page logic (filtering, selection)
6. `frontend/src/hooks/useSettingsPage.ts` - Settings page logic (fetch, update)

**Code Reference**: See Phase 7 in `docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`

**Architecture Pattern:**
- Hooks encapsulate ALL business logic
- Pages only call hooks and render UI
- Hooks manage state, effects, and event handlers
- Clean separation of concerns

**Validation:**
- Run `npm run build` - should succeed