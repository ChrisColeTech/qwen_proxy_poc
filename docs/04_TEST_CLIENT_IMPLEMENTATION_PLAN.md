# Test Client Implementation Plan

## Work Progression Tracking

| Phase | Priority | Status | Description |
|-------|----------|--------|-------------|
| Phase 1 | HIGH | Not Started | Project setup, dependencies, TypeScript configuration |
| Phase 2 | HIGH | Not Started | Extract all 11 tool definitions from OpenCode |
| Phase 3 | HIGH | Not Started | HTTP client setup matching OpenCode's AI SDK integration |
| Phase 4 | HIGH | Not Started | System prompt configuration |
| Phase 5 | HIGH | Not Started | Request builder - OpenAI format message construction |
| Phase 6 | HIGH | Not Started | Multi-turn conversation manager |
| Phase 7 | MEDIUM | Not Started | Test scenario implementations |
| Phase 8 | MEDIUM | Not Started | Response validation and logging |
| Phase 9 | LOW | Not Started | CLI interface for manual testing |

---

## Overview

The test client is a **critical validation tool** that sends IDENTICAL requests to the Qwen proxy as OpenCode does. This ensures the proxy can handle real-world OpenCode traffic without modification.

**Key Requirements:**
- Use EXACT same libraries as OpenCode (AI SDK 5.0.8)
- Send EXACT same 11 tool definitions
- Send EXACT same system prompt structure
- Use EXACT same message format (OpenAI compatible)
- Handle multi-turn conversations identically
- Execute tools CLIENT-SIDE (not server-side)

**Why This Matters:**
The previous proxy implementation passed tests with mocks but failed with OpenCode because the tests didn't match OpenCode's exact behavior. This test client ensures the proxy works with the REAL client before deploying.

---

## Technical Decisions

### Libraries

**Core Dependencies (MUST match OpenCode):**
- `ai@5.0.8` - Vercel AI SDK (exact version OpenCode uses)
- `@ai-sdk/openai@1.0.12` - OpenAI provider for AI SDK
- `zod@3.24.1` - Schema validation (used by OpenCode tools)

**Additional Dependencies:**
- `typescript@5.x` - For type safety
- `tsx@4.x` - For running TypeScript directly
- `dotenv@16.x` - Environment configuration
- `chalk@5.x` - Terminal colors for output
- `axios@1.x` - For direct HTTP assertions

**Why These Exact Versions:**
OpenCode uses AI SDK 5.0.8. Any version mismatch could cause subtle parsing differences. The `content: null` bug is a perfect example - different AI SDK versions handle null differently.

### Architecture

**Single-File Approach:**
- Test client is a single TypeScript file for simplicity
- All tool definitions in one place (copied from OpenCode)
- Easy to modify and iterate
- No complex module system needed

**Real Tool Execution:**
- Tools execute LOCALLY (bash, read, write, etc.)
- Matches OpenCode's architecture exactly
- Allows testing complete workflows end-to-end

**No Mocking:**
- ALL HTTP requests go to real proxy server
- Proxy server makes real Qwen API calls
- Tests validate actual behavior, not mocked behavior

---

## Project Structure

```
test-client/
├── src/
│   ├── index.ts                    # Main test client entry point
│   ├── tools/
│   │   ├── definitions.ts          # All 11 tool definitions (copied from OpenCode)
│   │   ├── executor.ts             # Tool execution logic (bash, read, write, etc.)
│   │   └── types.ts                # Tool-related TypeScript types
│   ├── scenarios/
│   │   ├── single-tool.ts          # Single tool workflow tests
│   │   ├── multi-tool.ts           # Multi-tool workflow tests
│   │   ├── opencode-exact.ts       # Exact OpenCode scenario reproduction
│   │   └── streaming.ts            # Streaming response tests
│   ├── utils/
│   │   ├── logger.ts               # Logging utility
│   │   └── validator.ts            # Response validation
│   └── config.ts                   # Configuration loader
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Phase 1: Project Setup

**Priority:** HIGH

**Goal:** Initialize project with correct dependencies and TypeScript configuration matching OpenCode's setup.

**Files to Create:**
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration (matching OpenCode's compiler options)
- `.env.example` - Environment variable template
- `.env` - Actual environment configuration (gitignored)
- `README.md` - Test client usage documentation
- `src/config.ts` - Configuration loader

**Files to Modify:**
- None (new project)

**Integration Points:**
- None (standalone phase)

**Implementation Details:**

1. **Create package.json** with exact dependencies:
```json
{
  "name": "qwen-proxy-test-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "tsx src/index.ts",
    "test:single": "tsx src/scenarios/single-tool.ts",
    "test:multi": "tsx src/scenarios/multi-tool.ts",
    "test:exact": "tsx src/scenarios/opencode-exact.ts",
    "test:stream": "tsx src/scenarios/streaming.ts"
  },
  "dependencies": {
    "ai": "5.0.8",
    "@ai-sdk/openai": "1.0.12",
    "zod": "3.24.1",
    "dotenv": "16.4.7",
    "chalk": "5.4.1",
    "axios": "1.7.9"
  },
  "devDependencies": {
    "typescript": "5.7.2",
    "tsx": "4.21.2",
    "@types/node": "22.10.5"
  }
}
```

2. **Create tsconfig.json** matching OpenCode's TypeScript setup:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

3. **Create .env.example**:
```bash
PROXY_BASE_URL=http://localhost:3000
PROXY_MODEL=gpt-4
TEST_WORKING_DIR=/tmp/qwen_test_client
LOG_LEVEL=info
```

4. **Create src/config.ts**:
```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  proxyBaseUrl: process.env.PROXY_BASE_URL || 'http://localhost:3000',
  proxyModel: process.env.PROXY_MODEL || 'gpt-4',
  testWorkingDir: process.env.TEST_WORKING_DIR || '/tmp/qwen_test_client',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required config
