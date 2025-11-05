# AI SDK v5 Tool Execution Investigation - Summary Report

## Investigation Complete ✅

**Status**: Successfully resolved tool execution issue in test client.

**Date**: 2025-10-31

---

## 1. Root Cause Analysis

### The Problem
When using `generateText()` with `maxToolRoundtrips: 5`, the AI SDK was:
- ❌ Making only 1 API request
- ❌ Returning empty text (`text: ""`)
- ❌ Not executing tools automatically
- ❌ Stopping after tool calls without getting final response

### The Root Cause
**The `maxToolRoundtrips` parameter does not exist in AI SDK v5.**

This parameter was deprecated in AI SDK v4.0 and replaced with different mechanisms:
- **v3.x**: Used `maxToolRoundtrips` parameter
- **v4.0**: Replaced with `maxSteps` parameter
- **v5.0**: Replaced with `stopWhen` parameter using `stepCountIs()` function

Since we were passing a non-existent parameter, the AI SDK used its default behavior of `stepCountIs(1)`, meaning it only performed 1 step and stopped immediately after receiving tool calls from the model.

---

## 2. The Solution

### Code Changes

#### Change 1: Import `stepCountIs` function
**File**: `/mnt/d/Projects/qwen_proxy_opencode/backend/test-client/src/http/client.js`

```javascript
// Before
import { generateText, streamText } from 'ai'

// After
import { generateText, streamText, stepCountIs } from 'ai'
```

#### Change 2: Replace `maxToolRoundtrips` with `stopWhen`
**File**: `/mnt/d/Projects/qwen_proxy_opencode/backend/test-client/src/http/client.js`

```javascript
// Before
const result = await generateText({
  model: provider.chat(config.model.name),
  messages,
  tools,
  maxToolRoundtrips: 5, // ❌ Doesn't exist in v5
})

// After
const result = await generateText({
  model: provider.chat(config.model.name),
  messages,
  tools,
  stopWhen: stepCountIs(5), // ✅ Correct for v5
})
```

#### Change 3: Update client to return steps
**File**: `/mnt/d/Projects/qwen_proxy_opencode/backend/test-client/src/client.js`

```javascript
return {
  text: result.text,
  toolCalls: result.toolCalls,
  toolResults: result.toolResults,
  steps: result.steps,           // Added
  finishReason: result.finishReason,
}
```

#### Change 4: Update tests to check steps
**File**: `/mnt/d/Projects/qwen_proxy_opencode/backend/test-client/src/scenarios/single-tool.js`

```javascript
// Before: Checking toolCalls (which is 0 in final step)
if (!response.toolCalls || response.toolCalls.length === 0) {
  logger.warn('Expected tool call for bash, but none received')
  return false
}

// After: Checking steps and text content
const hasToolExecution = response.steps && response.steps.length > 1
const hasFileList = response.text && response.text.includes('package.json')

if (!hasToolExecution && !hasFileList) {
  logger.warn('Expected bash tool execution with file list, but none found')
  return false
}
```

---

## 3. How It Works Now

### Multi-Step Tool Execution Flow

With `stopWhen: stepCountIs(5)`, the AI SDK automatically:

1. **Step 1**: Model receives user message and tools
   - Model decides to call `bash` tool with `{ command: "ls" }`
   - AI SDK executes the tool CLIENT-SIDE
   - Returns: `toolCalls: 1`, `text: ""` (empty)

2. **Step 2**: AI SDK sends tool result back to model
   - Model receives tool execution result (file list)
   - Model generates final text response
   - Returns: `toolCalls: 0`, `text: "The files are..."` (with content)

3. **Complete**: `finishReason: "stop"`
   - Total steps: 2
   - Final text contains the presented results
   - Tool was executed and results incorporated

### Result Object Structure

```javascript
{
  text: "The files in the current directory are...",  // Final response
  toolCalls: 0,           // Tool calls in LAST step only (usually 0)
  toolResults: 0,         // Tool results in LAST step only
  steps: [                // Array of all steps
    {
      toolCalls: [{ name: 'bash', args: { command: 'ls' } }],
      toolResults: [{ result: 'file1.js\nfile2.js\n...' }],
      text: ""
    },
    {
      toolCalls: [],
      toolResults: [],
      text: "The files in the current directory are..."
    }
  ],
  finishReason: "stop"    // "stop" = normal completion
}
```

---

## 4. Test Results

### Before Fix
```bash
Steps: 1
Text: ""
Tool Calls: 1
Finish Reason: tool-calls
Status: ❌ FAILED (tool not executed)
```

