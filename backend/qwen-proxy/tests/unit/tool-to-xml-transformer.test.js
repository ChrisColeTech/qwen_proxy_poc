/**
 * Unit Tests: Tool to XML Transformer
 *
 * Tests the conversion of OpenAI tool definitions to XML format
 * for RooCode-style prompt engineering.
 */

const {
  transformToolsToXML,
  generateToolDocumentation,
  convertParametersToXML,
  generateUsageExample,
  getExampleValue,
  validateTool,
  getToolNames,
  hasValidTools
} = require('../../src/transformers/tool-to-xml-transformer');

describe('Tool to XML Transformer', () => {
  describe('transformToolsToXML', () => {
    test('transforms single tool to XML format', () => {
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

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('<tools>');
      expect(xml).toContain('</tools>');
      expect(xml).toContain('## read');
      expect(xml).toContain('Description: Read a file from the filesystem');
      expect(xml).toContain('- filePath: (required) string - Absolute path to the file');
      expect(xml).toContain('<read>');
      expect(xml).toContain('<filePath>example_value</filePath>');
      expect(xml).toContain('</read>');
    });

    test('transforms multiple tools', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read file',
            parameters: {
              type: 'object',
              properties: {
                filePath: { type: 'string', description: 'File path' }
              },
              required: ['filePath']
            }
          }
        },
        {
          type: 'function',
          function: {
            name: 'write',
            description: 'Write file',
            parameters: {
              type: 'object',
              properties: {
                filePath: { type: 'string', description: 'File path' },
                content: { type: 'string', description: 'File content' }
              },
              required: ['filePath', 'content']
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('## read');
      expect(xml).toContain('## write');
      expect(xml).toContain('<read>');
      expect(xml).toContain('<write>');
    });

    test('handles empty tools array', () => {
      const xml = transformToolsToXML([]);
      expect(xml).toBe('<tools>\n\n</tools>');
    });

    test('handles null tools', () => {
      const xml = transformToolsToXML(null);
      expect(xml).toBe('<tools>\n\n</tools>');
    });

    test('handles undefined tools', () => {
      const xml = transformToolsToXML(undefined);
      expect(xml).toBe('<tools>\n\n</tools>');
    });

    test('skips malformed tools', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read file',
            parameters: {
              type: 'object',
              properties: {
                filePath: { type: 'string' }
              }
            }
          }
        },
        {
          type: 'function',
          // Missing function.name
          function: {
            description: 'Invalid tool'
          }
        },
        {
          type: 'function',
          function: {
            name: 'write',
            description: 'Write file',
            parameters: {
              type: 'object',
              properties: {
                filePath: { type: 'string' }
              }
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('## read');
      expect(xml).toContain('## write');
      expect(xml).not.toContain('Invalid tool');
    });

    test('handles tool with no parameters', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'get_current_time',
            description: 'Get current time'
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('## get_current_time');
      expect(xml).toContain('Parameters: None');
      expect(xml).toContain('<get_current_time>');
      expect(xml).toContain('</get_current_time>');
    });

    test('handles tool with optional parameters only', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'list_files',
            description: 'List files in directory',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Directory path' },
                recursive: { type: 'boolean', description: 'Recursive listing' }
              },
              required: []
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('- path: (optional) string - Directory path');
      expect(xml).toContain('- recursive: (optional) boolean - Recursive listing');
    });

    test('handles tool with mixed required and optional parameters', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'bash',
            description: 'Execute command',
            parameters: {
              type: 'object',
              properties: {
                command: { type: 'string', description: 'Command to execute' },
                description: { type: 'string', description: 'Command description' },
                timeout: { type: 'number', description: 'Timeout in ms' }
              },
              required: ['command', 'description']
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('- command: (required) string - Command to execute');
      expect(xml).toContain('- description: (required) string - Command description');
      expect(xml).toContain('- timeout: (optional) number - Timeout in ms');
    });
  });

  describe('generateToolDocumentation', () => {
    test('generates complete documentation', () => {
      const tool = {
        type: 'function',
        function: {
          name: 'read',
          description: 'Read a file',
          parameters: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'File path' }
            },
            required: ['filePath']
          }
        }
      };

      const doc = generateToolDocumentation(tool);

      expect(doc).toContain('## read');
      expect(doc).toContain('Description: Read a file');
      expect(doc).toContain('Parameters:');
      expect(doc).toContain('Usage:');
      expect(doc).toContain('<read>');
    });

    test('handles tool without description', () => {
      const tool = {
        type: 'function',
        function: {
          name: 'test_tool',
          parameters: {
            type: 'object',
            properties: {
              param1: { type: 'string' }
            }
          }
        }
      };

      const doc = generateToolDocumentation(tool);

      expect(doc).toContain('## test_tool');
      expect(doc).not.toContain('Description:');
    });

    test('returns null for tool without name', () => {
      const tool = {
        type: 'function',
        function: {
          description: 'Test'
        }
      };

      const doc = generateToolDocumentation(tool);

      expect(doc).toBeNull();
    });
  });

  describe('convertParametersToXML', () => {
    test('converts parameters with types and descriptions', () => {
      const parameters = {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to file' },
          offset: { type: 'number', description: 'Line offset' },
          limit: { type: 'number', description: 'Line limit' }
        },
        required: ['filePath']
      };

      const paramDoc = convertParametersToXML(parameters);

      expect(paramDoc).toContain('- filePath: (required) string - Path to file');
      expect(paramDoc).toContain('- offset: (optional) number - Line offset');
      expect(paramDoc).toContain('- limit: (optional) number - Line limit');
    });

    test('handles parameters without descriptions', () => {
      const parameters = {
        type: 'object',
        properties: {
          param1: { type: 'string' },
          param2: { type: 'number' }
        },
        required: ['param1']
      };

      const paramDoc = convertParametersToXML(parameters);

      expect(paramDoc).toContain('- param1: (required) string - No description');
      expect(paramDoc).toContain('- param2: (optional) number - No description');
    });

    test('handles parameters without type', () => {
      const parameters = {
        type: 'object',
        properties: {
          param1: { description: 'Test param' }
        }
      };

      const paramDoc = convertParametersToXML(parameters);

      expect(paramDoc).toContain('- param1: (optional) any - Test param');
    });

    test('handles empty properties', () => {
      const parameters = {
        type: 'object',
        properties: {}
      };

      const paramDoc = convertParametersToXML(parameters);

      expect(paramDoc).toBe('');
    });

    test('handles null parameters', () => {
      const paramDoc = convertParametersToXML(null);
      expect(paramDoc).toBe('');
    });
  });

  describe('generateUsageExample', () => {
    test('generates usage example with parameters', () => {
      const parameters = {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          offset: { type: 'number' },
          limit: { type: 'number' }
        }
      };

      const example = generateUsageExample('read', parameters);

      expect(example).toContain('<read>');
      expect(example).toContain('<filePath>example_value</filePath>');
      expect(example).toContain('<offset>100</offset>');
      expect(example).toContain('<limit>100</limit>');
      expect(example).toContain('</read>');
    });

    test('generates usage example without parameters', () => {
      const example = generateUsageExample('get_time', null);

      expect(example).toBe('<get_time>\n</get_time>');
    });

    test('uses default values when provided', () => {
      const parameters = {
        type: 'object',
        properties: {
          timeout: { type: 'number', default: 5000 },
          retries: { type: 'number', default: 3 }
        }
      };

      const example = generateUsageExample('execute', parameters);

      expect(example).toContain('<timeout>5000</timeout>');
      expect(example).toContain('<retries>3</retries>');
    });
  });

  describe('getExampleValue', () => {
    test('returns default value if provided', () => {
      expect(getExampleValue({ type: 'string', default: 'custom' })).toBe('custom');
      expect(getExampleValue({ type: 'number', default: 42 })).toBe('42');
      expect(getExampleValue({ type: 'boolean', default: false })).toBe('false');
    });

    test('returns type-appropriate example for string', () => {
      expect(getExampleValue({ type: 'string' })).toBe('example_value');
    });

    test('returns type-appropriate example for number', () => {
      expect(getExampleValue({ type: 'number' })).toBe('100');
    });

    test('returns type-appropriate example for integer', () => {
      expect(getExampleValue({ type: 'integer' })).toBe('100');
    });

    test('returns type-appropriate example for boolean', () => {
      expect(getExampleValue({ type: 'boolean' })).toBe('true');
    });

    test('returns type-appropriate example for array', () => {
      expect(getExampleValue({ type: 'array' })).toBe('[]');
    });

    test('returns type-appropriate example for object', () => {
      expect(getExampleValue({ type: 'object' })).toBe('{}');
    });

    test('returns generic value for unknown type', () => {
      expect(getExampleValue({ type: 'unknown' })).toBe('value');
    });

    test('returns generic value for missing type', () => {
      expect(getExampleValue({})).toBe('value');
    });
  });

  describe('validateTool', () => {
    test('validates correct tool structure', () => {
      const tool = {
        type: 'function',
        function: {
          name: 'read',
          description: 'Read file'
        }
      };

      expect(validateTool(tool)).toBe(true);
    });

    test('rejects tool without function', () => {
      const tool = {
        type: 'function'
      };

      expect(validateTool(tool)).toBe(false);
    });

    test('rejects tool without function.name', () => {
      const tool = {
        type: 'function',
        function: {
          description: 'Test'
        }
      };

      expect(validateTool(tool)).toBe(false);
    });

    test('rejects null tool', () => {
      expect(validateTool(null)).toBe(false);
    });

    test('rejects undefined tool', () => {
      expect(validateTool(undefined)).toBe(false);
    });

    test('rejects non-object tool', () => {
      expect(validateTool('invalid')).toBe(false);
      expect(validateTool(123)).toBe(false);
    });
  });

  describe('getToolNames', () => {
    test('extracts tool names from tools array', () => {
      const tools = [
        { type: 'function', function: { name: 'read' } },
        { type: 'function', function: { name: 'write' } },
        { type: 'function', function: { name: 'bash' } }
      ];

      const names = getToolNames(tools);

      expect(names).toEqual(['read', 'write', 'bash']);
    });

    test('handles empty array', () => {
      expect(getToolNames([])).toEqual([]);
    });

    test('handles null', () => {
      expect(getToolNames(null)).toEqual([]);
    });

    test('filters out tools without names', () => {
      const tools = [
        { type: 'function', function: { name: 'read' } },
        { type: 'function', function: {} },
        { type: 'function', function: { name: 'write' } }
      ];

      const names = getToolNames(tools);

      expect(names).toEqual(['read', 'write']);
    });
  });

  describe('hasValidTools', () => {
    test('returns true for valid tools array', () => {
      const tools = [
        { type: 'function', function: { name: 'read' } }
      ];

      expect(hasValidTools(tools)).toBe(true);
    });

    test('returns false for empty array', () => {
      expect(hasValidTools([])).toBe(false);
    });

    test('returns false for null', () => {
      expect(hasValidTools(null)).toBe(false);
    });

    test('returns false for array with only invalid tools', () => {
      const tools = [
        { type: 'function', function: {} },
        { type: 'function' }
      ];

      expect(hasValidTools(tools)).toBe(false);
    });

    test('returns true if at least one tool is valid', () => {
      const tools = [
        { type: 'function', function: {} },
        { type: 'function', function: { name: 'read' } }
      ];

      expect(hasValidTools(tools)).toBe(true);
    });
  });

  describe('Real-world OpenCode tools', () => {
    test('transforms read tool correctly', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'read',
            description: 'Read a file from the local filesystem',
            parameters: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'The absolute path to the file to read'
                },
                offset: {
                  type: 'number',
                  description: 'The line number to start reading from'
                },
                limit: {
                  type: 'number',
                  description: 'The number of lines to read'
                }
              },
              required: ['file_path']
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('## read');
      expect(xml).toContain('- file_path: (required) string');
      expect(xml).toContain('- offset: (optional) number');
      expect(xml).toContain('- limit: (optional) number');
    });

    test('transforms bash tool correctly', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'bash',
            description: 'Execute a bash command in a persistent shell session',
            parameters: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'The command to execute'
                },
                description: {
                  type: 'string',
                  description: 'Clear, concise description of what this command does'
                },
                timeout: {
                  type: 'number',
                  description: 'Optional timeout in milliseconds'
                }
              },
              required: ['command', 'description']
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('## bash');
      expect(xml).toContain('- command: (required) string');
      expect(xml).toContain('- description: (required) string');
      expect(xml).toContain('- timeout: (optional) number');
    });

    test('transforms write tool correctly', () => {
      const tools = [
        {
          type: 'function',
          function: {
            name: 'write',
            description: 'Write content to a file',
            parameters: {
              type: 'object',
              properties: {
                file_path: {
                  type: 'string',
                  description: 'The absolute path to the file'
                },
                content: {
                  type: 'string',
                  description: 'The content to write to the file'
                }
              },
              required: ['file_path', 'content']
            }
          }
        }
      ];

      const xml = transformToolsToXML(tools);

      expect(xml).toContain('## write');
      expect(xml).toContain('- file_path: (required) string');
      expect(xml).toContain('- content: (required) string');
    });
  });
});
