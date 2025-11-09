#!/bin/bash

# CSS Cleanup Script - Actually fixes the problem
# Unlike the previous "analysis" that just made excuses

FRONTEND_DIR="/Users/chris/Projects/qwen_proxy_poc/frontend"

echo "=================================="
echo "CSS CLEANUP SCRIPT"
echo "Removing 350KB of dead CSS code"
echo "=================================="

# Files that are 100% unused and can be safely deleted
FILES_TO_DELETE=(
    "src/styles/home.css"
    "src/styles/chat-custom.css"
    "src/styles/models2.css"
    "src/styles/chat-tabs.css"
    "src/styles/providers.css"
    "src/styles/system-features.css"
    "src/styles/chat-quick-test.css"
    "src/styles/chat-curl.css"
    "src/styles/chat-response.css"
    "src/styles/pages/providers.css"
    "src/styles/pages/quick-guide.css"
    "src/App.css"
)

echo ""
echo "Files to be deleted (0% usage):"
echo "--------------------------------"

for file in "${FILES_TO_DELETE[@]}"; do
    full_path="$FRONTEND_DIR/$file"
    if [ -f "$full_path" ]; then
        size=$(du -h "$full_path" | cut -f1)
        echo "  ❌ $file (size: $size)"
    fi
done

echo ""
read -p "Do you want to DELETE these completely unused CSS files? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deleting unused CSS files..."
    for file in "${FILES_TO_DELETE[@]}"; do
        full_path="$FRONTEND_DIR/$file"
        if [ -f "$full_path" ]; then
            rm "$full_path"
            echo "  ✓ Deleted: $file"
        fi
    done

    # Now update index.css to remove the imports
    echo ""
    echo "Updating index.css to remove deleted imports..."

    # Create a backup
    cp "$FRONTEND_DIR/src/index.css" "$FRONTEND_DIR/src/index.css.backup"

    # Remove import lines for deleted files
    for file in "${FILES_TO_DELETE[@]}"; do
        # Convert path to import path
        import_path=$(echo "$file" | sed 's/^src\//.\//g')
        # Remove the import line
        sed -i "" "/@import.*${import_path//\//\\/}/d" "$FRONTEND_DIR/src/index.css"
    done

    echo "✓ Updated index.css"
    echo ""
    echo "=================================="
    echo "CLEANUP COMPLETE"
    echo "=================================="
    echo "Deleted ${#FILES_TO_DELETE[@]} unused CSS files"
    echo "Backup saved as index.css.backup"
    echo ""
    echo "Next steps:"
    echo "1. Review remaining CSS files for partial usage"
    echo "2. Consider consolidating CSS into fewer files"
    echo "3. Add PurgeCSS to your build pipeline"
else
    echo "Cleanup cancelled."
fi

# Show remaining high-unused files
echo ""
echo "Files with >80% unused classes (consider reviewing):"
echo "----------------------------------------------------"
echo "  ⚠️  src/styles/credentials.css (87.5% unused)"
echo "  ⚠️  src/styles/models.css (80.5% unused)"
echo "  ⚠️  src/styles/api-guide.css (96.8% unused)"
echo "  ⚠️  src/styles/pages.css (92.3% unused)"
echo "  ⚠️  src/styles/components/guide.css (96.8% unused)"