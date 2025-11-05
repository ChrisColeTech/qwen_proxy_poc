# Research Questions and Unknowns

**Purpose:** This document identifies critical unknowns about the OpenCode → Qwen integration that require research before implementation. Each question includes specific places to investigate for answers.

---

## Category 1: Qwen API Tool Calling Format

### Questions

#### 1.1 What is the EXACT XML format Qwen expects for tool definitions?
**Why it matters:** We're assuming an XML format, but we need to verify this is correct.

**What we assume:**
```xml
<tools>
  <tool_description>
    <tool_name>read</tool_name>
    <description>Read a file</description>
    <parameters>
      <parameter>
        <name>file_path</name>
        <type>string</type>
        <required>true</required>
      </parameter>
    </parameters>
  </tool_description>
</tools>
```

**Questions:**
- Is this the correct XML schema?
- Are there alternative formats Qwen accepts?
- Does the tag naming matter (tool_description vs tool)?
- How do we specify complex types (arrays, nested objects)?
- Are there special instructions we need to add to the system prompt?

**Where to research:**
1. **Qwen Official Documentation**
   - URL: https://help.aliyun.com/zh/dashscope/
   - Look for: "function calling", "tool calling", "工具调用"
   - Search for: XML format examples

2. **Qwen API Examples Repository**
   - Check if Alibaba has GitHub examples
   - Search: "qwen function calling example"
   - Look for: Complete request/response samples

3. **Test with Qwen API directly**
   - Write a simple script to test different XML formats
   - File: `/mnt/d/Projects/qwen_proxy_opencode/research/test-qwen-xml-format.js`
   - Try variations and see what works

4. **OpenCode Source Code**
   - Path: `/mnt/d/Projects/opencode`
   - Search for: XML generation, tool format, Qwen integration
   - Files to check: Anything related to LLM providers or tool calling

---

#### 1.2 How does Qwen format tool calls in its responses?
**Why it matters:** We need to parse Qwen's output correctly to extract tool calls.

**What we assume:**
```xml
<tool_call>
  <tool_name>read</tool_name>
  <parameters>
    <file_path>/tmp/test.txt</file_path>
  </parameters>
</tool_call>
```

**Questions:**
- Is this the actual format Qwen returns?
- Does Qwen use different tags?
- Can there be multiple tool_call blocks in one response?
- How are complex parameters formatted (arrays, objects)?
- Is there text before/after the tool call?

**Where to research:**
1. **Make real Qwen API calls**
   - Send requests with tool definitions
   - Capture actual responses
   - File: `/mnt/d/Projects/qwen_proxy_opencode/research/test-qwen-responses.js`

2. **Check Qwen documentation**
   - Look for response format examples
   - Search for: "function calling response format"

3. **OpenCode logs/source**
   - Check if OpenCode logs raw Qwen responses
   - Path: `/mnt/d/Projects/opencode`
   - Search for: Response parsing, XML parsing

4. **Community examples**
   - Search: "qwen tool calling response example"
   - Check GitHub issues, Stack Overflow, Chinese tech forums

---

#### 1.3 Does Qwen support streaming with tool calls?
**Why it matters:** OpenCode may request streaming responses.

**Questions:**
- Can tool calls appear in streaming chunks?
- How are tool calls split across chunks?
- Do we need to buffer and parse at the end?
- What's the chunk format?

**Where to research:**
1. **Qwen streaming documentation**
   - Search for: SSE format, streaming responses
   - Check if tool calls are mentioned

2. **Test streaming with tools**
   - File: `/mnt/d/Projects/qwen_proxy_opencode/research/test-qwen-streaming.js`
   - Send streaming request with tools
   - Observe chunk structure

3. **OpenCode streaming handler**
   - Path: `/mnt/d/Projects/opencode`
   - Look for: Streaming response handling

---

#### 1.4 What are Qwen's actual rate limits and quotas?
**Why it matters:** We need to handle rate limiting correctly.

**Questions:**
- Requests per minute/second limit?
- Token limits?
- Concurrent request limits?
- How are errors returned when rate limited?

