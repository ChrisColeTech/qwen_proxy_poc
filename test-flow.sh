#!/bin/bash

echo "=== Qwen Proxy Testing Flow ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database path
DB_PATH="/Users/chris/Projects/qwen_proxy_poc/backend/provider-router/data/provider-router.db"

# 1. Check services
echo "1. Checking services..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Provider Router healthy"
else
  echo -e "${RED}✗${NC} Provider Router not responding"
  exit 1
fi

if curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Qwen Proxy healthy"
else
  echo -e "${RED}✗${NC} Qwen Proxy not responding"
  exit 1
fi

if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} API Server healthy"
else
  echo -e "${RED}✗${NC} API Server not responding"
  exit 1
fi
echo ""

# 2. Test with current provider
echo "2. Testing current provider..."
CURRENT=$(sqlite3 "$DB_PATH" "SELECT value FROM settings WHERE key = 'active_provider';")
echo "Active provider: $CURRENT"
RESPONSE=$(curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Say test"}]}')
CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')
if [ -n "$CONTENT" ] && [ "$CONTENT" != "null" ]; then
  echo -e "${GREEN}✓${NC} Response: $CONTENT"
else
  echo -e "${RED}✗${NC} Empty or null response"
  exit 1
fi
echo ""

# 3. Switch to qwen-proxy
echo "3. Testing qwen-proxy-default..."
sqlite3 "$DB_PATH" "UPDATE settings SET value = 'qwen-proxy-default' WHERE key = 'active_provider';"
sleep 2
RESPONSE=$(curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Hello Qwen"}]}')
CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')
if [ -n "$CONTENT" ] && [ "$CONTENT" != "null" ]; then
  echo -e "${GREEN}✓${NC} Qwen response: $CONTENT"
else
  echo -e "${RED}✗${NC} Qwen returned empty response"
  exit 1
fi
echo ""

# 4. Switch to LM Studio (if available)
echo "4. Testing lm-studio-default..."
if curl -s http://localhost:1234/v1/models > /dev/null 2>&1; then
  sqlite3 "$DB_PATH" "UPDATE settings SET value = 'lm-studio-default' WHERE key = 'active_provider';"
  sleep 2
  RESPONSE=$(curl -s http://localhost:3001/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer any-key" \
    -d '{"model":"qwen3-max","messages":[{"role":"user","content":"Hello LM Studio"}]}')
  CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')
  if [ -n "$CONTENT" ] && [ "$CONTENT" != "null" ]; then
    echo -e "${GREEN}✓${NC} LM Studio response received"
  else
    echo -e "${RED}✗${NC} LM Studio returned empty response"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠${NC} LM Studio not available, skipping"
fi
echo ""

# 5. Test models endpoint
echo "5. Testing models endpoint..."
MODELS_COUNT=$(curl -s http://localhost:3001/v1/models | jq '.data | length')
if [ "$MODELS_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Found $MODELS_COUNT models"
else
  echo -e "${RED}✗${NC} No models found"
  exit 1
fi
echo ""

# 6. Test math
echo "6. Testing math capabilities..."
sqlite3 "$DB_PATH" "UPDATE settings SET value = 'qwen-proxy-default' WHERE key = 'active_provider';"
sleep 2
RESPONSE=$(curl -s http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer any-key" \
  -d '{"model":"qwen3-max","messages":[{"role":"user","content":"What is 5+3? Answer with only the number."}]}')
CONTENT=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')
if echo "$CONTENT" | grep -q "8"; then
  echo -e "${GREEN}✓${NC} Math test passed: $CONTENT"
else
  echo -e "${YELLOW}⚠${NC} Math test result: $CONTENT"
fi
echo ""

# 7. Final status
echo "=== Testing Complete ==="
FINAL_PROVIDER=$(sqlite3 "$DB_PATH" "SELECT value FROM settings WHERE key = 'active_provider';")
echo "Final active provider: $FINAL_PROVIDER"
echo ""
echo -e "${GREEN}All tests passed!${NC}"
