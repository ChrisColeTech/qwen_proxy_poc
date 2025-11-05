# Changelog

All notable changes to the Provider Router project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-31

### Major Release: Database-Driven Configuration

This release represents a major architectural change, moving from hardcoded environment variable configuration to a fully database-driven provider management system. While backward compatible, users are encouraged to migrate to the new system.

### Added

#### Database-Driven Configuration System
- **Provider Management**: Store provider configurations in SQLite database
- **Multiple Instances**: Support multiple instances of the same provider type
- **Runtime Configuration**: Change provider settings without server restart
- **Dynamic Loading**: Load and reload providers from database on-demand
- **Priority-Based Routing**: Configure provider priority for fallback routing
- **Configuration Validation**: Validate provider configuration on creation/update

#### Database Schema (v3)
- **providers table**: Store provider instances with metadata
- **provider_configs table**: Key-value configuration storage per provider
- **models table**: Define available models
- **provider_models table**: Map models to providers with default model support
- **Indexes**: Performance indexes on all foreign keys and frequently queried columns
- **Foreign Key Constraints**: Cascade delete for data integrity

#### Provider Management API
- `GET /v1/providers` - List all providers with filtering
- `POST /v1/providers` - Create new provider
- `GET /v1/providers/:id` - Get provider details
- `PUT /v1/providers/:id` - Update provider
- `DELETE /v1/providers/:id` - Delete provider
- `POST /v1/providers/:id/enable` - Enable provider
- `POST /v1/providers/:id/disable` - Disable provider
- `POST /v1/providers/:id/test` - Test provider connectivity
- `POST /v1/providers/:id/reload` - Reload provider configuration
- `GET /v1/providers/:id/config` - Get provider configuration
- `PUT /v1/providers/:id/config` - Update provider configuration (bulk)
- `PATCH /v1/providers/:id/config/:key` - Update single config key
- `DELETE /v1/providers/:id/config/:key` - Delete config key

#### Model Management API
- `GET /v1/models` - List all models
- `POST /v1/models` - Create new model
- `GET /v1/models/:id` - Get model details
- `PUT /v1/models/:id` - Update model
- `DELETE /v1/models/:id` - Delete model
- `GET /v1/providers/:id/models` - Get models for provider
- `POST /v1/providers/:id/models` - Link model to provider
- `DELETE /v1/providers/:id/models/:modelId` - Unlink model from provider
- `PUT /v1/providers/:id/models/:modelId/default` - Set default model

#### Provider Health API
- `GET /v1/providers/health` - Check health of all registered providers
- `POST /v1/providers/:id/test` - Test specific provider connectivity
- Health check returns response time and status details

#### Database Services Layer
- **ProviderService**: CRUD operations for providers table
  - Create, read, update, delete providers
  - Filter by type, enabled status
  - Sort by priority
- **ProviderConfigService**: Manage provider configurations
  - Get/set configuration key-value pairs
  - Bulk configuration updates
  - Sensitive data masking
  - Build complete config objects
- **ModelService**: CRUD operations for models table
  - Create, read, update, delete models
  - Filter by capabilities
- **ProviderModelService**: Manage provider-model mappings
  - Link/unlink models to providers
  - Set default model per provider
  - Get models for provider

#### Provider Factory & Registry
- **ProviderFactory**: Create provider instances from database configuration
  - Type-to-class mapping
  - Configuration validation
  - Instance creation with error handling
- **ProviderRegistry**: Manage loaded provider instances
  - In-memory registry of active providers
  - Load/reload providers on-demand
  - Register/unregister providers
  - Get providers by ID or type

#### Provider Types System
- **Provider Type Definitions**: Metadata for each provider type
  - Required configuration keys
  - Optional configuration keys
  - Supported features (streaming, tools, vision)
  - Validation rules

#### Enhanced CLI Commands

##### Provider Management
- `provider-cli provider list` - List all providers with details
- `provider-cli provider add` - Create new provider interactively
- `provider-cli provider edit <id>` - Update provider settings
- `provider-cli provider remove <id>` - Delete provider with confirmation
- `provider-cli provider enable <id>` - Enable provider
- `provider-cli provider disable <id>` - Disable provider
- `provider-cli provider test <id>` - Test provider connectivity
- `provider-cli provider reload <id>` - Reload provider from database
- `provider-cli provider config <id>` - View provider configuration

##### Model Management
- `provider-cli model list` - List all models
- `provider-cli model add` - Create new model
- `provider-cli model link <provider-id> <model-id>` - Link model to provider
- `provider-cli model unlink <provider-id> <model-id>` - Unlink model

