# Frontend CRUD Implementation Plan

**Document Version:** 2.0
**Backend API Base URL:** `http://localhost:3001/v1`
**Design Standard:** Icon-only buttons, full-screen forms, no headers/top buttons

---

## Work Progression Table

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | P0 | Pending | Core Type System and API Foundation |
| Phase 2 | P0 | Pending | Base API Services Layer |
| Phase 3 | P0 | Pending | Custom React Hooks for Data Fetching |
| Phase 4 | P0 | Pending | Utility Functions and Helpers |
| Phase 5 | P1 | Pending | Common UI Components - Part 1 (Buttons and Badges) |
| Phase 6 | P1 | Pending | Common UI Components - Part 2 (Form Fields) |
| Phase 7 | P1 | Pending | Common UI Components - Part 3 (Tables and Dialogs) |
| Phase 8 | P1 | Pending | Layout Components |
| Phase 9 | P2 | Pending | Providers List Page |
| Phase 10 | P2 | Pending | Providers Form Components |
| Phase 11 | P2 | Pending | Providers Create/Edit/Read Pages |
| Phase 12 | P2 | Pending | Provider-Model Linking |
| Phase 13 | P2 | Pending | Models List Page |
| Phase 14 | P2 | Pending | Models Form and CRUD Pages |
| Phase 15 | P2 | Pending | Sessions List and Read Pages |
| Phase 16 | P2 | Pending | Request Logs List and Read Pages |
| Phase 17 | P2 | Pending | Router Configuration and Integration |

---

## Phase 1: Core Type System and API Foundation (P0)

### Goal
Establish the complete TypeScript type system matching the exact backend API structure, providing type safety across the entire application.

### Files to Create
- `frontend/src/types/provider.types.ts`
- `frontend/src/types/model.types.ts`
- `frontend/src/types/session.types.ts`
- `frontend/src/types/request.types.ts`
- `frontend/src/types/api.types.ts`
- `frontend/src/types/common.types.ts`

### Files to Modify
None (foundation phase)

### Integration Points
None (foundation phase)

### Implementation Details

**Provider Types** (`provider.types.ts`):
```typescript
export type ProviderType = 'lm-studio' | 'qwen-proxy' | 'qwen-direct';

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  priority: number;
  description?: string;
  created_at: number;
  updated_at: number;
}

export interface CreateProviderRequest {
  id: string;
  name: string;
  type: ProviderType;
  enabled?: boolean;
  priority?: number;
  description?: string;
  config?: Record<string, any>;
}

export interface UpdateProviderRequest {
  name?: string;
  enabled?: boolean;
  priority?: number;
  description?: string;
}

export interface ProviderConfig {
  provider_id: string;
  config: Record<string, ConfigValue>;
}

export interface ConfigValue {
  value: string;
  is_sensitive?: boolean;
}

export interface ProviderTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
  error?: string;
}
```

**Model Types** (`model.types.ts`):
```typescript
export type ModelCapability = 'chat' | 'completion' | 'vision' | 'code' | 'tools' | string;

export interface Model {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  created_at: number;
  updated_at: number;
}

export interface CreateModelRequest {
  id: string;
  name: string;
  description?: string;
  capabilities?: string[];
}

export interface UpdateModelRequest {
  name?: string;
  description?: string;
  capabilities?: string[];
}

export interface ProviderModel {
  id: number;
  provider_id: string;
  model_id: string;
  is_default: boolean;
  config?: string;
  created_at: number;
  updated_at: number;
}

export interface ProviderModelView {
  model_id: string;
  model_name: string;
  is_default: boolean;
  config?: Record<string, any>;
}

export interface LinkModelRequest {
  model_id: string;
  is_default?: boolean;
  config?: Record<string, any>;
}
```

**Session Types** (`session.types.ts`):
```typescript
export interface Session {
  id: string;
  chat_id: string;
  parent_id?: string;
  first_user_message: string;
  message_count: number;
  created_at: number;
  last_accessed: number;
  expires_at: number;
}
```

