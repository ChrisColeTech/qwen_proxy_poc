/**
 * Roo-Cline Accurate Tool Calling Integration Tests
 *
 * These tests replicate the EXACT format Roo-Cline uses based on REAL database requests.
 * Tests multiple Qwen models to analyze XML tool call responses and determine if
 * response transformers are needed.
 *
 * Key Requirements:
 * - Uses actual Roo-Cline system prompt (38KB, 576 lines)
 * - User messages as content arrays (NOT strings)
 * - No OpenAI tools array
 * - Always temperature: 0, stream: true
 * - Tests for XML tool calls in responses
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 120000; // 2 minutes for complex requests

// Models to test (based on available models)
const TEST_MODELS = [
  'qwen3-max',              // Most capable - what Roo-Cline uses
  'qwen3-coder-plus',       // Code-specialized with tool use
  'qwen3-coder-30b-a3b-instruct', // Coder Flash with function calling
];

// Load the real Roo-Cline system prompt
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, '../../examples/roo_system_prompt.txt'),
  'utf-8'
);

describe('Roo-Cline Accurate Tool Calling Tests', () => {

  // Helper function to create environment details (mimics Roo-Cline format)
  const createEnvironmentDetails = () => {
    return `<environment_details>
# VSCode Visible Files


# VSCode Open Tabs


# Current Time
Current time in ISO 8601 UTC format: ${new Date().toISOString()}
User time zone: America/New_York, UTC-5:00

# Current Cost
$0.00

# Current Mode
<slug>code</slug>
<name>Code</name>
<model>qwen3-max</model>

# Current Workspace Directory (/mnt/d/Projects/qwen_proxy/backend) Files
(Workspace files context disabled. Use list_files to explore if needed.)

</environment_details>`;
  };

  // Helper function to create Roo-Cline format request
  const createRooRequest = (taskText, model = 'qwen3-max', options = {}) => {
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ];

    // Pre-warming: Add an example XML tool exchange to "teach" the model
    // This matches real Roo-Cline behavior where the model learns from previous exchanges
    if (options.prewarm !== false) { // Default to true
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: '<task>\nList files in current directory\n</task>'
          },
          {
            type: 'text',
            text: createEnvironmentDetails()
          }
        ]
      });
      messages.push({
        role: 'assistant',
        content: '<list_files>\n<path>.</path>\n<recursive>false</recursive>\n</list_files>'
      });
    }

    // Add the actual task
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: `<task>\n${taskText}\n</task>`
        },
        {
          type: 'text',
          text: createEnvironmentDetails()
        }
      ]
    });

    return {
      model,
      temperature: 0,
      stream: true,
      stream_options: {
        include_usage: true
      },
      messages
    };
  };

  // Helper function to parse streaming response
  const parseStreamingResponse = (streamData) => {
    const lines = streamData.split('\n').filter(line => line.trim());
    let fullContent = '';
    let usage = null;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const chunk = JSON.parse(data);
          if (chunk.choices?.[0]?.delta?.content) {
            fullContent += chunk.choices[0].delta.content;
          }
          if (chunk.usage) {
            usage = chunk.usage;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return { content: fullContent, usage };
  };

  // Helper function to analyze response for XML tool calls
  const analyzeResponse = (content) => {
    const analysis = {
      hasXmlToolCall: false,
      toolCallsFound: [],
      isNaturalLanguage: false,
      hasRefusal: false,
      responseType: 'unknown',
      contentPreview: content.substring(0, 500)
    };

    // Check for XML tool call patterns
    const xmlToolPatterns = [
      /<read_file>/i,
      /<list_files>/i,
      /<search_files>/i,
      /<execute_command>/i,
      /<write_to_file>/i,
      /<apply_diff>/i,
      /<attempt_completion>/i,
      /<ask_followup_question>/i,
      /<new_task>/i,
      /<switch_mode>/i
    ];

    for (const pattern of xmlToolPatterns) {
      if (pattern.test(content)) {
        analysis.hasXmlToolCall = true;
        analysis.toolCallsFound.push(pattern.source.replace(/[<>/\\i]/g, ''));
      }
    }

    // Check for refusal patterns
    const refusalPatterns = [
      /I don't have access/i,
      /I cannot/i,
      /I'm unable to/i,
      /As an AI/i,
      /I do not have the ability/i
    ];

    for (const pattern of refusalPatterns) {
      if (pattern.test(content)) {
        analysis.hasRefusal = true;
        analysis.isNaturalLanguage = true;
      }
    }

    // Determine response type
    if (analysis.hasXmlToolCall) {
      analysis.responseType = 'xml_tool_call';
    } else if (analysis.hasRefusal) {
      analysis.responseType = 'refusal';
    } else if (content.length > 50) {
      analysis.responseType = 'natural_language_explanation';
      analysis.isNaturalLanguage = true;
    }

    return analysis;
  };

  // Helper to save response to file
  const saveResponse = (testName, model, content, analysis) => {
    const dir = path.join(__dirname, '../../examples/test_responses');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `${testName.replace(/\s+/g, '_')}_${model}.json`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      testName,
      model,
      timestamp: new Date().toISOString(),
      content,
      analysis
    }, null, 2));

    return filepath;
  };

  // Test Case 1: Read File Request
  describe('Test 1: Read File Request', () => {
    TEST_MODELS.forEach(model => {
      test(`should request file read with ${model}`, async () => {
        const request = createRooRequest(
          'Read the README.md file',
          model
        );

        const response = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          request,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(response.status).toBe(200);

        const parsed = parseStreamingResponse(response.data);
        const analysis = analyzeResponse(parsed.content);

        // Save response for analysis
        const savedPath = saveResponse('read_file', model, parsed.content, analysis);

        console.log(`\n[${model}] Read File Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Has Refusal: ${analysis.hasRefusal}`);
        console.log(`  Saved to: ${savedPath}`);
        console.log(`  Content Preview: ${analysis.contentPreview}`);

        expect(parsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT);
    });
  });

  // Test Case 2: List Files Request
  describe('Test 2: List Files Request', () => {
    TEST_MODELS.forEach(model => {
      test(`should request file listing with ${model}`, async () => {
        const request = createRooRequest(
          'List all files in the current directory',
          model
        );

        const response = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          request,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(response.status).toBe(200);

        const parsed = parseStreamingResponse(response.data);
        const analysis = analyzeResponse(parsed.content);

        const savedPath = saveResponse('list_files', model, parsed.content, analysis);

        console.log(`\n[${model}] List Files Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Saved to: ${savedPath}`);

        expect(parsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT);
    });
  });

  // Test Case 3: Search Files Request
  describe('Test 3: Search Files Request', () => {
    TEST_MODELS.forEach(model => {
      test(`should request file search with ${model}`, async () => {
        const request = createRooRequest(
          'Search for the word "session" in all JavaScript files',
          model
        );

        const response = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          request,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(response.status).toBe(200);

        const parsed = parseStreamingResponse(response.data);
        const analysis = analyzeResponse(parsed.content);

        const savedPath = saveResponse('search_files', model, parsed.content, analysis);

        console.log(`\n[${model}] Search Files Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Saved to: ${savedPath}`);

        expect(parsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT);
    });
  });

  // Test Case 4: Execute Command Request
  describe('Test 4: Execute Command Request', () => {
    TEST_MODELS.forEach(model => {
      test(`should request command execution with ${model}`, async () => {
        const request = createRooRequest(
          'Run npm test to check if tests pass',
          model
        );

        const response = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          request,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(response.status).toBe(200);

        const parsed = parseStreamingResponse(response.data);
        const analysis = analyzeResponse(parsed.content);

        const savedPath = saveResponse('execute_command', model, parsed.content, analysis);

        console.log(`\n[${model}] Execute Command Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Saved to: ${savedPath}`);

        expect(parsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT);
    });
  });

  // Test Case 5: Write File Request
  describe('Test 5: Write File Request', () => {
    TEST_MODELS.forEach(model => {
      test(`should request file write with ${model}`, async () => {
        const request = createRooRequest(
          'Create a new file called test.txt with the content "Hello World"',
          model
        );

        const response = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          request,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(response.status).toBe(200);

        const parsed = parseStreamingResponse(response.data);
        const analysis = analyzeResponse(parsed.content);

        const savedPath = saveResponse('write_file', model, parsed.content, analysis);

        console.log(`\n[${model}] Write File Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Saved to: ${savedPath}`);

        expect(parsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT);
    });
  });

  // Test Case 6: Complex Task with Multiple Steps
  describe('Test 6: Complex Multi-Step Task', () => {
    TEST_MODELS.forEach(model => {
      test(`should handle complex task with ${model}`, async () => {
        const request = createRooRequest(
          'First read package.json, then list all test files in the tests directory',
          model
        );

        const response = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          request,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(response.status).toBe(200);

        const parsed = parseStreamingResponse(response.data);
        const analysis = analyzeResponse(parsed.content);

        const savedPath = saveResponse('complex_task', model, parsed.content, analysis);

        console.log(`\n[${model}] Complex Task Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Multiple Tools: ${analysis.toolCallsFound.length > 1}`);
        console.log(`  Saved to: ${savedPath}`);

        expect(parsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT);
    });
  });

  // Test Case 7: Ask Followup Question
  describe('Test 7: Ask Followup Question', () => {
    TEST_MODELS.forEach(model => {
      test(`should ask followup question with ${model}`, async () => {
        const request = createRooRequest(
          'I need to update a configuration file but I am not sure which one. Ask me which file to update.',
          model
        );

        const response = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          request,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(response.status).toBe(200);

        const parsed = parseStreamingResponse(response.data);
        const analysis = analyzeResponse(parsed.content);

        const savedPath = saveResponse('ask_followup', model, parsed.content, analysis);

        console.log(`\n[${model}] Ask Followup Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Saved to: ${savedPath}`);

        expect(parsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT);
    });
  });

  // Test Case 8: Multi-Turn Conversation
  describe('Test 8: Multi-Turn Conversation', () => {
    TEST_MODELS.forEach(model => {
      test(`should handle multi-turn conversation with ${model}`, async () => {
        // First turn
        const firstRequest = createRooRequest(
          'List files in the current directory',
          model
        );

        const firstResponse = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          firstRequest,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        const firstParsed = parseStreamingResponse(firstResponse.data);

        // Second turn - add assistant response and new user message
        const secondRequest = {
          model,
          temperature: 0,
          stream: true,
          stream_options: {
            include_usage: true
          },
          messages: [
            ...firstRequest.messages,
            {
              role: 'assistant',
              content: firstParsed.content
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '[Tool Result] Files: package.json, README.md, src/, tests/'
                },
                {
                  type: 'text',
                  text: createEnvironmentDetails()
                }
              ]
            }
          ]
        };

        const secondResponse = await axios.post(
          `${BASE_URL}/v1/chat/completions`,
          secondRequest,
          { timeout: TIMEOUT, responseType: 'text' }
        );

        expect(secondResponse.status).toBe(200);

        const secondParsed = parseStreamingResponse(secondResponse.data);
        const analysis = analyzeResponse(secondParsed.content);

        const savedPath = saveResponse('multi_turn', model, secondParsed.content, analysis);

        console.log(`\n[${model}] Multi-Turn Test:`);
        console.log(`  XML Tool Call: ${analysis.hasXmlToolCall}`);
        console.log(`  Tools Found: ${analysis.toolCallsFound.join(', ') || 'none'}`);
        console.log(`  Response Type: ${analysis.responseType}`);
        console.log(`  Saved to: ${savedPath}`);

        expect(secondParsed.content.length).toBeGreaterThan(0);
      }, TIMEOUT * 2);
    });
  });

  // Test Case 9: Pre-warming Effectiveness
  describe('Test 9: Pre-warming Effectiveness', () => {
    test('should compare pre-warmed vs non-pre-warmed requests', async () => {
      console.log('\n[Pre-warming Comparison]');

      // Without pre-warming
      const noPrewarmRequest = createRooRequest('Read README.md', 'qwen3-max', { prewarm: false });
      console.log('  Without pre-warming - Messages:', noPrewarmRequest.messages.length);

      // With pre-warming (default)
      const prewarmRequest = createRooRequest('Read README.md', 'qwen3-max');
      console.log('  With pre-warming - Messages:', prewarmRequest.messages.length);

      expect(noPrewarmRequest.messages.length).toBe(2); // system + user
      expect(prewarmRequest.messages.length).toBe(4); // system + prewarm user + prewarm assistant + actual user
      expect(prewarmRequest.messages[2].role).toBe('assistant');
      expect(prewarmRequest.messages[2].content).toContain('<list_files>');

      console.log('  Pre-warming adds example XML exchange: PASS');
    });
  });

  // Test Case 10: Streaming Format Validation
  describe('Test 10: Streaming Format Validation', () => {
    test('should receive proper SSE streaming format', async () => {
      const request = createRooRequest('Say hello');

      const response = await axios.post(
        `${BASE_URL}/v1/chat/completions`,
        request,
        { timeout: TIMEOUT, responseType: 'text' }
      );

      expect(response.status).toBe(200);

      const lines = response.data.split('\n').filter(line => line.trim());

      // Validate SSE format
      let hasDataPrefix = false;
      let hasDoneMarker = false;
      let hasValidJson = false;

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          hasDataPrefix = true;
          const data = line.slice(6);
          if (data === '[DONE]') {
            hasDoneMarker = true;
          } else {
            try {
              JSON.parse(data);
              hasValidJson = true;
            } catch (e) {
              // Invalid JSON chunk
            }
          }
        }
      }

      console.log('\n[Streaming Format Validation]');
      console.log('  Has data: prefix:', hasDataPrefix);
      console.log('  Has [DONE] marker:', hasDoneMarker);
      console.log('  Has valid JSON chunks:', hasValidJson);
      console.log('  Total lines:', lines.length);

      expect(hasDataPrefix).toBe(true);
      expect(hasDoneMarker).toBe(true);
      expect(hasValidJson).toBe(true);
    }, TIMEOUT);
  });

  // Summary test - analyze all results
  describe('Test Summary and Analysis', () => {
    test('should generate comprehensive analysis report', () => {
      const responseDir = path.join(__dirname, '../../examples/test_responses');

      if (!fs.existsSync(responseDir)) {
        console.log('\nNo test responses found. Run other tests first.');
        return;
      }

      const files = fs.readdirSync(responseDir).filter(f => f.endsWith('.json'));

      const summary = {
        totalTests: files.length,
        byModel: {},
        byResponseType: {},
        xmlToolCallRate: 0,
        refusalRate: 0,
        naturalLanguageRate: 0
      };

      let xmlToolCallCount = 0;
      let refusalCount = 0;
      let naturalLanguageCount = 0;

      for (const file of files) {
        const data = JSON.parse(
          fs.readFileSync(path.join(responseDir, file), 'utf-8')
        );

        // Count by model
        summary.byModel[data.model] = (summary.byModel[data.model] || 0) + 1;

        // Count by response type
        summary.byResponseType[data.analysis.responseType] =
          (summary.byResponseType[data.analysis.responseType] || 0) + 1;

        // Count characteristics
        if (data.analysis.hasXmlToolCall) xmlToolCallCount++;
        if (data.analysis.hasRefusal) refusalCount++;
        if (data.analysis.isNaturalLanguage) naturalLanguageCount++;
      }

      summary.xmlToolCallRate = ((xmlToolCallCount / files.length) * 100).toFixed(1) + '%';
      summary.refusalRate = ((refusalCount / files.length) * 100).toFixed(1) + '%';
      summary.naturalLanguageRate = ((naturalLanguageCount / files.length) * 100).toFixed(1) + '%';

      console.log('\n' + '='.repeat(80));
      console.log('TEST SUMMARY AND ANALYSIS');
      console.log('='.repeat(80));
      console.log(JSON.stringify(summary, null, 2));
      console.log('='.repeat(80));

      // Save summary
      fs.writeFileSync(
        path.join(__dirname, '../../docs/ROO_TEST_SUMMARY.json'),
        JSON.stringify(summary, null, 2)
      );
    });
  });
});
