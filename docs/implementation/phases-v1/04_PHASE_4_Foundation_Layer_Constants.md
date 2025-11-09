## Phase 4: Foundation Layer - Constants

**Objective**: Centralize all page-level constants, tab configurations, and data builders.

### Files to Create:

**Page Constants:**
1. `frontend/src/constants/home.constants.tsx` - Home page tabs, icons, data builders
2. `frontend/src/constants/providers.constants.tsx` - Providers page configuration
3. `frontend/src/constants/models.constants.tsx` - Models page configuration
4. `frontend/src/constants/settings.constants.tsx` - Settings page tabs
5. `frontend/src/constants/chat.constants.tsx` - Chat page tabs
6. `frontend/src/constants/modelForm.constants.tsx` - Model form configuration
7. `frontend/src/constants/providerForm.constants.tsx` - Provider form configuration

**Guide Constants:**
8. `frontend/src/constants/browserGuide.constants.tsx` - Browser guide content
9. `frontend/src/constants/desktopGuide.constants.tsx` - Desktop guide content

**Code Reference**: See Phase 4 in `docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`

**Key Concepts:**
- Constants define tab configurations (value, label, description)
- Data builder functions return ActionItem[] arrays (not complex JSX)
- Simple helper functions create badges/status indicators
- No business logic in constants files

**Validation:**
- Run `npm run build` - should succeed