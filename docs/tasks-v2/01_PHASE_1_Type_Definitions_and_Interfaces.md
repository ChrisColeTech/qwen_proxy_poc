# Phase 1: Type Definitions and Interfaces

**Priority:** P0 (Foundation)
**Dependencies:** None
**Blocks:** All subsequent phases

## Files to Create

```
frontend/src/types/
├── api.types.ts          # API request/response types
├── proxy.types.ts        # Proxy status, config types
├── credentials.types.ts  # Qwen credentials types
├── provider.types.ts     # Provider types
├── model.types.ts        # Model types
├── session.types.ts      # Session types
└── activity.types.ts     # Request/Response history types
```

## Files to Modify

- `frontend/src/types/index.ts` - Add exports for new types

## Type Definitions

**frontend/src/types/api.types.ts**
```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  services: {
    apiServer: boolean;
    providerRouter: boolean;
    qwenProxy: boolean;
  };
}

// Error response
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
```

**frontend/src/types/proxy.types.ts**
```typescript
export interface ProxyStatus {
  running: boolean;
  port: number;
  uptime?: number;
  requestCount?: number;
}

export interface ProxyConfig {
  port: number;
  autoStart: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

**frontend/src/types/credentials.types.ts**
```typescript
export interface QwenCredentials {
  token: string;
  cookies: string;
  expiresAt: number;
}

export interface CredentialStatus {
  hasCredentials: boolean;
  isValid: boolean;
  expiresAt?: number;
}
```

**frontend/src/types/provider.types.ts**
```typescript
export interface Provider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  priority: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProviderStats {
  providerId: string;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
}
```

**frontend/src/types/model.types.ts**
```typescript
export interface Model {
  id: string;
  name: string;
  providerId: string;
  displayName: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  enabled: boolean;
}

export interface ModelMapping {
  qwenModel: string;
  targetModel: string;
  providerId: string;
}
```

**frontend/src/types/session.types.ts**
```typescript
export interface Session {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  requestCount: number;
  active: boolean;
}
```

**frontend/src/types/activity.types.ts**
```typescript
export interface RequestLog {
  id: string;
  sessionId: string;
  timestamp: number;
  method: string;
  path: string;
  model: string;
  provider: string;
  statusCode: number;
  duration: number;
  tokenCount?: number;
}

export interface ActivityStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  tokenUsage: number;
}
```

## Integration Points

- `frontend/src/types/electron.types.ts` (existing)
- `frontend/src/types/index.ts` (existing)

## Structure After Phase 1

```
frontend/src/types/
├── index.ts
├── electron.types.ts      # ✅ Existing
├── api.types.ts           # 🆕 New
├── proxy.types.ts         # 🆕 New
├── credentials.types.ts   # 🆕 New
├── provider.types.ts      # 🆕 New
├── model.types.ts         # 🆕 New
├── session.types.ts       # 🆕 New
└── activity.types.ts      # 🆕 New
```

## Validation

- [ ] All types export correctly from `types/index.ts`
- [ ] TypeScript compilation passes
- [ ] No circular dependencies
