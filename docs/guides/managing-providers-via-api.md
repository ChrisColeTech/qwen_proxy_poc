# Managing Providers via API

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Common Workflows](#common-workflows)
- [Provider Management Examples](#provider-management-examples)
- [Configuration Management Examples](#configuration-management-examples)
- [Model Management Examples](#model-management-examples)
- [Advanced Usage](#advanced-usage)
- [Scripting and Automation](#scripting-and-automation)
- [Best Practices](#best-practices)
- [Error Handling](#error-handling)

## Overview

The Provider Management API enables programmatic control over provider configurations. This guide provides practical examples for integrating the API into your applications, scripts, and workflows.

### Use Cases

- Automated provider configuration
- Dynamic provider switching
- Configuration management systems
- Monitoring and health checks
- Multi-tenant provider isolation
- CI/CD pipeline integration

### Prerequisites

- Provider Router running on accessible host
- HTTP client (curl, axios, fetch, etc.)
- Basic knowledge of REST APIs
- For complete API reference, see [Provider Management API](../api/provider-management-api.md)

## Getting Started

### Base URL

All examples assume the server is running locally:

```
http://localhost:3001/v1
```

Replace with your actual server URL.

### Testing API Access

```bash
# Test server health
curl http://localhost:3001/health

# List providers
curl http://localhost:3001/v1/providers

# Check active provider
curl http://localhost:3001/v1/settings/active_provider
```

### Tools for API Testing

**curl** (command line):
```bash
curl -X POST http://localhost:3001/v1/providers \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "name": "Test", "type": "lm-studio"}'
```

**HTTPie** (user-friendly):
```bash
http POST http://localhost:3001/v1/providers \
  id=test name=Test type=lm-studio
```

**Postman/Insomnia** (GUI):
- Import API collection
- Create requests
- Test and save responses

## Common Workflows

### Workflow 1: List and Select Provider

**Goal**: Get all providers and switch to a specific one.

```bash
# Step 1: List all providers
curl http://localhost:3001/v1/providers

# Step 2: Get details for specific provider
curl http://localhost:3001/v1/providers/lm-studio-gpu

# Step 3: Switch to provider
curl -X PUT http://localhost:3001/v1/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "lm-studio-gpu"}'

# Step 4: Verify switch
curl http://localhost:3001/v1/settings/active_provider
```

### Workflow 2: Create and Configure Provider

**Goal**: Create a new provider with complete configuration.

```bash
# Step 1: Create provider
curl -X POST http://localhost:3001/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lm-studio-gpu",
    "name": "LM Studio GPU Server",
    "type": "lm-studio",
    "enabled": true,
    "priority": 15,
    "description": "GPU-accelerated instance",
    "config": {
      "baseURL": "http://192.168.0.50:1234/v1",
      "defaultModel": "qwen3-max",
      "timeout": 180000
    }
  }'

# Step 2: Test connectivity
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/test

# Step 3: Link models
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/models \
  -H "Content-Type: application/json" \
  -d '{"model_id": "qwen3-max", "is_default": true}'

# Step 4: Set as active
curl -X PUT http://localhost:3001/v1/settings/active_provider \
  -H "Content-Type: application/json" \
  -d '{"value": "lm-studio-gpu"}'
```

### Workflow 3: Update Configuration

**Goal**: Update provider configuration without downtime.

```bash
# Step 1: View current config
curl http://localhost:3001/v1/providers/lm-studio-gpu/config

# Step 2: Update specific key
curl -X PATCH http://localhost:3001/v1/providers/lm-studio-gpu/config/timeout \
  -H "Content-Type: application/json" \
  -d '{"value": "240000"}'

# Step 3: Reload provider
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/reload

# Step 4: Verify changes
curl http://localhost:3001/v1/providers/lm-studio-gpu/config
```

### Workflow 4: Health Monitoring

**Goal**: Monitor provider health and availability.

```bash
# Check all providers health
curl http://localhost:3001/v1/providers/health

# Test specific provider
curl -X POST http://localhost:3001/v1/providers/lm-studio-gpu/test

# Get usage statistics
curl http://localhost:3001/v1/stats

# Check request history
curl http://localhost:3001/v1/history?limit=50
```

## Provider Management Examples

### Create Provider (LM Studio)

```bash
curl -X POST http://localhost:3001/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "lm-studio-home",
    "name": "LM Studio Home",
    "type": "lm-studio",
    "enabled": true,
    "priority": 10,
    "config": {
      "baseURL": "http://192.168.0.22:1234/v1",
      "defaultModel": "qwen3-max",
      "timeout": 120000
    }
  }'
```

**JavaScript (axios)**:
```javascript
const axios = require('axios');

async function createProvider() {
  const response = await axios.post('http://localhost:3001/v1/providers', {
    id: 'lm-studio-home',
    name: 'LM Studio Home',
    type: 'lm-studio',
    enabled: true,
    priority: 10,
    config: {
      baseURL: 'http://192.168.0.22:1234/v1',
      defaultModel: 'qwen3-max',
      timeout: 120000
    }
  });

  console.log('Provider created:', response.data);
  return response.data;
}

createProvider().catch(console.error);
```

**Python (requests)**:
```python
import requests

def create_provider():
    url = 'http://localhost:3001/v1/providers'
    data = {
        'id': 'lm-studio-home',
        'name': 'LM Studio Home',
        'type': 'lm-studio',
        'enabled': True,
        'priority': 10,
        'config': {
            'baseURL': 'http://192.168.0.22:1234/v1',
            'defaultModel': 'qwen3-max',
            'timeout': 120000
        }
    }

    response = requests.post(url, json=data)
    response.raise_for_status()

    print('Provider created:', response.json())
    return response.json()

create_provider()
```

### List Providers with Filters

```bash
# All providers
curl http://localhost:3001/v1/providers

# Filter by type
curl http://localhost:3001/v1/providers?type=lm-studio

# Filter by enabled status
curl http://localhost:3001/v1/providers?enabled=true
```

**JavaScript (fetch)**:
```javascript
async function listProviders(filters = {}) {
  const params = new URLSearchParams(filters);
  const url = `http://localhost:3001/v1/providers?${params}`;

  const response = await fetch(url);
  const data = await response.json();

  console.log(`Found ${data.count} providers`);
  data.providers.forEach(p => {
    console.log(`- ${p.name} (${p.type}): ${p.enabled ? 'enabled' : 'disabled'}`);
  });

  return data.providers;
}

// Usage
listProviders({ type: 'lm-studio', enabled: true });
```

### Update Provider

```bash
curl -X PUT http://localhost:3001/v1/providers/lm-studio-home \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LM Studio Home (Updated)",
    "priority": 15,
    "description": "Primary development server"
  }'
```

**JavaScript**:
```javascript
async function updateProvider(id, updates) {
  const response = await axios.put(
    `http://localhost:3001/v1/providers/${id}`,
    updates
  );

  console.log('Provider updated:', response.data);
  return response.data;
}

updateProvider('lm-studio-home', {
  name: 'LM Studio Home (Updated)',
  priority: 15,
  description: 'Primary development server'
});
```

### Delete Provider

```bash
curl -X DELETE http://localhost:3001/v1/providers/lm-studio-backup
```

**JavaScript**:
```javascript
async function deleteProvider(id) {
  const response = await axios.delete(
    `http://localhost:3001/v1/providers/${id}`
  );

  console.log('Provider deleted:', response.data);
}

deleteProvider('lm-studio-backup');
```

### Enable/Disable Provider

```bash
# Enable
curl -X POST http://localhost:3001/v1/providers/lm-studio-backup/enable

# Disable
curl -X POST http://localhost:3001/v1/providers/lm-studio-backup/disable
```

**JavaScript**:
```javascript
async function setProviderEnabled(id, enabled) {
  const endpoint = enabled ? 'enable' : 'disable';
  const response = await axios.post(
    `http://localhost:3001/v1/providers/${id}/${endpoint}`
  );

  console.log(`Provider ${enabled ? 'enabled' : 'disabled'}:`, response.data);
  return response.data;
}

// Enable provider
setProviderEnabled('lm-studio-backup', true);

// Disable provider
setProviderEnabled('lm-studio-backup', false);
```

## Configuration Management Examples

### Get Provider Configuration

```bash
curl http://localhost:3001/v1/providers/lm-studio-home/config
```

**JavaScript**:
```javascript
async function getProviderConfig(id) {
  const response = await axios.get(
    `http://localhost:3001/v1/providers/${id}/config`
  );

  console.log(`Configuration for ${id}:`);
  console.log(JSON.stringify(response.data.config, null, 2));

  return response.data.config;
}

getProviderConfig('lm-studio-home');
```

### Update Multiple Configuration Keys

```bash
curl -X PUT http://localhost:3001/v1/providers/lm-studio-home/config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "timeout": 240000,
      "maxRetries": 3,
      "retryDelay": 1000
    }
  }'
```

**JavaScript**:
```javascript
async function updateProviderConfig(id, config) {
  const response = await axios.put(
    `http://localhost:3001/v1/providers/${id}/config`,
    { config }
  );

  console.log('Configuration updated:', response.data);
  return response.data;
}

updateProviderConfig('lm-studio-home', {
  timeout: 240000,
  maxRetries: 3,
  retryDelay: 1000
});
```

### Update Single Configuration Key

```bash
curl -X PATCH http://localhost:3001/v1/providers/lm-studio-home/config/timeout \
  -H "Content-Type: application/json" \
  -d '{"value": "300000"}'
```

**JavaScript**:
```javascript
async function updateConfigKey(providerId, key, value, isSensitive = false) {
  const response = await axios.patch(
    `http://localhost:3001/v1/providers/${providerId}/config/${key}`,
    { value, is_sensitive: isSensitive }
  );

  console.log(`Updated ${key}:`, response.data);
  return response.data;
}

updateConfigKey('lm-studio-home', 'timeout', '300000');
updateConfigKey('lm-studio-home', 'apiKey', 'secret-key-123', true);
```

### Delete Configuration Key

```bash
curl -X DELETE http://localhost:3001/v1/providers/lm-studio-home/config/retryDelay
```

**JavaScript**:
```javascript
async function deleteConfigKey(providerId, key) {
  const response = await axios.delete(
    `http://localhost:3001/v1/providers/${providerId}/config/${key}`
  );

  console.log(`Deleted key ${key}:`, response.data);
  return response.data;
}

deleteConfigKey('lm-studio-home', 'retryDelay');
```

## Model Management Examples

### Create Model

```bash
curl -X POST http://localhost:3001/v1/models \
  -H "Content-Type: application/json" \
  -d '{
    "id": "gpt-4",
    "name": "GPT-4",
    "description": "OpenAI GPT-4 model",
    "capabilities": ["chat", "completion", "vision", "tools"]
  }'
```

**JavaScript**:
```javascript
async function createModel(modelData) {
  const response = await axios.post(
    'http://localhost:3001/v1/models',
    modelData
  );

  console.log('Model created:', response.data);
  return response.data;
}

createModel({
  id: 'gpt-4',
  name: 'GPT-4',
  description: 'OpenAI GPT-4 model',
  capabilities: ['chat', 'completion', 'vision', 'tools']
});
```

### Link Model to Provider

```bash
curl -X POST http://localhost:3001/v1/providers/lm-studio-home/models \
  -H "Content-Type: application/json" \
  -d '{"model_id": "qwen3-max", "is_default": true}'
```

**JavaScript**:
```javascript
async function linkModelToProvider(providerId, modelId, isDefault = false) {
  const response = await axios.post(
    `http://localhost:3001/v1/providers/${providerId}/models`,
    { model_id: modelId, is_default: isDefault }
  );

  console.log('Model linked:', response.data);
  return response.data;
}

linkModelToProvider('lm-studio-home', 'qwen3-max', true);
```

### Get Models for Provider

```bash
curl http://localhost:3001/v1/providers/lm-studio-home/models
```

**JavaScript**:
```javascript
async function getProviderModels(providerId) {
  const response = await axios.get(
    `http://localhost:3001/v1/providers/${providerId}/models`
  );

  console.log(`Models for ${providerId}:`);
  response.data.models.forEach(m => {
    console.log(`- ${m.name} ${m.is_default ? '(default)' : ''}`);
  });

  return response.data.models;
}

getProviderModels('lm-studio-home');
```

### Set Default Model

```bash
curl -X PUT http://localhost:3001/v1/providers/lm-studio-home/models/qwen3-coder/default
```

**JavaScript**:
```javascript
async function setDefaultModel(providerId, modelId) {
  const response = await axios.put(
    `http://localhost:3001/v1/providers/${providerId}/models/${modelId}/default`
  );

  console.log('Default model updated:', response.data);
  return response.data;
}

setDefaultModel('lm-studio-home', 'qwen3-coder');
```

## Advanced Usage

### Bulk Provider Creation

**JavaScript**:
```javascript
const providers = [
  {
    id: 'lm-studio-1',
    name: 'LM Studio Server 1',
    type: 'lm-studio',
    enabled: true,
    priority: 20,
    config: { baseURL: 'http://192.168.0.50:1234/v1' }
  },
  {
    id: 'lm-studio-2',
    name: 'LM Studio Server 2',
    type: 'lm-studio',
    enabled: true,
    priority: 15,
    config: { baseURL: 'http://192.168.0.51:1234/v1' }
  },
  {
    id: 'lm-studio-3',
    name: 'LM Studio Server 3',
    type: 'lm-studio',
    enabled: false,
    priority: 10,
    config: { baseURL: 'http://192.168.0.52:1234/v1' }
  }
];

async function createProviders(providerList) {
  const results = await Promise.allSettled(
    providerList.map(provider =>
      axios.post('http://localhost:3001/v1/providers', provider)
    )
  );

  const created = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Created ${created} providers, ${failed} failed`);
  return results;
}

createProviders(providers);
```

### Provider Health Check Loop

**JavaScript**:
```javascript
async function monitorProviders(interval = 30000) {
  while (true) {
    try {
      const response = await axios.get('http://localhost:3001/v1/providers/health');
      const { providers, healthy_count, total_count } = response.data;

      console.log(`\n[${new Date().toISOString()}] Health Check`);
      console.log(`Healthy: ${healthy_count}/${total_count}`);

      providers.forEach(p => {
        const status = p.status === 'healthy' ? '✓' : '✗';
        console.log(`${status} ${p.id}: ${p.response_time_ms}ms`);
      });

      // Alert if unhealthy
      if (healthy_count < total_count) {
        console.warn('⚠ Some providers are unhealthy!');
      }
    } catch (error) {
      console.error('Health check failed:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

// Run health check every 30 seconds
monitorProviders(30000);
```

### Automatic Failover

**JavaScript**:
```javascript
async function ensureHealthyProvider() {
  // Get current active provider
  const activeResponse = await axios.get(
    'http://localhost:3001/v1/settings/active_provider'
  );
  const activeId = activeResponse.data.value;

  // Test current provider
  try {
    await axios.post(`http://localhost:3001/v1/providers/${activeId}/test`);
    console.log(`Active provider ${activeId} is healthy`);
    return activeId;
  } catch (error) {
    console.warn(`Active provider ${activeId} is unhealthy, failing over...`);
  }

  // Get all enabled providers sorted by priority
  const providersResponse = await axios.get(
    'http://localhost:3001/v1/providers?enabled=true'
  );
  const providers = providersResponse.data.providers
    .sort((a, b) => b.priority - a.priority);

  // Find first healthy provider
  for (const provider of providers) {
    if (provider.id === activeId) continue; // Skip current unhealthy one

    try {
      await axios.post(`http://localhost:3001/v1/providers/${provider.id}/test`);

      // Switch to healthy provider
      await axios.put('http://localhost:3001/v1/settings/active_provider', {
        value: provider.id
      });

      console.log(`Switched to healthy provider: ${provider.id}`);
      return provider.id;
    } catch (error) {
      console.warn(`Provider ${provider.id} is also unhealthy`);
    }
  }

  throw new Error('No healthy providers available!');
}

// Use in your application
ensureHealthyProvider().catch(console.error);
```

### Dynamic Load Balancing

**JavaScript**:
```javascript
class ProviderLoadBalancer {
  constructor(baseURL = 'http://localhost:3001/v1') {
    this.baseURL = baseURL;
    this.currentIndex = 0;
    this.providers = [];
  }

  async initialize() {
    const response = await axios.get(`${this.baseURL}/providers?enabled=true`);
    this.providers = response.data.providers.sort((a, b) => b.priority - a.priority);
    console.log(`Initialized with ${this.providers.length} providers`);
  }

  async getNextProvider() {
    if (this.providers.length === 0) {
      throw new Error('No providers available');
    }

    const provider = this.providers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;

    return provider;
  }

  async switchToProvider(providerId) {
    await axios.put(`${this.baseURL}/../settings/active_provider`, {
      value: providerId
    });
  }

  async roundRobinRequest() {
    const provider = await this.getNextProvider();
    await this.switchToProvider(provider.id);

    console.log(`Using provider: ${provider.name}`);
    return provider;
  }
}

// Usage
const balancer = new ProviderLoadBalancer();
await balancer.initialize();

// Distribute requests across providers
for (let i = 0; i < 10; i++) {
  const provider = await balancer.roundRobinRequest();
  // Make your LLM request here
}
```

## Scripting and Automation

### Bash Script: Setup Multiple Providers

```bash
#!/bin/bash
# setup-providers.sh

BASE_URL="http://localhost:3001/v1"

# Create providers
create_provider() {
  local id=$1
  local name=$2
  local base_url=$3
  local priority=$4

  curl -s -X POST "$BASE_URL/providers" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"$id\",
      \"name\": \"$name\",
      \"type\": \"lm-studio\",
      \"enabled\": true,
      \"priority\": $priority,
      \"config\": {
        \"baseURL\": \"$base_url\",
        \"timeout\": 120000
      }
    }" | jq -r '.id + " created"'
}

