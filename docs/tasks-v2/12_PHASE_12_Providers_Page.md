# Phase 12: Providers Page (with Models as Child)

**Priority:** P3 (Pages)
**Dependencies:** Phase 3
**Blocks:** Phase 16

## Page Structure

**Providers** is a parent page that has **Models** as a child page. The ProvidersPage component routes between:
- ProvidersMainPage / MobileProvidersMainPage (main view)
- ModelsPage / MobileModelsPage (child view)

## Files to Create

```
frontend/src/pages/providers/
├── ProvidersPage.tsx              # Parent page router (handles mobile/desktop + child routing)
├── ProvidersMainPage.tsx          # Desktop main page (providers CRUD with 3x3 grid)
├── MobileProvidersMainPage.tsx    # Mobile main page (providers CRUD, single column)
├── ModelsPage.tsx                 # Desktop child page (models CRUD with 3x3 grid)
└── MobileModelsPage.tsx           # Mobile child page (models CRUD, single column)

frontend/src/components/features/providers/
├── ProviderList.tsx        # List of providers
├── ProviderForm.tsx        # Add/Edit provider form
└── ProviderCard.tsx        # Provider card component

frontend/src/components/features/models/
├── ModelList.tsx           # List of models
├── ModelMappingForm.tsx    # Model mapping form
└── ModelSyncButton.tsx     # Sync models button
```

## Content

**frontend/src/pages/providers/ProvidersPage.tsx** - Parent router:
```typescript
// Routes between mobile/desktop and parent/child pages
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppStore } from '@/stores/appStore';
import { ProvidersMainPage } from './ProvidersMainPage';
import { MobileProvidersMainPage } from './MobileProvidersMainPage';
import { ModelsPage } from './ModelsPage';
import { MobileModelsPage } from './MobileModelsPage';

export function ProvidersPage() {
  const currentChildPage = useAppStore((state) => state.currentChildPage);
  const isMobile = useIsMobile();

  // Determine which component to render
  let CurrentPageComponent;

  if (currentChildPage === "models") {
    CurrentPageComponent = isMobile ? MobileModelsPage : ModelsPage;
  } else {
    CurrentPageComponent = isMobile ? MobileProvidersMainPage : ProvidersMainPage;
  }

  return <CurrentPageComponent />;
}
```

**frontend/src/pages/providers/ProvidersMainPage.tsx** - Desktop 3x3 grid:
```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProviderList } from '@/components/features/providers/ProviderList';
import { useAppStore } from '@/stores/appStore';

export function ProvidersMainPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  // Desktop 3x3 grid layout
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '100px 1fr 100px',
      gridTemplateRows: '80px 1fr 80px',
      gap: '8px',
      minHeight: '100%'
    }}>
      {/* Top row */}
      <div>{/* Top Left placeholder */}</div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Providers</h1>
          <p className="text-muted-foreground">Manage API providers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentChildPage('models')}>
            View Models
          </Button>
          <Button>Add Provider</Button>
        </div>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left sidebar - filters */}</div>
      <div>
        <ProviderList />
      </div>
      <div>{/* Right sidebar - quick actions */}</div>

      {/* Bottom row */}
      <div>{/* Bottom Left placeholder */}</div>
      <div>{/* Pagination */}</div>
      <div>{/* Bottom Right placeholder */}</div>
    </div>
  );
}
```

**frontend/src/pages/providers/MobileProvidersMainPage.tsx** - Mobile:
```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProviderList } from '@/components/features/providers/ProviderList';
import { useAppStore } from '@/stores/appStore';

export function MobileProvidersMainPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Providers</h1>
        <p className="text-sm text-muted-foreground">Manage API providers</p>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => setCurrentChildPage('models')} size="sm">
          View Models
        </Button>
        <Button size="sm">Add Provider</Button>
      </div>

      <ProviderList />
    </div>
  );
}
```

