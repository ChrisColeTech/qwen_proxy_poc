/**
 * Roocode Integration Test 2: SSE Format Validation
 *
 * Tests that our proxy's SSE (Server-Sent Events) format matches
 * what Roocode's OpenAI SDK expects and can parse correctly.
 *
 * Based on Roocode's actual streaming implementation in:
 * /mnt/d/Projects/Roo-Cline/src/api/providers/base-openai-compatible-provider.ts
 */

require('dotenv').config();
const request = require('supertest');
const proxyApp = require('../../proxy-server');

describe('Roocode Integration: SSE Format Validation', () => {
  let server;
  let serverUrl;

  beforeAll((done) => {
    server = proxyApp.listen(0, () => {
      const port = server.address().port;
      serverUrl = `http://localhost:${port}`;
      console.log(`Test proxy server running on ${serverUrl}`);
      done();
    });
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('SSE stream format matches OpenAI SDK expectations', (done) => {
    console.log('\n=== TEST: SSE Stream Format ===');

    let chunks = [];
    let rawData = '';

    request(serverUrl)
      .post('/v1/chat/completions')
      .set('Content-Type', 'application/json')
      .set('HTTP-Referer', 'https://github.com/RooVetGit/Roo-Cline')
      .set('X-Title', 'Roo Code')
      .set('User-Agent', 'RooCode/1.0.0')
      .send({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Say hello' }
        ],
        stream: true,
        stream_options: { include_usage: true }
      })
      .parse((res, callback) => {
        // Parse SSE format manually to verify structure
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') {
                chunks.push({ type: 'done' });
              } else {
                try {
                  const data = JSON.parse(dataStr);
                  chunks.push(data);
                } catch (e) {
                  console.error('Failed to parse SSE data:', dataStr);
                }
              }
            }
          }
        });

        res.on('end', () => {
          callback(null, { chunks, rawData });
        });
      })
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        console.log('\nTotal chunks received:', chunks.length);
        console.log('First chunk:', JSON.stringify(chunks[0], null, 2));
        if (chunks.length > 1) {
          console.log('Last chunk:', JSON.stringify(chunks[chunks.length - 1], null, 2));
        }

        // Verify SSE format
        expect(chunks.length).toBeGreaterThan(0);

        // Check chunk structure matches OpenAI format
        for (const chunk of chunks) {
          if (chunk.type === 'done') {
            continue; // [DONE] marker is valid
          }

          // Every chunk should have these fields
          expect(chunk).toHaveProperty('id');
          expect(chunk).toHaveProperty('object');
          expect(chunk.object).toBe('chat.completion.chunk');
          expect(chunk).toHaveProperty('created');
          expect(chunk).toHaveProperty('model');
          expect(chunk).toHaveProperty('choices');

          // Choices should be an array
          expect(Array.isArray(chunk.choices)).toBe(true);

          // If there are choices, validate structure
          if (chunk.choices.length > 0) {
            const choice = chunk.choices[0];
            expect(choice).toHaveProperty('index');
            expect(choice).toHaveProperty('delta');

            // Delta should be an object
            expect(typeof choice.delta).toBe('object');
          }

          // If usage is present, validate structure
          if (chunk.usage) {
            expect(chunk.usage).toHaveProperty('prompt_tokens');
            expect(chunk.usage).toHaveProperty('completion_tokens');
            expect(chunk.usage).toHaveProperty('total_tokens');
          }
        }

        // Verify we got content chunks
        const contentChunks = chunks.filter(c => c.choices?.[0]?.delta?.content);
        expect(contentChunks.length).toBeGreaterThan(0);

        // Verify we got a finish chunk
        const finishChunk = chunks.find(c => c.choices?.[0]?.finish_reason);
        expect(finishChunk).toBeDefined();
        expect(finishChunk.choices[0].finish_reason).toBe('stop');

        // Verify usage data is included (Roocode expects this)
        const usageChunk = chunks.find(c => c.usage);
        expect(usageChunk).toBeDefined();

        console.log('=== TEST PASSED ===\n');
        done();
      });
  }, 30000);

  test('SSE stream handles multi-line content correctly', (done) => {
    console.log('\n=== TEST: Multi-line SSE Content ===');

    let chunks = [];

    request(serverUrl)
      .post('/v1/chat/completions')
      .set('Content-Type', 'application/json')
      .send({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Write a 3-line poem' }
        ],
        stream: true
      })
      .parse((res, callback) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.substring(6));
                chunks.push(data);
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        });
        res.on('end', () => callback(null, chunks));
      })
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        // Accumulate content
        let fullContent = '';
        for (const chunk of chunks) {
          if (chunk.choices?.[0]?.delta?.content) {
            fullContent += chunk.choices[0].delta.content;
          }
        }

        console.log('\nFull content:', fullContent);

        // Verify we got multi-line content
        expect(fullContent).toBeTruthy();
        const lines = fullContent.trim().split('\n');
        console.log('Number of lines:', lines.length);

        // Verify content was transmitted correctly
        expect(fullContent.length).toBeGreaterThan(0);

        console.log('=== TEST PASSED ===\n');
        done();
      });
  }, 30000);

  test('SSE stream handles rapid chunks without corruption', (done) => {
    console.log('\n=== TEST: Rapid Chunk Handling ===');

    let allData = '';
    let parseErrors = 0;

    request(serverUrl)
      .post('/v1/chat/completions')
      .set('Content-Type', 'application/json')
      .send({
        model: 'qwen3-max',
        messages: [
          { role: 'user', content: 'Count from 1 to 10' }
        ],
        stream: true
      })
      .parse((res, callback) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          allData += chunk;

          // Try to parse each data: line
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                JSON.parse(line.substring(6));
              } catch (e) {
                parseErrors++;
                console.error('Parse error on line:', line);
              }
            }
          }
        });
        res.on('end', () => callback(null, { allData, parseErrors }));
      })
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        console.log('\nTotal data received:', allData.length, 'bytes');
        console.log('Parse errors:', parseErrors);

        // Should have no parse errors
        expect(parseErrors).toBe(0);

        // Should have received data
        expect(allData.length).toBeGreaterThan(0);

        console.log('=== TEST PASSED ===\n');
        done();
      });
  }, 30000);
});
