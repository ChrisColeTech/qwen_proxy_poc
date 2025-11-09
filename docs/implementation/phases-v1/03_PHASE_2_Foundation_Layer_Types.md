# Phase 2: Foundation Layer - Types

## Overview
This phase establishes the comprehensive type system for the entire application, following Domain-Driven Design principles. All types are defined before any services, stores, or hooks to ensure type safety throughout development.

**Priority**: P0  
**Files Created**: 10
**Files Modified**: 0  
**Description**: Complete type system for domain-driven design

## Subphases

### Phase 2.1: Common & Domain Types (Priority: P0)
**Objective**: Create core type definitions for shared types and domain models.

**Files to Create**:
1. `frontend/src/types/common.types.ts` - Shared utility types (Route, APIResponse, Platform, Theme, SidebarPosition)
2. `frontend/src/types/providers.types.ts` - Provider domain types (Provider, ProviderConfig)
3. `frontend/src/types/models.types.ts` - Model domain types (Model, ParsedModel, Capability, CapabilityFilter)
4. `frontend/src/types/credentials.types.ts` - Credentials domain types (QwenCredentials, CredentialsStatus)
5. `frontend/src/types/proxy.types.ts` - Proxy server types (ProxyStatus, ProxyStatusResponse, WsProxyStatus)
6. `frontend/src/types/chat.types.ts` - Chat functionality types (ChatMessage, ChatRequest, ChatResponse, ChatStreamChunk, ParsedChatResponse)

**Validation**:
- [ ] All types properly exported
- [ ] No circular dependencies
- [ ] Comprehensive domain coverage

**Integration Points**:
- Will be imported by all services, stores, hooks
- Foundation for type-safe development

### Phase 2.2: Component & Feature Types (Priority: P0)
**Objective**: Create types for UI components and page-specific functionality.

**Files to Create**:
1. `frontend/src/types/components.types.ts` - UI component prop types (ActionItem, TabDefinition, StatusIndicatorProps, StatusBadgeProps)
2. `frontend/src/types/home.types.ts` - Home page specific types (SystemFeature, ProxyStatusDisplay)
3. `frontend/src/types/quick-guide.types.ts` - Quick guide component types (ModelsStepProps, ProviderSwitchStepProps)
4. `frontend/src/types/index.ts` - Central type barrel export

**Validation**:
- [ ] All types exported from index.ts
- [ ] No duplicate type definitions
- [ ] Component types cover all UI needs

**Integration Points**:
- Used by components for props validation
- Used by pages for data structures
- Used by hooks for return types

### Phase 2.3: Type System Integration (Priority: P0)
**Objective**: Validate and integrate the complete type system.

**Validation Checklist**:
- [ ] All 10 type files created
- [ ] All types properly exported from index.ts
- [ ] No circular dependencies
- [ ] TypeScript compilation succeeds
- [ ] No `any` types used

**Folder Structure After Phase 2**:
```
frontend/src/
├── types/
│   ├── common.types.ts
│   ├── providers.types.ts
│   ├── models.types.ts
│   ├── credentials.types.ts
│   ├── proxy.types.ts
│   ├── chat.types.ts
│   ├── components.types.ts
│   ├── home.types.ts
│   ├── quick-guide.types.ts
│   └── index.ts
```

## Code Documentation Reference
Complete source code for Phase 2 is available in [`04_FRONTEND_CODE_PHASES_1-3.md`](../code_examples/04_FRONTEND_CODE_PHASES_1-3.md)

## Success Criteria
- [ ] Type system provides full coverage for all domains
- [ ] Central barrel export enables easy imports
- [ ] No type errors in subsequent phases