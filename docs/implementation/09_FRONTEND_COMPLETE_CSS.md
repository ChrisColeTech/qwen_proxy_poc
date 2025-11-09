# Complete Frontend CSS Documentation

This document contains the complete, verbatim CSS source code for the frontend V3 rewrite. All styles are organized by file, following the structure established in Phase 13.

Total CSS Files: 25
Total Lines of CSS: 2,348

## Main Entry Point

### src/index.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/index.css`
Lines: 49

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

### src/App.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/App.css`
Lines: 42

```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}
```

## Base Styles

### src/styles/base/theme.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/base/theme.css`
Lines: 82

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

## Utility Styles

### src/styles/utilities/common.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/utilities/common.css`
Lines: 126

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
  @apply w-full p-6 h-full flex flex-col;
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

## Layout Styles

### src/styles/layout.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/layout.css`
Lines: 183

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

## Page Styles

### src/styles/pages.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/pages.css`
Lines: 84

```css
/**
 * Page Component Styles
 * Styles for all page components
 */

/* ========================================
   Common Page Layout
   ======================================== */

.page-container {
  @apply w-full p-6 h-full flex flex-col;
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

### src/styles/pages/providers.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/pages/providers.css`
Lines: 65

```css
/* Providers Page */
.providers-container {
  @apply container max-w-7xl mx-auto p-6 space-y-6;
}

.providers-header {
  @apply space-y-2;
}

.providers-header-title {
  @apply text-3xl font-bold flex items-center gap-3;
}

.providers-header-subtitle {
  @apply text-muted-foreground;
}

.providers-actions {
  @apply flex items-center gap-2;
}

.providers-grid {
  @apply grid gap-4 md:grid-cols-2 lg:grid-cols-3;
}

/* Provider Card */
.provider-card {
  @apply border rounded-lg bg-card transition-all;
}

.provider-card-active {
  @apply ring-2 ring-primary shadow-sm;
}

.provider-card-header {
  @apply p-4 space-y-3;
}

.provider-card-title {
  @apply flex items-center gap-2 text-lg font-semibold;
}

.provider-card-badges {
  @apply flex items-center gap-2 flex-wrap;
}

.provider-card-description {
  @apply text-sm text-muted-foreground;
}

.provider-card-actions {
  @apply p-4 pt-0 flex flex-col gap-2;
}

.provider-card-test-result {
  @apply rounded-lg p-3 text-sm flex items-center gap-2 border;
}

.provider-card-test-success {
  @apply bg-primary/10 border-primary/20 text-foreground;
}

.provider-card-test-error {
  @apply bg-destructive/10 border-destructive/20 text-foreground;
}
```

### src/styles/pages/quick-guide.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/pages/quick-guide.css`
Lines: 60

```css
/* Quick Guide Page */
.quick-guide-container {
  @apply container max-w-6xl py-8;
}

.quick-guide-header {
  @apply mb-6;
}

.quick-guide-title-row {
  @apply flex items-center gap-2 mb-2;
}

.quick-guide-title {
  @apply text-2xl font-bold;
}

.quick-guide-description {
  @apply text-muted-foreground;
}

.quick-guide-steps {
  @apply space-y-6;
}

.quick-guide-step-header {
  @apply mb-3;
}

.quick-guide-step-title {
  @apply text-lg font-semibold;
}

.quick-guide-step-description {
  @apply text-sm text-muted-foreground;
}

.quick-guide-step-cards {
  @apply space-y-4;
}

.quick-guide-success {
  @apply rounded-lg border border-primary/20 bg-primary/10 p-4;
}

.quick-guide-success-content {
  @apply flex items-center gap-2 text-primary;
}

.quick-guide-success-icon {
  @apply h-5 w-5;
}

.quick-guide-success-title {
  @apply font-semibold;
}

.quick-guide-success-message {
  @apply text-sm;
}
```

### src/styles/home.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/home.css`
Lines: 185

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

### src/styles/models.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/models.css`
Lines: 171

