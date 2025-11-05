# OpenCode Test Client

A test client that sends **identical requests** to the Qwen proxy as OpenCode does. This ensures our proxy correctly handles OpenCode's tool calling format.

## Purpose

- Send the same requests OpenCode sends (same tools, same format)
- Execute tools CLIENT-SIDE just like OpenCode
- Test multi-turn conversations with tool results
- Validate the proxy's transformations work correctly

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run the test client
npm start
```

## Configuration

Edit `.env` to configure:

- `PROXY_BASE_URL`: URL of your Qwen proxy (default: http://localhost:3000)
- `TEST_MODE`: `proxy` (test proxy) or `direct` (test Qwen API directly)
- `WORKING_DIR`: Directory for tool execution
- `LOG_LEVEL`: Logging verbosity

## Usage

### Interactive Mode (CLI)

```bash
npm start
```

This starts an interactive CLI where you can:
- Send messages to the proxy
- Execute tools automatically when model requests them
- See multi-turn conversations
- View request/response logs

### Programmatic Mode

```javascript
import { TestClient } from './src/client.js'

const client = new TestClient({
  baseURL: 'http://localhost:3000',
  workingDir: '/tmp/test'
})

// Send a message
const response = await client.sendMessage('List the files in current directory')

// Handle tool calls
if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    const result = await client.executeTool(toolCall)
    await client.sendToolResult(toolCall.id, result)
  }
}
```

## Test Scenarios

Phase 7 of the implementation includes comprehensive test scenarios to validate proxy behavior:

### Running Test Scenarios

```bash
# Run all test categories
npm run test:all

# Single tool tests (bash, read, write, glob)
npm run test:single

# Multi-tool workflow tests (complex scenarios)
npm run test:multi

# OpenCode-exact reproduction tests
npm run test:exact

# Individual tool tests
npm run test:bash
npm run test:read
npm run test:write
npm run test:glob
```

### Test Categories

**Single Tool Tests** (`npm run test:single`)
- Bash command execution
- File reading
- File writing
- File pattern matching (glob)

**Multi-Tool Workflow Tests** (`npm run test:multi`)
- Glob → Read workflow
- Write → Read → Edit workflow
- Bash → Grep → Read workflow
- Project creation workflow

**OpenCode-Exact Tests** (`npm run test:exact`)
- Exact read file scenario (matches OpenCode behavior)
- Multi-turn conversation (5+ turns)
- Empty bash result handling
- Complex parameter handling

### Running Custom Tests

You can also run the test runner directly:

```bash
# View all available tests
node src/test-runner.js --help

# Run specific test
node src/test-runner.js bash
node src/test-runner.js multi-turn
node src/test-runner.js exact-read
```

## Project Structure

```
test-client/
├── src/
│   ├── index.js              # CLI entry point (interactive mode)
│   ├── test-runner.js        # Test scenario runner
│   ├── client.js             # Test client main class
│   ├── config.js             # Configuration loader
│   ├── tools/                # Tool definitions & executors
│   │   ├── bash.js
│   │   ├── read.js
│   │   ├── write.js
│   │   ├── edit.js
│   │   ├── glob.js
│   │   ├── grep.js
│   │   ├── list.js
│   │   ├── webfetch.js
│   │   ├── todowrite.js
│   │   ├── todoread.js
│   │   ├── task.js
│   │   └── index.js          # Tool registry
│   ├── scenarios/            # Test scenarios (Phase 7)
│   │   ├── single-tool.js    # Single tool tests
│   │   ├── multi-tool.js     # Multi-tool workflow tests
│   │   ├── opencode-exact.js # OpenCode reproduction tests
│   │   └── index.js          # Scenario exports
│   ├── http/                 # HTTP client
│   │   └── client.js
│   ├── prompts/              # System prompts
│   │   ├── qwen.txt          # Qwen system prompt
│   │   └── loader.js         # Prompt loader
│   └── utils/                # Utilities
│       └── logger.js
├── tests/                    # Unit tests (future)
├── package.json
├── .env.example
└── README.md
```

## Tools Implemented

All 11 OpenCode tools:

1. **bash** - Execute shell commands
2. **read** - Read files
3. **write** - Write files
4. **edit** - Edit files (replace text)
5. **glob** - Find files matching pattern
6. **grep** - Search file contents
7. **list** - List directory contents
8. **webfetch** - Fetch web content
9. **todowrite** - Write todo list
10. **todoread** - Read todo list
11. **task** - Launch sub-agent (simulated)

## Logging

Logs show:
- Outgoing requests (formatted)
- Incoming responses (formatted)
- Tool executions
- Errors and warnings

Set `LOG_LEVEL=debug` in `.env` for verbose output.

## Comparison Mode

Test against Qwen API directly:

```bash
# Edit .env
TEST_MODE=direct
QWEN_API_KEY=your-key

# Run
npm start
```

This sends requests directly to Qwen (no proxy) to compare behavior.

## Troubleshooting

**Connection refused:**
- Ensure proxy server is running on port 3000
- Check `PROXY_BASE_URL` in `.env`

**Tool execution errors:**
- Check `WORKING_DIR` exists and has permissions
- Ensure Node.js >=20 for proper `fs` APIs

**Response format errors:**
- Check proxy logs for transformation errors
- Compare with OpenCode's expected format in docs/

## Development

```bash
# Watch mode (auto-reload on changes)
npm run dev

# Run tests
npm test
```

## Architecture

This test client:
1. Uses **same libraries** as OpenCode (AI SDK, zod)
2. Sends **identical requests** (tools, format, headers)
3. Executes tools **client-side** like OpenCode
4. Validates **exact response format** expected by OpenCode

This ensures our proxy handles real OpenCode traffic correctly.
