# API Server

Management API server for the Qwen Provider Router. This server provides REST endpoints for managing providers, models, sessions, requests, responses, and credentials at `/api/*` (not `/api/v1/*`).

## Features

- RESTful API endpoints for provider management
- Database access to shared SQLite database with provider-router
- Request/response logging and performance tracking
- CORS support for cross-origin requests
- Comprehensive error handling
- Health check endpoint

## Installation

```bash
cd backend/api-server
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configuration options:
- `API_PORT`: Server port (default: 3002)
- `API_HOST`: Server host (default: 0.0.0.0)
- `LOG_LEVEL`: Logging level - debug, info, warn, error (default: info)
- `LOG_REQUESTS`: Enable request logging (default: true)
- `LOG_RESPONSES`: Enable response logging (default: true)

## Running

### Development

```bash
npm run dev
```

This will start the server with file watching enabled.

### Production

```bash
npm start
```

## API Endpoints

All endpoints are prefixed with `/api` (not `/api/v1`).

### Health Check

```
GET /api/health
```

Returns server status and timestamp.

### Providers

```
GET    /api/providers              - List all providers
GET    /api/providers/:id          - Get provider details
POST   /api/providers              - Create new provider
PUT    /api/providers/:id          - Update provider
DELETE /api/providers/:id          - Delete provider
POST   /api/providers/:id/enable   - Enable provider
POST   /api/providers/:id/disable  - Disable provider
POST   /api/providers/:id/test     - Test provider connection
POST   /api/providers/:id/reload   - Reload provider
```

### Provider Configuration

```
GET    /api/providers/:id/config           - Get provider config
PUT    /api/providers/:id/config           - Update config (bulk)
PATCH  /api/providers/:id/config/:key      - Update single config value
DELETE /api/providers/:id/config/:key      - Delete config value
```

### Provider Models

```
GET    /api/providers/:id/models                      - Get linked models
POST   /api/providers/:id/models                      - Link model
DELETE /api/providers/:id/models/:modelId             - Unlink model
PUT    /api/providers/:id/models/:modelId/default     - Set default model
```

### Models

```
GET    /api/models          - List all models
GET    /api/models/:id      - Get model details
POST   /api/models          - Create new model
PUT    /api/models/:id      - Update model
DELETE /api/models/:id      - Delete model
```

### Sessions

```
GET    /api/sessions                      - List sessions
GET    /api/sessions/:id                  - Get session details
GET    /api/sessions/:sessionId/requests  - Get session requests
DELETE /api/sessions/:id                  - Delete session
DELETE /api/sessions                      - Cleanup expired sessions
```

### Requests

```
GET    /api/requests    - List requests
GET    /api/requests/:id - Get request details
DELETE /api/requests/:id - Delete request
```

### Responses

```
GET    /api/responses                   - List responses
GET    /api/responses/stats             - Get response statistics
GET    /api/responses/:id               - Get response details
GET    /api/responses/request/:requestId - Get response for request
GET    /api/responses/session/:sessionId - Get responses by session
DELETE /api/responses/:id                - Delete response
```

### Activity

```
GET /api/activity/recent - Get recent activity
GET /api/activity/stats  - Get activity statistics
```

### Settings

```
GET    /api/settings           - Get all settings
GET    /api/settings/:key      - Get specific setting
PUT    /api/settings/:key      - Update setting
POST   /api/settings/bulk      - Bulk update settings
DELETE /api/settings/:key      - Delete setting
```

### Qwen Credentials

```
POST   /api/qwen/credentials - Set/update credentials
GET    /api/qwen/credentials - Get credentials status
DELETE /api/qwen/credentials - Delete credentials
```

## Database

The API server connects to the same SQLite database as the provider-router:
- Path: `../provider-router/src/database/qwen_proxy.db`
- The database must be initialized by provider-router first
- Both servers can run simultaneously and share the database

## Architecture

- **Controllers**: Re-export from provider-router to avoid duplication
- **Routes**: Define API endpoints at `/api/*` prefix
- **Middleware**: CORS, request logging, response logging, error handling
- **Database**: Shared connection to provider-router's SQLite database
- **Utils**: Logger utility with configurable levels

## Development

To add new endpoints:

1. Create a new route file in `src/routes/`
2. Create or re-export a controller in `src/controllers/`
3. Mount the route in `src/server.js` at `/api/route-name`

Example:

```javascript
// src/routes/new-feature.js
import express from 'express'
import { handler } from '../controllers/new-feature-controller.js'

const router = express.Router()
router.get('/', handler)
export default router

// src/server.js
import newFeatureRouter from './routes/new-feature.js'
app.use('/api/new-feature', newFeatureRouter)
```

## License

MIT
