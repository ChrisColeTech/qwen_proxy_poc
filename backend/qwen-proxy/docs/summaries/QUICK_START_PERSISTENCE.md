# SQLite Persistence - Quick Start Guide

> Get up and running with SQLite persistence in 5 minutes

---

## What is SQLite Persistence?

The Qwen Proxy automatically saves every API request and response to a SQLite database. This lets you:

- **Debug conversations** - View full request/response history
- **Track usage** - Calculate token costs and generate billing reports
- **Monitor performance** - Analyze response times and bottlenecks
- **Audit API calls** - Maintain compliance audit trails

**Zero configuration required** - it just works out of the box!

---

## Quick Start

### 1. Database Auto-Initializes

The database is created automatically when you start the server:

```bash
npm start
```

You'll see:

```
[Database] Initializing database...
[Database] ✓ Sessions table created
[Database] ✓ Requests table created
[Database] ✓ Responses table created
[Database] ✓ Metadata table created
[Database] Database ready: { sessions: 0, requests: 0, responses: 0 }
```

Database location: `/mnt/d/Projects/qwen_proxy/backend/data/qwen_proxy.db`

### 2. Make Some Requests

Every request is automatically persisted:

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

That's it! The request and response are now in the database.

### 3. Query Your Data

**List all sessions:**

```bash
curl http://localhost:3000/v1/sessions | jq .
```

**Get usage statistics:**

```bash
curl http://localhost:3000/v1/responses/stats | jq .
```

**List all requests:**

```bash
curl http://localhost:3000/v1/requests | jq .
```

---

## Essential Queries

### View Recent Sessions

```bash
# Get last 10 sessions
curl "http://localhost:3000/v1/sessions?limit=10" | jq '.data[] | {id, message_count, created: .created_at}'
```

### Get Session Details

```bash
# Replace with actual session ID
SESSION_ID="session_abc123"

# Session info
curl "http://localhost:3000/v1/sessions/$SESSION_ID" | jq .

# Session statistics
curl "http://localhost:3000/v1/sessions/$SESSION_ID/stats" | jq .

# All requests in session
curl "http://localhost:3000/v1/sessions/$SESSION_ID/requests" | jq .
```

### Calculate Token Usage

```bash
# Get overall statistics
curl http://localhost:3000/v1/responses/stats | jq .

# Calculate cost (example: $2 per 1M tokens)
curl http://localhost:3000/v1/responses/stats | \
  jq '.statistics.total_tokens / 1000000 * 2 | "Estimated cost: $\(.)"'
```

### Find Slow Requests

```bash
# Get responses sorted by duration
curl "http://localhost:3000/v1/responses?limit=100" | \
  jq '.data | sort_by(.duration_ms) | reverse | .[0:10] | .[] | {id, duration_ms, total_tokens}'
```

### Debug a Specific Request

```bash
# Get request details
REQUEST_ID="12345"
curl "http://localhost:3000/v1/requests/$REQUEST_ID" | jq .

# Get the response
curl "http://localhost:3000/v1/requests/$REQUEST_ID/response" | jq .

# View original OpenAI request
curl "http://localhost:3000/v1/requests/$REQUEST_ID" | \
  jq -r '.openai_request | fromjson | .messages'

# View transformed Qwen request
curl "http://localhost:3000/v1/requests/$REQUEST_ID" | \
  jq -r '.qwen_request | fromjson'
```

---

## Key Endpoints

### Sessions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/sessions` | GET | List all sessions |
| `/v1/sessions/:id` | GET | Get session details |
| `/v1/sessions/:id/stats` | GET | Get token usage for session |
| `/v1/sessions/:id` | DELETE | Delete session |

### Requests

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/requests` | GET | List all requests |
| `/v1/requests/:id` | GET | Get request details |
| `/v1/sessions/:sessionId/requests` | GET | Get session requests |

### Responses

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/responses` | GET | List all responses |
| `/v1/responses/stats` | GET | Get usage statistics |
| `/v1/responses/:id` | GET | Get response details |
| `/v1/requests/:requestId/response` | GET | Get response for request |