**Where to research:**
1. **Qwen pricing/limits page**
   - Check official documentation
   - Look for: API limits, quotas

2. **Test rate limits**
   - Make rapid requests
   - Observe when/how errors occur

3. **HTTP headers**
   - Check for rate limit headers in responses
   - Common headers: X-RateLimit-Limit, X-RateLimit-Remaining

---

## Category 2: OpenCode Client Behavior

### Questions

#### 2.1 How does OpenCode construct the system prompt?
**Why it matters:** We need to ensure our XML injection doesn't break OpenCode's existing prompt structure.

**Questions:**
- What's OpenCode's default system prompt?
- Does it include special instructions?
- How long is the system prompt?
- Are there tokens/markers we need to preserve?

**Where to research:**
1. **OpenCode Source Code - PRIORITY**
   - Path: `/mnt/d/Projects/opencode`
   - Search for: "system prompt", "system message", "You are Claude"
   - Files to check:
     - Main LLM client/adapter files
     - Configuration files
     - Prompt templates

2. **Capture OpenCode requests**
   - Run OpenCode with verbose logging
   - Use the existing backend to log system prompts
   - Check database: `SELECT DISTINCT messages FROM requests LIMIT 10`

3. **OpenCode documentation**
   - Check if there's user-facing docs about prompts
   - Look in: README, docs folder

---

#### 2.2 What exact tools does OpenCode send?
**Why it matters:** We assumed 11 tools, but need to verify the exact parameter schemas.

**Questions:**
- What's the complete definition of each tool?
- Are parameter descriptions important?
- Do any tools have complex nested parameters?
- Are there optional parameters?

**Where to research:**
1. **OpenCode source code**
   - Path: `/mnt/d/Projects/opencode`
   - Search for: Tool definitions, function schemas
   - File likely: Something like `tools.ts` or `functions.ts`

2. **Database from existing backend**
   - Query: `SELECT tools FROM requests WHERE tools IS NOT NULL LIMIT 1`
   - Parse the JSON to see full structure

3. **Log OpenCode requests**
   - Run OpenCode, capture full request payload
   - Pretty print the tools array

---

#### 2.3 How does OpenCode handle tool execution results?
**Why it matters:** Need to understand the full tool calling loop.

**Questions:**
- Does OpenCode execute tools automatically?
- How are results formatted?
- Does it retry on errors?
- Are there timeouts?
- Can it execute multiple tools in parallel?

**Where to research:**
1. **OpenCode source code**
   - Path: `/mnt/d/Projects/opencode`
   - Search for: Tool execution, function calling loop
   - Files to check: Main CLI loop, tool handlers

2. **Run OpenCode with instrumentation**
   - Add logging to proxy
   - Observe the message flow
   - Track timing between requests

---

#### 2.4 Why does the AI SDK reject null content?
**Why it matters:** This is the bug that broke everything.

**Questions:**
- What SDK is OpenCode using? (Vercel AI SDK, LangChain, custom?)
- What validation does it perform?
- What's the exact error message?
- Are there other fields it validates?
- Does it follow OpenAI spec exactly?

**Where to research:**
1. **OpenCode source code - CRITICAL**
   - Path: `/mnt/d/Projects/opencode`
   - Search for: AI SDK import, message validation
   - Files to check: package.json (dependencies), LLM client code

2. **AI SDK documentation**
   - If using Vercel AI SDK: https://sdk.vercel.ai/docs
   - Look for: Message schema, validation rules

3. **OpenAI API specification**
   - URL: https://platform.openai.com/docs/api-reference/chat
   - Check: What fields are required/optional
   - Read: Tool calling documentation

4. **Test different content values**
   - Test: null, undefined, "", " ", missing field
   - See which ones work with OpenCode

---

## Category 3: Session Management & State

### Questions

#### 3.1 How does Qwen's parent_id system actually work?
**Why it matters:** Incorrect session management causes context loss.

**Questions:**
- Where does parent_id come from in responses?
- How do we include it in next request?
- What happens if we don't send it?
- Is there a message_id we should track?
- How long are sessions valid?

