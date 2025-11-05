import { z } from 'zod'
import { glob } from 'glob'
import { stat } from 'fs/promises'
import { resolve } from 'path'

// Zod schema matching OpenCode's glob tool
export const schema = z.object({
  pattern: z.string().describe('The glob pattern to match files against'),
  path: z.string().optional().describe(
    'The directory to search in. If not specified, the current working directory will be used. ' +
    'IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - ' +
    'simply omit it for the default behavior. Must be a valid directory path if provided.'
  )
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'glob',
    description: `Fast file pattern matching tool that works with any codebase size.

Usage:
- Supports glob patterns like "**/*.js" or "src/**/*.ts"
- Returns matching file paths sorted by modification time
- Use this tool when you need to find files by name patterns`,
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The glob pattern to match files against'
        },
        path: {
          type: 'string',
          description: 'The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.'
        }
      },
      required: ['pattern'],
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args) {
  const validated = schema.parse(args)
  const { pattern, path: searchPath = process.cwd() } = validated

  try {
    // Resolve to absolute path
    const absolutePath = resolve(searchPath)

    // Find files matching the pattern
    const files = await glob(pattern, {
      cwd: absolutePath,
      absolute: true,
      nodir: true, // Only files, no directories
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'], // Common ignores
      maxDepth: 20 // Reasonable depth limit
    })

    // Get modification times and sort
    const limit = 100
    const filesWithStats = await Promise.all(
      files.slice(0, limit).map(async (file) => {
        try {
          const stats = await stat(file)
          return {
            path: file,
            mtime: stats.mtime.getTime()
          }
        } catch {
          return {
            path: file,
            mtime: 0
          }
        }
      })
    )

    // Sort by modification time (newest first)
    filesWithStats.sort((a, b) => b.mtime - a.mtime)

    if (filesWithStats.length === 0) {
      return 'No files found'
    }

    let output = filesWithStats.map(f => f.path).join('\n')

    if (files.length > limit) {
      output += '\n\n(Results are truncated. Consider using a more specific path or pattern.)'
    }

    return output
  } catch (error) {
    return `Error: ${error.message}`
  }
}
