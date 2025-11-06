# 53 - Models Page Plan

## Document Information
- **Document**: 53 - Models Page Plan
- **Version**: 1.0
- **Date**: November 5, 2025
- **Purpose**: Implementation plan for Models browsing page
- **Related**: Doc 56 (UX Guide), Doc 01A (Architecture Guide), Doc 29 (Provider Router)

---

## Work Progression

| Phase | Name | Priority | Status | Description |
|-------|------|----------|--------|-------------|
| 1 | Types & Services | Highest | Not Started | Type definitions and service verification |
| 2 | State Management | Highest | Not Started | Zustand store for models |
| 3 | UI Components | High | Not Started | Capability badges only |
| 4 | Page Assembly | Medium | Not Started | Page with shared CSS patterns |

---

## Page Mockup

```
┌──────────────────────────────────────────────────────────┐
│ Models                                              [↻]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [All Capabilities ▾]  [All Providers ▾]    12 models   │
│                                                          │
├────────────────┬────────────────┬────────────────────────┤
│ GPT-4          │ Qwen-Plus      │ Claude-3.5           │
│                │                │                      │
│ Most capable   │ High perf      │ Thoughtful AI        │
│ OpenAI model   │ Chinese+EN     │ assistant            │
│                │                │                      │
│ 💬 chat        │ 💬 chat        │ 💬 chat              │
│ 👁 vision      │ 🔧 tool-call   │ 👁 vision            │
│ 🔧 tool-call   │                │ 🔧 tool-call         │
│                │                │                      │
│ via OpenAI     │ via Qwen       │ via Anthropic        │
├────────────────┼────────────────┼──────────────────────┤
│ GPT-3.5-Turbo  │ Qwen-Turbo     │ Llama-3              │
│                │                │                      │
│ Fast/efficient │ Fastest        │ Open source          │
│                │                │                      │
│ 💬 chat        │ 💬 chat        │ 💬 chat              │
│ 🔧 tool-call   │                │                      │
│                │                │                      │
│ via OpenAI     │ via Qwen       │ via Ollama           │
└────────────────┴────────────────┴──────────────────────┘
```

---

## User Purpose

**Primary Questions**:
- What models can I use?
- Which models support vision? Tool calling?
- Which provider offers this model?

**User Actions**:
1. Browse available models
2. Filter by capability (chat, vision, tool-call)
3. Filter by provider
4. See model descriptions and capabilities

**What NOT to show**:
- ❌ Model creation/edit forms
- ❌ Model IDs or technical identifiers
- ❌ API documentation or curl examples
- ❌ Model testing/playground
- ❌ Performance benchmarks
- ❌ Pricing information

---

## Backend API Reference

**Verified from**: `/backend/provider-router/src/controllers/models-controller.js`

### GET /api/models
Query params:
- `capability`: Filter by capability (e.g., 'chat', 'vision')
- `provider`: Filter by provider ID

Response:
```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "description": "Most capable OpenAI model",
      "capabilities": ["chat", "vision", "tool-call"],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 12
}
```

### GET /api/models/:id
Response:
```json
{
  "model": {
    "id": "gpt-4",
    "name": "GPT-4",
    "description": "Most capable OpenAI model",
    "capabilities": ["chat", "vision", "tool-call"],
    "providers": ["openai", "azure"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## Phase 1: Types & Services

**Priority**: Highest

### Files to Create

```
src/types/models.types.ts
```

### Files to Verify

```
src/services/models.service.ts  [Should exist]
src/services/api.service.ts     [Integration]
```

### Type Definitions

**File**: `src/types/models.types.ts`

```typescript
export type ModelCapability = 'chat' | 'vision' | 'tool-call' | 'embedding';

export interface Model {
  id: string;
  name: string;
  description?: string;
  capabilities: ModelCapability[];
  providers?: string[];
  created_at: string;
  updated_at: string;
}

export interface ModelsResponse {
  models: Model[];
  total: number;
}

export interface ModelFilters {
  capability: ModelCapability | 'all';
  provider: string | 'all';
}
```

### File Tree

```
src/
├── types/
│   └── models.types.ts             [NEW]
└── services/
    ├── models.service.ts           [VERIFY]
    └── api.service.ts              [INTEGRATION]
```

---

## Phase 2: State Management

**Priority**: Highest

### Files to Create

```
src/stores/modelsStore.ts
src/hooks/useModels.ts
```

### Store Implementation

**File**: `src/stores/modelsStore.ts`

```typescript
import { create } from 'zustand';
import { modelsService } from '@/services/models.service';
import type { Model, ModelFilters } from '@/types/models.types';

interface ModelsStore {
  allModels: Model[];
  filteredModels: Model[];
  filters: ModelFilters;
  loading: boolean;
  error: string | null;

  fetchModels: () => Promise<void>;
  setFilters: (filters: Partial<ModelFilters>) => void;
  applyFilters: () => void;
}

