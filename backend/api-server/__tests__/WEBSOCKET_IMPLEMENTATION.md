# WebSocket Implementation

This document describes the WebSocket support added to the API Server backend.

## Overview

The API Server now includes real-time WebSocket communication using Socket.io v4. This allows clients to receive instant updates when system state changes, without polling REST endpoints.

## Architecture

### Components

1. **Event Emitter Service** (`src/services/event-emitter.js`)
   - Central event broadcasting service
   - Manages Socket.io instance
   - Provides helper methods for emitting typed events

2. **WebSocket Controller** (`src/controllers/websocket-controller.js`)
   - Handles Socket.io connection events
   - Sends initial status on client connection
   - Logs connection/disconnection events

3. **Modified Controllers**
   - All write operations in controllers now emit WebSocket events
   - Read operations do not emit events
   - Events are emitted after successful operations (HTTP 2xx responses)

## WebSocket Events

### `proxy:status`
Emitted when proxy server status changes.

**Triggers:**
- Proxy start/stop operations
- Initial client connection

**Data Structure:**
```json
{
  "status": "running|stopped|partial|starting",
  "providerRouter": {
    "running": boolean,
    "port": number,
    "pid": number|null,
    "uptime": number
  },
  "qwenProxy": {
    "running": boolean,
    "port": number,
    "pid": number|null,
    "uptime": number
  },
  "providers": {
    "items": [...],
    "total": number,
    "enabled": number
  },
  "models": {
    "items": [...],
    "total": number
  },
  "credentials": {
    "valid": boolean,
    "expiresAt": number|null,
    "hasCredentials": boolean,
    "isExpired": boolean
  },
  "message": string,
  "timestamp": string
}
```

### `credentials:updated`
Emitted when Qwen credentials are added, updated, or deleted.

**Triggers:**
- POST /api/qwen/credentials (create/update)
- DELETE /api/qwen/credentials (delete)

**Data Structure:**
```json
{
  "action": "updated|deleted",
  "hasCredentials": boolean,
  "isValid": boolean,
  "isExpired": boolean,
  "expiresAt": number|null,
  "createdAt": number,
  "updatedAt": number,
  "timestamp": string
}
```

### `providers:updated`
Emitted when providers are created, updated, deleted, or status changed.

**Triggers:**
- POST /api/providers (create)
- PUT /api/providers/:id (update)
- DELETE /api/providers/:id (delete)
- POST /api/providers/:id/enable (enable)
- POST /api/providers/:id/disable (disable)
- POST /api/providers/:id/reload (reload)

**Data Structure:**
```json
{
  "action": "created|updated|deleted|enabled|disabled|reloaded",
  "providerId": string|null,
  "items": [...],
  "total": number,
  "enabled": number,
  "timestamp": string
}
```

### `models:updated`
Emitted when models are created, updated, or deleted.

**Triggers:**
- POST /api/models (create)
- PUT /api/models/:id (update)
- DELETE /api/models/:id (delete)

**Data Structure:**
```json
{
  "action": "created|updated|deleted",
  "modelId": string|null,
  "items": [...],
  "total": number,
  "timestamp": string
}
```

## Configuration

### CORS Settings
Socket.io CORS is configured in `src/index.js`:
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})
```

Set `CORS_ORIGIN` environment variable to restrict origins (default: '*').

### Transport Methods
- WebSocket (preferred)
- Long polling (fallback)

## Client Usage

### Node.js Client

```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3002', {
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
  console.log('Connected:', socket.id)
})

socket.on('proxy:status', (data) => {
  console.log('Proxy status changed:', data)
})

socket.on('credentials:updated', (data) => {
  console.log('Credentials updated:', data)
})

socket.on('providers:updated', (data) => {
  console.log('Providers updated:', data)
})

socket.on('models:updated', (data) => {
  console.log('Models updated:', data)
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason)
})
```

### Browser Client

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <script>
    const socket = io('http://localhost:3002');

    socket.on('connect', () => {
      console.log('Connected:', socket.id);
    });

    socket.on('proxy:status', (data) => {
      console.log('Proxy status:', data);
    });

    // Add other event listeners...
  </script>
</body>
</html>
```

### React Client Example

