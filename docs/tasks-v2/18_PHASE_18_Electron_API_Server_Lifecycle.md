# Phase 18: Electron API Server Lifecycle

**Priority:** P4 (Production Readiness)
**Dependencies:** None (backend must exist)
**Blocks:** None

## Files to Create

```
electron/src/
└── api-server-manager.ts    # API Server lifecycle management
```

## Files to Modify

- `electron/src/main.ts` - Add API Server spawning

## Content Summary

- Spawn API Server process on Electron startup
- Health check polling
- Process management (restart on crash)
- Graceful shutdown
- Logging integration

## Integration Points

- Backend API Server (must exist at `backend/api-server`)
- Node.js child_process
- Electron app lifecycle events

## Structure After Phase 18

```
electron/src/
├── main.ts                    # 🔧 Modified (spawn API server)
├── preload.ts                 # ✅ Existing
├── qwen-auth.ts               # ✅ From Phase 17
└── api-server-manager.ts      # 🆕 New
```

## Validation

- [ ] API Server starts on Electron startup
- [ ] Health check waits for server ready
- [ ] Window only opens after server ready
- [ ] Server shuts down gracefully on quit
- [ ] Production build works correctly
