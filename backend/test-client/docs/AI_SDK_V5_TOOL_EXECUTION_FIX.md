# AI SDK v5 Tool Execution Fix - Investigation Report

## Problem Statement

Tool calling wasn't working properly in the test client. When using `generateText()` with `maxToolRoundtrips: 5`, the AI SDK would:
- Make only 1 request
- Return with `text: ""` (empty text)
- Return with `toolCalls: 1` but no actual results
- Tools were NOT being executed

## Root Cause

**The `maxToolRoundtrips` parameter does not exist in AI SDK v5.**

The parameter was removed in AI SDK v4.0 and replaced with a different mechanism:
- v3.x: Used `maxToolRoundtrips`
- v4.0: Replaced with `maxSteps`
- v5.0: Replaced `maxSteps` with `stopWhen`

Since we were passing a parameter that doesn't exist, the AI SDK was using its default behavior of `stepCountIs(1)`, which means it only performed 1 step and stopped after the first tool call without executing the tool and getting the final response.

## Solution

Replace `maxToolRoundtrips: 5` with `stopWhen: stepCountIs(5)`:

### Before:
```javascript
import { generateText } from 'ai'

const result = await generateText({
  model: provider.chat(config.model.name),
  messages,
  tools,
  maxToolRoundtrips: 5, // ❌ This parameter doesn't exist in v5!
})
```

### After:
```javascript
import { generateText, stepCountIs } from 'ai'

const result = await generateText({
  model: provider.chat(config.model.name),
  messages,
  tools,
  stopWhen: stepCountIs(5), // ✅ Correct parameter for v5
})
```

## How Multi-Step Tool Calling Works in AI SDK v5

### 1. Default Behavior
By default, `generateText()` runs for **a single step only**. This means:
- Model receives messages and tools
- Model may return tool calls
- Execution stops immediately (no tool execution)

### 2. With `stopWhen`
When `stopWhen` is set, the AI SDK automatically:
1. Sends initial request with messages and tools
2. Receives response with tool calls
3. **Executes the tools client-side** (calls the `execute` function)
4. Sends tool results back to the model
5. Receives final text response
6. Repeats steps 2-5 until no more tool calls or stopping condition is met

### 3. The `stepCountIs()` Function
- `stepCountIs(n)` limits the number of steps to `n`
- This prevents infinite loops
- Each step can include multiple tool calls
- The model decides when to stop calling tools

### 4. Result Structure
The result object contains:
- `text`: Final text response from the model
- `steps`: Array of all steps (each step includes tool calls and results)
- `toolCalls`: Tool calls from the LAST step only (usually 0 in final step)
- `toolResults`: Tool results from the LAST step only
- `finishReason`: Either "stop" (normal completion) or "tool-calls" (stopped with pending tools)

## Key Differences from Manual Tool Execution

### Manual Approach (Before)
```javascript
let conversation = [userMessage]
let continueConversation = true

while (continueConversation) {
  const result = await generateText({ messages: conversation, tools })

  if (result.toolCalls?.length > 0) {
    // Manually execute each tool
    for (const toolCall of result.toolCalls) {
      const result = await executeTool(toolCall.name, toolCall.args)
      conversation.push({ role: 'tool', content: result })
    }
  } else {
    continueConversation = false
  }
}
```

### Automatic Approach (With `stopWhen`)
```javascript
// AI SDK handles everything automatically
const result = await generateText({
  messages: conversation,
  tools,
  stopWhen: stepCountIs(5)
})

// Tools are executed automatically
// result.text contains final response
// result.steps contains execution history
```

## Code Changes Made

### 1. `/src/http/client.js`
- Added import: `stepCountIs` from 'ai'
- Changed: `maxToolRoundtrips: 5` → `stopWhen: stepCountIs(5)`

### 2. `/src/client.js`
- Updated return value to include `steps` and `toolResults`
- These are needed for debugging and testing

### 3. `/src/scenarios/single-tool.js`
- Updated test validation to check `steps` array instead of `toolCalls`
- With `stopWhen`, the final result has `toolCalls: 0` because tool calls are in the steps

### 4. `/src/utils/logger.js`
- Added `success()` method for test success messages

## Test Results

### Before Fix
```
Text: ""
Tool Calls: 1
Steps: 1
Finish Reason: tool-calls
Status: ❌ Failed (tool not executed)
```

### After Fix
```
Text: "The files in the current directory are PHASE3_COMPLETE.md, README.md..."
Tool Calls: 0
Steps: 2
Finish Reason: stop
Status: ✅ Passed (tool executed and results presented)
```

## Benefits of Using `stopWhen`

1. **Automatic Tool Execution**: No need to manually execute tools and manage conversation state
2. **Simpler Code**: The AI SDK handles the multi-turn conversation loop
3. **Built-in Safety**: `stepCountIs(n)` prevents infinite loops
4. **Better Debugging**: `result.steps` provides complete execution history
5. **More Flexible**: Can use custom stop conditions instead of just counting steps

## Alternative Stop Conditions

Besides `stepCountIs()`, you can create custom stop conditions:

```javascript
// Stop after specific tool is called
stopWhen: (step) => step.toolCalls?.some(tc => tc.name === 'final_answer')

// Stop when no more tool calls
stopWhen: (step) => step.toolCalls?.length === 0

// Stop after total token limit
stopWhen: (step, steps) => {
  const totalTokens = steps.reduce((sum, s) => sum + s.usage.totalTokens, 0)
  return totalTokens > 10000
}
```

## References

- [AI SDK v5 Documentation](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text)
- [AI SDK v5 Tool Calling Guide](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [Migration Guide v4.0 to v5.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0)
- [Migration Guide v3.4 to v4.0](https://ai-sdk.dev/docs/migration-guides/migration-guide-4-0) (where maxToolRoundtrips was removed)

## Conclusion

The fix was simple: replace the non-existent `maxToolRoundtrips` parameter with the correct `stopWhen: stepCountIs(5)` parameter. This enables automatic multi-step tool execution in AI SDK v5, where the SDK handles tool execution internally and returns the final text response after all tool calls are complete.
