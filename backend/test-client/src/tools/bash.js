import { z } from 'zod'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Zod schema matching OpenCode's bash tool
export const schema = z.object({
  command: z.string().describe('The command to execute'),
  timeout: z.number().optional().describe('Optional timeout in milliseconds (up to 600000)'),
  description: z.string().optional().describe(
    "Clear, concise description of what this command does in 5-10 words. Examples:\n" +
    "Input: ls\n" +
    "Output: Lists files in current directory\n\n" +
    "Input: git status\n" +
    "Output: Shows working tree status\n\n" +
    "Input: npm install\n" +
    "Output: Installs package dependencies\n\n" +
    "Input: mkdir foo\n" +
    "Output: Creates directory 'foo'"
  )
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'bash',
    description: `Executes shell commands like ls, git, npm, docker, curl, etc. in a bash terminal.

IMPORTANT: Use this tool when you need to run ANY shell/terminal command including:
- ls, pwd, cd, mkdir, rm, cp, mv (shell commands)
- git status, git commit, git push (git operations)
- npm install, npm start, npm test (npm commands)
- curl, wget (network requests)
- Any other terminal/bash command

DO NOT use this for reading file contents - use the 'read' tool instead.
DO NOT use this for writing files - use the 'write' or 'edit' tools instead.

Usage:
- The command parameter is required (e.g., "ls -la", "git status")
- You can specify an optional timeout in milliseconds (up to 600000ms / 10 minutes)
- It is very helpful if you write a clear, concise description of what this command does in 5-10 words`,
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute'
        },
        timeout: {
          type: 'number',
          description: 'Optional timeout in milliseconds (up to 600000)'
        },
        description: {
          type: 'string',
          description: "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in current directory\n\nInput: git status\nOutput: Shows working tree status\n\nInput: npm install\nOutput: Installs package dependencies\n\nInput: mkdir foo\nOutput: Creates directory 'foo'"
        }
      },
      required: ['command'],
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args) {
  const validated = schema.parse(args)
  const { command, timeout = 120000 } = validated

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    })
    const output = stdout || stderr
    return output || '(Command completed successfully with no output)'
  } catch (error) {
    // Check if it's a timeout error
    if (error.killed && error.signal === 'SIGTERM') {
      return `Error: Command timed out after ${timeout}ms`
    }
    // Check if command failed with exit code
    if (error.code) {
      const output = error.stdout || error.stderr
      return output || `Error: Command failed with exit code ${error.code}`
    }
    return `Error: ${error.message}`
  }
}
