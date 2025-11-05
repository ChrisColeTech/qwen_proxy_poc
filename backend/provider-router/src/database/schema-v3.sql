-- ============================================================================
-- Schema Version 3: Provider Configuration System
-- ============================================================================
-- This migration adds support for database-driven provider configuration,
-- replacing hardcoded provider definitions from config.js and .env files.
--
-- Tables:
--   - providers: Provider instances (e.g., 'lm-studio-home', 'qwen-direct-1')
--   - provider_configs: Provider-specific configuration key-value pairs
--   - models: LLM model definitions
--   - provider_models: Maps models to providers
-- ============================================================================

-- ============================================================================
-- Providers Table
-- ============================================================================
-- Stores provider instances. Each instance represents a configured backend
-- provider (e.g., an LM Studio server, a Qwen API connection).
-- Multiple instances of the same provider type can exist.
--
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

-- Indexes for providers table
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_enabled ON providers(enabled);
CREATE INDEX IF NOT EXISTS idx_providers_priority ON providers(priority DESC);

-- ============================================================================
-- Provider Configs Table
-- ============================================================================
-- Stores provider-specific configuration in key-value format.
-- Supports sensitive values (API keys, passwords) with masking.
--
-- Common config keys by provider type:
--   lm-studio: baseURL, timeout, defaultModel
--   qwen-proxy: baseURL, timeout
--   qwen-direct: baseURL, timeout (credentials stored in qwen_credentials table)
--
CREATE TABLE IF NOT EXISTS provider_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL,              -- Foreign key to providers.id
    key TEXT NOT NULL,                      -- Config key (e.g., 'baseURL', 'apiKey', 'timeout')
    value TEXT NOT NULL,                    -- Config value (stored as JSON string for complex types)
    is_sensitive BOOLEAN DEFAULT 0,         -- Whether value is sensitive (password, API key)
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    updated_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    UNIQUE(provider_id, key)
);

-- Indexes for provider_configs table
CREATE INDEX IF NOT EXISTS idx_provider_configs_provider_id ON provider_configs(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_configs_key ON provider_configs(key);

-- ============================================================================
-- Models Table
-- ============================================================================
-- Stores LLM model definitions. Models can be mapped to multiple providers.
--
CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,                    -- Model ID (e.g., 'qwen3-max', 'gpt-4')
    name TEXT NOT NULL,                     -- Display name
    description TEXT,                       -- Model description
    capabilities TEXT,                      -- JSON array of capabilities (e.g., '["chat", "completion", "vision"]')
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    updated_at INTEGER NOT NULL             -- Timestamp (milliseconds)
);

-- Indexes for models table
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);

-- ============================================================================
-- Provider Models Table
-- ============================================================================
-- Many-to-many mapping between providers and models.
-- Tracks which models are available for which providers.
--
CREATE TABLE IF NOT EXISTS provider_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL,              -- Foreign key to providers.id
    model_id TEXT NOT NULL,                 -- Foreign key to models.id
    is_default BOOLEAN DEFAULT 0,           -- Whether this is the default model for this provider
    config TEXT,                            -- Provider-specific model config (JSON, optional)
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    updated_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
    UNIQUE(provider_id, model_id)
);

-- Indexes for provider_models table
CREATE INDEX IF NOT EXISTS idx_provider_models_provider_id ON provider_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_models_model_id ON provider_models(model_id);
CREATE INDEX IF NOT EXISTS idx_provider_models_is_default ON provider_models(is_default);
