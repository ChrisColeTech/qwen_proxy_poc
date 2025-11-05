# Phase 2: API Configuration

**Priority:** P0 (Foundation)
**Dependencies:** Phase 1
**Blocks:** Phase 3

## Files to Create

```
frontend/src/config/
└── api.ts    # API Server configuration
```

## Content

**frontend/src/config/api.ts**
```typescript
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  timeout: 10000, // 10 seconds

  endpoints: {
    // Health
    health: '/api/health',

    // Proxy management
    proxyStart: '/api/proxy/start',
    proxyStop: '/api/proxy/stop',
    proxyStatus: '/api/proxy/status',
    proxyConfig: '/api/proxy/config',

    // Credentials
    credentialsGet: '/api/qwen/credentials',
    credentialsSave: '/api/qwen/credentials',
    credentialsDelete: '/api/qwen/credentials',

    // Providers
    providersList: '/api/providers',
    providersCreate: '/api/providers',
    providersUpdate: (id: string) => `/api/providers/${id}`,
    providersDelete: (id: string) => `/api/providers/${id}`,
    providersStats: '/api/providers/stats',

    // Models
    modelsList: '/api/models',
    modelsSync: '/api/models/sync',
    modelMappings: '/api/models/mappings',
    modelMappingCreate: '/api/models/mappings',
    modelMappingDelete: (id: string) => `/api/models/mappings/${id}`,

    // Sessions
    sessionsList: '/api/sessions',
    sessionsActive: '/api/sessions/active',
    sessionsDelete: (id: string) => `/api/sessions/${id}`,
    sessionsCleanup: '/api/sessions/cleanup',

    // Activity
    activityRequests: '/api/activity/requests',
    activityStats: '/api/activity/stats',
  },
} as const;
```

## Files to Modify

None

## Integration Points

- Will be used by `services/api.service.ts` (Phase 3)

## Structure After Phase 2

```
frontend/src/
├── config/
│   └── api.ts            # 🆕 New
├── types/
│   └── ...               # ✅ From Phase 1
```

## Validation

- [ ] Environment variable support works
- [ ] Endpoint functions return correct paths
- [ ] Configuration imports correctly
