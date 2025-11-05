/**
 * Test using EXACT database request format
 * This test sends the exact request from database #127 to verify
 * that the same request format still produces tool calls
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 120000;

describe('Exact Database Request Replication', () => {

  test('should replicate database request #127 exactly', async () => {
    // Get the EXACT request from database
    const dbRequestJson = execSync(
      `sqlite3 /mnt/d/Projects/qwen_proxy/backend/data/qwen_proxy.db "SELECT openai_request FROM requests WHERE id = 127;"`
    ).toString();

    const dbRequest = JSON.parse(dbRequestJson);

    console.log('\n=== DATABASE REQUEST #127 ===');
    console.log('Model:', dbRequest.model);
    console.log('Temperature:', dbRequest.temperature);
    console.log('Stream:', dbRequest.stream);
    console.log('Stream Options:', JSON.stringify(dbRequest.stream_options));
    console.log('Messages:', dbRequest.messages.length);
    console.log('System prompt length:', dbRequest.messages[0].content.length);
    console.log('User content type:', Array.isArray(dbRequest.messages[1].content) ? 'array' : 'string');
    if (Array.isArray(dbRequest.messages[1].content)) {
      console.log('User content parts:', dbRequest.messages[1].content.length);
      console.log('Part 1 preview:', dbRequest.messages[1].content[0].text.substring(0, 100));
      console.log('Part 2 preview:', dbRequest.messages[1].content[1].text.substring(0, 100));
    }

    // Send the EXACT same request
    const response = await axios.post(
      `${BASE_URL}/v1/chat/completions`,
      dbRequest,
      { timeout: TIMEOUT, responseType: 'text' }
    );

    expect(response.status).toBe(200);

    // Parse streaming response
    const lines = response.data.split('\n').filter(line => line.trim());
    let fullContent = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const chunk = JSON.parse(data);
          if (chunk.choices?.[0]?.delta?.content) {
            fullContent += chunk.choices[0].delta.content;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    console.log('\n=== RESPONSE ===');
    console.log('Content length:', fullContent.length);
    console.log('Has <read_file>:', fullContent.includes('<read_file>'));
    console.log('Has <list_files>:', fullContent.includes('<list_files>'));
    console.log('Has <search_files>:', fullContent.includes('<search_files>'));
    console.log('Has refusal:', /I don't have|I cannot|I'm unable/.test(fullContent));
    console.log('Content preview:', fullContent.substring(0, 500));

    // Get the original database response for comparison
    const dbResponseJson = execSync(
      `sqlite3 /mnt/d/Projects/qwen_proxy/backend/data/qwen_proxy.db "SELECT openai_response FROM responses WHERE request_id = 127;"`
    ).toString();

    const dbResponse = JSON.parse(dbResponseJson);
    const dbContent = dbResponse.choices[0].message.content;

    console.log('\n=== ORIGINAL DATABASE RESPONSE ===');
    console.log('Original content:', dbContent);

    console.log('\n=== COMPARISON ===');
    console.log('Current response has tool call:', fullContent.includes('<read_file>') || fullContent.includes('<list_files>'));
    console.log('Original response had tool call:', dbContent.includes('<read_file>') || dbContent.includes('<list_files>'));

    expect(fullContent.length).toBeGreaterThan(0);
  }, TIMEOUT);

  test('should compare test format with database format', () => {
    // Get database request
    const dbRequestJson = execSync(
      `sqlite3 /mnt/d/Projects/qwen_proxy/backend/data/qwen_proxy.db "SELECT openai_request FROM requests WHERE id = 127;"`
    ).toString();

    const dbRequest = JSON.parse(dbRequestJson);

    // Load test format
    const SYSTEM_PROMPT = fs.readFileSync(
      path.join(__dirname, '../../examples/roo_system_prompt.txt'),
      'utf-8'
    );

    const testRequest = {
      model: 'qwen3-max',
      temperature: 0,
      stream: true,
      stream_options: {
        include_usage: true
      },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '<task>\nTest task\n</task>'
            },
            {
              type: 'text',
              text: '<environment_details>\nTest environment\n</environment_details>'
            }
          ]
        }
      ]
    };

    console.log('\n=== FORMAT COMPARISON ===');
    console.log('DB model:', dbRequest.model, '| Test model:', testRequest.model);
    console.log('DB temp:', dbRequest.temperature, '| Test temp:', testRequest.temperature);
    console.log('DB stream:', dbRequest.stream, '| Test stream:', testRequest.stream);
    console.log('DB stream_options:', JSON.stringify(dbRequest.stream_options), '| Test stream_options:', JSON.stringify(testRequest.stream_options));
    console.log('DB system length:', dbRequest.messages[0].content.length, '| Test system length:', testRequest.messages[0].content.length);
    console.log('DB user content is array:', Array.isArray(dbRequest.messages[1].content), '| Test user content is array:', Array.isArray(testRequest.messages[1].content));

    // Check if system prompts are identical
    const systemsMatch = dbRequest.messages[0].content === testRequest.messages[0].content;
    console.log('System prompts match:', systemsMatch);

    if (!systemsMatch) {
      console.log('DB system prompt length:', dbRequest.messages[0].content.length);
      console.log('Test system prompt length:', testRequest.messages[0].content.length);
      console.log('DB first 200 chars:', dbRequest.messages[0].content.substring(0, 200));
      console.log('Test first 200 chars:', testRequest.messages[0].content.substring(0, 200));
    }
  });
});