**Where to research:**
1. **Qwen conversation documentation**
   - Search for: "parent_id", "conversation", "session", "上下文"
   - Look for: Multi-turn conversation examples

2. **Test Qwen API multi-turn**
   - File: `/mnt/d/Projects/qwen_proxy_opencode/research/test-qwen-sessions.js`
   - Make 3+ requests in a conversation
   - Track parent_id flow
   - Test with and without parent_id

3. **Existing backend database**
   - Check: `qwen_responses` table
   - Look at: parent_id and message_id patterns

---

#### 3.2 How should we generate conversation hashes?
**Why it matters:** Need a stable key to retrieve parent_id for continuations.

**Questions:**
- Is MD5 hash of first user+assistant messages sufficient?
- What if messages are very long?
- What if multiple conversations start with same message?
- Should we include tool calls in hash?
- How to handle edge cases (empty messages, etc.)?

**Where to research:**
1. **Analyze failure patterns**
   - Review existing backend logs
   - Find cases where session lookup failed
   - Identify what went wrong

2. **Test collision scenarios**
   - Create test cases with similar messages
   - Verify hash uniqueness

3. **Alternative approaches**
   - Research: Session ID generation best practices
   - Consider: UUID per conversation
   - Consider: Hash of full conversation

---

## Category 4: Edge Cases & Error Handling

### Questions

#### 4.1 What happens with multiple tool calls in one response?
**Why it matters:** Need to handle this correctly if Qwen supports it.