```css
/* ModelsPage styles */

.models-container {
  @apply container max-w-7xl py-8;
}

.models-header {
  @apply flex items-center justify-between;
}

.models-title {
  @apply flex items-center gap-2;
}

.models-content {
  @apply space-y-6;
}

.models-refresh-spin {
  @apply animate-spin;
}

/* Filters */
.models-filters-container {
  @apply flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between;
}

.models-filters-row {
  @apply flex flex-col sm:flex-row gap-3 flex-1;
}

/* Two-row header filters */
.model-filters-row {
  @apply flex flex-col sm:flex-row gap-3 px-4 py-3 border-b;
}

.model-filter-group {
  @apply flex items-center gap-2;
}

.model-filter-label {
  @apply text-sm text-muted-foreground whitespace-nowrap;
}

.models-filter-select {
  @apply w-[180px];
}

.models-filter-select-inline {
  @apply w-[160px];
}

.models-count {
  @apply text-sm text-muted-foreground;
}

/* States */
.models-error-state {
  @apply rounded-lg border border-destructive/50 bg-destructive/10 p-4;
}

.models-error-text {
  @apply text-sm text-destructive;
}

.models-loading-state {
  @apply flex-1 flex items-center justify-center py-12;
}

.models-loading-spinner {
  @apply animate-spin text-muted-foreground;
}

.models-empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.models-empty-icon {
  @apply text-muted-foreground mb-4;
}

.models-empty-text {
  @apply text-sm text-muted-foreground;
}

.models-empty-button {
  @apply mt-4;
}

/* Grid */
.models-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Model Card */
.models-card {
  @apply flex flex-col;
}

.models-card-title {
  @apply text-base;
}

.models-card-description {
  @apply text-xs line-clamp-2;
}

.models-card-content {
  @apply flex-1 flex flex-col justify-between gap-3;
}

.models-card-capabilities {
  @apply flex flex-wrap gap-2;
}

.models-capability-badge {
  @apply gap-1;
}

.models-capability-label {
  @apply text-xs;
}

.models-capability-chat {
  @apply text-primary;
}

.models-capability-vision {
  @apply text-primary;
}

.models-capability-tools {
  @apply text-primary;
}

.models-capability-code {
  @apply text-primary;
}

.models-card-provider {
  @apply pt-2 border-t;
}

.models-card-provider-text {
  @apply text-xs text-muted-foreground;
}

/* Model Details Dialog */
.model-details-dialog {
  @apply max-w-2xl;
}

.model-details-content {
  @apply space-y-4 py-4;
}

.model-details-section {
  @apply space-y-2;
}

.model-details-label {
  @apply text-sm font-medium text-foreground;
}

.model-details-text {
  @apply text-sm text-muted-foreground;
}

.model-details-capabilities {
  @apply flex flex-wrap gap-2;
}
```

### src/styles/providers.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/providers.css`
Lines: 100

```css
/* ProvidersPage styles */

.providers-container {
  @apply container max-w-6xl py-8 space-y-6;
}

.providers-loading {
  @apply pt-6 flex items-center justify-center gap-2 text-muted-foreground;
}

.providers-loading-spinner {
  @apply animate-spin;
}

.providers-header {
  @apply flex items-center justify-between;
}

.providers-title {
  @apply text-3xl font-bold flex items-center gap-2;
}

.providers-description {
  @apply text-muted-foreground mt-1;
}

.providers-refresh-icon {
  @apply mr-2;
}

.providers-refresh-spin {
  @apply animate-spin;
}

/* Summary Cards */
.providers-summary-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.providers-summary-header {
  @apply pb-3;
}

.providers-summary-title {
  @apply text-sm font-medium text-muted-foreground;
}

.providers-summary-value {
  @apply text-3xl font-bold;
}

.providers-summary-value-enabled {
  @apply text-3xl font-bold text-primary;
}

.providers-summary-value-disabled {
  @apply text-3xl font-bold text-muted-foreground;
}

/* Table */
.providers-empty-state {
  @apply text-center py-8 text-muted-foreground;
}

.providers-table-name {
  @apply font-medium;
}

.providers-table-actions-header {
  @apply text-right;
}

.providers-table-actions {
  @apply text-right;
}

.providers-table-spinner {
  @apply animate-spin;
}

.providers-table-delete {
  @apply text-destructive;
}

/* Dialog */
.providers-dialog-spinner {
  @apply mr-2 animate-spin;
}

.providers-dialog-form {
  @apply grid gap-4 py-4;
}

.providers-dialog-field {
  @apply grid gap-2;
}

.providers-dialog-error {
  @apply text-sm text-destructive;
}
```

### src/styles/credentials.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/credentials.css`
Lines: 101

