# Roo-Cline Response Transformer Specification

**Status**: Feasibility Analysis & Implementation Specification
**Date**: 2025-10-29
**Context**: See `ROO_ACCURATE_TEST_RESULTS.md` for test results

## Problem Statement

Qwen models do NOT generate XML tool calls as expected by Roo-Cline, despite a 38KB system prompt with extensive XML examples. Instead, they return:

1. **JSON in code blocks** (20% of responses): `` ```tool_code\n{"tool": "list_files", "path": "."}\n``` ``
2. **Natural language explanations** (65%): "I'll need to list the files first..."
3. **Shell/Python commands** (10%): `` ```bash\nnpm test\n``` ``
4. **Questions** (5%): "Which file would you like to update?"

## Gap Analysis

### What Roo-Cline Expects

```xml
<read_file>
<args>
  <file>
    <path>README.md</path>
  </file>
</args>
</read_file>
```

### What Qwen Generates

**Pattern 1: JSON Code Blocks** (Most Transformable)
```markdown
I'll use the list_files tool to explore the directory:

```tool_code
{"tool": "list_files", "path": "."}
```
```

**Pattern 2: Shell Commands**
```markdown
Let me run the tests:

```bash
npm test
```
```

**Pattern 3: Natural Language**
```
I need to read the package.json file first to understand the dependencies.
```

**Pattern 4: Questions** (Should NOT Transform)
```
Which configuration file would you like to update?
```

## Transformer Feasibility

### High Confidence (✅ Implement)

**Pattern**: JSON in code blocks with `tool_code` language tag

**Example**:
```markdown
```tool_code
{"tool": "list_files", "path": ".", "recursive": false}
```
```

**Transformation**:
```xml
<list_files>
<path>.</path>
<recursive>false</recursive>
</list_files>
```

**Accuracy**: 95%
**Risk**: Low - structured format, clear intent

### Medium Confidence (⚠️ Optional)

**Pattern**: Shell commands in code blocks

**Example**:
```markdown
```bash
npm test
```
```

**Transformation**:
```xml
<execute_command>
<command>npm test</command>
</execute_command>
```

**Accuracy**: 80%
**Risk**: Medium - needs command validation

### Low Confidence (❌ Do Not Implement)

**Pattern**: Natural language with tool mentions

**Example**:
```
I'll need to list the files in the current directory to see what's available.
```

**Potential Transformation** (too risky):
```xml
<list_files>
<path>.</path>
</list_files>
```

**Accuracy**: 30-60%
**Risk**: High - ambiguous intent, false positives

### Do Not Transform

1. **Questions**: Model asking for clarification
2. **Pure Explanations**: Describing approach without action
3. **Multi-step Descriptions**: Explaining entire workflow
4. **Error Messages**: Model explaining why it can't proceed

## Implementation Specification

### Phase 1: JSON Code Block Transformer (Recommended)

#### Architecture

```
┌─────────────────┐
│  Qwen Response  │
│   (Streaming)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Buffer Complete │
│    Response     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pattern Matcher │
│  - JSON blocks  │
│  - Tool intent  │
└────────┬────────┘
         │
         ▼
    ┌───┴───┐
    │Found? │
    └───┬───┘
        │
    Yes │ No (pass through unchanged)
        │
        ▼
┌─────────────────┐
│ JSON → XML      │
│  Transformer    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validation &    │
│ Safety Check    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Modified │
│    Response     │
└─────────────────┘
```

#### Core Components

**1. Pattern Detector**

```javascript
class ToolCallDetector {
  /**
   * Detect JSON tool calls in code blocks
   * @param {string} content - Response content
   * @returns {Object|null} - Detected tool call or null
   */
  detectJsonToolCall(content) {
    // Pattern: ```tool_code\n{"tool": "...", ...}\n```
    const pattern = /```tool_code\s*\n({[\s\S]+?})\s*\n```/;
    const match = content.match(pattern);

    if (!match) return null;

    try {
      const json = JSON.parse(match[1]);
      if (json.tool) {
        return {
          type: 'json_code_block',
          rawMatch: match[0],
          toolName: json.tool,
          parameters: json,
          confidence: 0.95
        };
      }
    } catch (e) {
      return null;
    }

    return null;
  }

  /**
   * Detect shell commands that map to execute_command
   * @param {string} content
   * @returns {Object|null}
   */
  detectShellCommand(content) {
    // Pattern: ```bash\ncommand\n```
    const pattern = /```(?:bash|sh|shell)\s*\n([^\n]+)\s*\n```/;
    const match = content.match(pattern);

    if (!match) return null;

    return {
      type: 'shell_command',
      rawMatch: match[0],
      toolName: 'execute_command',
      command: match[1].trim(),
      confidence: 0.80
    };
  }
}
```

