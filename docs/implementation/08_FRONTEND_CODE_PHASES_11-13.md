# Frontend V3 Rewrite - Phases 11-13 Code Documentation

This document contains the complete source code for **Phases 11, 12, and 13** of the Frontend V3 Rewrite Implementation Plan.

## Table of Contents

- [Phase 11: Pages](#phase-11-pages)
  - [Phase 11.1: Core Pages](#phase-111-core-pages)
  - [Phase 11.2: Guide Pages](#phase-112-guide-pages)
- [Phase 12: Application Entry & Routing](#phase-12-application-entry--routing)
  - [Phase 12.1: Application Root](#phase-121-application-root)
- [Phase 13: Styling System](#phase-13-styling-system)
  - [Phase 13.1: Base Styles](#phase-131-base-styles)
  - [Phase 13.2: Layout & Page Styles](#phase-132-layout--page-styles)
  - [Phase 13.3: Component Styles](#phase-133-component-styles)

---

## Phase 11: Pages

**Priority**: P1 (Can start after Phases 7, 8, 9, 10 complete)

This phase implements all main application pages, following the established patterns:
- Pages use **TabCard** component for consistent layout
- Business logic is encapsulated in **page-specific hooks**
- Content and configuration come from **constants files**
- Each page has exactly **one responsibility**

### Phase 11.1: Core Pages

#### HomePage.tsx

**File**: `frontend/src/pages/HomePage.tsx`

**Purpose**: Dashboard/home page showing system overview and quick actions

**Architecture**:
- Uses `useHomePage` hook for proxy status and control actions
- Uses `useApiGuidePage` hook for base URL display and copying
- Uses `useExtensionDetection` hook for Chrome extension status
- All content comes from `home.constants.tsx`
- Renders TabCard with dynamic tabs (Status tab only shown when proxy is running)

```typescript
import { Activity } from 'lucide-react';
import { TabCard } from '@/components/ui/tab-card';
import { ActionList } from '@/components/ui/action-list';
import { useHomePage } from '@/hooks/useHomePage';
import { useApiGuidePage } from '@/hooks/useApiGuidePage';
import { useExtensionDetection } from '@/hooks/useExtensionDetection';
import { useUIStore } from '@/stores/useUIStore';
import { useLifecycleStore } from '@/stores/useLifecycleStore';
import {
  buildOverviewActions,
  buildStatusTabContent,
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

  const running = wsProxyStatus?.providerRouter?.running || false;
  const port = wsProxyStatus?.providerRouter?.port;
  const uptime = wsProxyStatus?.providerRouter?.uptime;
  const credentialsValid = wsProxyStatus?.credentials?.valid || false;
  const expiresAt = wsProxyStatus?.credentials?.expiresAt;

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
      content: buildStatusTabContent(port, baseUrl, copiedUrl, handleCopyUrl),
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

#### ProvidersPage.tsx

**File**: `frontend/src/pages/ProvidersPage.tsx`

**Purpose**: Provider management page with switch, browse, and settings tabs

**Architecture**:
- Uses `useProvidersPage` hook for provider data and actions
- Three tabs: Switch (quick switch), All (browse all), Settings
- All content builders come from `providers.constants.tsx`

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useProvidersPage } from '@/hooks/useProvidersPage';
import {
  buildProviderActions,
  buildProviderSwitchActions,
  buildProviderSwitchContent,
  buildAllProvidersContent,
  buildSettingsContent,
  PROVIDERS_TABS,
  PROVIDERS_TITLE,
  PROVIDERS_ICON
} from '@/constants/providers.constants';

export function ProvidersPage() {
  const {
    providers,
    activeProvider,
    loading,
    handleProviderSwitch,
    handleProviderClick
  } = useProvidersPage();

  const switchActions = buildProviderSwitchActions({
    providers,
    activeProvider,
    onSwitch: handleProviderSwitch
  });

  const providerActions = buildProviderActions({
    providers,
    handleProviderClick
  });

  const tabs = [
    {
      ...PROVIDERS_TABS.SWITCH,
      content: buildProviderSwitchContent(switchActions)
    },
    {
      ...PROVIDERS_TABS.ALL,
      content: buildAllProvidersContent(providerActions)
    },
    {
      ...PROVIDERS_TABS.SETTINGS,
      content: buildSettingsContent()
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={PROVIDERS_TITLE}
        icon={PROVIDERS_ICON}
        tabs={tabs}
        defaultTab={PROVIDERS_TABS.SWITCH.value}
      />
    </div>
  );
}
```

---

#### ModelsPage.tsx

**File**: `frontend/src/pages/ModelsPage.tsx`

**Purpose**: Model browsing and selection page with filtering

**Architecture**:
- Uses `useModelsPage` hook for model data and filtering
- Three tabs: Select (available models), All (filtered browse), Favorites
- All content builders come from `models.constants.tsx`

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useModelsPage } from '@/hooks/useModelsPage';
import {
  buildModelActions,
  buildModelSelectActions,
  buildModelSelectContent,
  buildAllModelsContent,
  buildFavoritesContent,
  MODELS_TABS,
  MODELS_TITLE,
  MODELS_ICON
} from '@/constants/models.constants';

export function ModelsPage() {
  const {
    availableModels,
    filteredAllModels,
    activeModel,
    loadingAvailable,
    loadingAll,
    providers,
    capabilityFilter,
    providerFilter,
    handleModelSelect,
    handleModelClick,
    setCapabilityFilter,
    setProviderFilter
  } = useModelsPage();

  // First tab: Available models from Provider Router
  const selectActions = buildModelSelectActions({
    models: availableModels,
    activeModel,
    onSelect: handleModelSelect
  });

  // Second tab: All models from API Server (filtered)
  const modelActions = buildModelActions({
    models: filteredAllModels,
    handleModelClick
  });

  const tabs = [
    {
      ...MODELS_TABS.SELECT,
      content: buildModelSelectContent(selectActions)
    },
    {
      ...MODELS_TABS.ALL,
      content: buildAllModelsContent({
        modelActions,
        capabilityFilter,
        providerFilter,
        providers,
        onCapabilityChange: setCapabilityFilter,
        onProviderChange: setProviderFilter
      })
    },
    {
      ...MODELS_TABS.FAVORITES,
      content: buildFavoritesContent()
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={MODELS_TITLE}
        icon={MODELS_ICON}
        tabs={tabs}
        defaultTab={MODELS_TABS.SELECT.value}
      />
    </div>
  );
}
```

---

#### SettingsPage.tsx

**File**: `frontend/src/pages/SettingsPage.tsx`

**Purpose**: Application settings page

**Architecture**:
- Uses `useSettingsPage` hook for settings state and handlers
- Three tabs: Appearance, Proxy, Debug
- All content builders come from `settings.constants.tsx`

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useSettingsPage } from '@/hooks/useSettingsPage';
import {
  buildAppearanceContent,
  buildProxyContent,
  buildDebugContent,
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
  } = useSettingsPage();

  const tabs = [
    {
      ...SETTINGS_TABS.APPEARANCE,
      content: buildAppearanceContent({
        theme: uiState.theme,
        sidebarPosition: uiState.sidebarPosition,
        showStatusMessages: uiState.showStatusMessages,
        handleThemeChange,
        handleSidebarPositionChange,
        handleStatusMessagesChange,
      })
    },
    {
      ...SETTINGS_TABS.PROXY,
      content: buildProxyContent()
    },
    {
      ...SETTINGS_TABS.DEBUG,
      content: buildDebugContent()
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

#### ChatPage.tsx

**File**: `frontend/src/pages/ChatPage.tsx`

**Purpose**: Chat interface page for testing models

**Architecture**:
- Uses `useChatPage` hook for chat interactions
- Three tabs: Active, History, New
- All content builders come from `chat.constants.tsx`

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useChatPage } from '@/hooks/useChatPage';
import {
  buildChatActions,
  buildActiveChatContent,
  buildHistoryContent,
  buildNewChatContent,
  CHAT_TABS,
  CHAT_TITLE,
  CHAT_ICON
} from '@/constants/chat.constants';

export function ChatPage() {
  const { handleConversationClick } = useChatPage();

  const chatActions = buildChatActions({ handleConversationClick });

  const tabs = [
    {
      ...CHAT_TABS.ACTIVE,
      content: buildActiveChatContent(chatActions)
    },
    {
      ...CHAT_TABS.HISTORY,
      content: buildHistoryContent()
    },
    {
      ...CHAT_TABS.NEW,
      content: buildNewChatContent()
    }
  ];

  return (
    <div className="page-container">
      <TabCard
        title={CHAT_TITLE}
        icon={CHAT_ICON}
        tabs={tabs}
        defaultTab={CHAT_TABS.ACTIVE.value}
      />
    </div>
  );
}
```

---

### Phase 11.2: Guide Pages

#### BrowserGuidePage.tsx

**File**: `frontend/src/pages/BrowserGuidePage.tsx`

**Purpose**: Chrome extension installation guide

**Architecture**:
- Uses `useBrowserGuidePage` hook (minimal logic)
- Single tab with guide content
- All content comes from `browserGuide.constants.tsx`

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useBrowserGuidePage } from '@/hooks/useBrowserGuidePage';
import {
  buildBrowserGuideContent,
  BROWSER_GUIDE_TABS,
  BROWSER_GUIDE_TITLE,
  BROWSER_GUIDE_ICON
} from '@/constants/browserGuide.constants';

/**
 * BrowserGuidePage - Shows Chrome extension installation instructions
 */
export function BrowserGuidePage() {
  useBrowserGuidePage();

  const tabs = [
    {
      ...BROWSER_GUIDE_TABS.GUIDE,
      content: buildBrowserGuideContent()
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

#### DesktopGuidePage.tsx

**File**: `frontend/src/pages/DesktopGuidePage.tsx`

**Purpose**: Desktop application setup guide

**Architecture**:
- Uses `useDesktopGuidePage` hook (minimal logic)
- Single tab with guide content
- All content comes from `desktopGuide.constants.tsx`

```typescript
import { TabCard } from '@/components/ui/tab-card';
import { useDesktopGuidePage } from '@/hooks/useDesktopGuidePage';
import {
  buildDesktopGuideContent,
  DESKTOP_GUIDE_TABS,
  DESKTOP_GUIDE_TITLE,
  DESKTOP_GUIDE_ICON
} from '@/constants/desktopGuide.constants';

export function DesktopGuidePage() {
  useDesktopGuidePage();

  const tabs = [
    {
      ...DESKTOP_GUIDE_TABS.GUIDE,
      content: buildDesktopGuideContent()
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

## Phase 12: Application Entry & Routing

**Priority**: P1 (Depends on Phase 11 complete)

This phase implements the application initialization and routing system using Zustand for state-based routing (no React Router required).

### Phase 12.1: Application Root

#### App.tsx

**File**: `frontend/src/App.tsx`

**Purpose**: Main application component with routing logic

**Architecture**:
- Initializes dark mode via `useDarkMode` hook
- Initializes WebSocket connection via `useWebSocket` hook
- Loads UI settings and application settings on mount
- Uses `currentRoute` from `useUIStore` for simple state-based routing
- Renders appropriate page based on route
- Wraps everything in `AppLayout` component
- Includes `Toaster` component for toast notifications

```typescript
import { useEffect } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { HomePage } from '@/pages/HomePage';
import { ProvidersPage } from '@/pages/ProvidersPage';
import { ModelsPage } from '@/pages/ModelsPage';
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

#### main.tsx

**File**: `frontend/src/main.tsx`

**Purpose**: Application entry point

**Architecture**:
- Renders App component in React StrictMode
- Mounts to root element in index.html

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## Phase 13: Styling System

**Priority**: P1 (Can be done in parallel with components)

This phase implements the complete CSS architecture using Tailwind CSS with custom styles organized by layer.

### Phase 13.1: Base Styles

#### theme.css

**File**: `frontend/src/styles/base/theme.css`

**Purpose**: Theme CSS variables for light and dark modes

**Architecture**:
- Defines HSL color values for all theme variables
- Includes shadcn/ui color system
- Adds custom status colors (success, error, warning, info, neutral, purple)
- Provides dark mode overrides
- Sets global styles for border and body

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;

    /* Status colors */
    --status-success: 142 76% 36%;
    --status-info: 221 83% 53%;
    --status-warning: 45 93% 47%;
    --status-error: 0 84% 60%;
    --status-neutral: 0 0% 45%;
    --status-purple: 271 81% 56%;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;

    /* Status colors - dark mode */
    --status-success: 142 71% 45%;
    --status-info: 217 91% 60%;
    --status-warning: 45 93% 58%;
    --status-error: 0 72% 51%;
    --status-neutral: 0 0% 63%;
    --status-purple: 271 91% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: Inter, system-ui, sans-serif;
  }
}
```

---

#### index.css

**File**: `frontend/src/index.css`

**Purpose**: Main stylesheet entry point with modular imports

**Architecture**:
- Imports all CSS modules in correct order
- Includes Tailwind directives at the end
- Organizes imports by layer (base → utilities → layout → pages → features → components)

```css
/* Import custom component styles first */
@import './styles/icons.css';
@import './styles/home.css';
@import './styles/providers.css';
@import './styles/models.css';
@import './styles/credentials.css';
/* ============================================================================
   QWEN PROXY - MAIN STYLESHEET
   Architecture: Modular CSS organized by layer
   ============================================================================ */

/* IMPORTANT: All @import must come before @tailwind and any other CSS */

/* Base Styles - Theme variables and global resets */
@import './styles/base/theme.css';

/* Utility Classes - Common utilities used across the app */
@import './styles/utilities/common.css';

/* Layout Styles - Core layout components */
@import './styles/layout.css';

/* Page Styles - Page-level styling */
@import './styles/pages.css';
@import './styles/pages/providers.css';
@import './styles/pages/quick-guide.css';

/* Feature Component Styles - Domain-specific components */
@import './styles/system-features.css';
@import './styles/quick-guide.css';
@import './styles/api-guide.css';
@import './styles/chat-tabs.css';
@import './styles/chat-quick-test.css';
@import './styles/chat-custom.css';
@import './styles/chat-response.css';
@import './styles/chat-curl.css';
@import './styles/models2.css';

/* UI Component Styles - Reusable UI components */
@import './styles/ui-components.css';

/* Legacy Component Styles - To be refactored */
@import './styles/components/steps.css';
@import './styles/components/guide.css';

/* Tailwind Directives */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Phase 13.2: Layout & Page Styles

#### common.css (Utilities)

**File**: `frontend/src/styles/utilities/common.css`

**Purpose**: Common utility classes used throughout the application

**Key Features**:
- Status color utilities (success, info, warning, error, neutral, purple)
- Page layout utilities (page-container, page-card)
- Icon size utilities (icon-sm, icon-md, icon-lg)
- Card title utilities
- Spacing utilities (vspace-tight, vspace-sm, vspace-md, vspace-lg)
- Flex layout utilities
- Typography utilities
- Divider utilities

```css
@layer utilities {
  .status-success {
    color: hsl(var(--status-success));
  }
  .status-success-dot {
    background-color: hsl(var(--status-success));
  }
  .status-info {
    color: hsl(var(--status-info));
  }
  .status-info-dot {
    background-color: hsl(var(--status-info));
  }
  .status-warning {
    color: hsl(var(--status-warning));
  }
  .status-warning-dot {
    background-color: hsl(var(--status-warning));
  }
  .status-error {
    color: hsl(var(--status-error));
  }
  .status-error-dot {
    background-color: hsl(var(--status-error));
  }
  .status-neutral {
    color: hsl(var(--status-neutral));
  }
  .status-neutral-dot {
    background-color: hsl(var(--status-neutral));
  }
  .status-purple {
    color: hsl(var(--status-purple));
  }
  .status-purple-dot {
    background-color: hsl(var(--status-purple));
  }
}

/* Page Layout */
.page-container {
  @apply container max-w-7xl mx-auto p-6 h-full flex flex-col;
}

/* Full-height Card */
.page-card {
  @apply flex flex-col h-full;
}

.page-card-content {
  @apply flex-1 overflow-hidden;
}

/* Icon Sizes */
.icon-sm {
  @apply h-4 w-4;
}

.icon-md {
  @apply h-5 w-5;
}

.icon-lg {
  @apply h-8 w-8;
}

.icon-sm-muted {
  @apply h-4 w-4 text-muted-foreground;
}

/* Card Title with Icon */
.card-title-with-icon {
  @apply flex items-center gap-2 text-base;
}

.card-title-with-icon-sm {
  @apply flex items-center gap-2 text-base;
}

.icon-primary {
  @apply h-4 w-4 text-primary;
}

/* Spacing Utilities */
.vspace-tight {
  @apply space-y-0.5;
}

.vspace-sm {
  @apply space-y-2;
}

.vspace-md {
  @apply space-y-4;
}

.vspace-lg {
  @apply space-y-6;
}

/* Flex Layouts */
.flex-row {
  @apply flex items-center gap-2;
}

.flex-row-between {
  @apply flex items-center justify-between;
}

.flex-row-gap-sm {
  @apply gap-2;
}

/* Typography */
.text-setting-label {
  @apply text-sm font-medium;
}

.text-setting-description {
  @apply text-xs text-muted-foreground;
}

/* Dividers */
.divider-horizontal {
  @apply h-px bg-border;
}
```

---

#### layout.css

**File**: `frontend/src/styles/layout.css`

**Purpose**: Styles for layout components (AppLayout, Sidebar, TitleBar, StatusBar)

**Key Features**:
- AppLayout: Full-screen flex layout with overflow handling
- Sidebar: Collapsible sidebar with navigation items and active states
- TitleBar: Custom title bar for Electron with window controls
- StatusBar: Responsive status bar with dynamic sizing using clamp()

```css
/**
 * Layout Component Styles
 * Styles for AppLayout, Sidebar, TitleBar, StatusBar
 */

/* ========================================
   AppLayout
   ======================================== */

.app-layout-root {
  @apply h-screen flex flex-col;
}

.app-layout-body {
  @apply flex-1 flex overflow-hidden;
}

.app-layout-main {
  @apply flex-1 overflow-auto;
}

/* ========================================
   Sidebar
   ======================================== */

.sidebar {
  @apply h-full bg-card border-r border-border flex flex-col transition-all duration-300;
}

.sidebar-collapsed {
  @apply w-12;
}

.sidebar-expanded {
  @apply w-56;
}

.sidebar-nav {
  @apply flex-1 py-2;
}

.sidebar-item {
  @apply flex items-center gap-3 px-3 py-2.5 mx-2 text-sm rounded-md transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent;
}

.sidebar-item-active {
  @apply bg-accent text-foreground font-medium;
}

.sidebar-icon {
  @apply flex-shrink-0;
}

.sidebar-label {
  @apply truncate;
}

.sidebar-toggle {
  @apply p-2 mx-2 mb-2 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground;
}

.sidebar-nav-container {
  @apply flex flex-col items-center pt-2 flex-1;
}

.sidebar-nav-button {
  @apply w-full h-12 flex items-center justify-center transition-colors relative;
}

.sidebar-nav-button-active {
  @apply text-foreground;
}

.sidebar-nav-button-inactive {
  @apply text-muted-foreground hover:text-foreground;
}

.sidebar-nav-indicator {
  @apply absolute w-0.5 h-12 bg-primary;
}

.sidebar-nav-indicator-left {
  @apply left-0;
}

.sidebar-nav-indicator-right {
  @apply right-0;
}

.sidebar-guide-button {
  @apply w-full h-12 flex items-center justify-center transition-colors relative mt-auto border-t border-border;
}

.sidebar-settings-button {
  @apply w-full h-12 flex items-center justify-center transition-colors relative mb-2;
}

/* ========================================
   TitleBar
   ======================================== */

.titlebar {
  @apply h-10 bg-background border-b border-border flex items-center justify-between;
}

.titlebar-left {
  @apply flex items-center gap-2 px-4;
}

.titlebar-icon {
  @apply h-5 w-5 text-primary;
}

.titlebar-title {
  @apply text-sm font-semibold text-foreground;
}

.titlebar-right {
  @apply flex items-center h-full;
}

.titlebar-button {
  @apply h-full w-12 flex items-center justify-center hover:bg-accent transition-colors;
}

.titlebar-button-close {
  @apply h-full w-12 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors;
}

.titlebar-button-icon {
  @apply h-4 w-4;
}

/* ========================================
   StatusBar
   ======================================== */

.statusbar {
  @apply h-6 bg-muted border-t border-border flex items-center justify-between overflow-hidden;
  /* Dynamic padding that scales down aggressively on small screens */
  padding-left: clamp(0.25rem, 1vw, 1rem);
  padding-right: clamp(0.25rem, 1vw, 1rem);
  /* Dynamic font size using clamp - scales from 8px to 12px based on viewport */
  font-size: clamp(0.5rem, 1.5vw, 0.75rem);
}

.statusbar-left {
  @apply flex items-center flex-shrink min-w-0;
  /* Dynamic gap that scales down more aggressively on small screens */
  gap: clamp(0.25rem, 1vw, 1rem);
}

.statusbar-right {
  @apply flex items-center flex-shrink min-w-0;
  gap: clamp(0.25rem, 1vw, 1rem);
}

.statusbar-item {
  @apply flex items-center text-muted-foreground min-w-0;
  gap: clamp(0.125rem, 0.5vw, 0.375rem);
  /* Allow text to wrap on very small screens instead of truncating */
  white-space: nowrap;
}

.statusbar-item-error {
  @apply flex items-center text-destructive min-w-0;
  gap: clamp(0.125rem, 0.5vw, 0.375rem);
  white-space: nowrap;
}

.statusbar-separator {
  @apply bg-border flex-shrink-0;
  /* Dynamic separator size */
  height: clamp(0.5rem, 2vw, 0.75rem);
  width: 1px;
}

.statusbar-icon {
  @apply flex-shrink-0;
  /* Dynamic icon size */
  height: clamp(0.625rem, 2vw, 0.75rem);
  width: clamp(0.625rem, 2vw, 0.75rem);
}
```

---

#### pages.css

**File**: `frontend/src/styles/pages.css`

**Purpose**: Common page component styles

**Key Features**:
- Common page layout (page-container, page-header, page-title, page-subtitle)
- Page-specific container classes for each major page

```css
/**
 * Page Component Styles
 * Styles for all page components
 */

/* ========================================
   Common Page Layout
   ======================================== */

.page-container {
  @apply max-w-7xl mx-auto p-6 h-full flex flex-col;
}

.page-header {
  @apply mb-6;
}

.page-title {
  @apply text-3xl font-bold text-foreground;
}

.page-subtitle {
  @apply text-sm text-muted-foreground mt-1;
}

/* ========================================
   HomePage Specific
   ======================================== */

.home-page {
  @apply page-container;
}

/* ========================================
   SettingsPage Specific
   ======================================== */

.settings-page {
  @apply page-container;
}

.settings-section {
  @apply space-y-4;
}

.settings-section-title {
  @apply text-lg font-semibold text-foreground mb-4;
}

/* ========================================
   ChatPage Specific
   ======================================== */

.chat-page {
  @apply page-container;
}

/* ========================================
   ProvidersPage Specific
   ======================================== */

.providers-page {
  @apply page-container;
}

/* ========================================
   ModelsPage Specific
   ======================================== */

.models-page {
  @apply page-container;
}

/* ========================================
   Guide Pages
   ======================================== */

.guide-page {
  @apply page-container;
}

.guide-content {
  @apply space-y-6;
}
```

---

### Phase 13.3: Component Styles

This section includes all component-specific CSS files. Due to the large number of files, I'll include the key ones:

#### icons.css

**File**: `frontend/src/styles/icons.css`

```css
/* Icon size utilities */

.icon-xs {
  @apply h-3 w-3;
}

.icon-sm {
  @apply h-4 w-4;
}

.icon-md {
  @apply h-5 w-5;
}

.icon-lg {
  @apply h-8 w-8;
}

.icon-xl {
  @apply h-12 w-12;
}
```

---

#### home.css

**File**: `frontend/src/styles/home.css`

**Purpose**: HomePage-specific styles

```css
/* HomePage styles */

.home-page-container {
  @apply container max-w-7xl py-8 space-y-6;
}

.home-header-card {
  @apply flex items-center justify-between;
}

.home-header-title {
  @apply flex items-center gap-2;
}

.home-header-description {
  @apply text-sm text-muted-foreground;
}

.home-services-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.home-service-card {
  @apply flex flex-col;
}

.home-service-header {
  @apply flex items-center justify-between;
}

.home-service-title {
  @apply flex items-center gap-2 text-base;
}

.home-service-content {
  @apply space-y-3 flex-1;
}

.home-service-row {
  @apply flex items-center justify-between;
}

.home-service-label {
  @apply text-sm text-muted-foreground;
}

.home-service-value {
  @apply text-sm font-mono;
}

.home-service-footer {
  @apply w-full;
}

.home-container {
  @apply container max-w-6xl py-8 space-y-6;
}

/* Unified Control Card */
.home-unified-content {
  @apply space-y-6;
}

.home-section {
  @apply space-y-4;
}

.home-section-header {
  @apply flex items-center justify-between;
}

.home-section-title {
  @apply flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide;
}

.home-section-divider {
  @apply border-t border-border;
}

.credentials-info-section-compact {
  @apply space-y-3 text-sm;
}

.credentials-logged-out-section-compact {
  @apply space-y-3;
}

/* Status Card */
.home-status-header {
  @apply flex items-center justify-between;
}

.home-status-title {
  @apply flex items-center gap-2;
}

.home-status-content {
  @apply space-y-6;
}

.home-status-indicator {
  @apply flex items-center gap-3;
}

.home-status-badge {
  @apply flex items-center gap-2;
}

.home-status-label {
  @apply text-2xl font-bold;
}

.home-status-label-inactive {
  @apply text-2xl font-bold text-muted-foreground;
}

.home-uptime-section {
  @apply space-y-2 text-sm;
}

.home-uptime-row {
  @apply flex items-center gap-2;
}

.home-uptime-label {
  @apply text-muted-foreground;
}

.home-uptime-value {
  @apply font-medium;
}

.home-control-buttons {
  @apply flex gap-2;
}

.home-start-button {
  @apply flex items-center gap-2;
}

.home-stop-button {
  @apply flex items-center gap-2;
}

.home-button-icon-spin {
  @apply animate-spin;
}

/* Stats Cards */
.home-stats-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.home-stats-card-content {
  @apply pt-6;
}

.home-stats-card-inner {
  @apply flex flex-col items-center text-center space-y-2;
}

.home-stats-icon {
  @apply h-8 w-8 text-primary;
}

.home-stats-value {
  @apply text-3xl font-bold;
}

.home-stats-label {
  @apply text-sm text-muted-foreground;
}

/* Connection Status Badge */
.connection-status-connected {
  @apply bg-primary hover:bg-primary/90;
}

.connection-status-reconnecting {
  @apply bg-secondary hover:bg-secondary/90;
}

.connection-status-icon {
  @apply h-3 w-3 mr-1;
}
```

---

#### ui-components.css

**File**: `frontend/src/styles/ui-components.css`

**Purpose**: Reusable UI component styles (StatusIndicator, StatusBadge, etc.)

```css
/* UI Components: Status Indicator & Status Badge */

/* Card */
.page-card { @apply flex-1 flex flex-col overflow-hidden; }
.page-card-content { @apply flex-1 flex flex-col overflow-hidden; }

/* Tabs */
.tab-container { @apply w-full flex flex-col flex-1 overflow-hidden; }
.tab-list-grid-2 { @apply grid w-full grid-cols-2; }
.tab-list-grid-3 { @apply grid w-full grid-cols-3; }
.tab-content { @apply mt-4 flex-1 flex flex-col overflow-auto; }

/* Status Badge Container */
.status-badge-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Status Badge Dot */
.status-badge-dot {
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 50%;
}

/* Status Badge Variants - Text */
.status-badge-success {
  color: hsl(var(--status-success));
}

.status-badge-error {
  color: hsl(var(--status-error));
}

.status-badge-neutral {
  color: hsl(var(--status-neutral));
}

.status-badge-info {
  color: hsl(var(--status-info));
}

.status-badge-warning {
  color: hsl(var(--status-warning));
}

/* Status Badge Variants - Dots */
.status-badge-success-dot {
  background-color: hsl(var(--status-success));
}

.status-badge-error-dot {
  background-color: hsl(var(--status-error));
}

.status-badge-neutral-dot {
  background-color: hsl(var(--status-neutral));
}

.status-badge-info-dot {
  background-color: hsl(var(--status-info));
}

.status-badge-warning-dot {
  background-color: hsl(var(--status-warning));
}

/* Status Indicator */
.status-indicator {
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Status Indicator Variants */
.status-indicator-success {
  background-color: hsl(var(--status-success));
}

.status-indicator-error {
  background-color: hsl(var(--status-error));
}

.status-indicator-neutral {
  background-color: hsl(var(--status-neutral));
}

.status-indicator-info {
  background-color: hsl(var(--status-info));
}

.status-indicator-warning {
  background-color: hsl(var(--status-warning));
}

/* Pulse Animation */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Reused Status Classes */
.status-success {
  color: hsl(var(--status-success));
}

.status-success-dot {
  background-color: hsl(var(--status-success));
}

.status-error {
  color: hsl(var(--status-error));
}

.status-error-dot {
  background-color: hsl(var(--status-error));
}

.status-neutral {
  color: hsl(var(--status-neutral));
}

.status-neutral-dot {
  background-color: hsl(var(--status-neutral));
}

.status-info {
  color: hsl(var(--status-info));
}

.status-info-dot {
  background-color: hsl(var(--status-info));
}

.status-warning {
  color: hsl(var(--status-warning));
}

.status-warning-dot {
  background-color: hsl(var(--status-warning));
}
```

---

#### Additional Component Styles

The following CSS files provide styles for specific features:

**Chat Components**:
- `chat-tabs.css` - Chat tab container styles
- `chat-quick-test.css` - Quick test tab styles
- `chat-custom.css` - Custom chat input styles
- `chat-curl.css` - Curl command demonstration styles
- `chat-response.css` - Response and thinking display styles

**Model Components**:
- `models.css` - Models page styles
- `models2.css` - Model components (cards, lists, filters)

**Provider Components**:
- `providers.css` - Providers page styles
- `pages/providers.css` - Provider-specific page styles

**Guide Components**:
- `components/guide.css` - Guide page benefits banner and common elements
- `components/steps.css` - Step card and demo container styles
- `pages/quick-guide.css` - Quick guide page layout
- `quick-guide.css` - Quick guide component utilities

**Feature Components**:
- `credentials.css` - Credentials section styles
- `system-features.css` - System control card styles
- `api-guide.css` - API guide component styles

---

## Implementation Summary

### Phase 11: Pages (7 files)
- ✅ HomePage.tsx - Dashboard with system overview
- ✅ ProvidersPage.tsx - Provider management
- ✅ ModelsPage.tsx - Model browsing and selection
- ✅ SettingsPage.tsx - Application settings
- ✅ ChatPage.tsx - Chat interface
- ✅ BrowserGuidePage.tsx - Chrome extension guide
- ✅ DesktopGuidePage.tsx - Desktop app guide

### Phase 12: Application Entry (2 files)
- ✅ App.tsx - Main application with routing
- ✅ main.tsx - React entry point

### Phase 13: Styling System (24 CSS files)
- ✅ Base styles: theme.css, index.css
- ✅ Utilities: common.css
- ✅ Layout: layout.css, pages.css
- ✅ Page-specific: providers.css, quick-guide.css
- ✅ Components: 19 component-specific CSS files

### Key Architectural Patterns

1. **Page Components**:
   - Use TabCard for consistent layout
   - Business logic in page hooks
   - Content from constants files
   - Single responsibility per page

2. **Routing**:
   - State-based routing via Zustand
   - No React Router dependency
   - Simple switch-case in App.tsx

3. **Styling**:
   - Modular CSS architecture
   - Tailwind CSS with custom utilities
   - Theme variables for light/dark modes
   - Component-specific stylesheets
   - Organized by layer (base → utilities → layout → pages → features → components)

4. **Initialization**:
   - Dark mode setup on mount
   - WebSocket connection on mount
   - Settings loaded from backend and localStorage

---

**Document Version:** 1.0
**Date:** 2025-01-08
**Status:** Complete
**Related Documents**:
- 01_FRONTEND_V3_REWRITE_IMPLEMENTATION_PLAN.md
- 03_CODE_EXAMPLES.md
