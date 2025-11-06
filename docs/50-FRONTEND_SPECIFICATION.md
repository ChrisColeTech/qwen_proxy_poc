# Qwen Proxy - Frontend Specification Document

**Version**: 2.0 (Architecture Corrections Applied)
**Date**: November 6, 2025
**Purpose**: Complete specification of frontend features, functionality, and architecture

---

## 🔴 CRITICAL: Version 2.0 Updates (November 6, 2025)

### What Changed and Why

**This specification was updated based on critical architecture violations found in the initial implementation.**

#### Violations Found in Initial Implementation:
1. **51 shadcn/ui bypass violations** - Custom CSS classes (`.btn-primary`, `.card-base`) instead of shadcn components
2. **11 unnecessary child components** - Excessive fragmentation (ProxyControlCard split into 4 files)
3. **62+ custom CSS classes** - 389-line index.css with duplicate functionality
4. **6 unused shadcn components** - Button, Card, Badge, Alert installed but not used

#### Corrections Applied in Version 2.0:

**1. Added shadcn/ui Component Requirements (NEW Section)**
   - Explicit rules: ALWAYS use shadcn Button, Card, Badge, Alert components
   - Clear examples showing correct vs incorrect usage
   - Forbidden patterns: Custom `.btn-*`, `.card-*`, `.alert-*` CSS classes

**2. Added Component Consolidation Guidelines (NEW Section)**
   - Rule: Default to single-file components unless reused 2+ times
   - Business logic → hooks, NOT components
   - Inline small presentation logic (<5 lines)
   - NO AuthButtons.tsx, ProxyInfoGrid.tsx, or similar single-use children

**3. Added CSS Architecture Rules (NEW Section)**
   - Target: <200 lines in index.css (was 389 lines)
   - Maximum: 20 custom CSS classes (was 62+ classes)
   - Use Tailwind utilities first, custom CSS only for animations
   - Explicit list of what NOT to create as CSS classes

**4. Updated Component Architecture Section**
   - Marked AuthenticationCard as CONSOLIDATED (no child files)
   - Marked ProxyControlCard as CONSOLIDATED (no child files)
   - Added specific line count targets (~80-100 lines)
   - Emphasized shadcn component usage in all features

**5. Updated File Structure Section**
   - Added warning comments: "⚠️ NO AuthButtons.tsx or AuthCardFooter.tsx"
   - Added utils/ directory for utility functions
   - Added useAuth hook requirement
   - Clear annotations on consolidated structure

**6. Enhanced Success Criteria**
   - Split into Functional Requirements and Architecture Requirements
   - Added "Architecture Anti-Patterns (Must Avoid)" section
   - Added comprehensive validation checklist
   - Specific file counts and line limits

### Implementation Impact

**Before (Version 1.0 Violations):**
```
❌ 4 button files with .btn-primary CSS
❌ 5 card files with .card-base CSS
❌ 11 single-use child components
❌ 389 lines of custom CSS
❌ 62+ custom CSS classes
```

**After (Version 2.0 Requirements):**
```
✅ All buttons use shadcn Button component
✅ All cards use shadcn Card components
✅ 2 consolidated components (no children)
✅ <200 lines in index.css
✅ <20 custom CSS classes
```

