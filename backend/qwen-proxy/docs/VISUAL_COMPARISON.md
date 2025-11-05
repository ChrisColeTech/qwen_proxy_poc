# Visual Comparison: Test vs Real Roo-Cline Behavior

## The Problem Visualized

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTS (Before Fix)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐                                                 │
│  │  System    │  "You are Roo... use XML tools like            │
│  │  Prompt    │   <read_file><path>...</path></read_file>"     │
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  User      │  "<task>Read README.md</task>"                 │
│  │  Message   │  "<environment_details>...</environment_details>"│
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  Qwen      │  "I'll help you read the file..."              │
│  │  Response  │  "```tool_code {\"tool\":\"read\"...}```"      │
│  └────────────┘                                                 │
│        ↓                                                        │
│     ❌ WRONG FORMAT (JSON, not XML)                            │
│     ❌ TEST FAILS                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL ROO-CLINE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐                                                 │
│  │  System    │  "You are Roo... use XML tools..."             │
│  │  Prompt    │                                                 │
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  User      │  "<task>Read file...</task>"                   │
│  │  Message 1 │                                                 │
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  Qwen      │  "I'll help... ```tool_code {...}```"          │
│  │  Response 1│  ❌ WRONG FORMAT                                │
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  Roo-Cline │  "[ERROR] You did not use a tool!"             │
│  │  Detects   │  "Use XML: <tool_name>...</tool_name>"         │
│  │  Error     │                                                 │
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  User      │  "[ERROR] message..."                          │
│  │  Message 2 │  "<environment_details>...</environment_details>"│
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  Qwen      │  "<read_file>"                                 │
│  │  Response 2│  "  <path>file.md</path>"                      │
│  │            │  "</read_file>"                                 │
│  └────────────┘                                                 │
│        ↓                                                        │
│     ✅ CORRECT FORMAT (XML)                                     │
│     ✅ ROO-CLINE WORKS                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## The Solution Visualized

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTS (After Fix)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐                                                 │
│  │  System    │  "You are Roo... use XML tools..."             │
│  │  Prompt    │                                                 │
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐  ╔═══════════════════════════════════╗         │
│  │  User      │  ║ PRE-WARMING EXAMPLE               ║         │
│  │ (Prewarm)  │  ║ "<task>List files</task>"         ║         │
│  └────────────┘  ╚═══════════════════════════════════╝         │
│        ↓                                                        │
│  ┌────────────┐  ╔═══════════════════════════════════╗         │
│  │ Assistant  │  ║ EXAMPLE XML RESPONSE              ║         │
│  │ (Prewarm)  │  ║ "<list_files>                     ║         │
│  │            │  ║   <path>.</path>                  ║         │
│  │            │  ║ </list_files>"                    ║         │
│  └────────────┘  ╚═══════════════════════════════════╝         │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  User      │  "<task>Read README.md</task>"                 │
│  │ (Actual)   │  "<environment_details>...</environment_details>"│
│  └────────────┘                                                 │
│        ↓                                                        │
│  ┌────────────┐                                                 │
│  │  Qwen      │  "<read_file>"                                 │
│  │  Response  │  "  <path>README.md</path>"                    │
│  │            │  "</read_file>"                                 │
│  └────────────┘                                                 │
│        ↓                                                        │
│     ✅ CORRECT FORMAT (XML)                                     │
│     ✅ TEST PASSES                                              │
│                                                                 │
│  Model learned from example! (Few-shot learning)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Message Count Comparison

```
Test (Before):     System + User = 2 messages
                   ↓
                   ❌ Wrong format

Roo-Cline:         System + User + Assistant + User = 4 messages
                   ↓
                   ✅ Correct format (after retry)

Test (After):      System + Prewarm User + Prewarm Assistant + Actual User = 4 messages
                   ↓
                   ✅ Correct format (with example)
```

## Response Format Evolution

