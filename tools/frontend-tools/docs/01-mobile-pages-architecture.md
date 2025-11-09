# Mobile Pages Architecture - V2 Generator

## Overview

This document outlines the mobile-responsive architecture for the V2 Frontend Generator, focusing on creating a unified wrapper system that automatically switches between mobile and desktop page variants without duplicate wrappers.

## Problem with V4's Dual Wrapper Approach

### V4's Current Pattern (What We Want to Improve)
```typescript
// Parent component has switching logic
const isMobile = useIsMobile()
if (currentChildPage === "dragtest") {
  CurrentPageComponent = isMobile ? MobileDragTestPageWrapper : DragTestPageWrapper;
}

// Two separate wrappers
// DragTestPageWrapper.tsx (Desktop)
export const DragTestPageWrapper: React.FC = () => {
  usePageInstructions("dragtest")
  usePageActions("dragtest") 
  return <DragTestPage />
}

// MobileDragTestPageWrapper.tsx (Mobile)  
export const MobileDragTestPageWrapper: React.FC = () => {
  usePageInstructions("dragtest")  // Duplicate!
  usePageActions("dragtest")       // Duplicate!
  return <MobileDragTestPage />
}
```

### Issues with Dual Wrapper Pattern
1. **Code Duplication**: Both wrappers have identical hook calls
2. **Maintenance Overhead**: Two files to update for every page
3. **Parent Complexity**: Parent component needs switching logic
4. **Scaling Issues**: Adding tablet/desktop variants would require 3+ wrappers

## V2's Improved Single Wrapper Architecture

### Proposed V2 Pattern (Smart Wrapper)
```typescript
// Parent component stays simple
if (currentChildPage === "dragtest") {
  CurrentPageComponent = DragTestPageWrapper;  // Single wrapper!
}

// Single smart wrapper handles all device types
// DragTestPageWrapper.tsx
export const DragTestPageWrapper: React.FC = () => {
  const isMobile = useIsMobile()
  
  // Shared context (no duplication!)
  usePageInstructions("dragtest")
  usePageActions("dragtest")
  
  // Internal switching logic
  return isMobile ? <MobileDragTestPage /> : <DragTestPage />
}
```

### Benefits of Single Wrapper Pattern
1. **No Code Duplication**: Hooks called once in smart wrapper
2. **Simplified Parent**: Parent component has no device logic
3. **Single Source of Truth**: One wrapper per page type
4. **Easy Extension**: Adding tablet variant only requires updating one wrapper
5. **Better Encapsulation**: Device switching is internal implementation detail

## Implementation Architecture

### 1. Smart Wrapper Template Structure

```typescript
// templates/components/wrappers/smart_wrapper.template
import React from 'react';
import { useIsMobile } from '../../../hooks/core/useIsMobile';
import { usePageInstructions } from '../../../hooks/core/usePageInstructions';
import { usePageActions } from '../../../hooks/core/usePageActions';
import { {entity_pascal}Page } from '../../pages/{domain_kebab}/{entity_pascal}Page';
import { Mobile{entity_pascal}Page } from '../../pages/{domain_kebab}/Mobile{entity_pascal}Page';

export const {entity_pascal}PageWrapper: React.FC = () => {
  const isMobile = useIsMobile()
  
  // Shared page context
  usePageInstructions("{page_id}")
  usePageActions("{page_id}")
  
  // Smart device switching
  return isMobile ? <Mobile{entity_pascal}Page /> : <{entity_pascal}Page />
}
```

### 2. useIsMobile Hook Template

```typescript
// templates/hooks/core/useIsMobile.template
import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize with actual window width if available
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint
    }
    return false // SSR safe default
  })

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on mount
    checkIsMobile()

    // Add event listener for reactive updates
    window.addEventListener('resize', checkIsMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [breakpoint])

  return isMobile
}
```

### 3. Enhanced Component Key Strategy

```typescript
// Parent component ensures proper re-mounting
<CurrentPageComponent 
  key={`${currentChildPage}-${isMobile ? 'mobile' : 'desktop'}`} 
/>
```

**Note**: With smart wrapper, the key should be managed by the parent to ensure proper re-mounting when device type changes.

