# Phase 4: Foundation Layer - Constants

## Overview
This phase centralizes all application constants and configurations, eliminating magic strings and ensuring consistency across the entire application. Constants are organized by domain and page for maintainability.

**Priority**: P0  
**Files Created**: 10  
**Files Modified**: 0  
**Description**: Application constants and configurations

## Subphases

### Phase 4.1: Page Constants (Priority: P0)
**Objective**: Centralize all page-level constants and tab configurations.

**Files to Create**:
1. `frontend/src/constants/home.constants.tsx` - Home page constants (tabs, icons, titles)
2. `frontend/src/constants/providers.constants.tsx` - Providers page constants
3. `frontend/src/constants/models.constants.tsx` - Models page constants
4. `frontend/src/constants/settings.constants.tsx` - Settings page constants
5. `frontend/src/constants/chat.constants.tsx` - Chat page constants

**Validation**:
- [ ] All constants properly typed
- [ ] No magic strings in components
- [ ] Tab configurations complete

### Phase 4.2: Guide Constants (Priority: P0)
**Objective**: Create constants for guide pages.

**Files to Create**:
1. `frontend/src/constants/apiGuide.constants.tsx` - API guide constants
2. `frontend/src/constants/browserGuide.constants.tsx` - Browser guide constants
3. `frontend/src/constants/desktopGuide.constants.tsx` - Desktop guide constants

**Validation**:
- [ ] Guide content properly structured
- [ ] Code examples formatted correctly

### Phase 4.3: Constants Integration (Priority: P0)
**Objective**: Create central constants barrel export.

**Files to Create**:
1. `frontend/src/constants/index.ts` - Constants barrel export

**Validation**:
- [ ] All constants accessible via single import
- [ ] No naming conflicts

**Folder Structure After Phase 4**:
```
frontend/src/
├── constants/
│   ├── home.constants.tsx
│   ├── providers.constants.tsx
│   ├── models.constants.tsx
│   ├── settings.constants.tsx
│   ├── chat.constants.tsx
│   ├── apiGuide.constants.tsx
│   ├── browserGuide.constants.tsx
│   ├── desktopGuide.constants.tsx
│   └── index.ts
```

## Code Documentation Reference
Complete source code for Phase 4 is available in [`05_FRONTEND_CODE_PHASES_4-5.md`](../code_examples/05_FRONTEND_CODE_PHASES_4-5.md)

## Success Criteria
- [ ] All constants centralized and typed
- [ ] No hardcoded values in components or hooks
- [ ] Easy maintenance through domain organization