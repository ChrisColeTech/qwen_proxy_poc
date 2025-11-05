# Provider Router Implementation Plan

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | HIGH | ✅ Complete | Project setup, dependencies, configuration system |
| Phase 2 | HIGH | ✅ Complete | Provider abstraction interface and base provider |
| Phase 3 | HIGH | ✅ Complete | LM Studio provider implementation |
| Phase 4 | HIGH | ✅ Complete | Qwen Proxy provider implementation |
| Phase 5 | MEDIUM | ✅ Complete | Direct Qwen provider implementation |
| Phase 6 | HIGH | ✅ Complete | Request router and provider selection logic |
| Phase 7 | HIGH | ✅ Complete | Express server and API endpoints |
| Phase 8 | MEDIUM | ⚠️ Partial | Logging, monitoring, and error handling |
| Phase 9 | LOW | Not Started | Testing and validation |

---

## Overview

The **Provider Router** (test-wrapper) is a lightweight HTTP proxy that provides a unified OpenAI-compatible API interface while allowing dynamic routing to different LLM providers. This enables testing the same test client against multiple backends without code changes.

**Key Requirements:**
- Run on port 3001
- Accept OpenAI-compatible API requests
- Route to configurable providers (LM Studio, Qwen Proxy, Direct Qwen)
- Support multiple models (qwen3-max, qwen3-coder, qwen3-coder-flash)
- Provider selection via configuration
- Maintain request/response format compatibility
- Minimal transformation overhead

**Why This Matters:**
The test client sends identical requests regardless of backend. The provider router abstracts the backend, enabling:
1. Testing LM Studio local models vs Qwen API
2. Comparing Qwen Proxy transformations vs direct API
3. A/B testing different models
4. Easy provider switching without client code changes

---

## Architecture Decisions

### Provider Abstraction

**Pattern:** Strategy Pattern
- Each provider implements a common interface
- Router selects provider based on configuration
- Providers handle their own request/response transformations

**Why:** Allows adding new providers without changing core routing logic

### Configuration-Driven Routing

**Approach:** Environment variables + runtime configuration
- Default provider set via `.env`
- Override via request headers (for testing)
- Model-to-provider mapping

**Why:** Flexibility for testing different scenarios without server restarts

### Pass-Through Philosophy

**Design:** Minimal transformation, maximum compatibility
- Accept OpenAI format requests
- Pass through to provider with minimal changes
- Preserve response format when possible
- Only transform when provider requires it

**Why:** Reduces bugs, maintains compatibility with test client

### Technology Stack

**Core:**
- Express.js - HTTP server (battle-tested, minimal)
- axios - HTTP client (supports streaming)
- dotenv - Configuration
- Node.js ESM - Modern module system

**Why:** Same stack as test client, proven compatibility

---

## Project Structure

```
backend/provider-router/
├── src/
│   ├── index.js                    # Server entry point
│   ├── config.js                   # Configuration loader
│   ├── server.js                   # Express app setup
│   ├── providers/
│   │   ├── base-provider.js        # Abstract base class
│   │   ├── lm-studio-provider.js   # LM Studio implementation
│   │   ├── qwen-proxy-provider.js  # Qwen Proxy implementation
│   │   ├── qwen-direct-provider.js # Direct Qwen API implementation
│   │   └── index.js                # Provider registry
│   ├── router/
│   │   ├── provider-router.js      # Request routing logic
│   │   └── model-mapping.js        # Model-to-provider mapping
│   ├── middleware/
│   │   ├── request-logger.js       # Request/response logging
│   │   ├── error-handler.js        # Error handling middleware
│   │   └── cors.js                 # CORS configuration
│   └── utils/
│       ├── logger.js               # Logging utility
│       └── stream-transformer.js   # SSE stream handling
├── tests/
│   └── integration/
│       ├── lm-studio.test.js
│       ├── qwen-proxy.test.js
│       └── routing.test.js
├── .env.example
├── package.json
└── README.md
```

---

## Phase 1: Project Setup, Dependencies, Configuration System

**Priority:** HIGH

**Goal:** Initialize project with correct dependencies and configuration system that supports multiple providers.

### Files to Create

- `package.json` - Project manifest with dependencies
- `.env.example` - Environment variable template
- `.env` - Actual configuration (gitignored)
- `src/config.js` - Configuration loader and validator
- `README.md` - Project documentation
- `.gitignore` - Git ignore rules

