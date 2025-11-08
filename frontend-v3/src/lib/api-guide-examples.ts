export const pythonExample = `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3001/v1",
    api_key="dummy-key"
)

response = client.chat.completions.create(
    model="qwen3-max",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`;

export const nodeExample = `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3001/v1',
  apiKey: 'dummy-key'
});

const completion = await openai.chat.completions.create({
  model: 'qwen3-max',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(completion.choices[0].message.content);`;

export const curlExample = `curl http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer any-key" \\
  -d '{"model": "qwen3-max", "messages": [{"role": "user", "content": "Hello!"}]}'`;

export const healthCheckExample = `# Check proxy is running
curl http://localhost:3001/health

# Test a simple completion
curl http://localhost:3001/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test" \\
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Say hello"}]}'`;

export const commonIssues = [
  { error: 'Connection refused', solution: 'Start proxy via dashboard' },
  { error: '401 Unauthorized', solution: 'Re-authenticate (credentials expired)' },
  { error: 'Empty responses', solution: 'Check Qwen service status' },
];

export const supportedEndpoints = [
  { endpoint: 'POST /v1/chat/completions', description: 'Send chat completion requests. Supports streaming with stream: true' },
  { endpoint: 'GET /v1/models', description: 'List all available models from the active provider' },
  { endpoint: 'GET /health', description: 'Check proxy server health and provider status' },
];
