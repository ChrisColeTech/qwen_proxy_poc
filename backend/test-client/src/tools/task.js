import { z } from 'zod'

// Zod schema matching OpenCode's task tool
export const schema = z.object({
  description: z.string().describe('A short (3-5 words) description of the task'),
  prompt: z.string().describe('The task for the agent to perform'),
  subagent_type: z.string().describe('The type of specialized agent to use for this task')
})

// OpenAI-compatible tool definition
export const definition = {
  type: 'function',
  function: {
    name: 'task',
    description: `Launch a specialized subagent to perform a specific task.

Available subagents:
- search: Search specialist for complex queries
- code: Code generation and analysis specialist
- debug: Debugging and error analysis specialist
- test: Test writing and validation specialist

Usage:
- Choose the appropriate subagent_type for your task
- Provide a clear prompt describing what the subagent should do
- The subagent will work independently and return results

Note: This is a simulated implementation for the test client.`,
    parameters: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'A short (3-5 words) description of the task'
        },
        prompt: {
          type: 'string',
          description: 'The task for the agent to perform'
        },
        subagent_type: {
          type: 'string',
          description: 'The type of specialized agent to use for this task'
        }
      },
      required: ['description', 'prompt', 'subagent_type'],
      additionalProperties: false
    }
  }
}

// Client-side execution function (simulated)
export async function execute(args) {
  const validated = schema.parse(args)
  const { description, prompt, subagent_type } = validated

  // In a real implementation, this would spawn a sub-agent
  // For the test client, we just simulate it
  return `[SIMULATED] Task "${description}" sent to ${subagent_type} subagent.\n\nPrompt: ${prompt}\n\nSubagent result: Task completed successfully (simulated response)`
}
