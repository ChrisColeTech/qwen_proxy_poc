# Provider Configuration Database Migration Plan

## Overview

This document outlines the comprehensive plan to migrate the provider-router from hardcoded provider configurations to a fully database-driven/configuration-driven approach. This will enable dynamic provider management, multiple instances of the same provider type, and runtime configuration changes without code deployment.

---

## Work Progression Tracking

| Phase | Priority | Status | Dependencies |
|-------|----------|--------|--------------|
| Phase 1: Database Schema Design | 1 | Not Started | None |
| Phase 2: Core Services Layer | 2 | Not Started | Phase 1 |
| Phase 3: Provider Factory Refactoring | 3 | Not Started | Phase 2 |
| Phase 4: Configuration API | 4 | Not Started | Phase 2, Phase 3 |
| Phase 5: Migration & Backward Compatibility | 5 | Not Started | Phase 3 |
| Phase 6: CLI Enhancement | 6 | Not Started | Phase 4 |
| Phase 7: Testing & Validation | 7 | Not Started | All Phases |
| Phase 8: Documentation | 8 | Not Started | Phase 7 |

---

## Current State Analysis

### Hardcoded Elements Identified

1. **src/config.js:19-43**
   - Provider configurations from environment variables
   - Hardcoded provider structure (lmStudio, qwenProxy, qwenDirect)
   - Fixed connection details per provider type

2. **src/providers/index.js:69-115**
   - Manual provider registration functions
   - Hardcoded provider instantiation
   - Fixed provider initialization logic

3. **src/providers/qwen-direct-provider.js:96**
   - Hardcoded models array: `['qwen3-max', 'qwen3-coder', 'qwen3-coder-flash']`

4. **src/providers/lm-studio-provider.js:13-20**
   - Provider configuration passed from config.js
   - Fixed axios client configuration

5. **src/providers/qwen-proxy-provider.js:13-20**
   - Provider configuration passed from config.js
   - Fixed axios client configuration

6. **.env / config.js**
   - LM_STUDIO_BASE_URL, LM_STUDIO_DEFAULT_MODEL
   - QWEN_PROXY_BASE_URL
   - QWEN_API_KEY, QWEN_BASE_URL
   - DEFAULT_PROVIDER

### Database Elements (Already Exist)

1. **settings table** - Key-value configuration storage
2. **qwen_credentials table** - Qwen API credentials
3. **sessions, requests, responses tables** - Request/response tracking

### Architecture Strengths to Preserve

1. **BaseProvider pattern** - Abstract provider interface (src/providers/base-provider.js)
2. **Provider registry** - Map-based provider storage (src/providers/index.js)
3. **ProviderRouter** - Request routing logic (src/router/provider-router.js)
4. **SettingsService** - Database-backed settings (src/database/services/settings-service.js)
5. **Migration system** - Database versioning (src/database/migrations.js)

---

## Phase 1: Database Schema Design

### Objective
Design and implement new database tables to store provider configurations, connection details, and model mappings dynamically.

### Files to Create

1. **src/database/schema-v3.sql** (new migration)
   - New tables: `providers`, `provider_configs`, `models`, `provider_models`

### Files to Modify

1. **src/database/migrations.js**
   - Add migration v3 for new schema

### Database Schema Design

```sql
-- Providers table: stores provider instances
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,                    -- UUID or slug (e.g., 'lm-studio-home', 'qwen-direct-1')
    name TEXT NOT NULL,                     -- Display name (e.g., 'LM Studio Home')
    type TEXT NOT NULL,                     -- Provider type (e.g., 'lm-studio', 'qwen-proxy', 'qwen-direct')
    enabled BOOLEAN NOT NULL DEFAULT 1,     -- Whether provider is active
    priority INTEGER NOT NULL DEFAULT 0,    -- Priority for fallback routing (higher = higher priority)
    description TEXT,                       -- User-defined description
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    updated_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    UNIQUE(name)
);

-- Provider Configs table: stores provider-specific configuration (key-value)
CREATE TABLE IF NOT EXISTS provider_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL,              -- Foreign key to providers
    key TEXT NOT NULL,                      -- Config key (e.g., 'baseURL', 'apiKey', 'timeout')
    value TEXT NOT NULL,                    -- Config value (stored as JSON string for complex types)
    is_sensitive BOOLEAN DEFAULT 0,         -- Whether value is sensitive (password, API key)
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    UNIQUE(provider_id, key)
);

-- Models table: stores model definitions
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,                    -- Model ID (e.g., 'qwen3-max', 'gpt-4')
    name TEXT NOT NULL,                     -- Display name
    description TEXT,                       -- Model description
    capabilities TEXT,                      -- JSON array of capabilities (e.g., ['chat', 'completion', 'vision'])
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Provider Models table: maps models to providers
CREATE TABLE IF NOT EXISTS provider_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL,              -- Foreign key to providers
    model_id TEXT NOT NULL,                 -- Foreign key to models
    is_default BOOLEAN DEFAULT 0,           -- Whether this is the default model for this provider
    config TEXT,                            -- Provider-specific model config (JSON)
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
    UNIQUE(provider_id, model_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_enabled ON providers(enabled);
CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers(priority DESC);
CREATE INDEX IF NOT EXISTS idx_provider_configs_provider_id ON provider_configs(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_models_provider_id ON provider_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_models_model_id ON provider_models(model_id);
```

### Integration Points

- **Used by**: Phase 2 (Services Layer)
- **Depends on**: src/database/connection.js, src/database/migrations.js

### New Folder Structure After Phase 1