```css
/* CredentialsPage styles */

.credentials-container {
  @apply container max-w-4xl py-8;
}

.credentials-content {
  @apply space-y-6;
}

/* Status Card */
.credentials-card-header {
  @apply flex items-center justify-between;
}

.credentials-card-title-row {
  @apply flex items-center gap-2;
}

.credentials-icon {
  @apply text-primary;
}

.credentials-card-content {
  @apply space-y-6;
}

.credentials-status-row {
  @apply flex items-center gap-3;
}

.credentials-status-icon {
  @apply h-6 w-6;
}

.credentials-status-inactive {
  @apply text-muted-foreground;
}

.credentials-status-expired {
  @apply text-destructive;
}

.credentials-status-valid {
  @apply text-primary;
}

.credentials-status-badge {
  @apply text-sm px-3 py-1;
}

.credentials-error-message {
  @apply rounded-lg bg-destructive/10 border border-destructive/20 p-3;
}

.credentials-error-text {
  @apply text-sm text-destructive;
}

/* Logged In State */
.credentials-info-section {
  @apply space-y-3;
}

.credentials-info-row {
  @apply space-y-1;
}

.credentials-info-label {
  @apply text-sm text-muted-foreground;
}

.credentials-info-value {
  @apply text-base font-medium;
}

.credentials-action-section {
  @apply pt-2;
}

/* Logged Out State */
.credentials-logged-out-section {
  @apply space-y-4;
}

.credentials-logged-out-text {
  @apply text-sm text-muted-foreground;
}

.credentials-button-icon {
  @apply mr-2;
}

/* Instructions Card */
.credentials-instructions-list {
  @apply space-y-3 list-decimal list-inside text-sm text-muted-foreground;
}

.credentials-instructions-footer {
  @apply mt-4 pt-4 border-t border-border;
}
```

## Component Styles

### src/styles/components/guide.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/components/guide.css`
Lines: 134

```css
/* Guide Pages - Benefits Banner */
.guide-benefits-banner {
  @apply border-primary/20 bg-primary/5;
}

.guide-benefits-grid {
  @apply grid md:grid-cols-3 gap-4 pt-6;
}

.guide-benefit-item {
  @apply flex items-start gap-3;
}

.guide-benefit-icon {
  @apply h-5 w-5 text-primary mt-0.5;
}

.guide-benefit-title {
  @apply text-sm font-medium;
}

.guide-benefit-description {
  @apply text-xs text-muted-foreground;
}

/* Guide Pages - Step Card Elements */
.guide-step-list {
  @apply space-y-2;
}

.guide-step-item {
  @apply flex items-start gap-3;
}

.guide-step-icon {
  @apply h-4 w-4 status-icon-success mt-0.5;
}

.guide-step-text {
  @apply text-sm;
}

/* Guide Pages - Common Issues */
.guide-issues-list {
  @apply space-y-3;
}

/* Guide Pages - Prerequisites */
.guide-prerequisites-list {
  @apply space-y-3;
}

/* Guide Pages - Badge with Icon */
.guide-badge-with-icon {
  @apply flex items-center gap-1;
}

/* Guide Pages - Title Icon */
.guide-title-icon {
  @apply h-4 w-4;
}

/* Guide Pages - Alert Icon */
.guide-alert-icon {
  @apply h-4 w-4;
}

.guide-alert-icon-header {
  @apply h-5 w-5;
}

/* Guide Pages - Button Actions Row */
.guide-button-actions {
  @apply flex gap-2 mt-4;
}

/* Next Steps Card */
.next-steps-card {
  @apply border-primary/20 bg-primary/5;
}

.next-steps-title {
  @apply flex items-center gap-2 text-base;
}

.next-steps-list {
  @apply space-y-3;
}

.next-steps-item {
  @apply flex gap-3 items-start;
}

.next-steps-bullet {
  @apply h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0;
}

.next-steps-text {
  @apply text-sm text-muted-foreground;
}

.next-steps-emphasis {
  @apply font-medium text-foreground;
}

/* Quick Reference */
.quick-reference-grid {
  @apply grid md:grid-cols-2 gap-4;
}

.quick-reference-section {
  @apply space-y-2;
}

.quick-reference-title {
  @apply text-sm font-medium;
}

.quick-reference-list {
  @apply space-y-1 text-xs text-muted-foreground font-mono;
}

.quick-reference-item {
  @apply bg-muted px-3 py-2 rounded;
}

/* Status Icons - override hardcoded colors */
.status-icon-success {
  @apply text-primary;
}

.status-icon-inline {
  @apply inline h-3 w-3 mx-1;
}
```

