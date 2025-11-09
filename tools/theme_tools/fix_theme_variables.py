#!/usr/bin/env python3
"""
Fix CSS variable names in theme files to match what the app expects.
"""

import os
import re

# Variable mapping from current names to expected names
# Based on semantic meaning and color usage patterns
VARIABLE_MAPPING = {
    # Text colors
    '--text': '--foreground',
    '--text-muted': '--muted-foreground', 
    '--text-background': '--card-foreground',
    
    # Surface/background colors
    '--background': '--background',
    '--surface': '--card',
    '--surface-hover': '--muted',
    '--input-bg': '--popover',
    
    # Accent/primary colors
    '--accent': '--primary',
    '--accent-hover': '--primary-foreground',
    
    # Border colors
    '--border': '--border',
    '--border-thin': '--input',
    
    # Status colors
    '--status-error': '--destructive',
    '--status-error-bg': '--destructive-foreground',
    
    # Additional mappings needed for complete theme
    # We need to ADD missing variables that the app requires
}

def fix_variables_in_file(file_path):
    """Fix CSS variables in a single file."""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Replace variable definitions (--old-name: value;)
    for old_var, new_var in VARIABLE_MAPPING.items():
        # Match variable definitions
        pattern = f'{re.escape(old_var)}:'
        replacement = f'{new_var}:'
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ Updated variables in {file_path}")
        return True
    else:
        print(f"  ⚪ No changes needed in {file_path}")
        return False

def main():
    theme_dir = "../src/styles/organized_themes"
    
    if not os.path.exists(theme_dir):
        print(f"Error: Directory {theme_dir} not found")
        return
    
    files_updated = 0
    
    # Process all CSS files in the theme directory
    for filename in os.listdir(theme_dir):
        if filename.endswith('.css'):
            file_path = os.path.join(theme_dir, filename)
            if fix_variables_in_file(file_path):
                files_updated += 1
    
    print(f"\n✅ Complete! Updated {files_updated} files")

if __name__ == "__main__":
    main()