```
src/
├── database/
│   ├── connection.js
│   ├── migrations.js (MODIFIED)
│   ├── schema.sql
│   └── schema-v3.sql (NEW)
```

---

## Phase 2: Core Services Layer

### Objective
Create service classes to manage CRUD operations for providers, provider configurations, and models in the database.

### Files to Create

1. **src/database/services/provider-service.js**
   - CRUD for providers table
   - Enable/disable providers
   - Get providers by type, priority, enabled status

2. **src/database/services/provider-config-service.js**
   - CRUD for provider_configs table
   - Get/set config values with type casting
   - Handle sensitive config masking

3. **src/database/services/model-service.js**
   - CRUD for models table
   - List all models
   - Get models by capability

4. **src/database/services/provider-model-service.js**
   - CRUD for provider_models table
   - Map models to providers
   - Get models for specific provider
   - Set default model for provider

### Files to Modify

1. **src/database/services/index.js**
   - Export all new services

### Service Method Specifications

#### ProviderService

```javascript
class ProviderService {
  // Create
  static create(id, name, type, options = {})

  // Read
  static getById(id)
  static getByType(type)
  static getAll(filters = {})
  static getEnabled()
  static getByPriority()

  // Update
  static update(id, updates)
  static setEnabled(id, enabled)
  static setPriority(id, priority)

  // Delete
  static delete(id)

  // Utility
  static exists(id)
  static count(filters = {})
}
```

#### ProviderConfigService

```javascript
class ProviderConfigService {
  // Create/Update
  static set(providerId, key, value, isSensitive = false)
  static setMultiple(providerId, configs)

  // Read
  static get(providerId, key, defaultValue = null)
  static getAll(providerId, maskSensitive = true)
  static getMultiple(providerId, keys)

  // Delete
  static delete(providerId, key)
  static deleteAll(providerId)

  // Utility
  static exists(providerId, key)
  static buildConfig(providerId) // Returns complete config object
}
```

#### ModelService

```javascript
class ModelService {
  // Create
  static create(id, name, options = {})

  // Read
  static getById(id)
  static getAll(filters = {})
  static getByCapability(capability)

  // Update
  static update(id, updates)

  // Delete
  static delete(id)

  // Utility
  static exists(id)
}
```

#### ProviderModelService

```javascript
class ProviderModelService {
  // Create
  static link(providerId, modelId, options = {})

  // Read
  static getModelsForProvider(providerId)
  static getProvidersForModel(modelId)
  static getDefaultModel(providerId)

  // Update
  static setDefaultModel(providerId, modelId)
  static updateConfig(providerId, modelId, config)

  // Delete
  static unlink(providerId, modelId)
  static unlinkAll(providerId)

  // Utility
  static isLinked(providerId, modelId)
}
```

### Integration Points

- **Used by**: Phase 3 (Provider Factory), Phase 4 (Configuration API)
- **Depends on**: Phase 1 (Database Schema), src/database/connection.js
- **Integrates with**: src/utils/logger.js

### New Folder Structure After Phase 2

```
src/
├── database/
│   ├── services/
│   │   ├── index.js (MODIFIED)
│   │   ├── provider-service.js (NEW)
│   │   ├── provider-config-service.js (NEW)
│   │   ├── model-service.js (NEW)
│   │   ├── provider-model-service.js (NEW)
│   │   ├── settings-service.js
│   │   ├── qwen-credentials-service.js
│   │   └── logs-service.js
```

---

## Phase 3: Provider Factory Refactoring

### Objective
Refactor provider instantiation to use database configurations instead of hardcoded config files. Create a provider factory that dynamically creates provider instances based on database records.

### Files to Create

1. **src/providers/provider-factory.js**
   - Creates provider instances from database config
   - Maps provider type to class constructor
   - Handles provider initialization with config

2. **src/providers/provider-registry.js**
   - Manages provider lifecycle (load, register, unregister)
   - Replaces provider management in index.js
   - Handles dynamic provider reloading

3. **src/providers/provider-types.js**
   - Constants for provider types
   - Provider type metadata (required configs, optional configs)

### Files to Modify

1. **src/providers/index.js**
   - Refactor to use new provider-registry and provider-factory
   - Keep backward compatibility temporarily
   - Update initializeProviders() to load from database

2. **src/providers/base-provider.js**
   - Add constructor parameter validation
   - Add getType() method

3. **src/providers/lm-studio-provider.js**
   - Update constructor to accept dynamic config
   - Remove hardcoded config.js dependency

4. **src/providers/qwen-proxy-provider.js**
   - Update constructor to accept dynamic config
   - Remove hardcoded config.js dependency

5. **src/providers/qwen-direct-provider.js**
   - Update constructor to accept dynamic config
   - Remove hardcoded models array
   - Fetch models from database via ModelService

6. **src/router/provider-router.js**
   - Update to use new provider registry
   - Add fallback routing support (by priority)

### Provider Factory Design

```javascript
class ProviderFactory {
  /**
   * Create provider instance from database config
   * @param {string} providerId - Provider ID from database
   * @returns {BaseProvider} Provider instance
   */
  static async createFromDatabase(providerId) {
    // 1. Load provider record from ProviderService
    // 2. Load provider configs from ProviderConfigService
    // 3. Build config object
    // 4. Get provider class by type
    // 5. Instantiate provider with config
    // 6. Load models for provider
    // 7. Return provider instance
  }

  /**
   * Create provider instance directly
   * @param {string} type - Provider type
   * @param {Object} config - Provider configuration
   * @returns {BaseProvider} Provider instance
   */
  static create(type, config) {
    // Map type to class constructor
    // Instantiate and return
  }

  /**
   * Get provider class by type
   * @param {string} type - Provider type
   * @returns {Class} Provider class
   */
  static getProviderClass(type) {
    // Return class constructor
  }
}
```

