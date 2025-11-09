# Configuration-Driven Backend Generator v2

A clean, modular, and fully configurable backend generator that generates complete TypeScript backends from JSON configuration following Single Responsibility Principle (SRP).

## Overview

This generator represents a complete architectural rewrite of the legacy backend generator, eliminating over 120 hardcoded handler mappings and complex inheritance chains in favor of a clean, configuration-driven approach. Each module has a single, well-defined responsibility, making the system maintainable, testable, and extensible.

## Architecture

```
backend-generator-v2/
├── config/                          # Configuration files
├── core/                           # Core modules (SRP)  
├── generators/                     # Specialized generators (SRP)
├── main.py                        # Main orchestrator
├── run.py                         # Quick CLI runner
├── test_config.json              # Test configuration
└── README.md                     # This file
```

## Configuration System

The generator's intelligence resides in four JSON configuration files, making it completely configuration-driven with zero hardcoded values.

### handler_mappings.json
**Purpose**: Maps route handlers to their Express.js parameters

**Structure**:
- **exact_mappings**: Direct handler-to-parameter mappings for specific cases
- **pattern_rules**: Regex-based rules for common patterns (e.g., methods ending in `ById`)
- **special_cases**: Complex pattern matching for edge cases

**Benefits**: Eliminates 120+ hardcoded handler mappings from the legacy system. Non-developers can modify handler behavior by editing JSON.

### entity_overrides.json  
**Purpose**: Defines special handling for specific entities and properties

**Structure**:
- **entity_overrides**: Special naming and behavior for entities like `auth` and `learningpath`
- **property_mappings**: Database column mappings and JSON parsing rules
- **parameter_mappings**: URL parameter to database column translations
- **standard_crud_methods**: Template for default CRUD operations
- **common_endpoints**: Default REST endpoint patterns

**Benefits**: Centralizes all special-case logic that was scattered across multiple modules in the legacy system.

### method_templates.json
**Purpose**: Contains TypeScript templates for generating service methods

**Structure**:
- **method_templates**: Pattern-based templates for common method types (getById, create, update, delete)
- **specialized_methods**: Entity-specific method implementations (auth.login, puzzle.solvePuzzle)
- **format_method_template**: Template for entity response formatting methods

**Benefits**: Replaces 9+ method generator modules with configurable templates. New method patterns can be added without code changes.

### infrastructure_templates.json
**Purpose**: Contains templates for all infrastructure files

**Structure**:
- **database**: Connection pooling and error recovery template
- **auth_middleware**: JWT authentication with detailed logging
- **validation_middleware**: Request validation patterns
- **app_template**: Main Express app with dynamic route registration
- **route_template**: Route handler patterns
- **model_template**: TypeScript interface templates
- **service_template**: Service class structure

**Benefits**: Consolidates all file generation templates in one location. Infrastructure improvements can be made by updating templates rather than code.

## Core Modules

### ConfigLoader (`core/config_loader.py`)
**Responsibility**: Configuration file management and validation

**Key Methods**:
- `load_config()`: Loads individual configuration files with caching
- `load_all_configs()`: Loads all required configuration files at once
- `validate_config()`: Validates configuration structure and required fields
- `get_handler_parameters()`: Resolves handler parameters using mappings and patterns
- `clear_cache()`: Clears configuration cache for fresh reloads

**Features**:
- JSON schema validation for each configuration type
- Intelligent caching to avoid repeated file I/O
- Pattern-based parameter resolution with fallbacks
- Comprehensive error handling with detailed logging

**Design Philosophy**: Single source of truth for all configuration data. Isolates configuration concerns from generation logic.

### TemplateEngine (`core/template_engine.py`)
**Responsibility**: Template processing and variable substitution

**Key Methods**:
- `process_template()`: Handles variable substitution in templates
- `get_method_template()`: Finds appropriate template for service methods
- `generate_method_from_template()`: Creates service methods from templates
- `build_format_method()`: Generates entity-specific formatting methods
- `apply_entity_overrides()`: Applies special entity configurations
- `ensure_standard_endpoints()`: Adds missing CRUD endpoints
- `get_standard_crud_methods()`: Returns standard method names for entities

**Features**:
- Supports both `{variable}` and `{{variable}}` template formats
- Pattern-based template selection with specialized overrides
- Intelligent property mapping with JSON parsing support
- Automatic CRUD method and endpoint generation

