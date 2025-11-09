# Instructions System Architecture - V2 Generator

## Overview

This document outlines the template-driven instruction system for the V2 Frontend Generator. The system provides contextual user guidance for each page through a clean template-based approach that integrates seamlessly with the domain-driven architecture.

## V4 vs V2 Architecture Comparison

### V4's Hardcoded Approach (What We're Replacing)
```typescript
// InstructionsService.ts - 300+ lines of hardcoded instructions
this.instructionsMap.set('playchess', {
  title: 'Classical Chess Games',
  instructions: [
    'Play full chess games on a complete 8x8 board with all 32 pieces',
    'Experience professional drag & drop chess interactions',
    // ... 20+ more hardcoded chess instructions
  ]
})
```

**V4 Issues:**
- 40+ hardcoded page instructions in Python/TypeScript
- Chess-specific logic baked into generator
- Manual updates required for each new page
- No reusability across domains

### V2's Template-Driven Approach (Clean Architecture)
```typescript
// Generated from templates - no hardcoded content
export const pageInstructions = {
  id: 'users',
  title: 'User Management',
  instructions: [
    'Manage user accounts and profiles in your application',
    'Use the action sheet to access user operations', 
    'Navigate between list, detail, and form views'
  ]
}
```

**V2 Benefits:**
- Domain-agnostic templates
- Variable substitution for reusability  
- Template files for easy maintenance
- Automatic generation for all endpoints

## Core Components Architecture

### 1. Instruction UI Components

**`InstructionsFAB.tsx`** - Floating Action Button
- Positioned bottom-right with HelpCircle icon
- Triggers instruction modal on click
- Integrates with Global UI Audio System

**`InstructionsModal.tsx`** - Modal Dialog
- Target icon in header with page title
- Bulleted instruction list with colored dots
- "Got it!" button for dismissal
- Backdrop click-to-close functionality

**`InstructionsContext.tsx`** - React Context
- Manages instruction state globally
- Provides setInstructions and getInstructions methods
- Integrates with page navigation system

### 2. Instruction Hooks

**`usePageInstructions.ts`** - Auto-Loading Hook
```typescript
export const usePageInstructions = (pageId: string) => {
  const { setInstructions } = useInstructions()

  useEffect(() => {
    const pageInstructions = instructionsService.getInstructions(pageId)
    if (pageInstructions) {
      setInstructions(pageInstructions.title, pageInstructions.instructions)
    }
  }, [pageId, setInstructions])
}
```

**`useInstructions.ts`** - Context Consumer Hook
- Provides access to instruction context
- Used by instruction components and pages
- Handles instruction state updates

### 3. Instruction Service

**`InstructionsService.ts`** - Dynamic Service
- Singleton pattern for global access
- Dynamic import system using `import.meta.glob`
- Automatic instruction file discovery
- Caching for performance optimization

## Template System Implementation

### 1. Domain-Specific Instruction Templates

**Authentication Domain:**
```typescript
// templates/services/instructions/auth_instructions.template
export const pageInstructions = {
  id: '{page_id}',
  title: '{domain_pascal} Security',
  instructions: [
    'Secure user authentication and session management',
    'Handle login, registration, and password recovery',
    'Manage user credentials and access tokens',
    'Use secure authentication flows and validation'
  ]
}
```

**User Management Domain:**
```typescript
// templates/services/instructions/user_management_instructions.template
export const pageInstructions = {
  id: '{page_id}',
  title: 'User {entity_pascal} Management',
  instructions: [
    'Manage {entity_plural} accounts and profile information',
    'Create, view, edit, and delete {entity} records',
    'Use search and filtering to find specific {entity_plural}',
    'Access detailed {entity} information and edit capabilities'
  ]
}
```

**Chess/Gaming Domain:**
```typescript
// templates/services/instructions/chess_instructions.template
export const pageInstructions = {
  id: '{page_id}',
  title: 'Chess {entity_pascal}',
  instructions: [
    'Interactive chess {entity_plural} for skill improvement',
    'Use tactical training and strategic learning tools',
    'Track your progress and performance analytics',
    'Challenge yourself with increasing difficulty levels'
  ]
}
```