### Provider Registry Design

```javascript
class ProviderRegistry {
  constructor() {
    this.providers = new Map() // providerId -> provider instance
    this.loaded = false
  }

  /**
   * Load all enabled providers from database
   */
  async loadProviders() {
    // 1. Get all enabled providers from database
    // 2. For each provider, create instance via factory
    // 3. Register in map
    // 4. Run health checks
  }

  /**
   * Reload specific provider
   */
  async reloadProvider(providerId) {
    // Unregister, reload from DB, register
  }

  /**
   * Register provider instance
   */
  register(providerId, provider) {
    // Add to map
  }

  /**
   * Unregister provider
   */
  unregister(providerId) {
    // Remove from map, cleanup
  }

  /**
   * Get provider by ID
   */
  get(providerId) {
    // Return provider or throw
  }

  /**
   * Get all providers
   */
  getAll() {
    // Return array of providers
  }

  /**
   * Get providers by type
   */
  getByType(type) {
    // Filter and return
  }
}
```

### Integration Points

- **Used by**: Phase 4 (Configuration API), Phase 5 (Migration)
- **Depends on**: Phase 2 (Services), src/providers/base-provider.js
- **Integrates with**: src/router/provider-router.js, src/index.js
- **Modifies**: Provider initialization flow in src/index.js

### New Folder Structure After Phase 3

```
src/
├── providers/
│   ├── base-provider.js (MODIFIED)
│   ├── lm-studio-provider.js (MODIFIED)
│   ├── qwen-proxy-provider.js (MODIFIED)
│   ├── qwen-direct-provider.js (MODIFIED)
│   ├── provider-factory.js (NEW)
│   ├── provider-registry.js (NEW)
│   ├── provider-types.js (NEW)
│   ├── index.js (MODIFIED)
│   └── qwen/
├── router/
│   └── provider-router.js (MODIFIED)
```

---

## Phase 4: Configuration API

### Objective
Create REST API endpoints for managing provider configurations, allowing runtime changes to providers, connection details, and model mappings without code deployment.

### Files to Create

1. **src/routes/providers.js**
   - GET /v1/providers - List all providers
   - GET /v1/providers/:id - Get provider details
   - POST /v1/providers - Create new provider
   - PUT /v1/providers/:id - Update provider
   - DELETE /v1/providers/:id - Delete provider
   - POST /v1/providers/:id/enable - Enable provider
   - POST /v1/providers/:id/disable - Disable provider
   - POST /v1/providers/:id/test - Test provider connection

2. **src/routes/provider-configs.js**
   - GET /v1/providers/:id/config - Get provider config
   - PUT /v1/providers/:id/config - Update provider config
   - PATCH /v1/providers/:id/config/:key - Update single config key

3. **src/routes/models.js**
   - GET /v1/models - List all models (from database)
   - GET /v1/models/:id - Get model details
   - POST /v1/models - Create model
   - PUT /v1/models/:id - Update model
   - DELETE /v1/models/:id - Delete model

4. **src/routes/provider-models.js**
   - GET /v1/providers/:id/models - Get models for provider
   - POST /v1/providers/:id/models - Link model to provider
   - DELETE /v1/providers/:id/models/:modelId - Unlink model
   - PUT /v1/providers/:id/models/:modelId/default - Set default model

5. **src/controllers/providers-controller.js**
   - Business logic for provider management
   - Validation
   - Provider reload after config changes

6. **src/controllers/models-controller.js**
   - Business logic for model management
   - Validation

7. **src/middleware/validation.js**
   - Request validation middleware
   - Provider type validation
   - Config key/value validation

### Files to Modify

1. **src/server.js**
   - Register new routes
   - Add route documentation to root endpoint

### API Endpoint Specifications

#### Provider Management

```
GET    /v1/providers              - List all providers (with filters)
GET    /v1/providers/:id          - Get provider by ID
POST   /v1/providers              - Create new provider
PUT    /v1/providers/:id          - Update provider
DELETE /v1/providers/:id          - Delete provider
POST   /v1/providers/:id/enable   - Enable provider
POST   /v1/providers/:id/disable  - Disable provider
POST   /v1/providers/:id/test     - Test provider health
POST   /v1/providers/:id/reload   - Reload provider from database
```

#### Provider Configuration

```
GET    /v1/providers/:id/config         - Get all config for provider
PUT    /v1/providers/:id/config         - Update config (bulk)
PATCH  /v1/providers/:id/config/:key    - Update single config value
DELETE /v1/providers/:id/config/:key    - Delete config key
```

#### Model Management

```
GET    /v1/models                  - List all models
GET    /v1/models/:id              - Get model by ID
POST   /v1/models                  - Create model
PUT    /v1/models/:id              - Update model
DELETE /v1/models/:id              - Delete model
```

#### Provider-Model Mapping

```
GET    /v1/providers/:id/models              - Get models for provider
POST   /v1/providers/:id/models              - Link model to provider
DELETE /v1/providers/:id/models/:modelId     - Unlink model
PUT    /v1/providers/:id/models/:modelId/default - Set as default model
```

### Integration Points

- **Used by**: Phase 6 (CLI Enhancement), External Clients, Admin UI
- **Depends on**: Phase 2 (Services), Phase 3 (Provider Factory & Registry)
- **Integrates with**: src/server.js, src/middleware/error-handler.js

### New Folder Structure After Phase 4

