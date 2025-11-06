#!/bin/bash

echo "=== COMPREHENSIVE FRONTEND ARCHITECTURE ANALYSIS ==="
echo ""
echo "1. CUSTOM CSS CLASS USAGE ANALYSIS"
echo "=================================="

cd /Users/chris/Projects/qwen_proxy_poc/frontend/src

# Custom button classes
echo -e "\n[CUSTOM BUTTONS]"
echo "btn-primary usage:"
grep -r "className=\"btn-primary" . --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u | sed 's/^\.\///'
echo "Count:" $(grep -r "className=\"btn-primary" . --include="*.tsx" 2>/dev/null | wc -l)

echo -e "\nbtn-danger usage:"
grep -r "className=\"btn-danger" . --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u | sed 's/^\.\///'
echo "Count:" $(grep -r "className=\"btn-danger" . --include="*.tsx" 2>/dev/null | wc -l)

# Custom card classes
echo -e "\n[CUSTOM CARDS]"
echo "card-base usage:"
grep -r "className=\"card-base" . --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u | sed 's/^\.\///'
echo "Count:" $(grep -r "className=\"card-base" . --include="*.tsx" 2>/dev/null | wc -l)

echo -e "\ncard-header usage:"
grep -r "className=\"card-header" . --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u | sed 's/^\.\///'
echo "Count:" $(grep -r "className=\"card-header" . --include="*.tsx" 2>/dev/null | wc -l)

# Status badges
echo -e "\n[STATUS BADGES]"
echo "status-badge-* usage:"
grep -r "className=\"status-badge" . --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u | sed 's/^\.\///'
echo "Count:" $(grep -r "className=\"status-badge" . --include="*.tsx" 2>/dev/null | wc -l)

# Alert classes
echo -e "\n[CUSTOM ALERTS]"
echo "status-alert usage:"
grep -r "className=\"status-alert" . --include="*.tsx" 2>/dev/null | cut -d: -f1 | sort -u | sed 's/^\.\///'
echo "Count:" $(grep -r "className=\"status-alert" . --include="*.tsx" 2>/dev/null | wc -l)

echo -e "\n2. SHADCN/UI COMPONENT INSTALLATION CHECK"
echo "=========================================="
if [ -f "components/ui/button.tsx" ]; then echo "✓ Button installed"; else echo "✗ Button missing"; fi
if [ -f "components/ui/card.tsx" ]; then echo "✓ Card installed"; else echo "✗ Card missing"; fi
if [ -f "components/ui/dialog.tsx" ]; then echo "✓ Dialog installed"; else echo "✗ Dialog missing"; fi
if [ -f "components/ui/input.tsx" ]; then echo "✓ Input installed"; else echo "✗ Input missing"; fi
if [ -f "components/ui/label.tsx" ]; then echo "✓ Label installed"; else echo "✗ Label missing"; fi
if [ -f "components/ui/popover.tsx" ]; then echo "✓ Popover installed"; else echo "✗ Popover missing"; fi
if [ -f "components/ui/command.tsx" ]; then echo "✓ Command installed"; else echo "✗ Command missing"; fi
if [ -f "components/ui/textarea.tsx" ]; then echo "✓ Textarea installed"; else echo "✗ Textarea missing"; fi

echo -e "\n3. COMPONENT FRAGMENTATION ANALYSIS"
echo "===================================="

# Components only imported in one place
echo -e "\nComponents in features/ directory:"
find components/features -name "*.tsx" -type f | while read f; do
  component_name=$(basename "$f")
  imports=$(grep -r "$(basename "$f" .tsx)" . --include="*.tsx" 2>/dev/null | grep "import.*from" | wc -l)
  echo "$f: imported $imports times"
done

echo -e "\n4. CUSTOM CSS IN INDEX.CSS"
echo "========================="
echo "Total lines in index.css: $(wc -l < index.css)"
echo ""
echo "Custom class count by category:"
echo "Layout classes: $(grep -c "^\.layout-\|^\.page-\|^\.dashboard-" index.css)"
echo "Card classes: $(grep -c "^\.card-" index.css)"
echo "Button classes: $(grep -c "^\.btn-\|^\.auth-buttons" index.css)"
echo "Alert classes: $(grep -c "^\.status-alert" index.css)"
echo "Badge classes: $(grep -c "^\.status-badge\|^\.environment-badge" index.css)"
echo "Other classes: $(grep -c "^\.proxy-\|^\.stats-\|^\.guide-\|^\.credential-" index.css)"

