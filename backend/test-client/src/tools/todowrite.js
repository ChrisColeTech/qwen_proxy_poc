import { z } from 'zod'

// In-memory todo storage (for test client only)
const todoStore = new Map()

// Todo item schema matching OpenCode
const TodoInfo = z.object({
  content: z.string().describe('Brief description of the task'),
  status: z.string().describe('Current status of the task: pending, in_progress, completed, cancelled'),
  priority: z.string().describe('Priority level of the task: high, medium, low'),
  id: z.string().describe('Unique identifier for the todo item')
})

// Zod schema matching OpenCode's todowrite tool
export const schema = z.object({
  todos: z.array(TodoInfo).describe('The updated todo list')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'todowrite',
    description: `Use this tool to create and manage a structured task list for your current coding session. This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.

When to Use This Tool:
1. Complex multi-step tasks - When a task requires 3 or more distinct steps or actions
2. Non-trivial and complex tasks - Tasks that require careful planning or multiple operations
3. User explicitly requests todo list - When the user directly asks you to use the todo list
4. User provides multiple tasks - When users provide a list of things to be done (numbered or comma-separated)

Task States:
- pending: Task not yet started
- in_progress: Currently working on (limit to ONE task at a time)
- completed: Task finished successfully
- cancelled: Task no longer needed

Priority Levels:
- high: Critical tasks that must be done
- medium: Important tasks
- low: Nice to have tasks`,
    parameters: {
      type: 'object',
      properties: {
        todos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Brief description of the task'
              },
              status: {
                type: 'string',
                description: 'Current status of the task: pending, in_progress, completed, cancelled'
              },
              priority: {
                type: 'string',
                description: 'Priority level of the task: high, medium, low'
              },
              id: {
                type: 'string',
                description: 'Unique identifier for the todo item'
              }
            },
            required: ['content', 'status', 'priority', 'id']
          },
          description: 'The updated todo list'
        }
      },
      required: ['todos'],
      additionalProperties: false
    }
  }
}

// Client-side execution function
export async function execute(args, context = {}) {
  const validated = schema.parse(args)
  const { todos } = validated

  // Store todos (in test client, we use sessionID from context or 'default')
  const sessionID = context.sessionID || 'default'
  todoStore.set(sessionID, todos)

  const activeCount = todos.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length
  return `Updated todo list: ${activeCount} active tasks, ${todos.length} total`
}

// Export function to get todos (used by todoread)
export function getTodos(sessionID = 'default') {
  return todoStore.get(sessionID) || []
}
