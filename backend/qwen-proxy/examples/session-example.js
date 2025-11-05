#!/usr/bin/env node
/**
 * Session Management Example
 *
 * This script demonstrates how the session management system works
 * with a visual, step-by-step example of a multi-turn conversation.
 */

const { generateConversationId } = require('../src/session/session-id-generator');
const SessionManager = require('../src/session/session-manager');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function header(text) {
  console.log('\n' + '='.repeat(70));
  log(colors.bright + colors.cyan, text);
  console.log('='.repeat(70));
}

function section(text) {
  console.log();
  log(colors.bright + colors.yellow, '>>> ' + text);
}

// Initialize session manager
const sessionManager = new SessionManager();

header('Session Management Example: Multi-Turn Conversation');

// =============================================================================
// SCENARIO: User has a conversation with the assistant
// =============================================================================

section('TURN 1: User sends first message');

const turn1Messages = [
  { role: 'system', content: 'You are a helpful coding assistant' },
  { role: 'user', content: 'Can you help me write a Python function?' }
];

log(colors.blue, 'Client sends messages:', JSON.stringify(turn1Messages, null, 2));

// Generate conversation ID
const conversationId = generateConversationId(turn1Messages);
log(colors.green, '\nGenerated Conversation ID:', conversationId);

// Check if session exists
let session = sessionManager.getSession(conversationId);
log(colors.yellow, 'Existing session?', session ? 'Yes' : 'No');

// Create new session (simulating createQwenChat API call)
section('Creating new Qwen chat and session');
const chatId = 'qwen-chat-' + Math.random().toString(36).substring(7);
session = sessionManager.createSession(conversationId, chatId);

log(colors.cyan, 'Session created:');
console.log('  chat_id:', session.chatId);
console.log('  parent_id:', session.parentId);
console.log('  createdAt:', new Date(session.createdAt).toISOString());

section('Sending to Qwen API');
console.log('  Message:', turn1Messages[turn1Messages.length - 1]);
console.log('  chat_id:', session.chatId);
console.log('  parent_id:', session.parentId, '(null = first message)');

// Simulate Qwen response
const response1Id = 'msg-' + Math.random().toString(36).substring(7);
log(colors.green, '\nQwen responds with message ID:', response1Id);

// Update parent_id for next turn
sessionManager.updateParentId(conversationId, response1Id);
log(colors.magenta, 'Updated session parent_id to:', response1Id);

// =============================================================================
section('TURN 2: User sends follow-up message');

const turn2Messages = [
  { role: 'system', content: 'You are a helpful coding assistant' },
  { role: 'user', content: 'Can you help me write a Python function?' },
  { role: 'assistant', content: 'Sure! What should the function do?' },
  { role: 'user', content: 'It should calculate factorial' }
];

log(colors.blue, 'Client sends messages (history + new message)');
console.log('  History length:', turn2Messages.length);
console.log('  New message:', turn2Messages[turn2Messages.length - 1].content);

// Generate conversation ID (should be same)
const conversationId2 = generateConversationId(turn2Messages);
log(colors.green, '\nGenerated Conversation ID:', conversationId2);
log(colors.bright, 'IDs match?', conversationId === conversationId2 ? 'YES ✓' : 'NO ✗');

// Get existing session
session = sessionManager.getSession(conversationId2);
log(colors.yellow, '\nRetrieved existing session:');
console.log('  chat_id:', session.chatId);
console.log('  parent_id:', session.parentId, '(from Turn 1 response)');

section('Sending to Qwen API');
console.log('  Message:', turn2Messages[turn2Messages.length - 1]);
console.log('  chat_id:', session.chatId, '(SAME as Turn 1)');
console.log('  parent_id:', session.parentId, '(links to Turn 1)');

// Simulate Qwen response
const response2Id = 'msg-' + Math.random().toString(36).substring(7);
log(colors.green, '\nQwen responds with message ID:', response2Id);

// Update parent_id for next turn
sessionManager.updateParentId(conversationId2, response2Id);
log(colors.magenta, 'Updated session parent_id to:', response2Id);

// =============================================================================
section('TURN 3: User sends another follow-up');

