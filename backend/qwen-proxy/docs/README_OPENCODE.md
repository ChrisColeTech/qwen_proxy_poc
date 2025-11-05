# OpenCode Integration Documentation

This directory contains comprehensive documentation about the Qwen Proxy's compatibility with OpenCode.

## Quick Links

- **[Investigation Report](./OPENCODE_TOOL_CALLING_INVESTIGATION.md)** - Complete technical analysis
- **[Example Payloads](./OPENCODE_TOOL_EXAMPLES.md)** - Concrete request/response examples  
- **[Summary](./INVESTIGATION_SUMMARY.md)** - Executive summary and recommendations

## Key Finding

OpenCode uses standard OpenAI-compatible tool calling via Vercel AI SDK 5.0.8, but **the Qwen API does not natively support tool/function calling**.

## Current Status

✅ **Proxy handles tool requests correctly**:
- Accepts `tools` parameter without error
- Strips tools before sending to Qwen API
- Returns standard OpenAI-format responses
- Model responds with natural language

✅ **Tests are passing**:
- Tool calling request handling test
- Full tool calling cycle simulation test

## For Users

When using OpenCode with the Qwen proxy:
1. Tool calling is not fully supported (Qwen API limitation)
2. Expect natural language responses instead of structured tool calls
3. You may need to manually execute suggested commands

## For Developers

The current proxy implementation is correct - no changes needed.

See the investigation report for full details.
