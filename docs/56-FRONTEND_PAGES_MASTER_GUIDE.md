# 56 - Frontend Pages Master Guide

## Document Information
- **Document**: 56 - Frontend Pages Master Guide
- **Version**: 1.0
- **Date**: November 5, 2025
- **Purpose**: Define UX requirements and constraints for all frontend pages

---

## Core Principles

### User-Focused Design
- Show users what they need to **accomplish tasks**, not backend implementation details
- Every element must answer: "What can I do with this?"
- Avoid exposing internal concepts (runtime status, database IDs, etc.)

### Simplicity First
- Each page should have ONE primary purpose
- Minimize text, maximize clarity
- No walls of documentation or tutorials
- If users need help, show context-appropriate hints

### Real Actions Only
- Only show actions users can actually take
- Don't document APIs users can't call from the UI
- Don't show backend-only concepts

---

## Page-by-Page Requirements

---

## 1. Proxy Status Page

### Purpose
**Quick check**: Is the proxy running? Can I start/stop it?

### Primary User Questions
1. Is the proxy running right now?
2. How do I start/stop it?
3. Are there any problems?

### What to Show

```
┌─────────────────────────────────────────────────────────┐
│ Proxy Status                                       [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ● RUNNING                                              │
│                                                         │
│  Started: 2:34 PM                                       │
│  Uptime: 2h 15m                                         │
│                                                         │
│  [Stop Proxy]                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Providers   │ │   Models    │ │ Credentials │
│      3      │ │      12     │ │   ✓ Valid   │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Components Needed
1. **StatusIndicator** - Big visual indicator (● RUNNING / ○ STOPPED)
2. **StatusInfo** - Started time, uptime
3. **ActionButton** - Start or Stop (only one shows at a time)
4. **QuickStats** - 3 cards showing summary counts

### What NOT to Show
- ❌ Separate status for qwen-proxy vs provider-router (users don't care about two servers)
- ❌ PID numbers
- ❌ Port numbers (unless there's an error)
- ❌ "Partial" running state (either it works or it doesn't)
- ❌ curl commands or connection details
- ❌ Dashboard API response structure

### User Flows

**Starting Proxy:**
1. User sees "○ STOPPED"
2. Clicks "Start Proxy"
3. Button shows "Starting..."
4. Status changes to "● RUNNING"
5. Toast: "Proxy started"

**Stopping Proxy:**
1. User clicks "Stop Proxy"
2. Confirmation: "Stop proxy? Active connections will be terminated."
3. Button shows "Stopping..."
4. Status changes to "○ STOPPED"
5. Toast: "Proxy stopped"

### API Calls
- GET `/api/proxy/status` - on load + every 10 seconds
- POST `/api/proxy/start` - when user clicks Start
- POST `/api/proxy/stop` - when user clicks Stop

---

## 2. Providers Page

### Purpose
**Manage providers**: See what providers exist, enable/disable them, test connections

### Primary User Questions
1. What providers do I have?
2. Which ones are enabled?
3. Are they working?

### What to Show

```
┌──────────────────────────────────────────────────────────┐
│ Providers                                           [↻]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │   Total    │  │  Enabled   │  │  Disabled  │        │
│  │     3      │  │      2     │  │      1     │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Name          Type        Status       Actions    │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Qwen Main     qwen-direct ● Enabled    [Test] [⋮] │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ LM Studio     lm-studio   ○ Disabled   [Test] [⋮] │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Qwen Backup   qwen-proxy  ● Enabled    [Test] [⋮] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘

Actions Menu (⋮):
  - Enable / Disable
  - Test Connection
  - Delete
