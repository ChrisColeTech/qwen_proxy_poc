/**
 * Manual Test: Tool Injection into System Prompt
 *
 * This test verifies that OpenAI tools array is properly transformed
 * to XML format and injected into the system prompt.
 */

const { injectToolDefinitions } = require('../src/transformers/openai-to-qwen-transformer');
const { transformToolsToXML } = require('../src/transformers/tool-to-xml-transformer');

console.log('='.repeat(80));
console.log('MANUAL TEST: Tool Injection');
console.log('='.repeat(80));
console.log();

// Test 1: Basic tool injection
console.log('TEST 1: Basic Read Tool');
console.log('-'.repeat(80));

const tools = [
  {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read a file from the filesystem',
      parameters: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Absolute path to the file'
          }
        },
        required: ['filePath']
      }
    }
  }
];

const systemPrompt = 'You are a helpful AI assistant.';
const enhanced = injectToolDefinitions(systemPrompt, tools);

console.log('ORIGINAL SYSTEM PROMPT:');
console.log(systemPrompt);
console.log();
console.log('ENHANCED SYSTEM PROMPT WITH TOOLS:');
console.log(enhanced);
console.log();

// Test 2: Multiple tools
console.log('\n' + '='.repeat(80));
console.log('TEST 2: Multiple Tools (Read, Write, Bash)');
console.log('-'.repeat(80));

const multipleTools = [
  {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'File path' }
        },
        required: ['file_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write',
      description: 'Write to a file',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['file_path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute a bash command',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          description: { type: 'string', description: 'What the command does' }
        },
        required: ['command', 'description']
      }
    }
  }
];

const enhancedMultiple = injectToolDefinitions('You are Roo, an AI coding assistant.', multipleTools);

console.log('ORIGINAL SYSTEM PROMPT:');
console.log('You are Roo, an AI coding assistant.');
console.log();
console.log('ENHANCED SYSTEM PROMPT WITH 3 TOOLS:');
console.log(enhancedMultiple);
console.log();

// Test 3: Just XML transformation
console.log('\n' + '='.repeat(80));
console.log('TEST 3: XML Transformation Only');
console.log('-'.repeat(80));

const xml = transformToolsToXML(multipleTools);
console.log('XML TOOL DEFINITIONS:');
console.log(xml);
console.log();

// Test 4: Verify format matches RooCode style
console.log('\n' + '='.repeat(80));
console.log('TEST 4: Format Validation');
console.log('-'.repeat(80));

const hasToolUseSection = enhanced.includes('TOOL USE');
const hasToolCallFormat = enhanced.includes('<tool_name>');
const hasAvailableTools = enhanced.includes('## Available Tools');
const hasToolXml = enhanced.includes('<read>');

console.log('✓ Has TOOL USE section:', hasToolUseSection);
console.log('✓ Has Tool Call Format example:', hasToolCallFormat);
console.log('✓ Has Available Tools section:', hasAvailableTools);
console.log('✓ Has XML tool definition:', hasToolXml);
console.log();

if (hasToolUseSection && hasToolCallFormat && hasAvailableTools && hasToolXml) {
  console.log('✅ ALL FORMAT CHECKS PASSED');
} else {
  console.log('❌ SOME FORMAT CHECKS FAILED');
}

console.log();
console.log('='.repeat(80));
console.log('MANUAL TEST COMPLETE');
console.log('='.repeat(80));
