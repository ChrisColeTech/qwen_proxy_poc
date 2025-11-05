/**
 * HTTP Client Module
 * Uses AI SDK to send requests in OpenAI format, matching OpenCode's implementation
 */

import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText, stepCountIs } from 'ai'
import { config, getBaseURL, getAPIKey } from '../config.js'
import { logger } from '../utils/logger.js'

/**
 * Create OpenAI provider configured for our proxy
 * This matches OpenCode's provider setup in session/prompt.ts
 *
 * IMPORTANT: The AI SDK automatically appends /v1 to the baseURL,
 * so we configure it with just the base URL (no /v1 suffix)
 */
const provider = createOpenAI({
  baseURL: `${getBaseURL()}/v1`,
  apiKey: getAPIKey() || 'dummy-key',
})

/**
 * Send non-streaming request
 * Matches OpenCode's generateText usage
 *
 * @param {Object} params - Request parameters
 * @param {Array} params.messages - Array of message objects
 * @param {Object} params.tools - Tool definitions object (optional)
 * @returns {Promise<Object>} - Generation result
 */
export async function sendRequest({ messages, tools }) {
  logger.request('POST', `${getBaseURL()}/v1/chat/completions`, {
    model: config.model.name,
    messagesCount: messages.length,
    toolsCount: tools ? Object.keys(tools).length : 0,
  })

  try {
    const result = await generateText({
      model: provider.chat(config.model.name),
      messages,
      tools,
      temperature: config.model.temperature,
      topP: config.model.topP,
      stopWhen: stepCountIs(5), // Let AI SDK handle multi-turn tool calling (max 5 steps)
    })

    logger.response(200, {
      text: result.text?.substring(0, 50) + '...',
      steps: result.steps?.length || 0,
      finishReason: result.finishReason,
    })

    return result
  } catch (error) {
    logger.error('Request failed', error)
    throw error
  }
}

/**
 * Send streaming request
 * Matches OpenCode's streamText usage
 *
 * @param {Object} params - Request parameters
 * @param {Array} params.messages - Array of message objects
 * @param {Object} params.tools - Tool definitions object (optional)
 * @param {Function} params.onChunk - Callback for each text chunk (optional)
 * @param {Function} params.onToolCall - Callback for tool calls (optional)
 * @returns {Promise<Object>} - Stream result
 */
export async function sendStreamingRequest({ messages, tools, onChunk, onToolCall }) {
  logger.request('POST', `${getBaseURL()}/v1/chat/completions`, {
    model: config.model.name,
    messagesCount: messages.length,
    toolsCount: tools ? Object.keys(tools).length : 0,
    stream: true,
  })

  try {
    const result = await streamText({
      model: provider.chat(config.model.name),
      messages,
      tools,
      temperature: config.model.temperature,
      topP: config.model.topP,
    })

    // Process stream chunks
    let fullText = ''
    const toolCalls = []

    for await (const chunk of result.fullStream) {
      logger.debug('Stream chunk', { type: chunk.type })

      switch (chunk.type) {
        case 'text-delta':
          fullText += chunk.textDelta
          if (onChunk) {
            onChunk(chunk.textDelta)
          }
          break

        case 'tool-call':
          toolCalls.push({
            id: chunk.toolCallId,
            type: 'function',
            function: {
              name: chunk.toolName,
              arguments: JSON.stringify(chunk.args),
            },
          })
          if (onToolCall) {
            onToolCall(chunk)
          }
          break

        case 'finish':
          logger.debug('Stream finished', { finishReason: chunk.finishReason })
          break

        case 'error':
          logger.error('Stream error', chunk.error)
          throw chunk.error
      }
    }

    const finishReason = await result.finishReason

    logger.response(200, {
      text: fullText,
      toolCalls: toolCalls.length,
      finishReason,
    })

    return {
      text: fullText,
      toolCalls,
      finishReason,
      usage: await result.usage,
    }
  } catch (error) {
    logger.error('Streaming request failed', error)
    throw error
  }
}

/**
 * Create a simple message array for testing
 * Helper function for quick testing
 *
 * @param {string} userMessage - User message content
 * @param {string} systemPrompt - System prompt (optional)
 * @returns {Array} - Array of message objects
 */
export function createSimpleMessages(userMessage, systemPrompt = null) {
  const messages = []

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    })
  }

  messages.push({
    role: 'user',
    content: userMessage,
  })

  return messages
}

/**
 * Health check - verify the proxy is accessible
 *
 * @returns {Promise<boolean>} - True if proxy is accessible
 */
export async function healthCheck() {
  try {
    const baseURL = getBaseURL()
    logger.debug('Health check', { baseURL })

    // Try a simple request
    const messages = createSimpleMessages('Hello')
    await sendRequest({ messages })

    logger.info('Health check passed')
    return true
  } catch (error) {
    logger.error('Health check failed', error)
    return false
  }
}