**Questions:**
- Can Qwen return multiple tool calls?
- How is the XML formatted?
- Does OpenAI format support this? (Yes, it's an array)
- How does OpenCode handle multiple tool calls?

**Where to research:**
1. **Test with Qwen**
   - Prompt: "List the directory and read file.txt"
   - See if Qwen returns 2 tool calls

2. **OpenAI specification**
   - Confirm: tool_calls is an array
   - Check: How multiple calls are formatted

3. **OpenCode source**
   - Check: Tool execution loop
   - See: If it handles parallel execution

---

#### 4.2 How to handle malformed XML in Qwen responses?
**Why it matters:** Parser crashes will break the proxy.

**Questions:**
- Can Qwen return invalid XML?
- What if XML tags are incomplete?
- What if parameters are missing?
- Should we return error or pass through?

**Where to research:**
1. **Stress test Qwen**
   - Send confusing prompts
   - See if it generates bad XML
   - Test with corrupted tool definitions

2. **Error handling patterns**
   - Research: XML parsing best practices
   - Look at: How other proxies handle this

---

#### 4.3 What are the limits on message/content size?
**Why it matters:** Large tool results might exceed limits.

**Questions:**
- What's Qwen's max content length?
- What's OpenCode's max message size?
- How to handle very large tool outputs (e.g., reading a huge file)?
- Should we truncate? Return error?

**Where to research:**
1. **Qwen documentation**
   - Look for: Token limits, message size limits

2. **Test with large content**
   - Send huge tool result
   - See what happens

3. **OpenCode behavior**
   - Check source for: Size limits, truncation

---

#### 4.4 How to handle empty/silent tool results?
**Why it matters:** Empty bash results caused infinite loops.

**Questions:**
- Which tools return empty results?
- Should we always transform to success message?
- What about tools that legitimately return empty (e.g., grep with no matches)?
- How does OpenCode interpret these?

**Where to research:**
1. **Test each tool type**
   - bash: Commands with no output
   - edit: Silent on success
   - write: Silent on success
   - read: Empty file
   - grep: No matches
   - glob: No files found

2. **OpenCode behavior**
   - See how it presents empty results to users
   - Check: Does it show "(no output)" or something else?

---

## Category 5: XML Transformation Details

### Questions

#### 5.1 How to handle JSON Schema types in XML?
**Why it matters:** Need to represent complex schemas in XML.

**Questions:**
- How to represent `type: "array"`?
- How to represent `items` for arrays?
- How to represent nested objects?
- How to represent enums?
- How to represent `anyOf`, `oneOf`, `allOf`?

**Where to research:**
1. **Find Qwen examples with complex schemas**
   - Search for: Examples with array parameters
   - Look for: Nested object examples

2. **Test different schema types**
   - Create tools with arrays, objects, enums
   - See what Qwen accepts

3. **JSON Schema to XML research**
   - Search: "JSON Schema XML representation"
   - Look for: Existing conversion libraries

---

#### 5.2 How to parse parameters from XML responses?
**Why it matters:** Need to convert XML back to JSON arguments.

**Questions:**
- How are array values represented in XML?
- How are nested objects represented?
- How are booleans represented (true/false, 1/0)?
- How are null values represented?
- What about special characters in values?

**Where to research:**
1. **Test with Qwen**
   - Send tools with complex parameters
   - Observe XML format in responses

2. **XML parsing libraries**
   - Research: fast-xml-parser, xml2js
   - Check: How they handle these cases

---

## Category 6: Performance & Optimization

### Questions

#### 6.1 What's the actual latency added by transformations?
**Why it matters:** Need to meet <2s response time target.

**Questions:**
- How long does XML generation take?
- How long does XML parsing take?
- Are there performance bottlenecks?
- Should we cache anything?

**Where to research:**
1. **Benchmark transformations**
   - File: `/mnt/d/Projects/qwen_proxy_opencode/research/benchmark-transforms.js`
   - Measure: Tool-to-XML conversion time
   - Measure: XML-to-OpenAI parsing time
   - Test: With 11 tools, various response sizes

2. **Profile with realistic payloads**
   - Use actual OpenCode payloads
   - Measure end-to-end latency

---

#### 6.2 Should we implement caching?
**Why it matters:** Could reduce redundant Qwen API calls.

**Questions:**
- Can we cache tool definitions XML?
- Can we cache any responses?
- What's the cache invalidation strategy?
- Does it help or add complexity?

**Where to research:**
1. **Analyze request patterns**
   - Do users repeat same queries?
   - Are tool definitions stable?

2. **Caching best practices**
   - Research: API proxy caching patterns

---

## Category 7: OpenCode Integration Points

### Questions

#### 7.1 Where does OpenCode make API calls?
**Why it matters:** Need to understand the client side to debug issues.

**Where to research:**
1. **OpenCode source code - CRITICAL**
   - Path: `/mnt/d/Projects/opencode`
   - Search for: "fetch", "axios", "http", "api"
   - Files: LLM client, API adapter
   - Look for: Where base URL is configured

---

#### 7.2 How does OpenCode configure the API endpoint?
**Why it matters:** Users need to point OpenCode at our proxy.

**Where to research:**
1. **OpenCode configuration**
   - Path: `/mnt/d/Projects/opencode`
   - Look for: Config files, environment variables
   - Files: .env, config.json, settings

2. **OpenCode documentation**
   - Check: How to use custom API endpoints

---

#### 7.3 Does OpenCode send any custom headers?
**Why it matters:** Need to handle or forward them correctly.

**Where to research:**
1. **OpenCode source code**
   - Look for: HTTP client configuration
   - Check: Header setup

2. **Log headers from existing backend**
   - Add middleware to log all headers
   - See what OpenCode sends

---

## Category 8: Testing Strategy

### Questions

#### 8.1 How to test without exhausting Qwen API quota?
**Why it matters:** Tests need to be runnable frequently.

**Questions:**
- Should we have a test API key?
- Should we limit test frequency?
- Can we run tests in parallel?

**Where to research:**
1. **Qwen test environment**
   - Check if there's a sandbox/test mode

2. **CI/CD best practices**
   - Research: API testing strategies
   - Look for: Mock vs. real API trade-offs

---

#### 8.2 How to reproduce OpenCode's exact test scenarios?
**Why it matters:** Tests must catch real issues.

**Where to research:**
1. **OpenCode test suite**
   - Path: `/mnt/d/Projects/opencode`
   - Look for: Test files, e2e tests
   - See: What scenarios they test

2. **Common OpenCode workflows**
   - Research: How users actually use OpenCode
   - Test: Real world scenarios

---

## Research Priority Order

### HIGH PRIORITY (Must Know Before Coding)

1. **Qwen XML Format** (Category 1.1, 1.2)
   - This is fundamental to the entire proxy
   - Start: Test with Qwen API directly
   - Then: Check OpenCode source for format

2. **OpenCode System Prompt** (Category 2.1)
   - Need to know how to inject XML without breaking
   - Start: Search OpenCode source code
   - File: `/mnt/d/Projects/opencode`

3. **AI SDK Validation** (Category 2.4)
   - Must understand why null breaks it
   - Start: Check OpenCode dependencies
   - Then: Read SDK documentation

4. **Parent ID Flow** (Category 3.1)
   - Critical for multi-turn conversations
   - Start: Test Qwen API with conversations
   - Document: Exact request/response format

### MEDIUM PRIORITY (Important for Robustness)

5. **Tool Definitions** (Category 2.2)
   - Need exact schemas
   - Start: Extract from OpenCode source
   - Or: Log from existing backend

6. **Complex Parameters** (Category 5.1, 5.2)
   - Need to handle arrays, objects
   - Start: Test with Qwen
   - Research: Schema conversion patterns

7. **Edge Cases** (Category 4)
   - Multiple tool calls, malformed XML, size limits
   - Start: Stress testing Qwen
   - Then: Define error handling strategy

### LOW PRIORITY (Can Figure Out During Implementation)

8. **Performance** (Category 6)
   - Can measure after basic implementation
   - Start: Benchmarking after MVP

9. **Caching** (Category 6.2)
   - Optimization, not core functionality
   - Defer: Until performance testing

---

## Research Action Plan

### Phase 1: OpenCode Source Code Dive (2-4 hours)
**Goal:** Understand OpenCode's implementation

**Tasks:**
1. Clone/navigate to `/mnt/d/Projects/opencode`
2. Find and read main entry point
3. Locate LLM client/adapter code
4. Extract:
   - System prompt template
   - Tool definitions
   - API call implementation
   - Response parsing logic
5. Document findings in this file

**Search patterns:**
```bash
cd /mnt/d/Projects/opencode
grep -r "You are Claude" .
grep -r "system prompt" .
grep -r "tool" . | grep -i "definition\|schema"
grep -r "content.*null" .
grep -r "@ai-sdk\|vercel.*ai\|langchain" package.json
```

### Phase 2: Qwen API Testing (2-3 hours)
**Goal:** Verify XML format and behavior

**Tasks:**
1. Create test script: `research/test-qwen-api.js`
2. Test tool definition formats
3. Test tool calling responses
4. Test multi-turn with parent_id
5. Test streaming with tools
6. Document exact formats that work

### Phase 3: Integration Testing (1-2 hours)
**Goal:** Verify end-to-end flow

**Tasks:**
1. Run OpenCode against existing backend
2. Log all requests/responses
3. Identify any gaps in understanding
4. Create test cases based on real usage

### Phase 4: Documentation Update (1 hour)
**Goal:** Document all findings

**Tasks:**
1. Update this file with answers
2. Update requirements doc with any changes
3. Create implementation notes document

---

## Findings Log

As research progresses, document findings here:

### Finding 1: [Topic]
**Date:**
**Question:**
**Answer:**
**Source:**
**Impact:**

### Finding 2: [Topic]
**Date:**
**Question:**
**Answer:**
**Source:**
**Impact:**

---

## Open Questions Tracker

Questions that still need answers:

- [ ] Question 1.1: Exact Qwen XML format
- [ ] Question 1.2: Qwen response format
- [ ] Question 2.1: OpenCode system prompt
- [ ] Question 2.4: AI SDK validation
- [ ] Question 3.1: Parent ID flow
- [ ] ...

---

**Next Steps:**
1. Start with OpenCode source code research (Phase 1)
2. Run parallel Qwen API tests (Phase 2)
3. Update this document with findings
4. Proceed to implementation only when HIGH PRIORITY questions answered
