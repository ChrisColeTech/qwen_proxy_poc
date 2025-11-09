const API_BASE_URL = 'http://localhost:3002';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatTestResult {
  success: boolean;
  response?: ChatCompletionResponse;
  error?: string;
  latency?: number;
}

class ChatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async testChat(
    model: string = 'qwen-turbo',
    message: string = 'Hello! Can you respond with a brief greeting?'
  ): Promise<ChatTestResult> {
    const startTime = Date.now();

    try {
      const request: ChatCompletionRequest = {
        model,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 100,
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          latency,
        };
      }

      const data: ChatCompletionResponse = await response.json();

      return {
        success: true,
        response: data,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        latency,
      };
    }
  }

  async streamChat(
    model: string,
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const request: ChatCompletionRequest = {
        model,
        messages,
        stream: true,
      };

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        onError(`HTTP ${response.status}: ${errorText}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body reader available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') {
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}

export const chatService = new ChatService();
