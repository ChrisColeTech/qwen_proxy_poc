# Migrating from Environment Variables to Database Configuration

## Table of Contents

- [Overview](#overview)
- [Why Migrate?](#why-migrate)
- [Migration Checklist](#migration-checklist)
- [Pre-Migration Steps](#pre-migration-steps)
- [Migration Methods](#migration-methods)
- [Post-Migration Steps](#post-migration-steps)
- [Verification](#verification)
- [Rollback Instructions](#rollback-instructions)
- [Troubleshooting](#troubleshooting)

## Overview

This guide walks you through migrating your provider configuration from environment variables (`.env` file) to the database-driven configuration system.

### Migration Benefits

- Runtime configuration changes (no server restart)
- Multiple instances of the same provider type
- Web API and CLI management
- Configuration history and audit trail
- Better security (sensitive data masking)

### Migration Impact

- **Downtime**: Minimal (< 1 minute)
- **Data Loss Risk**: Low (automatic backup created)
- **Reversibility**: Yes (rollback supported)
- **Breaking Changes**: None (backward compatible)

## Why Migrate?

### Before Migration (Environment Variables)

**Configuration Method**: Edit `.env` file

```bash
# .env
DEFAULT_PROVIDER=lm-studio
LM_STUDIO_BASE_URL=http://192.168.0.22:1234/v1
LM_STUDIO_DEFAULT_MODEL=qwen3-max
QWEN_PROXY_BASE_URL=http://localhost:3000
QWEN_API_KEY=your_api_key_here
```

**Limitations**:
- Requires server restart for changes
- One instance per provider type
- Manual file editing (no API)
- No configuration history
- Limited validation

### After Migration (Database)

**Configuration Method**: CLI commands or API calls

```bash
# Create a new provider
provider-cli provider add \
  --id lm-studio-gpu \
  --name "LM Studio GPU" \
  --type lm-studio \
  --config baseURL=http://192.168.0.50:1234/v1

# Update configuration (no restart)
provider-cli provider edit lm-studio-gpu \
  --config timeout=240000

# Enable/disable providers
provider-cli provider disable lm-studio-gpu
```

**Benefits**:
- No restart required
- Multiple provider instances
- API and CLI management
- Configuration validation
- Audit trail
- Sensitive data masking

## Migration Checklist

Use this checklist to track your migration progress:

- [ ] **Pre-Migration**
  - [ ] Backup `.env` file
  - [ ] Review current configuration
  - [ ] Test current setup
  - [ ] Update to latest version
  - [ ] Read migration guide

- [ ] **Migration**
  - [ ] Stop server (optional)
  - [ ] Run migration command
  - [ ] Review migration output
  - [ ] Verify database records

- [ ] **Post-Migration**
  - [ ] Test provider connectivity
  - [ ] Verify active provider
  - [ ] Clean up `.env` file
  - [ ] Update documentation
  - [ ] Restart server

- [ ] **Verification**
  - [ ] List providers
  - [ ] Test chat completion
  - [ ] Check provider switching
  - [ ] Review logs

## Pre-Migration Steps

### Step 1: Backup Current Configuration

Create a backup of your `.env` file:

```bash
cd /path/to/provider-router
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### Step 2: Review Current Configuration

List your current provider configuration:

```bash
# View .env file
cat .env | grep -E '(PROVIDER|STUDIO|QWEN)'
```

Document your current setup:

```
DEFAULT_PROVIDER=lm-studio
LM_STUDIO_BASE_URL=http://192.168.0.22:1234/v1
LM_STUDIO_DEFAULT_MODEL=qwen3-max
QWEN_PROXY_BASE_URL=http://localhost:3000
```

### Step 3: Test Current Setup

Verify your current setup works:

```bash
# Test server
curl http://localhost:3001/health

# Test provider
curl http://localhost:3001/v1/models

# Test chat completion
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Step 4: Update to Latest Version

Ensure you're running the latest version:

```bash
cd /path/to/provider-router
git pull
npm install
```

## Migration Methods

### Method 1: Automatic Migration (Recommended)

The automatic migration command detects your `.env` configuration and creates corresponding database records.

#### Step 1: Run Migration Command

```bash
provider-cli migrate
```

#### Step 2: Review Migration Output

The command will display:

```
Provider Configuration Migration

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
    - Credentials: Loaded from database

Creating default models...
  ✓ Created model: qwen3-max
  ✓ Created model: qwen3-coder
  ✓ Created model: qwen3-coder-flash

Linking models to providers...
  ✓ Linked qwen3-max to lm-studio-default (default)
  ✓ Linked qwen3-coder to lm-studio-default
  ✓ Linked qwen3-max to qwen-direct-default (default)

Setting active provider...
  ✓ Active provider: lm-studio-default

Migration Complete!

Next steps:
  1. Test providers: provider-cli provider list
  2. Test connection: provider-cli provider test lm-studio-default
  3. Update .env: Remove provider configs (keep PORT, HOST, LOG_LEVEL)
  4. Restart server: npm start
```

#### Step 3: Verify Migration

```bash
# List migrated providers
provider-cli provider list

# Test provider connectivity
provider-cli provider test lm-studio-default
```

### Method 2: Manual Migration

If automatic migration doesn't work or you prefer manual control:

#### Step 1: Create Providers

```bash
# Create LM Studio provider
provider-cli provider add \
  --id lm-studio-default \
  --name "LM Studio" \
  --type lm-studio \
  --enabled true \
  --priority 10 \
  --config baseURL=http://192.168.0.22:1234/v1 \
  --config defaultModel=qwen3-max \
  --config timeout=120000

# Create Qwen Proxy provider
provider-cli provider add \
  --id qwen-proxy-default \
  --name "Qwen Proxy" \
  --type qwen-proxy \
  --enabled true \
  --priority 5 \
  --config baseURL=http://localhost:3000

# Create Qwen Direct provider (if configured)
provider-cli provider add \
  --id qwen-direct-default \
  --name "Qwen Direct" \
  --type qwen-direct \
  --enabled true \
  --priority 0 \
  --config baseURL=https://chat.qwen.ai
```

#### Step 2: Create Models

```bash
# Create models
provider-cli model add \
  --id qwen3-max \
  --name "Qwen 3 Max" \
  --description "Most capable Qwen model"

provider-cli model add \
  --id qwen3-coder \
  --name "Qwen 3 Coder" \
  --description "Specialized coding model"
```

#### Step 3: Link Models to Providers

```bash
# Link models to LM Studio
provider-cli model link lm-studio-default qwen3-max --default
provider-cli model link lm-studio-default qwen3-coder

# Link models to Qwen Direct
provider-cli model link qwen-direct-default qwen3-max --default
```

#### Step 4: Set Active Provider

```bash
provider-cli set lm-studio-default
```

## Post-Migration Steps

### Step 1: Clean Up .env File

After successful migration, remove provider-specific configuration from `.env`:

**Before (Old .env)**:

```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Provider Configuration (REMOVE THESE)
DEFAULT_PROVIDER=lm-studio
LM_STUDIO_BASE_URL=http://192.168.0.22:1234/v1
LM_STUDIO_DEFAULT_MODEL=qwen3-max
QWEN_PROXY_BASE_URL=http://localhost:3000
QWEN_API_KEY=your_api_key_here

# Request Configuration
REQUEST_TIMEOUT=120000
```

**After (New .env)**:

```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Request Configuration
REQUEST_TIMEOUT=120000

# Note: Provider configuration now managed via database
# Use: provider-cli provider list
# See: docs/guides/managing-providers-via-cli.md
```

### Step 2: Update .env.example

Update the example file for other developers:

```bash
cp .env .env.example
# Edit .env.example to remove sensitive values
```

### Step 3: Restart Server

Restart the server to use database configuration:

```bash
npm restart
```

Or if running with PM2:

```bash
pm2 restart provider-router
```

### Step 4: Update Documentation

Update any project-specific documentation that references `.env` provider configuration.

## Verification

### Verify Providers List

```bash
provider-cli provider list
```

Expected output:

```
Providers
┌──────────────────────┬──────────────┬────────────┬─────────┬──────────┐
│ ID                   │ Name         │ Type       │ Enabled │ Priority │
├──────────────────────┼──────────────┼────────────┼─────────┼──────────┤
│ lm-studio-default    │ LM Studio    │ lm-studio  │ ✓       │ 10       │
│ qwen-proxy-default   │ Qwen Proxy   │ qwen-proxy │ ✓       │ 5        │
│ qwen-direct-default  │ Qwen Direct  │ qwen-direct│ ✓       │ 0        │
└──────────────────────┴──────────────┴────────────┴─────────┴──────────┘

Active Provider: lm-studio-default
```

### Verify Active Provider

```bash
provider-cli status
```

Expected output:

```
Provider Status
Provider: LM Studio (lm-studio-default)
Type: lm-studio
Status: Enabled
Priority: 10

Configuration:
  baseURL: http://192.168.0.22:1234/v1
  defaultModel: qwen3-max
  timeout: 120000
```

### Test Provider Connectivity

```bash
provider-cli provider test lm-studio-default
```

Expected output:

```
Testing provider: lm-studio-default

✓ Connection successful
✓ Models endpoint accessible
✓ Response time: 45ms

Available models:
  - qwen3-max
  - qwen3-coder

Status: Healthy
```

### Test Chat Completion

```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Say hello"}]
  }'
```

Expected: Successful response with chat completion.

### Test Provider Switching

```bash
# Switch to different provider
provider-cli set qwen-proxy-default

# Verify switch
provider-cli status

# Switch back
provider-cli set lm-studio-default
```

## Rollback Instructions

If you encounter issues and need to rollback:

### Step 1: Stop Server

```bash
# If running directly
Ctrl+C

# If using PM2
pm2 stop provider-router
```

### Step 2: Restore .env Backup

```bash
cp .env.backup.YYYYMMDD_HHMMSS .env
```

### Step 3: Restore Database Backup (if needed)

```bash
cp data/backups/provider-router-backup-YYYYMMDD-HHMMSS.db data/provider-router.db
```

### Step 4: Clear Database Providers (Alternative)

Instead of restoring the database, clear providers:

```bash
# Delete all providers
provider-cli provider remove lm-studio-default --force
provider-cli provider remove qwen-proxy-default --force
provider-cli provider remove qwen-direct-default --force
```

### Step 5: Restart Server

```bash
npm start
```

The server will detect no database providers and fall back to `.env` configuration.

## Troubleshooting

### Migration Command Not Found

**Problem**: `provider-cli migrate` command not found

**Solution**:

```bash
# Install CLI globally
npm install -g .

# Or run directly
node bin/provider-cli.js migrate
```

### Migration Fails with Database Error

**Problem**: Error accessing database during migration

**Solution**:

```bash
# Check database file exists
ls -la data/provider-router.db

# Check file permissions
chmod 644 data/provider-router.db

# Verify schema version
sqlite3 data/provider-router.db "PRAGMA user_version;"
```

### Provider Not Loading After Migration

**Problem**: Provider shows in list but not working

**Solution**:

```bash
# Reload provider
provider-cli provider reload lm-studio-default

# Check configuration
provider-cli provider config lm-studio-default

# Test connectivity
provider-cli provider test lm-studio-default
```

### Missing Configuration Keys

**Problem**: Provider config incomplete after migration

**Solution**:

```bash
# Add missing config keys manually
curl -X PATCH http://localhost:3001/v1/providers/lm-studio-default/config/timeout \
  -H "Content-Type: application/json" \
  -d '{"value": "120000"}'

# Or via API
provider-cli provider edit lm-studio-default \
  --config timeout=120000
```

### Server Won't Start After Migration

**Problem**: Server fails to start with database error

**Solution**:

```bash
# Check schema version
sqlite3 data/provider-router.db "PRAGMA user_version;"

# Run migrations
node src/database/migrations.js

# Or restore from backup
cp .env.backup.YYYYMMDD_HHMMSS .env
rm data/provider-router.db
npm start
```

### Active Provider Not Set

**Problem**: No active provider after migration

**Solution**:

```bash
# Set active provider manually
provider-cli set lm-studio-default

# Or via API
curl -X PUT http://localhost:3001/v1/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "lm-studio-default"}'
```

## Best Practices

### Do's

- ✓ Backup `.env` before migration
- ✓ Test migration on development first
- ✓ Verify connectivity after migration
- ✓ Keep `.env` backup for rollback
- ✓ Document custom configurations
- ✓ Use descriptive provider IDs
- ✓ Set appropriate priorities

### Don'ts

- ✗ Don't migrate production without testing
- ✗ Don't delete `.env` immediately
- ✗ Don't skip verification steps
- ✗ Don't use spaces in provider IDs
- ✗ Don't hardcode sensitive data
- ✗ Don't skip backups

## Migration Scenarios

### Scenario 1: Single Provider Setup

**Before**:

```bash
DEFAULT_PROVIDER=lm-studio
LM_STUDIO_BASE_URL=http://192.168.0.22:1234/v1
LM_STUDIO_DEFAULT_MODEL=qwen3-max
```

**After**:

```bash
provider-cli migrate
# Creates: lm-studio-default provider
# Sets: lm-studio-default as active
```

### Scenario 2: Multiple Provider Types

**Before**:

```bash
DEFAULT_PROVIDER=lm-studio
LM_STUDIO_BASE_URL=http://192.168.0.22:1234/v1
QWEN_PROXY_BASE_URL=http://localhost:3000
```

**After**:

```bash
provider-cli migrate
# Creates: lm-studio-default, qwen-proxy-default
# Sets: lm-studio-default as active
```

### Scenario 3: Custom Configuration

**Before**: Custom timeout in code

**After**:

```bash
provider-cli migrate
# Then add custom config:
provider-cli provider edit lm-studio-default \
  --config timeout=300000 \
  --config maxRetries=5
```

## Next Steps

After successful migration:

1. **Explore CLI**: [Managing Providers via CLI](managing-providers-via-cli.md)
2. **Use API**: [Managing Providers via API](managing-providers-via-api.md)
3. **Add Providers**: Create multiple provider instances
4. **Configure Priority**: Set up fallback routing
5. **Monitor**: Use CLI to view statistics and history

## Support

If you encounter issues during migration:

1. Check [Troubleshooting](#troubleshooting) section
2. Review server logs: `tail -f logs/provider-router.log`
3. Check database: `sqlite3 data/provider-router.db`
4. Consult [Architecture Documentation](../architecture/provider-configuration-system.md)
5. Open an issue on GitHub with migration logs

## Related Documentation

- [Provider Configuration System Architecture](../architecture/provider-configuration-system.md)
- [Provider Management API](../api/provider-management-api.md)
- [Managing Providers via CLI](managing-providers-via-cli.md)
- [Managing Providers via API](managing-providers-via-api.md)