##### Migration
- `provider-cli migrate` - Migrate from .env to database
  - Auto-detect .env configuration
  - Create database records
  - Migrate provider configs
  - Create default models
  - Link models to providers
  - Set active provider
  - Create backup before migration
  - Dry-run mode support

#### Controllers Layer
- **ProvidersController**: Business logic for provider management
  - Provider validation
  - Provider reload after config changes
  - Error handling
- **ModelsController**: Business logic for model management
  - Model validation
  - Provider-model linking

#### Validation Middleware
- **Request Validation**: Validate API requests
  - Provider type validation
  - Configuration key validation
  - Required field validation
  - Format validation (URLs, etc.)

#### Configuration Features
- **Sensitive Data Protection**: Mark API keys as sensitive
- **Configuration Masking**: Mask sensitive values in API responses (show as ***)
- **Configuration History**: Track configuration changes via updated_at timestamps
- **Bulk Updates**: Update multiple configuration keys at once
- **Validation**: Validate configuration values before saving

#### Documentation
- **Architecture Documentation**: Complete system architecture overview
  - Database schema diagrams (ERD)
  - Component interaction diagrams
  - Data flow diagrams
  - Provider lifecycle documentation
  - Design decisions and rationale
- **API Reference**: Complete API documentation with examples
  - All endpoints documented
  - Request/response examples
  - Error codes and handling
  - curl examples for all operations
- **User Guides**: Step-by-step guides for common tasks
  - Migration guide from .env to database
  - CLI command reference with examples
  - API usage examples with code
- **Development Guide**: Developer documentation
  - Adding new provider types
  - Provider interface requirements
  - Testing guidelines
  - Best practices
- **README Updates**: Updated main README with new features
  - Database configuration section
  - Enhanced CLI documentation
  - API endpoint reference
  - Migration instructions
  - Links to detailed documentation

### Changed

#### Breaking Changes

**Note**: While backward compatible, the following changes represent the new recommended approach:

- **Configuration Method**: Environment variables deprecated in favor of database configuration
  - `.env` provider configs still work but trigger deprecation warnings
  - Users should migrate using `provider-cli migrate`
  - Future versions may remove .env provider support

#### Provider Management
- **Provider Initialization**: Providers now loaded from database instead of hardcoded config
  - Environment variables still supported as fallback
  - Database providers take precedence over .env config
- **Provider Models**: Models now defined in database instead of hardcoded arrays
  - Qwen Direct provider no longer has hardcoded model list
  - Models can be added/removed dynamically

#### Backward Compatibility
- **Legacy Mode**: Full backward compatibility maintained
  - Existing .env configurations continue to work
  - Server falls back to .env if no database providers exist
  - No breaking changes to existing deployments
- **Migration Support**: Automatic migration from .env to database
  - `provider-cli migrate` command
  - Detects and converts .env configurations
  - Preserves all existing settings

#### CLI Commands
- **List Command**: Enhanced with more details
  - Shows enabled/disabled status
  - Shows priority
  - Shows provider type
- **Set Command**: Now uses provider ID instead of type
  - Old: `provider-cli set lm-studio`
  - New: `provider-cli set lm-studio-home`
- **Test Command**: Enhanced with more health details
  - Shows response time
  - Lists available models
  - Shows connection status

#### Database Changes
- **Schema Version**: Upgraded to v3
  - Added providers table
  - Added provider_configs table
  - Added models table
  - Added provider_models table
  - Added indexes for performance
- **Migration System**: Enhanced with v3 migration
  - Automatic schema upgrade on startup
  - Safe migration with rollback support

### Deprecated

- **Environment Variable Provider Configuration**: Deprecated but still supported
  - `DEFAULT_PROVIDER` - Use database active_provider setting
  - `LM_STUDIO_BASE_URL` - Use database provider config
  - `LM_STUDIO_DEFAULT_MODEL` - Use database provider config
  - `QWEN_PROXY_BASE_URL` - Use database provider config
  - `QWEN_API_KEY` - Use database provider config (marked sensitive)
  - `QWEN_BASE_URL` - Use database provider config

**Migration Path**: Run `provider-cli migrate` to migrate to database configuration

### Fixed

- **Provider Switching**: Fixed issue where switching providers required server restart
  - Providers now loaded on-demand from database
  - Provider registry reloads configurations dynamically
- **Configuration Updates**: Fixed issue where config changes required code deployment
  - Configuration now stored in database
  - Updates applied immediately via reload endpoint
- **Multiple Instances**: Fixed limitation of one instance per provider type
  - Database allows multiple provider instances
  - Each instance has unique ID and configuration

### Security

