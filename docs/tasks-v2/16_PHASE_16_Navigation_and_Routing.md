# Phase 16: Navigation and Routing

**Priority:** P3 (Pages)
**Dependencies:** Phase 10-15
**Blocks:** None

## Files to Create

```
frontend/src/components/layout/
├── Tabbar.tsx             # Navigation Tabbar
└── NavigationMenu.tsx      # Navigation menu items
```

## Files to Modify

- `frontend/src/App.tsx` - Add routing
- `frontend/src/components/layout/AppLayout.tsx` - Integrate Tabbar

## Package Dependencies

```bash
npm install react-router-dom
npm install -D @types/react-router-dom
```

## Content Summary

- React Router setup
- Tabbar navigation
- Route definitions
- Active route highlighting

## Integration Points

- All pages from Phase 10-15
- AppLayout component

## Structure After Phase 16

```
frontend/src/
├── App.tsx                       # 🔧 Modified (routing)
├── components/
│   └── layout/
│       ├── AppLayout.tsx         # 🔧 Modified (Tabbar)
│       ├── Tabbar.tsx           # 🆕 New
│       ├── NavigationMenu.tsx    # 🆕 New
│       ├── TitleBar.tsx          # ✅ Existing
│       └── StatusBar.tsx         # ✅ Existing
├── pages/
│   ├── Dashboard.tsx             # ✅ From Phase 10
│   ├── Settings.tsx              # ✅ From Phase 11
│   ├── Providers.tsx             # ✅ From Phase 12
│   ├── Models.tsx                # ✅ From Phase 13
│   ├── Sessions.tsx              # ✅ From Phase 14
│   └── Activity.tsx              # ✅ From Phase 15
```

## Validation

- [ ] All routes work correctly
- [ ] Tabbar navigation functional
- [ ] Active route highlighted
- [ ] Browser back/forward works