if (!config.proxyBaseUrl) {
  throw new Error('PROXY_BASE_URL is required');
}
```

5. **Create README.md** with usage instructions

**Validation:**
- `npm install` completes without errors
- TypeScript compiles without errors
- Config loads correctly
- Exact AI SDK version 5.0.8 installed

---

## Phase 2: Tool Definitions

**Priority:** HIGH

**Goal:** Extract EXACT tool definitions from OpenCode source code. These definitions MUST be byte-for-byte identical to what OpenCode sends.

**Files to Create:**
- `src/tools/types.ts` - TypeScript interfaces for tool schemas
- `src/tools/definitions.ts` - All 11 tool definitions with complete JSON schemas

**Files to Modify:**
- None

**Integration Points:**
- `src/config.ts` - Uses config for working directory paths

**Implementation Details:**

**Extract tool schemas from OpenCode:**

From `/mnt/d/Projects/opencode/packages/opencode/src/tool/`:
- bash.ts → bash tool definition
- read.ts → read tool definition
- write.ts → write tool definition
- edit.ts → edit tool definition
- glob.ts → glob tool definition
- grep.ts → grep tool definition
- ls.ts → list tool definition
- webfetch.ts → webfetch tool definition
- todo.ts → todowrite + todoread tool definitions
- task.ts → task tool definition

**Create src/tools/types.ts:**
```typescript
import { z } from 'zod';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}
```

**Create src/tools/definitions.ts** with all 11 tools. Example for bash tool (extracted from OpenCode source):

```typescript
import { ToolDefinition } from './types.js';

export const bashTool: ToolDefinition = {
  type: 'function',
  function: {
    name: 'bash',
    description: `Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.

IMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.

[... FULL DESCRIPTION FROM bash.txt ...]`,
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute'
        },
        timeout: {
          type: 'number',
          description: 'Optional timeout in milliseconds (up to 600000)'
        },
        description: {
          type: 'string',
          description: 'Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: List files in current directory\n\nInput: git status\nOutput: Show working tree status\n\nInput: npm install\nOutput: Install package dependencies\n\nInput: mkdir foo\nOutput: Create directory \'foo\''
        }
      },
      required: ['command', 'description']
    }
  }
};

// Repeat for all 11 tools...

export const ALL_TOOLS: ToolDefinition[] = [
  bashTool,
  editTool,
  webfetchTool,
  globTool,
  grepTool,
  listTool,
  readTool,
  writeTool,
  todowriteTool,
  todoreadTool,
  taskTool
];
```

**Critical Requirements:**
1. Copy description text EXACTLY from OpenCode .txt files
2. Copy parameter schemas EXACTLY as defined in each tool's .ts file
3. Include ALL properties and descriptions
4. Match required fields exactly
5. Use same parameter names (file_path vs filePath matters!)

**Validation:**
- Count exactly 11 tool definitions
- Each tool has complete description
- Each tool has complete parameter schema
- Compare with actual OpenCode network traffic to verify match

---

## Phase 3: HTTP Client Setup

**Priority:** HIGH

**Goal:** Configure AI SDK OpenAI provider to connect to our proxy, matching OpenCode's exact HTTP client configuration.

**Files to Create:**
- `src/client.ts` - AI SDK client configuration

**Files to Modify:**
- None

**Integration Points:**
- `src/config.ts` - Uses proxy URL and model config
- `src/tools/definitions.ts` - Provides tool definitions to AI SDK

**Implementation Details:**

**Create src/client.ts:**

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { config } from './config.js';
import { ALL_TOOLS } from './tools/definitions.js';

// Create OpenAI provider pointing to our proxy
export const openai = createOpenAI({
  baseURL: `${config.proxyBaseUrl}/v1`,
  apiKey: 'dummy-key', // Proxy doesn't validate this
  compatibility: 'strict', // Use strict OpenAI compatibility
});

// Model configuration
export const model = openai.chat(config.proxyModel);

// Export tools for use in requests
export { ALL_TOOLS as tools };

// Helper to create messages array matching OpenCode format
export function createMessages(systemPrompt: string, userMessage: string) {
  return [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userMessage }
  ];
}
```