### Files to Modify

None (new project)

### Integration Points

- Test client at `/mnt/d/Projects/qwen_proxy_opencode/backend/test-client/` - Will connect to this router
- LM Studio at `http://192.168.0.22:1234/v1` - Target provider
- Qwen Proxy at `http://localhost:3000` - Target provider

### Implementation Details

#### Create package.json

```json
{
  "name": "qwen-provider-router",
  "version": "1.0.0",
  "description": "Provider abstraction router for testing multiple LLM backends",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "node --test tests/**/*.test.js"
  },
  "keywords": [
    "llm",
    "router",
    "provider",
    "qwen",
    "lm-studio"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.4.7",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/node": "^22.10.2"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

#### Create .env.example

```bash
# Server Configuration
PORT=3001
HOST=0.0.0.0

# Default Provider
# Options: lm-studio, qwen-proxy, qwen-direct
DEFAULT_PROVIDER=lm-studio

# LM Studio Configuration
LM_STUDIO_BASE_URL=http://192.168.0.22:1234/v1
LM_STUDIO_DEFAULT_MODEL=qwen3-max

# Qwen Proxy Configuration
QWEN_PROXY_BASE_URL=http://localhost:3000

# Qwen Direct API Configuration
QWEN_API_KEY=your-qwen-api-key-here
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# Model Mapping (model_name:provider)
# Override default provider for specific models
MODEL_MAPPINGS=qwen3-coder:lm-studio,qwen3-coder-flash:lm-studio,qwen3-max:lm-studio

# Logging
LOG_LEVEL=info
# Options: debug, info, warn, error
LOG_REQUESTS=true
LOG_RESPONSES=false

# Request Settings
REQUEST_TIMEOUT=120000
# 2 minutes default timeout
```

#### Create src/config.js

```javascript
/**
 * Configuration Module
 * Loads and validates configuration from environment variables
 */

import { config as loadEnv } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
loadEnv({ path: join(__dirname, '../.env') })

/**
 * Application Configuration
 */
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
  },

  // Provider Configuration
  providers: {
    default: process.env.DEFAULT_PROVIDER || 'lm-studio',

    lmStudio: {
      baseURL: process.env.LM_STUDIO_BASE_URL || 'http://192.168.0.22:1234/v1',
      defaultModel: process.env.LM_STUDIO_DEFAULT_MODEL || 'qwen3-max',
    },

    qwenProxy: {
      baseURL: process.env.QWEN_PROXY_BASE_URL || 'http://localhost:3000',
    },

    qwenDirect: {
      apiKey: process.env.QWEN_API_KEY || null,
      baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
  },

  // Model Mapping
  modelMappings: parseModelMappings(process.env.MODEL_MAPPINGS),

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logRequests: process.env.LOG_REQUESTS === 'true',
    logResponses: process.env.LOG_RESPONSES === 'true',
  },

  // Request Settings
  request: {
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 120000,
  },
}

/**
 * Parse model mappings from env string
 * Format: "model1:provider1,model2:provider2"
 */
function parseModelMappings(mappingsStr) {
  if (!mappingsStr) return {}

  const mappings = {}
  const pairs = mappingsStr.split(',')

  for (const pair of pairs) {
    const [model, provider] = pair.split(':')
    if (model && provider) {
      mappings[model.trim()] = provider.trim()
    }
  }

  return mappings
}

/**
 * Validate required configuration
 */
