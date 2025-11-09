# Phase 7: Hooks Layer

## Overview
This phase creates custom React hooks that encapsulate business logic, following the principle of separating concerns. Hooks compose services and stores to provide clean, reusable APIs for components and pages.

**Priority**: P0  
**Files Created**: 18  
**Files Modified**: 0  
**Description**: Custom React hooks encapsulating business logic

## Subphases

### Phase 7.1: Core Hooks (Priority: P0)
**Objective**: Create fundamental hooks for app-wide functionality.

**Files to Create**:
1. `frontend/src/hooks/useDarkMode.ts` - Theme management (dark/light mode sync with DOM)
2. `frontend/src/hooks/useWebSocket.ts` - WebSocket connection management
3. `frontend/src/hooks/useToast.ts` - Toast notifications interface
4. `frontend/src/hooks/useExtensionDetection.ts` - Browser extension detection
5. `frontend/src/hooks/useChatTest.ts` - Chat testing functionality
6. `frontend/src/hooks/useQuickChatTest.ts` - Quick chat testing

**Validation**:
- [ ] Hooks properly encapsulate logic
- [ ] Proper cleanup on unmount
- [ ] WebSocket reconnection logic

**Integration Points**:
- Used by App.tsx for initialization
- Used by components for functionality
- Abstract store interactions

### Phase 7.2: Domain Hooks (Priority: P0)
**Objective**: Create hooks for domain-specific operations.

**Files to Create**:
1. `frontend/src/hooks/useProviders.ts` - Provider management (fetch, switch, refresh)
2. `frontend/src/hooks/useModels.ts` - Model management (fetch, filter by capabilities)
3. `frontend/src/hooks/useCredentials.ts` - Credentials management (status, polling, logout)

**Validation**:
- [ ] Clear separation of concerns
- [ ] Proper error handling
- [ ] Loading states managed

**Integration Points**:
- Use domain services
- Update domain stores
- Used by page hooks

### Phase 7.3: Page Hooks (Priority: P0)
**Objective**: Create hooks for page-specific logic.

**Files to Create**:
1. `frontend/src/hooks/useHomePage.ts` - Home page logic (credentials, proxy status)
2. `frontend/src/hooks/useProvidersPage.ts` - Providers page logic (list, switch with auto-model-selection)
3. `frontend/src/hooks/useModelsPage.ts` - Models page logic (available vs all models, filtering)
4. `frontend/src/hooks/useSettingsPage.ts` - Settings page logic (fetch, update)
5. `frontend/src/hooks/useChatPage.ts` - Chat page logic (test, stream responses)
6. `frontend/src/hooks/useApiGuidePage.ts` - API guide logic
7. `frontend/src/hooks/useBrowserGuidePage.ts` - Browser guide logic
8. `frontend/src/hooks/useDesktopGuidePage.ts` - Desktop guide logic
9. `frontend/src/hooks/useCustomChat.ts` - Custom chat interface

**Validation**:
- [ ] Single responsibility per hook
- [ ] Proper dependency management
- [ ] Return clean API for components

**Integration Points**:
- Used by pages exclusively
- Compose domain hooks
- Provide page-specific logic

**Folder Structure After Phase 7**:
```
frontend/src/
├── hooks/
│   ├── useDarkMode.ts
│   ├── useWebSocket.ts
│   ├── useToast.ts
│   ├── useExtensionDetection.ts
│   ├── useChatTest.ts
│   ├── useQuickChatTest.ts
│   ├── useProviders.ts
│   ├── useModels.ts
│   ├── useCredentials.ts
│   ├── useHomePage.ts
│   ├── useProvidersPage.ts
│   ├── useModelsPage.ts
│   ├── useSettingsPage.ts
│   ├── useChatPage.ts
│   ├── useApiGuidePage.ts
│   ├── useBrowserGuidePage.ts
│   ├── useDesktopGuidePage.ts
│   └── useCustomChat.ts
```

## Code Documentation Reference
Complete source code for Phase 7 is available in [`06_FRONTEND_CODE_PHASES_6-7.md`](../code_examples/06_FRONTEND_CODE_PHASES_6-7.md)

## Success Criteria
- [ ] All business logic encapsulated in hooks
- [ ] Components remain presentational
- [ ] Hooks provide clean, typed APIs for pages