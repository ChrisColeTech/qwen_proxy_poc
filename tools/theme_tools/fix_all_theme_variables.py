#!/usr/bin/env python3
"""
Fix all theme CSS files to use the correct variable names that the app expects.
Based on the working onyx theme pattern.
"""

import os
import re

def extract_colors_from_theme_block(content, theme_name):
    """Extract color values from a theme block in the original format."""
    # Find the theme block
    pattern = rf'\.theme-{theme_name}\s*\{{([^}}]+)\}}'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return None
    
    block = match.group(1)
    colors = {}
    
    # Extract color variables
    for line in block.split('\n'):
        line = line.strip()
        if line.startswith('--') and ':' in line:
            parts = line.split(':', 1)
            if len(parts) == 2:
                var_name = parts[0].strip()
                var_value = parts[1].strip().rstrip(';')
                colors[var_name] = var_value
    
    return colors

def generate_new_theme_block(theme_name, colors, dark_colors=None):
    """Generate a new theme block with correct variable names."""
    # Map old variables to new ones with fallbacks
    def get_color(old_names, fallback='#000000'):
        for name in old_names if isinstance(old_names, list) else [old_names]:
            if name in colors:
                return colors[name]
        return fallback
    
    # Light mode variables
    new_block = f".theme-{theme_name} {{\n"
    new_block += f"  --background: {get_color('--background', '#ffffff')};\n"
    new_block += f"  --foreground: {get_color(['--text', '--foreground'], '#000000')};\n"
    new_block += f"  --card: {get_color(['--surface', '--card'], '#f5f5f5')};\n"
    new_block += f"  --card-foreground: {get_color(['--text', '--foreground'], '#000000')};\n"
    new_block += f"  --popover: {get_color(['--input-bg', '--background'], '#ffffff')};\n"
    new_block += f"  --popover-foreground: {get_color(['--text', '--foreground'], '#000000')};\n"
    new_block += f"  --primary: {get_color(['--accent', '--primary'], '#334155')};\n"
    new_block += f"  --primary-foreground: #ffffff;\n"
    new_block += f"  --secondary: {get_color(['--text-muted', '--secondary'], '#64748b')};\n"
    new_block += f"  --secondary-foreground: #ffffff;\n"
    new_block += f"  --muted: {get_color(['--surface-hover', '--surface', '--muted'], '#f1f5f9')};\n"
    new_block += f"  --muted-foreground: {get_color(['--text-muted'], '#64748b')};\n"
    new_block += f"  --accent: {get_color(['--accent'], '#475569')};\n"
    new_block += f"  --accent-foreground: #ffffff;\n"
    new_block += f"  --destructive: {get_color(['--status-error'], '#ef4444')};\n"
    new_block += f"  --destructive-foreground: #ffffff;\n"
    new_block += f"  --border: {get_color(['--border'], '#e2e8f0')};\n"
    new_block += f"  --input: {get_color(['--border-thin', '--border'], '#e2e8f0')};\n"
    new_block += f"  --ring: {get_color(['--accent', '--primary'], '#0099ff')};\n"
    new_block += f"  --radius: 0.75rem;\n"
    new_block += f"  --titlebar: {get_color(['--surface', '--muted'], '#f1f5f9')};\n"
    new_block += f"  --titlebar-foreground: {get_color(['--text'], '#475569')};\n"
    new_block += f"  --titlebar-hover: {get_color(['--surface-hover', '--border'], '#e2e8f0')};\n"
    new_block += f"  --titlebar-close-hover: {get_color(['--status-error'], '#ef4444')};\n"
    new_block += "}\n"
    
    # Dark mode if available
    if dark_colors:
        new_block += f"\n.theme-{theme_name}.dark {{\n"
        def get_dark_color(old_names, fallback='#ffffff'):
            for name in old_names if isinstance(old_names, list) else [old_names]:
                if name in dark_colors:
                    return dark_colors[name]
            return fallback
        
        new_block += f"  --background: {get_dark_color('--background', '#000000')};\n"
        new_block += f"  --foreground: {get_dark_color(['--text', '--foreground'], '#ffffff')};\n"
        new_block += f"  --card: {get_dark_color(['--surface', '--card'], '#1a1a1a')};\n"
        new_block += f"  --card-foreground: {get_dark_color(['--text', '--foreground'], '#ffffff')};\n"
        new_block += f"  --popover: {get_dark_color(['--surface', '--background'], '#1a1a1a')};\n"
        new_block += f"  --popover-foreground: {get_dark_color(['--text', '--foreground'], '#ffffff')};\n"
        new_block += f"  --primary: {get_dark_color(['--accent', '--primary'], '#ffffff')};\n"
        new_block += f"  --primary-foreground: #000000;\n"
        new_block += f"  --secondary: {get_dark_color(['--text-muted'], '#a1a1aa')};\n"
        new_block += f"  --secondary-foreground: #000000;\n"
        new_block += f"  --muted: {get_dark_color(['--surface-hover', '--surface'], '#262626')};\n"
        new_block += f"  --muted-foreground: {get_dark_color(['--text-muted'], '#a1a1aa')};\n"
        new_block += f"  --accent: {get_dark_color(['--accent'], '#ffffff')};\n"
        new_block += f"  --accent-foreground: #000000;\n"
        new_block += f"  --destructive: {get_dark_color(['--status-error'], '#ef4444')};\n"
        new_block += f"  --destructive-foreground: #ffffff;\n"
        new_block += f"  --border: {get_dark_color(['--border'], '#404040')};\n"
        new_block += f"  --input: {get_dark_color(['--border'], '#404040')};\n"
        new_block += f"  --ring: {get_dark_color(['--accent'], '#ffffff')};\n"
        new_block += f"  --radius: 0.75rem;\n"
        new_block += f"  --titlebar: {get_dark_color(['--surface'], '#1a1a1a')};\n"
        new_block += f"  --titlebar-foreground: {get_dark_color(['--text'], '#ffffff')};\n"
        new_block += f"  --titlebar-hover: {get_dark_color(['--surface-hover'], '#262626')};\n"
        new_block += f"  --titlebar-close-hover: {get_dark_color(['--status-error'], '#ef4444')};\n"
        new_block += "}\n"
    
    return new_block

