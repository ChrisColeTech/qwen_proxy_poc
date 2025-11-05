#!/bin/bash

# Test script for Request History API endpoints
# Tests Phase 6 implementation: Requests CRUD API Endpoints

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Testing Request History API Endpoints"
echo "========================================="
echo ""

# Helper function to print test results
print_test() {
  local test_name=$1
  local status=$2
  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $test_name"
  else
    echo -e "${RED}✗${NC} $test_name"
  fi
}

# Test counter
PASSED=0
FAILED=0

# ========================================
# Test 1: List all requests (basic)
# ========================================
echo -e "${YELLOW}Test 1: GET /v1/requests${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests?limit=10")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  # Check if response has expected fields
  if echo "$BODY" | jq -e '.requests' > /dev/null 2>&1 && \
     echo "$BODY" | jq -e '.total' > /dev/null 2>&1 && \
     echo "$BODY" | jq -e '.limit' > /dev/null 2>&1 && \
     echo "$BODY" | jq -e '.offset' > /dev/null 2>&1 && \
     echo "$BODY" | jq -e '.has_more' > /dev/null 2>&1; then
    print_test "List requests with pagination" 0
    PASSED=$((PASSED + 1))
  else
    print_test "List requests - missing fields" 1
    FAILED=$((FAILED + 1))
  fi
else
  print_test "List requests - HTTP $HTTP_CODE" 1
  FAILED=$((FAILED + 1))
fi

# Show sample output
TOTAL=$(echo "$BODY" | jq -r '.total')
echo "  Total requests: $TOTAL"
echo ""

# ========================================
# Test 2: List requests with filters
# ========================================
echo -e "${YELLOW}Test 2: GET /v1/requests with filters${NC}"

# Test filter by model
RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests?model=qwen3-max&limit=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_test "Filter by model" 0
  PASSED=$((PASSED + 1))
  COUNT=$(echo "$BODY" | jq '.requests | length')
  echo "  Found $COUNT requests for model=qwen3-max"
else
  print_test "Filter by model - HTTP $HTTP_CODE" 1
  FAILED=$((FAILED + 1))
fi

# Test filter by stream
RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests?stream=false&limit=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_test "Filter by stream=false" 0
  PASSED=$((PASSED + 1))
else
  print_test "Filter by stream - HTTP $HTTP_CODE" 1
  FAILED=$((FAILED + 1))
fi
echo ""

# ========================================
# Test 3: Get specific request by ID
# ========================================
echo -e "${YELLOW}Test 3: GET /v1/requests/:id${NC}"

# Get the first request ID from the list
FIRST_REQUEST_ID=$(curl -s "${BASE_URL}/v1/requests?limit=1" | jq -r '.requests[0].id // empty')

if [ -n "$FIRST_REQUEST_ID" ]; then
  echo "  Testing with request ID: $FIRST_REQUEST_ID"

  RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests/${FIRST_REQUEST_ID}")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" -eq 200 ]; then
    # Check if response has expected fields
    if echo "$BODY" | jq -e '.id' > /dev/null 2>&1 && \
       echo "$BODY" | jq -e '.request_id' > /dev/null 2>&1 && \
       echo "$BODY" | jq -e '.openai_request' > /dev/null 2>&1 && \
       echo "$BODY" | jq -e '.qwen_request' > /dev/null 2>&1; then
      print_test "Get request by ID" 0
      PASSED=$((PASSED + 1))

      # Check if response is included
      if echo "$BODY" | jq -e '.response' > /dev/null 2>&1; then
        echo "  ✓ Linked response included"
      else
        echo "  - No linked response"
      fi
    else
      print_test "Get request - missing fields" 1
      FAILED=$((FAILED + 1))
    fi
  else
    print_test "Get request by ID - HTTP $HTTP_CODE" 1
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ⊘ Skipping - no requests in database"
fi
echo ""

# ========================================
# Test 4: Get request by UUID
# ========================================
echo -e "${YELLOW}Test 4: GET /v1/requests/:request_id (UUID)${NC}"

# Get the first request's UUID
FIRST_REQUEST_UUID=$(curl -s "${BASE_URL}/v1/requests?limit=1" | jq -r '.requests[0].request_id // empty')

if [ -n "$FIRST_REQUEST_UUID" ]; then
  echo "  Testing with UUID: $FIRST_REQUEST_UUID"

  RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests/${FIRST_REQUEST_UUID}")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" -eq 200 ]; then
    print_test "Get request by UUID" 0
    PASSED=$((PASSED + 1))
  else
    print_test "Get request by UUID - HTTP $HTTP_CODE" 1
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ⊘ Skipping - no requests in database"
fi
echo ""

# ========================================
# Test 5: Get requests for a session
# ========================================
echo -e "${YELLOW}Test 5: GET /v1/sessions/:sessionId/requests${NC}"