```javascript
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

function useWebSocket() {
  const [status, setStatus] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io('http://localhost:3002')

    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    socket.on('proxy:status', (data) => {
      setStatus(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return { status, connected }
}
```

## Testing

### Test Client (Node.js)
A Node.js test client is included:
```bash
cd backend/api-server
node test-websocket-client.js
```

### Test Client (Browser)
Open `test-websocket.html` in a browser:
```bash
cd backend/api-server
open test-websocket.html  # macOS
# or
xdg-open test-websocket.html  # Linux
# or
start test-websocket.html  # Windows
```

### Manual Testing
1. Start the API server:
   ```bash
   npm start
   ```

2. Connect a WebSocket client (browser or Node.js)

3. Trigger events via REST API:
   ```bash
   # Update credentials
   curl -X POST http://localhost:3002/api/qwen/credentials \
     -H "Content-Type: application/json" \
     -d '{"token":"test","cookies":"test","expiresAt":9999999999}'

   # Enable a provider
   curl -X POST http://localhost:3002/api/providers/qwen-direct-default/enable

   # Create a model
   curl -X POST http://localhost:3002/api/models \
     -H "Content-Type: application/json" \
     -d '{"id":"test-model","name":"Test Model"}'
   ```

4. Observe WebSocket events in the client

## Implementation Details

### Event Flow
1. Client makes REST API request
2. Controller processes request
3. Controller checks response status code
4. If successful (2xx), controller emits event via EventEmitter
5. EventEmitter broadcasts to all connected Socket.io clients
6. Clients receive event with timestamp

### Error Handling
- Controllers check response status before emitting
- Only successful operations (HTTP 2xx) emit events
- Failed operations do not emit events
- WebSocket errors are logged but don't affect REST API

### Connection Management
- Connections are automatically managed by Socket.io
- Reconnection is handled by the client library
- No authentication required (add if needed)
- All connected clients receive all events

### Performance Considerations
- Events are broadcast to all clients (no filtering)
- Event emission happens after response is sent
- Minimal overhead on REST API operations
- Socket.io uses efficient binary protocol for WebSocket

## Files Modified

### New Files
- `src/services/event-emitter.js` - Event emitter service
- `src/controllers/websocket-controller.js` - WebSocket connection handler
- `test-websocket-client.js` - Node.js test client
- `test-websocket.html` - Browser test client
- `WEBSOCKET_IMPLEMENTATION.md` - This documentation

### Modified Files
- `src/index.js` - Added Socket.io server initialization
- `src/routes/proxy-control.js` - Added proxy status event emission
- `src/controllers/qwen-credentials-controller.js` - Added credentials event emission
- `src/controllers/providers-controller.js` - Added providers event emission
- `src/controllers/models-controller.js` - Added models event emission
- `package.json` - Added socket.io dependency

## REST API Compatibility

**Important:** All existing REST API functionality remains unchanged. WebSocket support is purely additive:
- REST endpoints work exactly as before
- No breaking changes to request/response formats
- WebSocket events are optional for clients
- Clients can use REST API without WebSocket

## Future Enhancements

Potential improvements:
1. **Authentication/Authorization** - Add token-based auth for WebSocket connections
2. **Room-based Broadcasting** - Send events only to subscribed clients
3. **Event Filtering** - Allow clients to subscribe to specific event types
4. **Rate Limiting** - Prevent event flooding
5. **Compression** - Enable Socket.io compression for large payloads
6. **Health Monitoring** - Track connected clients and event metrics
7. **Reconnection Status** - Emit status sync on client reconnection
8. **Binary Events** - Use binary format for large data transfers

## Troubleshooting

### Connection Issues
- Ensure API server is running on port 3002
- Check CORS settings if connecting from browser
- Verify firewall allows WebSocket connections
- Try forcing polling transport if WebSocket fails

### No Events Received
- Check if REST API operations are successful
- Verify event listeners are registered before events fire
- Look for errors in server logs
- Confirm EventEmitter is initialized

### Performance Issues
- Monitor number of connected clients
- Check event payload sizes
- Consider implementing event filtering
- Use binary protocol for large data

## Support

For issues or questions:
1. Check server logs for WebSocket errors
2. Enable debug logging: `DEBUG=socket.io:* npm start`
3. Test with included test clients
4. Review Socket.io documentation: https://socket.io/docs/v4/