- **Sensitive Data Protection**: API keys and passwords marked as sensitive
  - Masked in API responses (shown as ***)
  - Logged as [SENSITIVE] in logs
  - is_sensitive flag in database
- **Input Validation**: All API inputs validated before processing
  - Provider type whitelist
  - URL format validation
  - Required field validation
- **SQL Injection Prevention**: All queries use parameterized statements
  - better-sqlite3 handles parameter binding
  - No string concatenation in queries

### Performance

- **Database Indexes**: Added indexes for fast lookups
  - Provider type, enabled status, priority
  - Provider configs by provider_id
  - Provider models by provider_id and model_id
- **Provider Instance Caching**: Providers cached in memory registry
  - Avoid repeated instantiation
  - Fast O(1) lookup by ID
- **WAL Mode**: SQLite Write-Ahead Logging enabled
  - Better concurrency (readers don't block writers)
  - Faster writes
- **Connection Pooling**: Single database connection reused
  - No connection overhead per request

### Testing

- **Database Tests**: Comprehensive database layer tests
  - ProviderService CRUD operations
  - ProviderConfigService get/set/mask
  - ModelService CRUD operations
  - ProviderModelService linking/unlinking
- **API Tests**: Integration tests for all new endpoints
  - Provider management endpoints
  - Model management endpoints
  - Configuration endpoints
- **CLI Tests**: Tests for all new CLI commands
  - Provider commands
  - Model commands
  - Migration command
- **Migration Tests**: Tests for .env to database migration
  - Auto-detection
  - Data conversion
  - Integrity validation

## [1.0.0] - 2025-01-30

### Initial Release

#### Core Features
- **OpenAI-Compatible API**: Chat completions endpoint
- **Multiple Provider Support**: LM Studio, Qwen Proxy, Qwen Direct
- **Provider Abstraction**: Unified interface for all providers
- **Request Routing**: Route requests to configured provider
- **Environment Configuration**: Configure providers via .env file

#### Providers
- **LM Studio Provider**: Support for local LM Studio instances
  - Chat completions
  - Model listing
  - Streaming support
- **Qwen Proxy Provider**: Support for Qwen proxy server
  - Chat completions
  - Tool calling with XML transformation
  - Streaming support
- **Qwen Direct Provider**: Direct access to Qwen API
  - Chat completions
  - Session management
  - Streaming support

#### Database & Logging
- **SQLite Database**: Local database for settings and logs
- **Settings Service**: Persist settings across restarts
- **Request Logging**: Log all requests and responses
- **Response Logging**: Capture full response data

#### CLI Tool
- **Basic Commands**: Status, list, set, test
- **Request History**: View past requests
- **Statistics**: Usage analytics
- **Provider Testing**: Test provider connectivity

#### API Endpoints
- `POST /v1/chat/completions` - OpenAI-compatible chat completions
- `GET /v1/models` - List models from active provider
- `GET /health` - Server health check

#### Testing
- **Integration Tests**: Comprehensive test suite
  - Database tests
  - CLI tests
  - Provider routing tests
- **Test Database**: Separate test database for safe testing
- **Test Coverage**: >80% code coverage

## Migration Guide

### Migrating from 1.x to 2.0

#### Step 1: Backup Configuration

```bash
cp .env .env.backup
```

#### Step 2: Update to 2.0

```bash
git pull
npm install
```

#### Step 3: Run Migration

```bash
npm start
provider-cli migrate
```

#### Step 4: Verify Migration

```bash
provider-cli provider list
provider-cli status
```

#### Step 5: Clean Up (Optional)

Remove provider configs from `.env` (keep server settings):

```bash
# Keep:
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Remove:
# DEFAULT_PROVIDER=lm-studio
# LM_STUDIO_BASE_URL=...
# etc.
```

## Version History

- **2.0.0** (2025-01-31) - Database-driven configuration (current)
- **1.0.0** (2025-01-30) - Initial release

## Deprecation Timeline

### Immediate (2.0.0)
- Environment variable provider configuration deprecated
- Migration guide and tools provided
- Full backward compatibility maintained

### Future (3.0.0 - TBD)
- Environment variable provider configuration removed
- Database configuration required
- Migration command removed (assumed complete)

## Support

For issues or questions:

1. Check documentation in `/docs` directory
2. Review troubleshooting guides
3. Check existing GitHub issues
4. Open new GitHub issue with details

## Links

- [Repository](https://github.com/your-org/provider-router)
- [Documentation](/docs/)
- [Migration Guide](/docs/guides/migrating-from-env-to-database.md)
- [API Reference](/docs/api/provider-management-api.md)
- [CLI Guide](/docs/guides/managing-providers-via-cli.md)