# Get the first session ID
FIRST_SESSION_ID=$(curl -s "${BASE_URL}/v1/sessions?limit=1" | jq -r '.sessions[0].id // empty')

if [ -n "$FIRST_SESSION_ID" ]; then
  echo "  Testing with session ID: ${FIRST_SESSION_ID:0:16}..."

  RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/sessions/${FIRST_SESSION_ID}/requests?limit=10")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" -eq 200 ]; then
    if echo "$BODY" | jq -e '.session_id' > /dev/null 2>&1 && \
       echo "$BODY" | jq -e '.requests' > /dev/null 2>&1; then
      print_test "Get requests for session" 0
      PASSED=$((PASSED + 1))

      REQUEST_COUNT=$(echo "$BODY" | jq '.requests | length')
      echo "  Found $REQUEST_COUNT requests for this session"
    else
      print_test "Get session requests - missing fields" 1
      FAILED=$((FAILED + 1))
    fi
  else
    print_test "Get session requests - HTTP $HTTP_CODE" 1
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ⊘ Skipping - no sessions in database"
fi
echo ""

# ========================================
# Test 6: Date range filtering
# ========================================
echo -e "${YELLOW}Test 6: GET /v1/requests with date range${NC}"

# Get timestamps for last 24 hours
END_DATE=$(date +%s)000
START_DATE=$((END_DATE - 86400000))

RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests?start_date=${START_DATE}&end_date=${END_DATE}&limit=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
  print_test "Filter by date range" 0
  PASSED=$((PASSED + 1))
else
  print_test "Filter by date range - HTTP $HTTP_CODE" 1
  FAILED=$((FAILED + 1))
fi
echo ""

# ========================================
# Test 7: Pagination
# ========================================
echo -e "${YELLOW}Test 7: Pagination${NC}"

# Test with offset
RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests?limit=5&offset=0")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  LIMIT=$(echo "$BODY" | jq -r '.limit')
  OFFSET=$(echo "$BODY" | jq -r '.offset')
  HAS_MORE=$(echo "$BODY" | jq -r '.has_more')

  if [ "$LIMIT" -eq 5 ] && [ "$OFFSET" -eq 0 ]; then
    print_test "Pagination parameters" 0
    PASSED=$((PASSED + 1))
    echo "  limit=$LIMIT, offset=$OFFSET, has_more=$HAS_MORE"
  else
    print_test "Pagination parameters incorrect" 1
    FAILED=$((FAILED + 1))
  fi
else
  print_test "Pagination - HTTP $HTTP_CODE" 1
  FAILED=$((FAILED + 1))
fi
echo ""

# ========================================
# Test 8: 404 for non-existent request
# ========================================
echo -e "${YELLOW}Test 8: GET /v1/requests/:id (non-existent)${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests/999999")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 404 ]; then
  print_test "404 for non-existent request" 0
  PASSED=$((PASSED + 1))
else
  print_test "Should return 404 - got HTTP $HTTP_CODE" 1
  FAILED=$((FAILED + 1))
fi
echo ""

# ========================================
# Test 9: Delete request
# ========================================
echo -e "${YELLOW}Test 9: DELETE /v1/requests/:id${NC}"

# Note: This is destructive, so we'll only test if explicitly requested
if [ "$DESTRUCTIVE_TESTS" = "1" ]; then
  LAST_REQUEST_ID=$(curl -s "${BASE_URL}/v1/requests?limit=1&offset=0" | jq -r '.requests[0].id // empty')

  if [ -n "$LAST_REQUEST_ID" ]; then
    echo "  Deleting request ID: $LAST_REQUEST_ID"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}/v1/requests/${LAST_REQUEST_ID}")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" -eq 200 ]; then
      if echo "$BODY" | jq -e '.success' > /dev/null 2>&1; then
        print_test "Delete request" 0
        PASSED=$((PASSED + 1))

        # Verify deletion
        VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}/v1/requests/${LAST_REQUEST_ID}")
        VERIFY_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)

        if [ "$VERIFY_CODE" -eq 404 ]; then
          echo "  ✓ Verified deletion (404)"
        else
          echo "  ✗ Deletion not verified"
        fi
      else
        print_test "Delete request - no success field" 1
        FAILED=$((FAILED + 1))
      fi
    else
      print_test "Delete request - HTTP $HTTP_CODE" 1
      FAILED=$((FAILED + 1))
    fi
  else
    echo "  ⊘ Skipping - no requests to delete"
  fi
else
  echo "  ⊘ Skipping - set DESTRUCTIVE_TESTS=1 to enable"
fi
echo ""

# ========================================
# Summary
# ========================================
echo "========================================="
echo "Test Summary"
echo "========================================="
TOTAL=$((PASSED + FAILED))
echo -e "Total:  $TOTAL tests"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
