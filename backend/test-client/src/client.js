/**
 * TestClient - Main Test Client Class
 *
 * Manages multi-turn conversations with tool execution
 * This implementation matches OpenCode's conversation flow
 */

import { sendRequest } from './http/client.js'
import { getSystemMessage } from './prompts/loader.js'
import { getAllTools, executeTool } from './tools/index.js'
import { logger } from './utils/logger.js'

export class TestClient {
  constructor(options = {}) {
    this.messages = []
    this.options = options
    this.tools = getAllTools()
  }

  /**
   * Send a user message and handle response with tool execution
   *
   * This implements the complete OpenCode conversation flow:
   * 1. Send user message
   * 2. Receive response (may contain tool calls)
   * 3. Execute tools CLIENT-SIDE
   * 4. Send tool results back
   * 5. Receive final response
   * 6. Repeat if more tool calls
   */
  async sendMessage(content) {
    // Add user message
    this.messages.push({
      role: 'user',
      content,
    })

    // Get system message if first message
    if (this.messages.length === 1) {
      const systemMsg = await getSystemMessage()
      this.messages.unshift(systemMsg)
    }

    logger.info(`Sending message: ${content}`)

    // Send request to proxy - AI SDK will handle multi-turn tool calling internally
    const result = await sendRequest({
      messages: this.messages,
      tools: this.tools,
    })

    logger.debug('Response received', {
      textLength: result.text?.length || 0,
      toolCallsCount: result.toolCalls?.length || 0,
      finishReason: result.finishReason,
    })

    // Add final assistant message
    this.messages.push({
      role: 'assistant',
      content: result.text,
    })

    logger.info('Conversation complete')

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      steps: result.steps,
      finishReason: result.finishReason,
    }
  }

  /**
   * Execute a tool call
   *
   * CRITICAL: Tools execute CLIENT-SIDE, not on the proxy
   * This matches OpenCode's architecture
   *
   * AI SDK returns tool calls in this format:
   * {
   *   type: 'tool-call',
   *   toolCallId: '...',
   *   toolName: 'bash',
   *   input: { command: '...' }  // Note: it's 'input', not 'args'!
   * }
   */
  async executeTool(toolCall) {
    // Handle both AI SDK format (toolName/input) and OpenAI format (function.name/arguments)
    const name = toolCall.toolName || toolCall.function?.name
    const args = toolCall.input || toolCall.args || toolCall.function?.arguments

    logger.debug(`Executing tool: ${name}`)

    try {
      // Parse arguments if needed
      const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args

      // Execute tool
      const result = await executeTool(name, parsedArgs)

      // CRITICAL: Handle empty results
      // Bash commands like mkdir, touch, cp return empty strings
      // Transform to explicit success message to prevent confusion
      const finalResult = result === '' || result.trim() === ''
        ? '(Command completed successfully with no output)'
        : result

      logger.tool(name, parsedArgs, finalResult)

      return finalResult
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, error)
      return `Error executing ${name}: ${error.message}`
    }
  }

  /**
   * Clear conversation history
   */
  clear() {
    this.messages = []
    logger.info('Conversation cleared')
  }

  /**
   * Get current conversation messages
   */
  getMessages() {
    return this.messages
  }

  /**
   * Get message count
   */
  getMessageCount() {
    return this.messages.length
  }

  /**
   * Get conversation summary
   */
  getSummary() {
    const userMessages = this.messages.filter(m => m.role === 'user').length
    const assistantMessages = this.messages.filter(m => m.role === 'assistant').length
    const toolMessages = this.messages.filter(m => m.role === 'tool').length

    return {
      total: this.messages.length,
      user: userMessages,
      assistant: assistantMessages,
      tool: toolMessages,
    }
  }
}