**frontend/src/pages/providers/ModelsPage.tsx** - Desktop child with 3x3 grid:
```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModelList } from '@/components/features/models/ModelList';
import { ModelSyncButton } from '@/components/features/models/ModelSyncButton';
import { useAppStore } from '@/stores/appStore';

export function ModelsPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  // Desktop 3x3 grid layout
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '100px 1fr 100px',
      gridTemplateRows: '80px 1fr 80px',
      gap: '8px',
      minHeight: '100%'
    }}>
      {/* Top row */}
      <div>{/* Top Left placeholder */}</div>
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" onClick={() => setCurrentChildPage(null)}>
            ← Back to Providers
          </Button>
          <h1 className="text-3xl font-bold">Models</h1>
          <p className="text-muted-foreground">Manage models and mappings</p>
        </div>
        <div className="flex gap-2">
          <ModelSyncButton />
          <Button>Add Mapping</Button>
        </div>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left sidebar - filters */}</div>
      <div>
        <ModelList />
      </div>
      <div>{/* Right sidebar - quick actions */}</div>

      {/* Bottom row */}
      <div>{/* Bottom Left placeholder */}</div>
      <div>{/* Pagination */}</div>
      <div>{/* Bottom Right placeholder */}</div>
    </div>
  );
}
```

**frontend/src/pages/providers/MobileModelsPage.tsx** - Mobile child:
```typescript
import { Button } from '@/components/ui/button';
import { ModelList } from '@/components/features/models/ModelList';
import { ModelSyncButton } from '@/components/features/models/ModelSyncButton';
import { useAppStore } from '@/stores/appStore';

export function MobileModelsPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setCurrentChildPage(null)}>
        ← Back to Providers
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Models</h1>
        <p className="text-sm text-muted-foreground">Manage models</p>
      </div>

      <div className="flex gap-2">
        <ModelSyncButton />
        <Button size="sm">Add Mapping</Button>
      </div>

      <ModelList />
    </div>
  );
}
```

## Component Summary

Provider list with add/edit/delete functionality, provider status indicators, provider statistics display, model list grouped by provider, model mapping management, sync models from providers.

## Files to Modify

None

## Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/types/provider.types.ts` (Phase 1)
- `frontend/src/types/model.types.ts` (Phase 1)
- `frontend/src/stores/appStore.ts` (currentChildPage state)
- `frontend/src/hooks/useIsMobile.ts` (mobile/desktop detection)

## Structure After Phase 12

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx         # ✅ From Phase 10
│   │   ├── DashboardMainPage.tsx
│   │   └── MobileDashboardMainPage.tsx
│   ├── settings/
│   │   ├── SettingsPage.tsx          # ✅ From Phase 11
│   │   ├── SettingsMainPage.tsx
│   │   └── MobileSettingsMainPage.tsx
│   └── providers/                     # 🆕 New (Parent with child)
│       ├── ProvidersPage.tsx          # Parent router
│       ├── ProvidersMainPage.tsx      # Desktop main
│       ├── MobileProvidersMainPage.tsx # Mobile main
│       ├── ModelsPage.tsx             # Desktop child
│       └── MobileModelsPage.tsx       # Mobile child
├── components/
│   └── features/
│       ├── providers/        # 🆕 New
│       │   ├── ProviderList.tsx
│       │   ├── ProviderForm.tsx
│       │   └── ProviderCard.tsx
│       ├── models/           # 🆕 New
│       │   ├── ModelList.tsx
│       │   ├── ModelMappingForm.tsx
│       │   └── ModelSyncButton.tsx
│       ├── proxy/
│       └── credentials/
```

## Validation

- [ ] Can list all providers
- [ ] Can create new provider
- [ ] Can edit existing provider
- [ ] Can delete provider with confirmation
- [ ] Provider stats display correctly
- [ ] Can navigate to Models child page
- [ ] Models page displays correctly
- [ ] Can navigate back to Providers main page
- [ ] Mobile/desktop switching works for both pages
- [ ] Can list all models
- [ ] Can create model mappings
- [ ] Sync button fetches new models
- [ ] Models grouped by provider correctly
- [ ] 3x3 grid layout displays correctly on desktop for both pages