---

## Common Operations

### 1. Generate Billing Report

```javascript
// billing-report.js
const axios = require('axios');

async function generateReport() {
  const stats = await axios.get('http://localhost:3000/v1/responses/stats');
  const usage = stats.data.statistics;

  const PRICE_PER_1M_TOKENS = 2.0; // Example pricing
  const totalCost = (usage.total_tokens / 1000000) * PRICE_PER_1M_TOKENS;

  console.log('Usage Report');
  console.log('============');
  console.log(`Total Requests: ${usage.total_responses}`);
  console.log(`Total Tokens: ${usage.total_tokens.toLocaleString()}`);
  console.log(`Estimated Cost: $${totalCost.toFixed(2)}`);
}

generateReport();
```

### 2. Export Session Data

```bash
#!/bin/bash
# export-session.sh

SESSION_ID="$1"

# Get all data for a session
curl -s "http://localhost:3000/v1/sessions/$SESSION_ID" > session.json
curl -s "http://localhost:3000/v1/sessions/$SESSION_ID/requests" > requests.json
curl -s "http://localhost:3000/v1/sessions/$SESSION_ID/stats" > stats.json

echo "Exported session $SESSION_ID to:"
echo "  - session.json"
echo "  - requests.json"
echo "  - stats.json"
```

### 3. Monitor Usage

```bash
#!/bin/bash
# monitor-usage.sh

while true; do
  clear
  echo "=== Qwen Proxy Usage Monitor ==="
  echo ""

  # Get stats
  STATS=$(curl -s http://localhost:3000/v1/responses/stats)

  echo "Total Responses: $(echo $STATS | jq -r '.statistics.total_responses')"
  echo "Total Tokens: $(echo $STATS | jq -r '.statistics.total_tokens')"
  echo "Avg Duration: $(echo $STATS | jq -r '.statistics.avg_duration_ms')ms"

  # Get recent session count
  SESSIONS=$(curl -s "http://localhost:3000/v1/sessions?limit=1")
  echo "Total Sessions: $(echo $SESSIONS | jq -r '.total')"

  echo ""
  echo "Press Ctrl+C to exit"

  sleep 5
done
```

### 4. Clean Up Old Sessions

```bash
# Delete a specific session
SESSION_ID="session_abc123"
curl -X DELETE "http://localhost:3000/v1/sessions/$SESSION_ID"
```

---

## Direct Database Access

You can also query the database directly using SQLite:

```bash
# Open database
sqlite3 data/qwen_proxy.db

# List tables
sqlite> .tables

# Count records
sqlite> SELECT COUNT(*) FROM sessions;
sqlite> SELECT COUNT(*) FROM requests;
sqlite> SELECT COUNT(*) FROM responses;

# Recent sessions
sqlite> SELECT id, message_count, datetime(created_at/1000, 'unixepoch')
   ...> FROM sessions
   ...> ORDER BY created_at DESC
   ...> LIMIT 10;

# Token usage
sqlite> SELECT
   ...>   SUM(total_tokens) as total_tokens,
   ...>   SUM(completion_tokens) as completion_tokens,
   ...>   SUM(prompt_tokens) as prompt_tokens
   ...> FROM responses;

# Average response time
sqlite> SELECT AVG(duration_ms) as avg_duration FROM responses;

# Exit
sqlite> .quit
```

---

## Maintenance

### Backup Database

```bash
# Simple file backup
cp data/qwen_proxy.db backups/qwen_proxy_$(date +%Y%m%d).db

# SQLite backup (safe while running)
sqlite3 data/qwen_proxy.db ".backup 'backups/qwen_proxy_backup.db'"
```

### Check Database Size