```
src/
├── routes/
│   ├── providers.js (NEW)
│   ├── provider-configs.js (NEW)
│   ├── models.js (NEW)
│   ├── provider-models.js (NEW)
│   ├── sessions.js
│   ├── requests.js
│   └── responses.js
├── controllers/
│   ├── providers-controller.js (NEW)
│   ├── models-controller.js (NEW)
│   ├── sessions-controller.js
│   ├── requests-controller.js
│   └── responses-controller.js
├── middleware/
│   ├── validation.js (NEW)
│   ├── cors.js
│   ├── error-handler.js
│   ├── request-logger.js
│   └── response-logger.js
├── server.js (MODIFIED)
```

---

## Phase 5: Migration & Backward Compatibility

### Objective
Create migration utilities to convert existing environment variable configurations to database records. Ensure backward compatibility during transition period.

### Files to Create

1. **src/database/migrations/migrate-env-to-db.js**
   - Read current .env file
   - Parse provider configurations
   - Create database records
   - Preserve existing behavior

2. **src/database/seeders/default-providers.js**
   - Seed default provider configurations
   - Create default models
   - Link models to providers

3. **src/utils/config-migrator.js**
   - Helper to migrate config.js providers to database
   - Validation and error handling

### Files to Modify

1. **src/config.js**
   - Add deprecation warnings for provider config
   - Keep minimal config (port, host, logging)
   - Add flag to enable/disable legacy mode

2. **src/index.js**
   - Check for legacy config on startup
   - Prompt to run migration
   - Support both modes temporarily

3. **src/database/migrations.js**
   - Add migration v4 for data seeding

### Migration Strategy

```javascript
// Migration flow:
// 1. Check if providers table is empty
// 2. If empty and .env has provider configs:
//    - Parse .env provider configurations
//    - Create provider records
//    - Create provider_configs records
//    - Create default models
//    - Link models to providers
// 3. Set active_provider in settings from DEFAULT_PROVIDER env var
// 4. Log migration complete
```

### Backward Compatibility Approach

- **Legacy Mode Flag**: `USE_LEGACY_CONFIG=true` in .env
- **Fallback Logic**: If database has no providers, fall back to config.js
- **Graceful Degradation**: Warn users to migrate but don't break existing setups
- **Migration Command**: Add CLI command to trigger migration manually

### Integration Points

- **Used by**: src/index.js startup flow
- **Depends on**: Phase 1 (Schema), Phase 2 (Services)
- **Integrates with**: src/config.js, .env

### New Folder Structure After Phase 5

```
src/
├── database/
│   ├── migrations/
│   │   └── migrate-env-to-db.js (NEW)
│   ├── seeders/
│   │   └── default-providers.js (NEW)
│   ├── migrations.js (MODIFIED)
├── utils/
│   ├── config-migrator.js (NEW)
│   ├── logger.js
│   ├── hash-utils.js
│   └── retry-with-backoff.js
├── config.js (MODIFIED)
├── index.js (MODIFIED)
```

---

## Phase 6: CLI Enhancement

### Objective
Enhance the CLI to support provider management, configuration updates, and model mappings from the command line.

### Files to Create

1. **src/cli/commands/provider/list.js**
   - List all providers
   - Filter by type, enabled status

2. **src/cli/commands/provider/add.js**
   - Add new provider interactively
   - Prompt for type, name, config

3. **src/cli/commands/provider/edit.js**
   - Edit provider configuration
   - Update connection details

4. **src/cli/commands/provider/remove.js**
   - Remove provider
   - Confirmation prompt

5. **src/cli/commands/provider/enable.js**
   - Enable provider

6. **src/cli/commands/provider/disable.js**
   - Disable provider

7. **src/cli/commands/provider/test-connection.js**
   - Test provider connection
   - Show health status

8. **src/cli/commands/model/list.js**
   - List all models
   - Show provider mappings

9. **src/cli/commands/model/add.js**
   - Add new model
   - Link to provider

10. **src/cli/commands/model/link.js**
    - Link model to provider

11. **src/cli/commands/model/unlink.js**
    - Unlink model from provider

12. **src/cli/commands/migrate.js**
    - Run env-to-db migration
    - Interactive migration wizard

### Files to Modify

1. **src/cli/index.js**
   - Add new command groups (provider, model)
   - Update help text

2. **bin/provider-cli.js**
   - Add new command routing

### CLI Command Structure

```
provider-cli
├── status                    (existing)
├── list                      (existing - list providers)
├── set <provider>            (existing - set active provider)
├── test <provider>           (existing)
├── history                   (existing)
├── stats                     (existing)
├── provider
│   ├── list                  (NEW - detailed provider list)
│   ├── add                   (NEW)
│   ├── edit <id>             (NEW)
│   ├── remove <id>           (NEW)
│   ├── enable <id>           (NEW)
│   ├── disable <id>          (NEW)
│   └── test <id>             (NEW)
├── model
│   ├── list                  (NEW)
│   ├── add                   (NEW)
│   ├── link <provider> <model>   (NEW)
│   └── unlink <provider> <model> (NEW)
└── migrate                   (NEW - env to database migration)
```

### Integration Points

- **Used by**: System administrators, DevOps
- **Depends on**: Phase 2 (Services), Phase 4 (API Controllers)
- **Integrates with**: src/cli/utils/colors.js, src/cli/utils/table-formatter.js

### New Folder Structure After Phase 6

