# Test Payloads for Provider-Router

Comprehensive JSON payloads for testing the provider-router with different models, tools, and scenarios.

## Directory Structure

```
test-payloads/
├── tools/          # Individual tool tests (11 files, one per tool)
├── models/         # Model-specific tests (3 files, one per model)
├── scenarios/      # Complex test scenarios (5 files)
└── README.md       # This file
```

## Tool Tests (`tools/`)

Each file tests a specific tool:

1. **01-bash.json** - Test bash tool with ls command
2. **02-read.json** - Test read tool with package.json
3. **03-write.json** - Test write tool creating a file
4. **04-edit.json** - Test edit tool modifying package.json
5. **05-glob.json** - Test glob tool finding JavaScript files
6. **06-grep.json** - Test grep tool searching for 'export'
7. **07-list.json** - Test list tool showing directory tree
8. **08-webfetch.json** - Test webfetch tool with GitHub API
9. **09-todowrite.json** - Test todowrite tool creating tasks
10. **10-todoread.json** - Test todoread tool reading tasks
11. **11-task.json** - Test task tool delegating to agent

## Model Tests (`models/`)

Tests for each of the 3 Qwen models:

1. **qwen3-max.json** - Multi-tool test with qwen3-max
2. **qwen3-coder.json** - Code analysis with qwen3-coder
3. **qwen3-coder-flash.json** - Fast operations with qwen3-coder-flash

## Scenario Tests (`scenarios/`)

Complex test scenarios:

1. **01-simple-chat.json** - No tools, just chat
2. **02-single-tool.json** - Single tool call
3. **03-multiple-tools.json** - Sequential tool calls
4. **04-multi-turn.json** - Multi-turn conversation with tools
5. **05-all-tools.json** - Complex task using multiple tools

## Usage

Test with curl:

```bash
# Test a specific tool
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-key" \
  -d @test-payloads/tools/01-bash.json

# Test a specific model
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-key" \
  -d @test-payloads/models/qwen3-max.json

# Test a scenario
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-key" \
  -d @test-payloads/scenarios/03-multiple-tools.json
```

## Test All

Run all tests:

```bash
# Test all tools
for file in test-payloads/tools/*.json; do
  echo "Testing $(basename $file)..."
  curl -s -X POST http://localhost:3001/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer dummy-key" \
    -d @"$file" | jq -r '.choices[0].message.content' | head -20
  echo "---"
done

# Test all models
for file in test-payloads/models/*.json; do
  echo "Testing $(basename $file)..."
  curl -s -X POST http://localhost:3001/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer dummy-key" \
    -d @"$file" | jq -r '.choices[0].message.content' | head -20
  echo "---"
done

# Test all scenarios
for file in test-payloads/scenarios/*.json; do
  echo "Testing $(basename $file)..."
  curl -s -X POST http://localhost:3001/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer dummy-key" \
    -d @"$file" | jq -r '.choices[0].message.content' | head -20
  echo "---"
done
```

## Provider Configuration

Make sure the provider-router is configured for LM Studio:

```bash
# Set LM Studio provider
provider-cli set lm-studio

# Start provider-router
cd /mnt/d/Projects/qwen_proxy_opencode/backend/provider-router
npm start
```

## Notes

- All payloads use OpenAI-compatible format
- Tool definitions follow LM Studio requirements
- Tests cover all 11 tools across 3 models
- Scenarios test single-tool, multi-tool, and multi-turn flows