# Create multiple providers
create_provider "lm-studio-1" "LM Studio 1" "http://192.168.0.50:1234/v1" 20
create_provider "lm-studio-2" "LM Studio 2" "http://192.168.0.51:1234/v1" 15
create_provider "lm-studio-3" "LM Studio 3" "http://192.168.0.52:1234/v1" 10

# Test all providers
echo "Testing providers..."
for id in lm-studio-1 lm-studio-2 lm-studio-3; do
  echo "Testing $id..."
  curl -s -X POST "$BASE_URL/providers/$id/test" | jq '.status'
done

echo "Setup complete!"
```

### Python Script: Configuration Backup

```python
#!/usr/bin/env python3
"""backup-config.py - Backup all provider configurations"""

import json
import requests
from datetime import datetime

BASE_URL = 'http://localhost:3001/v1'

def backup_configuration():
    backup = {
        'timestamp': datetime.now().isoformat(),
        'providers': [],
        'models': [],
        'provider_models': []
    }

    # Backup providers
    providers_response = requests.get(f'{BASE_URL}/providers')
    providers = providers_response.json()['providers']

    for provider in providers:
        # Get provider details
        details = requests.get(f'{BASE_URL}/providers/{provider["id"]}').json()

        # Get provider config
        config = requests.get(f'{BASE_URL}/providers/{provider["id"]}/config').json()

        # Get provider models
        models = requests.get(f'{BASE_URL}/providers/{provider["id"]}/models').json()

        backup['providers'].append({
            'provider': details,
            'config': config['config'],
            'models': models['models']
        })

    # Backup all models
    models_response = requests.get(f'{BASE_URL}/models')
    backup['models'] = models_response.json()['models']

    # Save to file
    filename = f'provider-backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'
    with open(filename, 'w') as f:
        json.dump(backup, f, indent=2)

    print(f'Configuration backed up to {filename}')
    print(f'Providers: {len(backup["providers"])}')
    print(f'Models: {len(backup["models"])}')

