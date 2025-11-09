#!/bin/bash
# Template Conversion Script

set -e

# Configuration
SOURCE_DIR="/Users/chris/Projects/llm-api-vault-v2/frontend"
OUTPUT_DIR="/Users/chris/Projects/llm-api-vault-v2/tools/frontend-tools/frontend-generator-v2/templates"
CONVERTER_SCRIPT="$(dirname "$0")/converter.py"

echo "🚀 Starting Template Conversion"
echo "📁 Source: $SOURCE_DIR"
echo "📁 Output: $OUTPUT_DIR"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory does not exist: $SOURCE_DIR"
    exit 1
fi

# Check if converter script exists
if [ ! -f "$CONVERTER_SCRIPT" ]; then
    echo "❌ Converter script not found: $CONVERTER_SCRIPT"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Run the conversion
echo "🔄 Running conversion..."
python3 "$CONVERTER_SCRIPT" \
    --source "$SOURCE_DIR" \
    --output "$OUTPUT_DIR" \
    --docs

echo "✅ Template conversion completed!"
echo "📖 Check CONVERSION_GUIDE.md in the output directory for details"