export const useModelsStore = create<ModelsStore>((set, get) => ({
  allModels: [],
  filteredModels: [],
  filters: { capability: 'all', provider: 'all' },
  loading: false,
  error: null,

  fetchModels: async () => {
    try {
      set({ loading: true, error: null });
      const response = await modelsService.listModels();
      set({
        allModels: response.models,
        filteredModels: response.models,
        loading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch models',
        loading: false
      });
    }
  },

  setFilters: (newFilters: Partial<ModelFilters>) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters } });
    get().applyFilters();
  },

  applyFilters: () => {
    const { allModels, filters } = get();

    let filtered = allModels;

    // Filter by capability
    if (filters.capability !== 'all') {
      filtered = filtered.filter(model =>
        model.capabilities.includes(filters.capability as any)
      );
    }

    // Filter by provider
    if (filters.provider !== 'all') {
      filtered = filtered.filter(model =>
        model.providers?.includes(filters.provider)
      );
    }

    set({ filteredModels: filtered });
  }
}));
```

**File**: `src/hooks/useModels.ts`

```typescript
import { useEffect } from 'react';
import { useModelsStore } from '@/stores/modelsStore';

export const useModels = () => {
  const store = useModelsStore();

  useEffect(() => {
    store.fetchModels();
  }, []);

  return {
    models: store.filteredModels,
    allModels: store.allModels,
    filters: store.filters,
    loading: store.loading,
    error: store.error,
    setFilters: store.setFilters,
    refresh: store.fetchModels
  };
};
```

### File Tree

```
src/
├── stores/
│   └── modelsStore.ts              [NEW]
├── hooks/
│   └── useModels.ts                [NEW]
├── services/
│   └── models.service.ts           [INTEGRATION]
└── types/
    └── models.types.ts             [INTEGRATION]
```

---

## Phase 3: UI Components

**Priority**: High

### Files to Create

```
src/components/models/CapabilityBadge.tsx
src/components/models/ModelCard.tsx
src/components/models/FilterBar.tsx
```

### Component Specifications

**CapabilityBadge.tsx** - Shows capability with icon

```typescript
import type { ModelCapability } from '@/types/models.types';

const CAPABILITY_CONFIG: Record<ModelCapability, { icon: string; label: string }> = {
  chat: { icon: '💬', label: 'Chat' },
  vision: { icon: '👁', label: 'Vision' },
  'tool-call': { icon: '🔧', label: 'Tool Call' },
  embedding: { icon: '📊', label: 'Embedding' }
};

export function CapabilityBadge({ capability }: { capability: ModelCapability }) {
  const config = CAPABILITY_CONFIG[capability];

  return (
    <div className="capability-badge">
      <span className="capability-badge-icon">{config.icon}</span>
      <span className="capability-badge-label">{config.label}</span>
    </div>
  );
}
```

**ModelCard.tsx** - Individual model display card

```typescript
import { CapabilityBadge } from './CapabilityBadge';
import type { Model } from '@/types/models.types';