## Configuration Updates Needed

### 1. Page Templates Configuration

```json
// config/page_templates.json - Add mobile generation config
{
  "mobile_generation": {
    "enabled": true,
    "strategy": "smart_wrapper",
    "breakpoints": {
      "mobile": 768,
      "tablet": 1024,
      "desktop": 1200
    },
    "device_variants": ["mobile", "desktop"]
  },
  "page_patterns": {
    "responsive_page": {
      "pattern": ".*Page$",
      "wrapper_template": "components/wrappers/smart_wrapper.template",
      "desktop_template": "pages/standard/{pattern_type}.template",
      "mobile_template": "pages/mobile/mobile_{pattern_type}.template",
      "description": "Responsive page with automatic mobile/desktop switching"
    }
  }
}
```

### 2. Component Templates Configuration

```json
// config/component_templates.json - Add wrapper patterns
{
  "wrapper_patterns": {
    "smart_wrapper": {
      "pattern": ".*Wrapper$",
      "template": "components/wrappers/smart_wrapper.template",
      "includes_mobile_switching": true,
      "shared_hooks": ["usePageInstructions", "usePageActions"],
      "device_components": {
        "desktop": "{entity_pascal}Page",
        "mobile": "Mobile{entity_pascal}Page"
      }
    }
  }
}
```

## Generator Implementation Changes

### 1. Update Pages Generator

```python
# generators/pages_generator.py
def generate_responsive_page(self, page_name: str, domain: str, variables: Dict[str, Any]):
    """Generate responsive page with smart wrapper"""
    
    # Generate desktop page
    desktop_template = self.get_desktop_template(page_name)
    desktop_content = self.template_engine.process_template(desktop_template, variables)
    desktop_file = self.get_page_path(domain) / f"{page_name}.tsx"
    self.write_file(desktop_file, desktop_content)
    
    # Generate mobile page variant
    mobile_template = self.get_mobile_template(page_name)
    mobile_content = self.template_engine.process_template(mobile_template, variables)
    mobile_file = self.get_page_path(domain) / f"Mobile{page_name}.tsx"
    self.write_file(mobile_file, mobile_content)
    
    # Generate smart wrapper
    wrapper_template = self.load_template("components/wrappers/smart_wrapper.template")
    wrapper_variables = {**variables, "page_id": self.get_page_id(page_name, domain)}
    wrapper_content = self.template_engine.process_template(wrapper_template, wrapper_variables)
    wrapper_file = self.get_component_path(domain) / f"{page_name}Wrapper.tsx"
    self.write_file(wrapper_file, wrapper_content)
```

### 2. Update Components Generator

```python
# generators/components_generator.py  
def generate_responsive_wrapper(self, component_name: str, domain: str, variables: Dict[str, Any]):
    """Generate smart wrapper component"""
    
    wrapper_config = self.component_templates.get('wrapper_patterns', {}).get('smart_wrapper', {})
    template_name = wrapper_config.get('template')
    
    if template_name:
        template_content = self.template_engine.load_template(template_name)
        content = self.template_engine.process_template(template_content, variables)
        
        wrapper_file = self.get_component_path(domain) / f"{component_name}Wrapper.tsx"
        self.write_file(wrapper_file, content)
```

## Template Files Required

### 1. Core Templates
- `components/wrappers/smart_wrapper.template` - Smart wrapper with device switching
- `hooks/core/useIsMobile.template` - Mobile detection hook
- `pages/mobile/mobile_page.template` - Mobile page variant template

### 2. Page Variant Templates
- `pages/mobile/mobile_list_page.template` - Mobile list page
- `pages/mobile/mobile_detail_page.template` - Mobile detail page  
- `pages/mobile/mobile_form_page.template` - Mobile form page

### 3. Component Templates (Chess-specific)
- `components/chess/mobile_chessboard.template` - Mobile chessboard layout
- `components/chess/chessboard.template` - Desktop chessboard layout

## Migration from V4 Pattern

### V4 → V2 Conversion Strategy

