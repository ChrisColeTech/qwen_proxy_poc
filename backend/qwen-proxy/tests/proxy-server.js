require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Session storage: maps conversation IDs to Qwen sessions
const sessions = new Map();

// Qwen API configuration
const QWEN_BASE_URL = 'https://chat.qwen.ai';
const QWEN_COOKIES = process.env.QWEN_COOKIES;
const QWEN_TOKEN = process.env.QWEN_TOKEN;

// Helper to create a new Qwen chat
async function createQwenChat() {
  const response = await axios.post(
    `${QWEN_BASE_URL}/api/v2/chats/new`,
    {
      title: 'API Chat',
      models: ['qwen3-max'],
      chat_mode: 'guest',
      chat_type: 't2t',
      timestamp: Date.now()
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': QWEN_COOKIES,
        'bx-umidtoken': QWEN_TOKEN,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  );

  return response.data.data.id;
}

// Helper to send message to Qwen
async function sendToQwen(chatId, parentId, message) {
  const messageId = crypto.randomUUID();

  const payload = {
    stream: true,  // Enable streaming
    incremental_output: true,
    chat_id: chatId,
    chat_mode: 'guest',
    model: 'qwen3-max',
    parent_id: parentId,
    messages: [
      {
        fid: messageId,
        parentId: parentId,
        childrenIds: [],
        role: message.role,
        content: message.content,
        user_action: 'chat',
        files: [],
        timestamp: Math.floor(Date.now() / 1000),
        models: ['qwen3-max'],
        chat_type: 't2t',
        feature_config: {
          thinking_enabled: false,
          output_schema: 'phase'
        },
        extra: {
          meta: {
            subChatType: 't2t'
          }
        },
        sub_chat_type: 't2t',
        parent_id: parentId
      }
    ],
    timestamp: Math.floor(Date.now() / 1000)
  };

  return axios.post(
    `${QWEN_BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': QWEN_COOKIES,
        'bx-umidtoken': QWEN_TOKEN,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      responseType: 'stream'
    }
  );
}

// OpenAI-compatible endpoint
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const { messages, stream = false } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get conversation ID (for session management)
    // Roocode doesn't send any conversation tracking ID, so we need to infer it
    // Strategy: Hash the first USER message to identify unique conversations
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) {
      return res.status(400).json({ error: 'No user message found in conversation' });
    }

    const conversationId = crypto.createHash('md5')
      .update(JSON.stringify({
        role: firstUserMessage.role,
        content: firstUserMessage.content
      }))
      .digest('hex');

    // Get or create session
    let session = sessions.get(conversationId);
    if (!session) {
      const chatId = await createQwenChat();
      session = { chat_id: chatId, parent_id: null };
      sessions.set(conversationId, session);
    }

    // Extract last message (Qwen only needs the new message)
    const lastMessage = messages[messages.length - 1];

    // Send to Qwen
    const qwenResponse = await sendToQwen(session.chat_id, session.parent_id, lastMessage);

    if (stream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let accumulatedContent = '';
      let newParentId = null;
      let inputTokens = 0;
      let outputTokens = 0;

      // Process Qwen's SSE stream
      qwenResponse.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const data = JSON.parse(dataStr);

              // Extract parent_id from response
              if (data.parent_id) {
                newParentId = data.parent_id;
              }

              // Extract token usage
              if (data.usage) {
                inputTokens = data.usage.input_tokens || 0;
                outputTokens = data.usage.output_tokens || 0;
              }

              // Extract content delta
              if (data.choices && data.choices[0] && data.choices[0].delta) {
                const delta = data.choices[0].delta;
                if (delta.content) {
                  accumulatedContent += delta.content;

                  // Send OpenAI-compatible SSE chunk
                  const openAIChunk = {
                    id: crypto.randomUUID(),
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: 'qwen3-max',
                    choices: [
                      {
                        index: 0,
                        delta: {
                          content: delta.content
                        },
                        finish_reason: null
                      }
                    ]
                  };

                  res.write(`data: ${JSON.stringify(openAIChunk)}\n\n`);
                }
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      });

      qwenResponse.data.on('end', () => {
        // Update session with new parent_id
        if (newParentId) {
          session.parent_id = newParentId;
        }

        // Send final chunk with finish_reason
        const finalChunk = {
          id: crypto.randomUUID(),
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'qwen3-max',
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'stop'
            }
          ]
        };

        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);

        // Send usage data
        if (inputTokens > 0 || outputTokens > 0) {
          const usageChunk = {
            id: crypto.randomUUID(),
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'qwen3-max',
            choices: [],
            usage: {
              prompt_tokens: inputTokens,
              completion_tokens: outputTokens,
              total_tokens: inputTokens + outputTokens
            }
          };
          res.write(`data: ${JSON.stringify(usageChunk)}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      });

      qwenResponse.data.on('error', (error) => {
        console.error('Stream error:', error);
        res.end();
      });

    } else {
      // Non-streaming response
      let fullContent = '';
      let newParentId = null;
      let inputTokens = 0;
      let outputTokens = 0;

      qwenResponse.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const data = JSON.parse(dataStr);

              if (data.parent_id) {
                newParentId = data.parent_id;
              }

              if (data.usage) {
                inputTokens = data.usage.input_tokens || 0;
                outputTokens = data.usage.output_tokens || 0;
              }

              if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                fullContent += data.choices[0].delta.content;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      });

      qwenResponse.data.on('end', () => {
        // Update session
        if (newParentId) {
          session.parent_id = newParentId;
        }

        // Send OpenAI-compatible response
        res.json({
          id: crypto.randomUUID(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'qwen3-max',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: fullContent
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: inputTokens,
            completion_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens
          }
        });
      });
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({
      error: {
        message: error.response?.data?.message || error.message,
        type: 'server_error'
      }
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

// Export for testing
module.exports = app;

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Qwen proxy server listening on port ${PORT}`);
    console.log(`OpenAI-compatible endpoint: http://localhost:${PORT}/v1/chat/completions`);
  });
}
