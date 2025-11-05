# Phase 3: API Service Layer

**Priority:** P0 (Foundation)
**Dependencies:** Phase 1, Phase 2
**Blocks:** Phase 5, Phase 6, Phase 7

## Files to Create

```
frontend/src/services/
└── api.service.ts    # HTTP API service
```

## Content

**frontend/src/services/api.service.ts**
```typescript
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '@/config/api';
import type {
  ApiResponse,
  HealthCheckResponse,
  ProxyStatus,
  ProxyConfig,
  QwenCredentials,
  Provider,
  Model,
  ModelMapping,
  Session,
  RequestLog,
  ActivityStats,
} from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health
  async checkHealth(): Promise<HealthCheckResponse> {
    const response = await this.client.get(API_CONFIG.endpoints.health);
    return response.data;
  }

  // Proxy management
  async startProxy(): Promise<ApiResponse<ProxyStatus>> {
    const response = await this.client.post(API_CONFIG.endpoints.proxyStart);
    return response.data;
  }

  async stopProxy(): Promise<ApiResponse<ProxyStatus>> {
    const response = await this.client.post(API_CONFIG.endpoints.proxyStop);
    return response.data;
  }

  async getProxyStatus(): Promise<ProxyStatus> {
    const response = await this.client.get(API_CONFIG.endpoints.proxyStatus);
    return response.data;
  }

  async updateProxyConfig(config: ProxyConfig): Promise<ApiResponse<ProxyConfig>> {
    const response = await this.client.put(API_CONFIG.endpoints.proxyConfig, config);
    return response.data;
  }

  // Credentials
  async getCredentials(): Promise<QwenCredentials | null> {
    const response = await this.client.get(API_CONFIG.endpoints.credentialsGet);
    return response.data;
  }

  async saveCredentials(credentials: QwenCredentials): Promise<ApiResponse<void>> {
    const response = await this.client.post(
      API_CONFIG.endpoints.credentialsSave,
      credentials
    );
    return response.data;
  }

  async deleteCredentials(): Promise<ApiResponse<void>> {
    const response = await this.client.delete(API_CONFIG.endpoints.credentialsDelete);
    return response.data;
  }

  // Providers
  async listProviders(): Promise<Provider[]> {
    const response = await this.client.get(API_CONFIG.endpoints.providersList);
    return response.data;
  }

  async createProvider(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<Provider> {
    const response = await this.client.post(API_CONFIG.endpoints.providersCreate, provider);
    return response.data;
  }

  async updateProvider(id: string, provider: Partial<Provider>): Promise<Provider> {
    const response = await this.client.put(
      API_CONFIG.endpoints.providersUpdate(id),
      provider
    );
    return response.data;
  }

  async deleteProvider(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(API_CONFIG.endpoints.providersDelete(id));
    return response.data;
  }

  // Models
  async listModels(): Promise<Model[]> {
    const response = await this.client.get(API_CONFIG.endpoints.modelsList);
    return response.data;
  }

  async syncModels(): Promise<ApiResponse<void>> {
    const response = await this.client.post(API_CONFIG.endpoints.modelsSync);
    return response.data;
  }

  async getModelMappings(): Promise<ModelMapping[]> {
    const response = await this.client.get(API_CONFIG.endpoints.modelMappings);
    return response.data;
  }

  // Sessions
  async listSessions(): Promise<Session[]> {
    const response = await this.client.get(API_CONFIG.endpoints.sessionsList);
    return response.data;
  }

  async deleteSession(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(API_CONFIG.endpoints.sessionsDelete(id));
    return response.data;
  }

  async cleanupSessions(): Promise<ApiResponse<void>> {
    const response = await this.client.post(API_CONFIG.endpoints.sessionsCleanup);
    return response.data;
  }

  // Activity
  async getRequestLogs(params?: { limit?: number; offset?: number }): Promise<RequestLog[]> {
    const response = await this.client.get(API_CONFIG.endpoints.activityRequests, {
      params,
    });
    return response.data;
  }

  async getActivityStats(): Promise<ActivityStats> {
    const response = await this.client.get(API_CONFIG.endpoints.activityStats);
    return response.data;
  }
}

export const apiService = new ApiService();
```

## Files to Modify

None

## Integration Points

- `frontend/src/config/api.ts` (Phase 2)
- `frontend/src/types/*` (Phase 1)

## Structure After Phase 3

```
frontend/src/
├── config/
│   └── api.ts            # ✅ From Phase 2
├── services/
│   └── api.service.ts    # 🆕 New
├── types/
│   └── ...               # ✅ From Phase 1
```

## Validation

- [ ] Service instantiates correctly
- [ ] All methods compile without errors
- [ ] Error handling works (try/catch in components)
