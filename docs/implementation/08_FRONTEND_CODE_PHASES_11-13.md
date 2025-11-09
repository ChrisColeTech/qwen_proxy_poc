# Frontend V3 Rewrite - Phases 11-13 Code Documentation

This document contains the complete, verbatim source code for **Phases 11, 12, and 13** of the Frontend V3 Rewrite Implementation Plan.

## Table of Contents

- [Phase 11: Pages](#phase-11-pages)
- [Phase 12: Application Entry & Routing](#phase-12-application-entry--routing)
- [Phase 13: Styling System](#phase-13-styling-system)

---

## Phase 11: Pages

**Priority**: P1 (Can start after Phases 7, 8, 9, 10 complete)

This phase implements all 9 main application pages following the architecture pattern: **Pages → Hooks → Feature Components → Constants**.

### src/pages/HomePage.tsx

**File**: `frontend/src/pages/HomePage.tsx` (102 lines)

```typescript
import { Activity } from 'lucide-react';
import { TabCard } from '@/components/ui/tab-card';
import { ActionList } from '@/components/ui/action-list';
import { useHomePage } from '@/hooks/useHomePage';
import { useApiGuidePage } from '@/hooks/useApiGuidePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { useUIStore } from '@/stores/useUIStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { StatusTab } from '@/components/features/home/StatusTab';
import {
  buildOverviewActions,
  HOME_TABS,
  HOME_TITLE,
  SYSTEM_OVERVIEW_TITLE,
  SYSTEM_OVERVIEW_ICON
} from '@/constants/home.constants';

export function HomePage() {
  const {
    wsProxyStatus,
    proxyLoading,
    handleStartProxy,
    handleStopProxy,
    handleQwenLogin,
  } = useHomePage();

  const { baseUrl, copiedUrl, handleCopyUrl } = useApiGuidePage();
  const { extensionDetected, needsExtension } = useExtensionDetection();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const lifecycleState = useLifecycleStore((state) => state.state);
  const settings = useSettingsStore((state) => state.settings);

  const running = wsProxyStatus?.providerRouter?.running || false;
  const port = wsProxyStatus?.providerRouter?.port;
  const uptime = wsProxyStatus?.providerRouter?.uptime;
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const expiresAt = wsProxyStatus?.credentials?.expiresAt;
  const activeProvider = settings.active_provider as string || 'None';
  const activeModel = settings.active_model as string || 'None';

  const handleProxyClick = () => {
    if (proxyLoading) return;
    if (running) {
      handleStopProxy();
    } else {
      handleStartProxy();
    }
  };

  const handleExtensionClick = () => {
    setCurrentRoute('/browser-guide');
  };

  const overviewActions = buildOverviewActions({
    extensionDetected,
    needsExtension,
    credentialsValid,
    expiresAt,
    running,
    port,
    uptime,
    lifecycleState,
    proxyLoading,
    handleExtensionClick,
    handleQwenLogin,
    handleProxyClick
  });

  const tabs = [
    {
      ...HOME_TABS.OVERVIEW,
      content: <ActionList title={SYSTEM_OVERVIEW_TITLE} icon={SYSTEM_OVERVIEW_ICON} items={overviewActions} />
    },
    {
      ...HOME_TABS.STATUS,
      content: (
        <StatusTab
          port={port}
          activeProvider={activeProvider}
          activeModel={activeModel}
          baseUrl={baseUrl}
          copiedUrl={copiedUrl}
          onCopyUrl={handleCopyUrl}
        />
      ),
      hidden: !running
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={HOME_TITLE}
        icon={Activity}
        tabs={tabs}
        defaultTab={HOME_TABS.OVERVIEW.value}
      />
    </div>
  );
}
```

---

### src/pages/ProvidersPage.tsx

**File**: `frontend/src/pages/ProvidersPage.tsx` (88 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useProvidersPage } from '@/hooks/useProvidersPage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ProviderSwitchTab } from '@/components/features/providers/ProviderSwitchTab';
import { AllProvidersTab } from '@/components/features/providers/AllProvidersTab';
import { ProviderTestWrapper } from '@/components/features/providers/ProviderTestWrapper';
import {
  buildProviderActions,
  buildProviderSwitchActions,
  PROVIDERS_TABS,
  PROVIDERS_TITLE,
  PROVIDERS_ICON
} from '@/constants/providers.constants';

export function ProvidersPage() {
  const {
    providers,
    activeProvider,
    handleProviderSwitch
  } = useProvidersPage();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

  const handleProviderClickNavigate = (providerId: string) => {
    // Navigate to provider details page
    setCurrentRoute(`/providers/${providerId}`);
  };

  const handleAddProvider = () => {
    // Navigate to create provider page
    setCurrentRoute('/providers/new');
  };

  const switchActions = buildProviderSwitchActions({
    providers,
    activeProvider,
    onSwitch: handleProviderSwitch
  });

  const providerActions = buildProviderActions({
    providers,
    activeProvider,
    handleProviderClick: handleProviderClickNavigate,
  });

  const provider = providers.find(p => p.id === activeProvider);
  const providerName = provider?.name || 'Unknown Provider';

  const tabs = [
    {
      ...PROVIDERS_TABS.SWITCH,
      content: <ProviderSwitchTab switchActions={switchActions} />
    },
    {
      ...PROVIDERS_TABS.ALL,
      content: (
        <AllProvidersTab
          providerActions={providerActions}
          onAddProvider={handleAddProvider}
        />
      )
    },
    {
      ...PROVIDERS_TABS.TEST,
      content: (
        <ProviderTestWrapper
          activeProvider={activeProvider}
          providerName={providerName}
          providerRouterUrl={providerRouterUrl || 'http://localhost:3001'}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={PROVIDERS_TITLE}
        icon={PROVIDERS_ICON}
        tabs={tabs}
        defaultTab={PROVIDERS_TABS.SWITCH.value}
        pageKey="/providers"
      />
    </div>
  );
}
```

---

### src/pages/ModelsPage.tsx

**File**: `frontend/src/pages/ModelsPage.tsx` (110 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ModelSelectTab } from '@/components/features/models/ModelSelectTab';
import { AllModelsTab } from '@/components/features/models/AllModelsTab';
import { ModelTestWrapper } from '@/components/features/models/ModelTestWrapper';
import {
  buildModelActions,
  buildModelSelectActions,
  MODELS_TABS,
  MODELS_TITLE,
  MODELS_ICON
} from '@/constants/models.constants';

export function ModelsPage() {
  const {
    filteredAvailableModels,
    filteredAllModels,
    activeModel,
    activeProvider,
    providersData,
    providers,
    capabilityFilter,
    providerFilter,
    searchQuery,
    allModelsSearchQuery,
    handleModelSelect,
    handleProviderSwitch,
    setCapabilityFilter,
    setProviderFilter,
    setSearchQuery,
    setAllModelsSearchQuery
  } = useModelsPage();
  const setCurrentRoute = useUIStore((state) => state.setCurrentRoute);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);

  const handleModelClickNavigate = (modelId: string) => {
    // Navigate to model details page
    setCurrentRoute(`/models/${encodeURIComponent(modelId)}`);
  };

  // Build action items for tabs
  const selectActions = buildModelSelectActions({
    models: filteredAvailableModels,
    activeModel,
    onSelect: handleModelSelect
  });

  const modelActions = buildModelActions({
    models: filteredAllModels,
    activeModel,
    handleModelClick: handleModelClickNavigate,
  });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: (
        <ModelSelectTab
          selectActions={selectActions}
          activeProvider={activeProvider}
          providers={providersData}
          searchQuery={searchQuery}
          onProviderChange={handleProviderSwitch}
          onSearchChange={setSearchQuery}
        />
      )
    },
    {
      ...MODELS_TABS.ALL,
      content: (
        <AllModelsTab
          modelActions={modelActions}
          capabilityFilter={capabilityFilter}
          providerFilter={providerFilter}
          providers={providers}
          searchQuery={allModelsSearchQuery}
          onCapabilityChange={setCapabilityFilter}
          onProviderChange={setProviderFilter}
          onSearchChange={setAllModelsSearchQuery}
        />
      )
    },
    {
      ...MODELS_TABS.TEST,
      content: (
        <ModelTestWrapper
          activeModel={activeModel}
          activeProvider={activeProvider}
          providers={providersData}
          providerRouterUrl={providerRouterUrl || 'http://localhost:3001'}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODELS_TITLE}
        icon={MODELS_ICON}
        tabs={tabs}
        defaultTab={MODELS_TABS.SELECT.value}
        pageKey="/models"
      />
    </div>
  );
}
```

---

### src/pages/SettingsPage.tsx

**File**: `frontend/src/pages/SettingsPage.tsx` (58 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useSettingsPage } from '@/hooks/useSettingsPage';
import { AppearanceTab } from '@/components/features/settings/AppearanceTab';
import { ProxyTab } from '@/components/features/settings/ProxyTab';
import { DebugTab } from '@/components/features/settings/DebugTab';
import {
  SETTINGS_TABS,
  SETTINGS_TITLE,
  SETTINGS_ICON
} from '@/constants/settings.constants';

export function SettingsPage() {
  const {
    uiState,
    handleThemeChange,
    handleSidebarPositionChange,
    handleStatusMessagesChange,
    handleStatusBarChange,
  } = useSettingsPage();

  const tabs = [
    {
      ...SETTINGS_TABS.APPEARANCE,
      content: (
        <AppearanceTab
          theme={uiState.theme}
          sidebarPosition={uiState.sidebarPosition}
          showStatusMessages={uiState.showStatusMessages}
          showStatusBar={uiState.showStatusBar}
          handleThemeChange={handleThemeChange}
          handleSidebarPositionChange={handleSidebarPositionChange}
          handleStatusMessagesChange={handleStatusMessagesChange}
          handleStatusBarChange={handleStatusBarChange}
        />
      )
    },
    {
      ...SETTINGS_TABS.PROXY,
      content: <ProxyTab />
    },
    {
      ...SETTINGS_TABS.DEBUG,
      content: <DebugTab />
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={SETTINGS_TITLE}
        icon={SETTINGS_ICON}
        tabs={tabs}
        defaultTab={SETTINGS_TABS.APPEARANCE.value}
      />
    </div>
  );
}
```

---

### src/pages/ChatPage.tsx

**File**: `frontend/src/pages/ChatPage.tsx` (45 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  buildCustomChatContent,
  buildCurlExamplesContent,
  CHAT_TABS,
  CHAT_TITLE,
  CHAT_ICON
} from '@/constants/chat.constants';

export function ChatPage() {
  const settings = useSettingsStore((state) => state.settings);
  const providerRouterUrl = useSettingsStore((state) => state.providerRouterUrl);
  const activeModel = (settings.active_model as string) || 'qwen3-max';

  const tabs = [
    {
      ...CHAT_TABS.CUSTOM,
      content: buildCustomChatContent({
        providerRouterUrl: providerRouterUrl || 'http://localhost:3001',
        activeModel
      })
    },
    {
      ...CHAT_TABS.CURL,
      content: buildCurlExamplesContent({
        providerRouterUrl: providerRouterUrl || 'http://localhost:3001',
        activeModel
      })
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={CHAT_TITLE}
        icon={CHAT_ICON}
        tabs={tabs}
        defaultTab={CHAT_TABS.CUSTOM.value}
        pageKey="/chat"
      />
    </div>
  );
}
```

---

### src/pages/BrowserGuidePage.tsx

**File**: `frontend/src/pages/BrowserGuidePage.tsx` (47 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useBrowserGuidePage } from '@/hooks/useBrowserGuidePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { useProxyStore } from '@/stores/useProxyStore';
import { BrowserGuideTab } from '@/components/features/browserGuide/BrowserGuideTab';
import {
  BROWSER_GUIDE_TABS,
  BROWSER_GUIDE_TITLE,
  BROWSER_GUIDE_ICON
} from '@/constants/browserGuide.constants';

/**
 * BrowserGuidePage - Shows Chrome extension installation instructions
 */
export function BrowserGuidePage() {
  useBrowserGuidePage();

  const { extensionDetected } = useExtensionDetection();
  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...BROWSER_GUIDE_TABS.GUIDE,
      content: (
        <BrowserGuideTab
          extensionInstalled={extensionDetected}
          credentialsValid={credentialsValid}
          proxyRunning={proxyRunning}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={BROWSER_GUIDE_TITLE}
        icon={BROWSER_GUIDE_ICON}
        tabs={tabs}
        defaultTab={BROWSER_GUIDE_TABS.GUIDE.value}
      />
    </div>
  );
}
```

---

### src/pages/DesktopGuidePage.tsx

**File**: `frontend/src/pages/DesktopGuidePage.tsx` (41 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useDesktopGuidePage } from '@/hooks/useDesktopGuidePage';
import { useProxyStore } from '@/stores/useProxyStore';
import { DesktopGuideTab } from '@/components/features/desktopGuide/DesktopGuideTab';
import {
  DESKTOP_GUIDE_TABS,
  DESKTOP_GUIDE_TITLE,
  DESKTOP_GUIDE_ICON
} from '@/constants/desktopGuide.constants';

export function DesktopGuidePage() {
  useDesktopGuidePage();

  const wsProxyStatus = useProxyStore((state) => state.wsProxyStatus);
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const proxyRunning = wsProxyStatus?.providerRouter?.running || false;

  const tabs = [
    {
      ...DESKTOP_GUIDE_TABS.GUIDE,
      content: (
        <DesktopGuideTab
          credentialsValid={credentialsValid}
          proxyRunning={proxyRunning}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={DESKTOP_GUIDE_TITLE}
        icon={DESKTOP_GUIDE_ICON}
        tabs={tabs}
        defaultTab={DESKTOP_GUIDE_TABS.GUIDE.value}
      />
    </div>
  );
}
```

---

### src/pages/ModelFormPage.tsx

**File**: `frontend/src/pages/ModelFormPage.tsx` (57 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useModelFormPage } from '@/hooks/useModelFormPage';
import { ModelDetailsTab } from '@/components/features/modelForm/ModelDetailsTab';
import { ModelFormActions } from '@/components/features/modelForm/ModelFormActions';
import {
  MODEL_FORM_TABS,
  MODEL_FORM_TITLE,
  MODEL_FORM_ICON
} from '@/constants/modelForm.constants';

export function ModelFormPage() {
  const { model, loading, settingDefault, handleSetAsDefault, handleBack } = useModelFormPage();

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading model...</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return null;
  }

  const tabs = [
    {
      ...MODEL_FORM_TABS.DETAILS,
      content: <ModelDetailsTab model={model} />,
      contentCardTitle: MODEL_FORM_TABS.DETAILS.label,
      contentCardIcon: MODEL_FORM_ICON,
      contentCardActions: (
        <ModelFormActions
          model={model}
          settingDefault={settingDefault}
          onBack={handleBack}
          onSetAsDefault={handleSetAsDefault}
        />
      )
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODEL_FORM_TITLE}
        icon={MODEL_FORM_ICON}
        tabs={tabs}
        defaultTab={MODEL_FORM_TABS.DETAILS.value}
        pageKey={`/models/${model.id}`}
      />
    </div>
  );
}
```

---

### src/pages/ProviderFormPage.tsx

**File**: `frontend/src/pages/ProviderFormPage.tsx` (87 lines)

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useProviderFormPage } from '@/hooks/useProviderFormPage';
import { ProviderFormContent } from '@/components/features/providerForm/ProviderFormContent';
import { ProviderFormActionsReadOnly } from '@/components/features/providerForm/ProviderFormActionsReadOnly';
import { ProviderFormActionsEdit } from '@/components/features/providerForm/ProviderFormActionsEdit';
import {
  PROVIDER_FORM_TABS,
  PROVIDER_FORM_TITLE_EDIT,
  PROVIDER_FORM_TITLE_CREATE,
  PROVIDER_FORM_ICON
} from '@/constants/providerForm.constants';

interface ProviderFormPageProps {
  readOnly?: boolean;
}

export function ProviderFormPage({ readOnly = false }: ProviderFormPageProps = {}) {
  const {
    isEditMode,
    loading,
    testing,
    formData,
    setFormData,
    handleSubmit,
    handleTest,
    handleConfigChange,
    handleReset,
    handleToggleEnabled,
    handleDelete,
    handleBack,
    handleEdit
  } = useProviderFormPage(readOnly);

  const formContent = (
    <ProviderFormContent
      formData={formData}
      isEditMode={isEditMode}
      readOnly={readOnly}
      setFormData={setFormData}
      handleConfigChange={handleConfigChange}
      handleSubmit={handleSubmit}
    />
  );

  const actions = readOnly ? (
    <ProviderFormActionsReadOnly
      loading={loading}
      enabled={formData.enabled}
      handleBack={handleBack}
      handleToggleEnabled={handleToggleEnabled}
      handleEdit={handleEdit}
      handleDelete={handleDelete}
    />
  ) : (
    <ProviderFormActionsEdit
      loading={loading}
      testing={testing}
      isEditMode={isEditMode}
      handleBack={handleBack}
      handleReset={handleReset}
      handleTest={handleTest}
      handleSubmit={handleSubmit}
    />
  );

  const tabs = [
    {
      ...PROVIDER_FORM_TABS.FORM,
      content: formContent,
      contentCardTitle: PROVIDER_FORM_TABS.FORM.label,
      contentCardIcon: PROVIDER_FORM_ICON,
      contentCardActions: actions
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={isEditMode ? PROVIDER_FORM_TITLE_EDIT : PROVIDER_FORM_TITLE_CREATE}
        icon={PROVIDER_FORM_ICON}
        tabs={tabs}
        defaultTab={PROVIDER_FORM_TABS.FORM.value}
      />
    </div>
  );
}
```

---

## Phase 12: Application Entry & Routing

**Priority**: P1 (Depends on Phase 11 complete)

This phase implements the application initialization and routing system.

### src/App.tsx

**File**: `frontend/src/App.tsx` (80 lines)

```typescript
import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from '@/pages/HomePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ProviderFormPage } from '@/pages/ProviderFormPage';
import { ModelsPage } from '@/pages/ModelsPage';
import { ModelFormPage } from '@/pages/ModelFormPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { BrowserGuidePage } from '@/pages/BrowserGuidePage';
import { DesktopGuidePage } from '@/pages/DesktopGuidePage';
import { useUIStore } from '@/stores/useUIStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

function App() {
  useDarkMode();
  useWebSocket(); // Initialize WebSocket connection at app level
  const currentRoute = useUIStore((state) => state.currentRoute);
  const loadSettings = useUIStore((state) => state.loadSettings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  // Load persisted UI state and settings on mount
  useEffect(() => {
    loadSettings();
    fetchSettings();
  }, [loadSettings, fetchSettings]);

  const renderPage = () => {
    // Handle provider routes with IDs
    if (currentRoute.startsWith('/providers/')) {
      const path = currentRoute.substring('/providers/'.length);
      if (path === 'new') {
        return <ProviderFormPage />;
      } else if (path.endsWith('/edit')) {
        return <ProviderFormPage />;
      } else {
        return <ProviderFormPage readOnly={true} />;
      }
    }

    // Handle model routes with IDs
    if (currentRoute.startsWith('/models/')) {
      return <ModelFormPage />;
    }

    switch (currentRoute) {
      case '/':
        return <HomePage />;
      case '/providers':
        return <ProvidersPage />;
      case '/models':
        return <ModelsPage />;
      case '/chat':
        return <ChatPage />;
      case '/settings':
        return <SettingsPage />;
      case '/browser-guide':
        return <BrowserGuidePage />;
      case '/desktop-guide':
        return <DesktopGuidePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <AppLayout>
        {renderPage()}
      </AppLayout>
      <Toaster />
    </>
  );
}

export default App;
```

---

### src/main.tsx

**File**: `frontend/src/main.tsx` (7 lines)

```typescript
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
```

---

## Phase 13: Styling System

**Priority**: P1 (Can be done in parallel with components)

This phase implements the CSS entry point that imports the complete styling system.

### src/index.css

**File**: `frontend/src/index.css` (14 lines)

```css
/* Foundational CSS - Structural and infrastructure styles */
@import './styles/styles.css';

@tailwind base;

@tailwind components;

@tailwind utilities;


/* Tailwind Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Note**: The complete `styles.css` file (which contains all custom styles organized by layer) is documented in `docs/implementation/09_FRONTEND_COMPLETE_CSS.md`.

The `index.css` file serves as the main CSS entry point and:
1. Imports the consolidated `styles.css` file containing all custom styles
2. Includes Tailwind CSS directives for base, components, and utilities layers

---

## Implementation Summary

### Phase 11: Pages (9 files)

All pages follow the same architectural pattern:

1. **Import hooks** for business logic (e.g., `useHomePage`, `useProvidersPage`)
2. **Import constants** for configuration (e.g., `HOME_TABS`, `PROVIDERS_TITLE`)
3. **Import feature components** for complex tab content
4. **Import UI components** (primarily `TabCard` for consistent layout)
5. **Call hooks** to get state and handlers
6. **Build data structures** using constant builder functions
7. **Render TabCard** with tabs array

**Page Files:**
- HomePage.tsx (102 lines) - Dashboard with system overview and status
- ProvidersPage.tsx (88 lines) - Provider management (switch, browse, test)
- ModelsPage.tsx (110 lines) - Model browsing and selection
- SettingsPage.tsx (58 lines) - Application settings
- ChatPage.tsx (45 lines) - Chat interface (custom chat and cURL examples)
- BrowserGuidePage.tsx (47 lines) - Chrome extension installation guide
- DesktopGuidePage.tsx (41 lines) - Desktop app installation guide
- ModelFormPage.tsx (57 lines) - Model details and actions
- ProviderFormPage.tsx (87 lines) - Provider form (create/edit/view modes)

### Phase 12: Application Entry (2 files)

**App.tsx (80 lines):**
- Initializes dark mode (`useDarkMode`)
- Initializes WebSocket connection (`useWebSocket`)
- Loads persisted UI state and settings on mount
- Implements client-side routing via switch statement
- Handles dynamic routes (`/providers/:id`, `/models/:id`)
- Renders `AppLayout` wrapper and global `Toaster`

**main.tsx (7 lines):**
- React 18 entry point
- Creates root and renders `<App />`
- Imports `index.css` for styles

### Phase 13: Styling (1 file + reference)

**index.css (14 lines):**
- Imports consolidated `styles.css`
- Includes Tailwind CSS directives

**Complete CSS Architecture:**
For the complete CSS file (`styles.css`) with all custom styles organized by layer, see:
`docs/implementation/09_FRONTEND_COMPLETE_CSS.md`

---

## Key Architectural Patterns

### 1. Page Component Pattern

**Pages → Hooks → Feature Components → Constants**

```typescript
// Example: ModelsPage.tsx
export function ModelsPage() {
  // 1. Call hook for business logic
  const { models, activeModel, handleModelSelect } = useModelsPage();

  // 2. Build data structures using constants
  const selectActions = buildModelSelectActions({ models, activeModel, onSelect: handleModelSelect });

  // 3. Render feature components with data
  return (
    <div className="page-container">
      <TabCard tabs={[
        { ...MODELS_TABS.SELECT, content: <ModelSelectTab actions={selectActions} /> }
      ]} />
    </div>
  );
}
```

### 2. Routing Pattern

**State-based routing** via Zustand (no React Router):
- Simple switch-case in `App.tsx`
- Dynamic routes handled via `startsWith()` checks
- Route state persisted in `useUIStore`

### 3. Initialization Pattern

**App-level initialization** in `App.tsx`:
1. Dark mode setup (`useDarkMode` hook)
2. WebSocket connection (`useWebSocket` hook)
3. Load persisted UI state (`loadSettings`)
4. Fetch backend settings (`fetchSettings`)

### 4. Tab-Based Layout Pattern

All pages use **TabCard component** for consistent layout:
- Tabs defined as arrays with `value`, `label`, `description`, `content`
- Optional `hidden` property for conditional tabs
- Optional `pageKey` for tab state persistence
- Optional `contentCardTitle`, `contentCardIcon`, `contentCardActions` for custom card headers

---

## Validation Checklist

### Phase 11: Pages
- [ ] All 9 pages render correctly
- [ ] Pages are thin (< 110 lines)
- [ ] No business logic in page components (moved to hooks)
- [ ] All tabs functional
- [ ] Proper loading/error states
- [ ] Navigation between pages works

### Phase 12: Application Entry
- [ ] App initializes correctly
- [ ] Routing works for all 9 pages
- [ ] Dynamic routes work (`/providers/:id`, `/models/:id`)
- [ ] Settings load on mount
- [ ] WebSocket connects successfully
- [ ] Theme applies correctly

### Phase 13: Styling
- [ ] CSS imports correctly
- [ ] Tailwind CSS compiled successfully
- [ ] Theme switching works (light/dark mode)
- [ ] All custom styles applied
- [ ] No style conflicts
- [ ] Responsive design functional

---

**Document Version:** 3.0
**Date:** November 9, 2025
**Status:** Complete - Updated with verbatim source code for Phases 11-13
**Related Documents**:
- 01_FRONTEND_V3_REWRITE_IMPLEMENTATION_PLAN.md
- 04_FRONTEND_CODE_PHASES_1-3.md
- 05_FRONTEND_CODE_PHASES_4-5.md
- 06_FRONTEND_CODE_PHASES_6-7.md
- 07_FRONTEND_CODE_PHASES_8-10.md
- 09_FRONTEND_COMPLETE_CSS.md