export function validateConfig() {
  const errors = []

  // Validate port
  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    errors.push(`Invalid PORT: ${config.server.port}. Must be between 1-65535`)
  }

  // Validate default provider
  const validProviders = ['lm-studio', 'qwen-proxy', 'qwen-direct']
  if (!validProviders.includes(config.providers.default)) {
    errors.push(`Invalid DEFAULT_PROVIDER: ${config.providers.default}. Must be one of: ${validProviders.join(', ')}`)
  }

  // Validate Qwen Direct API key if that provider is used
  if (config.providers.default === 'qwen-direct' && !config.providers.qwenDirect.apiKey) {
    errors.push('QWEN_API_KEY is required when DEFAULT_PROVIDER=qwen-direct')
  }

  // Validate log level
  const validLogLevels = ['debug', 'info', 'warn', 'error']
  if (!validLogLevels.includes(config.logging.level)) {
    errors.push(`Invalid LOG_LEVEL: ${config.logging.level}. Must be one of: ${validLogLevels.join(', ')}`)
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`)
  }

  return true
}

/**
 * Get provider for a specific model
 */
export function getProviderForModel(model) {
  // Check explicit model mapping first
  if (config.modelMappings[model]) {
    return config.modelMappings[model]
  }

  // Use default provider
  return config.providers.default
}

export default config
```

#### Create README.md

```markdown
# Qwen Provider Router

A lightweight HTTP proxy that provides a unified OpenAI-compatible API interface while routing requests to different LLM providers.

## Purpose

- Test the same client against multiple LLM backends
- Compare LM Studio local models vs Qwen Proxy vs Direct Qwen API
- A/B test different models without client code changes
- Provider abstraction for testing and development

## Architecture

```
Test Client (port 3000 client)
         ↓
Provider Router (port 3001) ← You are here
         ↓
    ┌────┴────┬──────────┐
    ↓         ↓          ↓
LM Studio  Qwen Proxy  Qwen API
(192.168.  (localhost  (dashscope.
0.22:1234) :3000)      aliyuncs.com)
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Start router
npm start
```

Router will listen on http://localhost:3001

## Configuration

Edit `.env`:

### Server Settings
- `PORT` - Server port (default: 3001)
- `HOST` - Bind address (default: 0.0.0.0)

### Provider Selection
- `DEFAULT_PROVIDER` - Default provider (lm-studio, qwen-proxy, qwen-direct)
- `MODEL_MAPPINGS` - Map specific models to providers

### LM Studio
- `LM_STUDIO_BASE_URL` - LM Studio endpoint
- `LM_STUDIO_DEFAULT_MODEL` - Default model name

### Qwen Proxy
- `QWEN_PROXY_BASE_URL` - Qwen proxy endpoint

### Qwen Direct
- `QWEN_API_KEY` - Qwen API key
- `QWEN_BASE_URL` - Qwen API endpoint

## Usage

Point your test client to `http://localhost:3001`:

```bash
# In test client .env
PROXY_BASE_URL=http://localhost:3001
```

The router will automatically route to the configured provider.

### Model-Specific Routing

```bash
# In .env
DEFAULT_PROVIDER=lm-studio
MODEL_MAPPINGS=qwen3-coder:lm-studio,qwen3-max:qwen-proxy
```

Now:
- `qwen3-coder` → LM Studio
- `qwen3-max` → Qwen Proxy
- Other models → LM Studio (default)

## API Endpoints

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

Accepts standard OpenAI format:
```json
{
  "model": "qwen3-max",
  "messages": [...],
  "tools": [...],
  "stream": false
}
```

### GET /v1/models

List available models (proxied from active provider).

### GET /health

Health check endpoint.

## Development

```bash
# Watch mode (auto-reload)
npm run dev

# Run tests
npm test
```

## Provider Support

### LM Studio
- ✅ Chat completions
- ✅ Streaming
- ✅ Tool calling (if model supports)
- ✅ Model listing

### Qwen Proxy
- ✅ Chat completions
- ✅ Streaming
- ✅ Tool calling (with XML transformation)
- ✅ Model listing

### Qwen Direct API
- ✅ Chat completions
- ✅ Streaming
- ✅ Tool calling
- ✅ Model listing

## Troubleshooting

**Connection refused to LM Studio:**
- Ensure LM Studio server is running
- Check `LM_STUDIO_BASE_URL` is correct
- Verify LM Studio is listening on 0.0.0.0 (not just 127.0.0.1)

**Tool calling not working:**
- Check if model supports tool calling
- Qwen models require tool definitions in specific format
- Review provider-specific transformations

**Timeout errors:**
- Increase `REQUEST_TIMEOUT` in .env
- Check backend provider is responding
- Review backend logs for errors

## Testing

```bash
# Test router is working
curl http://localhost:3001/health

# Test LM Studio connection
curl http://localhost:3001/v1/models

# Test chat completion
curl http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```
```

#### Create .gitignore

```
# Dependencies
node_modules/
package-lock.json

# Environment
.env

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### Validation

- `npm install` completes without errors
- Configuration loads correctly
- `validateConfig()` accepts valid configuration
- `validateConfig()` rejects invalid configuration
- `getProviderForModel()` returns correct provider for mapped models
- `getProviderForModel()` returns default provider for unmapped models

---

## Phase 2: Provider Abstraction Interface and Base Provider

**Priority:** HIGH

**Goal:** Create abstract base provider class that defines the interface all providers must implement, ensuring consistency across providers.

### Files to Create

- `src/providers/base-provider.js` - Abstract base class
- `src/providers/index.js` - Provider registry
- `src/utils/logger.js` - Logging utility (shared across providers)

### Files to Modify

None

### Integration Points

- `src/config.js` - Providers use configuration
- Future provider implementations will extend base class

### Implementation Details

#### Create src/utils/logger.js

```javascript
/**
 * Logger Utility
 * Provides formatted logging with levels
 */

import config from '../config.js'

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
}

class Logger {
  constructor() {
    this.level = LEVELS[config.logging.level] || LEVELS.info
  }

  timestamp() {
    return new Date().toISOString()
  }

  shouldLog(level) {
    return LEVELS[level] >= this.level
  }

  format(level, message, data) {
    const color = COLORS[level]
    const reset = COLORS.reset
    const timestamp = this.timestamp()
    const prefix = `${color}[${level.toUpperCase()}] ${timestamp}${reset}`

    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`
    }
    return `${prefix} ${message}`
  }

  debug(message, data) {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, data))
    }
  }

  info(message, data) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, data))
    }
  }

  warn(message, data) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, data))
    }
  }

  error(message, error) {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(this.format('error', message))
        console.error(error.stack)
      } else {
        console.error(this.format('error', message, error))
      }
    }
  }

  request(method, url, provider) {
    if (this.shouldLog('info') && config.logging.logRequests) {
      this.info(`${method} ${url} → ${provider}`)
    }
  }

  response(status, provider) {
    if (this.shouldLog('info') && config.logging.logResponses) {
      this.info(`← ${status} from ${provider}`)
    }
  }
}

