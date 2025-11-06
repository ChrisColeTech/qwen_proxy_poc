#!/bin/bash

cd /Users/chris/Projects/qwen_proxy_poc/frontend/src

echo "=== CSS DEFINITIONS THAT DUPLICATE FUNCTIONALITY ==="
echo ""
echo "1. BUTTON CLASSES (could use shadcn/ui Button)"
echo "============================================="
grep -A2 "^\.btn-primary\|^\.btn-danger\|^\.auth-buttons" index.css

echo ""
echo "2. CARD CLASSES (could use shadcn/ui Card)"
echo "========================================="
grep -A2 "^\.card-base\|^\.card-header\|^\.card-content\|^\.card-footer" index.css

echo ""
echo "3. STATUS BADGE CLASSES (should be a component)"
echo "=============================================="
grep -A2 "^\.status-badge" index.css

echo ""
echo "4. ALERT CLASSES (could use shadcn/ui Alert or custom Alert component)"
echo "==================================================================="
grep -A2 "^\.status-alert" index.css

echo ""
echo "5. ENVIRONMENT BADGE CLASSES"
echo "============================"
grep -A2 "^\.environment-badge" index.css

echo ""
echo "6. PROXY/STATS/GUIDE/CREDENTIAL CLASSES (duplicated layouts)"
echo "=========================================================="
grep "^\.proxy-\|^\.stats-\|^\.guide-\|^\.credential-" index.css | wc -l
echo "Total custom layout classes: $(grep "^\.proxy-\|^\.stats-\|^\.guide-\|^\.credential-" index.css | wc -l)"

