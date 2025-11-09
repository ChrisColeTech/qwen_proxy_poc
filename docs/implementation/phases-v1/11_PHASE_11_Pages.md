## Phase 11: Pages

**Objective**: Implement main application pages following the architecture pattern.

### Files to Create (9 pages):

**Core Pages:**
1. `frontend/src/pages/HomePage.tsx` - Dashboard with credentials, proxy status, quick guide
2. `frontend/src/pages/ProvidersPage.tsx` - Provider management (list, switch)
3. `frontend/src/pages/ModelsPage.tsx` - Model browsing (select, browse all, test)
4. `frontend/src/pages/SettingsPage.tsx` - Application settings
5. `frontend/src/pages/ChatPage.tsx` - Chat interface (cURL, custom chat)
6. `frontend/src/pages/ModelFormPage.tsx` - Model details/form
7. `frontend/src/pages/ProviderFormPage.tsx` - Provider details/form

**Guide Pages:**
8. `frontend/src/pages/BrowserGuidePage.tsx` - Browser extension installation guide
9. `frontend/src/pages/DesktopGuidePage.tsx` - Desktop app installation guide

**Code Reference**: See Phase 11 in `docs/implementation/08_FRONTEND_CODE_PHASES_11-13.md`

**Architecture Pattern (Pages → Hooks → Feature Components → Constants):**
```tsx
// Example: ModelsPage.tsx
import { useModelsPage } from '@/hooks/useModelsPage';
import { ModelSelectTab } from '@/components/features/models/ModelSelectTab';
import { buildModelActions, MODELS_TABS } from '@/constants/models.constants';

export function ModelsPage() {
  // 1. Call hook for business logic
  const { models, activeModel, handleModelSelect } = useModelsPage();

  // 2. Build data structures using constants
  const modelActions = buildModelActions({ models, activeModel, handleModelSelect });

  // 3. Render feature components with data
  return (
    <TabCard tabs={[
      { ...MODELS_TABS.SELECT, content: <ModelSelectTab actions={modelActions} /> }
    ]} />
  );
}
```

**Validation:**
- Run `npm run build` - should succeed