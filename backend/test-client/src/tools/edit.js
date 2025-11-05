import { z } from 'zod'
import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

// Zod schema matching OpenCode's edit tool
export const schema = z.object({
  filePath: z.string().describe('The absolute path to the file to modify'),
  oldString: z.string().describe('The text to replace'),
  newString: z.string().describe('The text to replace it with (must be different from oldString)'),
  replaceAll: z.boolean().optional().describe('Replace all occurrences of oldString (default false)')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'edit',
    description: `Performs exact string replacements in files.

Usage:
- You must use your Read tool at least once in the conversation before editing
- When editing text from Read tool output, ensure you preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix
- ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required
- Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked
- The edit will FAIL if oldString is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use replaceAll to change every instance of oldString
- Use replaceAll for replacing and renaming strings across the file`,
    parameters: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'The absolute path to the file to modify'
        },
        oldString: {
          type: 'string',
          description: 'The text to replace'
        },
        newString: {
          type: 'string',
          description: 'The text to replace it with (must be different from oldString)'
        },
        replaceAll: {
          type: 'boolean',
          description: 'Replace all occurrences of oldString (default false)'
        }
      },
      required: ['filePath', 'oldString', 'newString'],
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args) {
  const validated = schema.parse(args)
  const { filePath, oldString, newString, replaceAll = false } = validated

  if (oldString === newString) {
    return 'Error: oldString and newString must be different'
  }

  try {
    // Resolve to absolute path
    const absolutePath = resolve(filePath)

    // Read the file
    const content = await readFile(absolutePath, 'utf-8')

    // Check if oldString exists
    if (!content.includes(oldString)) {
      return `Error: oldString not found in file: ${filePath}`
    }

    // Replace content
    let newContent
    if (replaceAll) {
      // Replace all occurrences
      newContent = content.replaceAll(oldString, newString)
    } else {
      // Check if unique
      const firstIndex = content.indexOf(oldString)
      const lastIndex = content.lastIndexOf(oldString)

      if (firstIndex !== lastIndex) {
        return 'Error: Found multiple matches for oldString. Provide more surrounding lines in oldString to identify the correct match, or use replaceAll: true'
      }

      // Replace single occurrence
      newContent = content.substring(0, firstIndex) + newString + content.substring(firstIndex + oldString.length)
    }

    // Write the file
    await writeFile(absolutePath, newContent, 'utf-8')

    // Count changes
    const occurrences = replaceAll ? (content.split(oldString).length - 1) : 1
    return `Successfully replaced ${occurrences} occurrence(s) in ${filePath}`
  } catch (error) {
    if (error.code === 'ENOENT') {
      return `Error: File not found: ${filePath}`
    }
    if (error.code === 'EACCES') {
      return `Error: Permission denied: ${filePath}`
    }
    return `Error: ${error.message}`
  }
}
