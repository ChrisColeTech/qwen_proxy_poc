import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { resolve, dirname } from 'path'

// Zod schema matching OpenCode's write tool
export const schema = z.object({
  filePath: z.string().describe('The absolute path to the file to write (must be absolute, not relative)'),
  content: z.string().describe('The content to write to the file')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'write',
    description: `Writes a file to the local filesystem.

Usage:
- This tool will overwrite the existing file if there is one at the provided path
- The filePath must be an absolute path, not relative
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required
- Only use emojis if the user explicitly requests it. Avoid writing emojis to files unless asked`,
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'The absolute path to the file to write (must be absolute, not relative)'
        },
        content: {
          type: 'string',
          description: 'The content to write to the file'
        }
      },
      required: ['filePath', 'content'],
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args) {
  const validated = schema.parse(args)
  const { filePath, content } = validated

  try {
    // Resolve to absolute path
    const absolutePath = resolve(filePath)

    // Ensure directory exists
    const dir = dirname(absolutePath)
    await mkdir(dir, { recursive: true })

    // Write the file
    await writeFile(absolutePath, content, 'utf-8')

    return `File written successfully: ${absolutePath}`
  } catch (error) {
    if (error.code === 'EACCES') {
      return `Error: Permission denied: ${filePath}`
    }
    if (error.code === 'ENOSPC') {
      return `Error: No space left on device`
    }
    return `Error: ${error.message}`
  }
}