**Request Types** (`request.types.ts`):
```typescript
export interface Request {
  id: number;
  session_id: string;
  request_id: string;
  timestamp: number;
  method: string;
  path: string;
  openai_request: string;
  qwen_request: string;
  model: string;
  stream: boolean;
  created_at: number;
}

export interface Response {
  id: number;
  request_id: number;
  session_id: string;
  response_id: string;
  timestamp: number;
  qwen_response?: string;
  openai_response?: string;
  parent_id?: string;
  completion_tokens?: number;
  prompt_tokens?: number;
  total_tokens?: number;
  finish_reason?: string;
  error?: string;
  duration_ms?: number;
  created_at: number;
}

export interface RequestWithResponse {
  request: Request;
  response?: Response;
}
```

**API Types** (`api.types.ts`):
```typescript
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ListResponse<T> {
  items: T[];
  count: number;
  total?: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface HealthResponse {
  status: string;
  timestamp: number;
  uptime_seconds: number;
  version: string;
}
```

**Common Types** (`common.types.ts`):
```typescript
export interface FormMode {
  mode: 'create' | 'edit' | 'read';
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}
```

### File Structure After This Phase
```
frontend/src/
├── types/
│   ├── provider.types.ts
│   ├── model.types.ts
│   ├── session.types.ts
│   ├── request.types.ts
│   ├── api.types.ts
│   └── common.types.ts
```

---

## Phase 2: Base API Services Layer (P0)

### Goal
Create the core HTTP client and base API service with proper error handling, request/response interceptors, and type safety.

### Files to Create
- `frontend/src/services/api.service.ts`
- `frontend/src/services/error.service.ts`

### Files to Modify
None

### Integration Points
- Uses types from Phase 1

### Implementation Details

**API Service** (`api.service.ts`):
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '@/types/api.types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Server error occurred',
        code: error.response.data?.code,
        details: error.response.data,
      };
    } else if (error.request) {
      return {
        message: 'No response from server',
        code: 'NETWORK_ERROR',
      };
    } else {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
    }
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiService = new ApiService();
```

**Error Service** (`error.service.ts`):
```typescript
import { ApiError } from '@/types/api.types';

export class ErrorService {
  static getUserMessage(error: ApiError): string {
    const errorMessages: Record<string, string> = {
      'INVALID_INPUT': 'Please check your input and try again.',
      'NOT_FOUND': 'The requested resource was not found.',
      'DUPLICATE': 'A resource with this name or ID already exists.',
      'DATABASE_ERROR': 'A database error occurred. Please try again.',
      'PROVIDER_ERROR': 'Failed to communicate with provider.',
      'NETWORK_ERROR': 'Unable to connect to the server.',
    };

    return errorMessages[error.code || ''] || error.message;
  }

  static logError(error: ApiError, context?: string) {
    console.error(`[${context || 'API'}]`, error);
  }
}
```

### File Structure After This Phase
```
frontend/src/
├── types/
│   └── ...
├── services/
│   ├── api.service.ts
│   └── error.service.ts
```

---

## Phase 3: Custom React Hooks for Data Fetching (P0)

### Goal
Create reusable React hooks for all CRUD operations, providing consistent data fetching patterns with loading states and error handling.

### Files to Create
- `frontend/src/hooks/useProviders.ts`
- `frontend/src/hooks/useModels.ts`
- `frontend/src/hooks/useSessions.ts`
- `frontend/src/hooks/useRequests.ts`
- `frontend/src/hooks/useToast.ts`

### Files to Modify
None

### Integration Points
- Uses API services from Phase 2
- Uses types from Phase 1

### Implementation Details

**Provider Hooks** (`useProviders.ts`):
```typescript
import { useState, useEffect } from 'react';
import { Provider } from '@/types/provider.types';
import { providerService } from '@/services/provider.service';

export const useProviders = (filters?: { type?: string; enabled?: boolean }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await providerService.getAll(filters);
      setProviders(response.providers);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [filters?.type, filters?.enabled]);

  return { providers, loading, error, refetch: fetchProviders };
};