1. **Identify Dual Wrappers**: Find all `*PageWrapper.tsx` and `Mobile*PageWrapper.tsx` pairs
2. **Merge Logic**: Combine both wrappers into single smart wrapper
3. **Extract Pages**: Separate page components from wrapper logic
4. **Update Parent**: Remove device switching from parent components
5. **Test Switching**: Verify mobile/desktop switching works correctly

### Example Migration

**Before (V4 - Dual Wrappers):**
```
components/
├── dragtest/
│   ├── DragTestPageWrapper.tsx      # Desktop wrapper
│   └── MobileDragTestPageWrapper.tsx # Mobile wrapper
pages/
└── dragtest/
    └── DragTestPage.tsx             # Combined page
```

**After (V2 - Smart Wrapper):**
```
components/
└── dragtest/
    └── DragTestPageWrapper.tsx      # Smart wrapper (combines both)
pages/
└── dragtest/
    ├── DragTestPage.tsx             # Desktop page
    └── MobileDragTestPage.tsx       # Mobile page
```

## Testing Strategy

### 1. Device Switching Tests
```typescript
// Test responsive behavior
describe('Smart Wrapper Device Switching', () => {
  test('renders desktop component on desktop viewport', () => {
    mockViewport(1024)
    render(<DragTestPageWrapper />)
    expect(screen.getByTestId('desktop-drag-test')).toBeInTheDocument()
  })
  
  test('renders mobile component on mobile viewport', () => {
    mockViewport(375) 
    render(<DragTestPageWrapper />)
    expect(screen.getByTestId('mobile-drag-test')).toBeInTheDocument()
  })
  
  test('switches components when viewport changes', () => {
    mockViewport(1024)
    const { rerender } = render(<DragTestPageWrapper />)
    
    mockViewport(375)
    rerender(<DragTestPageWrapper />)
    
    expect(screen.getByTestId('mobile-drag-test')).toBeInTheDocument()
  })
})
```

### 2. Hook Integration Tests
```typescript
// Test shared hook behavior
describe('Smart Wrapper Hook Integration', () => {
  test('calls usePageInstructions once regardless of device', () => {
    const mockUsePageInstructions = jest.fn()
    
    render(<DragTestPageWrapper />)
    
    expect(mockUsePageInstructions).toHaveBeenCalledTimes(1)
    expect(mockUsePageInstructions).toHaveBeenCalledWith('dragtest')
  })
})
```

## Performance Considerations

### 1. Component Re-mounting Strategy
- **Smart wrapper manages device switching internally**
- **Parent provides component key for proper re-mounting on device changes**
- **Avoids unnecessary wrapper re-creation**

### 2. Hook Optimization
- **useIsMobile hook uses proper effect dependencies**
- **Shared hooks called once per wrapper (not per device variant)**
- **Cleanup listeners on component unmount**

### 3. Template Loading
- **Templates loaded once and cached**
- **Variable substitution happens at generation time**
- **No runtime template processing**

## Benefits Summary

### Developer Experience
1. **Single File Management**: One wrapper per page instead of two
2. **Reduced Duplication**: Hooks and context logic not duplicated
3. **Cleaner Architecture**: Device switching encapsulated in wrapper
4. **Easier Testing**: Single component to test instead of two

### User Experience  
1. **Seamless Switching**: Automatic device detection and switching
2. **Consistent Context**: Same instructions and actions across devices
3. **Performance**: Proper component re-mounting with device changes
4. **Responsive**: Real-time switching when resizing browser

### Maintenance Benefits
1. **Single Source of Truth**: One wrapper contains all device logic
2. **Extensible**: Easy to add tablet/desktop variants
3. **Configurable**: Breakpoints and variants defined in JSON
4. **Template-Driven**: All patterns defined in reusable templates

## Next Steps

1. **Create Smart Wrapper Template**: Implement the unified wrapper template
2. **Update Page Generator**: Add responsive page generation logic
3. **Create useIsMobile Hook**: Implement mobile detection with proper SSR handling
4. **Update Configuration**: Add mobile generation settings to JSON configs  
5. **Test Implementation**: Verify device switching works correctly
6. **Migrate Existing**: Convert any existing dual wrappers to smart wrapper pattern

This architecture provides a cleaner, more maintainable solution than V4's dual wrapper approach while maintaining all the responsive functionality.