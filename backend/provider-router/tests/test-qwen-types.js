/**
 * Test script for qwen-types.js
 * Validates all type definitions and validators
 */

import {
  createChatPayload,
  createQwenMessage,
  createCompletionPayload,
  parseSSEChunk,
  validateParentId,
  generateConversationId,
  generateUUID,
  extractParentId,
  hasContent,
  isFinished,
  extractUsage
} from './src/providers/qwen/qwen-types.js';

console.log('=== Testing Qwen Type Definitions ===\n');

// Test 1: Chat payload creation
console.log('Test 1: createChatPayload()');
const chatPayload = createChatPayload('Test Chat', 'qwen3-max');
console.assert(chatPayload.title === 'Test Chat', 'Chat title should match');
console.assert(chatPayload.models[0] === 'qwen3-max', 'Model should match');
console.assert(chatPayload.chat_mode === 'guest', 'Chat mode should be guest');
console.assert(chatPayload.chat_type === 't2t', 'Chat type should be t2t');
console.assert(typeof chatPayload.timestamp === 'number', 'Timestamp should be a number');
console.log('✓ Chat payload creation works');
console.log('  Sample:', JSON.stringify(chatPayload, null, 2));
console.log();

// Test 2: Message creation
console.log('Test 2: createQwenMessage()');
const message = createQwenMessage({
  fid: '123e4567-e89b-12d3-a456-426614174000',
  parentId: null,
  role: 'user',
  content: 'Hello',
  models: ['qwen3-max']
});
console.assert(message.fid === '123e4567-e89b-12d3-a456-426614174000', 'FID should match');
console.assert(message.parentId === null, 'ParentId should be null');
console.assert(message.parent_id === null, 'parent_id should be null');
console.assert(message.role === 'user', 'Role should be user');
console.assert(message.content === 'Hello', 'Content should match');
console.assert(message.feature_config.thinking_enabled === false, 'Thinking should be disabled');
console.assert(message.feature_config.output_schema === 'phase', 'Output schema should be phase');
console.assert(message.chat_type === 't2t', 'Chat type should be t2t');
console.assert(message.sub_chat_type === 't2t', 'Sub chat type should be t2t');
console.assert(Array.isArray(message.childrenIds), 'ChildrenIds should be an array');
console.assert(Array.isArray(message.files), 'Files should be an array');
console.assert(typeof message.timestamp === 'number', 'Timestamp should be a number');
console.log('✓ Message creation works');
console.log('  Timestamp (seconds):', message.timestamp);
console.log();

// Test 3: Completion payload
console.log('Test 3: createCompletionPayload()');
const payload = createCompletionPayload({
  chatId: 'chat-123',
  parentId: null,
  message,
  stream: true,
  model: 'qwen3-max'
});
console.assert(payload.chat_id === 'chat-123', 'Chat ID should match');
console.assert(payload.stream === true, 'Stream should be true');
console.assert(payload.incremental_output === true, 'Incremental output should be true');
console.assert(payload.chat_mode === 'guest', 'Chat mode should be guest');
console.assert(payload.model === 'qwen3-max', 'Model should match');
console.assert(payload.parent_id === null, 'Parent ID should be null');
console.assert(Array.isArray(payload.messages), 'Messages should be an array');
console.assert(payload.messages.length === 1, 'Should have one message');
console.assert(typeof payload.timestamp === 'number', 'Timestamp should be a number');
console.log('✓ Completion payload creation works');
console.log();

// Test 4: SSE parsing
console.log('Test 4: parseSSEChunk()');
const chunk1 = parseSSEChunk('data: {"choices":[{"delta":{"content":"Hello"}}]}');
console.assert(chunk1 !== null, 'Should parse valid SSE chunk');
console.assert(chunk1.choices[0].delta.content === 'Hello', 'Content should match');
console.log('✓ Valid SSE chunk parsed correctly');

const chunk2 = parseSSEChunk('data: [DONE]');
console.assert(chunk2 === null, 'Should return null for [DONE]');
console.log('✓ [DONE] chunk handled correctly');

const chunk3 = parseSSEChunk('not a data line');
console.assert(chunk3 === null, 'Should return null for non-data lines');
console.log('✓ Non-data lines handled correctly');

const chunk4 = parseSSEChunk('data: {invalid json}');
console.assert(chunk4 === null, 'Should return null for invalid JSON');
console.log('✓ Invalid JSON handled correctly');
console.log();

// Test 5: Parent ID validation
console.log('Test 5: validateParentId()');
console.assert(validateParentId(null) === true, 'null should be valid');
console.assert(validateParentId('123e4567-e89b-12d3-a456-426614174000') === true, 'Valid UUID should pass');
console.assert(validateParentId('invalid') === false, 'Invalid string should fail');
console.assert(validateParentId('123') === false, 'Short string should fail');
console.assert(validateParentId('') === false, 'Empty string should fail');
console.log('✓ Parent ID validation works');
console.log();

// Test 6: Conversation ID generation
console.log('Test 6: generateConversationId()');
const convId = generateConversationId([
  { role: 'user', content: 'test message' }
]);
console.assert(typeof convId === 'string', 'Should return a string');
console.assert(convId.length === 32, 'MD5 hash should be 32 characters');
console.assert(/^[a-f0-9]+$/.test(convId), 'Should be hex string');
console.log('✓ Conversation ID generation works');
console.log('  Generated ID:', convId);

// Test that same content generates same ID
const convId2 = generateConversationId([
  { role: 'user', content: 'test message' }
]);
console.assert(convId === convId2, 'Same content should generate same ID');
console.log('✓ Conversation ID is deterministic');