**Generic Domain:**
```typescript
// templates/services/instructions/generic_instructions.template
export const pageInstructions = {
  id: '{page_id}',
  title: '{domain_pascal} {entity_pascal}',
  instructions: [
    'Manage {entity_plural} data in your application',
    'Use the action sheet to access available operations',
    'Navigate between list, detail, and form views',
    'Search, filter, and organize {entity_plural} efficiently'
  ]
}
```

### 2. Template Configuration Mapping

**`config/instruction_templates.json`:**
```json
{
  "description": "Maps domains to instruction templates",
  "domain_templates": {
    "authentication": "services/instructions/auth_instructions.template",
    "user-management": "services/instructions/user_management_instructions.template",
    "puzzles": "services/instructions/chess_instructions.template", 
    "gameplay": "services/instructions/chess_instructions.template",
    "chess-theory": "services/instructions/chess_instructions.template",
    "learning": "services/instructions/chess_instructions.template"
  },
  "default_template": "services/instructions/generic_instructions.template",
  "ui_components": {
    "fab_template": "components/core/instructions_fab.template",
    "modal_template": "components/core/instructions_modal.template",
    "context_template": "contexts/instructions_context.template"
  },
  "hooks": {
    "page_instructions_hook": "hooks/core/usePageInstructions.template",
    "instructions_hook": "hooks/core/useInstructions.template"
  },
  "services": {
    "instructions_service": "services/instructions_service.template"
  }
}
```

### 3. Template Variable System

**Standard Variables Available:**
```json
{
  "page_id": "users",
  "domain": "user-management", 
  "domain_pascal": "UserManagement",
  "domain_kebab": "user-management",
  "entity": "User",
  "entity_pascal": "User",
  "entity_plural": "users",
  "entities_pascal": "Users"
}
```

## Generator Implementation

### 1. Instruction Generator Class

```python
class InstructionGenerator(BaseFrontendGenerator):
    """Generates instruction system components and files"""
    
    def generate_instruction_system(self):
        """Generate complete instruction system"""
        # Generate core components
        self._generate_instruction_components()
        
        # Generate hooks
        self._generate_instruction_hooks()
        
        # Generate service
        self._generate_instruction_service()
        
        # Generate domain instruction files
        self._generate_domain_instructions()
    
    def _generate_domain_instructions(self):
        """Generate instruction files for all domains"""
        domains = self.domain_mapping.group_endpoints_by_domain(self.backend_config['endpoints'])
        
        for domain, endpoints in domains.items():
            template_name = self._get_template_for_domain(domain)
            
            for endpoint in endpoints:
                variables = self.build_template_variables(domain, endpoint)
                
                template_content = self.template_engine.load_template(template_name)
                content = self.template_engine.process_template(template_content, variables)
                
                instruction_file = self.get_instructions_path(domain) / f"{endpoint}.ts"
                self.write_file(instruction_file, content)
    
    def _get_template_for_domain(self, domain: str) -> str:
        """Get instruction template for specific domain"""
        domain_templates = self.instruction_templates.get('domain_templates', {})
        return domain_templates.get(domain, domain_templates['default_template'])
```

### 2. Integration with Smart Wrapper System

```typescript
// Smart wrapper automatically includes instructions
export const {entity_pascal}PageWrapper: React.FC = () => {
  const isMobile = useIsMobile()
  
  // Auto-load instructions for this page
  usePageInstructions("{page_id}")
  usePageActions("{page_id}")
  
  return isMobile ? <Mobile{entity_pascal}Page /> : <{entity_pascal}Page />
}
```

### 3. Layout Integration

```typescript
// App layout includes instruction components
export const AppLayout: React.FC = ({ children }) => {
  return (
    <div className="app-layout">
      <Navigation />
      <main className="main-content">
        {children}
      </main>
      <InstructionsFAB onClick={() => setModalOpen(true)} />
      <InstructionsModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        {...instructionsState}
      />
    </div>
  )
}
```

## File Structure Generated