**Design Philosophy**: Centralizes all template processing logic. Separates template concerns from file generation and configuration management.

### FileWriter (`core/file_writer.py`)
**Responsibility**: File system operations and output management

**Key Methods**:
- `write_file()`: Writes content to files with directory creation
- `ensure_directory()`: Creates directories as needed
- `get_written_files()`: Returns list of files that were created
- `get_stats()`: Provides generation statistics
- `clear_written_files()`: Resets the written files list

**Helper Class: FilePathHelper**:
- `to_camel_case()`: Converts snake_case to camelCase
- `to_pascal_case()`: Converts snake_case to PascalCase  
- `get_model_path()`: Standardized model file paths
- `get_service_path()`: Standardized service file paths
- `get_routes_path()`: Standardized route file paths
- `get_infrastructure_paths()`: Infrastructure file path mappings

**Features**:
- Dry-run mode for preview without file creation
- Force overwrite option for existing files
- Comprehensive file operation logging
- Consistent path generation across all generators

**Design Philosophy**: Isolates all file I/O concerns. Provides consistent file handling with proper error management and logging.

## Generator Modules

### ModelGenerator (`generators/model_generator.py`)
**Responsibility**: TypeScript model and interface generation

**Key Methods**:
- `generate_model()`: Creates complete model files for entities
- `_build_model_content()`: Constructs TypeScript interface content
- `_get_auth_model_content()`: Provides specialized auth model definitions

**Generated Content**:
- Entity response interfaces with all properties
- Create request interfaces (excludes auto-generated fields)
- Update request interfaces (all fields optional)
- Specialized models for authentication entities

**Features**:
- Property type mapping from JSON schema to TypeScript
- Automatic exclusion of system fields from request interfaces
- Special handling for authentication-related models
- Consistent interface naming conventions

**Design Philosophy**: Single responsibility for model generation. No knowledge of services or routes, only focuses on TypeScript interface creation.

### ServiceGenerator (`generators/service_generator.py`)  
**Responsibility**: TypeScript service class generation

**Key Methods**:
- `generate_service()`: Creates complete service files with all methods
- `_generate_service_method()`: Creates individual service methods using templates
- `_build_service_content()`: Assembles complete service class structure

**Generated Content**:
- Complete service classes with database integration
- Standard CRUD operations for all entities
- Custom business logic methods based on configuration
- Entity-specific formatting methods
- Database query implementations with error handling

**Features**:
- Template-based method generation using configuration
- Automatic inclusion of standard CRUD operations
- Custom method implementations for specialized entities
- Database connection management and query execution
- Response formatting with property mapping

**Design Philosophy**: Focuses solely on service layer generation. Delegates to TemplateEngine for method creation and uses ConfigLoader for specialized behavior.

### RouteGenerator (`generators/route_generator.py`)
**Responsibility**: Express.js route file generation  

**Key Methods**:
- `generate_routes()`: Creates complete route files with all endpoints
- `_generate_route_method()`: Creates individual route handlers
- `_build_routes_content()`: Assembles complete route file structure

**Generated Content**:
- Express.js route definitions with proper HTTP methods
- Authentication middleware integration
- Parameter extraction and validation
- Service method invocation with error handling
- Consistent response formatting

**Features**:
- Dynamic parameter resolution using ConfigLoader
- Authentication requirement enforcement
- Standard CRUD endpoint generation
- Custom endpoint support based on configuration
- Proper error handling and response formatting

**Design Philosophy**: Specialized for Express.js route generation. Collaborates with ConfigLoader for parameter mapping and TemplateEngine for endpoint standardization.

### InfrastructureGenerator (`generators/infrastructure_generator.py`)
**Responsibility**: Infrastructure file generation (database, middleware, app.ts)

**Key Methods**:
- `generate_infrastructure()`: Creates all infrastructure files
- `generate_app_file()`: Creates main Express app with dynamic route registration  
- `_generate_infrastructure_file()`: Creates individual infrastructure files

**Generated Content**:
- Database connection classes with pooling and error recovery
- JWT authentication middleware with detailed logging
- Request validation middleware
- Main Express application with automatic route registration
- Comprehensive error handling and logging

**Features**:
- Database connection pooling with automatic retry
- JWT token validation with user context injection
- Request/response logging for debugging
- Dynamic route registration from entity configuration
- Production-ready error handling patterns

**Design Philosophy**: Focuses on foundational infrastructure. Creates the backbone that supports all generated entities without coupling to specific business logic.