```
src/
├── cli/
│   ├── commands/
│   │   ├── provider/
│   │   │   ├── list.js (NEW)
│   │   │   ├── add.js (NEW)
│   │   │   ├── edit.js (NEW)
│   │   │   ├── remove.js (NEW)
│   │   │   ├── enable.js (NEW)
│   │   │   ├── disable.js (NEW)
│   │   │   └── test-connection.js (NEW)
│   │   ├── model/
│   │   │   ├── list.js (NEW)
│   │   │   ├── add.js (NEW)
│   │   │   ├── link.js (NEW)
│   │   │   └── unlink.js (NEW)
│   │   ├── migrate.js (NEW)
│   │   ├── history.js
│   │   ├── list.js (MODIFIED)
│   │   ├── set.js
│   │   ├── stats.js
│   │   ├── status.js
│   │   └── test.js
│   ├── utils/
│   │   ├── colors.js
│   │   └── table-formatter.js
│   └── index.js (MODIFIED)
├── bin/
│   └── provider-cli.js (MODIFIED)
```

---

## Phase 7: Testing & Validation

### Objective
Comprehensive testing of all new components, services, API endpoints, and CLI commands. Ensure backward compatibility and data integrity.

### Files to Create

1. **tests/unit/services/provider-service.test.js**
   - Test CRUD operations
   - Test filtering and sorting
   - Test edge cases

2. **tests/unit/services/provider-config-service.test.js**
   - Test config get/set
   - Test sensitive data masking
   - Test buildConfig()

3. **tests/unit/services/model-service.test.js**
   - Test model CRUD
   - Test capability filtering

4. **tests/unit/services/provider-model-service.test.js**
   - Test linking/unlinking
   - Test default model setting

5. **tests/unit/providers/provider-factory.test.js**
   - Test provider instantiation
   - Test type mapping
   - Test config validation

6. **tests/unit/providers/provider-registry.test.js**
   - Test load/reload
   - Test register/unregister
   - Test get operations

7. **tests/integration/api/providers-api.test.js**
   - Test all provider endpoints
   - Test error handling
   - Test authentication (if added)

8. **tests/integration/api/models-api.test.js**
   - Test all model endpoints
   - Test error handling

9. **tests/integration/migration.test.js**
   - Test env-to-db migration
   - Test backward compatibility
   - Test data integrity

10. **tests/integration/cli.test.js** (MODIFY)
    - Test new CLI commands
    - Test interactive flows

11. **tests/integration/provider-router.test.js** (MODIFY)
    - Test routing with database providers
    - Test fallback logic
    - Test priority routing

### Files to Modify

1. **tests/integration/database.test.js**
   - Add tests for new tables
   - Test foreign key constraints

### Test Coverage Goals

- Unit Tests: 80%+ coverage
- Integration Tests: All critical paths
- E2E Tests: Full user workflows

### Integration Points

- **Depends on**: All previous phases
- **Uses**: Test database (data/test/provider-router.db)

### New Folder Structure After Phase 7

```
tests/
├── unit/
│   ├── services/
│   │   ├── provider-service.test.js (NEW)
│   │   ├── provider-config-service.test.js (NEW)
│   │   ├── model-service.test.js (NEW)
│   │   └── provider-model-service.test.js (NEW)
│   ├── providers/
│   │   ├── provider-factory.test.js (NEW)
│   │   └── provider-registry.test.js (NEW)
├── integration/
│   ├── api/
│   │   ├── providers-api.test.js (NEW)
│   │   └── models-api.test.js (NEW)
│   ├── migration.test.js (NEW)
│   ├── cli.test.js (MODIFIED)
│   ├── database.test.js (MODIFIED)
│   ├── provider-router.test.js (MODIFIED)
│   ├── lm-studio.test.js
│   ├── qwen-proxy.test.js
│   └── routing.test.js
├── example-session-manager-usage.js
├── test-qwen-types.js
└── test-session-manager.js
```

---

## Phase 8: Documentation

### Objective
Comprehensive documentation for new features, API endpoints, CLI commands, migration guide, and architecture diagrams.

### Files to Create

1. **docs/architecture/provider-configuration-system.md**
   - System architecture overview
   - Database schema diagrams
   - Component interaction diagrams

2. **docs/api/provider-management-api.md**
   - API endpoint documentation
   - Request/response examples
   - Error codes

3. **docs/guides/migrating-from-env-to-database.md**
   - Step-by-step migration guide
   - Troubleshooting
   - Rollback instructions

4. **docs/guides/managing-providers-via-cli.md**
   - CLI command reference
   - Examples and workflows

5. **docs/guides/managing-providers-via-api.md**
   - API usage examples
   - Integration examples

6. **docs/development/adding-new-provider-types.md**
   - Developer guide for adding new provider types
   - Provider interface requirements
   - Best practices

### Files to Modify

1. **README.md**
   - Update with new features
   - Add migration instructions
   - Link to detailed documentation

2. **docs/CHANGELOG.md**
   - Document all changes
   - Breaking changes
   - Deprecations

### Documentation Structure

```
docs/
├── provider-configuration-database-migration-plan.md (THIS FILE)
├── architecture/
│   └── provider-configuration-system.md (NEW)
├── api/
│   └── provider-management-api.md (NEW)
├── guides/
│   ├── migrating-from-env-to-database.md (NEW)
│   ├── managing-providers-via-cli.md (NEW)
│   └── managing-providers-via-api.md (NEW)
├── development/
│   └── adding-new-provider-types.md (NEW)
├── CHANGELOG.md (NEW/MODIFIED)
└── README.md (in parent directory - MODIFIED)
```

### Integration Points

- **Depends on**: All previous phases
- **Used by**: Users, Developers, DevOps

---

## Complete File & Folder Structure

### Final Structure After All Phases

