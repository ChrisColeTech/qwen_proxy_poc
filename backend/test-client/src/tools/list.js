import { z } from 'zod'
import { readdir } from 'fs/promises'
import { resolve, join, basename, dirname, relative } from 'path'

// Zod schema matching OpenCode's list tool
export const schema = z.object({
  path: z.string().optional().describe('The absolute path to the directory to list (must be absolute, not relative)'),
  ignore: z.array(z.string()).optional().describe('List of glob patterns to ignore')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'list',
    description: `Shows a formatted tree view of directory contents with automatic filtering of build/dependency folders.

IMPORTANT: This is a SPECIALIZED tool for displaying directory structures in a clean tree format.
- DO NOT use this for simple file listing - use the 'bash' tool with 'ls' command instead
- Only use this when you need a nicely formatted tree view of a directory structure
- Automatically filters out node_modules, .git, dist, build, etc.

Usage:
- Lists files and directories in a tree structure
- Automatically ignores common build/dependency directories
- Use the ignore parameter to add custom patterns to ignore`,
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The absolute path to the directory to list (must be absolute, not relative)'
        },
        ignore: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'List of glob patterns to ignore'
        }
      },
      additionalProperties: false
    }
  }
}

const DEFAULT_IGNORE = [
  'node_modules',
  '__pycache__',
  '.git',
  'dist',
  'build',
  'target',
  'vendor',
  'bin',
  'obj',
  '.idea',
  '.vscode',
  '.zig-cache',
  'zig-out',
  '.coverage',
  'coverage',
  'tmp',
  'temp',
  '.cache',
  'cache',
  'logs',
  '.venv',
  'venv',
  'env'
]

// Client-side execution function
export async function execute(args) {
  const validated = schema.parse(args)
  const { path: searchPath = process.cwd(), ignore = [] } = validated

  try {
    // Resolve to absolute path
    const absolutePath = resolve(searchPath)

    // Combine default and custom ignore patterns
    const ignorePatterns = [...DEFAULT_IGNORE, ...ignore]

    // Build directory tree
    const tree = await buildTree(absolutePath, ignorePatterns, 0, 100)

    if (tree.files.length === 0 && tree.dirs.length === 0) {
      return `${absolutePath}/\n(Empty directory)`
    }

    const output = [`${absolutePath}/`, renderTree(tree, 1)].join('\n')

    if (tree.truncated) {
      return output + '\n\n(Results truncated. Consider using a more specific path.)'
    }

    return output
  } catch (error) {
    if (error.code === 'ENOENT') {
      return `Error: Directory not found: ${searchPath}`
    }
    if (error.code === 'EACCES') {
      return `Error: Permission denied: ${searchPath}`
    }
    if (error.code === 'ENOTDIR') {
      return `Error: Path is not a directory: ${searchPath}`
    }
    return `Error: ${error.message}`
  }
}

async function buildTree(dirPath, ignorePatterns, depth, limit) {
  const result = {
    dirs: [],
    files: [],
    truncated: false
  }

  if (depth > 10) return result // Max depth limit

  try {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      // Check if should ignore
      if (ignorePatterns.some(pattern => entry.name.includes(pattern))) {
        continue
      }

      if (entry.isDirectory()) {
        const subTree = await buildTree(join(dirPath, entry.name), ignorePatterns, depth + 1, limit)
        result.dirs.push({
          name: entry.name,
          tree: subTree
        })
      } else if (entry.isFile()) {
        result.files.push(entry.name)
      }

      // Check limit
      const totalCount = result.files.length + result.dirs.length
      if (totalCount >= limit) {
        result.truncated = true
        break
      }
    }

    // Sort
    result.dirs.sort((a, b) => a.name.localeCompare(b.name))
    result.files.sort()

    return result
  } catch (error) {
    return result
  }
}

function renderTree(tree, depth) {
  const indent = '  '.repeat(depth)
  const lines = []

  // Render subdirectories
  for (const dir of tree.dirs) {
    lines.push(`${indent}${dir.name}/`)
    const subLines = renderTree(dir.tree, depth + 1)
    if (subLines) {
      lines.push(subLines)
    }
  }

  // Render files
  for (const file of tree.files) {
    lines.push(`${indent}${file}`)
  }

  return lines.join('\n')
}
