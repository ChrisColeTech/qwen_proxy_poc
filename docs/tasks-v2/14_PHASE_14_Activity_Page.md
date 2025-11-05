# Phase 14: Activity Page (with Sessions, Requests, Responses as Children)

**Priority:** P3 (Pages)
**Dependencies:** Phase 3
**Blocks:** Phase 16

## Page Structure

**Activity** is a parent page that can have **Sessions**, **Requests**, and **Responses** as child pages (all siblings at the same level). The ActivityPage component routes between:
- ActivityMainPage / MobileActivityMainPage (main view - activity logs and stats)
- SessionsPage / MobileSessionsPage (child view - session list)
- RequestsPage / MobileRequestsPage (child view - requests list)
- ResponsesPage / MobileResponsesPage (child view - responses list)

## Files to Create

```
frontend/src/pages/activity/
├── ActivityPage.tsx              # Parent page router
├── ActivityMainPage.tsx          # Desktop main page (3x3 grid)
├── MobileActivityMainPage.tsx    # Mobile main page (single column)
├── SessionsPage.tsx              # Desktop child page (3x3 grid)
├── MobileSessionsPage.tsx        # Mobile child page (single column)
├── RequestsPage.tsx              # Desktop child page (3x3 grid)
├── MobileRequestsPage.tsx        # Mobile child page (single column)
├── ResponsesPage.tsx             # Desktop child page (3x3 grid)
└── MobileResponsesPage.tsx       # Mobile child page (single column)

frontend/src/components/features/activity/
├── ActivityStatsCard.tsx    # Stats card
└── ActivityLogList.tsx      # Combined request/response history

frontend/src/components/features/sessions/
├── SessionList.tsx          # List of sessions
├── SessionCard.tsx          # Session details card
└── SessionCleanupButton.tsx # Cleanup inactive sessions

frontend/src/components/features/requests/
├── RequestList.tsx          # List of requests
└── RequestDetailDialog.tsx  # Request details modal

frontend/src/components/features/responses/
├── ResponseList.tsx         # List of responses
└── ResponseDetailDialog.tsx # Response details modal
```

## Content

**frontend/src/pages/activity/ActivityPage.tsx** - Parent router:
```typescript
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAppStore } from '@/stores/appStore';
import { ActivityMainPage } from './ActivityMainPage';
import { MobileActivityMainPage } from './MobileActivityMainPage';
import { SessionsPage } from './SessionsPage';
import { MobileSessionsPage } from './MobileSessionsPage';
import { RequestsPage } from './RequestsPage';
import { MobileRequestsPage } from './MobileRequestsPage';
import { ResponsesPage } from './ResponsesPage';
import { MobileResponsesPage } from './MobileResponsesPage';

export function ActivityPage() {
  const currentChildPage = useAppStore((state) => state.currentChildPage);
  const isMobile = useIsMobile();

  let CurrentPageComponent;

  if (currentChildPage === "sessions") {
    CurrentPageComponent = isMobile ? MobileSessionsPage : SessionsPage;
  } else if (currentChildPage === "requests") {
    CurrentPageComponent = isMobile ? MobileRequestsPage : RequestsPage;
  } else if (currentChildPage === "responses") {
    CurrentPageComponent = isMobile ? MobileResponsesPage : ResponsesPage;
  } else {
    CurrentPageComponent = isMobile ? MobileActivityMainPage : ActivityMainPage;
  }

  return <CurrentPageComponent />;
}
```

**frontend/src/pages/activity/ActivityMainPage.tsx** - Desktop 3x3 grid:
```typescript
import { Button } from '@/components/ui/button';
import { ActivityStatsCard } from '@/components/features/activity/ActivityStatsCard';
import { ActivityLogList } from '@/components/features/activity/ActivityLogList';
import { useAppStore } from '@/stores/appStore';

export function ActivityMainPage() {
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
      <div>
        <h1 className="text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground">Request and response history</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setCurrentChildPage('sessions')}>
            View Sessions
          </Button>
          <Button onClick={() => setCurrentChildPage('requests')}>
            View Requests
          </Button>
          <Button onClick={() => setCurrentChildPage('responses')}>
            View Responses
          </Button>
        </div>
        <div className="mt-4">
          <ActivityStatsCard />
        </div>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left sidebar - filters */}</div>
      <div>
        <ActivityLogList />
      </div>
      <div>{/* Right sidebar */}</div>

      {/* Bottom row */}
      <div>{/* Bottom Left placeholder */}</div>
      <div>{/* Pagination */}</div>
      <div>{/* Bottom Right placeholder */}</div>
    </div>
  );
}
```

