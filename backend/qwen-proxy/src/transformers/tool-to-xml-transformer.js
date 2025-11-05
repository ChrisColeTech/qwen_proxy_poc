/**
 * Tool to XML Transformer
 *
 * Converts OpenAI tool definitions (JSON schema) to XML-style tool definitions
 * for injection into system prompts. Based on RooCode's proven XML approach.
 *
 * Transformation Flow:
 * OpenAI Format (JSON) → XML Documentation Format → Injected in System Prompt
 *
 * Example Input:
 * {
 *   "type": "function",
 *   "function": {
 *     "name": "read",
 *     "description": "Read a file",
 *     "parameters": {
 *       "type": "object",
 *       "properties": {
 *         "filePath": { "type": "string", "description": "File path" }
 *       },
 *       "required": ["filePath"]
 *     }
 *   }
 * }
 *
 * Example Output:
 * ## read
 * Description: Read a file
 * Parameters:
 * - filePath: (required) string - File path
 *
 * Usage:
 * <read>
 * <filePath>/path/to/file</filePath>
 * </read>
 */

/**
 * Transform OpenAI tools array to XML schema string
 *
 * @param {Array} tools - OpenAI tools array with function definitions
 * @returns {string} XML schema documentation for system prompt
 *
 * @example
 * const tools = [
 *   {
 *     type: 'function',
 *     function: {
 *       name: 'read',
 *       description: 'Read a file',
 *       parameters: {
 *         type: 'object',
 *         properties: {
 *           filePath: { type: 'string', description: 'File path' }
 *         },
 *         required: ['filePath']
 *       }
 *     }
 *   }
 * ];
 * const xml = transformToolsToXML(tools);
 */
function transformToolsToXML(tools) {
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return '<tools>\n\n</tools>';
  }

  const toolDocs = [];

  for (const tool of tools) {
    try {
      // Validate tool structure
      if (!tool.function || !tool.function.name) {
        console.warn('[ToolToXML] Skipping malformed tool:', tool);
        continue;
      }

      const toolDoc = generateToolDocumentation(tool);
      if (toolDoc) {
        toolDocs.push(toolDoc);
      }
    } catch (error) {
      console.error('[ToolToXML] Error processing tool:', tool.function?.name, error.message);
      // Continue processing other tools
    }
  }

  if (toolDocs.length === 0) {
    return '<tools>\n\n</tools>';
  }

  return '<tools>\n' + toolDocs.join('\n\n') + '\n</tools>';
}

/**
 * Generate XML tool documentation for a single tool
 *
 * @param {Object} tool - OpenAI tool definition
 * @param {string} tool.type - Should be "function"
 * @param {Object} tool.function - Function definition
 * @param {string} tool.function.name - Tool name
 * @param {string} tool.function.description - Tool description
 * @param {Object} tool.function.parameters - JSON Schema parameters
 * @returns {string} XML documentation for this tool
 */
function generateToolDocumentation(tool) {
  const { name, description, parameters } = tool.function;

  if (!name) {
    return null;
  }

  let doc = `## ${name}\n`;

  // Add description
  if (description) {
    doc += `Description: ${description}\n`;
  }

  // Add parameters documentation
  if (parameters && parameters.properties) {
    const paramDocs = convertParametersToXML(parameters);
    if (paramDocs) {
      doc += `Parameters:\n${paramDocs}\n`;
    }
  } else {
    doc += 'Parameters: None\n';
  }

  // Add usage example
  doc += '\nUsage:\n';
  doc += generateUsageExample(name, parameters);

  return doc;
}

/**
 * Convert JSON Schema parameters to XML parameter documentation
 *
 * @param {Object} parameters - JSON Schema parameters object
 * @param {Object} parameters.properties - Parameter properties
 * @param {Array} parameters.required - Required parameter names
 * @returns {string} Parameter documentation in markdown format
 */
function convertParametersToXML(parameters) {
  if (!parameters || !parameters.properties) {
    return '';
  }

  const { properties, required = [] } = parameters;
  const paramLines = [];

  for (const [paramName, paramDef] of Object.entries(properties)) {
    const isRequired = required.includes(paramName);
    const requiredText = isRequired ? '(required)' : '(optional)';
    const type = paramDef.type || 'any';
    const desc = paramDef.description || 'No description';

    paramLines.push(`- ${paramName}: ${requiredText} ${type} - ${desc}`);
  }

  return paramLines.join('\n');
}

/**
 * Generate usage example showing XML format
 *
 * @param {string} toolName - Tool name (becomes XML tag)
 * @param {Object} parameters - JSON Schema parameters
 * @returns {string} Usage example with XML tags
 */
function generateUsageExample(toolName, parameters) {
  let example = `<${toolName}>\n`;

  if (parameters && parameters.properties) {
    const { properties } = parameters;

    for (const [paramName, paramDef] of Object.entries(properties)) {
      const exampleValue = getExampleValue(paramDef);
      example += `<${paramName}>${exampleValue}</${paramName}>\n`;
    }
  }

  example += `</${toolName}>`;

  return example;
}

/**
 * Generate example value based on parameter type
 *
 * @param {Object} paramDef - Parameter definition from JSON Schema
 * @param {string} paramDef.type - Parameter type
 * @param {*} paramDef.default - Default value if provided
 * @returns {string} Example value
 */
function getExampleValue(paramDef) {
  const { type, default: defaultValue } = paramDef;

  // Use default if provided
  if (defaultValue !== undefined) {
    return String(defaultValue);
  }

  // Generate example based on type
  switch (type) {
    case 'string':
      return 'example_value';
    case 'number':
    case 'integer':
      return '100';
    case 'boolean':
      return 'true';
    case 'array':
      return '[]';
    case 'object':
      return '{}';
    default:
      return 'value';
  }
}

/**
 * Validate tool structure
 *
 * @param {Object} tool - Tool to validate
 * @returns {boolean} True if valid
 */
function validateTool(tool) {
  if (!tool || typeof tool !== 'object') {
    return false;
  }

  if (!tool.function || typeof tool.function !== 'object') {
    return false;
  }

  if (!tool.function.name || typeof tool.function.name !== 'string') {
    return false;
  }

  return true;
}

/**
 * Get tool names from tools array
 * Utility function for debugging and validation
 *
 * @param {Array} tools - OpenAI tools array
 * @returns {string[]} Array of tool names
 */
function getToolNames(tools) {
  if (!Array.isArray(tools)) {
    return [];
  }

  return tools
    .filter(tool => tool.function && tool.function.name)
    .map(tool => tool.function.name);
}

/**
 * Check if tools array is valid
 *
 * @param {Array} tools - Tools array to check
 * @returns {boolean} True if valid
 */
function hasValidTools(tools) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return false;
  }

  return tools.some(tool => validateTool(tool));
}

module.exports = {
  transformToolsToXML,
  generateToolDocumentation,
  convertParametersToXML,
  generateUsageExample,
  getExampleValue,
  validateTool,
  getToolNames,
  hasValidTools
};