def fix_theme_file(file_path):
    """Fix a complete theme file."""
    print(f"Processing: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all theme blocks
    theme_pattern = r'\.theme-(\w+)(?:\.dark)?\s*\{'
    theme_names = list(set(re.findall(theme_pattern, content)))
    
    new_content = ""
    
    for theme_name in theme_names:
        print(f"  Processing theme: {theme_name}")
        
        # Extract light and dark colors
        light_colors = extract_colors_from_theme_block(content, theme_name)
        dark_colors = extract_colors_from_theme_block(content, f"{theme_name}.dark")
        
        if light_colors:
            # Generate new theme block
            new_block = generate_new_theme_block(theme_name, light_colors, dark_colors)
            new_content += f"\n/* {theme_name.upper()} THEME */\n"
            new_content += new_block + "\n"
    
    # Write the fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("/* Fixed theme variables to match app expectations */\n")
        f.write(new_content)
    
    print(f"  ✅ Fixed {len(theme_names)} themes in {file_path}")

def main():
    theme_dir = "../src/styles/organized_themes"
    
    if not os.path.exists(theme_dir):
        print(f"Error: Directory {theme_dir} not found")
        return
    
    # Fix professional themes file
    professional_file = os.path.join(theme_dir, "themes-professional.css")
    if os.path.exists(professional_file):
        fix_theme_file(professional_file)
    
    # Fix gaming themes file  
    gaming_file = os.path.join(theme_dir, "themes-gaming.css")
    if os.path.exists(gaming_file):
        fix_theme_file(gaming_file)
    
    print("\n✅ Complete! All theme files have been updated with correct variable names.")

if __name__ == "__main__":
    main()