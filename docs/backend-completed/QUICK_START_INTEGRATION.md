# Quick Start: Integrating Persistence Middleware

## TL;DR

Phase 4 persistence middleware is **complete and ready**. Choose one integration option below.

---

## Option 1: Provider Router Integration (RECOMMENDED)

**File:** `src/router/provider-router.js`

**Add these imports:**
```javascript
import { logRequest, logResponse, logErrorResponse } from '../middleware/persistence-middleware.js'
import SessionManager from '../services/session-manager.js'

const sessionManager = new SessionManager()
```

**Wrap your `route()` method:**
```javascript
async route(request, stream = false) {
  const startTime = Date.now()
  let requestDbId = null
  let sessionId = null

  try {
    // 1. Get session
    const firstUserMessage = request.messages?.find(m => m.role === 'user')?.content || 'default'
    sessionId = sessionManager.generateSessionId(firstUserMessage)
    let session = sessionManager.getSession(sessionId)
    if (!session) {
      session = sessionManager.createSession(sessionId, null)
    }

    // 2. Get provider and transform
    const providerName = SettingsService.getActiveProvider()
    logger.info(`Routing request to provider: ${providerName}`)
    const provider = getProvider(providerName)
    const transformedRequest = provider.transformRequest(request)

    // 3. LOG REQUEST
    const persistence = await logRequest(
      sessionId,
      request,
      transformedRequest,
      request.model || 'default',
      stream
    )
    if (persistence) {
      requestDbId = persistence.requestDbId
    }

    // 4. Send to provider
    const response = await provider.chatCompletion(transformedRequest, stream)

    // 5. Handle response
    if (!stream) {
      const transformedResponse = provider.transformResponse(response)
      const durationMs = Date.now() - startTime

      // LOG RESPONSE
      if (requestDbId) {
        await logResponse(
          requestDbId,
          sessionId,
          response,
          transformedResponse,
          transformedResponse.parent_id || null,
          transformedResponse.usage || null,
          durationMs,
          transformedResponse.choices?.[0]?.finish_reason || 'stop',
          null
        )

        // Update session
        if (transformedResponse.parent_id) {
          sessionManager.updateParentId(sessionId, transformedResponse.parent_id)
        }
      }

      return transformedResponse
    } else {
      return response // Handle streaming in server.js
    }

  } catch (error) {
    const durationMs = Date.now() - startTime
    if (requestDbId) {
      await logErrorResponse(requestDbId, sessionId, error, durationMs)
    }
    throw error
  }
}
```

---

## Option 2: Express Server Integration (SIMPLER)

**File:** `src/server.js`

**Add import:**
```javascript
import { createPersistenceTracker } from './middleware/persistence-middleware.js'
```

**Wrap the `/v1/chat/completions` endpoint:**
```javascript
app.post('/v1/chat/completions', async (req, res, next) => {
  const persistence = createPersistenceTracker(req)

  try {
    const request = req.body
    const stream = request.stream || false

    // Determine session (simplified)
    const sessionId = 'default-session' // Or implement session logic

    // Log request
    await persistence.logRequest(sessionId, request, request, request.model || 'default', stream)

    // Route request
    const response = await providerRouter.route(request, stream)

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      response.pipe(res)

      // Log on stream end
      response.on('end', async () => {
        await persistence.logStreamingResponse({}, null, null, 'stop')
      })
    } else {
      // Log response
      await persistence.logResponse(response, response, response.parent_id, response.usage, 'stop')
      res.json(response)
    }
  } catch (error) {
    await persistence.logError(error)
    next(error)
  }
})
```

---

## Test It

```bash
# Test request
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Hello"}]}'

# Check database
sqlite3 data/provider-router.db "SELECT COUNT(*) FROM requests;"
sqlite3 data/provider-router.db "SELECT COUNT(*) FROM responses;"
```

---

## That's It!

For detailed documentation, see:
- `PERSISTENCE_MIDDLEWARE_INTEGRATION.md` - Full integration guide
- `PHASE_4_COMPLETION_SUMMARY.md` - Implementation details

**Questions?** Check the integration guide or review the middleware source code.