export const useProvider = (id: string) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true);
        const data = await providerService.getById(id);
        setProvider(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProvider();
    }
  }, [id]);

  return { provider, loading, error };
};
```

**Toast Hook** (`useToast.ts`):
```typescript
import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    duration = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};
```

### File Structure After This Phase
```
frontend/src/
├── types/
│   └── ...
├── services/
│   └── ...
├── hooks/
│   ├── useProviders.ts
│   ├── useModels.ts
│   ├── useSessions.ts
│   ├── useRequests.ts
│   └── useToast.ts
```

---

## Phase 4: Utility Functions and Helpers (P0)

### Goal
Create utility functions for validation, formatting, and common operations.

### Files to Create
- `frontend/src/utils/validation.ts`
- `frontend/src/utils/formatting.ts`
- `frontend/src/utils/slugify.ts`

### Files to Modify
None

### Integration Points
- Used by form components in later phases

### Implementation Details

**Validation Utilities** (`validation.ts`):
```typescript
export const validateSlug = (value: string): boolean => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
};

export const validateUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const getFieldError = (
  value: any,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
  }
): string | null => {
  if (rules.required && !validateRequired(value)) {
    return 'This field is required';
  }

  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }
  }

  if (rules.custom && !rules.custom(value)) {
    return 'Invalid value';
  }

  return null;
};
```

**Formatting Utilities** (`formatting.ts`):
```typescript
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
```

**Slugify Utility** (`slugify.ts`):
```typescript
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const autoSlugify = (name: string): string => {
  return slugify(name);
};
```

### File Structure After This Phase
```
frontend/src/
├── types/
│   └── ...
├── services/
│   └── ...
├── hooks/
│   └── ...
├── utils/
│   ├── validation.ts
│   ├── formatting.ts
│   └── slugify.ts
```

---

## Phase 5: Common UI Components - Part 1 (Buttons and Badges) (P1)

### Goal
Create reusable icon button and badge components following the golden standard design.

### Files to Create
- `frontend/src/components/common/IconButton.tsx`
- `frontend/src/components/common/Badge.tsx`
- `frontend/src/components/common/FAB.tsx`

### Files to Modify
None

### Integration Points
- Will be used by all list and form pages

### Implementation Details

**IconButton Component**:
```typescript
import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  onClick,
  tooltip,
  disabled,
  variant = 'default',
  size = 'md',
}) => {
  // Implementation with hover tooltip
};
```

**Badge Component**:
```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
}) => {
  // Color-coded badge implementation
};
```

### File Structure After This Phase
```
frontend/src/
├── components/
│   ├── common/
│   │   ├── IconButton.tsx
│   │   ├── Badge.tsx
│   │   └── FAB.tsx
```

---

## Phase 6: Common UI Components - Part 2 (Form Fields) (P1)

### Goal
Create reusable form field components with validation and error display.

### Files to Create
- `frontend/src/components/forms/FormField.tsx`
- `frontend/src/components/forms/TextInput.tsx`
- `frontend/src/components/forms/TextArea.tsx`
- `frontend/src/components/forms/Select.tsx`
- `frontend/src/components/forms/MultiSelect.tsx`
- `frontend/src/components/forms/Toggle.tsx`
- `frontend/src/components/forms/NumberInput.tsx`
- `frontend/src/components/forms/URLInput.tsx`
- `frontend/src/components/forms/PasswordInput.tsx`

### Files to Modify
None

### Integration Points
- Uses validation utilities from Phase 4
- Will be used by all form pages

### File Structure After This Phase
```
frontend/src/
├── components/
│   ├── common/
│   │   └── ...
│   ├── forms/
│   │   ├── FormField.tsx
│   │   ├── TextInput.tsx
│   │   ├── TextArea.tsx
│   │   ├── Select.tsx
│   │   ├── MultiSelect.tsx
│   │   ├── Toggle.tsx
│   │   ├── NumberInput.tsx
│   │   ├── URLInput.tsx
│   │   └── PasswordInput.tsx
```

---

## Phase 7: Common UI Components - Part 3 (Tables and Dialogs) (P1)

### Goal
Create table component with sorting, selection, and bulk operations, plus confirmation dialog.

### Files to Create
- `frontend/src/components/tables/DataTable.tsx`
- `frontend/src/components/tables/TableHeader.tsx`
- `frontend/src/components/tables/TableRow.tsx`
- `frontend/src/components/tables/BulkActionBar.tsx`
- `frontend/src/components/common/ConfirmDialog.tsx`
- `frontend/src/components/common/Toast.tsx`

### Files to Modify
None

### Integration Points
- Uses IconButton from Phase 5
- Uses Badge from Phase 5
- Uses common types from Phase 1

### File Structure After This Phase
```
frontend/src/
├── components/
│   ├── common/
│   │   ├── ...
│   │   ├── ConfirmDialog.tsx
│   │   └── Toast.tsx
│   ├── forms/
│   │   └── ...
│   ├── tables/
│   │   ├── DataTable.tsx
│   │   ├── TableHeader.tsx
│   │   ├── TableRow.tsx
│   │   └── BulkActionBar.tsx
```

---

## Phase 8: Layout Components (P1)

### Goal
Create page layout components for list and form pages.

### Files to Create
- `frontend/src/components/layouts/ListPageLayout.tsx`
- `frontend/src/components/layouts/FormPageLayout.tsx`

### Files to Modify
None

### Integration Points
- Uses existing AppLayout from Phase 0
- Will wrap all page components

### File Structure After This Phase
```
frontend/src/
├── components/
│   ├── common/
│   │   └── ...
│   ├── forms/
│   │   └── ...
│   ├── tables/
│   │   └── ...
│   ├── layouts/
│   │   ├── ListPageLayout.tsx
│   │   └── FormPageLayout.tsx
```

---

## Phase 9: Providers List Page (P2)

### Goal
Implement the providers list page with filtering, sorting, and bulk operations.

### Files to Create
- `frontend/src/pages/providers/ProvidersList.tsx`
- `frontend/src/services/provider.service.ts`

### Files to Modify
None

### Integration Points
- Uses DataTable from Phase 7
- Uses ListPageLayout from Phase 8
- Uses useProviders hook from Phase 3
- Uses provider.service from this phase

### Implementation Details

**Provider Service** (`provider.service.ts`):
```typescript
import { apiService } from './api.service';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '@/types/provider.types';