**frontend/src/pages/activity/MobileActivityMainPage.tsx** - Mobile:
```typescript
import { Button } from '@/components/ui/button';
import { ActivityStatsCard } from '@/components/features/activity/ActivityStatsCard';
import { ActivityLogList } from '@/components/features/activity/ActivityLogList';
import { useAppStore } from '@/stores/appStore';

export function MobileActivityMainPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-sm text-muted-foreground">Activity overview</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setCurrentChildPage('sessions')} size="sm">
          Sessions
        </Button>
        <Button onClick={() => setCurrentChildPage('requests')} size="sm">
          Requests
        </Button>
        <Button onClick={() => setCurrentChildPage('responses')} size="sm">
          Responses
        </Button>
      </div>

      <ActivityStatsCard />
      <ActivityLogList />
    </div>
  );
}
```

**frontend/src/pages/activity/SessionsPage.tsx** - Desktop child:
```typescript
import { Button } from '@/components/ui/button';
import { SessionList } from '@/components/features/sessions/SessionList';
import { SessionCleanupButton } from '@/components/features/sessions/SessionCleanupButton';
import { useAppStore } from '@/stores/appStore';

export function SessionsPage() {
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
      <div>
        <Button variant="ghost" onClick={() => setCurrentChildPage(null)}>
          ← Back to Activity
        </Button>
        <h1 className="text-3xl font-bold">Sessions</h1>
        <p className="text-muted-foreground">Manage active sessions</p>
        <div className="mt-2 flex gap-2">
          <Button onClick={() => setCurrentChildPage('requests')} size="sm">
            View Requests
          </Button>
          <Button onClick={() => setCurrentChildPage('responses')} size="sm">
            View Responses
          </Button>
          <SessionCleanupButton />
        </div>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left sidebar - filters */}</div>
      <div>
        <SessionList />
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

**frontend/src/pages/activity/MobileSessionsPage.tsx** - Mobile child:
```typescript
import { Button } from '@/components/ui/button';
import { SessionList } from '@/components/features/sessions/SessionList';
import { SessionCleanupButton } from '@/components/features/sessions/SessionCleanupButton';
import { useAppStore } from '@/stores/appStore';

export function MobileSessionsPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setCurrentChildPage(null)}>
        ← Back to Activity
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Sessions</h1>
        <p className="text-sm text-muted-foreground">Active sessions</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setCurrentChildPage('requests')} size="sm">
          Requests
        </Button>
        <Button onClick={() => setCurrentChildPage('responses')} size="sm">
          Responses
        </Button>
        <SessionCleanupButton />
      </div>

      <SessionList />
    </div>
  );
}
```

**frontend/src/pages/activity/RequestsPage.tsx** - Desktop child:
```typescript
import { Button } from '@/components/ui/button';
import { RequestList } from '@/components/features/requests/RequestList';
import { useAppStore } from '@/stores/appStore';

export function RequestsPage() {
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
      <div>
        <Button variant="ghost" onClick={() => setCurrentChildPage(null)}>
          ← Back to Activity
        </Button>
        <h1 className="text-3xl font-bold">Requests</h1>
        <p className="text-muted-foreground">Request history and details</p>
        <div className="mt-2 flex gap-2">
          <Button onClick={() => setCurrentChildPage('sessions')} size="sm">
            View Sessions
          </Button>
          <Button onClick={() => setCurrentChildPage('responses')} size="sm">
            View Responses
          </Button>
        </div>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left sidebar - filters */}</div>
      <div>
        <RequestList />
      </div>
      <div>{/* Right sidebar */}</div>

      {/* Bottom row */}
      <div>{/* Bottom Left placeholder */}</div>
      <div>{/* Pagination */}</div>
      <div>{/* Bottom Right placeholder */}</div>
    </div>
  );
}
```

**frontend/src/pages/activity/MobileRequestsPage.tsx** - Mobile child:
```typescript
import { Button } from '@/components/ui/button';
import { RequestList } from '@/components/features/requests/RequestList';
import { useAppStore } from '@/stores/appStore';

export function MobileRequestsPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setCurrentChildPage(null)}>
        ← Back to Activity
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Requests</h1>
        <p className="text-sm text-muted-foreground">Request history</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setCurrentChildPage('sessions')} size="sm">
          Sessions
        </Button>
        <Button onClick={() => setCurrentChildPage('responses')} size="sm">
          Responses
        </Button>
      </div>

      <RequestList />
    </div>
  );
}
```

**frontend/src/pages/activity/ResponsesPage.tsx** - Desktop child:
```typescript
import { Button } from '@/components/ui/button';
import { ResponseList } from '@/components/features/responses/ResponseList';
import { useAppStore } from '@/stores/appStore';

