# Quick Fix Guide: AI SDK v5 Tool Execution

## TL;DR

**Problem**: Tools not executing with `maxToolRoundtrips: 5`
**Cause**: Parameter doesn't exist in AI SDK v5
**Solution**: Use `stopWhen: stepCountIs(5)` instead

---

## The Fix (3 lines of code)

### 1. Add import
```javascript
import { generateText, stepCountIs } from 'ai'  // Add stepCountIs
```

### 2. Replace parameter
```javascript
const result = await generateText({
  model: provider.chat('model-name'),
  messages,
  tools,
  stopWhen: stepCountIs(5),  // Use this, NOT maxToolRoundtrips
})
```

### 3. Done!
Tools now execute automatically. Check `result.steps` for execution history.

---

## Before vs After

### ❌ Before (Broken)
```javascript
import { generateText } from 'ai'

const result = await generateText({
  messages,
  tools,
  maxToolRoundtrips: 5,  // Doesn't exist!
})

// Result:
// - Steps: 1
// - Text: "" (empty)
// - Finish: "tool-calls"
// - Tools: NOT executed
```

### ✅ After (Working)
```javascript
import { generateText, stepCountIs } from 'ai'

const result = await generateText({
  messages,
  tools,
  stopWhen: stepCountIs(5),  // Correct!
})

// Result:
// - Steps: 2+
// - Text: "The files are..." (has content)
// - Finish: "stop"
// - Tools: Executed automatically
```

---

## Understanding the Result

### Result Structure
```javascript
{
  text: "Final response text",  // What you want
  steps: [                        // Execution history
    { toolCalls: [...], toolResults: [...], text: "" },
    { toolCalls: [], toolResults: [], text: "Final response text" }
  ],
  finishReason: "stop"            // "stop" = success
}
```

### What to Check
- ✅ `result.steps.length > 1` = Tools were executed
- ✅ `result.finishReason === "stop"` = Completed successfully
- ✅ `result.text` has content = Model presented results

---

## Parameter Evolution

| Version | Parameter |
|---------|-----------|
| v3.x | `maxToolRoundtrips` |
| v4.0 | `maxSteps` |
| v5.0 | `stopWhen: stepCountIs(n)` |

**Note**: v5 still supports `maxSteps` but `stopWhen` is recommended.

---

## Common Mistakes

### ❌ Mistake 1: Using old parameter
```javascript
maxToolRoundtrips: 5  // Silently ignored!
```

### ❌ Mistake 2: Checking toolCalls in final result
```javascript
if (result.toolCalls?.length > 0)  // Always 0 in final step!
```

### ❌ Mistake 3: Not importing stepCountIs
```javascript
import { generateText } from 'ai'
// Missing: stepCountIs
```

### ✅ Correct Approach
```javascript
import { generateText, stepCountIs } from 'ai'

const result = await generateText({
  messages,
  tools,
  stopWhen: stepCountIs(5),
})

// Check steps, not toolCalls
if (result.steps?.length > 1) {
  console.log('Tools were executed!')
}
```

---

## Need More Details?

See:
- `AI_SDK_V5_TOOL_EXECUTION_FIX.md` - Detailed technical explanation
- `INVESTIGATION_SUMMARY.md` - Complete investigation report
- [AI SDK Docs](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)

---

**Fixed and tested on 2025-10-31**