### src/styles/components/steps.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/components/steps.css`
Lines: 120

```css
/* Step Components */
.step-card-header-row {
  @apply flex items-center justify-between;
}

.step-card-title {
  @apply flex items-center gap-2 text-lg;
}

.step-number-badge {
  @apply flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold;
}

.step-description {
  @apply text-sm text-muted-foreground;
}

.step-inline-code {
  @apply px-2 py-0.5 bg-muted rounded text-xs font-mono;
}

/* Interactive Demo Areas */
.demo-container {
  @apply rounded-lg border border-border bg-muted/30 p-4 space-y-3;
}

.demo-header {
  @apply flex items-center justify-between;
}

.demo-label {
  @apply flex items-center gap-2;
}

.demo-label-text {
  @apply text-sm font-medium;
}

.demo-content {
  @apply bg-background rounded px-4 py-3 text-sm;
}

.demo-empty-state {
  @apply text-sm text-muted-foreground text-center py-8;
}

.demo-error-state {
  @apply flex items-center gap-2 text-sm text-muted-foreground;
}

/* Model List */
.model-list-container {
  @apply space-y-2;
}

.model-item {
  @apply flex items-center justify-between bg-background rounded px-3 py-2;
}

.model-item-code {
  @apply text-xs font-mono;
}

/* Provider Switch List */
.provider-switch-list {
  @apply space-y-2;
}

.provider-switch-item {
  @apply flex items-center justify-between bg-background rounded px-4 py-3 transition-colors;
}

.provider-switch-item-active {
  @apply ring-2 ring-primary;
}

.provider-switch-info {
  @apply flex items-center gap-3;
}

.provider-switch-details {
  @apply space-y-0;
}

.provider-switch-name {
  @apply text-sm font-medium;
}

.provider-switch-type {
  @apply text-xs text-muted-foreground;
}

.provider-switch-actions {
  @apply flex items-center gap-2;
}

/* Code Blocks */
.code-block-container {
  @apply space-y-2;
}

.code-block-label {
  @apply text-sm font-medium;
}

.code-block-wrapper {
  @apply relative;
}

.code-block-pre {
  @apply bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto;
}

.code-block-code {
  @apply text-foreground;
}

.code-block-copy-button {
  @apply absolute top-2 right-2 h-7 w-7;
}
```

## Feature-Specific Styles

### src/styles/models2.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/models2.css`
Lines: 125

```css
/* ============================================================================
   MODELS COMPONENTS STYLES
   Styles for models-related components (ModelsCard, etc.)
   ============================================================================ */

/* Models Card */
.models-card-title {
  @apply flex items-center gap-2 text-base;
}

.models-tabs {
  @apply w-full;
}

.models-tabs-list {
  @apply grid w-full grid-cols-2;
}

/* Browse Models Tab */
.models-browse-container {
  @apply mt-4 space-y-4;
}

.models-browse-description {
  @apply step-description;
}

.models-browse-demo {
  @apply demo-container;
}

.models-browse-header {
  @apply demo-header;
}

.models-browse-label {
  @apply demo-label;
}

.models-browse-label-text {
  @apply demo-label-text;
}

.models-browse-actions {
  @apply flex items-center gap-2;
}

.models-browse-badge {
  @apply gap-1;
}

.models-browse-button {
  @apply h-7 w-7;
}

/* Model List */
.model-list-container {
  @apply divide-y divide-border;
}

.model-item {
  @apply flex items-center justify-between gap-2 px-4 py-2 w-full text-left border-none bg-transparent;
}

.model-item-interactive {
  @apply cursor-pointer hover:bg-accent;
}

.model-item-active {
  @apply bg-accent;
}

.model-item-content {
  @apply flex items-center gap-2 flex-1;
}

.model-item-code {
  @apply flex-1 truncate rounded bg-muted px-2 py-1 text-xs font-mono;
}

.model-item-badge {
  @apply text-xs;
}

/* Empty State */
.models-empty-state {
  @apply demo-error-state;
}

/* Curl Tab */
.models-curl-container {
  @apply mt-4 space-y-4;
}

.models-curl-description {
  @apply step-description;
}

.models-curl-response-container {
  @apply demo-container;
}

.models-curl-response-header {
  @apply demo-header;
}

.models-curl-response-label {
  @apply demo-label;
}

.models-curl-response-label-text {
  @apply demo-label-text;
}

.models-curl-response-content {
  @apply demo-content;
}

.models-curl-response-description {
  @apply text-sm text-muted-foreground mb-2;
}

.models-curl-response-code {
  @apply text-xs bg-muted p-3 rounded overflow-x-auto;
}
```

