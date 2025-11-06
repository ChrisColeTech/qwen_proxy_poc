**Goal:** Refactor the application's UI to improve visual consistency and professional appearance using Tailwind CSS theme variables and proper icon libraries.

## Files to Create:
- None (all refinements to existing files)

## Files to Modify:
- `frontend/src/components/layout/AppLayout.tsx` ✅
- `frontend/src/components/layout/TitleBar.tsx` ✅
- `frontend/src/components/layout/StatusBar.tsx` ✅
- `frontend/src/components/layout/Sidebar.tsx` ✅
- `frontend/src/components/ui/*` (shadcn/ui components) ✅

## Tasks:

1. **Style guide directive** ✅
   - **Tailwind CSS Variables**: All components use pre-configured Tailwind theme variables:
     - Colors: `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`
     - Spacing: Consistent padding/margins using Tailwind spacing scale
     - Typography: Default font is Inter with system-ui fallback
   - **CSS Custom Properties**: Defined in `frontend/src/index.css`
     - Light mode: `:root` with HSL color values
     - Dark mode: `.dark` with HSL color values
   - **No hardcoded colors**: All color values use CSS variables via Tailwind utilities

2. **Replace all emojis and unicode characters** ✅
   - **Icon Libraries Used**:
     - `lucide-react`: Primary icon library (Moon, Sun, Home, BookOpen, Blocks, Cpu, PanelLeft, PanelRight)
     - `react-icons/vsc`: VSCode icons for window controls (VscChromeMinimize, VscChromeMaximize, VscChromeClose)
   - **TitleBar Icons**:
     - Theme toggle: `<Moon />` and `<Sun />` from lucide-react
     - Sidebar toggle: `<PanelLeft />` and `<PanelRight />` from lucide-react
     - Window controls: `VscChromeMinimize`, `VscChromeMaximize`, `VscChromeClose` from react-icons
   - **Sidebar Icons**:
     - Home: `<Home />` from lucide-react
     - Quick Guide: `<BookOpen />` from lucide-react
     - Providers: `<Blocks />` from lucide-react
     - Models: `<Cpu />` from lucide-react
   - **StatusBar Icons**: Text-based badges (no icons needed)

3. **Component Refinements** ✅

   **AppLayout.tsx:**
   - Frameless layout with custom TitleBar
   - Flexible sidebar positioning (left/right via useUIStore)
   - Main content area with proper scrolling
   - StatusBar fixed at bottom
   - Consistent background colors: `bg-background`
   - Border colors: `border-border`

   **TitleBar.tsx:**
   - Draggable region: `-webkit-app-region: drag`
   - Button region: `-webkit-app-region: no-drag`
   - Theme toggle button with icon swapping
   - Sidebar position toggle button
   - Window controls (minimize, maximize, close) with VSCode icons
   - Proper hover states: `hover:bg-accent`
   - Consistent spacing: h-10, px-2, gap-2

   **StatusBar.tsx:**
   - Environment detection badge (Desktop/Browser)
   - Credential status badge (Active/Inactive/Expired)
   - Proxy status badge (Running/Stopped)
   - Color-coded status indicators using shadcn variants
   - Proper text sizing: `text-xs`
   - Consistent padding: px-4, py-1

   **Sidebar.tsx:**
   - Navigation menu with 4 routes
   - Active route highlighting: `bg-accent text-accent-foreground`
   - Icon + text layout with proper spacing
   - Hover states: `hover:bg-accent`
   - Fixed width: w-48
   - Proper border: `border-border`

4. **Verification** ✅
   - `npm run build` completes without errors
   - No TypeScript warnings
   - All components render correctly in both light and dark modes
   - Theme switching works smoothly
   - Window controls function properly
   - Layout is responsive and consistent

## Integration Points:
- Tailwind CSS theme system (`frontend/tailwind.config.js`)
- CSS custom properties (`frontend/src/index.css`)
- lucide-react icon library
- react-icons/vsc icon library
- shadcn/ui component library
- Zustand stores (useUIStore for theme/sidebar)

## Validation:

- [x] All emojis replaced with proper icons
- [x] No hardcoded colors (all use Tailwind theme variables)
- [x] Theme toggle works (light/dark mode)
- [x] Sidebar toggle works (left/right positioning)
- [x] Window controls work (minimize, maximize, close)
- [x] Active route highlighting works in Sidebar
- [x] Status badges display correct states
- [x] Layout is consistent across all pages
- [x] No visual glitches or alignment issues
- [x] Professional appearance maintained

## Structure After Phase 13:

- No new files (refinements to existing components)
- All layout components finalized
- UI/UX polish complete