const turn3Messages = [
  ...turn2Messages,
  { role: 'assistant', content: 'Here is a factorial function...' },
  { role: 'user', content: 'Can you add error handling?' }
];

log(colors.blue, 'Client sends messages (full history + new message)');
console.log('  History length:', turn3Messages.length);
console.log('  New message:', turn3Messages[turn3Messages.length - 1].content);

// Generate conversation ID (should still be same)
const conversationId3 = generateConversationId(turn3Messages);
log(colors.green, '\nGenerated Conversation ID:', conversationId3);
log(colors.bright, 'IDs match?', conversationId === conversationId3 ? 'YES ✓' : 'NO ✗');

// Get existing session
session = sessionManager.getSession(conversationId3);
log(colors.yellow, '\nRetrieved existing session:');
console.log('  chat_id:', session.chatId);
console.log('  parent_id:', session.parentId, '(from Turn 2 response)');

section('Sending to Qwen API');
console.log('  Message:', turn3Messages[turn3Messages.length - 1]);
console.log('  chat_id:', session.chatId, '(STILL SAME)');
console.log('  parent_id:', session.parentId, '(links to Turn 2)');

// Simulate Qwen response
const response3Id = 'msg-' + Math.random().toString(36).substring(7);
log(colors.green, '\nQwen responds with message ID:', response3Id);

sessionManager.updateParentId(conversationId3, response3Id);
log(colors.magenta, 'Updated session parent_id to:', response3Id);

// =============================================================================
header('FINAL STATE');

session = sessionManager.getSession(conversationId);
console.log('\nConversation ID:', conversationId);
console.log('Session:');
console.log('  chat_id:', session.chatId);
console.log('  parent_id:', session.parentId);
console.log('  created:', new Date(session.createdAt).toISOString());
console.log('  last_accessed:', new Date(session.lastAccessed).toISOString());
console.log('  turns:', 3);

log(colors.green, '\nActive sessions:', sessionManager.getSessionCount());

// =============================================================================
header('DIFFERENT CONVERSATION');

section('New user starts different conversation');

const differentMessages = [
  { role: 'user', content: 'Tell me a joke' } // Different first message
];

const differentConvId = generateConversationId(differentMessages);
log(colors.blue, 'New conversation ID:', differentConvId);
log(colors.bright, 'Different from first?', conversationId !== differentConvId ? 'YES ✓' : 'NO ✗');

const differentChatId = 'qwen-chat-' + Math.random().toString(36).substring(7);
sessionManager.createSession(differentConvId, differentChatId);

log(colors.green, '\nTotal active sessions:', sessionManager.getSessionCount());

// Show all sessions
section('All Active Sessions');
const allSessions = sessionManager.getAllSessions();
allSessions.forEach(([convId, sess], index) => {
  console.log(`\nSession ${index + 1}:`);
  console.log('  Conversation ID:', convId.substring(0, 16) + '...');
  console.log('  chat_id:', sess.chatId);
  console.log('  parent_id:', sess.parentId || '(none - first message)');
});

// =============================================================================
header('KEY INSIGHTS');

console.log(`
1. ${colors.green}CONSISTENT ID${colors.reset}
   - Same first user message = same conversation ID across all turns
   - Turn 1, 2, 3 all had ID: ${conversationId.substring(0, 16)}...

2. ${colors.blue}SAME CHAT${colors.reset}
   - All turns used same Qwen chat_id: ${session.chatId}
   - This maintains conversation context in Qwen

3. ${colors.yellow}PARENT CHAIN${colors.reset}
   - Turn 1: parent_id = null (first message)
   - Turn 2: parent_id = ${response1Id} (from Turn 1 response)
   - Turn 3: parent_id = ${response2Id} (from Turn 2 response)

4. ${colors.magenta}ISOLATION${colors.reset}
   - Different conversations get different IDs
   - Each conversation has independent chat_id and parent_id

5. ${colors.cyan}PERFORMANCE${colors.reset}
   - O(1) session lookup via Map
   - ${sessionManager.getSessionCount()} active sessions in memory
`);

header('Example Complete');
console.log();
