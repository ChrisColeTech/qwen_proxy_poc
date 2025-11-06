#!/bin/bash

cd /Users/chris/Projects/qwen_proxy_poc/frontend/src

echo "=== COMPONENT FRAGMENTATION DETAILED ANALYSIS ==="
echo ""

# Check each feature component and its parent
echo "ProxyControlCard and its children:"
echo "- ProxyControlCard.tsx:"
grep -c "import.*from" components/features/proxy/ProxyControlCard.tsx
echo "  - Imports ProxyInfoGrid (line $(grep -n "ProxyInfoGrid" components/features/proxy/ProxyControlCard.tsx | head -1 | cut -d: -f1))"
echo "  - Imports ProxyControlButtons (line $(grep -n "ProxyControlButtons" components/features/proxy/ProxyControlCard.tsx | head -1 | cut -d: -f1))"
echo "  - Imports ProxyEndpointInfo (line $(grep -n "ProxyEndpointInfo" components/features/proxy/ProxyControlCard.tsx | head -1 | cut -d: -f1))"
echo "  - Only used 1 time in: $(grep -r "ProxyControlCard" . --include="*.tsx" | grep import | cut -d: -f1 | head -1)"

echo ""
echo "AuthenticationCard and its children:"
echo "- AuthenticationCard.tsx:"
echo "  - Imports AuthButtons (line $(grep -n "AuthButtons" components/features/authentication/AuthenticationCard.tsx | head -1 | cut -d: -f1))"
echo "  - Imports AuthCardFooter (line $(grep -n "AuthCardFooter" components/features/authentication/AuthenticationCard.tsx | head -1 | cut -d: -f1))"
echo "  - Only used 1 time in: $(grep -r "AuthenticationCard" . --include="*.tsx" | grep import | cut -d: -f1 | head -1)"

echo ""
echo "=== LINES OF CODE IN FEATURE COMPONENTS ==="
wc -l components/features/*/*.tsx | sort -n

echo ""
echo "=== SHADCN/UI COMPONENTS NOT BEING USED ==="
# Check for installed but unused components
for component in Button Card Dialog Input Label Popover Command Textarea; do
  count=$(grep -r "from.*@/components/ui" . --include="*.tsx" 2>/dev/null | grep -i "$component" | wc -l)
  if [ $count -eq 0 ]; then
    echo "NOT USED: $component"
  else
    echo "USED: $component"
  fi
done

echo ""
echo "=== CUSTOM CSS DUPLICATION CHECK ==="
# Check status badges - could use Badge component or shadcn
echo "Status badge classes in index.css:"
grep "^\.status-badge" index.css

echo ""
echo "Status badge usages in components:"
grep -r "status-badge" components --include="*.tsx" -h | grep className | sort -u | head -10