```
backend/provider-router/
├── bin/
│   └── provider-cli.js (MODIFIED)
├── data/
│   ├── provider-router.db (runtime)
│   └── test/
│       └── provider-router.db (test)
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── provider/
│   │   │   │   ├── list.js (NEW)
│   │   │   │   ├── add.js (NEW)
│   │   │   │   ├── edit.js (NEW)
│   │   │   │   ├── remove.js (NEW)
│   │   │   │   ├── enable.js (NEW)
│   │   │   │   ├── disable.js (NEW)
│   │   │   │   └── test-connection.js (NEW)
│   │   │   ├── model/
│   │   │   │   ├── list.js (NEW)
│   │   │   │   ├── add.js (NEW)
│   │   │   │   ├── link.js (NEW)
│   │   │   │   └── unlink.js (NEW)
│   │   │   ├── migrate.js (NEW)
│   │   │   ├── history.js
│   │   │   ├── list.js (MODIFIED)
│   │   │   ├── set.js
│   │   │   ├── stats.js
│   │   │   ├── status.js
│   │   │   └── test.js
│   │   ├── utils/
│   │   │   ├── colors.js
│   │   │   └── table-formatter.js
│   │   └── index.js (MODIFIED)
│   ├── controllers/
│   │   ├── providers-controller.js (NEW)
│   │   ├── models-controller.js (NEW)
│   │   ├── sessions-controller.js
│   │   ├── requests-controller.js
│   │   └── responses-controller.js
│   ├── database/
│   │   ├── migrations/
│   │   │   └── migrate-env-to-db.js (NEW)
│   │   ├── repositories/
│   │   │   ├── base-repository.js
│   │   │   ├── request-repository.js
│   │   │   ├── response-repository.js
│   │   │   ├── session-repository.js
│   │   │   └── index.js
│   │   ├── seeders/
│   │   │   └── default-providers.js (NEW)
│   │   ├── services/
│   │   │   ├── provider-service.js (NEW)
│   │   │   ├── provider-config-service.js (NEW)
│   │   │   ├── model-service.js (NEW)
│   │   │   ├── provider-model-service.js (NEW)
│   │   │   ├── settings-service.js
│   │   │   ├── qwen-credentials-service.js
│   │   │   ├── logs-service.js
│   │   │   └── index.js (MODIFIED)
│   │   ├── connection.js
│   │   ├── migrations.js (MODIFIED)
│   │   ├── schema.sql
│   │   └── schema-v3.sql (NEW)
│   ├── middleware/
│   │   ├── validation.js (NEW)
│   │   ├── cors.js
│   │   ├── database-logger.js
│   │   ├── error-handler.js
│   │   ├── persistence-middleware.js
│   │   ├── request-logger.js
│   │   └── response-logger.js
│   ├── providers/
│   │   ├── qwen/
│   │   │   ├── qwen-client.js
│   │   │   ├── qwen-types.js
│   │   │   ├── request-transformer.js
│   │   │   └── response-transformer.js
│   │   ├── base-provider.js (MODIFIED)
│   │   ├── lm-studio-provider.js (MODIFIED)
│   │   ├── qwen-proxy-provider.js (MODIFIED)
│   │   ├── qwen-direct-provider.js (MODIFIED)
│   │   ├── provider-factory.js (NEW)
│   │   ├── provider-registry.js (NEW)
│   │   ├── provider-types.js (NEW)
│   │   └── index.js (MODIFIED)
│   ├── routes/
│   │   ├── providers.js (NEW)
│   │   ├── provider-configs.js (NEW)
│   │   ├── models.js (NEW)
│   │   ├── provider-models.js (NEW)
│   │   ├── sessions.js
│   │   ├── requests.js
│   │   └── responses.js
│   ├── router/
│   │   └── provider-router.js (MODIFIED)
│   ├── services/
│   │   └── session-manager.js
│   ├── utils/
│   │   ├── config-migrator.js (NEW)
│   │   ├── logger.js
│   │   ├── hash-utils.js
│   │   └── retry-with-backoff.js
│   ├── config.js (MODIFIED)
│   ├── index.js (MODIFIED)
│   └── server.js (MODIFIED)
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── provider-service.test.js (NEW)
│   │   │   ├── provider-config-service.test.js (NEW)
│   │   │   ├── model-service.test.js (NEW)
│   │   │   └── provider-model-service.test.js (NEW)
│   │   └── providers/
│   │       ├── provider-factory.test.js (NEW)
│   │       └── provider-registry.test.js (NEW)
│   ├── integration/
│   │   ├── api/
│   │   │   ├── providers-api.test.js (NEW)
│   │   │   └── models-api.test.js (NEW)
│   │   ├── migration.test.js (NEW)
│   │   ├── cli.test.js (MODIFIED)
│   │   ├── database.test.js (MODIFIED)
│   │   ├── provider-router.test.js (MODIFIED)
│   │   ├── lm-studio.test.js
│   │   ├── qwen-proxy.test.js
│   │   └── routing.test.js
│   ├── example-session-manager-usage.js
│   ├── test-qwen-types.js
│   └── test-session-manager.js
├── .env (MODIFIED - deprecation warnings)
├── .env.example (MODIFIED)
├── package.json
└── README.md (MODIFIED)
```

---

## Implementation Best Practices

### Single Responsibility Principle (SRP)

- **Services**: Each service manages one table or one logical domain
- **Controllers**: Each controller handles one resource type
- **Providers**: Each provider handles one LLM backend type
- **Routes**: Each route file handles one API resource

### Don't Repeat Yourself (DRY)