class ProviderService {
  async getAll(filters?: { type?: string; enabled?: boolean }) {
    return apiService.get<{ providers: Provider[]; count: number }>('/v1/providers', filters);
  }

  async getById(id: string) {
    return apiService.get<Provider>(`/v1/providers/${id}`);
  }

  async create(data: CreateProviderRequest) {
    return apiService.post<Provider>('/v1/providers', data);
  }

  async update(id: string, data: UpdateProviderRequest) {
    return apiService.put<Provider>(`/v1/providers/${id}`, data);
  }

  async delete(id: string) {
    return apiService.delete<{ message: string; id: string }>(`/v1/providers/${id}`);
  }

  async enable(id: string) {
    return apiService.post<{ message: string; id: string; enabled: true }>(
      `/v1/providers/${id}/enable`
    );
  }

  async disable(id: string) {
    return apiService.post<{ message: string; id: string; enabled: false }>(
      `/v1/providers/${id}/disable`
    );
  }

  async test(id: string) {
    return apiService.post<{ success: boolean; message: string }>(
      `/v1/providers/${id}/test`
    );
  }
}

export const providerService = new ProviderService();
```

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   └── ProvidersList.tsx
├── services/
│   ├── ...
│   └── provider.service.ts
```

---

## Phase 10: Providers Form Components (P2)

### Goal
Create provider-specific form components including config editor.

### Files to Create
- `frontend/src/pages/providers/components/ProviderForm.tsx`
- `frontend/src/pages/providers/components/ProviderConfigEditor.tsx`

### Files to Modify
None