export const logger = new Logger()
export default logger
```

#### Create src/providers/base-provider.js

```javascript
/**
 * Base Provider Class
 * Abstract class defining the interface all providers must implement
 */

export class BaseProvider {
  constructor(name, config) {
    this.name = name
    this.config = config

    if (this.constructor === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly')
    }
  }

  /**
   * Send chat completion request
   * @param {Object} request - OpenAI-compatible chat completion request
   * @param {boolean} stream - Whether to stream the response
   * @returns {Promise<Object>} - Chat completion response
   */
  async chatCompletion(request, stream = false) {
    throw new Error('chatCompletion() must be implemented by provider')
  }

  /**
   * List available models
   * @returns {Promise<Array>} - Array of model objects
   */
  async listModels() {
    throw new Error('listModels() must be implemented by provider')
  }

  /**
   * Transform request to provider-specific format
   * @param {Object} request - OpenAI-compatible request
   * @returns {Object} - Provider-specific request
   */
  transformRequest(request) {
    // Default: pass through unchanged
    // Override in subclass if transformation needed
    return request
  }

  /**
   * Transform response to OpenAI-compatible format
   * @param {Object} response - Provider-specific response
   * @returns {Object} - OpenAI-compatible response
   */
  transformResponse(response) {
    // Default: pass through unchanged
    // Override in subclass if transformation needed
    return response
  }