- **BaseProvider**: Common provider logic
- **BaseRepository**: Common database operations (if needed)
- **ProviderFactory**: Centralized provider instantiation
- **Config utilities**: Shared configuration parsing/validation

### Separation of Concerns

- **Database Layer**: Services manage data access
- **Business Logic**: Controllers handle business rules
- **API Layer**: Routes handle HTTP concerns
- **Provider Layer**: Providers handle LLM backend communication
- **CLI Layer**: CLI commands handle user interaction

### Error Handling

- Consistent error responses across API
- Error logging with context
- Graceful degradation for provider failures
- Transaction rollback on database errors

### Security Considerations

- **Sensitive Config**: Mark API keys and passwords as sensitive
- **Config Masking**: Mask sensitive values in API responses
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries (better-sqlite3 handles this)
- **API Authentication**: Consider adding API keys or JWT in future

### Performance Optimization

- **Database Indexes**: Index all foreign keys and frequently queried columns
- **Connection Pooling**: SQLite WAL mode for better concurrency
- **Lazy Loading**: Load providers on-demand if needed
- **Caching**: Cache provider instances in registry

---

## Migration Path

### For Users

1. **Before Migration**:
   - Current setup with .env configuration works as-is
   - No changes required immediately

2. **Migration**:
   - Run `provider-cli migrate` command
   - System auto-detects .env config and migrates to database
   - Backup created automatically

3. **After Migration**:
   - .env provider configs can be removed (keep port, host, logging)
   - Manage providers via CLI or API
   - Add new providers without code changes

### For Developers

1. **Backward Compatibility Phase** (1-2 releases):
   - Support both .env and database config
   - Deprecation warnings
   - Documentation for migration

2. **Full Migration** (future release):
   - Remove .env provider config support
   - Database-only configuration
   - Clean up legacy code

---

## Risk Mitigation

### Risk: Data Loss During Migration

**Mitigation**:
- Automatic database backup before migration
- Validation after migration
- Rollback capability
- Dry-run mode for migration

### Risk: Breaking Changes for Existing Users

**Mitigation**:
- Backward compatibility period
- Clear deprecation warnings
- Migration documentation
- Support for both modes temporarily

### Risk: Provider Instantiation Failures

**Mitigation**:
- Comprehensive validation on provider creation
- Health checks after instantiation
- Detailed error logging
- Graceful fallback to other providers

### Risk: Database Corruption

**Mitigation**:
- Foreign key constraints
- Transaction support
- WAL mode for concurrency
- Regular backups

### Risk: Performance Degradation

**Mitigation**:
- Database indexes on all queries
- Provider instance caching
- Connection pooling
- Performance testing

---

## Success Criteria

1. **Functional Requirements**:
   - All providers can be created/updated/deleted via API and CLI
   - Provider configurations stored in database
   - Runtime provider switching without restart
   - Multiple instances of same provider type supported
   - Model management via API and CLI

2. **Non-Functional Requirements**:
   - Zero downtime deployment
   - Backward compatibility maintained
   - No performance degradation
   - Test coverage >80%
   - Complete documentation

3. **User Experience**:
   - Easy migration from .env to database
   - Intuitive CLI commands
   - Clear API documentation
   - Helpful error messages

---

## Future Enhancements (Out of Scope)

1. **Web Admin UI**: Browser-based provider management interface
2. **Provider Templates**: Pre-configured provider templates for common setups
3. **Load Balancing**: Automatic load balancing across multiple providers
4. **Failover**: Automatic failover to backup providers
5. **Monitoring**: Provider health monitoring and alerting
6. **API Authentication**: JWT or API key authentication for management endpoints
7. **Multi-Tenancy**: Support for multiple isolated provider configurations
8. **Import/Export**: Configuration import/export for backup/restore
9. **Provider Marketplace**: Community-contributed provider configurations
10. **Advanced Routing**: Content-based routing, model-based routing

---

## Glossary

- **Provider**: An LLM backend service (e.g., LM Studio, Qwen API)
- **Provider Instance**: A configured instance of a provider type
- **Provider Type**: The class/category of provider (e.g., lm-studio, qwen-direct)
- **Provider Config**: Key-value configuration for a provider instance
- **Model**: An LLM model (e.g., qwen3-max, gpt-4)
- **Provider Model Mapping**: Association between a provider and supported models
- **Active Provider**: The currently selected provider for routing requests
- **Default Model**: The default model for a provider if none specified
- **Legacy Mode**: Configuration via .env and config.js (deprecated)
- **Database Mode**: Configuration via database tables (current)

---

## Appendix A: Provider Type Specifications

### LM Studio Provider

**Type**: `lm-studio`

**Required Config**:
- `baseURL` (string): Base URL for LM Studio API
  - Example: `http://192.168.0.22:1234/v1`

**Optional Config**:
- `defaultModel` (string): Default model name
- `timeout` (number): Request timeout in milliseconds

**Capabilities**:
- Chat completions
- Streaming
- Tool/function calling
- Model listing

---

### Qwen Proxy Provider

**Type**: `qwen-proxy`

**Required Config**:
- `baseURL` (string): Base URL for Qwen proxy server
  - Example: `http://localhost:3000`

**Optional Config**:
- `timeout` (number): Request timeout in milliseconds

**Capabilities**:
- Chat completions
- Streaming
- Tool/function calling (with XML transformation)
- Model listing

---

### Qwen Direct Provider

**Type**: `qwen-direct`

**Required Config**:
- `token` (string, sensitive): Qwen API token (bx-umidtoken)
- `cookies` (string, sensitive): Qwen API cookies

**Optional Config**:
- `baseURL` (string): Qwen API base URL
  - Default: `https://chat.qwen.ai`
