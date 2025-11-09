# Phase 3: Foundation Layer - Utilities

## Overview
This phase creates reusable utility functions that follow the DRY principle. These utilities provide foundational helper functions used throughout the application, from data formatting to platform detection.

**Priority**: P0  
**Files Created**: 7  
**Files Modified**: 0  
**Description**: Reusable utilities following DRY

## Subphases

### Phase 3.1: Core Utilities (Priority: P0)
**Objective**: Create reusable utility functions following DRY principle.

**Files to Create**:
1. `frontend/src/utils/platform.ts` - Platform detection utilities (isElectron, isBrowser, getPlatform)
2. `frontend/src/utils/formatters.ts` - Data formatting functions (formatUptime, formatTimestamp, formatTimeRemaining)
3. `frontend/src/utils/validators.ts` - Input validation utilities (isValidUrl, isValidPort, isValidModelId)

**Validation**:
- [ ] All functions are pure (no side effects)
- [ ] Proper TypeScript typing
- [ ] Functions are testable

**Integration Points**:
- Used by hooks for data transformation
- Used by components for display formatting
- Used by services for validation

### Phase 3.2: Library Utilities (Priority: P0)
**Objective**: Create library helper functions (cn utility, constants, routing, API examples).

**Files to Create**:
1. `frontend/src/lib/utils.ts` - Tailwind cn() utility
2. `frontend/src/lib/constants.ts` - Application-wide constants (APP_NAME, API_BASE_URL, poll intervals, heights)
3. `frontend/src/lib/router.ts` - Simple routing utilities for param extraction
4. `frontend/src/lib/api-guide-examples.ts` - Code examples for API guide (Python, Node.js, cURL examples)

**Validation**:
- [ ] cn() utility works with Tailwind classes
- [ ] Constants properly typed and exported
- [ ] Router utilities work for path matching
- [ ] API examples are complete and accurate

**Integration Points**:
- Used by all UI components (cn utility)
- Used throughout app for consistent values (constants)
- Used for future dynamic routing needs (router)
- Used by API guide pages (examples)

**Folder Structure After Phase 3**:
```
frontend/src/
├── utils/
│   ├── platform.ts
│   ├── formatters.ts
│   └── validators.ts
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   ├── router.ts
│   └── api-guide-examples.ts
```

## Code Documentation Reference
Complete source code for Phase 3 is available in [`04_FRONTEND_CODE_PHASES_1-3.md`](../code_examples/04_FRONTEND_CODE_PHASES_1-3.md)

## Success Criteria
- [ ] Utilities are reusable and follow DRY principle
- [ ] No duplication of logic in later phases
- [ ] All utilities properly typed and tested