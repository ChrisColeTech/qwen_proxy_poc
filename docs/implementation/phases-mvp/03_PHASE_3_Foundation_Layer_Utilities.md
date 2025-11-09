## Phase 3: Foundation Layer - Utilities

**Objective**: Create reusable utility functions following DRY principle.

### Files to Create:

**Core Utilities (2 files):**
1. `frontend/src/utils/platform.ts` - Platform detection (isElectron, isBrowser, getPlatform)
2. `frontend/src/utils/formatters.ts` - Data formatters (formatUptime, formatTimestamp, formatTimeRemaining)

**Library Utilities (4 files):**
3. `frontend/src/lib/utils.ts` - Tailwind `cn()` utility for class merging
4. `frontend/src/lib/constants.ts` - Application-wide constants (APP_NAME, API_BASE_URL, poll intervals, heights)
5. `frontend/src/lib/router.ts` - Simple routing utilities for param extraction
6. `frontend/src/lib/api-guide-examples.ts` - Code examples for API guide (Python, Node.js, cURL)

**Code Reference**: See Phase 3 in `docs/implementation/04_FRONTEND_CODE_PHASES_1-3.md`

**Validation:**
- Run `npm run build` - should succeed