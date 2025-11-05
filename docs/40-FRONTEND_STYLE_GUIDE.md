# Frontend Style Guide - Golden Standards

## Document Information
- **Document**: 40 - Frontend Style Guide
- **Version**: 1.0
- **Date**: November 4, 2025
- **Purpose**: Define styling standards and patterns based on LoginPage golden standard
- **Golden Standard**: `/frontend/src/pages/user/LoginPage.tsx`

---

## 1. Core Styling Principles

### 1.1 NO Inline Tailwind Classes

**CRITICAL RULE: ALL styling must be defined as CSS classes, NEVER inline**

The LoginPage violates this principle and needs refactoring. This guide establishes the CORRECT patterns going forward.

**❌ WRONG (Current LoginPage pattern):**
```tsx
<div className="text-center mb-8 lg:mb-10">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 tracking-tight">
    Master Chess Training
  </h1>
</div>
```

**✅ CORRECT (New standard):**
```tsx
<div className="auth-header">
  <h1 className="auth-title">
    Master Chess Training
  </h1>
</div>

/* In index.css */
.auth-header {
  @apply text-center mb-8 lg:mb-10;
}

.auth-title {
  @apply text-2xl sm:text-3xl lg:text-4xl xl:text-5xl;
  @apply font-bold text-foreground mb-3 tracking-tight;
}
```

### 1.2 Theme Variables Only

**ALWAYS use semantic theme variables, NEVER hardcoded colors**

**✅ From LoginPage (Correct):**
```tsx
<p className="text-sm text-destructive">{error}</p>
<div className="bg-destructive/10 border border-destructive/20">
```

**Theme Variables Available:**
```css
/* Backgrounds */
bg-background          /* Main background */
bg-card                /* Card/panel backgrounds */
bg-muted               /* Subtle backgrounds */
bg-accent              /* Hover states */
bg-primary             /* Primary actions */
bg-secondary           /* Secondary actions */
bg-destructive         /* Errors/warnings */

/* Text Colors */
text-foreground        /* Primary text */
text-muted-foreground  /* Secondary text */
text-primary           /* Accent text */
text-destructive       /* Error text */

/* Borders */
border-border          /* Standard borders */
border-primary         /* Accent borders */
border-destructive     /* Error borders */
```

### 1.3 Responsive Design Patterns

**From LoginPage - Responsive breakpoints:**
```css
/* Mobile-first approach */
.element-base          /* Default: mobile */
.element-sm           /* sm: 640px */
.element-md           /* md: 768px */
.element-lg           /* lg: 1024px */
.element-xl           /* xl: 1280px */
```

**Text sizing pattern:**
```css
.auth-title {
  @apply text-2xl sm:text-3xl lg:text-4xl xl:text-5xl;
}

.auth-subtitle {
  @apply text-base lg:text-lg xl:text-xl;
}

.auth-body-text {
  @apply text-sm;
}

.auth-small-text {
  @apply text-xs;
}
```

---

## 2. Component Styling Patterns

### 2.1 Authentication Pages Pattern

**Based on LoginPage structure:**

**Header Section:**
```css
.auth-header {
  @apply text-center mb-8 lg:mb-10;
}

.auth-icon {
  @apply text-6xl sm:text-7xl lg:text-8xl xl:text-9xl mb-4 animate-pulse;
}

.auth-title {
  @apply text-2xl sm:text-3xl lg:text-4xl xl:text-5xl;
  @apply font-bold text-foreground mb-3 tracking-tight;
}

.auth-subtitle {
  @apply text-base lg:text-lg xl:text-xl;
  @apply text-muted-foreground font-medium;
}

.auth-decorative-icons {
  @apply flex justify-center space-x-2 mt-3;
  @apply text-xl sm:text-2xl lg:text-3xl opacity-60;
}
```

**Error Message:**
```css
.auth-error {
  @apply mt-4 p-3;
  @apply bg-destructive/10 border border-destructive/20 rounded-lg;
}

.auth-error-text {
  @apply text-sm text-destructive;
}
```

