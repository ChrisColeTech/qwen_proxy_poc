## Phase 2: Foundation Layer - Types

**Objective**: Build the complete type system for type-safe development.

### Files to Create:

1. `frontend/src/types/common.types.ts` - Common types (Route, APIResponse, Platform, Theme, SidebarPosition)
2. `frontend/src/types/providers.types.ts` - Provider domain types
3. `frontend/src/types/models.types.ts` - Model domain types (Model, ParsedModel, Capability, CapabilityFilter)
4. `frontend/src/types/chat.types.ts` - Chat functionality types
5. `frontend/src/types/home.types.ts` - Home page types
6. `frontend/src/types/index.ts` - Type barrel export (re-exports all types)

**Code Reference**: See Phase 2 in `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

**Validation:**
- Run `npm run build` - should succeed