  /**
   * Health check for provider
   * @returns {Promise<boolean>} - true if provider is healthy
   */
  async healthCheck() {
    try {
      await this.listModels()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get provider name
   */
  getName() {
    return this.name
  }

  /**
   * Get provider configuration
   */
  getConfig() {
    return this.config
  }
}
```

#### Create src/providers/index.js

```javascript
/**
 * Provider Registry
 * Central registry for all provider implementations
 */

import { logger } from '../utils/logger.js'
import config from '../config.js'

// Provider instances will be registered here
const providers = new Map()

/**
 * Register a provider
 */
export function registerProvider(name, provider) {
  if (providers.has(name)) {
    logger.warn(`Provider ${name} already registered, overwriting`)
  }
  providers.set(name, provider)
  logger.debug(`Registered provider: ${name}`)
}

/**
 * Get a provider by name
 */
export function getProvider(name) {
  const provider = providers.get(name)
  if (!provider) {
    throw new Error(`Provider not found: ${name}`)
  }
  return provider
}

/**
 * Get all registered providers
 */
export function getAllProviders() {
  return Array.from(providers.values())
}

/**
 * Get all provider names
 */
export function getProviderNames() {
  return Array.from(providers.keys())
}

/**
 * Check if provider exists
 */
export function hasProvider(name) {
  return providers.has(name)
}

/**
 * Get default provider
 */
export function getDefaultProvider() {
  const defaultName = config.providers.default
  return getProvider(defaultName)
}

/**
 * Initialize all providers
 * This will be called after all provider implementations are imported
 */
export async function initializeProviders() {
  logger.info('Initializing providers...')

  const providerList = getAllProviders()

  for (const provider of providerList) {
    try {
      const healthy = await provider.healthCheck()
      if (healthy) {
        logger.info(`✓ Provider ${provider.getName()} initialized successfully`)
      } else {
        logger.warn(`⚠ Provider ${provider.getName()} health check failed`)
      }
    } catch (error) {
      logger.error(`✗ Provider ${provider.getName()} initialization failed:`, error)
    }
  }

  logger.info(`Registered providers: ${getProviderNames().join(', ')}`)
}
```

### Validation

- `BaseProvider` cannot be instantiated directly (throws error)
- `BaseProvider` requires subclasses to implement `chatCompletion()` and `listModels()`
- Provider registry can register and retrieve providers
- `getDefaultProvider()` returns correct provider based on config
- Logger outputs with correct colors and levels
- Logger respects `LOG_REQUESTS` and `LOG_RESPONSES` settings

---

## Phase 3: LM Studio Provider Implementation

**Priority:** HIGH

**Goal:** Implement LM Studio provider that connects to local LM Studio instance and handles OpenAI-compatible requests.

### Files to Create

- `src/providers/lm-studio-provider.js` - LM Studio provider implementation

### Files to Modify

- `src/providers/index.js` - Import and register LM Studio provider

### Integration Points

- `src/providers/base-provider.js` - Extends base class
- `src/config.js` - Uses LM Studio configuration
- LM Studio server at `http://192.168.0.22:1234/v1`

### Implementation Details

#### Create src/providers/lm-studio-provider.js

```javascript
/**
 * LM Studio Provider
 * Connects to local LM Studio instance via OpenAI-compatible API
 */

import axios from 'axios'
import { BaseProvider } from './base-provider.js'
import { logger } from '../utils/logger.js'
import config from '../config.js'

export class LMStudioProvider extends BaseProvider {
  constructor() {
    super('lm-studio', config.providers.lmStudio)
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: config.request.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Send chat completion request to LM Studio
   */
  async chatCompletion(request, stream = false) {
    try {
      logger.debug('LM Studio request:', request)

      const response = await this.client.post('/chat/completions', {
        ...request,
        stream,
      }, {
        responseType: stream ? 'stream' : 'json',
      })

      if (stream) {
        // Return stream directly for streaming responses
        return response.data
      } else {
        logger.debug('LM Studio response:', response.data)
        return response.data
      }
    } catch (error) {
      logger.error('LM Studio request failed:', error)
      throw this.transformError(error)
    }
  }

  /**
   * List available models from LM Studio
   */
  async listModels() {
    try {
      const response = await this.client.get('/models')
      return response.data
    } catch (error) {
      logger.error('LM Studio list models failed:', error)
      throw this.transformError(error)
    }
  }

  /**
   * Transform axios errors to standard format
   */
  transformError(error) {
    if (error.response) {
      // Server responded with error
      return {
        error: {
          message: error.response.data?.error?.message || error.message,
          type: 'provider_error',
          provider: this.name,
          status: error.response.status,
        },
      }
    } else if (error.request) {
      // No response received
      return {
        error: {
          message: `LM Studio connection failed: ${error.message}`,
          type: 'connection_error',
          provider: this.name,
        },
      }
    } else {
      // Request setup error
      return {
        error: {
          message: error.message,
          type: 'request_error',
          provider: this.name,
        },
      }
    }
  }

  /**
   * LM Studio uses OpenAI format, no transformation needed
   */
  transformRequest(request) {
    return request
  }

  /**
   * LM Studio returns OpenAI format, no transformation needed
   */
  transformResponse(response) {
    return response
  }
}

// Create and export instance
export const lmStudioProvider = new LMStudioProvider()
```

#### Update src/providers/index.js

Add at top of file:
```javascript
import { lmStudioProvider } from './lm-studio-provider.js'

// Register LM Studio provider
registerProvider('lm-studio', lmStudioProvider)
```

### Validation

- Can connect to LM Studio at configured URL
- `listModels()` returns available models
- `chatCompletion()` sends requests and receives responses
- Error handling works for connection failures
- Streaming responses are passed through correctly
- No transformation applied (OpenAI format preserved)

---

## Phase 4: Qwen Proxy Provider Implementation

**Priority:** HIGH

**Goal:** Implement Qwen Proxy provider that connects to the Qwen proxy server (port 3000) and handles tool calling transformations.

### Files to Create

- `src/providers/qwen-proxy-provider.js` - Qwen Proxy provider implementation

### Files to Modify

- `src/providers/index.js` - Import and register Qwen Proxy provider

### Integration Points

- `src/providers/base-provider.js` - Extends base class
- `src/config.js` - Uses Qwen Proxy configuration
- Qwen Proxy server at `http://localhost:3000`

### Implementation Details

Similar structure to LM Studio provider, but connecting to Qwen Proxy.

```javascript
/**
 * Qwen Proxy Provider
 * Connects to Qwen proxy server (handles XML tool transformations)
 */

import axios from 'axios'
import { BaseProvider } from './base-provider.js'
import { logger } from '../utils/logger.js'
import config from '../config.js'

export class QwenProxyProvider extends BaseProvider {
  constructor() {
    super('qwen-proxy', config.providers.qwenProxy)
    this.client = axios.create({
      baseURL: `${this.config.baseURL}/v1`,
      timeout: config.request.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async chatCompletion(request, stream = false) {
    try {
      logger.debug('Qwen Proxy request:', request)

      const response = await this.client.post('/chat/completions', {
        ...request,
        stream,
      }, {
        responseType: stream ? 'stream' : 'json',
      })

      if (stream) {
        return response.data
      } else {
        logger.debug('Qwen Proxy response:', response.data)
        return response.data
      }
    } catch (error) {
      logger.error('Qwen Proxy request failed:', error)
      throw this.transformError(error)
    }
  }

  async listModels() {
    try {
      const response = await this.client.get('/models')
      return response.data
    } catch (error) {
      logger.error('Qwen Proxy list models failed:', error)
      throw this.transformError(error)
    }
  }

  transformError(error) {
    if (error.response) {
      return {
        error: {
          message: error.response.data?.error?.message || error.message,
          type: 'provider_error',
          provider: this.name,
          status: error.response.status,
        },
      }
    } else if (error.request) {
      return {
        error: {
          message: `Qwen Proxy connection failed: ${error.message}`,
          type: 'connection_error',
          provider: this.name,
        },
      }
    } else {
      return {
        error: {
          message: error.message,
          type: 'request_error',
          provider: this.name,
        },
      }
    }
  }

  // Qwen Proxy handles transformations internally, pass through
  transformRequest(request) {
    return request
  }

  transformResponse(response) {
    return response
  }
}

export const qwenProxyProvider = new QwenProxyProvider()
```

### Validation

- Can connect to Qwen Proxy at `http://localhost:3000`
- `listModels()` returns available models
- `chatCompletion()` sends requests and receives responses
- Tool calling requests are handled correctly (proxy does transformation)
- Error handling works
- Streaming works

---

## Phase 5: Direct Qwen Provider Implementation

**Priority:** MEDIUM

**Goal:** Implement Direct Qwen API provider that connects directly to Qwen's API (bypassing the proxy).

### Files to Create

- `src/providers/qwen-direct-provider.js` - Direct Qwen API provider

### Files to Modify

- `src/providers/index.js` - Import and register Direct Qwen provider

### Integration Points

- `src/providers/base-provider.js` - Extends base class
- `src/config.js` - Uses Qwen Direct configuration
- Qwen API at `https://dashscope.aliyuncs.com/compatible-mode/v1`

### Implementation Details

Similar to LM Studio provider but requires API key authentication.

### Validation

- Can authenticate with Qwen API using API key
- `listModels()` returns Qwen models
- `chatCompletion()` works with Qwen API
- Error handling for authentication failures
- Rate limiting handling

---

## Phase 6: Request Router and Provider Selection Logic

**Priority:** HIGH

**Goal:** Implement routing logic that selects the correct provider based on configuration and model name.

### Files to Create

- `src/router/provider-router.js` - Main routing logic
- `src/router/model-mapping.js` - Model-to-provider mapping

### Files to Modify

None

### Integration Points

- `src/providers/index.js` - Gets providers from registry
- `src/config.js` - Uses model mappings configuration

### Implementation Details

```javascript
/**
 * Provider Router
 * Routes requests to appropriate provider based on configuration
 */

import { getProvider } from '../providers/index.js'
import { getProviderForModel } from '../config.js'
import { logger } from '../utils/logger.js'

export class ProviderRouter {
  /**
   * Route request to appropriate provider
   */
  async route(request, stream = false) {
    // Determine which provider to use
    const providerName = this.selectProvider(request)
    logger.info(`Routing request to provider: ${providerName}`)

    // Get provider instance
    const provider = getProvider(providerName)

    // Transform request if needed
    const transformedRequest = provider.transformRequest(request)

    // Send request to provider
    const response = await provider.chatCompletion(transformedRequest, stream)

    // Transform response if needed
    if (!stream) {
      return provider.transformResponse(response)
    } else {
      return response // Streaming responses returned as-is
    }
  }

  /**
   * Select provider based on model name
   */
  selectProvider(request) {
    const model = request.model

    if (!model) {
      logger.warn('No model specified in request, using default provider')
      return config.providers.default
    }

    // Get provider for this model
    return getProviderForModel(model)
  }

  /**
   * List models from specific provider
   */
  async listModels(providerName = null) {
    if (providerName) {
      const provider = getProvider(providerName)
      return provider.listModels()
    } else {
      // List models from default provider
      const defaultProvider = getProvider(config.providers.default)
      return defaultProvider.listModels()
    }
  }
}

export const providerRouter = new ProviderRouter()
```

### Validation

- Correctly routes to default provider when no model specified
- Routes to mapped provider for specific models
- Falls back to default provider for unmapped models
- Error handling when provider not found

---

## Phase 7: Express Server and API Endpoints

**Priority:** HIGH

**Goal:** Create Express server with OpenAI-compatible API endpoints.

### Files to Create

- `src/server.js` - Express app setup
- `src/index.js` - Server entry point
- `src/middleware/cors.js` - CORS configuration
- `src/middleware/request-logger.js` - Request logging
- `src/middleware/error-handler.js` - Error handling

### Files to Modify

None

### Integration Points

- `src/router/provider-router.js` - Routes requests
- `src/config.js` - Server configuration
- Test client will connect to these endpoints

### Implementation Details

Express server with:
- `POST /v1/chat/completions` - Chat endpoint
- `GET /v1/models` - List models
- `GET /health` - Health check
- CORS support
- Request logging
- Error handling

### Validation

- Server starts on correct port
- Endpoints respond correctly
- CORS headers present
- Errors handled gracefully
- Streaming works

---

## Phase 8: Logging, Monitoring, and Error Handling

**Priority:** MEDIUM

**Goal:** Add comprehensive logging and error handling.

### Files to Create

- `src/middleware/request-logger.js` - Request/response logging
- `src/middleware/error-handler.js` - Centralized error handling

### Files to Modify

- `src/server.js` - Add logging and error middleware

### Validation

- All requests logged
- Errors logged with stack traces
- Performance metrics collected

---

## Phase 9: Testing and Validation

**Priority:** LOW

**Goal:** Add integration tests for all providers.

### Files to Create

- `tests/integration/lm-studio.test.js`
- `tests/integration/qwen-proxy.test.js`
- `tests/integration/routing.test.js`

### Validation

- All providers tested
- Routing logic tested
- Error handling tested

---

## Implementation Notes

### Critical Design Decisions

1. **Pass-Through Architecture**: Minimal transformation keeps compatibility high
2. **Provider Strategy Pattern**: Easy to add new providers
3. **Configuration-Driven**: No code changes needed to switch providers
4. **Streaming Support**: First-class streaming support for all providers

### Testing Strategy

1. Unit test each provider independently
2. Integration test routing logic
3. End-to-end test with actual test client
4. Compare outputs across providers

### Performance Considerations

- Connection pooling for providers
- Request timeout handling
- Streaming response buffering
- Error retry logic (optional)

---

## Document Version

- **Version:** 1.0
- **Date:** 2025-10-30
- **Status:** APPROVED - Ready for Implementation

---

**This implementation plan provides complete specifications for building a provider router that enables testing multiple LLM backends with a single test client.**
