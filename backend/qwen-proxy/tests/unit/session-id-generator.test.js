const { generateConversationId, findFirstUserMessage } = require('../../src/session/session-id-generator');

describe('session-id-generator', () => {
  describe('findFirstUserMessage', () => {
    test('finds first user message in simple array', () => {
      const messages = [
        { role: 'user', content: 'Hello' }
      ];

      const result = findFirstUserMessage(messages);

      expect(result).toEqual({ role: 'user', content: 'Hello' });
    });

    test('finds first user message when preceded by system message', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ];

      const result = findFirstUserMessage(messages);

      expect(result).toEqual({ role: 'user', content: 'Hello' });
    });

    test('finds first user message when multiple user messages exist', () => {
      const messages = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Second message' }
      ];

      const result = findFirstUserMessage(messages);

      expect(result).toEqual({ role: 'user', content: 'First message' });
    });

    test('returns null when no user message exists', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'assistant', content: 'Hello' }
      ];

      const result = findFirstUserMessage(messages);

      expect(result).toBe(null);
    });

    test('returns null for empty array', () => {
      const result = findFirstUserMessage([]);

      expect(result).toBe(null);
    });

    test('returns null for invalid input', () => {
      expect(findFirstUserMessage(null)).toBe(null);
      expect(findFirstUserMessage(undefined)).toBe(null);
      expect(findFirstUserMessage('not an array')).toBe(null);
    });
  });

  describe('generateConversationId', () => {
    test('generates consistent ID for same first user message', () => {
      const messages1 = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' }
      ];
      const messages2 = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Different response' },
        { role: 'user', content: 'Follow up' }
      ];

      const id1 = generateConversationId(messages1);
      const id2 = generateConversationId(messages2);

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^[a-f0-9]{32}$/); // MD5 hash format
    });

    test('generates different IDs for different first user messages', () => {
      const messages1 = [{ role: 'user', content: 'Hello' }];
      const messages2 = [{ role: 'user', content: 'Goodbye' }];

      const id1 = generateConversationId(messages1);
      const id2 = generateConversationId(messages2);

      expect(id1).not.toBe(id2);
    });

    test('system message before user message does not affect ID', () => {
      const messages1 = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' }
      ];
      const messages2 = [
        { role: 'user', content: 'Hello' }
      ];
      const messages3 = [
        { role: 'system', content: 'Different system message' },
        { role: 'user', content: 'Hello' }
      ];

      const id1 = generateConversationId(messages1);
      const id2 = generateConversationId(messages2);
      const id3 = generateConversationId(messages3);

      expect(id1).toBe(id2);
      expect(id1).toBe(id3);
    });

    test('throws error if no user message exists', () => {
      const messages = [
        { role: 'system', content: 'You are helpful' }
      ];

      expect(() => generateConversationId(messages)).toThrow('No user message in conversation');
    });

    test('throws error for empty message array', () => {
      expect(() => generateConversationId([])).toThrow('No user message in conversation');
    });

    test('generates specific MD5 hash for known input', () => {
      const messages = [
        { role: 'user', content: 'test' }
      ];

      const id = generateConversationId(messages);

      // MD5 of '{"role":"user","content":"test"}'
      expect(id).toBe('9dfcd002e253607c947a3e83d0c99176');
    });

    test('ignores extra properties in message object', () => {
      const messages1 = [
        { role: 'user', content: 'Hello', timestamp: 123456 }
      ];
      const messages2 = [
        { role: 'user', content: 'Hello', name: 'John' }
      ];
      const messages3 = [
        { role: 'user', content: 'Hello' }
      ];

      const id1 = generateConversationId(messages1);
      const id2 = generateConversationId(messages2);
      const id3 = generateConversationId(messages3);

      // All should produce same ID (only role and content are hashed)
      expect(id1).toBe(id2);
      expect(id1).toBe(id3);
    });

    test('content differences produce different IDs', () => {
      const messages1 = [{ role: 'user', content: 'Hello' }];
      const messages2 = [{ role: 'user', content: 'hello' }]; // lowercase
      const messages3 = [{ role: 'user', content: 'Hello ' }]; // trailing space

      const id1 = generateConversationId(messages1);
      const id2 = generateConversationId(messages2);
      const id3 = generateConversationId(messages3);

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id2).not.toBe(id3);
    });

    test('handles complex message content', () => {
      const messages = [
        { role: 'user', content: 'Multi\nline\nmessage with special chars: !@#$%^&*()' }
      ];

      const id = generateConversationId(messages);

      expect(id).toMatch(/^[a-f0-9]{32}$/);

      // Verify consistency
      const id2 = generateConversationId(messages);
      expect(id).toBe(id2);
    });

    test('handles array content (OpenAI vision messages)', () => {
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is in this image?' },
            { type: 'image_url', image_url: { url: 'https://...' } }
          ]
        }
      ];

      const id = generateConversationId(messages);

      expect(id).toMatch(/^[a-f0-9]{32}$/);

      // Verify consistency
      const id2 = generateConversationId(messages);
      expect(id).toBe(id2);
    });
  });

  describe('integration scenarios', () => {
    test('multi-turn conversation maintains same ID', () => {
      // Turn 1
      const turn1 = [
        { role: 'user', content: 'Hello' }
      ];

      // Turn 2
      const turn2 = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi! How can I help you?' },
        { role: 'user', content: 'What is the weather?' }
      ];

      // Turn 3
      const turn3 = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi! How can I help you?' },
        { role: 'user', content: 'What is the weather?' },
        { role: 'assistant', content: 'I cannot check the weather.' },
        { role: 'user', content: 'Ok, thanks' }
      ];

      const id1 = generateConversationId(turn1);
      const id2 = generateConversationId(turn2);
      const id3 = generateConversationId(turn3);

      // All turns should have same ID (same first user message)
      expect(id1).toBe(id2);
      expect(id2).toBe(id3);
    });

    test('different conversations get different IDs', () => {
      const conversation1 = [
        { role: 'user', content: 'Help me write code' }
      ];

      const conversation2 = [
        { role: 'user', content: 'Tell me a joke' }
      ];

      const conversation3 = [
        { role: 'user', content: 'What is 2+2?' }
      ];

      const id1 = generateConversationId(conversation1);
      const id2 = generateConversationId(conversation2);
      const id3 = generateConversationId(conversation3);

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id2).not.toBe(id3);
    });
  });
});