**2. XML Generator**

```javascript
class XmlToolCallGenerator {
  /**
   * Tool-specific XML generators
   */

  generateReadFile(params) {
    const path = params.path || params.file;
    return `<read_file>
<args>
  <file>
    <path>${this.escape(path)}</path>
  </file>
</args>
</read_file>`;
  }

  generateListFiles(params) {
    const path = params.path || '.';
    const recursive = params.recursive ? 'true' : 'false';

    return `<list_files>
<path>${this.escape(path)}</path>
<recursive>${recursive}</recursive>
</list_files>`;
  }

  generateSearchFiles(params) {
    return `<search_files>
<path>${this.escape(params.path || '.')}</path>
<regex>${this.escape(params.regex || params.pattern)}</regex>
${params.file_pattern ? `<file_pattern>${this.escape(params.file_pattern)}</file_pattern>` : ''}
</search_files>`;
  }

  generateExecuteCommand(params) {
    const command = params.command || params.cmd;
    const cwd = params.cwd;

    return `<execute_command>
<command>${this.escape(command)}</command>
${cwd ? `<cwd>${this.escape(cwd)}</cwd>` : ''}
</execute_command>`;
  }

  generateWriteToFile(params) {
    return `<write_to_file>
<path>${this.escape(params.path)}</path>
<content>
${this.escape(params.content)}
</content>
<line_count>${params.line_count || this.countLines(params.content)}</line_count>
</write_to_file>`;
  }

  generateApplyDiff(params) {
    return `<apply_diff>
<path>${this.escape(params.path)}</path>
<diff>
${this.escape(params.diff)}
</diff>
</apply_diff>`;
  }

  generateAskFollowup(params) {
    const suggestions = params.suggestions || params.options || [];
    const suggestTags = suggestions
      .map(s => `<suggest>${this.escape(s)}</suggest>`)
      .join('\n');

    return `<ask_followup_question>
<question>${this.escape(params.question)}</question>
<follow_up>
${suggestTags}
</follow_up>
</ask_followup_question>`;
  }

  generateAttemptCompletion(params) {
    return `<attempt_completion>
<result>
${this.escape(params.result)}
</result>
</attempt_completion>`;
  }

  /**
   * Main transformation entry point
   */
  transform(detected) {
    const { toolName, parameters } = detected;

    // Map tool names to generators
    const generators = {
      'read_file': this.generateReadFile,
      'list_files': this.generateListFiles,
      'search_files': this.generateSearchFiles,
      'execute_command': this.generateExecuteCommand,
      'write_to_file': this.generateWriteToFile,
      'apply_diff': this.generateApplyDiff,
      'ask_followup': this.generateAskFollowup,
      'attempt_completion': this.generateAttemptCompletion
    };

    const generator = generators[toolName];
    if (!generator) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return generator.call(this, parameters);
  }

  /**
   * Escape XML special characters
   */
  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Count lines in content
   */
  countLines(content) {
    return (content || '').split('\n').length;
  }
}
```

**3. Main Transformer**