```bash
# File size
ls -lh data/qwen_proxy.db

# Record counts
sqlite3 data/qwen_proxy.db "SELECT
  (SELECT COUNT(*) FROM sessions) as sessions,
  (SELECT COUNT(*) FROM requests) as requests,
  (SELECT COUNT(*) FROM responses) as responses"
```

### Vacuum Database

Reclaim disk space from deleted records:

```bash
sqlite3 data/qwen_proxy.db "VACUUM;"
```

---

## Troubleshooting

### Database Locked

If you get "database is locked" errors:

```bash
# Check what's accessing the database
lsof data/qwen_proxy.db

# Restart the server
pm2 restart qwen-proxy
```

### Slow Queries

If queries are slow:

```bash
# Rebuild indexes
sqlite3 data/qwen_proxy.db "REINDEX;"

# Analyze for query optimizer
sqlite3 data/qwen_proxy.db "ANALYZE;"
```

### Check Integrity

Verify database health:

```bash
sqlite3 data/qwen_proxy.db "PRAGMA integrity_check;"
```

Should output: `ok`

---

## Testing

### Run Integration Tests

```bash
# All persistence tests
npm test tests/integration/sqlite-persistence.test.js

# E2E test (server must be running)
node tests/e2e/test-persistence-flow.js
```

### Verify Persistence

```bash
# 1. Start server
npm start

# 2. Make a request
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-turbo",
    "messages": [{"role": "user", "content": "Test"}]
  }'

# 3. Check database
curl http://localhost:3000/v1/sessions | jq '.total'
curl http://localhost:3000/v1/requests | jq '.total'
curl http://localhost:3000/v1/responses | jq '.total'
```

All counts should be > 0.

---

## Configuration

### Environment Variables

Add to `.env` (all optional, defaults work great):

```env
# Database location (default: ./data/qwen_proxy.db)
DATABASE_PATH=./data/qwen_proxy.db

# Session timeout in milliseconds (default: 30 minutes)
SESSION_TIMEOUT=1800000

# Enable/disable persistence (default: true)
ENABLE_PERSISTENCE=true

# Enable/disable CRUD endpoints (default: true)
ENABLE_CRUD_API=true
```

### Disable Persistence

To disable persistence temporarily:

```env
ENABLE_PERSISTENCE=false
```

Or in code:

```javascript
// In your environment or config
process.env.ENABLE_PERSISTENCE = 'false';
```

---

## Next Steps

### Learn More

- **[Complete Documentation](./SQLITE_PERSISTENCE_COMPLETE.md)** - Comprehensive guide
- **[API Reference](./API_DOCUMENTATION.md)** - Full API documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment

### Advanced Topics

- **Performance tuning** - Optimize for high traffic
- **Data archival** - Archive old sessions
- **Custom queries** - Write your own analytics
- **Export/import** - Backup and migration strategies

### Get Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Check the complete docs
- **Community**: Join discussions

---

## Cheat Sheet

```bash
# Quick reference for common operations

# View recent sessions
curl http://localhost:3000/v1/sessions | jq .

# Get usage stats
curl http://localhost:3000/v1/responses/stats | jq .

# Get session details
curl http://localhost:3000/v1/sessions/SESSION_ID | jq .

# List requests
curl http://localhost:3000/v1/requests | jq .

# Database size
ls -lh data/qwen_proxy.db

# Backup database
cp data/qwen_proxy.db backups/backup_$(date +%Y%m%d).db

# Query database directly
sqlite3 data/qwen_proxy.db "SELECT COUNT(*) FROM sessions"

# Check integrity
sqlite3 data/qwen_proxy.db "PRAGMA integrity_check;"

# Vacuum database
sqlite3 data/qwen_proxy.db "VACUUM;"
```

---

**That's it!** You're now ready to use SQLite persistence. Every request is automatically tracked, and you can query your data anytime through the REST API or directly via SQLite.

For detailed documentation, see [SQLITE_PERSISTENCE_COMPLETE.md](./SQLITE_PERSISTENCE_COMPLETE.md)