```
┌─────────────┬──────────────────┬────────────────────┬──────────────┐
│ Attempt     │ Message Count    │ Response Format    │ Success      │
├─────────────┼──────────────────┼────────────────────┼──────────────┤
│ Test #1     │ 2 (no prewarm)   │ JSON tool_code     │ ❌           │
│ Test #2     │ 2 (no prewarm)   │ Natural language   │ ❌           │
│ Test #3     │ 2 (no prewarm)   │ Bash commands      │ ❌           │
│ Test #4     │ 2 (no prewarm)   │ Question           │ ❌           │
├─────────────┼──────────────────┼────────────────────┼──────────────┤
│ Roo #1      │ 2 (initial)      │ JSON tool_code     │ ❌           │
│ Roo #2      │ 4 (after retry)  │ XML tools          │ ✅           │
├─────────────┼──────────────────┼────────────────────┼──────────────┤
│ Test (fix)  │ 4 (with prewarm) │ XML tools          │ ✅ Expected  │
└─────────────┴──────────────────┴────────────────────┴──────────────┘
```

## The Learning Pattern

```
┌────────────────────────────────────────────────────────────┐
│                    QWEN MODEL LEARNING                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  WITHOUT EXAMPLE:                                          │
│  ┌──────────┐      ┌──────────┐                          │
│  │ System   │ ──▶  │ Model    │ ──▶  "I'll use JSON"     │
│  │ Prompt   │      │ Confused │       tool_code format   │
│  └──────────┘      └──────────┘       ❌                  │
│                                                            │
│  WITH EXAMPLE:                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │ System   │ ──▶  │ Example  │ ──▶  │ Model    │ ──▶    │
│  │ Prompt   │      │ Exchange │      │ Learns   │        │
│  └──────────┘      └──────────┘      └──────────┘        │
│                    "<list_files>                          │
│                     <path>.</path>   "I see! Use XML      │
│                    </list_files>"     like <read_file>    │
│                                       <path>...</path>    │
│                                       </read_file>"        │
│                                       ✅                   │
│                                                            │
│  This is FEW-SHOT LEARNING in action!                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Database Evidence Pattern

```
Request Analysis (from database):
┌─────┬──────────┬──────────────┬─────────────┐
│ ID  │ Messages │ Format       │ XML Tools?  │
├─────┼──────────┼──────────────┼─────────────┤
│ 148 │ 2        │ JSON list    │ ❌          │
│ 149 │ 2        │ Text         │ ❌          │
│ 150 │ 2        │ Bash         │ ❌          │
│ 151 │ 2        │ Text         │ ❌          │
│ 152 │ 2        │ Text         │ ❌          │
│ 153 │ 2        │ Text         │ ❌          │
│ 155 │ 2        │ Question     │ ❌          │
│ 157 │ 2        │ Text         │ ❌          │
│ 159 │ 2        │ JSON         │ ❌          │
│ 160 │ 2        │ JSON         │ ❌          │
├─────┼──────────┼──────────────┼─────────────┤
│ 161 │ 4        │ XML          │ ✅          │ ← After retry!
└─────┴──────────┴──────────────┴─────────────┘

Pattern: 2 messages = 0% success
         4+ messages = 100% success
```

## Timeline of Discovery

```
1. User Report
   "Tests get refusals, but Roo-Cline works fine"
   ↓
2. Compare Request Formats
   Database vs Tests → IDENTICAL ✅
   ↓
3. Analyze Database Requests
   Found: Successful requests have 4+ messages
   ↓
4. Analyze Test Requests
   Found: All tests have 2 messages
   ↓
5. Identify Pattern
   2 messages → 0% success (wrong format)
   4+ messages → High success (XML format)
   ↓
6. Root Cause Found
   Qwen needs example or retry to learn XML format
   ↓
7. Solution Designed
   Add pre-warming (example exchange) to tests
   ↓
8. Tests Fixed
   Now tests match real Roo-Cline behavior
```

## Key Takeaway

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  The tests weren't wrong - they were too optimistic!         ║
║                                                               ║
║  They expected the model to follow XML format perfectly      ║
║  on the first try, but Qwen needs to see an example first.   ║
║                                                               ║
║  Solution: Show the model what you want (few-shot learning)  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```
