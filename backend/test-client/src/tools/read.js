import { z } from 'zod'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

// Zod schema matching OpenCode's read tool
export const schema = z.object({
  filePath: z.string().describe('The path to the file to read'),
  offset: z.coerce.number().optional().describe('The line number to start reading from (0-based)'),
  limit: z.coerce.number().optional().describe('The number of lines to read (defaults to 2000)')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'read',
    description: `Reads a file from the local filesystem. You can access any file directly by using this tool.

Usage:
- The filePath parameter must be an absolute path, not a relative path
- By default, it reads up to 2000 lines starting from the beginning of the file
- You can optionally specify a line offset and limit (especially handy for long files)
- Any lines longer than 2000 characters will be truncated
- Results are returned using cat -n format, with line numbers starting at 1`,
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'The path to the file to read'
        },
        offset: {
          type: 'number',
          description: 'The line number to start reading from (0-based)'
        },
        limit: {
          type: 'number',
          description: 'The number of lines to read (defaults to 2000)'
        }
      },
      required: ['filePath'],
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args) {
  const validated = schema.parse(args)
  const { filePath, offset = 0, limit = 2000 } = validated

  try {
    // Resolve to absolute path
    const absolutePath = resolve(filePath)

    // Read the file
    const content = await readFile(absolutePath, 'utf-8')
    const lines = content.split('\n')

    // Apply offset and limit
    const selectedLines = lines.slice(offset, offset + limit)

    // Format with line numbers like OpenCode does
    const formatted = selectedLines.map((line, idx) => {
      const lineNum = (offset + idx + 1).toString().padStart(5, '0')
      // Truncate long lines
      const truncated = line.length > 2000 ? line.substring(0, 2000) + '...' : line
      return `${lineNum}| ${truncated}`
    }).join('\n')

    let output = '<file>\n' + formatted

    // Add note if file has more lines
    if (lines.length > offset + selectedLines.length) {
      output += `\n\n(File has more lines. Use 'offset' parameter to read beyond line ${offset + selectedLines.length})`
    }

    output += '\n</file>'

    return output
  } catch (error) {
    if (error.code === 'ENOENT') {
      return `Error: File not found: ${filePath}`
    }
    if (error.code === 'EISDIR') {
      return `Error: Path is a directory, not a file: ${filePath}`
    }
    if (error.code === 'EACCES') {
      return `Error: Permission denied: ${filePath}`
    }
    return `Error: ${error.message}`
  }
}