export function ResponsesPage() {
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
      <div>
        <Button variant="ghost" onClick={() => setCurrentChildPage(null)}>
          ← Back to Activity
        </Button>
        <h1 className="text-3xl font-bold">Responses</h1>
        <p className="text-muted-foreground">Response history and details</p>
        <div className="mt-2 flex gap-2">
          <Button onClick={() => setCurrentChildPage('sessions')} size="sm">
            View Sessions
          </Button>
          <Button onClick={() => setCurrentChildPage('requests')} size="sm">
            View Requests
          </Button>
        </div>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left sidebar - filters */}</div>
      <div>
        <ResponseList />
      </div>
      <div>{/* Right sidebar */}</div>

      {/* Bottom row */}
      <div>{/* Bottom Left placeholder */}</div>
      <div>{/* Pagination */}</div>
      <div>{/* Bottom Right placeholder */}</div>
    </div>
  );
}
```

**frontend/src/pages/activity/MobileResponsesPage.tsx** - Mobile child:
```typescript
import { Button } from '@/components/ui/button';
import { ResponseList } from '@/components/features/responses/ResponseList';
import { useAppStore } from '@/stores/appStore';

export function MobileResponsesPage() {
  const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

  return (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setCurrentChildPage(null)}>
        ← Back to Activity
      </Button>

      <div>
        <h1 className="text-2xl font-bold">Responses</h1>
        <p className="text-sm text-muted-foreground">Response history</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setCurrentChildPage('sessions')} size="sm">
          Sessions
        </Button>
        <Button onClick={() => setCurrentChildPage('requests')} size="sm">
          Requests
        </Button>
      </div>

      <ResponseList />
    </div>
  );
}
```

## Component Summary

Activity overview page with statistics and combined logs, with three child pages: Sessions (active sessions list with session details and cleanup), Requests (request history and details), and Responses (response history and details). All children are siblings and can navigate between each other.

## Files to Modify

None

## Integration Points

- `frontend/src/services/api.service.ts` (Phase 3)
- `frontend/src/types/session.types.ts` (Phase 1)
- `frontend/src/types/activity.types.ts` (Phase 1)
- `frontend/src/stores/appStore.ts` (currentChildPage state)
- `frontend/src/hooks/useIsMobile.ts` (mobile/desktop detection)

## Structure After Phase 14

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   └── ...                        # ✅ From Phase 10
│   ├── settings/
│   │   └── ...                        # ✅ From Phase 11
│   ├── providers/
│   │   └── ...                        # ✅ From Phase 12
│   └── activity/                      # 🆕 New (Parent with children)
│       ├── ActivityPage.tsx           # Parent router
│       ├── ActivityMainPage.tsx       # Desktop main
│       ├── MobileActivityMainPage.tsx # Mobile main
│       ├── SessionsPage.tsx           # Desktop child
│       ├── MobileSessionsPage.tsx     # Mobile child
│       ├── RequestsPage.tsx           # Desktop child
│       ├── MobileRequestsPage.tsx     # Mobile child
│       ├── ResponsesPage.tsx          # Desktop child
│       └── MobileResponsesPage.tsx    # Mobile child
├── components/
│   └── features/
│       ├── activity/         # 🆕 New
│       │   ├── ActivityStatsCard.tsx
│       │   └── ActivityLogList.tsx
│       ├── sessions/         # 🆕 New
│       │   ├── SessionList.tsx
│       │   ├── SessionCard.tsx
│       │   └── SessionCleanupButton.tsx
│       ├── requests/         # 🆕 New
│       │   ├── RequestList.tsx
│       │   └── RequestDetailDialog.tsx
│       ├── responses/        # 🆕 New
│       │   ├── ResponseList.tsx
│       │   └── ResponseDetailDialog.tsx
│       ├── providers/
│       ├── models/
│       ├── proxy/
│       └── credentials/
```

## Validation

- [ ] Activity main page displays correctly with stats and logs
- [ ] Can navigate to Sessions child page
- [ ] Can navigate to Requests child page
- [ ] Can navigate to Responses child page
- [ ] Sessions list displays correctly
- [ ] Can delete individual sessions
- [ ] Cleanup removes inactive sessions
- [ ] Session stats accurate
- [ ] Request logs display correctly
- [ ] Response logs display correctly
- [ ] Detail dialogs show full data
- [ ] Can navigate between sibling child pages
- [ ] Back button returns to Activity main page
- [ ] Mobile/desktop switching works for all pages
- [ ] 3x3 grid layout displays correctly on desktop for all pages