### After Fix
```bash
Steps: 2
Text: "The files in the current directory are..."
Tool Calls: 0
Finish Reason: stop
Status: ✅ PASSED (tool executed, results presented)
```

### All Tests Passing
```bash
✅ bash tool test - PASSED
✅ write tool test - PASSED
✅ glob tool test - PASSED
```

---

## 5. Key Insights

### Why This Was Confusing

1. **The parameter name changed**: `maxToolRoundtrips` → `stopWhen`
2. **No error was thrown**: Invalid parameters are silently ignored
3. **Tools were defined correctly**: The issue wasn't with tool format
4. **LM Studio was working**: The provider-router was transforming tools correctly
5. **One request was made**: Made it seem like the SDK wasn't trying

### What We Learned

1. **AI SDK v5 uses `stopWhen`**: This is the ONLY way to enable multi-step execution
2. **Default is 1 step**: Without `stopWhen`, tools won't be executed automatically
3. **Tools execute client-side**: The `execute` function in tool definitions is called by AI SDK
4. **Steps array contains history**: Use `result.steps` to see all tool calls and results
5. **Final `toolCalls` is 0**: In successful multi-step execution, final step has no tool calls

---

## 6. Benefits of This Approach

### Compared to Manual Tool Execution

| Aspect | Manual Approach | AI SDK v5 with `stopWhen` |
|--------|----------------|---------------------------|
| **Code Complexity** | High (loop, state management) | Low (automatic) |
| **Tool Execution** | Manual | Automatic |
| **Message Management** | Manual | Automatic |
| **Loop Protection** | Manual counter | Built-in with `stepCountIs()` |
| **Debugging** | Custom logging | Built-in `steps` array |
| **Error Handling** | Manual try-catch | Automatic tool-error messages |

### Automatic Features

- ✅ Tools execute automatically
- ✅ Tool results sent back automatically
- ✅ Multi-turn conversation handled automatically
- ✅ Loop protection with `stepCountIs(n)`
- ✅ Complete execution history in `steps` array
- ✅ Proper finish reasons ("stop" vs "tool-calls")

---

## 7. Files Modified

1. **src/http/client.js**
   - Added `stepCountIs` import
   - Changed `maxToolRoundtrips: 5` → `stopWhen: stepCountIs(5)`
   - Updated logging to show steps

2. **src/client.js**
   - Added `steps` and `toolResults` to return value

3. **src/scenarios/single-tool.js**
   - Updated all test validation logic
   - Check `steps.length > 1` instead of `toolCalls.length > 0`
   - Validate final text content

4. **src/utils/logger.js**
   - Added `success()` method for green success messages

---

## 8. Migration Guide for Others

If you're using AI SDK and have similar issues:

### Step 1: Check your version
```bash
npm list ai
# Should be 5.x or higher
```

### Step 2: Update parameter
```javascript
// Remove this
maxToolRoundtrips: 5

// Add this
stopWhen: stepCountIs(5)
```

### Step 3: Import function
```javascript
import { generateText, stepCountIs } from 'ai'
```

### Step 4: Update result handling
```javascript
// Use result.steps for debugging
console.log('Steps:', result.steps?.length)
console.log('Final text:', result.text)
```

---

## 9. References

- [AI SDK v5 generateText Documentation](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text)
- [AI SDK v5 Tool Calling Guide](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [Migration Guide: v4.0 to v5.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0)
- [Migration Guide: v3.4 to v4.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-4-0)

---

## 10. Conclusion

### Problem Solved ✅

The tool execution issue was caused by using a deprecated parameter (`maxToolRoundtrips`) that was removed in AI SDK v4.0. By replacing it with the correct v5 parameter (`stopWhen: stepCountIs(5)`), the AI SDK now automatically:

1. Executes tools client-side
2. Sends tool results back to the model
3. Gets final text response
4. Returns complete execution history

### Working Implementation ✅

The test client now correctly implements AI SDK v5's automatic tool execution, matching the intended behavior where:
- Tools are defined with `description`, `parameters` (Zod schema), and `execute` function
- The AI SDK calls `execute` automatically during multi-step execution
- Final result contains the model's text response after incorporating tool results
- No manual message management or loop handling required

### Tests Passing ✅

All single-tool tests now pass:
- Bash tool (ls command) - PASSED
- Write tool (file creation) - PASSED
- Glob tool (file search) - PASSED

---

**Investigation completed successfully by Claude Code on 2025-10-31**