```

### Components Needed
1. **SummaryCards** - Total, Enabled, Disabled counts
2. **ProvidersTable** - Sortable table of providers
3. **ProviderRow** - Single row with status badge and actions
4. **StatusBadge** - ● Enabled / ○ Disabled
5. **TypeBadge** - Provider type label
6. **ActionsMenu** - Dropdown with actions

### What NOT to Show
- ❌ Runtime "loaded" status (implementation detail)
- ❌ Reload action (happens automatically)
- ❌ Provider IDs (unless needed for error messages)
- ❌ Priority numbers (users don't configure this)
- ❌ Configuration JSON viewer
- ❌ API endpoint documentation

### User Flows

**Enable Provider:**
1. User clicks "Enable" in menu
2. Row updates immediately (optimistic)
3. API call happens
4. If error: Revert + show toast with error
5. If success: Status stays ● Enabled

**Test Provider:**
1. User clicks "Test"
2. Button shows spinner
3. API call to test connection
4. Toast: "✓ Qwen Main is working" OR "✗ Connection failed: [reason]"

**Delete Provider:**
1. User clicks "Delete"
2. Dialog: "Delete Qwen Main? This cannot be undone."
3. If confirmed: Provider disappears from list
4. Toast: "Provider deleted"

### API Calls
- GET `/api/providers` - list all providers
- POST `/api/providers/:id/enable` - enable provider
- POST `/api/providers/:id/disable` - disable provider
- POST `/api/providers/:id/test` - test connection
- DELETE `/api/providers/:id` - delete provider

---

## 3. Models Page

### Purpose
**Browse models**: See what AI models are available, filter by capability

### Primary User Questions
1. What models can I use?
2. Which models support vision? Tool calling?
3. Which provider offers this model?

### What to Show

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

### Components Needed
1. **FilterBar** - Capability and provider dropdowns
2. **ModelsGrid** - Responsive grid layout (1-3 columns)
3. **ModelCard** - Individual model display
4. **CapabilityBadge** - Icon + label for each capability

### What NOT to Show
- ❌ Model creation/edit forms (models come from providers)
- ❌ Model IDs or technical identifiers
- ❌ API documentation or curl examples
- ❌ Model testing/playground
- ❌ Performance benchmarks
- ❌ Pricing information

### User Flows

**Filtering Models:**
1. User selects "Vision" from capability filter
2. Grid instantly updates to show only vision models
3. Count updates: "5 models"
4. URL updates: `/models?capability=vision`

**Viewing Model Details:**
- Just the card shows all info
- No detail page or modal needed
- Keep it simple

### API Calls
- GET `/api/models` - list all models (no query params, filter client-side)

---

## 4. Credentials Page

### Purpose
**Authentication status**: Am I logged into Qwen? When does it expire?

### Primary User Questions
1. Am I logged in?
2. When do credentials expire?
3. How do I log in/out?

### What to Show

```
┌─────────────────────────────────────────────────────────┐
│ Qwen Credentials                                   [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✓ LOGGED IN                                            │
│                                                         │
│  Expires: Nov 12, 2025 at 2:45 PM                      │
│  Time remaining: 6 days                                 │
│                                                         │
│  [Logout]                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ How to Log In                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Click "Login to Qwen"                               │
│  2. Follow extension installation (one-time)            │
│  3. Log in at chat.qwen.ai                              │
│  4. Extension captures credentials automatically        │
│                                                         │
│  → [Install Extension]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**When NOT Logged In:**
```
┌─────────────────────────────────────────────────────────┐
│ Qwen Credentials                                   [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ○ NOT LOGGED IN                                        │
│                                                         │
│  Log in to use Qwen models                              │
│                                                         │
│  [Login to Qwen]                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components Needed
1. **StatusCard** - Shows login state and expiration
2. **StatusBadge** - ✓ Logged In / ○ Not Logged In / ⚠️ Expired
3. **ActionButton** - Login or Logout (only one shows)
4. **HelpCard** - Simple 4-step instructions (only when logged out)

### What NOT to Show
- ❌ Manual credential upload form
- ❌ Token/cookie input fields
- ❌ JSON editor
- ❌ Security documentation walls
- ❌ Collapsible privacy explanations
- ❌ Multiple credential profiles
- ❌ API examples or curl commands

### User Flows

**Logging In:**
1. User clicks "Login to Qwen"
2. Navigate to extension install/setup page
3. Extension captures credentials
4. User returns to this page
5. Status shows "✓ LOGGED IN"

**Logging Out:**
1. User clicks "Logout"
2. Confirm: "Log out? You'll need to log in again to use Qwen."
3. Credentials deleted
4. Status shows "○ NOT LOGGED IN"

### API Calls
- GET `/api/qwen/credentials` - get status (every 60 seconds)
- DELETE `/api/qwen/credentials` - logout

---

## 5. API Server Page

### Purpose
**Health check**: Is the API server running and responding?

### Primary User Questions
1. Is the API server working?
2. What URL is it at?
3. How do I troubleshoot if it's down?

### What to Show

```
┌─────────────────────────────────────────────────────────┐
│ API Server                                         [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ● CONNECTED                                            │
│                                                         │
│  URL: http://localhost:3002                             │
│  Response time: 12ms                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Providers  │ │   Models    │ │  Sessions   │
│      3      │ │     12      │ │      8      │
└─────────────┘ └─────────────┘ └─────────────┘

Quick Test:
┌─────────────────────────────────────────────────────────┐
│ curl http://localhost:3002/api/health           [Copy] │
└─────────────────────────────────────────────────────────┘
```

**When Offline:**
```
┌─────────────────────────────────────────────────────────┐
│ API Server                                         [↻]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ○ NOT CONNECTED                                        │
│                                                         │
│  Cannot reach API server                                │
│                                                         │
│  Troubleshooting:                                       │
│  • Check if server is running                           │
│  • Expected at: http://localhost:3002                   │
│  • Try: cd backend/api-server && npm run dev            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components Needed
1. **ConnectionStatus** - Connected / Not Connected with URL
2. **QuickStats** - Summary counts from dashboard
3. **TestCommand** - Single curl command with copy button
4. **TroubleshootingCard** - Show when offline

### What NOT to Show
- ❌ Complete API endpoint documentation (53 endpoints)
- ❌ Request/response schemas for every endpoint
- ❌ Section-by-section API reference
- ❌ curl examples for all operations
- ❌ Query parameter documentation
- ❌ Endpoint categories and organization
- ❌ API playground or request builder

**Rationale**: Users interact with the API through the UI, not directly. API documentation belongs in backend docs or Swagger, not the frontend. This page is just a health check.

### User Flows

**Checking Status:**
1. Page loads
2. Pings `/api/health`
3. Shows ● CONNECTED or ○ NOT CONNECTED
4. Auto-refreshes every 10 seconds

**Troubleshooting:**
1. User sees "○ NOT CONNECTED"
2. Reads troubleshooting steps
3. Copies test curl command
4. Runs it in terminal to diagnose

### API Calls
- GET `/api/health` - health check (every 10 seconds)
- GET `/api/proxy/status` - get dashboard summary (for quick stats)

---

## Global Design Rules

### Status Indicators
- Use dots consistently: ● (filled) = active/good, ○ (hollow) = inactive/neutral, ⚠️ (warning) = problem
- Always pair icon with text label
- Color via CSS classes, not inline styles

### Action Buttons
- Primary action = prominent button
- Secondary actions = menu (⋮)
- Destructive actions = confirmation dialog
- Loading state = disable + show spinner or "Loading..."

### Empty States
- Show when no data exists
- Explain why empty and what to do next
- Include call-to-action button
- Example: "No providers configured. Add a provider to get started. [Add Provider →]"

### Error States
- Show friendly message
- Include specific error detail when helpful
- Offer retry or troubleshooting action
- Example: "Failed to load providers. Network error: timeout. [Retry]"

### Timestamps
- Use relative time for recent: "2 minutes ago", "5 hours ago"
- Use absolute for old: "Nov 5, 2025 at 2:45 PM"
- Update relative times every minute

### Counts and Stats
- Use cards for 2-4 related metrics
- Keep labels short: "Total", "Enabled", "Active"
- Use large numbers, small labels
- Only show meaningful metrics (no zero counts)

---

## Component Patterns

### Pattern 1: Status Card
```
┌─────────────────────────────────┐
│ [Title]                     [↻] │
├─────────────────────────────────┤
│ [● Status Indicator]            │
│ [Details]                       │
│ [Action Button]                 │
└─────────────────────────────────┘
```

### Pattern 2: Summary Cards
```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Label    │ │ Label    │ │ Label    │
│   123    │ │   456    │ │   789    │
└──────────┘ └──────────┘ └──────────┘
```

### Pattern 3: Data Table
```
┌─────────────────────────────────────────┐
│ Column 1  Column 2  Column 3  Actions │
├─────────────────────────────────────────┤
│ Value     Value     Status    [⋮]     │
│ Value     Value     Status    [⋮]     │
└─────────────────────────────────────────┘
```

### Pattern 4: Action Menu
```
[⋮] → ┌──────────────┐
      │ Action 1     │
      │ Action 2     │
      │ Delete       │
      └──────────────┘
```

---

## File Organization Rules

### Phase Structure Requirements
Each plan document must:
1. Include a **work progression table** at the top
2. Order phases by priority: Foundation → Components → Page Assembly
3. For each phase, specify:
   - All files that will be **created**
   - All files that will be **modified**
   - Integration points (files that will be **used** but not modified)
   - Complete file and folder tree showing structure

### Foundation Phases (Highest Priority)
Create/update these files FIRST:
- `types/*.types.ts` - Type definitions
- `services/*.service.ts` - API calls (usually already exist)
- `hooks/use*.ts` - Custom hooks for data fetching and actions
- `utils/*.util.ts` - Helper functions

Split foundation work into multiple phases if needed to avoid too much work in one phase.

### Component Phases (Medium Priority)
Build reusable UI pieces:
- `components/[domain]/*.tsx` - Domain-specific components
- `components/[domain]/*.css` - Component styles (one per component)

Follow SRP - each component should have ONE clear responsibility.
Split component work into multiple phases if needed.

### Page Assembly Phase (Lowest Priority)
Compose into final page:
- `pages/[Name]Page.tsx` - Main page component
- `pages/[Name]Page.css` - Page-level styles

### File Naming
- Components: PascalCase (e.g., `StatusCard.tsx`)
- Utilities: camelCase (e.g., `formatTime.util.ts`)
- Types: camelCase with .types suffix (e.g., `providers.types.ts`)
- Hooks: camelCase with use prefix (e.g., `useProviders.ts`)

---

## CSS Architecture

### Class Naming (BEM-like)
```css
/* Block */
.providers-page { }

/* Element */
.providers-page__header { }

/* Modifier */
.providers-page__header--loading { }

/* Component Block */
.provider-card { }
.provider-card__name { }
.provider-card__status { }
.provider-card--disabled { }
```

### No Inline Tailwind
```tsx
// ❌ WRONG
<div className="flex items-center gap-2 p-4">

// ✅ RIGHT
<div className="provider-card__header">
```

### CSS Variables for Theme
```css
.provider-status--enabled {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.provider-status--disabled {
  color: var(--color-muted);
  background: var(--color-muted-bg);
}
```

---

## Data Fetching Patterns

### On Page Load
```typescript
// In custom hook
useEffect(() => {
  fetchData();
}, []);
```

### Auto-Refresh
```typescript
// Every 10-60 seconds depending on data volatility
useEffect(() => {
  const interval = setInterval(fetchData, 10000);
  return () => clearInterval(interval);
}, []);
```

### Manual Refresh
```typescript
// User clicks refresh button
const handleRefresh = async () => {
  setLoading(true);
  await fetchData();
  setLoading(false);
};
```

### Optimistic Updates
```typescript
// For enable/disable actions
const handleEnable = async (id: string) => {
  // Update UI immediately
  updateLocalState(id, { enabled: true });

  try {
    // Make API call
    await providersService.enable(id);
    // Success: UI already updated
  } catch (error) {
    // Error: Revert UI change
    updateLocalState(id, { enabled: false });
    toast.error('Failed to enable provider');
  }
};
```

---

## What Makes a Good Page Plan

### ✅ Good Plan Characteristics
1. Shows clear user benefit for each feature
2. Limits scope to essential functionality
3. Follows SRP - each component has ONE clear purpose
4. Phases build logically (foundation → components → page)
5. Mockup matches user's mental model
6. No backend implementation details leak through
7. Phases split appropriately - no phase has too much work

### ❌ Bad Plan Characteristics
1. Shows backend concepts to users
2. Over-componentizes simple displays
3. Includes educational content dumps
4. Documents things users can't interact with
5. Mockup looks like API documentation
6. Phases too large - should be split into smaller phases

---

## Approval Checklist

Before considering a page plan complete, verify:

- [ ] Mockup shows what user sees, not API structure
- [ ] Every component has clear user purpose following SRP
- [ ] No backend jargon in UI (PID, runtime status, etc.)
- [ ] All actions map to real user tasks
- [ ] No API documentation or curl examples (except API Server health check)
- [ ] Empty states and error states defined
- [ ] Loading states defined
- [ ] CSS classes follow naming convention (BEM-like)
- [ ] No inline Tailwind
- [ ] Work progression table at top with phases ordered by priority
- [ ] Each phase lists files to create/modify, integration points, and file tree
- [ ] Foundation phases (types, services, hooks, utils) come first
- [ ] Component phases come second
- [ ] Page assembly phase comes last
- [ ] No phase has too much work (split if needed)

---

## Summary: What Each Page Should Be

| Page | ONE Sentence Purpose | Key Elements |
|------|---------------------|--------------|
| Proxy Status | Check if proxy is running and control it | Status indicator, start/stop button, basic stats |
| Providers | Manage which AI providers are active | Provider list, enable/disable, test connection |
| Models | Browse available AI models | Model cards, capability filters |
| Credentials | Check Qwen login status | Login state, expiration, login/logout button |
| API Server | Verify API server is reachable | Connection status, server URL, basic health check |

**Remember**: Users want to accomplish tasks, not learn about system architecture. Show them what they can DO, not how it WORKS.

---

## Version History

- **v1.0** (Current) - Initial master guide defining UX requirements for all pages
