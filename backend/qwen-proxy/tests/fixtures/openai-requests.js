/**
 * Test fixtures for OpenAI request formats
 */

module.exports = {
  // Single message - first interaction
  singleMessage: [
    { role: 'user', content: 'Hello' }
  ],

  // Multi-turn conversation - tests extracting last message
  multiTurn: [
    { role: 'user', content: 'My color is blue' },
    { role: 'assistant', content: 'Nice color!' },
    { role: 'user', content: 'What is my color?' }
  ],

  // Conversation with system message
  withSystem: [
    { role: 'system', content: 'You are helpful' },
    { role: 'user', content: 'Hello' }
  ],

  // Complex multi-turn with system message
  complexConversation: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Tell me about Python' },
    { role: 'assistant', content: 'Python is a programming language...' },
    { role: 'user', content: 'What about its syntax?' },
    { role: 'assistant', content: 'Python uses indentation...' },
    { role: 'user', content: 'Show me an example' }
  ],

  // Assistant message as last (edge case)
  assistantLast: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' }
  ]
};
