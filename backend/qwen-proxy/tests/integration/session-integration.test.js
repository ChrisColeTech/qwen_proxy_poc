/**
 * Integration Test: Session Management Multi-Turn Flow
 *
 * This test simulates a complete multi-turn conversation flow,
 * demonstrating how conversation IDs remain consistent across turns.
 */

const { generateConversationId } = require('../../src/session/session-id-generator');
const SessionManager = require('../../src/session/session-manager');

describe('Session Management Integration', () => {
  let sessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  test('Multi-turn conversation maintains same session', () => {
    // Simulate Turn 1: User sends first message
    const turn1Messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello, how are you?' }
    ];

    const conversationId1 = generateConversationId(turn1Messages);
    let session = sessionManager.getSession(conversationId1);

    // First turn: No session exists yet
    expect(session).toBe(null);

    // Create new session (simulating createQwenChat response)
    session = sessionManager.createSession(conversationId1, 'qwen-chat-uuid-123');
    expect(session.chatId).toBe('qwen-chat-uuid-123');
    expect(session.parentId).toBe(null); // First message has no parent

    // Simulate Qwen response with message ID
    const responseId1 = 'msg-uuid-response-1';
    sessionManager.updateParentId(conversationId1, responseId1);

    // Verify parent_id updated
    session = sessionManager.getSession(conversationId1);
    expect(session.parentId).toBe(responseId1);

    // Simulate Turn 2: User sends follow-up message
    const turn2Messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you! How can I help you today?' },
      { role: 'user', content: 'Can you help me write code?' }
    ];

    const conversationId2 = generateConversationId(turn2Messages);

    // CRITICAL: Conversation IDs should match (same first user message)
    expect(conversationId2).toBe(conversationId1);

    // Get existing session
    session = sessionManager.getSession(conversationId2);
    expect(session).not.toBe(null);
    expect(session.chatId).toBe('qwen-chat-uuid-123'); // Same chat_id
    expect(session.parentId).toBe(responseId1); // Has parent from previous turn

    // Simulate second Qwen response
    const responseId2 = 'msg-uuid-response-2';
    sessionManager.updateParentId(conversationId2, responseId2);

    // Verify parent_id updated for next turn
    session = sessionManager.getSession(conversationId2);
    expect(session.parentId).toBe(responseId2);

    // Simulate Turn 3: Another follow-up
    const turn3Messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am doing well, thank you! How can I help you today?' },
      { role: 'user', content: 'Can you help me write code?' },
      { role: 'assistant', content: 'Of course! What programming language are you using?' },
      { role: 'user', content: 'JavaScript' }
    ];

    const conversationId3 = generateConversationId(turn3Messages);

    // Still same conversation ID
    expect(conversationId3).toBe(conversationId1);
    expect(conversationId3).toBe(conversationId2);

    // Get session again
    session = sessionManager.getSession(conversationId3);
    expect(session.chatId).toBe('qwen-chat-uuid-123'); // Still same chat
    expect(session.parentId).toBe(responseId2); // Parent from turn 2

    // Verify only ONE session exists throughout
    expect(sessionManager.getSessionCount()).toBe(1);
  });

  test('Different conversations get isolated sessions', () => {
    // Conversation 1: Code help
    const conv1Messages = [
      { role: 'user', content: 'Help me write a Python function' }
    ];
    const conv1Id = generateConversationId(conv1Messages);
    sessionManager.createSession(conv1Id, 'chat-python-abc');
    sessionManager.updateParentId(conv1Id, 'msg-python-1');

    // Conversation 2: Joke request
    const conv2Messages = [
      { role: 'user', content: 'Tell me a funny joke' }
    ];
    const conv2Id = generateConversationId(conv2Messages);
    sessionManager.createSession(conv2Id, 'chat-joke-def');
    sessionManager.updateParentId(conv2Id, 'msg-joke-1');

    // Conversation 3: Math question
    const conv3Messages = [
      { role: 'user', content: 'What is 2+2?' }
    ];
    const conv3Id = generateConversationId(conv3Messages);
    sessionManager.createSession(conv3Id, 'chat-math-ghi');

    // Verify all conversations have different IDs
    expect(conv1Id).not.toBe(conv2Id);
    expect(conv1Id).not.toBe(conv3Id);
    expect(conv2Id).not.toBe(conv3Id);

    // Verify all sessions are isolated
    const session1 = sessionManager.getSession(conv1Id);
    const session2 = sessionManager.getSession(conv2Id);
    const session3 = sessionManager.getSession(conv3Id);

    expect(session1.chatId).toBe('chat-python-abc');
    expect(session1.parentId).toBe('msg-python-1');

    expect(session2.chatId).toBe('chat-joke-def');
    expect(session2.parentId).toBe('msg-joke-1');

    expect(session3.chatId).toBe('chat-math-ghi');
    expect(session3.parentId).toBe(null);

    // Verify 3 independent sessions
    expect(sessionManager.getSessionCount()).toBe(3);
  });

  test('System message changes do not affect conversation ID', () => {
    // Turn 1: With system message A
    const turn1Messages = [
      { role: 'system', content: 'You are a helpful coding assistant' },
      { role: 'user', content: 'Write a function' }
    ];
    const conv1Id = generateConversationId(turn1Messages);
    sessionManager.createSession(conv1Id, 'chat-123');

    // Turn 2: System message changed (should still be same conversation)
    const turn2Messages = [
      { role: 'system', content: 'You are an expert programmer' }, // Different!
      { role: 'user', content: 'Write a function' },
      { role: 'assistant', content: 'Here is a function...' },
      { role: 'user', content: 'Can you explain it?' }
    ];
    const conv2Id = generateConversationId(turn2Messages);

    // Turn 3: No system message
    const turn3Messages = [
      { role: 'user', content: 'Write a function' },
      { role: 'assistant', content: 'Here is a function...' },
      { role: 'user', content: 'Can you explain it?' },
      { role: 'assistant', content: 'Sure...' },
      { role: 'user', content: 'Thanks' }
    ];
    const conv3Id = generateConversationId(turn3Messages);

    // All should produce same conversation ID
    expect(conv2Id).toBe(conv1Id);
    expect(conv3Id).toBe(conv1Id);

    // Only one session should exist
    expect(sessionManager.getSessionCount()).toBe(1);
  });

  test('Simulates complete proxy flow', () => {
    // This simulates what happens in the actual proxy server

    // TURN 1: Client sends first message
    console.log('\n=== TURN 1 ===');
    const turn1Messages = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' }
    ];

    // Generate conversation ID
    const conversationId = generateConversationId(turn1Messages);
    console.log('Conversation ID:', conversationId);

    // Check if session exists
    let session = sessionManager.getSession(conversationId);
    console.log('Existing session:', session);

    if (!session) {
      // Create new session (in real proxy, chatId comes from createQwenChat)
      session = sessionManager.createSession(conversationId, 'qwen-chat-abc123');
      console.log('Created session:', { chatId: session.chatId, parentId: session.parentId });
    }

    // Send to Qwen: message + chat_id + parent_id (null for first)
    console.log('Send to Qwen:', {
      message: turn1Messages[turn1Messages.length - 1],
      chat_id: session.chatId,
      parent_id: session.parentId
    });

    // Simulate Qwen response
    const response1 = { id: 'msg-uuid-1', content: 'Hi there!' };
    console.log('Qwen response:', response1);

    // Update parent_id for next turn
    sessionManager.updateParentId(conversationId, response1.id);
    console.log('Updated parent_id to:', response1.id);

    // TURN 2: Client sends follow-up
    console.log('\n=== TURN 2 ===');
    const turn2Messages = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How are you?' }
    ];

    // Generate conversation ID (should be same)
    const conversationId2 = generateConversationId(turn2Messages);
    console.log('Conversation ID:', conversationId2);
    expect(conversationId2).toBe(conversationId);

    // Get existing session
    session = sessionManager.getSession(conversationId2);
    console.log('Retrieved session:', { chatId: session.chatId, parentId: session.parentId });

    // Send to Qwen: Uses existing chat_id and parent_id from turn 1
    console.log('Send to Qwen:', {
      message: turn2Messages[turn2Messages.length - 1],
      chat_id: session.chatId,
      parent_id: session.parentId
    });

    // Simulate Qwen response
    const response2 = { id: 'msg-uuid-2', content: 'I am doing great!' };
    console.log('Qwen response:', response2);

    // Update parent_id for next turn
    sessionManager.updateParentId(conversationId2, response2.id);
    console.log('Updated parent_id to:', response2.id);

    // Verify state
    session = sessionManager.getSession(conversationId);
    expect(session.chatId).toBe('qwen-chat-abc123');
    expect(session.parentId).toBe('msg-uuid-2');
    expect(sessionManager.getSessionCount()).toBe(1);

    console.log('\n=== FINAL STATE ===');
    console.log('Session:', session);
    console.log('Total sessions:', sessionManager.getSessionCount());
  });

  test('Message metadata does not affect conversation ID', () => {
    // Messages with different metadata (timestamps, IDs, etc.)
    const messages1 = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: 1234567890,
        id: 'msg-abc',
        name: 'User1'
      }
    ];

    const messages2 = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: 9999999999, // Different timestamp
        id: 'msg-xyz',         // Different ID
        name: 'User2'          // Different name
      }
    ];

    const messages3 = [
      {
        role: 'user',
        content: 'Hello'
        // No metadata
      }
    ];

    const id1 = generateConversationId(messages1);
    const id2 = generateConversationId(messages2);
    const id3 = generateConversationId(messages3);

    // All should produce same ID (only role + content matter)
    expect(id1).toBe(id2);
    expect(id1).toBe(id3);
  });
});
