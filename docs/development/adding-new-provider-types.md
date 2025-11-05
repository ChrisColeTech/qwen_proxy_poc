# Adding New Provider Types

## Table of Contents

- [Overview](#overview)
- [Provider Architecture](#provider-architecture)
- [Implementation Steps](#implementation-steps)
- [Provider Interface Requirements](#provider-interface-requirements)
- [Example Implementation](#example-implementation)
- [Testing Your Provider](#testing-your-provider)
- [Integration Steps](#integration-steps)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

This guide walks you through adding support for a new LLM provider to the Provider Router system. By following these steps, you'll integrate your provider with the existing architecture and enable users to configure and manage it through the CLI and API.

### When to Add a New Provider

- Supporting a new LLM service (e.g., OpenAI, Anthropic, Groq)
- Creating a custom provider for specialized use cases
- Integrating with proprietary LLM backends
- Wrapping existing providers with custom logic

### Prerequisites

- Understanding of JavaScript/Node.js
- Familiarity with async/await patterns
- Knowledge of HTTP APIs and REST
- Basic understanding of the provider router architecture

## Provider Architecture

### BaseProvider Abstract Class

All providers must extend the `BaseProvider` class:

```javascript
// src/providers/base-provider.js
class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = config.name || 'Unknown Provider';
    this.type = this.getType();
  }

  // Abstract methods to implement
  async chatCompletion(request) { throw new Error('Not implemented'); }
  async listModels() { throw new Error('Not implemented'); }
  async healthCheck() { throw new Error('Not implemented'); }

  // Utility methods (can override)
  getType() { return 'base'; }
  transformRequest(request) { return request; }
  transformResponse(response) { return response; }
}
```

### Provider Lifecycle

```
1. Provider Created (from database config)
2. Provider Registered (added to registry)
3. Provider Ready (can handle requests)
4. Provider Reloaded (config changed)
5. Provider Unregistered (removed from registry)
```

### Required Methods

| Method | Description | Required |
|--------|-------------|----------|
| `chatCompletion(request)` | Handle chat completion requests | Yes |
| `listModels()` | Return available models | Yes |
| `healthCheck()` | Test provider connectivity | Yes |
| `getType()` | Return provider type string | Yes |
| `transformRequest(request)` | Transform incoming requests | No |
| `transformResponse(response)` | Transform outgoing responses | No |

## Implementation Steps

### Step 1: Create Provider File

Create a new provider file in `src/providers/`:

```bash
touch src/providers/my-provider.js
```

### Step 2: Import Dependencies

```javascript
// src/providers/my-provider.js
const axios = require('axios');
const BaseProvider = require('./base-provider');
const logger = require('../utils/logger');
```

### Step 3: Define Provider Class

```javascript
class MyProvider extends BaseProvider {
  constructor(config) {
    super(config);

    // Validate required configuration
    if (!config.baseURL) {
      throw new Error('baseURL is required for MyProvider');
    }

    // Initialize HTTP client
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 120000,
      headers: {
        'Content-Type': 'application/json',
        // Add custom headers
      }
    });

    // Set API key if provided
    if (config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
    }

    logger.info(`MyProvider initialized: ${config.baseURL}`);
  }

  getType() {
    return 'my-provider';
  }

  // Implement required methods...
}

module.exports = MyProvider;
```

### Step 4: Implement chatCompletion

```javascript
async chatCompletion(request) {
  try {
    logger.info('MyProvider: chat completion request', {
      model: request.model,
      messages: request.messages?.length
    });

    // Transform request to provider format
    const providerRequest = this.transformRequest(request);

    // Make API call
    const response = await this.client.post('/chat/completions', providerRequest);

    // Transform response to OpenAI format
    const openAIResponse = this.transformResponse(response.data);

    return openAIResponse;
  } catch (error) {
    logger.error('MyProvider: chat completion failed', {
      error: error.message,
      status: error.response?.status
    });

    throw new Error(`MyProvider chat completion failed: ${error.message}`);
  }
}
```

### Step 5: Implement listModels

```javascript
async listModels() {
  try {
    const response = await this.client.get('/models');

    // Transform to OpenAI models format
    const models = response.data.models.map(model => ({
      id: model.id,
      object: 'model',
      created: model.created || Date.now() / 1000,
      owned_by: 'my-provider'
    }));

    return {
      object: 'list',
      data: models
    };
  } catch (error) {
    logger.error('MyProvider: list models failed', { error: error.message });
    throw error;
  }
}
```

### Step 6: Implement healthCheck

```javascript
async healthCheck() {
  try {
    const response = await this.client.get('/health');

    return {
      status: 'healthy',
      responseTimeMs: response.headers['x-response-time'] || null,
      details: {
        version: response.data.version,
        uptime: response.data.uptime
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      details: {
        baseURL: this.config.baseURL
      }
    };
  }
}
```

### Step 7: Implement Request Transformation (Optional)

```javascript
transformRequest(request) {
  // Convert OpenAI format to provider format
  return {
    model: request.model,
    messages: request.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    temperature: request.temperature || 0.7,
    max_tokens: request.max_tokens || 2048,
    // Add provider-specific fields
    my_custom_field: 'value'
  };
}
```

### Step 8: Implement Response Transformation (Optional)

```javascript
transformResponse(response) {
  // Convert provider format to OpenAI format
  return {
    id: response.request_id || `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: response.text || response.content
        },
        finish_reason: response.finish_reason || 'stop'
      }
    ],
    usage: {
      prompt_tokens: response.usage?.input_tokens || 0,
      completion_tokens: response.usage?.output_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0
    }
  };
}
```

## Provider Interface Requirements

### Configuration Schema

Define required and optional configuration keys:

```javascript
// In provider-types.js
const PROVIDER_TYPES = {
  'my-provider': {
    name: 'My Provider',
    description: 'Description of my provider',
    requiredConfig: ['baseURL'],
    optionalConfig: ['apiKey', 'timeout', 'maxRetries'],
    supportsStreaming: true,
    supportsTools: false,
    supportsVision: false
  }
};
```

### Error Handling

Implement consistent error handling:

```javascript
async chatCompletion(request) {
  try {
    // ... API call
  } catch (error) {
    // Log error with context
    logger.error('MyProvider error', {
      method: 'chatCompletion',
      model: request.model,
      error: error.message,
      stack: error.stack
    });

    // Throw user-friendly error
    if (error.response) {
      throw new Error(
        `MyProvider API error (${error.response.status}): ${error.response.data.message}`
      );
    } else if (error.request) {
      throw new Error(
        `MyProvider network error: ${error.message}`
      );
    } else {
      throw new Error(
        `MyProvider request error: ${error.message}`
      );
    }
  }
}
```

### Validation

Validate configuration on initialization:

```javascript
constructor(config) {
  super(config);

  // Required fields
  const required = ['baseURL'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`MyProvider: ${field} is required`);
    }
  }

  // Validate baseURL format
  try {
    new URL(config.baseURL);
  } catch (error) {
    throw new Error(`MyProvider: invalid baseURL: ${config.baseURL}`);
  }

  // Validate numeric fields
  if (config.timeout && typeof config.timeout !== 'number') {
    throw new Error('MyProvider: timeout must be a number');
  }

  // ... initialize
}
```

## Example Implementation

Here's a complete example for a fictional provider:

```javascript
// src/providers/acme-provider.js
const axios = require('axios');
const BaseProvider = require('./base-provider');
const logger = require('../utils/logger');

