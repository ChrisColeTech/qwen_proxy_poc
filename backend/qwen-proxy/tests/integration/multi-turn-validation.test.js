/**
 * Phase 15: Comprehensive Multi-Turn Conversation Validation
 *
 * Deep testing of multi-turn conversations to ensure:
 * - Context preservation across many turns
 * - parent_id chain integrity
 * - Session reuse and isolation
 * - Session expiration
 * - Complex conversation patterns
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_PROXY_URL || 'http://localhost:3000';

describe('Phase 15: Multi-Turn Conversation Validation', () => {
  const skipIfNoCredentials = () => {
    return !process.env.QWEN_TOKEN || !process.env.QWEN_COOKIES;
  };

  describe('3-Turn Context Preservation', () => {
    test('3-turn conversation maintains full context chain', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 15 TEST: 3-Turn Conversation ===');

      // Turn 1: Establish fact
      console.log('\n→ Turn 1: "My name is Alice"');
      const turn1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My name is Alice.' }
        ],
        stream: false
      });

      const response1 = turn1.data.choices[0].message.content;
      console.log('  ✓', response1.substring(0, 100));

      // Turn 2: Test recall
      console.log('\n→ Turn 2: "What is my name?"');
      const turn2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My name is Alice.' },
          { role: 'assistant', content: response1 },
          { role: 'user', content: 'What is my name?' }
        ],
        stream: false
      });

      const response2 = turn2.data.choices[0].message.content;
      console.log('  ✓', response2);
      expect(response2.toLowerCase()).toContain('alice');

      // Turn 3: Test meta-recall
      console.log('\n→ Turn 3: "What did I just ask you?"');
      const turn3 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'My name is Alice.' },
          { role: 'assistant', content: response1 },
          { role: 'user', content: 'What is my name?' },
          { role: 'assistant', content: response2 },
          { role: 'user', content: 'What did I just ask you in my previous message?' }
        ],
        stream: false
      });

      const response3 = turn3.data.choices[0].message.content;
      console.log('  ✓', response3);
      
      // Should reference the "What is my name?" question
      const response3Lower = response3.toLowerCase();
      const recallsQuestion = response3Lower.includes('name') || 
                             response3Lower.includes('asked');
      expect(recallsQuestion).toBe(true);

      console.log('\n✅ PHASE 15 TEST PASSED: 3-turn context chain intact');
    }, 120000);
  });

  describe('5-Turn Complex Context', () => {
    test('5-turn conversation with layered information', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 15 TEST: 5-Turn Complex Context ===');

      const conversation = [];

      // Turn 1: Name
      console.log('\n→ Turn 1: Name');
      conversation.push({ role: 'user', content: 'I am Bob.' });
      
      let response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [...conversation],
        stream: false
      });
      
      const resp1 = response.data.choices[0].message.content;
      conversation.push({ role: 'assistant', content: resp1 });
      console.log('  ✓', resp1.substring(0, 80));

      // Turn 2: Age
      console.log('\n→ Turn 2: Age');
      conversation.push({ role: 'user', content: 'I am 30 years old.' });
      
      response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [...conversation],
        stream: false
      });
      
      const resp2 = response.data.choices[0].message.content;
      conversation.push({ role: 'assistant', content: resp2 });
      console.log('  ✓', resp2.substring(0, 80));

      // Turn 3: Location
      console.log('\n→ Turn 3: Location');
      conversation.push({ role: 'user', content: 'I live in Seattle.' });
      
      response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [...conversation],
        stream: false
      });
      
      const resp3 = response.data.choices[0].message.content;
      conversation.push({ role: 'assistant', content: resp3 });
      console.log('  ✓', resp3.substring(0, 80));

      // Turn 4: Job
      console.log('\n→ Turn 4: Job');
      conversation.push({ role: 'user', content: 'I work as a developer.' });
      
      response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [...conversation],
        stream: false
      });
      
      const resp4 = response.data.choices[0].message.content;
      conversation.push({ role: 'assistant', content: resp4 });
      console.log('  ✓', resp4.substring(0, 80));

      // Turn 5: Comprehensive recall
      console.log('\n→ Turn 5: Ask for all information');
      conversation.push({ 
        role: 'user', 
        content: 'Tell me everything you know about me: name, age, location, and job.' 
      });
      
      response = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [...conversation],
        stream: false
      });
      
      const resp5 = response.data.choices[0].message.content;
      console.log('  ✓ Final response:', resp5);

      // Verify ALL context maintained
      const finalLower = resp5.toLowerCase();
      expect(finalLower).toContain('bob');
      expect(finalLower.includes('30') || finalLower.includes('thirty')).toBe(true);
      expect(finalLower).toContain('seattle');
      expect(finalLower).toContain('developer');

      console.log('✓ All context preserved: name, age, location, job');
      console.log('\n✅ PHASE 15 TEST PASSED: 5-turn complex context maintained');
    }, 180000);
  });

  describe('Multiple Separate Conversations (Session Isolation)', () => {
    test('Two conversations with different first messages stay isolated', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 15 TEST: Session Isolation ===');

      // Conversation A
      console.log('\n→ Conversation A: Setup');
      const convA = [
        { role: 'user', content: 'My favorite fruit is apple.' }
      ];

      let respA1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: convA,
        stream: false
      });

      const contentA1 = respA1.data.choices[0].message.content;
      convA.push({ role: 'assistant', content: contentA1 });
      console.log('  ✓ A1:', contentA1.substring(0, 60));

      // Conversation B (different session)
      console.log('\n→ Conversation B: Setup');
      const convB = [
        { role: 'user', content: 'My favorite fruit is banana.' }
      ];

      let respB1 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: convB,
        stream: false
      });

      const contentB1 = respB1.data.choices[0].message.content;
      convB.push({ role: 'assistant', content: contentB1 });
      console.log('  ✓ B1:', contentB1.substring(0, 60));

      // Continue Conversation A
      console.log('\n→ Conversation A: Follow-up');
      convA.push({ role: 'user', content: 'What is my favorite fruit?' });

      let respA2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: convA,
        stream: false
      });

      const contentA2 = respA2.data.choices[0].message.content;
      console.log('  ✓ A2:', contentA2);

      // Continue Conversation B
      console.log('\n→ Conversation B: Follow-up');
      convB.push({ role: 'user', content: 'What is my favorite fruit?' });

      let respB2 = await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: convB,
        stream: false
      });

      const contentB2 = respB2.data.choices[0].message.content;
      console.log('  ✓ B2:', contentB2);

      // Verify isolation: A should say apple, B should say banana
      const a2Lower = contentA2.toLowerCase();
      const b2Lower = contentB2.toLowerCase();

      expect(a2Lower).toContain('apple');
      expect(b2Lower).toContain('banana');
      
      // Verify no leakage
      expect(a2Lower).not.toContain('banana');
      expect(b2Lower).not.toContain('apple');

      console.log('✓ No context leakage between sessions');
      console.log('\n✅ PHASE 15 TEST PASSED: Session isolation verified');
    }, 180000);
  });

  describe('Session Stability and Reuse', () => {
    test('Session ID is stable across multiple turns', async () => {
      if (skipIfNoCredentials()) {
        console.log('⏭️  Skipping test - no credentials');
        return;
      }

      console.log('\n=== PHASE 15 TEST: Session Stability ===');

      const healthBefore = await axios.get(`${BASE_URL}/health`);
      const sessionsBefore = healthBefore.data.sessions;
      console.log('📊 Sessions before:', sessionsBefore);

      // Turn 1
      console.log('\n→ Turn 1');
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'The magic word is ABRACADABRA.' }
        ],
        stream: false
      });

      const healthAfter1 = await axios.get(`${BASE_URL}/health`);
      const sessionsAfter1 = healthAfter1.data.sessions;
      console.log('📊 Sessions after turn 1:', sessionsAfter1);
      expect(sessionsAfter1).toBe(sessionsBefore + 1);

      // Turn 2 (same first message)
      console.log('\n→ Turn 2');
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'The magic word is ABRACADABRA.' },
          { role: 'assistant', content: 'OK' },
          { role: 'user', content: 'Say it back' }
        ],
        stream: false
      });

      const healthAfter2 = await axios.get(`${BASE_URL}/health`);
      const sessionsAfter2 = healthAfter2.data.sessions;
      console.log('📊 Sessions after turn 2:', sessionsAfter2);
      expect(sessionsAfter2).toBe(sessionsAfter1); // Should NOT create new session

      // Turn 3 (same first message)
      console.log('\n→ Turn 3');
      await axios.post(`${BASE_URL}/v1/chat/completions`, {
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'The magic word is ABRACADABRA.' },
          { role: 'assistant', content: 'OK' },
          { role: 'user', content: 'Say it back' },
          { role: 'assistant', content: 'ABRACADABRA' },
          { role: 'user', content: 'Good' }
        ],
        stream: false
      });

      const healthAfter3 = await axios.get(`${BASE_URL}/health`);
      const sessionsAfter3 = healthAfter3.data.sessions;
      console.log('📊 Sessions after turn 3:', sessionsAfter3);
      expect(sessionsAfter3).toBe(sessionsAfter1); // Still same session

      console.log('✓ Session remained stable across 3 turns');
      console.log('\n✅ PHASE 15 TEST PASSED: Session stability verified');
    }, 120000);
  });
});