### src/styles/quick-guide.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/quick-guide.css`
Lines: 68

```css
/* Quick Guide Styles */

/* Code Block */
.code-block-container { @apply space-y-2; }
.code-block-label { @apply text-sm font-medium text-foreground; }
.code-block-wrapper { @apply relative rounded-lg border bg-muted; }
.code-block-pre { @apply overflow-x-auto p-3; }
.code-block-code { @apply text-xs font-mono text-foreground; }
.code-block-copy-button { @apply absolute right-2 top-2 h-7 w-7; }

/* Step Common */
.step-description { @apply text-sm text-muted-foreground; }
.step-inline-code { @apply rounded bg-muted px-1.5 py-0.5 text-xs font-mono; }

/* Demo Container */
.demo-container { @apply rounded-lg border border-border bg-card flex flex-col flex-1 overflow-hidden; }
.demo-header { @apply flex items-center justify-between border-b border-border px-4 py-3; }
.demo-label { @apply flex items-center gap-2; }
.demo-label-text { @apply text-sm font-medium; }
.demo-error-state { @apply flex-1 flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground; }
.demo-content { @apply px-4 py-3 text-sm text-foreground whitespace-pre-wrap; }
.demo-empty-state { @apply flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground; }

/* Models Step */
.model-list-container { @apply divide-y divide-border flex-1 overflow-y-auto pr-2; }
.model-item { @apply flex items-center justify-between gap-2 px-4 py-2 w-full text-left border-none bg-transparent; }
.model-item-code { @apply flex-1 truncate rounded bg-muted px-2 py-1 text-xs font-mono; }
.model-item-left { @apply flex items-center gap-2 flex-1; }
.model-item-badge { @apply text-xs; }
.model-check-icon { @apply h-3.5 w-3.5 status-icon-success; }
.model-header-actions { @apply flex items-center gap-2; }
.model-loading-badge { @apply gap-1; }
.model-loading-icon { @apply h-3 w-3 animate-spin; }
.model-count-badge { @apply gap-1; }
.model-count-icon { @apply h-3 w-3 status-icon-success; }
.model-refresh-button { @apply h-7 w-7; }
.model-refresh-icon { @apply h-3.5 w-3.5; }

/* Provider Switch */
.provider-switch-list { @apply divide-y divide-border flex-1 overflow-y-auto pr-2; }
.provider-switch-item { @apply flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50; }
.provider-switch-item-active { @apply bg-muted/30; }
.provider-switch-info { @apply flex items-center gap-3; }
.provider-switch-details { @apply flex flex-col gap-0.5; }
.provider-switch-name { @apply text-sm font-medium text-foreground; }
.provider-switch-type { @apply text-xs text-muted-foreground; }
.provider-switch-actions { @apply flex items-center gap-2; }
.provider-loading-badge { @apply gap-1; }
.provider-loading-icon { @apply h-3 w-3 animate-spin; }
.provider-badge-sm { @apply text-xs; }
.provider-switch-button { @apply h-7 w-7; }
.provider-switch-icon { @apply h-3.5 w-3.5; }

/* Explore Section */
.explore-grid { @apply grid gap-4 md:grid-cols-3; }
.explore-card { @apply p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer; }
.explore-card-content { @apply space-y-3; }
.explore-card-header { @apply flex items-start justify-between; }
.explore-card-icon { @apply h-5 w-5; }
.explore-card-arrow { @apply h-4 w-4 text-muted-foreground transition-colors; }
.explore-card:hover .explore-card-arrow { @apply text-foreground; }
.explore-card-title { @apply font-semibold text-sm mb-1; }
.explore-card-description { @apply text-xs text-muted-foreground leading-relaxed; }

/* Status & Common */
.status-icon-inline { @apply h-4 w-4 inline-block; }
.status-icon-success { @apply text-green-600 dark:text-green-500; }
.card-title-with-icon { @apply flex items-center gap-2 text-base; }
```