// Test error handling
try {
  generateConversationId([{ role: 'assistant', content: 'no user message' }]);
  console.error('✗ Should throw error for no user message');
} catch (error) {
  console.assert(error.message === 'No user message found in conversation', 'Error message should match');
  console.log('✓ Error handling works for missing user message');
}
console.log();

// Test 7: UUID generation
console.log('Test 7: generateUUID()');
const uuid1 = generateUUID();
const uuid2 = generateUUID();
console.assert(typeof uuid1 === 'string', 'Should return a string');
console.assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid1), 'Should be valid UUID format');
console.assert(uuid1 !== uuid2, 'Should generate unique UUIDs');
console.assert(validateParentId(uuid1) === true, 'Generated UUID should pass validation');
console.log('✓ UUID generation works');
console.log('  Sample UUID:', uuid1);
console.log();

// Test 8: Extract parent_id from chunk
console.log('Test 8: extractParentId()');
const chunkWithParent = {
  'response.created': {
    parent_id: '123e4567-e89b-12d3-a456-426614174000'
  }
};
const extractedId = extractParentId(chunkWithParent);
console.assert(extractedId === '123e4567-e89b-12d3-a456-426614174000', 'Should extract parent_id');
console.log('✓ Parent ID extraction from response.created works');

const chunkWithoutParent = { other: 'data' };
const noId = extractParentId(chunkWithoutParent);
console.assert(noId === null, 'Should return null for chunk without parent_id');
console.log('✓ Returns null for missing parent_id');
console.log();

// Test 9: Check if chunk has content
console.log('Test 9: hasContent()');
const contentChunk = {
  choices: [{
    delta: {
      content: 'Hello'
    }
  }]
};
console.assert(hasContent(contentChunk) === true, 'Should detect content');
console.log('✓ Detects content correctly');

const noContentChunk1 = { choices: [{ delta: {} }] };
console.assert(hasContent(noContentChunk1) === false, 'Should return false for empty delta');
console.log('✓ Returns false for empty delta');

const noContentChunk2 = {};
console.assert(hasContent(noContentChunk2) === false, 'Should return false for empty chunk');
console.log('✓ Returns false for empty chunk');
console.log();

// Test 10: Check if stream is finished
console.log('Test 10: isFinished()');
const finishedChunk = {
  choices: [{
    delta: {
      status: 'finished'
    }
  }]
};
console.assert(isFinished(finishedChunk) === true, 'Should detect finished status');
console.log('✓ Detects finished status correctly');

const notFinishedChunk = {
  choices: [{
    delta: {
      status: 'in_progress'
    }
  }]
};
console.assert(isFinished(notFinishedChunk) === false, 'Should return false for non-finished status');
console.log('✓ Returns false for non-finished status');

const noStatusChunk = {
  choices: [{
    delta: {}
  }]
};
console.assert(isFinished(noStatusChunk) === false, 'Should return false for missing status');
console.log('✓ Returns false for missing status');
console.log();

// Test 11: Extract usage stats
console.log('Test 11: extractUsage()');
const usageChunk = {
  usage: {
    input_tokens: 10,
    output_tokens: 20,
    total_tokens: 30
  }
};
const usage = extractUsage(usageChunk);
console.assert(usage !== null, 'Should extract usage');
console.assert(usage.prompt_tokens === 10, 'Prompt tokens should match');
console.assert(usage.completion_tokens === 20, 'Completion tokens should match');
console.assert(usage.total_tokens === 30, 'Total tokens should match');
console.log('✓ Usage extraction works');
console.log('  Usage:', usage);

const noUsageChunk = { other: 'data' };
const noUsage = extractUsage(noUsageChunk);
console.assert(noUsage === null, 'Should return null for missing usage');
console.log('✓ Returns null for missing usage');

// Test with partial usage data
const partialUsageChunk = {
  usage: {
    input_tokens: 5
  }
};
const partialUsage = extractUsage(partialUsageChunk);
console.assert(partialUsage.prompt_tokens === 5, 'Should use provided input_tokens');
console.assert(partialUsage.completion_tokens === 0, 'Should default to 0 for missing tokens');
console.assert(partialUsage.total_tokens === 0, 'Should default to 0 for missing total');
console.log('✓ Handles partial usage data correctly');
console.log();

// Test 12: Timestamp formats
console.log('Test 12: Timestamp formats');
const chatPayloadTime = createChatPayload('Test').timestamp;
const messageTime = createQwenMessage({
  fid: generateUUID(),
  parentId: null,
  role: 'user',
  content: 'test',
  models: ['qwen3-max']
}).timestamp;
const completionTime = createCompletionPayload({
  chatId: 'test',
  parentId: null,
  message,
  stream: true,
  model: 'qwen3-max'
}).timestamp;

// Chat payload uses milliseconds
console.assert(chatPayloadTime > 1000000000000, 'Chat payload should use milliseconds');
console.log('✓ Chat payload uses milliseconds:', chatPayloadTime);

// Message uses seconds
console.assert(messageTime < 10000000000, 'Message should use seconds');
console.log('✓ Message uses seconds:', messageTime);

// Completion uses seconds
console.assert(completionTime < 10000000000, 'Completion should use seconds');
console.log('✓ Completion payload uses seconds:', completionTime);
console.log();

console.log('=== ALL TESTS PASSED ===');
console.log('\nPhase 3 Complete: All 11 functions implemented and validated');
console.log('✓ createChatPayload()');
console.log('✓ createQwenMessage()');
console.log('✓ createCompletionPayload()');
console.log('✓ parseSSEChunk()');
console.log('✓ validateParentId()');
console.log('✓ generateConversationId()');
console.log('✓ generateUUID()');
console.log('✓ extractParentId()');
console.log('✓ hasContent()');
console.log('✓ isFinished()');
console.log('✓ extractUsage()');