### Integration Points
- Uses form components from Phase 6
- Uses validation utilities from Phase 4
- Uses provider types from Phase 1

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   ├── ProvidersList.tsx
│   │   └── components/
│   │       ├── ProviderForm.tsx
│   │       └── ProviderConfigEditor.tsx
```

---

## Phase 11: Providers Create/Edit/Read Pages (P2)

### Goal
Implement provider create, edit, and read pages using the shared form component.

### Files to Create
- `frontend/src/pages/providers/ProvidersCreate.tsx`
- `frontend/src/pages/providers/ProvidersEdit.tsx`
- `frontend/src/pages/providers/ProvidersRead.tsx`

### Files to Modify
None

### Integration Points
- Uses ProviderForm from Phase 10
- Uses FormPageLayout from Phase 8
- Uses provider.service from Phase 9

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   ├── ProvidersList.tsx
│   │   ├── ProvidersCreate.tsx
│   │   ├── ProvidersEdit.tsx
│   │   ├── ProvidersRead.tsx
│   │   └── components/
│   │       ├── ProviderForm.tsx
│   │       └── ProviderConfigEditor.tsx
```

---

## Phase 12: Provider-Model Linking (P2)

### Goal
Add model linking functionality within provider pages.

### Files to Create
- `frontend/src/pages/providers/components/LinkedModelsSection.tsx`
- `frontend/src/pages/providers/components/LinkModelDialog.tsx`

### Files to Modify
- `frontend/src/pages/providers/ProvidersRead.tsx` (add linked models section)
- `frontend/src/services/provider.service.ts` (add model linking methods)

### Integration Points
- Uses provider-model API endpoints
- Integrates with ProvidersRead page

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   ├── ProvidersList.tsx
│   │   ├── ProvidersCreate.tsx
│   │   ├── ProvidersEdit.tsx
│   │   ├── ProvidersRead.tsx
│   │   └── components/
│   │       ├── ProviderForm.tsx
│   │       ├── ProviderConfigEditor.tsx
│   │       ├── LinkedModelsSection.tsx
│   │       └── LinkModelDialog.tsx
```

---

## Phase 13: Models List Page (P2)

### Goal
Implement models list page with filtering and search.

### Files to Create
- `frontend/src/pages/models/ModelsList.tsx`
- `frontend/src/services/model.service.ts`

### Files to Modify
None

### Integration Points
- Uses DataTable from Phase 7
- Uses ListPageLayout from Phase 8
- Uses useModels hook from Phase 3

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   └── ...
│   ├── models/
│   │   └── ModelsList.tsx
├── services/
│   ├── ...
│   └── model.service.ts
```

---

## Phase 14: Models Form and CRUD Pages (P2)

### Goal
Implement complete models CRUD functionality.

### Files to Create
- `frontend/src/pages/models/components/ModelForm.tsx`
- `frontend/src/pages/models/components/CapabilitiesSelector.tsx`
- `frontend/src/pages/models/ModelsCreate.tsx`
- `frontend/src/pages/models/ModelsEdit.tsx`
- `frontend/src/pages/models/ModelsRead.tsx`

### Files to Modify
None

### Integration Points
- Uses form components from Phase 6
- Uses model.service from Phase 13
- Uses FormPageLayout from Phase 8

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   └── ...
│   ├── models/
│   │   ├── ModelsList.tsx
│   │   ├── ModelsCreate.tsx
│   │   ├── ModelsEdit.tsx
│   │   ├── ModelsRead.tsx
│   │   └── components/
│   │       ├── ModelForm.tsx
│   │       └── CapabilitiesSelector.tsx
```

---

## Phase 15: Sessions List and Read Pages (P2)

### Goal
Implement sessions viewing functionality (read-only).

### Files to Create
- `frontend/src/pages/sessions/SessionsList.tsx`
- `frontend/src/pages/sessions/SessionsRead.tsx`
- `frontend/src/pages/sessions/components/RequestsTimeline.tsx`
- `frontend/src/services/session.service.ts`

### Files to Modify
None

### Integration Points
- Uses DataTable from Phase 7
- Uses session types from Phase 1
- Uses useSessions hook from Phase 3

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   └── ...
│   ├── models/
│   │   └── ...
│   ├── sessions/
│   │   ├── SessionsList.tsx
│   │   ├── SessionsRead.tsx
│   │   └── components/
│   │       └── RequestsTimeline.tsx
├── services/
│   ├── ...
│   └── session.service.ts
```

