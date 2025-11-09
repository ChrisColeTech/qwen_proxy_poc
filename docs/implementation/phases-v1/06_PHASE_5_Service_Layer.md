# Phase 5: Service Layer

## Overview
This phase implements the business logic and API communication layer, encapsulating all HTTP and WebSocket interactions. Services follow SRP and provide a clean abstraction for domain-specific operations.

**Priority**: P0  
**Files Created**: 9  
**Files Modified**: 0  
**Description**: Business logic and API communication

## Subphases

### Phase 5.1: Core API Service (Priority: P0)
**Objective**: Implement HTTP API communication layer.

**Files to Create**:
1. `frontend/src/services/api.service.ts` - Core API service (get, post, put, delete, getSettings, updateSetting)

**Validation**:
- [ ] Error handling for all requests
- [ ] Proper TypeScript typing
- [ ] Consistent response format

**Integration Points**:
- Used by all domain services
- Single source of truth for API calls

### Phase 5.2: WebSocket Service (Priority: P0)
**Objective**: Implement real-time communication service.

**Files to Create**:
1. `frontend/src/services/websocket.service.ts` - WebSocket service (connect, disconnect, on, off, emit, isConnected)

**Validation**:
- [ ] Automatic reconnection
- [ ] Proper cleanup on disconnect
- [ ] Event-driven architecture

**Integration Points**:
- Used by hooks for real-time updates
- Integrated with stores for state sync

### Phase 5.3: Domain Services (Priority: P0)
**Objective**: Implement business logic services for each domain.

**Files to Create**:
1. `frontend/src/services/providers.service.ts` - Provider domain logic (getProviders, switchProvider, etc.)
2. `frontend/src/services/models.service.ts` - Models domain logic (getModels, getAvailableModels, etc.)
3. `frontend/src/services/credentials.service.ts` - Credentials domain logic
4. `frontend/src/services/chat.service.ts` - Chat domain logic (sendMessage, streamChat, etc.)
5. `frontend/src/services/chatService.ts` - Alternative chat service
6. `frontend/src/services/credentialsService.ts` - Alternative credentials service
7. `frontend/src/services/proxy.service.ts` - Proxy server management (getStatus, start, stop, etc.)

**Validation**:
- [ ] Clear separation of concerns
- [ ] Business logic abstracted from UI
- [ ] Proper error handling

**Integration Points**:
- Use api.service for HTTP calls
- Used by hooks for business operations
- Encapsulate domain-specific logic

**Folder Structure After Phase 5**:
```
frontend/src/
├── services/
│   ├── api.service.ts
│   ├── websocket.service.ts
│   ├── providers.service.ts
│   ├── models.service.ts
│   ├── credentials.service.ts
│   ├── chat.service.ts
│   ├── chatService.ts
│   ├── credentialsService.ts
│   └── proxy.service.ts
```

## Code Documentation Reference
Complete source code for Phase 5 is available in [`05_FRONTEND_CODE_PHASES_4-5.md`](../code_examples/05_FRONTEND_CODE_PHASES_4-5.md)

## Success Criteria
- [ ] All API interactions centralized in services
- [ ] Domain logic properly abstracted
- [ ] Real-time WebSocket functionality integrated