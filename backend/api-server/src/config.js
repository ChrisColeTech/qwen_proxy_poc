/**
 * API Server Configuration
 * Loads configuration from environment variables
 */

const config = {
  server: {
    port: parseInt(process.env.API_PORT || '3002'),
    host: process.env.API_HOST || 'localhost',
  },
  proxy: {
    qwenProxyPort: parseInt(process.env.QWEN_PROXY_PORT || '3000'),
    providerRouterPort: parseInt(process.env.PROVIDER_ROUTER_PORT || '3001'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logRequests: process.env.LOG_REQUESTS !== 'false',
    logResponses: process.env.LOG_RESPONSES !== 'false',
  },
  database: {
    path: process.env.DATABASE_PATH || '../provider-router/src/database/qwen_proxy.db',
  },
}

export default config