- `timeout` (number): Request timeout in milliseconds
- `expiresAt` (number): Token expiration timestamp

**Capabilities**:
- Chat completions
- Streaming
- Session management
- Model listing

---

## Appendix B: Database Schema ERD

```
┌─────────────────┐
│   providers     │
├─────────────────┤
│ id (PK)         │──┐
│ name            │  │
│ type            │  │
│ enabled         │  │
│ priority        │  │
│ description     │  │
│ created_at      │  │
│ updated_at      │  │
└─────────────────┘  │
                     │
        ┌────────────┼────────────┐
        │            │            │
        │            │            │
┌───────▼──────────┐ │  ┌─────────▼────────┐
│provider_configs  │ │  │ provider_models  │
├──────────────────┤ │  ├──────────────────┤
│ id (PK)          │ │  │ id (PK)          │
│ provider_id (FK) │─┘  │ provider_id (FK) │─┐
│ key              │    │ model_id (FK)    │─┼─┐
│ value            │    │ is_default       │ │ │
│ is_sensitive     │    │ config           │ │ │
│ created_at       │    │ created_at       │ │ │
│ updated_at       │    │ updated_at       │ │ │
└──────────────────┘    └──────────────────┘ │ │
                                             │ │
                        ┌────────────────────┘ │
                        │                      │
                ┌───────▼────────┐             │
                │     models     │             │
                ├────────────────┤             │
                │ id (PK)        │◄────────────┘
                │ name           │
                │ description    │
                │ capabilities   │
                │ created_at     │
                │ updated_at     │
                └────────────────┘
```

---

## Appendix C: Example Migration Script Output

```bash
$ provider-cli migrate

╔══════════════════════════════════════════════════════════╗
║  Provider Configuration Migration                        ║
╚══════════════════════════════════════════════════════════╝

Analyzing current configuration...

Found providers in .env:
  ✓ lm-studio (LM Studio)
  ✓ qwen-proxy (Qwen Proxy)
  ✓ qwen-direct (Qwen Direct)

Default provider: lm-studio

Database status:
  ✓ Database connected
  ✓ Tables exist
  ℹ No providers in database (migration needed)

Creating backup...
  ✓ Backup created: data/backups/provider-router-backup-20250131-143022.db

Migrating providers...
  ✓ Created provider: lm-studio-default
    - Type: lm-studio
    - BaseURL: http://192.168.0.22:1234/v1
    - Default Model: qwen3-max

  ✓ Created provider: qwen-proxy-default
    - Type: qwen-proxy
    - BaseURL: http://localhost:3000

  ✓ Created provider: qwen-direct-default
    - Type: qwen-direct
    - Credentials: Loaded from qwen_credentials table

Creating default models...
  ✓ Created model: qwen3-max
  ✓ Created model: qwen3-coder
  ✓ Created model: qwen3-coder-flash

Linking models to providers...
  ✓ Linked qwen3-max to lm-studio-default (default)
  ✓ Linked qwen3-coder to lm-studio-default
  ✓ Linked qwen3-coder-flash to lm-studio-default
  ✓ Linked qwen3-max to qwen-direct-default (default)

Setting active provider...
  ✓ Active provider: lm-studio-default

╔══════════════════════════════════════════════════════════╗
║  Migration Complete!                                     ║
╚══════════════════════════════════════════════════════════╝

Next steps:
  1. Test providers: provider-cli provider list
  2. Test connection: provider-cli provider test lm-studio-default
  3. Update .env: Remove provider configs (keep PORT, HOST, LOG_LEVEL)
  4. Restart server: npm start

For rollback: Restore backup from data/backups/
```

---

## Appendix D: Example API Requests

### Create a New Provider

```bash
POST /v1/providers
Content-Type: application/json

{
  "id": "lm-studio-gpu-server",
  "name": "LM Studio GPU Server",
  "type": "lm-studio",
  "enabled": true,
  "priority": 10,
  "description": "LM Studio on GPU server",
  "config": {
    "baseURL": "http://192.168.0.50:1234/v1",
    "timeout": 180000
  }
}

Response 201:
{
  "id": "lm-studio-gpu-server",
  "name": "LM Studio GPU Server",
  "type": "lm-studio",
  "enabled": true,
  "priority": 10,
  "description": "LM Studio on GPU server",
  "created_at": 1706745600000,
  "updated_at": 1706745600000
}
```

### Get Provider Configuration

```bash
GET /v1/providers/lm-studio-gpu-server/config

Response 200:
{
  "provider_id": "lm-studio-gpu-server",
  "config": {
    "baseURL": "http://192.168.0.50:1234/v1",
    "timeout": 180000
  }
}
```

### Update Provider Configuration

```bash
PATCH /v1/providers/lm-studio-gpu-server/config/baseURL
Content-Type: application/json

{
  "value": "http://192.168.0.60:1234/v1"
}

Response 200:
{
  "key": "baseURL",
  "value": "http://192.168.0.60:1234/v1",
  "updated_at": 1706745700000
}
```

### Link Model to Provider

```bash
POST /v1/providers/lm-studio-gpu-server/models
Content-Type: application/json

{
  "model_id": "qwen3-max",
  "is_default": true
}

Response 201:
{
  "provider_id": "lm-studio-gpu-server",
  "model_id": "qwen3-max",
  "is_default": true,
  "created_at": 1706745800000
}
```

---

## Document Version

- **Version**: 1.0
- **Date**: 2025-01-31
- **Author**: AI Assistant (Claude)
- **Status**: Draft for Review
- **Next Review**: After Phase 1 completion