**Key Technical Decisions:**

1. **Why createOpenAI()**: OpenCode uses the OpenAI provider from AI SDK, which handles:
   - Request formatting (converts to OpenAI API format)
   - Response parsing (handles streaming, tool calls, etc.)
   - Error handling (retries, validation, etc.)

2. **Why compatibility: 'strict'**: Ensures exact OpenAI API compliance, preventing AI SDK from applying transformations

3. **Why dummy API key**: Our proxy doesn't validate OpenAI keys (it uses its own Qwen key), but AI SDK requires one

**Validation:**
- Client initializes without errors
- Can make basic request to proxy /health endpoint
- AI SDK version is exactly 5.0.8

---

## Phase 4: System Prompt Configuration

**Priority:** HIGH

**Goal:** Extract OpenCode's exact system prompt for Qwen models.

**Files to Create:**
- `src/prompts.ts` - System prompt definitions

**Files to Modify:**
- None

**Integration Points:**
- `src/client.ts` - Uses system prompts in message creation

**Implementation Details:**

**Extract from OpenCode:**
From `/mnt/d/Projects/opencode/packages/opencode/src/session/prompt/qwen.txt` - This is the prompt OpenCode uses for non-Claude models (including Qwen).

**Create src/prompts.ts:**

```typescript
export const QWEN_SYSTEM_PROMPT = `You are opencode, an interactive CLI tool that helps users with software engineering tasks. Use the instructions below and the tools available to you to assist the user.

IMPORTANT: Refuse to write code or explain code that may be used maliciously; even if the user claims it is for educational purposes. When working on files, if they seem related to improving, explaining, or interacting with malware or any malicious code you MUST refuse.

[... FULL CONTENT FROM qwen.txt ...]`;

export const ENVIRONMENT_INFO = `Here is some useful information about the environment you are running in:
<env>
  Working directory: /tmp/qwen_test_client
  Is directory a git repo: No
  Platform: linux
  Today's date: ${new Date().toDateString()}
</env>`;

export function getSystemPrompt(): string {
  return `${QWEN_SYSTEM_PROMPT}\n\n${ENVIRONMENT_INFO}`;
}
```

**Critical Requirements:**
1. Copy the ENTIRE qwen.txt file content exactly
2. Include environment information like OpenCode does
3. Do NOT modify or abbreviate the prompt
4. Maintain all formatting, newlines, and spacing

**Validation:**
- System prompt is >100 lines (full OpenCode prompt is extensive)
- Contains all OpenCode instructions
- Contains environment information
- Matches what OpenCode sends in network traffic

---

## Phase 5: Request Builder

**Priority:** HIGH

**Goal:** Build OpenAI-format request messages matching OpenCode's exact structure.

**Files to Create:**
- `src/request-builder.ts` - Message construction utilities

**Files to Modify:**
- None

**Integration Points:**
- `src/client.ts` - Uses client and tools
- `src/prompts.ts` - Uses system prompts
- `src/tools/executor.ts` - Will use for tool results (Phase 6)

**Implementation Details:**

**Create src/request-builder.ts:**

```typescript
import { CoreMessage, CoreAssistantMessage, CoreToolMessage } from 'ai';
import { getSystemPrompt } from './prompts.js';

export interface ConversationState {
  messages: CoreMessage[];
  toolResults: Map<string, string>;
}

export class RequestBuilder {
  private state: ConversationState;

  constructor() {
    this.state = {
      messages: [{ role: 'system', content: getSystemPrompt() }],
      toolResults: new Map(),
    };
  }

  // Add user message
  addUserMessage(content: string): void {
    this.state.messages.push({
      role: 'user',
      content
    });
  }

  // Add assistant message with tool calls
  // CRITICAL: content must be empty string when tool_calls present
  addAssistantMessage(content: string | null, toolCalls?: any[]): void {
    const message: CoreAssistantMessage = {
      role: 'assistant',
      content: content || '', // NEVER null
    };

    if (toolCalls && toolCalls.length > 0) {
      message.tool_calls = toolCalls;
      // CRITICAL: When tool calls present, content MUST be empty string
      message.content = content || '';
    }

    this.state.messages.push(message);
  }

  // Add tool result
  addToolResult(toolCallId: string, toolName: string, result: string): void {
    // Handle empty results (bash commands with no output)
    const content = result === ''
      ? '(Command completed successfully with no output)'
      : result;

    this.state.messages.push({
      role: 'tool',
      tool_call_id: toolCallId,
      content,
    });

    this.state.toolResults.set(toolCallId, content);
  }

  getMessages(): CoreMessage[] {
    return this.state.messages;
  }

  getLastMessage(): CoreMessage | undefined {
    return this.state.messages[this.state.messages.length - 1];
  }

  // Reset for new conversation
  reset(): void {
    this.state = {
      messages: [{ role: 'system', content: getSystemPrompt() }],
      toolResults: new Map(),
    };
  }
}
```

