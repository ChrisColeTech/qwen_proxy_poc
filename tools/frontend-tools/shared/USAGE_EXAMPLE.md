# NameStandardizer Usage Example

## Overview

The `NameStandardizer` provides centralized name standardization across all generator modules to eliminate casing inconsistencies and import/export mismatches.

## Basic Usage

```python
from shared.name_standardizer import NameStandardizer

# Convert to different formats
name = "testcenter"  # or "test-center", "test_center", etc.

pascal_case = NameStandardizer.to_pascal_case(name)        # "TestCenter"
camel_case = NameStandardizer.to_camel_case(name)          # "testCenter" 
kebab_case = NameStandardizer.to_kebab_case(name)          # "test-center"
snake_case = NameStandardizer.to_snake_case(name)          # "test_center"

# Generate specific naming formats
component_name = NameStandardizer.to_component_name(name)  # "TestCenterPage"
hook_name = NameStandardizer.to_hook_name(name)            # "useTestCenterActions"
directory_name = NameStandardizer.to_directory_name(name)  # "testcenter"
constant_name = NameStandardizer.to_constant_name(name)    # "TEST_CENTER"
```

## Complete Page Standardization

```python
# Generate all standardized formats at once
standards = NameStandardizer.standardize_page_names("testcenter")

print(standards)
# {
#     'page_id': 'testcenter',
#     'base_name': 'TestCenter', 
#     'component_name': 'TestCenterPage',
#     'hook_name': 'useTestCenterActions',
#     'directory_name': 'testcenter',
#     'file_name': 'TestCenter',
#     'camel_case': 'testCenter',
#     'kebab_case': 'test-center',
#     'snake_case': 'test_center',
#     'constant_case': 'TEST_CENTER'
# }

# Validate consistency
is_consistent = NameStandardizer.validate_consistency(standards)
print(is_consistent)  # True
```

## Integration with Existing Modules

### Replace existing _to_pascal_case methods:

**Before:**
```python
def _to_pascal_case(self, name: str) -> str:
    parts = name.replace('-', ' ').replace('_', ' ').split()
    return ''.join(part.capitalize() for part in parts if part)
```

**After:**
```python
from shared.name_standardizer import NameStandardizer

# Replace all _to_pascal_case calls with:
NameStandardizer.to_pascal_case(name)
```

### Example integration in config.py:

```python
# Before
class PageConfig:
    def _to_pascal_case(self, name: str) -> str:
        # ... existing implementation
        
    def __init__(self, name: str, ...):
        self.base_name = self._to_pascal_case(self.name)

# After  
from shared.name_standardizer import NameStandardizer

class PageConfig:
    def __init__(self, name: str, ...):
        self.base_name = NameStandardizer.to_pascal_case(self.name)
```

### Example integration in variable_generator.py:

```python
# Before
def _to_pascal_case_compound_aware(self, name: str) -> str:
    # ... complex compound word logic
    
# After - remove method entirely, use:
from shared.name_standardizer import NameStandardizer

# Replace calls:
# old: pascal_case_name = self._to_pascal_case_compound_aware(page_name)  
# new: pascal_case_name = NameStandardizer.to_pascal_case(page_name)
```

## Benefits

1. **Consistency**: All generators produce identical naming for identical inputs
2. **Compound Words**: Automatic recognition of compound words like "testcenter" → "TestCenter"
3. **Maintainability**: Single source of truth for name transformations  
4. **Testing**: Comprehensive test coverage ensures reliability
5. **Backward Compatible**: Improves existing naming while maintaining compatibility

## Compound Word Recognition

The standardizer automatically handles compound words:

```python
# Compound word examples
NameStandardizer.to_pascal_case("testcenter")    # "TestCenter" (not "Testcenter")
NameStandardizer.to_pascal_case("gamecenter")    # "GameCenter" (not "Gamecenter") 
NameStandardizer.to_pascal_case("playarea")      # "PlayArea" (not "Playarea")
NameStandardizer.to_pascal_case("navbar")        # "NavBar" (not "Navbar")
NameStandardizer.to_pascal_case("checkbox")      # "CheckBox" (not "Checkbox")
```

This solves the core issues mentioned in the implementation plan:
- ❌ `useTestcenterActions` vs `useTestCenterActions` 
- ❌ `PlayareaPageWrapper` vs `PlayAreaPageWrapper`
- ✅ **Consistent naming across all modules**