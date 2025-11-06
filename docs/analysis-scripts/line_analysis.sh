#!/bin/bash

cd /Users/chris/Projects/qwen_proxy_poc/frontend/src

echo "=== DETAILED LINE-BY-LINE VIOLATIONS ==="
echo ""
echo "VIOLATION 1: Custom button classes used instead of shadcn/ui Button"
echo "=================================================================="

echo ""
echo "File: components/features/authentication/AuthButtons.tsx"
grep -n "className=\"btn-" components/features/authentication/AuthButtons.tsx
echo "Total: 2 violations (lines 48, 53)"

echo ""
echo "File: components/features/proxy/ProxyControlButtons.tsx"
grep -n "className=\"btn-" components/features/proxy/ProxyControlButtons.tsx
echo "Total: 2 violations (lines 13, 21)"

echo ""
echo "VIOLATION 2: Custom card structure instead of shadcn/ui Card"
echo "==========================================================="
echo ""
echo "All 5 card components use custom .card-base structure:"
echo ""
grep -n "className=\"card-base\"" components/features/*/*.tsx

echo ""
echo "VIOLATION 3: Status badge custom CSS instead of dedicated component"
echo "=================================================================="
echo ""
grep -n "className=\"status-badge" components/features/*/*.tsx

echo ""
echo "VIOLATION 4: Custom CSS alert instead of shadcn/ui or Alert component"
echo "====================================================================="
echo ""
grep -n "className=\"status-alert" components/features/alerts/StatusAlert.tsx

echo ""
echo "VIOLATION 5: Custom CSS badge and styling"
echo "========================================"
echo ""
grep -n "className=\"environment-badge" components/ui/EnvironmentBadge.tsx