if __name__ == '__main__':
    backup_configuration()
```

### Node.js Script: Restore Configuration

```javascript
#!/usr/bin/env node
/**
 * restore-config.js - Restore providers from backup
 * Usage: node restore-config.js backup-file.json
 */

const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001/v1';

async function restoreConfiguration(backupFile) {
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

  console.log(`Restoring from ${backupFile}`);
  console.log(`Backup created: ${backup.timestamp}`);

  // Restore models first
  for (const model of backup.models) {
    try {
      await axios.post(`${BASE_URL}/models`, model);
      console.log(`✓ Model restored: ${model.id}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`- Model exists: ${model.id}`);
      } else {
        console.error(`✗ Failed to restore model ${model.id}:`, error.message);
      }
    }
  }

  // Restore providers
  for (const item of backup.providers) {
    const { provider, config, models } = item;

    try {
      // Create provider
      await axios.post(`${BASE_URL}/providers`, {
        ...provider,
        config
      });
      console.log(`✓ Provider restored: ${provider.id}`);

      // Link models
      for (const model of models) {
        await axios.post(`${BASE_URL}/providers/${provider.id}/models`, {
          model_id: model.id,
          is_default: model.is_default
        });
        console.log(`  ✓ Model linked: ${model.id}`);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`- Provider exists: ${provider.id}`);
      } else {
        console.error(`✗ Failed to restore provider ${provider.id}:`, error.message);
      }
    }
  }

  console.log('Restoration complete!');
}

const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Usage: node restore-config.js <backup-file.json>');
  process.exit(1);
}

restoreConfiguration(backupFile).catch(console.error);
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
async function safeApiCall(fn) {
  try {
    return await fn();
  } catch (error) {
    if (error.response) {
      // API returned error response
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // No response received
      console.error('No response from server');
    } else {
      // Request setup error
      console.error('Request error:', error.message);
    }
    throw error;
  }
}

// Usage
await safeApiCall(() => axios.get('http://localhost:3001/v1/providers'));
```

### 2. Retry Logic

Implement retry for transient failures:

```javascript
async function retryApiCall(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}
```

### 3. Configuration Validation

Validate before updating:

```javascript
function validateProviderConfig(config) {
  const required = {
    'lm-studio': ['baseURL'],
    'qwen-proxy': ['baseURL'],
    'qwen-direct': ['token', 'cookies']
  };

  const providerType = config.type;
  const requiredKeys = required[providerType] || [];

  for (const key of requiredKeys) {
    if (!config.config[key]) {
      throw new Error(`Missing required config key: ${key}`);
    }
  }

  return true;
}
```

### 4. Concurrent Requests

Use Promise.all for parallel operations:

```javascript
async function testAllProviders() {
  const providers = await axios.get('http://localhost:3001/v1/providers');

  const tests = providers.data.providers.map(p =>
    axios.post(`http://localhost:3001/v1/providers/${p.id}/test`)
      .then(r => ({ id: p.id, status: 'healthy', data: r.data }))
      .catch(e => ({ id: p.id, status: 'unhealthy', error: e.message }))
  );

  const results = await Promise.all(tests);
  return results;
}
```

### 5. Rate Limiting

Implement rate limiting for bulk operations:

```javascript
class RateLimiter {
  constructor(maxRequests, perMilliseconds) {
    this.maxRequests = maxRequests;
    this.perMilliseconds = perMilliseconds;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.perMilliseconds);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.perMilliseconds - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }

    this.requests.push(now);
  }
}

// Allow 10 requests per second
const limiter = new RateLimiter(10, 1000);

async function makeRequest(url) {
  await limiter.throttle();
  return axios.get(url);
}
```

## Error Handling

### Common Errors and Solutions

#### Connection Refused

```javascript
try {
  const response = await axios.get('http://localhost:3001/v1/providers');
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('Server not running. Start with: npm start');
  }
}
```

#### Validation Errors

```javascript
try {
  await axios.post('http://localhost:3001/v1/providers', invalidData);
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Validation failed:', error.response.data.details);
  }
}
```

#### Resource Not Found

```javascript
try {
  await axios.get('http://localhost:3001/v1/providers/non-existent');
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Provider not found');
  }
}
```

## Related Documentation

- [Provider Management API Reference](../api/provider-management-api.md)
- [Managing Providers via CLI](managing-providers-via-cli.md)
- [Provider Configuration System Architecture](../architecture/provider-configuration-system.md)
- [Adding New Provider Types](../development/adding-new-provider-types.md)