export function ModelCard({ model }: { model: Model }) {
  return (
    <div className="model-card">
      <div className="model-card-header">
        <h3 className="model-card-title">{model.name}</h3>
      </div>

      {model.description && (
        <p className="model-card-description">{model.description}</p>
      )}

      <div className="model-card-capabilities">
        {model.capabilities.map(cap => (
          <CapabilityBadge key={cap} capability={cap} />
        ))}
      </div>

      {model.providers && model.providers.length > 0 && (
        <div className="model-card-footer">
          <span className="model-card-provider-label">via</span>
          <span className="model-card-provider-list">
            {model.providers.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
```

**FilterBar.tsx** - Capability and provider filter controls

```typescript
import type { ModelCapability, ModelFilters } from '@/types/models.types';

export function FilterBar({
  filters,
  capabilities,
  providers,
  modelCount,
  onFilterChange
}: {
  filters: ModelFilters;
  capabilities: ModelCapability[];
  providers: string[];
  modelCount: number;
  onFilterChange: (filters: Partial<ModelFilters>) => void;
}) {
  return (
    <div className="filter-bar">
      <select
        className="filter-select"
        value={filters.capability}
        onChange={(e) => onFilterChange({ capability: e.target.value as any })}
      >
        <option value="all">All Capabilities</option>
        {capabilities.map(cap => (
          <option key={cap} value={cap}>
            {cap.charAt(0).toUpperCase() + cap.slice(1)}
          </option>
        ))}
      </select>

      <select
        className="filter-select"
        value={filters.provider}
        onChange={(e) => onFilterChange({ provider: e.target.value })}
      >
        <option value="all">All Providers</option>
        {providers.map(provider => (
          <option key={provider} value={provider}>
            {provider}
          </option>
        ))}
      </select>

      <span className="model-count">{modelCount} models</span>
    </div>
  );
}
```

### File Tree

```
src/
├── components/
│   └── models/
│       ├── CapabilityBadge.tsx     [NEW]
│       ├── ModelCard.tsx           [NEW]
│       └── FilterBar.tsx           [NEW]
├── hooks/
│   └── useModels.ts                [INTEGRATION]
└── types/
    └── models.types.ts             [INTEGRATION]
```

---

## Phase 4: Page Assembly

**Priority**: Medium

### Files to Create

```
src/pages/ModelsPage.tsx
```

### Files to Modify

```
src/index.css  (add models-specific styles)
```

### Files to Use

```
src/hooks/useModels.ts                      [Phase 2]
src/components/models/FilterBar.tsx         [Phase 3]
src/components/models/ModelCard.tsx         [Phase 3]
```

### Page Implementation

**File**: `src/pages/ModelsPage.tsx`

```typescript
import { useModels } from '@/hooks/useModels';
import { FilterBar } from '@/components/models/FilterBar';
import { ModelCard } from '@/components/models/ModelCard';
import type { ModelCapability } from '@/types/models.types';

export function ModelsPage() {
  const { models, allModels, filters, loading, error, setFilters, refresh } = useModels();

  // Get unique capabilities and providers for filters
  const capabilities: ModelCapability[] = ['chat', 'vision', 'tool-call', 'embedding'];
  const providers = [...new Set(allModels.flatMap(m => m.providers || []))];

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <div className="error-message">{error}</div>
          <button className="error-retry" onClick={refresh}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Models</h1>
        <button
          className="refresh-button"
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh"
        >
          ↻
        </button>
      </div>

      <FilterBar
        filters={filters}
        capabilities={capabilities}
        providers={providers}
        modelCount={models.length}
        onFilterChange={setFilters}
      />

      {/* Empty State */}
      {models.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No models found</div>
          <div className="empty-state-description">
            {allModels.length === 0
              ? 'No models configured. Add a provider to see models.'
              : 'No models match your filters. Try adjusting the filters above.'
            }
          </div>
        </div>
      ) : (
        /* Models Grid */
        <div className="models-grid">
          {models.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Page-Specific CSS

**File**: `src/index.css` (append - page-specific styles only)

```css
/* ============================================
   MODELS PAGE SPECIFIC
   Only styles unique to this page
   Note: Shared styles (.page-container, etc.)
   already defined in Proxy Status Page section
   ============================================ */

/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.filter-select {
  padding: 0.5rem 1rem;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--foreground);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:hover {
  border-color: var(--primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-bg);
}

.model-count {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

/* Models Grid */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .models-grid {
    grid-template-columns: 1fr;
  }
}

/* Model Card */
.model-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: box-shadow 0.2s;
}

.model-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.model-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.model-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
}

.model-card-description {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  margin: 0;
  line-height: 1.5;
}

/* Capabilities */
.model-card-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.capability-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: var(--secondary);
  color: var(--secondary-foreground);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.capability-badge-icon {
  font-size: 0.875rem;
}

.capability-badge-label {
  text-transform: capitalize;
}

/* Model Footer */
.model-card-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 1rem;
  margin-top: auto;
  border-top: 1px solid var(--border);
  font-size: 0.875rem;
}

.model-card-provider-label {
  color: var(--muted-foreground);
}

.model-card-provider-list {
  color: var(--foreground);
  font-weight: 500;
}
```

### File Tree

```
src/
├── pages/
│   └── ModelsPage.tsx              [NEW]
├── components/
│   └── models/
│       ├── CapabilityBadge.tsx     [INTEGRATION]
│       ├── ModelCard.tsx           [INTEGRATION]
│       └── FilterBar.tsx           [INTEGRATION]
├── hooks/
│   └── useModels.ts                [INTEGRATION]
└── index.css                       [MODIFIED]
```

---

## Architecture Compliance

### DRY (Don't Repeat Yourself)
- ✅ **Uses shared CSS** from Doc 51: `.page-container`, `.page-header`, `.error-state`, `.empty-state`
- ✅ **Only page-specific CSS** added (.models-grid, .model-card, .filter-bar, etc.)
- ✅ Client-side filtering (no duplicate API calls)
- ✅ CapabilityBadge reusable across pages

### SRP (Single Responsibility)
- ✅ CapabilityBadge: Shows capability with icon
- ✅ Page: Composition + filtering logic
- ✅ Store: State management and filtering

### No Inline Tailwind
- ✅ All styling via semantic CSS classes
- ✅ Shared styles in one place

### Theme Variables Only
- ✅ All colors via var(--foreground), var(--card), var(--border), etc.

---

## Related Documents

- **Doc 56**: UX Guide
- **Doc 01A**: Architecture Guide
- **Doc 29**: Provider Router

---

## Version History

- **v1.0**: Initial plan following shared CSS pattern from Docs 51 & 52 v3.0
