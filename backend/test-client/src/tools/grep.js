import { z } from 'zod'
import { glob } from 'glob'
import { readFile, stat } from 'fs/promises'
import { resolve } from 'path'

// Zod schema matching OpenCode's grep tool
export const schema = z.object({
  pattern: z.string().describe('The regex pattern to search for in file contents'),
  path: z.string().optional().describe('The directory to search in. Defaults to the current working directory.'),
  include: z.string().optional().describe('File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'grep',
    description: `A powerful search tool for finding patterns in file contents.

Usage:
- Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+")
- Filter files with include parameter (e.g., "*.js", "**/*.tsx")
- Use this tool for content search across files`,
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The regex pattern to search for in file contents'
        },
        path: {
          type: 'string',
          description: 'The directory to search in. Defaults to the current working directory.'
        },
        include: {
          type: 'string',
          description: 'File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")'
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
  const { pattern, path: searchPath = process.cwd(), include = '**/*' } = validated

  try {
    // Create regex from pattern
    const regex = new RegExp(pattern, 'gm')

    // Resolve to absolute path
    const absolutePath = resolve(searchPath)

    // Find files to search
    const files = await glob(include, {
      cwd: absolutePath,
      absolute: true,
      nodir: true,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '*.min.js', '*.map'],
      maxDepth: 20
    })

    const matches = []
    const limit = 100

    // Search through files
    for (const file of files) {
      try {
        // Get file stats
        const stats = await stat(file)

        // Skip large files (>1MB)
        if (stats.size > 1024 * 1024) continue

        // Read file content
        const content = await readFile(file, 'utf-8')
        const lines = content.split('\n')

        // Search for matches
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            matches.push({
              path: file,
              modTime: stats.mtime.getTime(),
              lineNum: i + 1,
              lineText: lines[i].trim()
            })

            if (matches.length >= limit) break
          }
        }

        if (matches.length >= limit) break
      } catch (error) {
        // Skip files that can't be read (binary, permission, etc)
        continue
      }
    }

    if (matches.length === 0) {
      return 'No files found'
    }

    // Sort by modification time (newest first)
    matches.sort((a, b) => b.modTime - a.modTime)

    const outputLines = [`Found ${matches.length} matches`]

    let currentFile = ''
    for (const match of matches) {
      if (currentFile !== match.path) {
        if (currentFile !== '') {
          outputLines.push('')
        }
        currentFile = match.path
        outputLines.push(`${match.path}:`)
      }
      outputLines.push(`  Line ${match.lineNum}: ${match.lineText}`)
    }

    if (matches.length >= limit) {
      outputLines.push('')
      outputLines.push('(Results are truncated. Consider using a more specific path or pattern.)')
    }

    return outputLines.join('\n')
  } catch (error) {
    if (error instanceof SyntaxError) {
      return `Error: Invalid regex pattern: ${pattern}`
    }
    return `Error: ${error.message}`
  }
}