**Critical Implementation Notes:**

1. **content: never null**: The `content || ''` pattern ensures we NEVER send null content, which would break AI SDK parsing

2. **Empty result handling**: Bash commands like `mkdir`, `touch`, `cp` return empty strings. We transform these to explicit success messages

3. **Message ordering**: Messages must be in exact order: system → user → assistant → tool → user → ...

**Validation:**
- Messages array always starts with system message
- Assistant messages with tool_calls have `content: ""`
- Tool results never have empty strings (transformed to success message)
- Can build multi-turn conversations

---

## Phase 6: Multi-Turn Conversation Manager

**Priority:** HIGH

**Goal:** Manage complete multi-turn conversations with tool execution, matching OpenCode's flow.

**Files to Create:**
- `src/conversation-manager.ts` - Conversation orchestration
- `src/tools/executor.ts` - Tool execution logic

**Files to Modify:**
- None

**Integration Points:**
- `src/client.ts` - Uses AI SDK client
- `src/request-builder.ts` - Uses message builder
- `src/tools/definitions.ts` - Uses tool definitions
- `src/utils/logger.ts` - Uses logger (Phase 8)

**Implementation Details:**

**Create src/tools/executor.ts:**

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../config.js';

const execAsync = promisify(exec);

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export class ToolExecutor {
  // Execute bash command
  async bash(command: string, timeout?: number): Promise<ToolExecutionResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: config.testWorkingDir,
        timeout: timeout || 120000, // 2 minute default
      });
      const output = stdout + stderr;
      return { success: true, output: output || '' };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || error.stderr || '',
        error: error.message
      };
    }
  }

  // Read file
  async read(filePath: string, offset?: number, limit?: number): Promise<ToolExecutionResult> {
    try {
      const fullPath = path.resolve(config.testWorkingDir, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      const start = offset || 0;
      const end = limit ? start + limit : lines.length;
      const selectedLines = lines.slice(start, end);

      // Format like OpenCode does (with line numbers)
      const formatted = selectedLines.map((line, idx) => {
        const lineNum = (start + idx + 1).toString().padStart(5, '0');
        return `${lineNum}| ${line}`;
      }).join('\n');

      return { success: true, output: `<file>\n${formatted}\n</file>` };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  // Write file
  async write(filePath: string, content: string): Promise<ToolExecutionResult> {
    try {
      const fullPath = path.resolve(config.testWorkingDir, filePath);
      await fs.writeFile(fullPath, content, 'utf-8');
      return { success: true, output: '' };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  // Execute any tool by name
  async execute(toolName: string, args: any): Promise<ToolExecutionResult> {
    switch (toolName) {
      case 'bash':
        return this.bash(args.command, args.timeout);
      case 'read':
        return this.read(args.file_path, args.offset, args.limit);
      case 'write':
        return this.write(args.file_path, args.content);
      // Add other tools as needed for testing
      default:
        return {
          success: false,
          output: '',
          error: `Tool ${toolName} not implemented in test client`
        };
    }
  }
}
```

**Create src/conversation-manager.ts:**

```typescript
import { streamText } from 'ai';
import { model, tools } from './client.js';
import { RequestBuilder } from './request-builder.js';
import { ToolExecutor } from './tools/executor.js';

export interface ConversationOptions {
  maxTurns?: number;
  stream?: boolean;
}

export class ConversationManager {
  private requestBuilder: RequestBuilder;
  private toolExecutor: ToolExecutor;

  constructor() {
    this.requestBuilder = new RequestBuilder();
    this.toolExecutor = new ToolExecutor();
  }

  async run(userMessage: string, options: ConversationOptions = {}): Promise<void> {
    const maxTurns = options.maxTurns || 10;
    const stream = options.stream !== false; // Default true

    // Add initial user message
    this.requestBuilder.addUserMessage(userMessage);

    for (let turn = 0; turn < maxTurns; turn++) {
      console.log(`\n=== Turn ${turn + 1} ===`);

      // Make request to proxy
      const response = await streamText({
        model,
        messages: this.requestBuilder.getMessages(),
        tools, // All 11 OpenCode tools
        maxSteps: 1, // One step at a time like OpenCode
      });

      // Process response
      let textContent = '';
      const toolCalls: any[] = [];

      for await (const chunk of response.fullStream) {
        if (chunk.type === 'text-delta') {
          textContent += chunk.textDelta;
          if (stream) process.stdout.write(chunk.textDelta);
        } else if (chunk.type === 'tool-call') {
          toolCalls.push({
            id: chunk.toolCallId,
            type: 'function',
            function: {
              name: chunk.toolName,
              arguments: JSON.stringify(chunk.args)
            }
          });
        }
      }

      if (stream) console.log(''); // Newline after streaming

      // CRITICAL: Add assistant message with empty content if tool calls present
      this.requestBuilder.addAssistantMessage(
        textContent || null,
        toolCalls.length > 0 ? toolCalls : undefined
      );

      // If no tool calls, conversation is complete
      if (toolCalls.length === 0) {
        console.log('\n✓ Conversation complete');
        break;
      }

      // Execute tools
      console.log(`\nExecuting ${toolCalls.length} tool(s)...`);
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log(`  - ${toolName}(${JSON.stringify(args).slice(0, 100)}...)`);

        const result = await this.toolExecutor.execute(toolName, args);

        if (result.success) {
          this.requestBuilder.addToolResult(
            toolCall.id,
            toolName,
            result.output
          );
          console.log(`    ✓ Success`);
        } else {
          this.requestBuilder.addToolResult(
            toolCall.id,
            toolName,
            `Error: ${result.error}`
          );
          console.log(`    ✗ Error: ${result.error}`);
        }
      }
    }
  }

  reset(): void {
    this.requestBuilder.reset();
  }
}
```

**Critical Implementation Notes:**

1. **maxSteps: 1**: OpenCode uses single-step execution, waiting for tool results before continuing

2. **Tool execution is client-side**: Tools execute in the test client, not the proxy, matching OpenCode's architecture

3. **Error handling**: Failed tool executions still send results to the model (as error messages)

**Validation:**
- Can execute complete conversation with tool calls
- Tools execute correctly (bash, read, write)
- Multi-turn conversations work
- Conversation terminates when no tool calls returned

---

## Phase 7: Test Scenario Implementations

**Priority:** MEDIUM

**Goal:** Create specific test scenarios that validate proxy behavior.

**Files to Create:**
- `src/scenarios/single-tool.ts` - Single tool workflow tests
- `src/scenarios/multi-tool.ts` - Multi-tool workflow tests
- `src/scenarios/opencode-exact.ts` - Exact OpenCode scenario reproduction
- `src/scenarios/streaming.ts` - Streaming response tests

**Files to Modify:**
- None

**Integration Points:**
- `src/conversation-manager.ts` - Uses conversation manager
- `src/utils/logger.ts` - Uses logger
- `src/utils/validator.ts` - Uses validator

**Implementation Details:**

**Create src/scenarios/single-tool.ts:**

```typescript
import { ConversationManager } from '../conversation-manager.js';

export async function testBashTool() {
  console.log('\n🧪 Test: Bash Tool - ls command');
  const manager = new ConversationManager();
  await manager.run('List the files in the current directory using ls');
}

export async function testReadTool() {
  console.log('\n🧪 Test: Read Tool');
  const manager = new ConversationManager();
  // First create a test file
  await manager.run('Create a file called test.txt with content "Hello World"');
  manager.reset();
  // Then read it
  await manager.run('Read the file test.txt');
}

export async function testWriteTool() {
  console.log('\n🧪 Test: Write Tool');
  const manager = new ConversationManager();
  await manager.run('Write "Test Content" to file output.txt');
}

export async function runAllSingleToolTests() {
  await testBashTool();
  await testReadTool();
  await testWriteTool();
  // Add more as needed
}
```

**Create src/scenarios/multi-tool.ts:**

```typescript
import { ConversationManager } from '../conversation-manager.js';

export async function testGlobReadEdit() {
  console.log('\n🧪 Test: glob → read → edit workflow');
  const manager = new ConversationManager();
  await manager.run(`
    1. Find all .txt files in current directory
    2. Read the first one
    3. Add "EDITED" to the end of the file
  `);
}

export async function testBashGrepRead() {
  console.log('\n🧪 Test: bash → grep → read workflow');
  const manager = new ConversationManager();
  await manager.run(`
    1. Create 3 test files with different content
    2. Search for files containing "test"
    3. Read the matching files
  `);
}

export async function runAllMultiToolTests() {
  await testGlobReadEdit();
  await testBashGrepRead();
  // Add more workflow combinations
}
```

**Create src/scenarios/opencode-exact.ts:**

```typescript
import { ConversationManager } from '../conversation-manager.js';

// Reproduce exact OpenCode workflow from production logs
export async function testExactOpenCodeScenario() {
  console.log('\n🧪 Test: Exact OpenCode Scenario');

  const manager = new ConversationManager();

  // Scenario: User asks to read a file, model calls read tool,
  // receives result, then summarizes
  await manager.run('Read the file /tmp/qwen_test_client/example.txt');

  // Verify:
  // 1. Model calls read tool
  // 2. Tool result is received
  // 3. Model provides summary
  // 4. No null content errors
  // 5. No hanging
}

export async function testMultiTurnConversation() {
  console.log('\n🧪 Test: Multi-turn conversation (5 turns)');

  const manager = new ConversationManager();

  // Long conversation with multiple tool calls
  await manager.run(`
    Create a small project:
    1. Create directory "myproject"
    2. Create file "main.js" with console.log("Hello")
    3. Create file "package.json" with name and version
    4. List the directory structure
    5. Read main.js to verify
  `, { maxTurns: 15 });
}
```

**Create src/scenarios/streaming.ts:**

```typescript
import { ConversationManager } from '../conversation-manager.js';

export async function testStreaming() {
  console.log('\n🧪 Test: Streaming Response');

  const manager = new ConversationManager();
  await manager.run('Explain what ls command does', { stream: true });
}

export async function testStreamingWithToolCalls() {
  console.log('\n🧪 Test: Streaming with Tool Calls');

  const manager = new ConversationManager();
  await manager.run('List files and read the first one', { stream: true });
}
```

**Validation:**
- All test scenarios run without errors
- Tool calls are executed correctly
- Multi-turn conversations complete
- No null content errors
- No hanging or infinite loops

---

## Phase 8: Response Validation and Logging

**Priority:** MEDIUM

**Goal:** Add validation and detailed logging to verify proxy behavior.

**Files to Create:**
- `src/utils/logger.ts` - Logging utility
- `src/utils/validator.ts` - Response validation

**Files to Modify:**
- `src/conversation-manager.ts` - Add validation calls
- All scenario files - Add logging

**Integration Points:**
- Used by all scenarios and conversation manager

**Implementation Details:**

**Create src/utils/logger.ts:**

```typescript
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    const levelStr = process.env.LOG_LEVEL || 'info';
    this.level = LogLevel[levelStr.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO;
  }

  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${message}`), data || '');
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(`[INFO] ${message}`), data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.log(chalk.yellow(`[WARN] ${message}`), data || '');
    }
  }

  error(message: string, data?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.log(chalk.red(`[ERROR] ${message}`), data || '');
    }
  }

  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  failure(message: string): void {
    console.log(chalk.red(`✗ ${message}`));
  }
}

export const logger = new Logger();
```

**Create src/utils/validator.ts:**

```typescript
import { logger } from './logger.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ResponseValidator {
  // Validate assistant message with tool calls
  validateAssistantMessage(message: any): ValidationResult {
    const errors: string[] = [];

    // CRITICAL: Check content is never null
    if (message.content === null) {
      errors.push('CRITICAL: message.content is null (should be empty string)');
    }

    // If tool calls present, content should be empty string
    if (message.tool_calls && message.tool_calls.length > 0) {
      if (message.content !== '') {
        errors.push(`Expected empty content with tool calls, got: "${message.content}"`);
      }
    }

    // Validate tool call structure
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (!toolCall.id) {
          errors.push('Tool call missing id');
        }
        if (!toolCall.type || toolCall.type !== 'function') {
          errors.push(`Invalid tool call type: ${toolCall.type}`);
        }
        if (!toolCall.function || !toolCall.function.name) {
          errors.push('Tool call missing function name');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate complete response
  validateResponse(response: any): ValidationResult {
    const errors: string[] = [];

    if (!response.choices || response.choices.length === 0) {
      errors.push('Response missing choices array');
    }

    const message = response.choices?.[0]?.message;
    if (!message) {
      errors.push('Response missing message');
    } else {
      const msgValidation = this.validateAssistantMessage(message);
      errors.push(...msgValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Log validation results
  logValidation(result: ValidationResult, context: string): void {
    if (result.valid) {
      logger.success(`${context}: Validation passed`);
    } else {
      logger.failure(`${context}: Validation failed`);
      for (const error of result.errors) {
        logger.error(`  - ${error}`);
      }
    }
  }
}

export const validator = new ResponseValidator();
```

**Validation:**
- Logger outputs with correct colors
- Validator catches null content
- Validator catches invalid tool calls
- All validation errors are logged clearly

---

## Phase 9: CLI Interface

**Priority:** LOW

**Goal:** Create user-friendly CLI for manual testing.

**Files to Create:**
- `src/index.ts` - Main CLI entry point
- `src/cli.ts` - CLI argument parsing and menu

**Files to Modify:**
- `package.json` - Add CLI script

**Integration Points:**
- All scenario files

**Implementation Details:**

**Create src/index.ts:**

```typescript
#!/usr/bin/env node
import { runAllSingleToolTests } from './scenarios/single-tool.js';
import { runAllMultiToolTests } from './scenarios/multi-tool.js';
import { testExactOpenCodeScenario, testMultiTurnConversation } from './scenarios/opencode-exact.js';
import { testStreaming, testStreamingWithToolCalls } from './scenarios/streaming.js';
import { ConversationManager } from './conversation-manager.js';
import { logger } from './utils/logger.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🤖 Qwen Proxy Test Client\n');

  try {
    switch (command) {
      case 'single':
        await runAllSingleToolTests();
        break;
      case 'multi':
        await runAllMultiToolTests();
        break;
      case 'exact':
        await testExactOpenCodeScenario();
        await testMultiTurnConversation();
        break;
      case 'stream':
        await testStreaming();
        await testStreamingWithToolCalls();
        break;
      case 'interactive':
        await runInteractive();
        break;
      case 'all':
        await runAllTests();
        break;
      default:
        showHelp();
    }
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

async function runInteractive() {
  const manager = new ConversationManager();
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('Interactive mode. Type your message or "exit" to quit.\n');

  const prompt = () => {
    readline.question('You: ', async (input: string) => {
      if (input === 'exit') {
        readline.close();
        return;
      }

      await manager.run(input);
      prompt();
    });
  };

  prompt();
}

async function runAllTests() {
  await runAllSingleToolTests();
  await runAllMultiToolTests();
  await testExactOpenCodeScenario();
  await testMultiTurnConversation();
  await testStreaming();
  await testStreamingWithToolCalls();
}

function showHelp() {
  console.log(`Usage: npm test -- <command>

Commands:
  single      Run single-tool tests
  multi       Run multi-tool workflow tests
  exact       Run exact OpenCode scenario tests
  stream      Run streaming tests
  interactive Run interactive mode
  all         Run all tests

Examples:
  npm test -- single
  npm test -- interactive
  npm test -- all
`);
}

main();
```

**Update package.json scripts:**
```json
{
  "scripts": {
    "test": "tsx src/index.ts",
    "test:single": "tsx src/index.ts single",
    "test:multi": "tsx src/index.ts multi",
    "test:exact": "tsx src/index.ts exact",
    "test:stream": "tsx src/index.ts stream",
    "test:interactive": "tsx src/index.ts interactive",
    "test:all": "tsx src/index.ts all"
  }
}
```

**Validation:**
- CLI runs all test modes
- Interactive mode works
- Help text is clear
- Error handling is graceful

---

## Appendix A: OpenCode Tool Definitions

### 1. Bash Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/bash.ts`

```json
{
  "type": "function",
  "function": {
    "name": "bash",
    "description": "Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.\n\nIMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.\n\n[Full description from bash.txt]",
    "parameters": {
      "type": "object",
      "properties": {
        "command": {
          "type": "string",
          "description": "The command to execute"
        },
        "timeout": {
          "type": "number",
          "description": "Optional timeout in milliseconds (up to 600000)"
        },
        "description": {
          "type": "string",
          "description": "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: List files in current directory\n\nInput: git status\nOutput: Show working tree status\n\nInput: npm install\nOutput: Install package dependencies\n\nInput: mkdir foo\nOutput: Create directory 'foo'"
        }
      },
      "required": ["command", "description"]
    }
  }
}
```

### 2. Read Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/read.ts`

```json
{
  "type": "function",
  "function": {
    "name": "read",
    "description": "Reads a file from the local filesystem. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "The absolute path to the file to read"
        },
        "offset": {
          "type": "number",
          "description": "The line number to start reading from (0-based)"
        },
        "limit": {
          "type": "number",
          "description": "The number of lines to read (defaults to 2000)"
        }
      },
      "required": ["filePath"]
    }
  }
}
```

### 3. Write Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/write.ts`

```json
{
  "type": "function",
  "function": {
    "name": "write",
    "description": "Writes a file to the local filesystem. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "The absolute path to the file to write (must be absolute, not relative)"
        },
        "content": {
          "type": "string",
          "description": "The content to write to the file"
        }
      },
      "required": ["filePath", "content"]
    }
  }
}
```

### 4. Edit Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/edit.ts`

```json
{
  "type": "function",
  "function": {
    "name": "edit",
    "description": "Performs exact string replacements in files. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "filePath": {
          "type": "string",
          "description": "The absolute path to the file to modify"
        },
        "oldString": {
          "type": "string",
          "description": "The text to replace"
        },
        "newString": {
          "type": "string",
          "description": "The text to replace it with (must be different from oldString)"
        },
        "replaceAll": {
          "type": "boolean",
          "description": "Replace all occurrences of oldString (default false)"
        }
      },
      "required": ["filePath", "oldString", "newString"]
    }
  }
}
```

### 5. Glob Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/glob.ts`

```json
{
  "type": "function",
  "function": {
    "name": "glob",
    "description": "Fast file pattern matching tool. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string",
          "description": "The glob pattern to match files against"
        },
        "path": {
          "type": "string",
          "description": "The directory to search in. If not specified, the current working directory will be used."
        }
      },
      "required": ["pattern"]
    }
  }
}
```

### 6. Grep Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/grep.ts`

```json
{
  "type": "function",
  "function": {
    "name": "grep",
    "description": "A powerful search tool built on ripgrep. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "pattern": {
          "type": "string",
          "description": "The regex pattern to search for in file contents"
        },
        "path": {
          "type": "string",
          "description": "The directory to search in. Defaults to the current working directory."
        },
        "include": {
          "type": "string",
          "description": "File pattern to include in the search (e.g. \"*.js\", \"*.{ts,tsx}\")"
        }
      },
      "required": ["pattern"]
    }
  }
}
```

### 7. List Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/ls.ts`

```json
{
  "type": "function",
  "function": {
    "name": "list",
    "description": "Lists directory contents. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "The absolute path to the directory to list (must be absolute, not relative)"
        },
        "ignore": {
          "type": "array",
          "items": { "type": "string" },
          "description": "List of glob patterns to ignore"
        }
      }
    }
  }
}
```

### 8. WebFetch Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/webfetch.ts`

```json
{
  "type": "function",
  "function": {
    "name": "webfetch",
    "description": "Fetches content from a specified URL. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "url": {
          "type": "string",
          "description": "The URL to fetch content from"
        },
        "format": {
          "type": "string",
          "enum": ["text", "markdown", "html"],
          "description": "The format to return the content in (text, markdown, or html)"
        },
        "timeout": {
          "type": "number",
          "description": "Optional timeout in seconds (max 120)"
        }
      },
      "required": ["url", "format"]
    }
  }
}
```

### 9. TodoWrite Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/todo.ts`

```json
{
  "type": "function",
  "function": {
    "name": "todowrite",
    "description": "Use this tool to create and manage a structured task list. [Full description]",
    "parameters": {
      "type": "object",
      "properties": {
        "todos": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "content": { "type": "string" },
              "status": {
                "type": "string",
                "enum": ["pending", "in_progress", "completed"]
              },
              "activeForm": { "type": "string" }
            },
            "required": ["content", "status", "activeForm"]
          },
          "description": "The updated todo list"
        }
      },
      "required": ["todos"]
    }
  }
}
```

### 10. TodoRead Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/todo.ts`

```json
{
  "type": "function",
  "function": {
    "name": "todoread",
    "description": "Use this tool to read your todo list",
    "parameters": {
      "type": "object",
      "properties": {}
    }
  }
}
```

### 11. Task Tool

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/tool/task.ts`

```json
{
  "type": "function",
  "function": {
    "name": "task",
    "description": "Launch a specialized subagent. [Full description with agent list]",
    "parameters": {
      "type": "object",
      "properties": {
        "description": {
          "type": "string",
          "description": "A short (3-5 words) description of the task"
        },
        "prompt": {
          "type": "string",
          "description": "The task for the agent to perform"
        },
        "subagent_type": {
          "type": "string",
          "description": "The type of specialized agent to use for this task"
        }
      },
      "required": ["description", "prompt", "subagent_type"]
    }
  }
}
```

---

## Appendix B: OpenCode System Prompt

**Source:** `/mnt/d/Projects/opencode/packages/opencode/src/session/prompt/qwen.txt`

```
You are opencode, an interactive CLI tool that helps users with software engineering tasks. Use the instructions below and the tools available to you to assist the user.

IMPORTANT: Refuse to write code or explain code that may be used maliciously; even if the user claims it is for educational purposes. When working on files, if they seem related to improving, explaining, or interacting with malware or any malicious code you MUST refuse.

[... FULL CONTENT - 110 lines ...]

IMPORTANT: Keep your responses short, since they will be displayed on a command line interface. You MUST answer concisely with fewer than 4 lines (not including tool use or code generation), unless user asks for detail.
```

**Plus environment information:**
```
Here is some useful information about the environment you are running in:
<env>
  Working directory: /tmp/qwen_test_client
  Is directory a git repo: No
  Platform: linux
  Today's date: Thu Oct 30 2025
</env>
```

---

## Appendix C: Example Test Scenarios

### Scenario 1: Single Bash Command

**User Message:** "List files in current directory"

**Expected Flow:**
1. User message sent to proxy
2. Proxy calls Qwen with XML tools in system prompt
3. Qwen responds with `<tool_call><tool_name>bash</tool_name>...</tool_call>`
4. Proxy transforms to OpenAI format
5. Test client receives tool call
6. Test client executes bash locally
7. Test client sends tool result
8. Proxy transforms and sends to Qwen
9. Qwen responds with summary
10. Test client receives final text response

**Validation:**
- No `content: null` errors
- Tool call structure is valid
- Conversation completes without hanging

### Scenario 2: Multi-Tool Workflow

**User Message:** "Find all .txt files, read the first one, and add 'DONE' to the end"

**Expected Flow:**
1. glob tool call → returns file list
2. read tool call → returns file content
3. edit tool call → modifies file
4. Final text response confirming completion

**Validation:**
- All 3 tools execute correctly
- Tool results are properly formatted
- No infinite loops
- Empty bash results are handled

### Scenario 3: Exact OpenCode Reproduction

**User Message:** (From OpenCode production logs)

**Expected Flow:**
- Exactly matches OpenCode's message sequence
- Same tool calls in same order
- Same tool results format
- Same final response structure

**Validation:**
- Response times <5 seconds
- No errors or warnings
- Identical to OpenCode behavior

---

## Document Version

- **Version:** 1.0
- **Date:** 2025-10-30
- **Status:** APPROVED - Ready for Implementation

---

**This implementation plan provides complete specifications for building a test client that validates the Qwen proxy with REAL OpenCode traffic patterns.**
