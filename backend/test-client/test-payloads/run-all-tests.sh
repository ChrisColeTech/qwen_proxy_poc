#!/bin/bash

# Test runner for provider-router with LM Studio

BASE_URL="http://localhost:3001/v1/chat/completions"
AUTH_HEADER="Authorization: Bearer dummy-key"
CONTENT_TYPE="Content-Type: application/json"

echo "========================================="
echo "Provider-Router Test Suite"
echo "========================================="
echo ""

# Test scenarios
echo ">>> Testing Scenarios"
echo ""

for file in scenarios/*.json; do
  filename=$(basename "$file")
  echo "Testing: $filename"
  
  response=$(curl -s -X POST "$BASE_URL" \
    -H "$CONTENT_TYPE" \
    -H "$AUTH_HEADER" \
    -d @"$file")
  
  # Check if response is valid JSON
  if echo "$response" | jq empty 2>/dev/null; then
    model=$(echo "$response" | jq -r '.model')
    finish_reason=$(echo "$response" | jq -r '.choices[0].finish_reason')
    tool_calls=$(echo "$response" | jq -r '.choices[0].message.tool_calls // [] | length')
    content_length=$(echo "$response" | jq -r '.choices[0].message.content | length')
    
    echo "  ✓ Model: $model"
    echo "  ✓ Finish: $finish_reason"
    echo "  ✓ Tools: $tool_calls call(s)"
    echo "  ✓ Content: $content_length chars"
  else
    echo "  ✗ Invalid JSON response"
  fi
  
  echo ""
done

# Test tools
echo ">>> Testing Individual Tools"
echo ""

for file in tools/*.json; do
  filename=$(basename "$file")
  echo "Testing: $filename"
  
  response=$(curl -s -X POST "$BASE_URL" \
    -H "$CONTENT_TYPE" \
    -H "$AUTH_HEADER" \
    -d @"$file")
  
  if echo "$response" | jq empty 2>/dev/null; then
    tool_name=$(echo "$response" | jq -r '.choices[0].message.tool_calls[0].function.name // "none"')
    finish_reason=$(echo "$response" | jq -r '.choices[0].finish_reason')
    
    echo "  ✓ Tool: $tool_name"
    echo "  ✓ Finish: $finish_reason"
  else
    echo "  ✗ Invalid JSON response"
  fi
  
  echo ""
done

# Test models
echo ">>> Testing Different Models"
echo ""

for file in models/*.json; do
  filename=$(basename "$file")
  echo "Testing: $filename"
  
  response=$(curl -s -X POST "$BASE_URL" \
    -H "$CONTENT_TYPE" \
    -H "$AUTH_HEADER" \
    -d @"$file")
  
  if echo "$response" | jq empty 2>/dev/null; then
    model=$(echo "$response" | jq -r '.model')
    finish_reason=$(echo "$response" | jq -r '.choices[0].finish_reason')
    tool_calls=$(echo "$response" | jq -r '.choices[0].message.tool_calls // [] | length')
    
    echo "  ✓ Model: $model"
    echo "  ✓ Finish: $finish_reason"
    echo "  ✓ Tools: $tool_calls call(s)"
  else
    echo "  ✗ Invalid JSON response"
  fi
  
  echo ""
done

echo "========================================="
echo "Tests Complete"
echo "========================================="