---

## Phase 16: Request Logs List and Read Pages (P2)

### Goal
Implement request logs viewing functionality (read-only).

### Files to Create
- `frontend/src/pages/requests/RequestsList.tsx`
- `frontend/src/pages/requests/RequestsRead.tsx`
- `frontend/src/pages/requests/components/JSONViewer.tsx`
- `frontend/src/pages/requests/components/RequestMetadata.tsx`
- `frontend/src/services/request.service.ts`

### Files to Modify
None

### Integration Points
- Uses DataTable from Phase 7
- Uses request types from Phase 1
- Uses useRequests hook from Phase 3

### File Structure After This Phase
```
frontend/src/
├── pages/
│   ├── providers/
│   │   └── ...
│   ├── models/
│   │   └── ...
│   ├── sessions/
│   │   └── ...
│   ├── requests/
│   │   ├── RequestsList.tsx
│   │   ├── RequestsRead.tsx
│   │   └── components/
│   │       ├── JSONViewer.tsx
│   │       └── RequestMetadata.tsx
├── services/
│   ├── ...
│   └── request.service.ts
```

---

## Phase 17: Router Configuration and Integration (P2)

### Goal
Configure React Router and integrate all pages into the application.

### Files to Create
- `frontend/src/routes/index.tsx`

### Files to Modify
- `frontend/src/App.tsx` (add router configuration)
- `frontend/src/components/layout/Sidebar.tsx` (add navigation links)

### Integration Points
- Integrates all pages from Phases 9-16
- Updates existing Sidebar with navigation

### Implementation Details

**Router Configuration**:
```typescript
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

// Import all pages
import ProvidersList from '@/pages/providers/ProvidersList';
import ProvidersCreate from '@/pages/providers/ProvidersCreate';
import ProvidersEdit from '@/pages/providers/ProvidersEdit';
import ProvidersRead from '@/pages/providers/ProvidersRead';
// ... more imports

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'providers', element: <ProvidersList /> },
      { path: 'providers/create', element: <ProvidersCreate /> },
      { path: 'providers/:id', element: <ProvidersRead /> },
      { path: 'providers/:id/edit', element: <ProvidersEdit /> },

      { path: 'models', element: <ModelsList /> },
      { path: 'models/create', element: <ModelsCreate /> },
      { path: 'models/:id', element: <ModelsRead /> },
      { path: 'models/:id/edit', element: <ModelsEdit /> },

      { path: 'sessions', element: <SessionsList /> },
      { path: 'sessions/:id', element: <SessionsRead /> },

      { path: 'requests', element: <RequestsList /> },
      { path: 'requests/:id', element: <RequestsRead /> },
    ],
  },
]);
```

### File Structure After This Phase
```
frontend/src/
├── routes/
│   └── index.tsx
├── App.tsx (modified)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx (modified)
│   │   └── ...
│   └── ...
├── pages/
│   ├── providers/
│   │   └── ...
│   ├── models/
│   │   └── ...
│   ├── sessions/
│   │   └── ...
│   └── requests/
│       └── ...
```

---

## Final Project Structure