### src/styles/api-guide.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/api-guide.css`
Lines: 172

```css
/* API Guide Component Styles */

/* Base URL Section */
.base-url-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.base-url-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.base-url-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.base-url-code {
  flex: 1;
  border-radius: 0.5rem;
  background-color: hsl(var(--muted));
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-family: monospace;
  overflow-x: auto;
}

.base-url-copy-button {
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
}

.base-url-copy-icon {
  height: 1rem;
  width: 1rem;
}

.base-url-copy-icon-success {
  color: hsl(142 76% 36%);
}

.base-url-description {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

/* Endpoint Item */
.endpoint-item-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: hsl(var(--muted) / 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.endpoint-item-icon {
  height: 1rem;
  width: 1rem;
  color: hsl(var(--primary));
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.endpoint-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.endpoint-item-code {
  font-size: 0.875rem;
  font-family: monospace;
}

.endpoint-item-description {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

/* Code Examples Card */
.code-examples-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.code-examples-tabs {
  width: 100%;
}

.code-examples-tab-list {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.code-examples-tab-content {
  margin-top: 1rem;
}

/* API Guide Container */
.api-guide-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.api-guide-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.api-guide-section-icon {
  height: 1rem;
  width: 1rem;
}

/* Supported Endpoints */
.api-guide-endpoints-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Status Variants */
.status-success {
  color: hsl(var(--status-success));
}

.status-error {
  color: hsl(var(--status-error));
}

.status-neutral {
  color: hsl(var(--status-neutral));
}

.status-info {
  color: hsl(var(--status-info));
}

.status-warning {
  color: hsl(var(--status-warning));
}

.status-success-dot {
  background-color: hsl(var(--status-success));
}

.status-error-dot {
  background-color: hsl(var(--status-error));
}

.status-neutral-dot {
  background-color: hsl(var(--status-neutral));
}

.status-info-dot {
  background-color: hsl(var(--status-info));
}

.status-warning-dot {
  background-color: hsl(var(--status-warning));
}
```

### src/styles/chat-curl.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/chat-curl.css`
Lines: 41

```css
/* ============================================================================
   CHAT CURL TAB STYLES
   Styles for the curl command demonstration tab
   ============================================================================ */

/* Curl Tab */
.chat-curl-container {
  @apply mt-4 space-y-4;
}

.chat-curl-description {
  @apply step-description;
}

.chat-curl-response-container {
  @apply demo-container;
}

.chat-curl-response-header {
  @apply demo-header;
}

.chat-curl-response-label {
  @apply demo-label;
}

.chat-curl-response-label-text {
  @apply demo-label-text;
}

.chat-curl-response-content {
  @apply demo-content;
}

.chat-curl-response-description {
  @apply text-sm text-muted-foreground mb-2;
}

.chat-curl-response-code {
  @apply text-xs bg-muted p-3 rounded overflow-x-auto;
}
```

### src/styles/chat-custom.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/chat-custom.css`
Lines: 37

```css
/* ============================================================================
   CHAT CUSTOM TAB STYLES
   Styles for the custom chat input component
   ============================================================================ */

/* Custom Chat Tab */
.chat-custom-container {
  @apply mt-4 space-y-4;
}

.chat-custom-description {
  @apply step-description;
}

.chat-custom-form {
  @apply space-y-2;
}

.chat-custom-label {
  @apply text-sm font-medium;
}

.chat-custom-textarea {
  @apply min-h-[100px] resize-none;
}

.chat-custom-actions {
  @apply flex justify-end;
}

.chat-custom-send-button {
  @apply gap-2;
}

.chat-custom-response-container {
  @apply space-y-3;
}
```

### src/styles/chat-quick-test.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/chat-quick-test.css`
Lines: 49

```css
/* ============================================================================
   CHAT QUICK TEST STYLES
   Styles for the quick test tab component
   ============================================================================ */

/* Quick Test Tab */
.chat-quick-test-container {
  @apply mt-4;
}

.chat-quick-test-description {
  @apply step-description;
}

.chat-quick-test-demo {
  @apply demo-container;
}

.chat-quick-test-header {
  @apply demo-header;
}

.chat-quick-test-label {
  @apply demo-label;
}

.chat-quick-test-label-text {
  @apply demo-label-text;
}

.chat-quick-test-actions {
  @apply flex items-center gap-2;
}

.chat-quick-test-badge {
  @apply gap-1;
}

.chat-quick-test-button {
  @apply h-7 w-7;
}

.chat-quick-test-content {
  @apply demo-content;
}

.chat-quick-test-empty {
  @apply demo-empty-state;
}
```

