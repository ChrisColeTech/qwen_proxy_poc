## Phase 7: Hooks Layer

**Objective**: Create custom React hooks encapsulating all business logic.

### Files to Create:

**Core Hooks (5 files):**
1. `frontend/src/hooks/useDarkMode.ts` - Theme management (syncs with DOM)
2. `frontend/src/hooks/useWebSocket.ts` - WebSocket connection management
3. `frontend/src/hooks/useToast.ts` - Toast notifications interface
4. `frontend/src/hooks/useExtensionDetection.ts` - Browser extension detection
5. `frontend/src/hooks/useBrowserGuidePage.ts` - Browser guide logic

**Page-Specific Hooks (8 files):**
7. `frontend/src/hooks/useHomePage.ts` - Home page logic (credentials, proxy status)
8. `frontend/src/hooks/useProvidersPage.ts` - Providers page logic (list, switch)
9. `frontend/src/hooks/useModelsPage.ts` - Models page logic (filtering, selection)
10. `frontend/src/hooks/useSettingsPage.ts` - Settings page logic (fetch, update)
11. `frontend/src/hooks/useDesktopGuidePage.ts` - Desktop guide logic
12. `frontend/src/hooks/useModelFormPage.ts` - Model form logic
13. `frontend/src/hooks/useProviderFormPage.ts` - Provider form logic
14. `frontend/src/hooks/useApiGuidePage.ts` - API guide page logic (already created in phase 7)

**Code Reference**: See Phase 7 in `docs/implementation/06_FRONTEND_CODE_PHASES_6-7.md`

**Architecture Pattern:**
- Hooks encapsulate ALL business logic
- Pages only call hooks and render UI
- Hooks manage state, effects, and event handlers
- Clean separation of concerns

**Validation:**
- Run `npm run build` - should succeed