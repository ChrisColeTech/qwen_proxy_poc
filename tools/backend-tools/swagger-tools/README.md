# Swagger Documentation Generator

Automatically generates comprehensive OpenAPI/Swagger documentation for your TypeScript Express routes.

## Features

- 🔍 **Route Parser**: Analyzes TypeScript route files and extracts endpoint information
- 📝 **Documentation Generator**: Creates complete Swagger/OpenAPI 3.0 documentation
- 🔄 **Backend Integration**: Updates your backend's Swagger configuration automatically
- 📊 **Detailed Analysis**: Provides comprehensive route breakdown and statistics

## Usage

### Basic Usage

```bash
# Generate documentation for all routes
python3 main.py

# Generate and update backend configuration
python3 main.py --update-backend

# Custom paths
python3 main.py --routes-dir /path/to/routes --backend-path /path/to/backend
```

### Command Line Options

- `--routes-dir`: Directory containing TypeScript route files (default: backend-v2/src/routes)
- `--backend-path`: Path to backend directory (default: backend-v2)
- `--output-dir`: Output directory for generated files (default: current directory)
- `--update-backend`: Update backend swagger configuration with generated schemas

### Generated Files

1. **`generated_swagger.json`**: Complete OpenAPI 3.0 specification
2. **`route_documentation.ts`**: TypeScript file with JSDoc comments for all routes
3. **`generation_summary.json`**: Detailed statistics and metadata

## Components

### 1. Route Parser (`route_parser.py`)

Analyzes TypeScript Express route files and extracts:
- HTTP methods (GET, POST, PUT, DELETE, etc.)
- Route paths with parameters
- Handler function information
- Path parameters and their types

### 2. Swagger Generator (`swagger_generator.py`)

Generates comprehensive OpenAPI documentation including:
- Complete endpoint specifications
- Request/response schemas
- Authentication requirements
- Parameter definitions
- Error responses

### 3. Main Tool (`main.py`)

Orchestrates the entire process:
- Parses all route files
- Generates documentation
- Updates backend configuration
- Provides detailed reporting

## Route Analysis

The tool automatically recognizes and documents:

- **Authentication routes**: Login, register, logout, token verification
- **User management**: Profile, settings, preferences
- **Chess features**: Puzzles, games, analysis
- **Learning content**: Tutorials, paths, achievements
- **Statistics**: Performance metrics and progress tracking

## Integration

### With Backend

The tool can automatically update your backend's Swagger configuration:

```bash
python3 main.py --update-backend
```

This updates the `swaggerOptions` in your `app.ts` file with:
- Generated schemas
- Route tags
- Enhanced configuration

### With Frontend

Use the generated `swagger.json` for:
- API client generation
- Type definitions
- Integration testing

## Example Output

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Chessboard Vanilla V2 API",
    "version": "2.0.0",
    "description": "Comprehensive RESTful API for chess features"
  },
  "paths": {
    "/api/auth/login": {
      "post": {
        "tags": ["Authentication"],
        "summary": "User login",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          }
        }
      }
    }
  }
}
```

## Development

### Adding New Route Types

1. Update `route_info` in `SwaggerDocGenerator`
2. Add specific handlers in `_generate_summary()` and `_generate_description()`
3. Create appropriate schemas in `_get_common_schemas()`

### Extending Parser

Modify `TypeScriptRouteParser` to handle:
- New route patterns
- Additional metadata extraction
- Custom parameter types

## Requirements

- Python 3.6+
- Access to TypeScript route files
- Write permissions for output directory

## Notes

- Supports Express.js router patterns
- Handles path parameters (`:id` → `{id}`)
- Automatically determines authentication requirements
- Generates appropriate HTTP status codes
- Creates comprehensive error responses

## Troubleshooting

### Common Issues

1. **Routes not detected**: Check TypeScript syntax in route files
2. **Missing endpoints**: Verify route file naming conventions
3. **Backend update failed**: Ensure app.ts has proper swagger configuration structure

### Debug Mode

Run with verbose output:
```bash
python3 route_parser.py  # Test route parsing only
python3 swagger_generator.py  # Test documentation generation
```