## Main Orchestrator

### BackendGeneratorOrchestrator (`main.py`)
**Responsibility**: Coordinates all modules and manages generation workflow

**Key Methods**:
- `generate_backend()`: Main entry point for complete backend generation
- `_generate_entity()`: Orchestrates model, service, and route generation for single entities
- `_validate_all_configs()`: Ensures all configurations are valid before generation
- `_preview_generation()`: Provides dry-run preview of what would be generated
- `_report_generation_results()`: Comprehensive reporting of generation outcomes

**Orchestration Flow**:
1. **Initialization**: Creates and configures all module instances
2. **Configuration**: Loads and validates all configuration files
3. **Infrastructure**: Generates foundational files first
4. **Entities**: Processes each entity through model→service→route pipeline
5. **Integration**: Creates main app.ts with dynamic route registration
6. **Reporting**: Provides detailed success/failure statistics

**Features**:
- Comprehensive error handling with rollback capabilities
- Detailed logging throughout the generation process
- Configuration validation before generation begins
- Progress tracking and reporting
- Dry-run mode for safe preview operations

**Design Philosophy**: Pure orchestration with no generation logic. Delegates all specific tasks to appropriate modules while maintaining overall workflow integrity.

## Key Design Principles

### Single Responsibility Principle
Each module has exactly one reason to change:
- **ConfigLoader**: Configuration management changes
- **TemplateEngine**: Template processing changes  
- **FileWriter**: File I/O requirement changes
- **ModelGenerator**: TypeScript model changes
- **ServiceGenerator**: Service layer changes
- **RouteGenerator**: Route handling changes
- **InfrastructureGenerator**: Infrastructure changes
- **Orchestrator**: Workflow changes

### Separation of Concerns
Clear boundaries between different aspects:
- **Configuration** is separate from **Generation**
- **Generation** is separate from **File I/O**
- **Template Processing** is separate from **File Writing**
- **Entity Logic** is separate from **Infrastructure Logic**

### Dependency Inversion
Higher-level modules depend on abstractions:
- Orchestrator depends on generator interfaces, not implementations
- Generators depend on core services, not concrete implementations
- All modules depend on configuration contracts, not specific formats

### Open/Closed Principle
The system is open for extension but closed for modification:
- New generators can be added without changing existing code
- New templates can be added without code changes
- New configuration patterns can be added without refactoring
- New entity types can be supported through configuration alone

## Advantages Over Legacy System

### Maintainability
- **Before**: 120+ hardcoded mappings scattered across 9+ files
- **After**: All mappings in JSON configuration files
- **Benefit**: Changes require JSON edits, not code modifications

### Testability  
- **Before**: Monolithic classes with mixed responsibilities
- **After**: Single-responsibility modules with clear interfaces
- **Benefit**: Each module can be unit tested independently

### Extensibility
- **Before**: Adding features required code changes across multiple files
- **After**: Most features can be added through configuration alone
- **Benefit**: Non-developers can extend functionality

### Understandability
- **Before**: Complex inheritance chains and mixed concerns
- **After**: Clear module boundaries with single responsibilities
- **Benefit**: Easier onboarding and reduced cognitive load

### Reliability
- **Before**: Silent failures and unclear error handling
- **After**: Comprehensive validation and detailed error reporting  
- **Benefit**: Issues are caught early with clear diagnostics

## Usage Scenarios

### Development Workflow
Use `python run.py dry-run` to preview changes before generation. Review the output to ensure all expected files would be created with correct naming.

### Production Deployment
Use `python run.py existing` to generate from the established configuration. The force overwrite ensures clean regeneration of all files.

### Testing and Validation
Use `python run.py test` with the included test configuration to validate the generator works correctly in isolation.

### Custom Configurations  
Use `python main.py custom-config.json` with full command-line options for specialized generation scenarios.

## Extension Points

### Adding New Entity Types
Create entries in the entities configuration file. The generator automatically creates models, services, and routes based on the configuration.

### Adding New Method Patterns
Add patterns to `method_templates.json`. New service methods matching the pattern will automatically use the template.

### Adding New Infrastructure
Add templates to `infrastructure_templates.json`. New infrastructure files can be generated alongside existing ones.

### Adding New Generators
Create new generator modules following the established pattern. The orchestrator can be extended to include additional generation steps.

This architecture provides a solid foundation for backend generation that can evolve with changing requirements while maintaining clean separation of concerns and high maintainability.