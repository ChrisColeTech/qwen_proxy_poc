/**
 * Completions Handler - Legacy /v1/completions endpoint
 * Part of Phase 9: Legacy Completions Endpoint
 *
 * OpenAI's legacy `/v1/completions` endpoint (text completion, not chat).
 * This endpoint is deprecated by OpenAI but included for backward compatibility.
 *
 * DESIGN:
 * - Converts text prompt to chat format
 * - Delegates to internal chat completion logic
 * - Transforms response back to completion format
 *
 * Most modern OpenAI clients use /v1/chat/completions instead,
 * but this endpoint supports older integrations.
 */

const qwenClient = require('../services/qwen-client');
const SessionManager = require('../services/session-manager');
const { transformOpenAIToChatMessages } = require('../transformers/openai-to-qwen-transformer');
const { generateMD5Hash } = require('../utils/hash-utils');

// Session manager for completions
const sessionManager = new SessionManager();
sessionManager.startCleanup();

/**
 * POST /v1/completions
 * Legacy text completion endpoint
 *
 * Request format:
 * {
 *   "model": "qwen3-max",
 *   "prompt": "Say this is a test",
 *   "max_tokens": 100,
 *   "temperature": 0.7,
 *   "stream": false
 * }
 *
 * Response format:
 * {
 *   "id": "cmpl-abc123",
 *   "object": "text_completion",
 *   "created": 1234567890,
 *   "model": "qwen3-max",
 *   "choices": [
 *     {
 *       "text": "This is indeed a test!",
 *       "index": 0,
 *       "finish_reason": "stop",
 *       "logprobs": null
 *     }
 *   ],
 *   "usage": {
 *     "prompt_tokens": 5,
 *     "completion_tokens": 6,
 *     "total_tokens": 11
 *   }
 * }
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function completions(req, res, next) {
  try {
    // 1. Extract text completion request
    const {
      prompt,
      model = 'qwen-max',
      stream = false,
      temperature,
      max_tokens,
      top_p,
      n = 1,
      stop,
      presence_penalty,
      frequency_penalty,
      user,
      ...otherOptions
    } = req.body;

    // 2. Validate request
    if (!prompt) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter: prompt',
          type: 'invalid_request_error',
          param: 'prompt',
          code: 'missing_parameter',
        },
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({
        error: {
          message: 'prompt must be a string',
          type: 'invalid_request_error',
          param: 'prompt',
          code: 'invalid_type',
        },
      });
    }

    // 3. Convert text prompt to chat format
    const chatMessages = [
      { role: 'user', content: prompt }
    ];

    // 4. Generate session ID from prompt
    const sessionId = generateMD5Hash(prompt);

    // 5. Get or create session
    let session = sessionManager.getSession(sessionId);
    if (!session) {
      // Create new Qwen chat
      const chatId = await qwenClient.createChat('API Text Completion');
      session = sessionManager.createSession(sessionId, chatId);
    }

    // 6. Send message to Qwen
    const response = await qwenClient.sendMessage({
      chatId: session.chatId,
      parentId: session.parent_id,
      messages: chatMessages,
      model,
      stream,
      temperature,
      max_tokens,
      top_p,
      stop,
    });

    // 7. Handle streaming vs non-streaming
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullText = '';
      let newParentId = null;
      const completionId = `cmpl-${Date.now()}`;
      const created = Math.floor(Date.now() / 1000);

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const jsonStr = line.substring(5).trim();
              if (jsonStr === '[DONE]') {
                continue;
              }

              const data = JSON.parse(jsonStr);

              // Extract parent_id from first chunk
              if (data['response.created']) {
                newParentId = data['response.created'].parent_id;
                continue;
              }

              // Transform chat chunk to completion chunk
              if (data.choices && data.choices[0]?.delta?.content) {
                const content = data.choices[0].delta.content;
                fullText += content;

                const completionChunk = {
                  id: completionId,
                  object: 'text_completion',
                  created,
                  model,
                  choices: [
                    {
                      text: content,
                      index: 0,
                      finish_reason: null,
                      logprobs: null,
                    },
                  ],
                };

                res.write(`data: ${JSON.stringify(completionChunk)}\n\n`);
              }

              // Check for finish
              if (data.choices && data.choices[0]?.finish_reason) {
                const finalChunk = {
                  id: completionId,
                  object: 'text_completion',
                  created,
                  model,
                  choices: [
                    {
                      text: '',
                      index: 0,
                      finish_reason: data.choices[0].finish_reason,
                      logprobs: null,
                    },
                  ],
                };

                res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
              }
            } catch (parseError) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      });

      response.data.on('end', () => {
        res.write('data: [DONE]\n\n');
        res.end();

        // Update session with new parent_id
        if (newParentId) {
          sessionManager.updateSession(sessionId, newParentId);
        }
      });

      response.data.on('error', (error) => {
        console.error('Stream error:', error);
        res.end();
      });
    } else {
      // Non-streaming response
      const result = response.data;

      // Update session with parent_id
      if (result.parent_id) {
        sessionManager.updateSession(sessionId, result.parent_id);
      }

      // Transform chat completion to text completion format
      const completion = {
        id: `cmpl-${Date.now()}`,
        object: 'text_completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            text: result.choices?.[0]?.message?.content || '',
            index: 0,
            finish_reason: result.choices?.[0]?.finish_reason || 'stop',
            logprobs: null,
          },
        ],
        usage: result.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      res.json(completion);
    }
  } catch (error) {
    console.error('Completions endpoint error:', error);
    next(error);
  }
}

/**
 * Get session manager (for testing/monitoring)
 * @returns {SessionManager} Session manager instance
 */
function getSessionManager() {
  return sessionManager;
}

module.exports = {
  completions,
  getSessionManager,
};