```
src/
├── components/
│   └── core/
│       ├── InstructionsFAB.tsx
│       ├── InstructionsModal.tsx
│       └── index.ts
├── contexts/
│   └── InstructionsContext.tsx
├── hooks/
│   └── core/
│       ├── useInstructions.ts
│       ├── usePageInstructions.ts
│       └── index.ts  
├── services/
│   ├── instructions/
│   │   ├── InstructionsService.ts
│   │   └── pages/
│   │       ├── users.ts
│   │       ├── user_profiles.ts
│   │       ├── puzzles.ts
│   │       └── ... (all endpoints)
│   └── index.ts
└── types/
    └── core/
        └── instructions.types.ts
```

## Component Templates Required

### 1. Core Component Templates
- `components/core/instructions_fab.template`
- `components/core/instructions_modal.template`
- `contexts/instructions_context.template`

### 2. Hook Templates  
- `hooks/core/useInstructions.template`
- `hooks/core/usePageInstructions.template`

### 3. Service Templates
- `services/instructions_service.template`

### 4. Type Definition Templates
- `types/core/instructions.types.template`

## Testing Strategy

### 1. Component Testing
```typescript
describe('InstructionsFAB', () => {
  test('renders help icon and triggers modal', () => {
    const mockClick = jest.fn()
    render(<InstructionsFAB onClick={mockClick} />)
    
    fireEvent.click(screen.getByLabelText('Show instructions'))
    expect(mockClick).toHaveBeenCalled()
  })
})
```

### 2. Hook Testing
```typescript
describe('usePageInstructions', () => {
  test('loads instructions for page ID', () => {
    const TestComponent = () => {
      usePageInstructions('users')
      return <div>Test</div>
    }
    
    render(<TestComponent />)
    expect(mockSetInstructions).toHaveBeenCalledWith(
      'User Management',
      expect.arrayContaining(['Manage user accounts'])
    )
  })
})
```

### 3. Service Testing
```typescript
describe('InstructionsService', () => {
  test('dynamically loads instruction files', async () => {
    await instructionsService.initialize()
    const instructions = instructionsService.getInstructions('users')
    
    expect(instructions).toBeDefined()
    expect(instructions.title).toBe('User Management')
  })
})
```

## Performance Considerations

### 1. Lazy Loading
- Instructions loaded only when needed
- Dynamic import system for efficient bundling
- Service initialization on first access

### 2. Caching Strategy
- Instructions cached after first load
- Service singleton prevents duplicate instances
- Template processing happens at build time

### 3. Bundle Optimization
- Tree shaking removes unused instruction files
- Dynamic imports create separate chunks
- Minimal runtime overhead

## Integration with V2 Architecture

### 1. Domain-Driven Organization
- Instructions organized by domain folders
- Template selection based on domain type
- Automatic generation for all endpoints

### 2. Template Engine Integration
- Uses same template engine as other generators
- Variable substitution for customization
- Consistent template processing pipeline

### 3. Configuration-Driven Generation
- JSON configuration for template mapping
- No hardcoded instruction content
- Easy to extend with new domains

## Benefits Summary

### Developer Experience
1. **Template-Based**: Easy to customize instruction content
2. **Domain-Agnostic**: Works with any backend configuration
3. **Automatic Generation**: Instructions created for all endpoints
4. **Clean Architecture**: No hardcoded content in generators

### User Experience
1. **Contextual Help**: Page-specific guidance always available
2. **Consistent UI**: Unified instruction interface across app
3. **Accessible Design**: Proper ARIA labels and keyboard navigation
4. **Mobile-Friendly**: Responsive modal and FAB positioning

### Maintenance Benefits
1. **Template Updates**: Modify templates instead of code
2. **Scalable System**: Easy to add new instruction types
3. **Reusable Components**: Instruction system works across domains
4. **Version Control**: Template changes clearly visible in diffs

## Next Steps

1. **Create Instruction Templates**: Implement all template files
2. **Build Generator Logic**: Add instruction generation to V2 generator
3. **Integrate with Smart Wrappers**: Include usePageInstructions in wrappers
4. **Test System**: Verify instruction loading and display
5. **Configure Domains**: Map chess and generic domains to appropriate templates

This template-driven instruction system provides a clean, maintainable foundation for contextual user guidance while remaining flexible enough to work with any domain configuration.