/**
 * Acme AI Provider
 *
 * Integrates with Acme AI's LLM API
 *
 * Required config:
 * - baseURL: Acme API endpoint
 * - apiKey: Acme API key
 *
 * Optional config:
 * - timeout: Request timeout (default: 120000ms)
 * - maxRetries: Max retry attempts (default: 3)
 */
class AcmeProvider extends BaseProvider {
  constructor(config) {
    super(config);

    // Validate configuration
    if (!config.baseURL) {
      throw new Error('AcmeProvider: baseURL is required');
    }
    if (!config.apiKey) {
      throw new Error('AcmeProvider: apiKey is required');
    }

    // Initialize HTTP client
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 120000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'User-Agent': 'ProviderRouter/1.0'
      }
    });

    this.maxRetries = config.maxRetries || 3;

    logger.info('AcmeProvider initialized', {
      baseURL: config.baseURL,
      timeout: this.client.defaults.timeout
    });
  }

  getType() {
    return 'acme';
  }

  async chatCompletion(request) {
    try {
      logger.info('AcmeProvider: chat completion', {
        model: request.model,
        messages: request.messages?.length
      });

      const acmeRequest = this.transformRequest(request);
      const response = await this.retryRequest(() =>
        this.client.post('/v1/generate', acmeRequest)
      );

      return this.transformResponse(response.data);
    } catch (error) {
      logger.error('AcmeProvider: chat completion failed', {
        error: error.message,
        model: request.model
      });
      throw new Error(`Acme AI error: ${error.message}`);
    }
  }

  async listModels() {
    try {
      const response = await this.client.get('/v1/models');

      return {
        object: 'list',
        data: response.data.models.map(model => ({
          id: model.name,
          object: 'model',
          created: model.created_at,
          owned_by: 'acme-ai'
        }))
      };
    } catch (error) {
      logger.error('AcmeProvider: list models failed', { error: error.message });
      throw error;
    }
  }

  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.client.get('/v1/health');
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTimeMs: responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        details: { baseURL: this.config.baseURL }
      };
    }
  }

  transformRequest(request) {
    return {
      model: request.model,
      prompt: this.messagesToPrompt(request.messages),
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 2048,
      stop: request.stop,
      stream: request.stream || false
    };
  }

  transformResponse(response) {
    return {
      id: response.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.text
          },
          finish_reason: response.done ? 'stop' : 'length'
        }
      ],
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      }
    };
  }

  messagesToPrompt(messages) {
    // Convert chat messages to single prompt
    return messages.map(msg => {
      const role = msg.role === 'user' ? 'Human' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
  }

  async retryRequest(fn) {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === this.maxRetries - 1) throw error;

        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        logger.warn(`AcmeProvider: retry ${i + 1}/${this.maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = AcmeProvider;
```

## Testing Your Provider

### Unit Tests

Create unit tests in `tests/unit/providers/`:

```javascript
// tests/unit/providers/acme-provider.test.js
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const AcmeProvider = require('../../../src/providers/acme-provider');

describe('AcmeProvider', () => {
  let provider;

  before(() => {
    provider = new AcmeProvider({
      baseURL: 'https://api.acme-ai.com',
      apiKey: 'test-key',
      timeout: 30000
    });
  });

  it('should initialize with valid config', () => {
    assert.strictEqual(provider.getType(), 'acme');
    assert.ok(provider.client);
  });

  it('should throw error without baseURL', () => {
    assert.throws(() => {
      new AcmeProvider({ apiKey: 'test' });
    }, /baseURL is required/);
  });

  it('should throw error without apiKey', () => {
    assert.throws(() => {
      new AcmeProvider({ baseURL: 'https://api.acme-ai.com' });
    }, /apiKey is required/);
  });

  it('should transform OpenAI request to Acme format', () => {
    const openAIRequest = {
      model: 'acme-gpt',
      messages: [
        { role: 'user', content: 'Hello' }
      ],
      temperature: 0.8
    };

    const acmeRequest = provider.transformRequest(openAIRequest);

    assert.strictEqual(acmeRequest.model, 'acme-gpt');
    assert.strictEqual(acmeRequest.temperature, 0.8);
    assert.ok(acmeRequest.prompt.includes('Hello'));
  });

  // Add more tests...
});
```

### Integration Tests

Test with actual API (or mock server):

```javascript
// tests/integration/acme-provider.test.js
const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const AcmeProvider = require('../../src/providers/acme-provider');

describe('AcmeProvider Integration', () => {
  let provider;

  before(() => {
    // Use test API key or mock server
    provider = new AcmeProvider({
      baseURL: process.env.ACME_TEST_URL || 'http://localhost:8080',
      apiKey: process.env.ACME_TEST_KEY || 'test-key'
    });
  });

  it('should list models', async () => {
    const models = await provider.listModels();

    assert.strictEqual(models.object, 'list');
    assert.ok(Array.isArray(models.data));
    assert.ok(models.data.length > 0);
  });

  it('should pass health check', async () => {
    const health = await provider.healthCheck();

    assert.strictEqual(health.status, 'healthy');
    assert.ok(health.responseTimeMs > 0);
  });

  it('should handle chat completion', async () => {
    const response = await provider.chatCompletion({
      model: 'acme-gpt',
      messages: [
        { role: 'user', content: 'Say hello' }
      ]
    });

    assert.strictEqual(response.object, 'chat.completion');
    assert.ok(response.choices[0].message.content);
  });
});
```

### Manual Testing

Test your provider manually:

```bash
# Add provider
provider-cli provider add \
  --id acme-test \
  --name "Acme AI Test" \
  --type acme \
  --config baseURL=https://api.acme-ai.com \
  --config apiKey=your-api-key

# Test connectivity
provider-cli provider test acme-test

# List models
provider-cli provider list

# Make test request
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "acme-gpt",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Integration Steps

### Step 1: Register Provider Type

Add to `src/providers/provider-types.js`:

```javascript
const PROVIDER_TYPES = {
  // ... existing types
  'acme': {
    name: 'Acme AI',
    description: 'Acme AI LLM provider',
    requiredConfig: ['baseURL', 'apiKey'],
    optionalConfig: ['timeout', 'maxRetries'],
    supportsStreaming: false,
    supportsTools: false,
    supportsVision: false
  }
};

module.exports = { PROVIDER_TYPES };
```

### Step 2: Update Provider Factory

Add to `src/providers/provider-factory.js`:

```javascript
const AcmeProvider = require('./acme-provider');

class ProviderFactory {
  static getProviderClass(type) {
    const providers = {
      'lm-studio': require('./lm-studio-provider'),
      'qwen-proxy': require('./qwen-proxy-provider'),
      'qwen-direct': require('./qwen-direct-provider'),
      'acme': AcmeProvider  // Add your provider
    };

    return providers[type];
  }

  // ... rest of factory
}
```

### Step 3: Update Documentation

Add provider documentation:

```markdown
### Acme AI Provider

**Type**: `acme`

**Required Config**:
- `baseURL` (string): Acme API endpoint
- `apiKey` (string, sensitive): Acme API key

**Optional Config**:
- `timeout` (number): Request timeout in milliseconds (default: 120000)
- `maxRetries` (number): Maximum retry attempts (default: 3)

**Capabilities**:
- Chat completions
- Model listing
- Health checks

**Example**:
```bash
provider-cli provider add \
  --id acme-prod \
  --name "Acme AI Production" \
  --type acme \
  --config baseURL=https://api.acme-ai.com \
  --config apiKey=your-api-key \
  --config timeout=180000
```
```

### Step 4: Add Validation

Update validation middleware if needed:

```javascript
// src/middleware/validation.js
const VALID_PROVIDER_TYPES = [
  'lm-studio',
  'qwen-proxy',
  'qwen-direct',
  'acme'  // Add your type
];
```

## Best Practices

### 1. Configuration Management

```javascript
// Use config with defaults
constructor(config) {
  super(config);

  this.baseURL = config.baseURL || this.getDefaultBaseURL();
  this.timeout = config.timeout || 120000;
  this.maxRetries = config.maxRetries || 3;
  this.retryDelay = config.retryDelay || 1000;
}

getDefaultBaseURL() {
  return process.env.ACME_BASE_URL || 'https://api.acme-ai.com';
}
```

### 2. Logging

```javascript
// Log important events
logger.info('Provider initialized', { type: this.getType(), baseURL: this.baseURL });
logger.debug('Request details', { model, messageCount: messages.length });
logger.error('Request failed', { error: error.message, stack: error.stack });
```

### 3. Error Messages

```javascript
// Provide helpful error messages
throw new Error(
  `Acme AI authentication failed. Check your API key. ` +
  `Error: ${error.response.data.message}`
);
```

### 4. Retry Logic

```javascript
// Implement exponential backoff
async retryRequest(fn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !this.isRetriableError(error)) {
        throw error;
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      logger.warn(`Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await this.sleep(delay);
    }
  }
}

isRetriableError(error) {
  const status = error.response?.status;
  return status >= 500 || status === 429 || error.code === 'ECONNRESET';
}
```

### 5. Timeouts

```javascript
// Set appropriate timeouts
this.client = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout || 120000,
  timeoutErrorMessage: 'Request timeout - provider took too long to respond'
});
```

## Common Patterns

### Streaming Responses

```javascript
async chatCompletionStream(request) {
  const response = await this.client.post('/chat/completions', request, {
    responseType: 'stream'
  });

  return response.data; // Return stream
}
```

### Tool/Function Calling

```javascript
transformRequest(request) {
  const transformed = { /* ... */ };

  if (request.tools) {
    transformed.functions = request.tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }));
  }

  return transformed;
}
```

### Vision Support

```javascript
transformRequest(request) {
  const messages = request.messages.map(msg => {
    if (msg.content && Array.isArray(msg.content)) {
      // Handle multimodal content (text + images)
      return {
        role: msg.role,
        content: msg.content.map(part => {
          if (part.type === 'image_url') {
            return { type: 'image', url: part.image_url.url };
          }
          return part;
        })
      };
    }
    return msg;
  });

  return { /* ... */, messages };
}
```

## Troubleshooting

### Provider Not Loading

**Check**: Provider registered in factory
**Solution**: Verify `getProviderClass()` includes your type

### Configuration Not Applied

**Check**: Config keys match required schema
**Solution**: Review `requiredConfig` in provider-types.js

### Health Check Failing

**Check**: Health check endpoint and response
**Solution**: Test endpoint manually, adjust healthCheck() method

### Request Transformation Issues

**Check**: Request/response format matches provider API
**Solution**: Log transformed request/response, compare with API docs

### Tests Failing

**Check**: Mock data and API responses
**Solution**: Update test fixtures, use actual API responses as reference

## Related Documentation

- [Provider Configuration System Architecture](../architecture/provider-configuration-system.md)
- [Provider Management API](../api/provider-management-api.md)
- [Managing Providers via CLI](../guides/managing-providers-via-cli.md)
- [Managing Providers via API](../guides/managing-providers-via-api.md)
