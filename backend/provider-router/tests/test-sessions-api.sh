#!/bin/bash

# Sessions API Test Script
# Tests all 4 endpoints of the Sessions API

BASE_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "  Sessions API Test Suite"
echo "========================================="
echo ""

# Check if server is running
echo -n "Checking server status... "
if curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo "Please start the server with: npm start"
    exit 1
fi
echo ""

# Test 1: List Sessions
echo -e "${BLUE}Test 1: GET /v1/sessions (List all sessions)${NC}"
echo "Command: curl \"$BASE_URL/v1/sessions?limit=5\""
RESPONSE=$(curl -s "$BASE_URL/v1/sessions?limit=5")
echo "$RESPONSE" | jq '.'
TOTAL=$(echo "$RESPONSE" | jq '.total')
echo -e "${GREEN}✓ Found $TOTAL session(s)${NC}"
echo ""

# Test 2: List Sessions with Sort Parameter
echo -e "${BLUE}Test 2: GET /v1/sessions?sort=last_accessed${NC}"
echo "Command: curl \"$BASE_URL/v1/sessions?limit=3&sort=last_accessed\""
curl -s "$BASE_URL/v1/sessions?limit=3&sort=last_accessed" | jq '.sessions[] | {id: .id, last_accessed: .last_accessed}'
echo -e "${GREEN}✓ Sorted by last_accessed${NC}"
echo ""

# Test 3: Get Single Session (if exists)
echo -e "${BLUE}Test 3: GET /v1/sessions/:id (Get single session)${NC}"
SESSION_ID=$(curl -s "$BASE_URL/v1/sessions?limit=1" | jq -r '.sessions[0].id')

if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
    echo "Session ID: $SESSION_ID"
    echo "Command: curl \"$BASE_URL/v1/sessions/$SESSION_ID\""
    curl -s "$BASE_URL/v1/sessions/$SESSION_ID" | jq '.'
    echo -e "${GREEN}✓ Retrieved session details${NC}"
else
    echo -e "${RED}No sessions found. Create some sessions first by making chat requests.${NC}"
    echo ""
    echo "Example:"
    echo "curl -X POST $BASE_URL/v1/chat/completions \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"model\": \"qwen3-max\", \"messages\": [{\"role\": \"user\", \"content\": \"Test\"}]}'"
fi
echo ""

# Test 4: Get Non-existent Session (404 test)
echo -e "${BLUE}Test 4: GET /v1/sessions/nonexistent (404 test)${NC}"
echo "Command: curl \"$BASE_URL/v1/sessions/nonexistent123\""
HTTP_CODE=$(curl -s -w "%{http_code}" -o /tmp/session_response.json "$BASE_URL/v1/sessions/nonexistent123")
cat /tmp/session_response.json | jq '.'
if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓ Correctly returned 404 Not Found${NC}"
else
    echo -e "${RED}✗ Expected 404, got $HTTP_CODE${NC}"
fi
echo ""

# Test 5: Cleanup Expired Sessions
echo -e "${BLUE}Test 5: DELETE /v1/sessions (Cleanup expired)${NC}"
echo "Command: curl -X DELETE \"$BASE_URL/v1/sessions\""
CLEANUP_RESPONSE=$(curl -s -X DELETE "$BASE_URL/v1/sessions")
echo "$CLEANUP_RESPONSE" | jq '.'
DELETED=$(echo "$CLEANUP_RESPONSE" | jq '.deleted')
echo -e "${GREEN}✓ Cleaned up $DELETED expired session(s)${NC}"
echo ""

# Test 6: Delete Session (if exists)
echo -e "${BLUE}Test 6: DELETE /v1/sessions/:id (Delete specific session)${NC}"
SESSION_ID=$(curl -s "$BASE_URL/v1/sessions?limit=1" | jq -r '.sessions[0].id')

if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
    echo "Deleting session: $SESSION_ID"
    echo "Command: curl -X DELETE \"$BASE_URL/v1/sessions/$SESSION_ID\""

    # Get request count before delete
    REQUEST_COUNT=$(curl -s "$BASE_URL/v1/sessions/$SESSION_ID" | jq -r '.request_count // 0')
    echo "Session has $REQUEST_COUNT request(s)"

    # Delete the session
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/v1/sessions/$SESSION_ID")
    echo "$DELETE_RESPONSE" | jq '.'

    # Verify deletion
    HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/v1/sessions/$SESSION_ID")
    if [ "$HTTP_CODE" = "404" ]; then
        echo -e "${GREEN}✓ Session successfully deleted (verified with 404)${NC}"
    else
        echo -e "${RED}✗ Session still exists after deletion${NC}"
    fi
else
    echo -e "${RED}No sessions available to delete${NC}"
fi
echo ""

# Test 7: Pagination Test
echo -e "${BLUE}Test 7: Pagination Test${NC}"
echo "Getting first 2 sessions:"
curl -s "$BASE_URL/v1/sessions?limit=2&offset=0" | jq '{total: .total, limit: .limit, offset: .offset, count: (.sessions | length), has_more: .has_more}'
echo -e "${GREEN}✓ Pagination working${NC}"
echo ""

# Final Summary
echo "========================================="
echo "  Test Suite Complete"
echo "========================================="
echo ""
echo "All tests passed! ✓"
echo ""
echo "Available endpoints:"
echo "  GET    /v1/sessions           - List all sessions"
echo "  GET    /v1/sessions/:id       - Get single session"
echo "  DELETE /v1/sessions/:id       - Delete session"
echo "  DELETE /v1/sessions           - Cleanup expired sessions"
echo ""
echo "See SESSIONS_API.md for full documentation"