```
frontend/
├── src/
│   ├── types/
│   │   ├── provider.types.ts
│   │   ├── model.types.ts
│   │   ├── session.types.ts
│   │   ├── request.types.ts
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── error.service.ts
│   │   ├── provider.service.ts
│   │   ├── model.service.ts
│   │   ├── session.service.ts
│   │   └── request.service.ts
│   ├── hooks/
│   │   ├── useProviders.ts
│   │   ├── useModels.ts
│   │   ├── useSessions.ts
│   │   ├── useRequests.ts
│   │   └── useToast.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── slugify.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── IconButton.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── FAB.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── Toast.tsx
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── TextInput.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── MultiSelect.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   ├── URLInput.tsx
│   │   │   └── PasswordInput.tsx
│   │   ├── tables/
│   │   │   ├── DataTable.tsx
│   │   │   ├── TableHeader.tsx
│   │   │   ├── TableRow.tsx
│   │   │   └── BulkActionBar.tsx
│   │   └── layouts/
│   │       ├── ListPageLayout.tsx
│   │       └── FormPageLayout.tsx
│   ├── pages/
│   │   ├── providers/
│   │   │   ├── ProvidersList.tsx
│   │   │   ├── ProvidersCreate.tsx
│   │   │   ├── ProvidersEdit.tsx
│   │   │   ├── ProvidersRead.tsx
│   │   │   └── components/
│   │   │       ├── ProviderForm.tsx
│   │   │       ├── ProviderConfigEditor.tsx
│   │   │       ├── LinkedModelsSection.tsx
│   │   │       └── LinkModelDialog.tsx
│   │   ├── models/
│   │   │   ├── ModelsList.tsx
│   │   │   ├── ModelsCreate.tsx
│   │   │   ├── ModelsEdit.tsx
│   │   │   ├── ModelsRead.tsx
│   │   │   └── components/
│   │   │       ├── ModelForm.tsx
│   │   │       └── CapabilitiesSelector.tsx
│   │   ├── sessions/
│   │   │   ├── SessionsList.tsx
│   │   │   ├── SessionsRead.tsx
│   │   │   └── components/
│   │   │       └── RequestsTimeline.tsx
│   │   └── requests/
│   │       ├── RequestsList.tsx
│   │       ├── RequestsRead.tsx
│   │       └── components/
│   │           ├── JSONViewer.tsx
│   │           └── RequestMetadata.tsx
│   ├── routes/
│   │   └── index.tsx
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

---

## Design Guidelines

### Golden Standard Design Principles

1. **Icon-Only Buttons**
   - All action buttons use icons only (no text labels)
   - Tooltips on hover to show action description
   - Consistent icon sizes (20-24px)
   - Large touch targets (40x40px minimum)

2. **Full-Screen Forms**
   - Forms occupy entire viewport
   - No headers or top navigation within forms
   - Bottom action bar with save/cancel buttons
   - Scrollable content area

3. **No Headers/Top Buttons**
   - List pages: Only page title, inline filters, and FAB
   - Form pages: Only back button and resource name
   - Actions always at bottom or inline with content

4. **Consistent Color System**
   - Success/Enabled: Green (#10b981)
   - Error/Disabled: Red (#ef4444)
   - Warning: Yellow (#f59e0b)
   - Info: Blue (#3b82f6)
   - Neutral: Gray (#6b7280)

5. **Badge Types**
   - Provider Type: Blue (lm-studio), Purple (qwen-proxy), Green (qwen-direct)
   - Status: Green (enabled), Gray (disabled)
   - Stream: Blue (true), Gray (false)

6. **Responsive Breakpoints**
   - Mobile: < 640px (card view)
   - Tablet: 640px - 1024px (adjusted table)
   - Desktop: > 1024px (full table)

---

## Best Practices

### Single Responsibility Principle (SRP)
- Each component has one clear purpose
- Services handle only API communication
- Hooks manage only data fetching/state
- Utilities contain only pure functions

### Don't Repeat Yourself (DRY)
- Shared form components used across all resources
- Common table component for all list pages
- Reusable hooks for data fetching patterns
- Centralized API client with interceptors

### Separation of Concerns
- Types separated from implementation
- API services separated from UI components
- Business logic in hooks, not components
- Validation logic in utility functions

### Type Safety
- All API responses typed
- Props interfaces for all components
- Generic types for reusable components
- Strict TypeScript configuration

---

## Environment Configuration

### Required Environment Variables
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001
```

---

## Testing Strategy

### Component Testing
- Test all form components with various inputs
- Test validation logic
- Test error states
- Test loading states

### Integration Testing
- Test complete CRUD workflows
- Test navigation between pages
- Test form submission and API calls
- Test error handling

### E2E Testing
- Test user journeys (create provider → link model)
- Test bulk operations
- Test filters and sorting
- Test responsive design

---

**End of Document**