**Form Elements:**
```css
.auth-form {
  @apply space-y-4 sm:space-y-5 md:space-y-6;
}

.auth-form-actions {
  @apply flex items-center justify-between text-xs;
}

.auth-remember-container {
  @apply flex flex-row items-center space-x-2 space-y-0;
}

.auth-remember-checkbox {
  @apply w-3 h-3;
}

.auth-remember-label {
  @apply text-muted-foreground font-normal;
}

.auth-link {
  @apply p-0 h-auto text-xs text-primary hover:text-primary/80;
}
```

**Buttons:**
```css
.auth-button-primary {
  @apply w-full py-2.5;
}

.auth-button-secondary {
  @apply w-full py-2.5;
}

.auth-button-loading {
  @apply flex items-center justify-center space-x-2;
}

.auth-spinner {
  @apply w-3 h-3 border-2;
  @apply border-white/30 border-t-white;
  @apply rounded-full animate-spin;
}

.auth-button-text {
  @apply text-sm;
}
```

**Footer Section:**
```css
.auth-footer {
  @apply mt-6 text-center;
}

.auth-footer-text {
  @apply text-xs text-muted-foreground;
}
```

### 2.2 Form Input Pattern

**Password Toggle (From LoginPage):**
```tsx
<div className="password-field-container">
  <Input
    type={showPassword ? "text" : "password"}
    className="password-input"
  />
  <button
    type="button"
    className="password-toggle"
  >
    {showPassword ? <EyeOff /> : <Eye />}
  </button>
</div>
```

```css
.password-field-container {
  @apply relative;
}

.password-input {
  @apply pr-10;
}

.password-toggle {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2;
  @apply text-muted-foreground hover:text-foreground;
  @apply transition-colors duration-200;
}

.password-toggle-icon {
  @apply h-4 w-4;
}
```

### 2.3 Loading States Pattern

**From LoginPage - Consistent loading pattern:**
```css
.loading-container {
  @apply flex items-center justify-center space-x-2;
}

.loading-spinner {
  @apply w-3 h-3 border-2 rounded-full animate-spin;
}

.loading-spinner-light {
  @apply border-white/30 border-t-white;
}

.loading-spinner-dark {
  @apply border-muted-foreground/30 border-t-muted-foreground;
}

.loading-text {
  @apply text-sm;
}
```

---

## 3. Page Layout Patterns

### 3.1 Desktop Page Layout (3x3 Grid)

**From DashboardMainPage - Desktop grid structure:**

```tsx
<div className="page-container-desktop">
  <div className="page-grid-3x3">
    {/* Row 1 */}
    <div className="grid-cell">Top Left</div>
    <div className="grid-cell">Top Center</div>
    <div className="grid-cell">Top Right</div>

    {/* Row 2 */}
    <div className="grid-cell">Middle Left</div>
    <div className="grid-cell-main">Main Content</div>
    <div className="grid-cell">Middle Right</div>

    {/* Row 3 */}
    <div className="grid-cell">Bottom Left</div>
    <div className="grid-cell">Bottom Center</div>
    <div className="grid-cell">Bottom Right</div>
  </div>
</div>
```

```css
.page-container-desktop {
  @apply uitest-layout-container;
}

.page-grid-3x3 {
  @apply w-full h-full border-2 border-border p-2;
  display: grid;
  grid-template-columns: 100px 1fr 100px;
  grid-template-rows: 80px 1fr 80px;
  gap: 8px;
  min-height: 100%;
}

.grid-cell {
  @apply flex items-center justify-center;
  @apply border border-border/50 p-2 rounded;
  min-height: 0;
  min-width: 0;
}

.grid-cell-main {
  @apply grid-cell;
  /* Main content cell - can override with specific styling */
}
```

### 3.2 Mobile Page Layout (Vertical Stack)

**From MobileDashboardMainPage - Mobile vertical structure:**

```tsx
<div className="page-container-mobile">
  <div className="page-stack-mobile">
    {/* Top Section */}
    <div className="mobile-section-top">
      <div className="mobile-section-content">
        Mobile Dashboard Top
      </div>
    </div>

    {/* Center Content */}
    <div className="mobile-section-center">
      <div className="w-full h-full flex items-center justify-center">
        Mobile Dashboard Center Content
      </div>
    </div>

    {/* Bottom Section */}
    <div className="mobile-section-bottom">
      <div className="mobile-section-content">
        Mobile Dashboard Bottom
      </div>
    </div>
  </div>
</div>
```

