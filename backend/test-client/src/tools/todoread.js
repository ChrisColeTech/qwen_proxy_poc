import { z } from 'zod'
import { getTodos } from './todowrite.js'

// Zod schema matching OpenCode's todoread tool
export const schema = z.object({})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'todoread',
    description: 'Use this tool to read your todo list',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args, context = {}) {
  const sessionID = context.sessionID || 'default'
  const todos = getTodos(sessionID)

  if (todos.length === 0) {
    return 'No todos found'
  }

  const activeCount = todos.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length

  // Format todos as JSON
  const output = JSON.stringify(todos, null, 2)

  return `Todo list (${activeCount} active, ${todos.length} total):\n\n${output}`
}