```javascript
class RooResponseTransformer {
  constructor() {
    this.detector = new ToolCallDetector();
    this.generator = new XmlToolCallGenerator();
    this.config = {
      enableJsonTransform: true,
      enableShellTransform: false, // Disable by default - too risky
      minConfidence: 0.90,
      dryRun: false // Set to true for testing
    };
  }

  /**
   * Transform streaming response
   * @param {string} content - Complete response content
   * @returns {string} - Transformed content or original
   */
  transform(content) {
    // 1. Detect tool calls
    const detected = this.detectToolCall(content);

    if (!detected) {
      return content; // No transformation needed
    }

    // 2. Check confidence threshold
    if (detected.confidence < this.config.minConfidence) {
      console.warn(`[Transformer] Low confidence (${detected.confidence}), skipping transformation`);
      return content;
    }

    // 3. Generate XML
    try {
      const xmlToolCall = this.generator.transform(detected);

      // 4. Replace JSON code block with XML
      const transformed = content.replace(
        detected.rawMatch,
        xmlToolCall
      );

      // 5. Validate transformation
      if (this.validate(transformed, xmlToolCall)) {
        if (this.config.dryRun) {
          console.log('[Transformer] DRY RUN - Would transform:');
          console.log('  Original:', detected.rawMatch);
          console.log('  Transformed:', xmlToolCall);
          return content; // Return original in dry run
        }

        console.log(`[Transformer] Transformed ${detected.toolName} call`);
        return transformed;
      }

      console.warn('[Transformer] Validation failed, returning original');
      return content;

    } catch (error) {
      console.error('[Transformer] Error:', error);
      return content; // Return original on error
    }
  }

  /**
   * Detect tool call in content
   */
  detectToolCall(content) {
    if (this.config.enableJsonTransform) {
      const jsonCall = this.detector.detectJsonToolCall(content);
      if (jsonCall) return jsonCall;
    }

    if (this.config.enableShellTransform) {
      const shellCall = this.detector.detectShellCommand(content);
      if (shellCall) return shellCall;
    }

    return null;
  }

  /**
   * Validate transformed response
   */
  validate(transformed, xmlToolCall) {
    // Check XML is well-formed
    if (!xmlToolCall.startsWith('<') || !xmlToolCall.endsWith('>')) {
      return false;
    }

    // Check required tags are present
    const toolName = xmlToolCall.match(/<(\w+)>/)?.[1];
    if (!toolName) return false;

    // Check closing tag matches
    const closingTag = `</${toolName}>`;
    if (!xmlToolCall.includes(closingTag)) {
      return false;
    }

    return true;
  }
}
```

**4. Integration with Proxy**

```javascript
// In qwen-proxy streaming handler

const transformer = new RooResponseTransformer();

// After receiving complete response
if (isRooCodeClient) {
  const transformed = transformer.transform(completeContent);
  // Stream transformed content to client
}
```

### Phase 2: Shell Command Transformer (Optional)

Only implement if Phase 1 proves successful and there's demand.

**Detection**:
```javascript
// Detect: ```bash\nnpm test\n```
// Transform to: <execute_command><command>npm test</command></execute_command>
```

**Challenges**:
- Command validation (is it safe?)
- Multi-line commands
- Commands with pipes/redirects
- Working directory inference

**Risk Mitigation**:
- Whitelist allowed commands
- Validate command structure
- Require explicit working directory
- Log all transformations for audit

## Safety & Validation

### Safety Checks

1. **Confidence Threshold**: Only transform high-confidence patterns (>90%)
2. **Dry Run Mode**: Test transformations without applying them
3. **Logging**: Log all transformations for debugging
4. **Fallback**: Return original content on any error
5. **Whitelist**: Only transform known tool names
6. **Validation**: Validate XML structure before returning

### Error Handling

```javascript
try {
  const transformed = transformer.transform(content);
  return transformed;
} catch (error) {
  console.error('[Transformer] Fatal error:', error);
  // ALWAYS return original content on error
  return originalContent;
}
```

### Monitoring

Log these metrics:
- Transformation attempts
- Successful transformations
- Failed transformations
- Confidence scores
- Tool types transformed
- Error rates

## Testing Strategy

### Unit Tests

```javascript
describe('RooResponseTransformer', () => {
  test('should transform JSON list_files call', () => {
    const input = 'Let me check:\\n```tool_code\\n{"tool": "list_files", "path": "."}\\n```';
    const output = transformer.transform(input);
    expect(output).toContain('<list_files>');
    expect(output).toContain('<path>.</path>');
  });

  test('should not transform natural language', () => {
    const input = 'I need to list the files first.';
    const output = transformer.transform(input);
    expect(output).toBe(input); // Unchanged
  });

  test('should handle malformed JSON', () => {
    const input = '```tool_code\\n{invalid json}\\n```';
    const output = transformer.transform(input);
    expect(output).toBe(input); // Unchanged
  });
});
```

### Integration Tests

```javascript
describe('Transformer Integration', () => {
  test('should work with real Qwen response', async () => {
    const response = await qwenRequest({
      task: 'List files in current directory'
    });

    const transformed = transformer.transform(response.content);
    expect(transformed).toMatch(/<list_files>[\s\S]*<\/list_files>/);
  });
});
```

### A/B Testing

1. Run transformer in **dry run mode** for 1 week
2. Log all would-be transformations
3. Analyze success rate
4. Enable for 10% of requests
5. Monitor error rates
6. Gradually increase to 100%