```css
.page-container-mobile {
  @apply uitest-mobile-container-padded;
}

.page-stack-mobile {
  @apply w-full h-full relative;
  @apply transition-all duration-300 ease-in-out;
  display: grid;
  grid-template-rows: 60px auto 80px;
  box-sizing: border-box;
}

.mobile-section-top {
  @apply transition-all duration-300 ease-in-out;
  @apply flex items-center w-full h-full;
  box-sizing: border-box;
  overflow: hidden;
  transform: translateZ(0);
  backdrop-filter: blur(24px);
  background-color: color-mix(in srgb, var(--card) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 20%, transparent);
}

.mobile-section-center {
  @apply transition-all duration-300 ease-out;
  @apply w-full h-full;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  transform: translateZ(0);
  border: none;
}

.mobile-section-bottom {
  @apply mobile-section-top;
}

.mobile-section-content {
  @apply transition-transform duration-200 ease-in-out hover:scale-105;
  @apply flex-1 w-full h-full;
}
```

---

## 4. Naming Conventions

### 4.1 CSS Class Naming Pattern

**Format: `[component]-[element]-[modifier]`**

**Component Prefixes:**
- `.auth-*` - Authentication pages (login, register, forgot password)
- `.dashboard-*` - Dashboard page components
- `.providers-*` - Providers page components
- `.activity-*` - Activity page components
- `.settings-*` - Settings page components
- `.page-*` - Generic page-level classes
- `.grid-*` - Grid layout classes
- `.mobile-*` - Mobile-specific classes

**Examples from LoginPage (Refactored):**
```css
.auth-header           /* Component base */
.auth-header-icon      /* Component element */
.auth-title            /* Component element */
.auth-title-large      /* Element modifier */
.auth-form             /* Component base */
.auth-form-field       /* Component element */
.auth-button-primary   /* Component element + modifier */
```

### 4.2 State Classes

**Pattern: `[component]-[state]`**

```css
.auth-button-loading
.auth-button-disabled
.auth-error-visible
.auth-form-submitting
.mobile-section-expanded
.mobile-section-collapsed
```

---

## 5. Animation & Transitions

### 5.1 Standard Transitions

**From LoginPage and Mobile pages:**

```css
/* Standard transition durations */
.transition-fast {
  @apply transition-all duration-200 ease-in-out;
}

.transition-normal {
  @apply transition-all duration-300 ease-in-out;
}

.transition-slow {
  @apply transition-all duration-300 ease-out;
}

/* Hover scale effect */
.hover-scale {
  @apply transition-transform duration-200 ease-in-out hover:scale-105;
}

/* Color transitions */
.transition-colors {
  @apply transition-colors duration-200;
}
```

### 5.2 Loading Animations

```css
/* Pulse animation (for icons) */
.animate-pulse-slow {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Spinner animation */
.spinner {
  @apply animate-spin;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 6. Component Composition Rules

### 6.1 shadcn/ui Integration

**From LoginPage - Proper shadcn/ui usage:**

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

**Custom styling with shadcn/ui:**
- Use `className` prop to apply custom classes
- Never modify shadcn/ui components directly
- Create wrapper components if heavy customization needed

### 6.2 Layout Wrappers

**AuthLayout Pattern:**
```tsx
<AuthLayout>
  {/* Auth page content */}
</AuthLayout>
```

**Page Wrapper Pattern:**
```tsx
<div className="page-container-desktop">
  <div className="page-grid-3x3">
    {/* Page content */}
  </div>
</div>
```

---

## 7. Accessibility Standards

### 7.1 Form Accessibility

**From LoginPage - Proper form attributes:**

```tsx
<Input
  type="email"
  placeholder="Enter your email"
  autoComplete="email"
  {...field}
/>

<Input
  type="password"
  placeholder="Enter your password"
  autoComplete="current-password"
  {...field}
/>
```

### 7.2 Button States

```tsx
<Button
  type="submit"
  disabled={isLoading}
>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

---

## 8. Code Organization

### 8.1 Component Structure

**LoginPage pattern - Component organization:**

