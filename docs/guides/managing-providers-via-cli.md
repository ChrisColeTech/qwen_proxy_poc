# Managing Providers via CLI

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Command Reference](#command-reference)
- [Common Workflows](#common-workflows)
- [Provider Commands](#provider-commands)
- [Model Commands](#model-commands)
- [Configuration Commands](#configuration-commands)
- [Query Commands](#query-commands)
- [Examples](#examples)
- [Tips and Tricks](#tips-and-tricks)
- [Troubleshooting](#troubleshooting)

## Overview

The `provider-cli` tool provides a command-line interface for managing providers, models, and configurations. It offers an alternative to the REST API for administrators and developers.

### Key Features

- Interactive provider management
- Configuration without server restart
- Real-time status monitoring
- Request history and statistics
- Color-coded output
- Tab completion support

### Prerequisites

- Node.js 18+ installed
- Provider Router installed
- Database initialized

## Installation

### Global Installation

Install CLI globally for system-wide access:

```bash
cd /path/to/provider-router
npm install -g .
```

Verify installation:

```bash
provider-cli --version
```

### Local Usage

Run CLI without global installation:

```bash
cd /path/to/provider-router
node bin/provider-cli.js --help
```

### Set Up Alias (Optional)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias pcli='provider-cli'
```

## Command Reference

### Global Options

All commands support these options:

| Option | Alias | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help for command |
| `--version` | `-v` | Show CLI version |
| `--json` | | Output in JSON format |
| `--quiet` | `-q` | Suppress non-essential output |
| `--verbose` | | Show detailed output |

### Command Structure

```bash
provider-cli [command] [subcommand] [options] [arguments]
```

Examples:

```bash
provider-cli status
provider-cli provider list
provider-cli provider add --id my-provider
provider-cli set lm-studio-default
```

## Common Workflows

### Workflow 1: Check Current Status

```bash
# Show active provider and configuration
provider-cli status

# List all providers
provider-cli list

# Test current provider connectivity
provider-cli test
```

### Workflow 2: Switch Provider

```bash
# List available providers
provider-cli list

# Switch to different provider
provider-cli set qwen-proxy-default

# Verify switch
provider-cli status
```

### Workflow 3: Add New Provider

```bash
# Add provider
provider-cli provider add \
  --id lm-studio-gpu \
  --name "LM Studio GPU Server" \
  --type lm-studio \
  --config baseURL=http://192.168.0.50:1234/v1 \
  --config defaultModel=qwen3-max

# Test connectivity
provider-cli provider test lm-studio-gpu

# Enable provider
provider-cli provider enable lm-studio-gpu

# Set as active
provider-cli set lm-studio-gpu
```

### Workflow 4: Update Configuration

```bash
# View current config
provider-cli provider config lm-studio-gpu

# Update configuration
provider-cli provider edit lm-studio-gpu \
  --config timeout=240000 \
  --config maxRetries=3

# Reload provider
provider-cli provider reload lm-studio-gpu

# Test changes
provider-cli provider test lm-studio-gpu
```

### Workflow 5: View History and Stats

```bash
# View recent requests
provider-cli history --limit 20

# Filter by provider
provider-cli history --provider lm-studio-gpu --limit 10

# View statistics
provider-cli stats

# View stats for specific provider
provider-cli stats --provider lm-studio-gpu
```

## Provider Commands

### provider list

List all providers.

**Syntax**:

```bash
provider-cli provider list [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--type <type>` | Filter by provider type |
| `--enabled` | Show only enabled providers |
| `--disabled` | Show only disabled providers |
| `--json` | Output in JSON format |

**Examples**:

```bash
# List all providers
provider-cli provider list

# List only LM Studio providers
provider-cli provider list --type lm-studio

# List enabled providers
provider-cli provider list --enabled

# JSON output
provider-cli provider list --json
```

**Output**:

```
Providers
┌──────────────────────┬──────────────────┬────────────┬─────────┬──────────┐
│ ID                   │ Name             │ Type       │ Enabled │ Priority │
├──────────────────────┼──────────────────┼────────────┼─────────┼──────────┤
│ lm-studio-default    │ LM Studio        │ lm-studio  │ ✓       │ 10       │
│ lm-studio-gpu        │ LM Studio GPU    │ lm-studio  │ ✓       │ 15       │
│ qwen-proxy-default   │ Qwen Proxy       │ qwen-proxy │ ✓       │ 5        │
└──────────────────────┴──────────────────┴────────────┴─────────┴──────────┘

Total: 3 providers (3 enabled, 0 disabled)
Active: lm-studio-gpu
```

### provider add

Create a new provider.

**Syntax**:

```bash
provider-cli provider add [options]
```

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--id <id>` | Yes | Unique provider ID (slug format) |
| `--name <name>` | Yes | Display name |
| `--type <type>` | Yes | Provider type (lm-studio, qwen-proxy, qwen-direct) |
| `--enabled` | No | Enable provider (default: true) |
| `--disabled` | No | Disable provider |
| `--priority <n>` | No | Priority (default: 0) |
| `--description <text>` | No | Provider description |
| `--config <key=value>` | No | Configuration key-value pair (repeatable) |

**Examples**:

```bash
# Basic provider
provider-cli provider add \
  --id lm-studio-local \
  --name "LM Studio Local" \
  --type lm-studio \
  --config baseURL=http://localhost:1234/v1

# Advanced provider with multiple configs
provider-cli provider add \
  --id qwen-proxy-prod \
  --name "Qwen Proxy Production" \
  --type qwen-proxy \
  --enabled \
  --priority 20 \
  --description "Production Qwen proxy server" \
  --config baseURL=http://qwen-proxy.example.com \
  --config timeout=180000 \
  --config maxRetries=3

# Disabled provider
provider-cli provider add \
  --id lm-studio-backup \
  --name "LM Studio Backup" \
  --type lm-studio \
  --disabled \
  --config baseURL=http://192.168.0.100:1234/v1
```

**Output**:

```
Creating provider...

✓ Provider created: lm-studio-local
  ID: lm-studio-local
  Name: LM Studio Local
  Type: lm-studio
  Enabled: Yes
  Priority: 0

Configuration:
  baseURL: http://localhost:1234/v1

Use 'provider-cli provider test lm-studio-local' to test connectivity
```

### provider edit

Update an existing provider.

**Syntax**:

```bash
provider-cli provider edit <provider-id> [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--name <name>` | Update display name |
| `--priority <n>` | Update priority |
| `--description <text>` | Update description |
| `--config <key=value>` | Update configuration (repeatable) |

**Examples**:

```bash
# Update name and priority
provider-cli provider edit lm-studio-local \
  --name "LM Studio Local (Updated)" \
  --priority 5

# Update configuration
provider-cli provider edit lm-studio-local \
  --config timeout=240000 \
  --config maxRetries=5

# Update description
provider-cli provider edit lm-studio-local \
  --description "Local development server"
```

**Output**:

```
Updating provider: lm-studio-local

✓ Provider updated successfully

Changes:
  name: LM Studio Local → LM Studio Local (Updated)
  priority: 0 → 5

Use 'provider-cli provider reload lm-studio-local' to apply changes
```

### provider remove

Delete a provider.

**Syntax**:

```bash
provider-cli provider remove <provider-id> [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--force` | Skip confirmation prompt |

**Examples**:

```bash
# Interactive removal (with confirmation)
provider-cli provider remove lm-studio-backup

# Force removal (no confirmation)
provider-cli provider remove lm-studio-backup --force
```

**Output**:

```
WARNING: This will permanently delete the provider and all its configuration.

Provider: lm-studio-backup (LM Studio Backup)
Type: lm-studio
Enabled: No

Are you sure you want to delete this provider? (y/N): y

✓ Provider deleted successfully
```

### provider enable

Enable a provider.

**Syntax**:

```bash
provider-cli provider enable <provider-id>
```

**Examples**:

```bash
provider-cli provider enable lm-studio-backup
```

**Output**:

```
✓ Provider enabled: lm-studio-backup

Use 'provider-cli set lm-studio-backup' to activate
```

### provider disable

Disable a provider.

**Syntax**:

```bash
provider-cli provider disable <provider-id>
```

**Examples**:

```bash
provider-cli provider disable lm-studio-backup
```

**Output**:

```
✓ Provider disabled: lm-studio-backup

Note: If this was the active provider, switch to another provider:
  provider-cli set <provider-id>
```

### provider test

Test provider connectivity.

**Syntax**:

```bash
provider-cli provider test [provider-id]
```

**Examples**:

```bash
# Test current active provider
provider-cli provider test

# Test specific provider
provider-cli provider test lm-studio-gpu
```

**Output**:

```
Testing provider: lm-studio-gpu

Connection Test:
  ✓ Connection successful
  ✓ Models endpoint accessible
  ✓ Response time: 45ms

Available Models:
  - qwen3-max
  - qwen3-coder
  - qwen3-coder-flash

Status: Healthy
```

### provider reload

Reload provider configuration from database.

**Syntax**:

```bash
provider-cli provider reload <provider-id>
```

**Examples**:

```bash
provider-cli provider reload lm-studio-gpu
```

**Output**:

```
Reloading provider: lm-studio-gpu

✓ Provider unregistered from registry
✓ Configuration loaded from database
✓ Provider instance created
✓ Provider registered successfully

Status: Ready
```

### provider config

View provider configuration.

**Syntax**:

```bash
provider-cli provider config <provider-id> [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--show-sensitive` | Show sensitive values (default: masked) |
| `--json` | Output in JSON format |

**Examples**:

```bash
# View configuration (sensitive values masked)
provider-cli provider config lm-studio-gpu

# Show sensitive values
provider-cli provider config lm-studio-gpu --show-sensitive

# JSON output
provider-cli provider config lm-studio-gpu --json
```

**Output**:

```
Configuration for: lm-studio-gpu

Provider Info:
  ID: lm-studio-gpu
  Name: LM Studio GPU Server
  Type: lm-studio
  Enabled: Yes
  Priority: 15

Configuration:
  baseURL: http://192.168.0.50:1234/v1
  defaultModel: qwen3-max
  timeout: 240000
  maxRetries: 3
  apiKey: *** (sensitive)

Last Updated: 2025-01-31 14:30:22
```

## Model Commands

### model list

List all models.

**Syntax**:

```bash
provider-cli model list [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--provider <id>` | Filter by provider |
| `--json` | Output in JSON format |

**Examples**:

```bash
# List all models
provider-cli model list

# List models for specific provider
provider-cli model list --provider lm-studio-gpu

# JSON output
provider-cli model list --json
```

**Output**:

```
Models
┌──────────────────────┬──────────────────┬──────────────────────────────┐
│ ID                   │ Name             │ Capabilities                 │
├──────────────────────┼──────────────────┼──────────────────────────────┤
│ qwen3-max            │ Qwen 3 Max       │ chat, completion, vision     │
│ qwen3-coder          │ Qwen 3 Coder     │ chat, completion, code       │
│ qwen3-coder-flash    │ Qwen 3 Coder     │ chat, completion, code       │
│                      │ Flash            │                              │
└──────────────────────┴──────────────────┴──────────────────────────────┘

Total: 3 models
```

### model add

Create a new model.

**Syntax**:

```bash
provider-cli model add [options]
```

**Options**:

| Option | Required | Description |
|--------|----------|-------------|
| `--id <id>` | Yes | Unique model ID |
| `--name <name>` | Yes | Display name |
| `--description <text>` | No | Model description |
| `--capabilities <list>` | No | Comma-separated capabilities |

**Examples**:

```bash
# Basic model
provider-cli model add \
  --id gpt-4 \
  --name "GPT-4"

# Advanced model with capabilities
provider-cli model add \
  --id claude-3 \
  --name "Claude 3 Opus" \
  --description "Most capable Claude model" \
  --capabilities "chat,completion,vision,code,tools"
```

**Output**:

```
Creating model...

✓ Model created: claude-3
  ID: claude-3
  Name: Claude 3 Opus
  Description: Most capable Claude model
  Capabilities: chat, completion, vision, code, tools

Use 'provider-cli model link <provider-id> claude-3' to link to provider
```

### model link

Link a model to a provider.

**Syntax**:

```bash
provider-cli model link <provider-id> <model-id> [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--default` | Set as default model for provider |

**Examples**:

```bash
# Link model to provider
provider-cli model link lm-studio-gpu qwen3-max

# Link and set as default
provider-cli model link lm-studio-gpu qwen3-max --default
```

**Output**:

```
Linking model...

✓ Model linked successfully
  Provider: lm-studio-gpu (LM Studio GPU Server)
  Model: qwen3-max (Qwen 3 Max)
  Default: Yes
```

### model unlink

Unlink a model from a provider.

**Syntax**:

```bash
provider-cli model unlink <provider-id> <model-id>
```

**Examples**:

```bash
provider-cli model unlink lm-studio-gpu qwen3-coder
```

**Output**:

```
✓ Model unlinked successfully
  Provider: lm-studio-gpu
  Model: qwen3-coder
```

## Configuration Commands

### set

Set the active provider.

**Syntax**:

```bash
provider-cli set <provider-id>
```

**Examples**:

```bash
# Set active provider
provider-cli set lm-studio-gpu

# Verify change
provider-cli status
```

**Output**:

```
Switching provider...

✓ Active provider changed
  Previous: lm-studio-default
  Current: lm-studio-gpu

Configuration:
  Type: lm-studio
  BaseURL: http://192.168.0.50:1234/v1
  Default Model: qwen3-max

No server restart required
```

### status

Show current provider status.

**Syntax**:

```bash
provider-cli status [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |

**Examples**:

```bash
# Show status
provider-cli status

# JSON output
provider-cli status --json
```

**Output**:

```
Provider Status

Active Provider: lm-studio-gpu (LM Studio GPU Server)
Type: lm-studio
Status: Enabled
Priority: 15
Description: LM Studio on GPU server

Configuration:
  baseURL: http://192.168.0.50:1234/v1
  defaultModel: qwen3-max
  timeout: 240000
  maxRetries: 3

Available Models:
  - qwen3-max (default)
  - qwen3-coder

Last Updated: 2025-01-31 14:30:22
Server: Running
```

## Query Commands

### list

List all providers (shortcut for `provider list`).

**Syntax**:

```bash
provider-cli list [options]
```

Alias: `ls`

**Examples**:

```bash
# List providers
provider-cli list

# Using alias
provider-cli ls
```

### test

Test current provider (shortcut for `provider test`).

**Syntax**:

```bash
provider-cli test [provider-id]
```

**Examples**:

```bash
# Test current provider
provider-cli test

# Test specific provider
provider-cli test lm-studio-gpu
```

### history

View request history.

**Syntax**:

```bash
provider-cli history [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--limit <n>` | Limit number of results (default: 50) |
| `--provider <id>` | Filter by provider |
| `--json` | Output in JSON format |

**Examples**:

```bash
# Recent history (last 50)
provider-cli history

# Last 20 requests
provider-cli history --limit 20

# Filter by provider
provider-cli history --provider lm-studio-gpu --limit 10

# JSON output
provider-cli history --json
```

**Output**:

```
Request History

┌─────────────────────┬──────────────────┬─────────────┬────────┬──────────┐
│ Timestamp           │ Provider         │ Model       │ Status │ Duration │
├─────────────────────┼──────────────────┼─────────────┼────────┼──────────┤
│ 2025-01-31 14:35:10 │ lm-studio-gpu    │ qwen3-max   │ 200    │ 1.2s     │
│ 2025-01-31 14:34:55 │ lm-studio-gpu    │ qwen3-coder │ 200    │ 0.8s     │
│ 2025-01-31 14:34:30 │ qwen-proxy       │ qwen3-max   │ 200    │ 2.1s     │
│ 2025-01-31 14:34:15 │ lm-studio-gpu    │ qwen3-max   │ 500    │ 5.0s     │
│ 2025-01-31 14:33:50 │ lm-studio-gpu    │ qwen3-max   │ 200    │ 1.5s     │
└─────────────────────┴──────────────────┴─────────────┴────────┴──────────┘

Showing 5 of 247 requests
Use --limit to see more
```

### stats

View usage statistics.

**Syntax**:

```bash
provider-cli stats [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--provider <id>` | Filter by provider |
| `--json` | Output in JSON format |

**Examples**:

```bash
# Overall statistics
provider-cli stats

# Stats for specific provider
provider-cli stats --provider lm-studio-gpu

# JSON output
provider-cli stats --json
```

**Output**:

```
Usage Statistics

Overall:
  Total Requests: 247
  Successful: 242 (98.0%)
  Failed: 5 (2.0%)
  Avg Duration: 1.4s

By Provider:
┌──────────────────┬───────────┬─────────┬────────┬──────────────┐
│ Provider         │ Requests  │ Success │ Failed │ Avg Duration │
├──────────────────┼───────────┼─────────┼────────┼──────────────┤
│ lm-studio-gpu    │ 180       │ 177     │ 3      │ 1.2s         │
│ qwen-proxy       │ 45        │ 43      │ 2      │ 2.1s         │
│ lm-studio-default│ 22        │ 22      │ 0      │ 1.0s         │
└──────────────────┴───────────┴─────────┴────────┴──────────────┘

Top Models:
  1. qwen3-max (150 requests)
  2. qwen3-coder (85 requests)
  3. qwen3-coder-flash (12 requests)

Time Period: Last 7 days
```

### migrate

Migrate from environment variables to database.

**Syntax**:

```bash
provider-cli migrate [options]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be migrated without making changes |
| `--force` | Skip confirmation prompts |

**Examples**:

```bash
# Interactive migration
provider-cli migrate

# Dry run (preview only)
provider-cli migrate --dry-run

# Force migration (no prompts)
provider-cli migrate --force
```

See [Migration Guide](migrating-from-env-to-database.md) for detailed instructions.

## Examples

### Example 1: Setting Up Multiple LM Studio Instances

```bash
# Add primary instance
provider-cli provider add \
  --id lm-studio-primary \
  --name "LM Studio Primary" \
  --type lm-studio \
  --priority 20 \
  --config baseURL=http://192.168.0.50:1234/v1 \
  --config defaultModel=qwen3-max

# Add backup instance
provider-cli provider add \
  --id lm-studio-backup \
  --name "LM Studio Backup" \
  --type lm-studio \
  --priority 10 \
  --config baseURL=http://192.168.0.51:1234/v1 \
  --config defaultModel=qwen3-max

# Link models
provider-cli model link lm-studio-primary qwen3-max --default
provider-cli model link lm-studio-backup qwen3-max --default

# Set primary as active
provider-cli set lm-studio-primary

# Test both
provider-cli provider test lm-studio-primary
provider-cli provider test lm-studio-backup
```

### Example 2: Switching Providers for Testing

```bash
# Test with LM Studio
provider-cli set lm-studio-primary
# ... run tests ...

# Switch to Qwen Proxy
provider-cli set qwen-proxy-default
# ... run tests ...

# Switch to Qwen Direct
provider-cli set qwen-direct-default
# ... run tests ...

# Compare results
provider-cli stats
```

### Example 3: Updating Configuration on the Fly

```bash
# Update timeout for long requests
provider-cli provider edit lm-studio-primary \
  --config timeout=300000

# Reload provider
provider-cli provider reload lm-studio-primary

# Test with new timeout
provider-cli provider test lm-studio-primary
```

### Example 4: Monitoring Production Usage

```bash
# Check current status
provider-cli status

# View recent activity
provider-cli history --limit 50

# Check statistics
provider-cli stats

# Test health
provider-cli provider test
```

## Tips and Tricks

### Use Aliases for Frequent Commands

Add to `~/.bashrc`:

```bash
alias pcli='provider-cli'
alias pstatus='provider-cli status'
alias plist='provider-cli list'
alias phist='provider-cli history'
alias pstats='provider-cli stats'
```

### JSON Output for Scripting

```bash
# Get provider list as JSON
provider-cli provider list --json | jq '.providers[] | select(.enabled == true)'

# Get stats as JSON
provider-cli stats --json | jq '.overall.total_requests'
```

### Quick Health Check Script

```bash
#!/bin/bash
# check-providers.sh

for provider in $(provider-cli list --json | jq -r '.providers[].id'); do
  echo "Testing $provider..."
  provider-cli provider test $provider
done
```

### Watch Command for Monitoring

```bash
# Watch status (refresh every 2 seconds)
watch -n 2 provider-cli status

# Watch recent requests
watch -n 5 'provider-cli history --limit 10'
```

## Troubleshooting

### Command Not Found

**Problem**: `provider-cli: command not found`

**Solution**:

```bash
# Install globally
npm install -g .

# Or use full path
node /path/to/provider-router/bin/provider-cli.js

# Or create alias
alias provider-cli='node /path/to/provider-router/bin/provider-cli.js'
```

### Database Connection Error

**Problem**: `Error: unable to open database file`

**Solution**:

```bash
# Check database file exists
ls -la data/provider-router.db

# Check permissions
chmod 644 data/provider-router.db

# Verify working directory
cd /path/to/provider-router
```

### Provider Not Found

**Problem**: `Error: Provider not found: lm-studio-gpu`

**Solution**:

```bash
# List all providers
provider-cli list

# Check provider ID (case-sensitive)
provider-cli provider list --json | jq -r '.providers[].id'
```

### Invalid Configuration

**Problem**: Provider added but not working

**Solution**:

```bash
# View configuration
provider-cli provider config lm-studio-gpu

# Test connectivity
provider-cli provider test lm-studio-gpu

# Check required config keys
# LM Studio requires: baseURL
# Qwen Proxy requires: baseURL
# Qwen Direct requires: token, cookies
```

### Permission Denied

**Problem**: `Error: EACCES: permission denied`

**Solution**:

```bash
# Fix file permissions
chmod 644 data/provider-router.db
chmod 755 data/

# Or run with sudo (not recommended)
sudo provider-cli ...
```

## Related Documentation

- [Provider Management API](../api/provider-management-api.md)
- [Managing Providers via API](managing-providers-via-api.md)
- [Migrating from ENV to Database](migrating-from-env-to-database.md)
- [Provider Configuration System Architecture](../architecture/provider-configuration-system.md)