**Bottom Line:** Version 2.0 prevents the architecture violations that occurred in the initial implementation by providing explicit guidance on shadcn/ui usage, component consolidation, and CSS architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Functionality](#core-functionality)
3. [User Flows](#user-flows)
4. [Features Breakdown](#features-breakdown)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Services & API Integration](#services--api-integration)
8. [Styling & Theming](#styling--theming)
9. [Technology Stack](#technology-stack)
10. [File Structure](#file-structure)

---

## Overview

### Purpose
The Qwen Proxy frontend is a desktop/web application that provides a user interface for:
1. Extracting and managing Qwen credentials (tokens and cookies)
2. Controlling a local proxy server that translates OpenAI API calls to Qwen API
3. Monitoring credential status and proxy health
4. Supporting both Electron (desktop) and web browser modes

### Key Characteristics
- Dual-mode: Works as Electron app (with native window controls) and browser app
- Real-time credential polling and status monitoring
- Professional dark/light theme support
- Clean, modern UI with proper loading states and error handling

---

## Core Functionality

### 1. Credential Management

**Purpose**: Extract, store, and monitor Qwen authentication credentials

**Features**:
- **Extract Credentials** (Electron mode):
  - Opens a secure browser window to `chat.qwen.ai`
  - User logs in manually
  - App automatically extracts JWT token and cookies from browser session
  - Saves credentials to backend API server

- **Extract Credentials** (Browser mode):
  - Requires Chrome extension installation
  - Extension detects login on `chat.qwen.ai`
  - Automatically extracts and POSTs credentials to API server
  - Frontend polls API every 5 seconds to detect new credentials

- **Monitor Credentials**:
  - Display current credential status (valid/expired/missing)
  - Show expiration date/time
  - Visual indicators for credential health
  - Auto-refresh status periodically

- **Delete Credentials**:
  - Remove stored credentials from backend
  - Confirmation dialog before deletion
  - Clear UI state after deletion

### 2. Proxy Server Control

**Purpose**: Start, stop, and monitor the local proxy server

**Features**:
- **Start Proxy**:
  - POST request to `/api/proxy/start`
  - Display loading state during startup
  - Show success/error feedback
  - Update UI with running status

- **Stop Proxy**:
  - POST request to `/api/proxy/stop`
  - Display loading state during shutdown
  - Show success/error feedback
  - Update UI with stopped status

- **Monitor Proxy**:
  - Poll `/api/proxy/status` for current state
  - Display: running/stopped status, port number, uptime
  - Show proxy endpoint URL for client configuration
  - Visual indicators for proxy health

### 3. Status Monitoring & Feedback

**Purpose**: Provide real-time feedback on system state

**Features**:
- **Alert System**:
  - Success alerts (green) for completed operations
  - Error alerts (red) for failed operations
  - Auto-dismiss or manual close
  - Contextual messages

- **Status Indicators**:
  - Credential status badge (active/inactive/expired)
  - Proxy status badge (running/stopped)
  - Environment badge (Desktop/Browser mode)
  - Visual pulse animations for active states

- **Status Bar**:
  - Bottom bar showing current system state
  - Updates based on proxy and credential status
  - Always visible for quick glance

### 4. Dual-Mode Support

**Purpose**: Work seamlessly in both Electron and browser environments

**Features**:
- **Electron Mode**:
  - Frameless window with custom title bar
  - Window controls (minimize, maximize, close)
  - Draggable title bar region
  - Native window integration via IPC
  - Direct cookie extraction from Electron session

- **Browser Mode**:
  - Standard browser experience
  - No window controls displayed
  - Chrome extension for credential extraction
  - Works with any modern browser

### 5. Theme System

**Purpose**: Support light and dark themes with proper contrast

**Features**:
- **Theme Toggle**:
  - Button in title bar (sun/moon icon)
  - Switches between light and dark mode
  - Persists preference to localStorage
  - Instant visual update across all components

- **Theme Implementation**:
  - CSS custom properties (CSS variables)
  - Automatic theme switching via `.dark` class
  - All colors use theme variables (no hardcoded colors)
  - Professional color palettes for both modes

---

## User Flows

### Flow 1: First-Time Setup (Electron Mode)

1. User launches Electron app
2. Sees dashboard with "Not Connected" status
3. Clicks "Connect to Qwen" button
4. Secure browser window opens to `chat.qwen.ai`
5. User logs in with Qwen credentials
6. Window closes automatically after login detected
7. Credentials extracted and saved to API
8. Dashboard updates to show "Active" status with expiration date
9. User can now start the proxy server

### Flow 2: First-Time Setup (Browser Mode)

1. User opens web app in browser
2. Sees dashboard with "Not Connected" status
3. Clicks "Connect to Qwen" button
4. Detects Chrome extension not installed
5. Shows installation instructions
6. User installs extension from Chrome Web Store
7. User navigates to `chat.qwen.ai` and logs in
8. Extension auto-extracts credentials and POSTs to API
9. Frontend polls and detects new credentials within 5 seconds
10. Dashboard updates to show "Active" status

### Flow 3: Starting the Proxy

1. User has valid credentials (credential status shows "Active")
2. Proxy status shows "Stopped"
3. User clicks "Start Proxy" button
4. Button shows loading spinner
5. Backend starts proxy server on port 3001
6. UI updates to show "Running" status with port number
7. Proxy endpoint URL displayed for client configuration
8. Status bar updates to show "Proxy running on port 3001"

### Flow 4: Credential Re-authentication

1. Credentials expire (shows "Expired" status)
2. User clicks "Re-authenticate" button
3. Follows same flow as first-time setup
4. New credentials replace expired ones
5. Dashboard updates with new expiration date

### Flow 5: Theme Switching

1. User clicks theme toggle button in title bar
2. UI instantly switches between light and dark mode
3. Preference saved to localStorage
4. Theme persists across app restarts

---

## Features Breakdown

### Feature 1: Authentication Card

**Location**: Main dashboard, left side (2/3 width)

**Components**:
- Card header with lock icon and title
- Status badge (Active/Not Connected/Expired)
- Expiration date display (if credentials exist)
- Action buttons:
  - "Connect to Qwen" / "Re-authenticate" button (primary action)
  - "Revoke" button (danger action, only shown when credentials exist)
- Instructions footer with info icon

**Behavior**:
- Shows loading spinner when extracting credentials
- Disables buttons during operations
- Updates status badge in real-time
- Displays appropriate message based on mode (Electron vs Browser)

### Feature 2: Proxy Control Card

**Location**: Main dashboard, left side (2/3 width), below authentication

**Components**:
- Card header with server icon and title
- Status badge (Running/Stopped)
- Info grid showing:
  - Port number (e.g., 3001)
  - Uptime (if running)
- Action buttons:
  - "Start Proxy" button (disabled if already running)
  - "Stop Proxy" button (disabled if not running)
- Endpoint info box with:
  - Copy-able proxy URL
  - Configuration instructions

**Behavior**:
- Shows loading spinner when starting/stopping
- Disables buttons during state transitions
- Polls backend for status updates
- Updates uptime counter in real-time

### Feature 3: System Stats Card

**Location**: Main dashboard, right side (1/3 width)

**Components**:
- Card header with "System Status" title
- Stats grid showing:
  - Credentials status (Valid/None)
  - Proxy status (Running/Stopped)
  - Mode (Desktop/Browser)

**Behavior**:
- Updates automatically based on credential and proxy state
- Color-coded status indicators
- Compact, at-a-glance information

### Feature 4: Connection Guide Card

**Location**: Main dashboard, right side (1/3 width), below proxy control

**Components**:
- Card header with info icon and "Quick Guide" title
- Numbered steps:
  1. Authenticate with Qwen credentials
  2. Start the proxy server
  3. Configure OpenAI client with proxy URL

**Behavior**:
- Static instructional content
- Helps users understand the workflow

### Feature 5: Credentials Detail Card

**Location**: Bottom of dashboard (only shown when credentials exist)

**Components**:
- Card header with document icon and title
- Token display (truncated, first 80 characters)
- Expiration date
- Cookie string (truncated, first 40 characters)

**Behavior**:
- Only appears after successful authentication
- Shows last extracted credentials
- Read-only display

### Feature 6: Status Alert Banner

**Location**: Top of dashboard (appears when needed)

**Components**:
- Success/error icon
- Alert title
- Descriptive message
- Auto-dismiss or manual close option

**Behavior**:
- Appears after operations (success or failure)
- Color-coded (green for success, red for error)
- Slides in with animation
- Dismisses automatically or manually

### Feature 7: Environment Badge

**Location**: Top right of dashboard header

**Components**:
- Badge with animated indicator dot
- Text: "Desktop Mode" or "Browser Mode"
- Color-coded (purple for desktop, blue for browser)

**Behavior**:
- Automatically detects runtime environment
- Static display, no interaction

### Feature 8: Title Bar

**Location**: Top of application window

**Components**:
- Left side:
  - App logo (lightning bolt icon)
  - App title ("Qwen Proxy")
- Right side:
  - Theme toggle button (sun/moon icon)
  - Window controls (Electron only):
    - Minimize button
    - Maximize/restore button
    - Close button (red hover)

**Behavior**:
- Draggable (Electron mode) for window movement
- Theme toggle switches theme instantly
- Window controls only appear in Electron mode
- Close button has red hover state for danger

### Feature 9: Status Bar

**Location**: Bottom of application window

**Components**:
- Status indicator dot (green when proxy running)
- Status text message

**Behavior**:
- Updates based on proxy and credential status
- Shows "Ready", "Proxy running on port 3001", etc.
- Always visible at bottom

---

## Component Architecture

### CRITICAL RULES FOR COMPONENT STRUCTURE

#### Component Consolidation Guidelines
**IMPORTANT**: Avoid unnecessary component fragmentation. Follow these rules:

1. **Default to Single-File Components**
   - Keep related UI in one file unless there's a clear reuse case
   - Target: <100 lines per component file
   - Only split when a child component is used in 2+ parent components

2. **When to Split Components**
   - ✅ Component is reused in multiple places
   - ✅ Component has complex isolated logic that can be extracted
   - ✅ File exceeds 125 lines and has clear separation of concerns
   - ❌ Component is only used once in a parent
   - ❌ Child component is <30 lines of pure presentation
   - ❌ Business logic that should be a hook instead

3. **Business Logic Belongs in Hooks**
   - If a "component" is primarily business logic, extract to a custom hook
   - Example: Authentication handlers → `useAuth()` hook, not `AuthButtons` component
   - Keep components focused on presentation and composition

4. **Inline Small Presentation Logic**
   - Footer text (< 5 lines) → inline in parent JSX
   - Simple formatting helpers → inline or utility function
   - Status rendering (<10 lines) → inline with ternary/conditional

### shadcn/ui Component Requirements

#### CRITICAL: Always Use shadcn/ui Components
**The project uses shadcn/ui as the component foundation. NEVER bypass it with custom CSS.**

1. **Required shadcn/ui Components**
   - ✅ USE: `Button` from `@/components/ui/button`
   - ✅ USE: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` from `@/components/ui/card`
   - ✅ USE: `Badge` from `@/components/ui/badge` (install if needed)
   - ✅ USE: `Alert`, `AlertTitle`, `AlertDescription` from `@/components/ui/alert` (install if needed)
   - ✅ USE: `Input`, `Label`, `Textarea` for form elements
   - ❌ NEVER: Create `.btn-primary`, `.btn-danger` CSS classes
   - ❌ NEVER: Create `.card-base`, `.card-header` div structures
   - ❌ NEVER: Create custom alert/badge CSS classes

2. **Button Usage**
   ```typescript
   // ✅ CORRECT
   import { Button } from '@/components/ui/button'
   <Button variant="default">Connect</Button>
   <Button variant="destructive">Revoke</Button>
   <Button variant="secondary">Cancel</Button>

   // ❌ WRONG - Do not create custom button CSS
   <button className="btn-primary">Connect</button>
   <button className="btn-danger">Revoke</button>
   ```

3. **Card Usage**
   ```typescript
   // ✅ CORRECT
   import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

   <Card>
     <CardHeader>
       <div className="flex items-center gap-3">
         <Icon className="h-5 w-5 text-primary" />
         <CardTitle>Title</CardTitle>
       </div>
     </CardHeader>
     <CardContent>
       {/* content */}
     </CardContent>
   </Card>

   // ❌ WRONG - Do not create custom card div structures
   <div className="card-base">
     <div className="card-header">
       <h2 className="card-header-title">Title</h2>
     </div>
     <div className="card-content">...</div>
   </div>
   ```

4. **Badge/Status Indicators**
   ```typescript
   // ✅ CORRECT - Create a StatusBadge component using shadcn Badge
   import { Badge } from '@/components/ui/badge'

   <Badge variant={isActive ? "default" : "secondary"}>
     {isActive ? "Active" : "Inactive"}
   </Badge>

   // ❌ WRONG - Do not use span with custom CSS classes
   <span className="status-badge-active">Active</span>
   <span className="status-badge-inactive">Inactive</span>
   ```

5. **Alert Usage**
   ```typescript
   // ✅ CORRECT
   import { Alert, AlertDescription } from '@/components/ui/alert'

   <Alert variant={type === 'error' ? 'destructive' : 'default'}>
     <AlertDescription>{message}</AlertDescription>
   </Alert>

   // ❌ WRONG - Do not create custom alert with CSS classes
   <div className="status-alert status-alert-success">
     <span className="status-alert-message">{message}</span>
   </div>
   ```

### CSS Architecture Rules

#### CRITICAL: Minimize Custom CSS Classes

1. **Use Tailwind Utilities First**
   - Default to Tailwind utility classes (e.g., `flex items-center gap-2`)
   - Only create custom CSS classes when:
     - Pattern repeats 3+ times across different components
     - Complex animation/transition that's reusable
     - Component-specific styling that's too complex for inline

2. **What NOT to Create as CSS Classes**
   - ❌ Layout utilities (use Tailwind: `flex`, `grid`, `space-y-4`)
   - ❌ Spacing utilities (use Tailwind: `p-4`, `m-2`, `gap-3`)
   - ❌ Color utilities (use theme variables: `text-primary`, `bg-card`)
   - ❌ Button styles (use shadcn Button component)
   - ❌ Card styles (use shadcn Card component)
   - ❌ Single-use component styles (inline Tailwind classes)

3. **Custom CSS Class Limit**
   - Target: <20 custom CSS classes in index.css
   - Categories allowed:
     - Theme variables and base styles (required)
     - Animation keyframes (@keyframes)
     - Complex reusable patterns (used 3+ times)
   - **Red flag**: If index.css exceeds 200 lines, you're doing it wrong

4. **Component-Scoped Styling Pattern**
   ```typescript
   // ✅ CORRECT - Inline Tailwind for unique component styling
   <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
     <Icon className="h-5 w-5 text-primary" />
     <span className="text-sm font-medium">Content</span>
   </div>

   // ❌ WRONG - Creating custom CSS class for one-time use
   // index.css: .proxy-info-item { ... }
   <div className="proxy-info-item">...</div>
   ```

### Page Components

#### HomePage (`/pages/HomePage.tsx`)
- Main dashboard page
- Composes all feature components
- Manages page-level layout
- Initiates credential polling hook
- **RULE**: Keep all pages and components under 125 lines by using component composition

### Layout Components

#### AppLayout (`/components/layout/AppLayout.tsx`)
- Root layout container
- Full-height flexbox layout
- Wraps: TitleBar, main content, StatusBar
- Background gradient (use Tailwind gradient utilities)
- **RULE**: No custom CSS classes for layout, use Tailwind

#### TitleBar (`/components/layout/TitleBar.tsx`)
- Custom title bar
- App logo and title
- Theme toggle button (use shadcn Button)
- Window controls (Electron only)
- Draggable region
- **RULE**: Use shadcn Button for all buttons

#### StatusBar (`/components/layout/StatusBar.tsx`)
- Bottom status bar
- Status indicator dot (inline Tailwind, animated)
- Status text message
- **RULE**: No custom CSS classes, use Tailwind utilities

### Feature Components

#### AuthenticationCard (`/components/features/authentication/AuthenticationCard.tsx`)
- **CONSOLIDATED COMPONENT** (no separate child files)
- Uses shadcn Card, CardHeader, CardTitle, CardContent
- Status display using StatusBadge component
- Buttons using shadcn Button with variants
- Instructions footer (inline, not separate component)
- Authentication logic extracted to `useAuth` hook
- **TARGET**: ~80-100 lines total (consolidated)
- **RULE**: Do NOT split into AuthButtons.tsx or AuthCardFooter.tsx
- **RULE**: Extract business logic to hooks, not components

#### ProxyControlCard (`/components/features/proxy/ProxyControlCard.tsx`)
- **CONSOLIDATED COMPONENT** (no separate child files)
- Uses shadcn Card components
- Proxy info grid (inline, not separate component)
- Control buttons using shadcn Button (inline, not separate component)
- Endpoint info (inline, not separate component)
- Uses `useProxyControl` hook for business logic
- **TARGET**: ~80-100 lines total (consolidated)
- **RULE**: Do NOT split into ProxyInfoGrid.tsx, ProxyControlButtons.tsx, or ProxyEndpointInfo.tsx

#### SystemStatsCard (`/components/features/stats/SystemStatsCard.tsx`)
- Uses shadcn Card components
- System status overview grid
- StatusBadge components for visual indicators
- **RULE**: Use Tailwind grid utilities, no custom CSS

#### ConnectionGuideCard (`/components/features/stats/ConnectionGuideCard.tsx`)
- Uses shadcn Card components
- Numbered steps list
- **RULE**: Inline styling with Tailwind

#### CredentialsDetailCard (`/components/features/credentials/CredentialsDetailCard.tsx`)
- Uses shadcn Card components
- Token/cookie display with truncation (utility function, not component)
- **RULE**: Only shown when credentials exist

#### StatusAlert (`/components/features/alerts/StatusAlert.tsx`)
- **MUST USE** shadcn Alert, AlertDescription components
- Success/error variants using Alert variant prop
- Icon and message composition
- **RULE**: No custom CSS classes, use shadcn Alert variants
- **TARGET**: <30 lines

### UI Components

#### StatusBadge (`/components/ui/status-badge.tsx`)
- **MUST CREATE**: Wrapper around shadcn Badge component
- Variants: active, inactive, expired, running, stopped
- Uses shadcn Badge as foundation with custom variants
- **RULE**: Compose from shadcn Badge, don't create custom CSS

#### EnvironmentBadge (`/components/ui/EnvironmentBadge.tsx`)
- **MUST USE** shadcn Badge as foundation
- Desktop/Browser mode indicator
- Animated pulse dot (CSS animation)
- **RULE**: Compose from shadcn Badge component

---

## State Management

### Zustand Stores

#### useCredentialsStore (`/stores/useCredentialsStore.ts`)
**Purpose**: Manage credential state globally

**State**:
```typescript
{
  status: {
    hasCredentials: boolean;
    isValid: boolean;
    expiresAt: number | undefined;
  };
  credentials: {
    token: string;
    cookies: string;
    expiresAt: number;
  } | null;
  loading: boolean;
  error: string | null;
}
```

**Actions**:
- `setStatus(status)` - Update credential status
- `setCredentials(credentials)` - Store credential data
- `clearCredentials()` - Clear all credential data
- `setLoading(loading)` - Set loading state
- `setError(error)` - Set error message

**Persistence**: Saved to localStorage under key `qwen-proxy-credentials`

#### useProxyStore (`/stores/useProxyStore.ts`)
**Purpose**: Manage proxy server state globally

**State**:
```typescript
{
  status: {
    isRunning: boolean;
    port: number | undefined;
    startedAt: number | undefined;
  };
  loading: boolean;
  error: string | null;
}
```

**Actions**:
- `setStatus(status)` - Update proxy status
- `setLoading(loading)` - Set loading state
- `setError(error)` - Set error message

**Persistence**: No persistence (runtime state only)

#### useAlertStore (`/stores/useAlertStore.ts`)
**Purpose**: Manage alert/notification state globally

**State**:
```typescript
{
  alert: {
    type: 'success' | 'error';
    message: string;
  } | null;
}
```

**Actions**:
- `showAlert(type, message)` - Display alert
- `hideAlert()` - Hide alert

**Persistence**: No persistence

### Context Providers

#### ThemeContext (`/contexts/ThemeContext.tsx`)
**Purpose**: Manage theme state (light/dark)

**State**:
```typescript
{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**Behavior**:
- Loads saved theme from localStorage on mount
- Toggles `.dark` class on `document.documentElement`
- Saves theme to localStorage on change
- Defaults to `dark` mode

---

## Services & API Integration

### Services

#### authService (`/services/authService.ts`)
**Purpose**: Handle authentication operations

**Methods**:
- `openLogin()` - Open Qwen login window (Electron) or navigate to login (Browser)
- `extractCredentials()` - Extract credentials from Electron session
- `isElectron()` - Detect if running in Electron

**Dependencies**: window.electronAPI (Electron mode)

#### credentialsService (`/services/credentials.service.ts`)
**Purpose**: API communication for credential management

**Methods**:
- `getCredentialStatus()` - GET `/api/qwen/credentials/status`
- `saveCredentials(credentials)` - POST `/api/qwen/credentials`
- `deleteCredentials()` - DELETE `/api/qwen/credentials`

**Response Format**:
```typescript
{
  hasCredentials: boolean;
  isValid: boolean;
  expiresAt?: number;
}
```

#### proxyService (`/services/proxy.service.ts`)
**Purpose**: API communication for proxy control

**Methods**:
- `startProxy()` - POST `/api/proxy/start`
- `stopProxy()` - POST `/api/proxy/stop`
- `getProxyStatus()` - GET `/api/proxy/status`

**Backend Response Format**:
```typescript
{
  status: 'running' | 'stopped' | 'already_running';
  providerRouter?: {
    running?: boolean;
    port?: number;
    pid?: number;
    uptime?: number;
  };
  qwenProxy?: {
    running?: boolean;
    port?: number;
    pid?: number;
    uptime?: number;
  };
  message: string;
}
```

**Frontend Format** (after conversion):
```typescript
{
  isRunning: boolean;
  port?: number;
  startedAt?: number;
}
```

#### browserExtensionService (`/services/browser-extension.service.ts`)
**Purpose**: Handle browser extension integration

**Methods**:
- `isExtensionInstalled()` - Check if Chrome extension is installed
- `openQwenLogin()` - Open Qwen login page in new tab
- `openInstallInstructions()` - Open extension installation instructions

**Extension ID**: `qwen-proxy-extension`

### Custom Hooks

#### useCredentialPolling (`/hooks/useCredentialPolling.ts`)
**Purpose**: Poll credential status every 5 seconds

**Behavior**:
- Polls `/api/qwen/credentials/status` every 5 seconds
- Stops polling when valid credentials detected
- Updates `useCredentialsStore` with results
- Handles errors gracefully

#### useProxyControl (`/hooks/useProxyControl.ts`)
**Purpose**: Provide proxy control methods with loading states

**Returns**:
```typescript
{
  startProxy: () => Promise<ProxyStatus>;
  stopProxy: () => Promise<ProxyStatus>;
  starting: boolean;
  stopping: boolean;
  error: string | null;
}
```

#### useProxyStatus (`/hooks/useProxyStatus.ts`)
**Purpose**: Poll proxy status and manage state

**Returns**:
```typescript
{
  status: ProxyStatus;
  loading: boolean;
  refetch: () => Promise<void>;
}
```

**Behavior**:
- Polls `/api/proxy/status` periodically
- Updates `useProxyStore`
- Provides manual refetch method

---

## Styling & Theming

### Theme Variables

#### Light Mode Colors (`:root`)
```css
--background: 0 0% 100%;              /* White background */
--foreground: 222.2 84% 4.9%;         /* Dark text */
--card: 0 0% 100%;                    /* White cards */
--primary: 239 84% 67%;               /* Indigo primary */
--secondary: 210 40% 96.1%;           /* Light gray secondary */
--muted: 210 40% 96.1%;               /* Light muted */
--accent: 210 40% 96.1%;              /* Light accent */
--destructive: 0 84.2% 60.2%;         /* Red danger */
--success: 142 76% 36%;               /* Green success */
--border: 214.3 31.8% 91.4%;          /* Light borders */
```

#### Dark Mode Colors (`.dark`)
```css
--background: 222 47% 4%;             /* Near-black background */
--foreground: 210 40% 98%;            /* Off-white text */
--card: 217 33% 17%;                  /* Dark gray cards */
--primary: 239 84% 67%;               /* Indigo primary */
--secondary: 271 91% 65%;             /* Purple secondary */
--muted: 215 25% 27%;                 /* Dark muted */
--accent: 217 33% 22%;                /* Dark accent */
--destructive: 0 84% 60%;             /* Red danger */
--success: 142 76% 45%;               /* Emerald success */
--border: 215 25% 35%;                /* Dark borders */
```

### CSS Architecture & Best Practices

#### 1. Primary Styling Approach
**Use Tailwind utility classes for all component styling.**

```typescript
// ✅ CORRECT - Inline Tailwind utilities
<div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
  <span className="text-sm font-medium text-foreground">Status</span>
  <Badge variant="default">Active</Badge>
</div>

// ❌ WRONG - Custom CSS classes
<div className="status-container">
  <span className="status-label">Status</span>
  <span className="status-badge-active">Active</span>
</div>
```

#### 2. Custom CSS - Only When Necessary
Create custom CSS classes ONLY for:

**A. Reusable Animations**
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-dot {
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

**B. Complex Patterns Used 3+ Times**
```css
/* Only if this exact pattern appears in 3+ components */
.glass-effect {
  @apply backdrop-blur-sm bg-white/10 border border-white/20;
}
```

**C. Base/Reset Styles**
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  @apply bg-background text-foreground;
}
```

#### 3. What NOT to Create as CSS Classes

**❌ NEVER create custom classes for:**
- Buttons (use shadcn Button)
- Cards (use shadcn Card)
- Badges (use shadcn Badge)
- Alerts (use shadcn Alert)
- Form elements (use shadcn Input, Label, Textarea)
- Layout containers (use Tailwind: `flex`, `grid`, `container`)
- Spacing utilities (use Tailwind: `p-4`, `m-2`, `gap-3`, `space-y-4`)
- Color utilities (use Tailwind with theme vars: `bg-primary`, `text-foreground`)
- Typography (use Tailwind: `text-sm`, `font-medium`, `leading-6`)

#### 4. index.css Structure & Limits

**Target: <200 lines total in index.css**

**Required sections:**
```css
/* 1. Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 2. CSS Custom Properties (theme variables) */
@layer base {
  :root {
    --background: 0 0% 100%;
    /* ... other theme variables */
  }

  .dark {
    --background: 222 47% 4%;
    /* ... dark theme variables */
  }
}

/* 3. Base/reset styles */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/* 4. Reusable animations (if needed) */
@layer utilities {
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .animate-pulse-dot {
    animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

/* 5. Complex reusable patterns (MAX 5 classes) */
@layer components {
  /* Only add if pattern used 3+ times across different components */
}
```

**Red Flags:**
- ❌ index.css over 200 lines → You're creating too many custom classes
- ❌ More than 20 custom classes → Use Tailwind utilities instead
- ❌ Classes like `.btn-*`, `.card-*`, `.alert-*` → Use shadcn components
- ❌ Single-use component classes → Inline Tailwind instead

#### 5. Component Styling Pattern

**Pattern 1: Simple Components (Most Common)**
```typescript
// No custom CSS needed - use Tailwind utilities
export const SimpleCard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        Title
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Content here</p>
    </CardContent>
  </Card>
)
```

**Pattern 2: Components with Animation**
```typescript
// Custom animation in index.css, applied via Tailwind
export const StatusIndicator = () => (
  <div className="flex items-center gap-2">
    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse-dot" />
    <span className="text-sm">Active</span>
  </div>
)
```

**Pattern 3: Complex Reusable Pattern (Rare)**
```typescript
// Only if this exact pattern used 3+ times
// Add to index.css: .glass-card { @apply backdrop-blur-sm bg-white/10 ... }
export const GlassCard = () => (
  <div className="glass-card p-4 rounded-lg">
    {/* content */}
  </div>
)
```

### Styling Checklist for Implementation

Before writing any CSS class, ask:
1. ☑️ Can I use a shadcn component? (Button, Card, Badge, Alert, etc.)
2. ☑️ Can I use Tailwind utilities? (`flex`, `bg-card`, `p-4`, etc.)
3. ☑️ Is this pattern used 3+ times across different components?
4. ☑️ Is this a complex animation that can't be done inline?

If all answers are NO, use inline Tailwind utilities. Do NOT create a custom CSS class.

---

## Technology Stack

### Core Framework
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### State Management
- **Zustand** - Global state management
- **zustand/middleware** - Persistence middleware
- **React Context API** - Theme management

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes
- **CSS Custom Properties** - Theme variables

### UI Components
- **react-icons** - Icon library (VSCode Chrome icons for window controls)
- Custom components - Built from scratch

### Electron Integration
- **Electron IPC** - Communication with main process
- **Context Bridge** - Secure API exposure
- **Session API** - Cookie extraction

### API Communication
- **Fetch API** - HTTP requests
- **REST API** - Backend communication

### Development Tools
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **Vite HMR** - Hot module replacement

### Browser Support
- **Modern Browsers** - Chrome, Firefox, Safari, Edge
- **Electron** - Desktop application wrapper

---

## File Structure

### CRITICAL: Consolidated Component Structure

**Follow this structure exactly. Do NOT create additional child component files.**

```
frontend/
├── public/
│   └── extension-install.html         # Extension installation instructions
│
├── src/
│   ├── components/
│   │   ├── features/
│   │   │   ├── alerts/
│   │   │   │   └── StatusAlert.tsx                    # Uses shadcn Alert (<30 lines)
│   │   │   ├── authentication/
│   │   │   │   └── AuthenticationCard.tsx             # CONSOLIDATED (~80-100 lines)
│   │   │   │                                          # ⚠️ NO AuthButtons.tsx or AuthCardFooter.tsx
│   │   │   ├── credentials/
│   │   │   │   └── CredentialsDetailCard.tsx          # Uses shadcn Card
│   │   │   ├── proxy/
│   │   │   │   └── ProxyControlCard.tsx               # CONSOLIDATED (~80-100 lines)
│   │   │   │                                          # ⚠️ NO ProxyInfoGrid, ProxyControlButtons, or ProxyEndpointInfo
│   │   │   └── stats/
│   │   │       ├── ConnectionGuideCard.tsx            # Uses shadcn Card
│   │   │       └── SystemStatsCard.tsx                # Uses shadcn Card
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx                          # Tailwind layout, no custom CSS
│   │   │   ├── StatusBar.tsx                          # Tailwind utilities
│   │   │   └── TitleBar.tsx                           # Uses shadcn Button
│   │   └── ui/
│   │       ├── badge.tsx                              # shadcn Badge (install via CLI)
│   │       ├── button.tsx                             # shadcn Button (existing)
│   │       ├── card.tsx                               # shadcn Card (existing)
│   │       ├── alert.tsx                              # shadcn Alert (install via CLI)
│   │       ├── status-badge.tsx                       # MUST CREATE: wraps shadcn Badge
│   │       └── environment-badge.tsx                  # Uses shadcn Badge as foundation
│   │
│   ├── contexts/
│   │   └── ThemeContext.tsx                           # Theme state management
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                                 # ⚠️ MUST CREATE: auth logic from AuthButtons
│   │   ├── useCredentialPolling.ts                    # Credential polling logic
│   │   ├── useProxyControl.ts                         # Proxy control logic
│   │   └── useProxyStatus.ts                          # Proxy status polling
│   │
│   ├── pages/
│   │   └── HomePage.tsx                               # Composes all feature components
│   │
│   ├── services/
│   │   ├── authService.ts                             # Electron/browser auth handling
│   │   ├── browser-extension.service.ts               # Extension integration
│   │   ├── credentials.service.ts                     # Credentials API
│   │   └── proxy.service.ts                           # Proxy API
│   │
│   ├── stores/
│   │   ├── useAlertStore.ts                           # Alert state (Zustand)
│   │   ├── useCredentialsStore.ts                     # Credentials state (Zustand)
│   │   └── useProxyStore.ts                           # Proxy state (Zustand)
│   │
│   ├── types/
│   │   ├── alert.types.ts                             # Alert type definitions
│   │   ├── credentials.types.ts                       # Credentials type definitions
│   │   ├── electron-api.types.ts                      # Electron API types
│   │   └── proxy.types.ts                             # Proxy type definitions
│   │
│   ├── utils/
│   │   └── string.utils.ts                            # String helpers (truncation, etc.)
│   │
│   ├── App.tsx                                        # Root component with providers
│   ├── main.tsx                                       # Entry point
│   ├── index.css                                      # <200 lines: theme vars + minimal custom CSS
│   └── vite-env.d.ts                                  # Vite type definitions
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

### File Structure Rules

1. **Component Files**
   - Each feature component is a SINGLE file (no child components unless reused elsewhere)
   - Target: <100 lines per component
   - Maximum: 125 lines per file

2. **UI Components (`/components/ui/`)**
   - Only shadcn/ui components belong here
   - Install via shadcn CLI: `npx shadcn@latest add [component]`
   - Custom wrappers (like `status-badge.tsx`) must compose from shadcn components

3. **Hooks (`/hooks/`)**
   - Business logic extracted from components
   - Reusable state management and effects
   - Example: `useAuth` contains authentication handlers, NOT `AuthButtons` component

4. **Utils (`/utils/`)**
   - Pure utility functions (no React hooks)
   - String manipulation, formatting, validation
   - Example: `truncate(str, length)` instead of `TruncateText` component

5. **index.css**
   - Target: <200 lines
   - Theme variables + base styles + minimal animations
   - No component-specific CSS classes (use Tailwind)

---

## API Endpoints Required

### Credentials API

#### GET `/api/qwen/credentials/status`
**Purpose**: Get current credential status
**Response**:
```json
{
  "hasCredentials": true,
  "isValid": true,
  "expiresAt": 1699123456789
}
```

#### POST `/api/qwen/credentials`
**Purpose**: Save new credentials
**Body**:
```json
{
  "token": "eyJ...",
  "cookies": "token=...; bx-umidtoken=...",
  "expiresAt": 1699123456789
}
```
**Response**:
```json
{
  "success": true,
  "message": "Credentials saved"
}
```

#### DELETE `/api/qwen/credentials`
**Purpose**: Delete stored credentials
**Response**:
```json
{
  "success": true,
  "message": "Credentials deleted"
}
```

### Proxy API

#### POST `/api/proxy/start`
**Purpose**: Start the proxy server
**Response**:
```json
{
  "status": "running",
  "qwenProxy": {
    "running": true,
    "port": 3001,
    "pid": 12345,
    "uptime": 0
  },
  "message": "Proxy started successfully"
}
```

#### POST `/api/proxy/stop`
**Purpose**: Stop the proxy server
**Response**:
```json
{
  "status": "stopped",
  "message": "Proxy stopped successfully"
}
```

#### GET `/api/proxy/status`
**Purpose**: Get current proxy status
**Response**:
```json
{
  "status": "running",
  "qwenProxy": {
    "running": true,
    "port": 3001,
    "pid": 12345,
    "uptime": 123.45
  },
  "message": "Proxy is running"
}
```

---

## Electron IPC Requirements

### Preload Script Exposed APIs

#### `window.electronAPI.qwen.openLogin()`
**Purpose**: Open Qwen login window
**Returns**: `Promise<void>`
**IPC Channel**: `qwen:open-login`

#### `window.electronAPI.qwen.extractCredentials()`
**Purpose**: Extract credentials from Electron session
**Returns**: `Promise<{token: string, cookies: string, expiresAt: number}>`
**IPC Channel**: `qwen:extract-credentials`

#### `window.electronAPI.window.minimize()`
**Purpose**: Minimize application window
**Returns**: `void`
**IPC Channel**: `window:minimize`

#### `window.electronAPI.window.maximize()`
**Purpose**: Maximize/restore application window
**Returns**: `void`
**IPC Channel**: `window:maximize`

#### `window.electronAPI.window.close()`
**Purpose**: Close application window
**Returns**: `void`
**IPC Channel**: `window:close`

### Main Process IPC Handlers

#### `ipcMain.handle('qwen:open-login')`
**Purpose**: Create BrowserWindow, load chat.qwen.ai, detect login, extract cookies
**Behavior**: Closes window after successful login detected

#### `ipcMain.handle('qwen:extract-credentials')`
**Purpose**: Get all cookies from `.qwen.ai` domain, format as credential object
**Returns**: `{token, cookies, expiresAt}`

#### `ipcMain.on('window:minimize')`
**Purpose**: Call `BrowserWindow.minimize()`

#### `ipcMain.on('window:maximize')`
**Purpose**: Toggle `BrowserWindow.maximize()` / `unmaximize()`

#### `ipcMain.on('window:close')`
**Purpose**: Call `BrowserWindow.close()`

---

## Chrome Extension Requirements

### Extension Manifest
- Manifest V3
- Permissions: `cookies`, `tabs`, host permission for `https://chat.qwen.ai/*`
- Background service worker

### Extension Behavior
1. Monitors navigation to `chat.qwen.ai`
2. Detects successful login via cookie presence
3. Extracts JWT token and cookies
4. POSTs credentials to `http://localhost:3002/api/qwen/credentials`
5. Shows success notification

### Extension Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker for cookie monitoring
- `icons/` - Extension icons (16x16, 32x32, 48x48, 128x128)

---

## Known Issues & Limitations

### Current State
- Theme toggle exists but theme switching may not fully work across all components
- Window controls in Electron may not be fully functional (IPC handlers exist)
- Extension installation instructions are static HTML
- No error retry mechanisms
- No offline support
- Polling could be optimized with WebSockets

### Missing Features
- Settings page for configuration
- Credential history/management
- Proxy logs viewer
- Health check monitoring
- Notification system
- Multi-profile support

---

## Success Criteria

A successful frontend implementation should:

### Functional Requirements
1. ✅ Extract credentials in both Electron and Browser modes
2. ✅ Store credentials to backend API
3. ✅ Poll and display credential status
4. ✅ Start and stop proxy server via API
5. ✅ Display proxy status and endpoint information
6. ✅ Show appropriate loading states during operations
7. ✅ Display success/error feedback to users
8. ✅ Support light and dark themes with toggle
9. ✅ Work seamlessly in both Electron and browser environments
10. ✅ Have professional, polished UI with smooth interactions
11. ✅ Provide clear user guidance and instructions

### Architecture Requirements (CRITICAL)
12. ✅ **Use shadcn/ui components exclusively** - NO custom button/card/alert CSS classes
13. ✅ **All buttons use shadcn Button** with proper variants (default, destructive, secondary)
14. ✅ **All cards use shadcn Card** components (Card, CardHeader, CardTitle, CardContent)
15. ✅ **All badges use shadcn Badge** or custom wrappers that compose from Badge
16. ✅ **All alerts use shadcn Alert** components
17. ✅ **index.css under 200 lines** - theme variables, base styles, minimal animations only
18. ✅ **Maximum 20 custom CSS classes** - use Tailwind utilities for everything else
19. ✅ **No component fragmentation** - consolidated single files for AuthenticationCard and ProxyControlCard
20. ✅ **Business logic in hooks** - useAuth for auth logic, NOT AuthButtons component
21. ✅ **All files under 125 lines** - if exceeding, split logically or extract to hooks
22. ✅ **Inline Tailwind utilities** for component-specific styling (flex, gap, p-4, etc.)

### Architecture Anti-Patterns (Must Avoid)
❌ Creating `.btn-primary`, `.btn-danger` CSS classes
❌ Creating `.card-base`, `.card-header` div structures
❌ Creating `.status-badge-*` CSS classes (use StatusBadge component)
❌ Creating single-use child components (AuthButtons.tsx, ProxyInfoGrid.tsx, etc.)
❌ Putting business logic in components instead of hooks
❌ Creating custom CSS for layout/spacing (use Tailwind)
❌ index.css over 200 lines or 20+ custom classes
❌ Component files over 125 lines

### Validation Checklist
Before considering implementation complete, verify:

**Component Structure:**
- [ ] AuthenticationCard is a single file (~80-100 lines)
- [ ] ProxyControlCard is a single file (~80-100 lines)
- [ ] No AuthButtons.tsx, AuthCardFooter.tsx, ProxyInfoGrid.tsx, ProxyControlButtons.tsx, or ProxyEndpointInfo.tsx files exist
- [ ] All feature components use shadcn Card components
- [ ] All buttons use shadcn Button component with variants

**CSS Architecture:**
- [ ] index.css is under 200 lines total
- [ ] Fewer than 20 custom CSS classes defined
- [ ] No `.btn-*`, `.card-*`, `.alert-*`, or `.status-badge-*` classes in CSS
- [ ] All component styling uses Tailwind utilities or shadcn components

**Business Logic:**
- [ ] Authentication logic extracted to `useAuth` hook
- [ ] Proxy control logic in `useProxyControl` hook
- [ ] Components focused on presentation and composition

**shadcn/ui Usage:**
- [ ] Button component from `@/components/ui/button` used for all buttons
- [ ] Card, CardHeader, CardTitle, CardContent from `@/components/ui/card` used for all cards
- [ ] Badge from `@/components/ui/badge` used for status indicators
- [ ] Alert from `@/components/ui/alert` used for notifications

**File Organization:**
- [ ] No unnecessary child component files
- [ ] Utils directory exists for pure utility functions
- [ ] Hooks directory contains extracted business logic
- [ ] All files under 125 lines

---

## Recommended Implementation Order

### Phase 1: Core Infrastructure (1-2 hours)
1. Set up Vite + React + TypeScript project
2. Install dependencies (Tailwind, Zustand, react-icons)
3. Configure Tailwind with theme variables
4. Create base CSS classes in index.css
5. Set up path aliases (@/)

### Phase 2: State Management (30 min)
1. Create Zustand stores (credentials, proxy, alert)
2. Create ThemeContext
3. Set up localStorage persistence

### Phase 3: Services Layer (1 hour)
1. Implement credentialsService
2. Implement proxyService
3. Implement authService
4. Implement browserExtensionService
5. Add proper error handling

### Phase 4: Layout Components (1 hour)
1. Create AppLayout
2. Create TitleBar with theme toggle
3. Create StatusBar
4. Wire up window controls (Electron)

### Phase 5: Feature Components (2-3 hours)
1. Create AuthenticationCard + subcomponents
2. Create ProxyControlCard + subcomponents
3. Create SystemStatsCard
4. Create ConnectionGuideCard
5. Create CredentialsDetailCard
6. Create StatusAlert
7. Create EnvironmentBadge

### Phase 6: Hooks & Integration (1 hour)
1. Implement useCredentialPolling
2. Implement useProxyControl
3. Implement useProxyStatus
4. Wire up all state management

### Phase 7: HomePage & Testing (1 hour)
1. Compose HomePage with all components
2. Test all user flows
3. Test theme toggling
4. Test in both Electron and browser
5. Polish UI and animations

### Phase 8: Electron Integration (1 hour)
1. Set up Electron IPC handlers in main process
2. Create preload script with exposed APIs
3. Test window controls
4. Test credential extraction
5. Verify frameless window works

**Total Estimated Time**: 8-11 hours for complete implementation

---

## End of Specification

This document contains all necessary information to rebuild the frontend from scratch. Reference this specification when recreating the application to ensure all features and functionality are properly implemented.

**Last Updated**: November 5, 2025
**Document Version**: 1.0
