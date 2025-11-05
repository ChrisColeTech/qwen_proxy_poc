# Phase 11: Settings Page

**Priority:** P3 (Pages)
**Dependencies:** Phase 8
**Blocks:** Phase 16

## Page Structure

**Settings** is a standalone page (no parent-child relationships).

## Files to Create

```
frontend/src/pages/settings/
├── SettingsPage.tsx              # Parent page router
├── SettingsMainPage.tsx          # Desktop main page (3x3 grid)
└── MobileSettingsMainPage.tsx    # Mobile main page (single column)
```

## Content

**frontend/src/pages/settings/SettingsPage.tsx**
```typescript
import { useIsMobile } from '@/hooks/useIsMobile';
import { SettingsMainPage } from './SettingsMainPage';
import { MobileSettingsMainPage } from './MobileSettingsMainPage';

export function SettingsPage() {
  const isMobile = useIsMobile();

  const CurrentPageComponent = isMobile ? MobileSettingsMainPage : SettingsMainPage;

  return <CurrentPageComponent />;
}
```

**frontend/src/pages/settings/SettingsMainPage.tsx**
```typescript
import { Card } from '@/components/ui/card';
import { ProxyConfigForm } from '@/components/features/proxy/ProxyConfigForm';
import { useTheme } from '@/contexts/ThemeContext';

export function SettingsMainPage() {
  const { theme, setTheme } = useTheme();

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
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure application preferences</p>
      </div>
      <div>{/* Top Right placeholder */}</div>

      {/* Middle row */}
      <div>{/* Left placeholder */}</div>
      <div className="space-y-6">
        {/* Theme Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </Card>

        {/* Proxy Configuration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Proxy Configuration</h2>
          <ProxyConfigForm />
        </Card>
      </div>
      <div>{/* Right placeholder */}</div>

      {/* Bottom row */}
      <div>{/* Bottom Left placeholder */}</div>
      <div>{/* Bottom Center placeholder */}</div>
      <div>{/* Bottom Right placeholder */}</div>
    </div>
  );
}
```

**frontend/src/pages/settings/MobileSettingsMainPage.tsx**
```typescript
import { Card } from '@/components/ui/card';
import { ProxyConfigForm } from '@/components/features/proxy/ProxyConfigForm';
import { useTheme } from '@/contexts/ThemeContext';

export function MobileSettingsMainPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure preferences</p>
      </div>

      {/* Theme Settings */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Appearance</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium">Theme</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </Card>

      {/* Proxy Configuration */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Proxy Configuration</h2>
        <ProxyConfigForm />
      </Card>
    </div>
  );
}
```

## Files to Modify

None (will be used in Phase 16 routing)

## Integration Points

- `frontend/src/components/features/proxy/ProxyConfigForm.tsx` (Phase 8)
- `frontend/src/contexts/ThemeContext.tsx` (existing)
- `frontend/src/hooks/useIsMobile.ts` (mobile/desktop detection)

## Structure After Phase 11

```
frontend/src/
├── pages/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx         # ✅ From Phase 10
│   │   ├── DashboardMainPage.tsx
│   │   └── MobileDashboardMainPage.tsx
│   └── settings/                      # 🆕 New
│       ├── SettingsPage.tsx           # Router
│       ├── SettingsMainPage.tsx       # Desktop main
│       └── MobileSettingsMainPage.tsx # Mobile main
```

## Validation

- [ ] Theme selector works
- [ ] Proxy config form integrated
- [ ] Settings persist correctly
- [ ] Mobile/desktop switching works
- [ ] 3x3 grid layout displays correctly on desktop
