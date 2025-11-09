## Phase 5: Service Layer

**Objective**: Implement business logic and API communication layer.

### Files to Create:

**Core Services:**
1. `frontend/src/services/api.service.ts` - HTTP API service (get, post, put, delete, getSettings, updateSetting)

**Domain Services:**
2. `frontend/src/services/providers.service.ts` - Provider operations (getProviders, switchProvider, etc.)
3. `frontend/src/services/models.service.ts` - Model operations (getModels, getAvailableModels, etc.)
4. `frontend/src/services/chatService.ts` - Chat operations (sendMessage, streamChat)

**Code Reference**: See Phase 5 in `docs/implementation/05_FRONTEND_CODE_PHASES_4-5.md`

**Architecture:**
- All API calls go through `api.service.ts`
- Domain services encapsulate business logic
- Proper error handling throughout
- Type-safe request/response handling

**Validation:**
- Run `npm run build` - should succeed