## Configuration

```javascript
// config/transformer.js
module.exports = {
  enabled: true,
  dryRun: false, // Set to true for testing

  patterns: {
    jsonCodeBlocks: true,
    shellCommands: false, // Disabled by default
    naturalLanguage: false // Never enable
  },

  confidence: {
    minimum: 0.90,
    jsonCodeBlock: 0.95,
    shellCommand: 0.80
  },

  safety: {
    validateXml: true,
    logTransformations: true,
    fallbackToOriginal: true
  },

  tools: {
    whitelist: [
      'read_file',
      'list_files',
      'search_files',
      'execute_command',
      'write_to_file',
      'apply_diff',
      'ask_followup_question',
      'attempt_completion'
    ]
  }
};
```

## Deployment Plan

### Phase 1: Development (Week 1)
- Implement core transformer
- Unit tests
- Integration tests

### Phase 2: Testing (Week 2)
- Deploy in dry run mode
- Collect transformation data
- Analyze success rates
- Fix edge cases

### Phase 3: Canary (Week 3)
- Enable for 10% of Roo-Cline requests
- Monitor error rates
- Monitor user feedback
- Collect metrics

### Phase 4: Full Rollout (Week 4+)
- Gradually increase to 100%
- Continue monitoring
- Iterate based on feedback

## Alternative Solutions

Before implementing transformer, consider:

### 1. Prompt Engineering

Modify system prompt to be more explicit:

```
CRITICAL: You MUST respond with XML tool calls ONLY. Do NOT use JSON or natural language.

WRONG:
```tool_code
{"tool": "list_files", "path": "."}
```

CORRECT:
<list_files>
<path>.</path>
</list_files>
```

### 2. Model Fine-tuning

Fine-tune Qwen models on XML tool format:
- Create dataset of task → XML tool call pairs
- Fine-tune qwen3-max on this dataset
- Test improved XML generation rate

### 3. Different Models

Test other models that might handle XML better:
- Claude (Anthropic) - known for following system prompts
- GPT-4 (OpenAI) - strong instruction following
- Llama 3 with tool use fine-tuning
- Mistral with function calling

### 4. Hybrid Approach

Combine transformer with prompt engineering:
- Update system prompt
- Enable transformer as fallback
- Use both in parallel

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| False positives (transforming explanations) | High | Low | High confidence threshold, validation |
| Breaking valid responses | Critical | Low | Always fallback to original on error |
| Performance overhead | Low | High | Cache transformations, optimize regex |
| Maintenance burden | Medium | Medium | Comprehensive tests, clear documentation |
| User confusion | High | Low | Logging, dry run mode first |

## Success Metrics

Track these KPIs:

1. **Transformation Rate**: % of responses transformed
2. **Success Rate**: % of transformations that parse correctly
3. **Error Rate**: % of transformations that break functionality
4. **Tool Recognition**: % of tool intents correctly identified
5. **User Satisfaction**: Feedback from Roo-Cline users

Target: 95% success rate for JSON code block transformations

## Conclusion

### Recommended Approach

**Implement Phase 1 (JSON Code Block Transformer) ONLY**

**Rationale**:
- High confidence pattern (95% accuracy)
- Low risk (fallback to original)
- Clear transformation rules
- Significant impact (20% of responses)

**Do NOT Implement**:
- Natural language transformation (too risky)
- Pure explanation transformation (ambiguous)
- Question transformation (incorrect behavior)

### Long-term Solution

The transformer is a **workaround**, not a solution. Long-term:

1. Work with Qwen team on model fine-tuning
2. Improve system prompt effectiveness
3. Consider alternative models
4. Build dataset for future fine-tuning

## Code Artifacts

Implementation files to create:

1. `/src/transformers/RooResponseTransformer.js` - Main transformer class
2. `/src/transformers/ToolCallDetector.js` - Pattern detection
3. `/src/transformers/XmlToolCallGenerator.js` - XML generation
4. `/src/config/transformer.js` - Configuration
5. `/tests/unit/transformer.test.js` - Unit tests
6. `/tests/integration/transformer-integration.test.js` - Integration tests

## References

- Test Results: `ROO_ACCURATE_TEST_RESULTS.md`
- Request Format: `ROO_CLINE_REQUEST_ANALYSIS.md`
- Format Comparison: `FORMAT_COMPARISON.md`
- Real Examples: `EXTRACTED_EXAMPLES.md`
