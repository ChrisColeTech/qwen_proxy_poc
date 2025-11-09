# Template Conversion Documentation

## Source Directory
/Users/chris/Projects/llm-api-vault-v2/frontend/app

## Output Directory  
/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/templates/static

## Placeholder Mappings
The following placeholders are used in the templates:

- `\bUser\b` → `{entity_name}`
- `\buser\b` → `{entity_name_lower}`
- `\bUSER\b` → `{ENTITY_NAME_UPPER}`
- `\busers\b` → `{endpoint_name}`
- `user-management` → `{domain}`
- `authentication` → `{domain}`
- `gameplay` → `{domain}`
- `puzzles` → `{domain}`
- `learning` → `{domain}`
- `chess-theory` → `{domain}`
- `\buserService\b` → `{endpoint_name}Service`
- `\bUserService\b` → `{entity_name}Service`
- `\buseUser\b` → `use{entity_name}`
- `\buseAuth\b` → `use{entity_name}`
- `/api/users` → `/api/{endpoint_name}`
- `/api/auth` → `/api/{endpoint_name}`
- `from [\'"]../types/user[\'"]` → `from '../types/{domain}/{endpoint_name}'`
- `from [\'"]../services/userService[\'"]` → `from '../services/{domain}/{endpoint_name}Service'`
- `from [\'"]../hooks/useUser[\'"]` → `from '../hooks/{domain}/use{entity_name}'`

## Usage
To use these templates with the frontend generator:

1. Place the template files in the appropriate template directories
2. Run the frontend generator with your entity configuration
3. The generator will replace placeholders with actual values

## Placeholder Variables
- `{entity_name}` - Pascal case entity name (e.g., "User", "Product")
- `{entity_name_lower}` - Lower case entity name (e.g., "user", "product")  
- `{ENTITY_NAME_UPPER}` - Upper case entity name (e.g., "USER", "PRODUCT")
- `{endpoint_name}` - API endpoint name (e.g., "users", "products")
- `{domain}` - Domain/category name (e.g., "user-management", "inventory")