### src/styles/chat-response.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/chat-response.css`
Lines: 54

```css
/* ============================================================================
   CHAT RESPONSE STYLES
   Styles for thinking and response display components
   ============================================================================ */

/* Thinking Process Section */
.chat-thinking-container {
  @apply demo-container;
}

.chat-thinking-header {
  @apply demo-header w-full hover:bg-accent/50 transition-colors cursor-pointer;
}

.chat-thinking-label {
  @apply demo-label;
}

.chat-thinking-label-text {
  @apply demo-label-text text-muted-foreground;
}

.chat-thinking-content {
  @apply demo-content whitespace-pre-wrap text-muted-foreground text-sm italic border-l-2 border-muted pl-3;
}

/* Response Section */
.chat-response-container {
  @apply demo-container;
}

.chat-response-header {
  @apply demo-header;
}

.chat-response-label {
  @apply demo-label;
}

.chat-response-label-text {
  @apply demo-label-text;
}

.chat-response-badge {
  @apply gap-1;
}

.chat-response-content {
  @apply demo-content whitespace-pre-wrap;
}

.chat-response-loading {
  @apply demo-content text-muted-foreground;
}
```

### src/styles/chat-tabs.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/chat-tabs.css`
Lines: 17

```css
/* ============================================================================
   CHAT TAB COMPONENTS STYLES
   Styles for chat tab containers and navigation
   ============================================================================ */

/* Chat Test Card */
.chat-test-card-title {
  @apply flex items-center gap-2 text-base;
}

.chat-test-tabs {
  @apply w-full;
}

.chat-test-tabs-list {
  @apply grid w-full grid-cols-3;
}
```

### src/styles/system-features.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/system-features.css`
Lines: 112

```css
/* System Control Card Styles */

/* Credentials Section */
.credentials-container {
  @apply flex items-center justify-between;
}

.credentials-info {
  @apply flex items-center gap-2;
}

.credentials-label {
  @apply text-sm text-muted-foreground;
}

.credentials-status {
  @apply text-sm font-medium;
}

.credentials-actions {
  @apply flex items-center gap-2;
}

.credentials-expiry {
  @apply text-sm text-muted-foreground;
}

.credentials-button {
  @apply h-8 w-8;
}

/* Proxy Server Section */

.proxy-container {
  @apply space-y-2;
}

.proxy-header {
  @apply flex items-center justify-between;
}

.proxy-info {
  @apply flex items-center gap-2;
}

.proxy-label {
  @apply text-sm text-muted-foreground;
}

.proxy-loading-spinner {
  @apply h-3 w-3 animate-spin text-primary;
}

.proxy-state-text {
  @apply text-sm font-medium;
}

.proxy-actions {
  @apply flex items-center gap-2;
}

.proxy-uptime {
  @apply text-sm text-muted-foreground;
}

.proxy-button {
  @apply h-8 w-8;
}

.proxy-error {
  @apply flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive;
}

.proxy-error-icon {
  @apply h-3 w-3 shrink-0;
}

/* Endpoint URL Section */

.endpoint-divider {
  @apply h-px bg-border;
}

.endpoint-container {
  @apply flex items-center justify-between gap-2;
}

.endpoint-code {
  @apply flex-1 rounded bg-muted px-3 py-1.5 text-xs font-mono truncate;
}

.endpoint-button {
  @apply h-8 w-8 shrink-0;
}

.endpoint-icon {
  @apply h-3 w-3;
}

/* Card Common Styles */

.system-card-divider {
  @apply h-px bg-border;
}

.system-card-content {
  @apply space-y-4;
}

.system-card-title {
  @apply flex items-center gap-2 text-base;
}
```

### src/styles/icons.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/icons.css`
Lines: 21

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

## UI Component Styles

### src/styles/ui-components.css
Path: `/Users/chris/Projects/qwen_proxy_poc/frontend/src/styles/ui-components.css`
Lines: 150

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

**Document Version:** 2.0
**Last Updated:** November 9, 2025
**Total CSS Files:** 25
**Total Lines of Code:** 2,348