```tsx
// 1. Imports
import React, { useState } from "react";
import { useForm } from "react-hook-form";

// 2. Schema/Types
const loginSchema = z.object({...});
type LoginFormValues = z.infer<typeof loginSchema>;

// 3. Interface
interface LoginPageProps {
  onNavigate?: (page: AuthPage) => void;
}

// 4. Main Component (Parent/Router)
export const LoginPage: React.FC<LoginPageProps> = () => {
  // Router logic
  return <LoginMainPage />;
};

// 5. Sub-components
const LoginMainPage: React.FC<Props> = ({ onNavigate }) => {
  // Component logic
  return <AuthLayout>...</AuthLayout>;
};
```

### 8.2 Hook Usage Order

**From LoginPage - Consistent hook ordering:**

```tsx
// 1. Page hooks
usePageInstructions("login");

// 2. Store hooks
const currentChildPage = useAppStore((state) => state.currentChildPage);
const setCurrentChildPage = useAppStore((state) => state.setCurrentChildPage);

// 3. Local state
const [showPassword, setShowPassword] = useState(false);

// 4. Custom hooks
const { login, isLoading, error } = useLogin();
const { loginWithDemo, isLoading: isDemoLoading } = useDemoLogin();

// 5. Form hooks (if applicable)
const form = useForm<LoginFormValues>({...});
```

---

## 9. Implementation Checklist

### 9.1 Before Creating Any Page

- [ ] Define all CSS classes in `index.css`
- [ ] Use semantic class names following `[component]-[element]-[modifier]` pattern
- [ ] Use only theme variables for colors
- [ ] Plan responsive breakpoints (mobile-first)
- [ ] Define loading states
- [ ] Define error states
- [ ] Plan accessibility attributes

### 9.2 During Development

- [ ] NO inline Tailwind classes in components
- [ ] All text uses theme color variables
- [ ] Responsive design tested at all breakpoints
- [ ] Loading states implemented consistently
- [ ] Error states styled with theme variables
- [ ] Forms have proper autocomplete attributes
- [ ] Buttons have proper disabled states

### 9.3 Code Review Checklist

- [ ] Zero inline Tailwind classes
- [ ] All custom classes defined in `index.css`
- [ ] Only theme variables used (no `text-blue-500`, `bg-gray-100`, etc.)
- [ ] Class names follow naming convention
- [ ] Responsive design works on mobile and desktop
- [ ] Loading and error states properly styled
- [ ] Accessibility attributes present
- [ ] Component structure follows LoginPage pattern

---

## 10. Refactoring Guide

### 10.1 Converting Inline Classes to Custom Classes

**Step 1: Identify all inline Tailwind usage**
```bash
# Find all inline Tailwind in components
grep -r 'className=".*flex.*"' src/components
```

**Step 2: Extract to CSS classes**
```tsx
// Before
<div className="flex items-center justify-between p-4 bg-card">
  <span className="text-lg font-bold">Title</span>
</div>

// After
<div className="header-container">
  <span className="header-title">Title</span>
</div>
```

```css
/* Add to index.css */
.header-container {
  @apply flex items-center justify-between p-4 bg-card;
}

.header-title {
  @apply text-lg font-bold;
}
```

**Step 3: Replace hardcoded colors**
```css
/* Before */
.error-box {
  @apply bg-red-100 text-red-800 border-red-300;
}

/* After */
.error-box {
  @apply bg-destructive/10 text-destructive border-destructive/20;
}
```

---

## Summary

This style guide establishes the golden standards for frontend development based on the LoginPage structure and Doc 01A architecture principles:

**Core Rules:**
1. NO inline Tailwind classes - ALL styling in `index.css`
2. Theme variables ONLY - NO hardcoded colors
3. Semantic class naming: `[component]-[element]-[modifier]`
4. Mobile-first responsive design
5. Consistent loading/error states
6. Proper accessibility attributes

**Reference Implementation:**
- `/frontend/src/pages/user/LoginPage.tsx` - Authentication pattern
- `/frontend/src/pages/dashboard/DashboardMainPage.tsx` - Desktop layout
- `/frontend/src/pages/dashboard/MobileDashboardMainPage.tsx` - Mobile layout

**Next Steps:**
1. Refactor LoginPage to follow CSS class pattern
2. Apply these standards to all new pages
3. Gradually refactor existing pages
4. Enforce in code reviews

---

**Related Documents:**
- `01A-ARCHITECTURE_GUIDE.md` - Overall architecture principles
- `02-STYLE_GUIDE_V2.md` - Original style guide (if exists)
