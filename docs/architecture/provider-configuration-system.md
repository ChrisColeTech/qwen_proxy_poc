# Provider Configuration System Architecture

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Component Interactions](#component-interactions)
- [Data Flow](#data-flow)
- [Provider Lifecycle](#provider-lifecycle)
- [Design Decisions](#design-decisions)
- [Performance Considerations](#performance-considerations)
- [Security Model](#security-model)

## Overview

The Provider Configuration System is a database-driven architecture that enables dynamic management of LLM provider configurations without code deployment. It replaces the previous hardcoded configuration approach with a flexible, runtime-configurable system.

### Key Features

- **Dynamic Provider Management**: Add, modify, and remove providers at runtime
- **Multiple Provider Instances**: Support multiple instances of the same provider type
- **Flexible Configuration**: Store arbitrary key-value configuration per provider
- **Model Management**: Define and map models to providers dynamically
- **Priority-Based Routing**: Route requests based on provider priority
- **Runtime Reloading**: Reload provider configurations without server restart

### Architecture Goals

1. **Flexibility**: Easy to add new providers and configurations
2. **Scalability**: Support multiple instances and concurrent access
3. **Maintainability**: Clean separation of concerns
4. **Security**: Protect sensitive configuration data
5. **Performance**: Fast provider lookup and configuration access

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Test Client, CLI, API Consumers)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Providers  │  │    Models    │  │   Provider   │     │
│  │     API      │  │     API      │  │   Configs    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Controller Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   Providers      │  │    Models        │                │
│  │   Controller     │  │    Controller    │                │
│  └──────────────────┘  └──────────────────┘                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Provider   │  │    Model     │  │   Provider   │     │
│  │   Service    │  │   Service    │  │    Config    │     │
│  │              │  │              │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────────────────────────────────────────┐     │
│  │          Provider Model Service                   │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Provider Layer                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │            Provider Factory                       │      │
│  │  (Creates provider instances from DB config)     │      │
│  └──────────────────┬───────────────────────────────┘      │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────┐      │
│  │            Provider Registry                      │      │
│  │  (Manages loaded provider instances)             │      │
│  └──────────────────┬───────────────────────────────┘      │
│                     │                                        │
│  ┌─────────┬────────┴────────┬────────────┐               │
│  │         │                 │            │               │
│  ▼         ▼                 ▼            ▼               │
│  LM Studio  Qwen Proxy  Qwen Direct  (Future)            │
│  Provider   Provider    Provider     Providers            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  providers   │  │    models    │  │   provider   │     │
│  │    table     │  │    table     │  │    configs   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────────────────────────────────────────┐     │
│  │          provider_models table                    │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

#### API Layer
- **Routes**: Express.js routes handling HTTP requests
- **Validation**: Request validation middleware
- **Error Handling**: Centralized error handling

#### Controller Layer
- **ProvidersController**: Business logic for provider management
- **ModelsController**: Business logic for model management
- **Validation**: Input validation and sanitization

#### Service Layer
- **ProviderService**: CRUD operations on providers table
- **ProviderConfigService**: Manage provider configurations
- **ModelService**: CRUD operations on models table
- **ProviderModelService**: Manage provider-model mappings

#### Provider Layer
- **ProviderFactory**: Creates provider instances from database configuration
- **ProviderRegistry**: Manages loaded provider instances
- **Provider Implementations**: LM Studio, Qwen Proxy, Qwen Direct providers

#### Database Layer
- **SQLite Database**: Stores all configuration data
- **Schema**: Tables for providers, models, configs, and mappings

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       providers                              │
├─────────────────────────────────────────────────────────────┤
│ id (TEXT, PK)              - Provider unique ID             │
│ name (TEXT, UNIQUE)        - Display name                   │
│ type (TEXT)                - Provider type                  │
│ enabled (BOOLEAN)          - Active status                  │
│ priority (INTEGER)         - Priority for routing           │
│ description (TEXT)         - User description               │
│ created_at (INTEGER)       - Creation timestamp             │
│ updated_at (INTEGER)       - Last update timestamp          │
└────────────┬────────────────────────────────────────────────┘
             │
             │ 1:N
             │
┌────────────▼────────────────────────────────────────────────┐
│                   provider_configs                           │
├─────────────────────────────────────────────────────────────┤
│ id (INTEGER, PK, AUTOINCREMENT)                             │
│ provider_id (TEXT, FK)     - References providers.id        │
│ key (TEXT)                 - Config key name                │
│ value (TEXT)               - Config value (JSON)            │
│ is_sensitive (BOOLEAN)     - Sensitive flag                 │
│ created_at (INTEGER)                                        │
│ updated_at (INTEGER)                                        │
│ UNIQUE(provider_id, key)                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        models                                │
├─────────────────────────────────────────────────────────────┤
│ id (TEXT, PK)              - Model unique ID                │
│ name (TEXT)                - Display name                   │
│ description (TEXT)         - Model description              │
│ capabilities (TEXT)        - JSON array of capabilities     │
│ created_at (INTEGER)                                        │
│ updated_at (INTEGER)                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             │ N:M
             │
┌────────────▼────────────────────────────────────────────────┐
│                   provider_models                            │
├─────────────────────────────────────────────────────────────┤
│ id (INTEGER, PK, AUTOINCREMENT)                             │
│ provider_id (TEXT, FK)     - References providers.id        │
│ model_id (TEXT, FK)        - References models.id           │
│ is_default (BOOLEAN)       - Default model flag             │
│ config (TEXT)              - Provider-specific config       │
│ created_at (INTEGER)                                        │
│ updated_at (INTEGER)                                        │
│ UNIQUE(provider_id, model_id)                               │
└─────────────────────────────────────────────────────────────┘
```

### Table Descriptions

#### providers Table

Stores provider instances.

**Columns**:
- `id`: Unique identifier (e.g., 'lm-studio-home', 'qwen-direct-1')
- `name`: Human-readable name (e.g., 'LM Studio Home')
- `type`: Provider type ('lm-studio', 'qwen-proxy', 'qwen-direct')
- `enabled`: Whether provider is active (0 or 1)
- `priority`: Priority for fallback routing (higher = higher priority)
- `description`: Optional user-provided description
- `created_at`, `updated_at`: Unix timestamps in milliseconds

**Indexes**:
- `idx_providers_type`: Fast lookup by type
- `idx_providers_enabled`: Fast lookup of enabled providers
- `idx_providers_priority`: Fast sorting by priority

#### provider_configs Table

Stores provider-specific configuration as key-value pairs.

**Columns**:
- `id`: Auto-incrementing primary key
- `provider_id`: Foreign key to providers table
- `key`: Configuration key (e.g., 'baseURL', 'apiKey', 'timeout')
- `value`: Configuration value (stored as JSON string)
- `is_sensitive`: Flag for sensitive values (API keys, passwords)
- `created_at`, `updated_at`: Unix timestamps in milliseconds

**Constraints**:
- UNIQUE(provider_id, key): One value per key per provider
- Foreign key cascade delete: Delete configs when provider deleted

**Indexes**:
- `idx_provider_configs_provider_id`: Fast lookup by provider

#### models Table

Stores model definitions.

**Columns**:
- `id`: Model identifier (e.g., 'qwen3-max', 'gpt-4')
- `name`: Display name
- `description`: Optional model description
- `capabilities`: JSON array of capabilities (e.g., ['chat', 'completion'])
- `created_at`, `updated_at`: Unix timestamps in milliseconds

#### provider_models Table

Maps models to providers (many-to-many relationship).

**Columns**:
- `id`: Auto-incrementing primary key
- `provider_id`: Foreign key to providers table
- `model_id`: Foreign key to models table
- `is_default`: Whether this is the default model for the provider
- `config`: Optional provider-specific model configuration (JSON)
- `created_at`, `updated_at`: Unix timestamps in milliseconds

**Constraints**:
- UNIQUE(provider_id, model_id): Each model linked once per provider
- Foreign key cascade delete: Delete mappings when provider or model deleted

**Indexes**:
- `idx_provider_models_provider_id`: Fast lookup by provider
- `idx_provider_models_model_id`: Fast lookup by model

## Component Interactions

### Provider Creation Flow

```
Client → POST /v1/providers
  │
  ▼
ProvidersController.create()
  │
  ├─→ Validate input
  ├─→ ProviderService.create()
  │     │
  │     ├─→ Insert into providers table
  │     └─→ Return provider record
  │
  ├─→ ProviderConfigService.setMultiple()
  │     │
  │     └─→ Insert into provider_configs table
  │
  ├─→ ProviderFactory.createFromDatabase()
  │     │
  │     ├─→ Load provider record
  │     ├─→ Load provider configs
  │     ├─→ Build config object
  │     ├─→ Instantiate provider class
  │     └─→ Return provider instance
  │
  ├─→ ProviderRegistry.register()
  │     │
  │     └─→ Add to registry map
  │
  └─→ Return response to client
```

### Request Routing Flow

```
Client → POST /v1/chat/completions
  │
  ▼
ProviderRouter.route()
  │
  ├─→ Extract model from request
  │
  ├─→ Get active provider
  │     │
  │     └─→ SettingsService.get('active_provider')
  │
  ├─→ ProviderRegistry.get(providerId)
  │     │
  │     └─→ Return provider instance from map
  │
  ├─→ provider.chatCompletion(request)
  │     │
  │     ├─→ Transform request for provider
  │     ├─→ Call provider API
  │     ├─→ Transform response
  │     └─→ Return response
  │
  └─→ Return response to client
```

### Provider Reload Flow

```
Client → POST /v1/providers/:id/reload
  │
  ▼
ProvidersController.reload()
  │
  ├─→ ProviderRegistry.unregister(id)
  │     │
  │     └─→ Remove from registry map
  │
  ├─→ ProviderFactory.createFromDatabase(id)
  │     │
  │     ├─→ Load latest config from database
  │     ├─→ Instantiate new provider instance
  │     └─→ Return provider instance
  │
  ├─→ ProviderRegistry.register(id, provider)
  │     │
  │     └─→ Add to registry map
  │
  └─→ Return response to client
```

## Data Flow

### Configuration Data Flow

```
┌─────────────────┐
│   CLI / API     │ Create/Update Provider
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │ Validate & Process
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Service      │ Write to Database
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Database     │ Persist Data
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Factory     │ Read & Instantiate
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Registry     │ Store Instance
│                 │
└─────────────────┘
```

### Request Processing Data Flow

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Router      │ Get Provider
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Registry     │ Lookup Instance
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Provider     │ Process Request
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Backend    │ Execute
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Provider     │ Transform Response
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Client Response│
└─────────────────┘
```

## Provider Lifecycle

### Lifecycle States

```
┌─────────────────┐
│    CREATED      │ Provider record exists in database
└────────┬────────┘
         │ load()
         ▼
┌─────────────────┐
│  INSTANTIATED   │ Provider instance created in memory
└────────┬────────┘
         │ register()
         ▼
┌─────────────────┐
│   REGISTERED    │ Provider in registry, ready to use
└────────┬────────┘
         │
         │ enable/disable
         │
         ├─────────────┐
         │             │
         ▼             ▼
┌──────────────┐  ┌──────────────┐
│   ENABLED    │  │   DISABLED   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       │ reload()        │
       ▼                 │
┌─────────────────┐      │
│   RELOADING     │      │
└────────┬────────┘      │
         │               │
         ▼               │
┌─────────────────┐      │
│   REGISTERED    │◄─────┘
└────────┬────────┘
         │ unregister()
         ▼
┌─────────────────┐
│  UNREGISTERED   │ Removed from registry
└────────┬────────┘
         │ delete()
         ▼
┌─────────────────┐
│    DELETED      │ Removed from database
└─────────────────┘
```

### Lifecycle Operations

#### Provider Creation
1. Validate input (type, name, required configs)
2. Create provider record in database
3. Create provider config records
4. Instantiate provider via factory
5. Register in provider registry
6. Run health check (optional)

#### Provider Update
1. Update provider record in database
2. Update provider config records
3. Trigger reload if provider is loaded

#### Provider Reload
1. Unregister from registry
2. Load latest config from database
3. Create new provider instance
4. Register in registry
5. Run health check (optional)

#### Provider Deletion
1. Unregister from registry
2. Delete from database (cascade deletes configs)

## Design Decisions

### Why SQLite?

**Decision**: Use SQLite for configuration storage

**Rationale**:
- Lightweight and embedded (no separate database server)
- ACID compliance for data integrity
- Fast for single-node deployments
- Easy backup (single file)
- Good for small to medium scale

**Trade-offs**:
- Limited concurrent writes (mitigated with WAL mode)
- Not suitable for distributed deployments
- No network access (must be local)

### Why Key-Value for Provider Configs?

**Decision**: Use key-value table for provider configs instead of JSON column

**Rationale**:
- Flexible schema per provider type
- Easy to query individual config keys
- Simple to update single values
- Clear sensitivity marking per key

**Trade-offs**:
- More database rows
- Requires assembly into config object
- Join queries needed

### Why Provider Registry?

**Decision**: Cache provider instances in memory registry

**Rationale**:
- Fast provider lookup (O(1) map access)
- Avoid repeated instantiation
- Enable runtime reload
- Single source of truth for loaded providers

**Trade-offs**:
- Memory overhead for provider instances
- Must keep registry in sync with database
- Not suitable for multi-process deployments

### Why Provider Factory?

**Decision**: Centralized provider instantiation

**Rationale**:
- Single responsibility for creating providers
- Type-to-class mapping in one place
- Easy to add new provider types
- Consistent validation and error handling

**Trade-offs**:
- Additional abstraction layer
- Factory must know about all provider types

## Performance Considerations

### Database Indexes

All foreign keys and frequently queried columns are indexed:

- `providers`: type, enabled, priority
- `provider_configs`: provider_id
- `provider_models`: provider_id, model_id

**Impact**: Fast lookups, minimal query time

### Provider Instance Caching

Provider instances are cached in the registry:

- Instantiation happens once at load time
- Runtime requests use cached instances
- Reload replaces cached instance

**Impact**: Minimal overhead per request

### WAL Mode

SQLite uses Write-Ahead Logging (WAL) mode:

- Better concurrency (readers don't block writers)
- Faster writes
- Atomic commits

**Impact**: Better performance under load

### Connection Pooling

Database connection is reused across requests:

- Single connection per process
- No connection overhead per request

**Impact**: Consistent low latency

## Security Model

### Sensitive Configuration

Sensitive values (API keys, passwords) are marked with `is_sensitive` flag.

**Protection**:
- Masked in API responses (returned as '***')
- Not logged in plain text
- Clearly marked in database

**Limitations**:
- Not encrypted at rest (SQLite file is plain text)
- No HSM or key management system
- Relies on file system permissions

### API Access Control

**Current State**: No authentication on management API

**Recommendations**:
- Add API key authentication
- Implement role-based access control
- Audit log for config changes
- Rate limiting on management endpoints

### Database Access

**Protection**:
- File system permissions control access
- No network exposure (local file)
- Foreign key constraints prevent orphaned data

**Recommendations**:
- Encrypt SQLite database file (SQLCipher)
- Regular backups
- Audit logging

### Input Validation

All API inputs are validated:

- Type checking (provider type must be valid)
- Required field checking
- Value format validation (URLs, etc.)
- SQL injection prevention (parameterized queries)

## Troubleshooting

### Provider Not Loading

**Symptoms**: Provider exists in database but not in registry

**Causes**:
- Invalid configuration (missing required keys)
- Provider instantiation error
- Registry not initialized

**Solutions**:
1. Check provider configuration completeness
2. Review server logs for errors
3. Try reloading provider: `POST /v1/providers/:id/reload`
4. Verify provider type is valid

### Configuration Not Persisting

**Symptoms**: Config changes don't take effect

**Causes**:
- Database write failure
- Provider not reloaded after config change
- Cached instance still using old config

**Solutions**:
1. Verify database write succeeded
2. Reload provider after config change
3. Check file system permissions
4. Review database logs

### Performance Issues

**Symptoms**: Slow provider lookup or config loading

**Causes**:
- Missing database indexes
- Large number of providers/configs
- Frequent database queries

**Solutions**:
1. Verify indexes exist: `PRAGMA index_list('providers')`
2. Enable WAL mode: `PRAGMA journal_mode=WAL`
3. Profile database queries
4. Consider caching strategies

## Related Documentation

- [Provider Management API](../api/provider-management-api.md)
- [Migrating from ENV to Database](../guides/migrating-from-env-to-database.md)
- [Managing Providers via CLI](../guides/managing-providers-via-cli.md)
- [Adding New Provider Types](../development/adding-new-provider-types.md)
