#!/usr/bin/env python3
"""
Theme Organizer - Combines and organizes ALL themes with consistent naming
"""
import re
import click
import os
from pathlib import Path


# Standard theme name mappings
PROFESSIONAL_THEME_MAPPING = {
    'onyx': 'onyx',
    'detox-analyzer': 'sage', 
    'reverse-engineer': 'amber',
    'malware-hunter': 'crimson',
    'script-sleuth': 'gold',
    'debug-master': 'copper',
    'hex-analyst': 'violet',
    'binary-explorer': 'matrix',
    'cyber-forensics': 'neon',
    'threat-hunter': 'scarlet',
    'packet-tracer': 'azure',
    'malware-analyst': 'bronze',
    'digital-sleuth': 'teal'
}

GAMING_THEME_MAPPING = {
    'cyber-neon': 'cyber-neon',
    'dragon-gold': 'dragon-gold', 
    'shadow-knight': 'shadow-knight',
    'forest-mystique': 'forest-mystique',
    'royal-purple': 'royal-purple'
}


def extract_base_variables(css_content):
    """Extract :root and base variables"""
    base_rules = []
    
    # Extract :root blocks
    root_pattern = r':root\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    root_matches = re.finditer(root_pattern, css_content, re.DOTALL)
    for match in root_matches:
        base_rules.append(match.group(0).strip())
    
    # Extract .dark base blocks (not theme-specific)
    dark_pattern = r'\.dark\s*\{[^{}]*\}'
    dark_matches = re.finditer(dark_pattern, css_content, re.DOTALL)
    for match in dark_matches:
        rule = match.group(0).strip()
        # Only include if it's not part of a theme selector
        if not re.search(r'\.color-|\.theme-', rule):
            base_rules.append(rule)
    
    return base_rules


def extract_professional_themes(css_content):
    """Extract and standardize professional themes (excluding high-contrast variants)"""
    themes = {}
    
    # Extract color-* theme rules
    for old_name, new_name in PROFESSIONAL_THEME_MAPPING.items():
        themes[new_name] = {
            'light': None,
            'dark': None
        }
        
        # Light variant (base theme)
        light_pattern = rf'\.color-{re.escape(old_name)}\s*\{{[^{{}}]*(?:\{{[^{{}}]*\}}[^{{}}]*)*\}}'
        light_match = re.search(light_pattern, css_content, re.DOTALL)
        if light_match:
            themes[new_name]['light'] = light_match.group(0)
        
        # Dark variant
        dark_pattern = rf'\.color-{re.escape(old_name)}\.dark\s*\{{[^{{}}]*(?:\{{[^{{}}]*\}}[^{{}}]*)*\}}'
        dark_match = re.search(dark_pattern, css_content, re.DOTALL)
        if dark_match:
            themes[new_name]['dark'] = dark_match.group(0)
    
    return themes


def extract_gaming_themes(css_content):
    """Extract gaming themes"""
    themes = {}
    
    for old_name, new_name in GAMING_THEME_MAPPING.items():
        themes[new_name] = {
            'dark': None,
            'light': None
        }
        
        # Dark variant
        dark_pattern = rf'\.theme-{re.escape(old_name)}\s*\{{[^{{}}]*\}}'
        dark_match = re.search(dark_pattern, css_content, re.DOTALL)
        if dark_match:
            themes[new_name]['dark'] = dark_match.group(0)
        
        # Light variant  
        light_pattern = rf'\.theme-{re.escape(old_name)}-light\s*\{{[^{{}}]*\}}'
        light_match = re.search(light_pattern, css_content, re.DOTALL)
        if light_match:
            themes[new_name]['light'] = light_match.group(0)
    
    return themes


def extract_enhanced_effects(css_content):
    """Extract enhanced effects utilities"""
    utilities = []
    
    # Enhanced effects section
    effects_section_pattern = r'/\*[^*]*ENHANCED EFFECTS UTILITY[^*]*\*/.*?(?=/\*.*?=|$)'
    effects_match = re.search(effects_section_pattern, css_content, re.DOTALL)
    if effects_match:
        utilities.append(effects_match.group(0).strip())
    
    # Individual utility classes if not in section
    utility_patterns = [
        r'\.cyberpunk-glow\s*\{[^{}]*\}',
        r'\.neon-text\s*\{[^{}]*\}', 
        r'\.neon-border\s*\{[^{}]*\}',
        r'@media\s*\([^)]*prefers-reduced-motion[^)]*\)[^{}]*\{[^{}]*\}'
    ]
    
    for pattern in utility_patterns:
        matches = re.finditer(pattern, css_content, re.DOTALL)
        for match in matches:
            utility = match.group(0).strip()
            if utility not in utilities:
                utilities.append(utility)
    
    return utilities


def convert_to_standard_naming(css_rule, old_name, new_name, theme_type='professional'):
    """Convert theme CSS to standard .theme-* naming"""
    if not css_rule:
        return None
    
    if theme_type == 'professional':
        # Convert .color-old-name to .theme-new-name
        css_rule = re.sub(rf'\.color-{re.escape(old_name)}', f'.theme-{new_name}', css_rule)
    elif theme_type == 'gaming':
        # Convert .theme-old-name to .theme-new-name (already using theme-)
        if old_name != new_name:
            css_rule = re.sub(rf'\.theme-{re.escape(old_name)}', f'.theme-{new_name}', css_rule)
    
    return css_rule


def generate_base_css():
    """Generate base themes CSS"""
    return """/* =============================================================================
   THEME SYSTEM BASE
   Core variables and infrastructure for all themes
   ============================================================================= */

/* Default theme variables - light mode */
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --primary: #334155;
  --primary-foreground: #ffffff;
  --secondary: #64748b;
  --secondary-foreground: #f8fafc;
  --muted: #f1f5f9;
  --muted-foreground: #64748b;
  --accent: #475569;
  --accent-foreground: #ffffff;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #0099ff;
  --radius: 0.75rem;
  
  /* Theme system additions */
  --surface: #f5f5f5;
  --surface-hover: rgba(0, 0, 0, 0.05);
  --text: #121212;
  --text-muted: #6e6e6e;
  --text-background: #ffffff;
  --accent-hover: #2a2a2a;
  --border-thin: rgba(229, 229, 229, 0.2);
  --input-bg: #ffffff;
  --scrollbar: #d1d5db;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  /* Status colors */
  --status-error: #dc2626;
  --status-error-bg: rgba(220, 38, 38, 0.1);
  --status-warning: #d97706;
  --status-warning-bg: rgba(217, 119, 6, 0.1);
  --status-info: #2563eb;
  --status-info-bg: rgba(37, 99, 235, 0.1);
  --status-success: #059669;
  --status-success-bg: rgba(5, 150, 105, 0.1);
  
  /* Enhanced effects (none by default) */
  --accent-glow: none;
  --text-glow: none;
  --neon-border: none;
}

/* Dark mode base */
.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
  --card: #1e293b;
  --card-foreground: #f8fafc;
  --popover: #1e293b;
  --popover-foreground: #f8fafc;
  --primary: #64748b;
  --primary-foreground: #f8fafc;
  --secondary: #94a3b8;
  --secondary-foreground: #0f172a;
  --muted: #334155;
  --muted-foreground: #94a3b8;
  --accent: #475569;
  --accent-foreground: #f8fafc;
  --destructive: #ef4444;
  --destructive-foreground: #f8fafc;
  --border: #334155;
  --input: #334155;
  --ring: #0099ff;
}"""


def generate_professional_themes_css(themes):
    """Generate professional themes CSS"""
    lines = [
        "/* =============================================================================",
        "   PROFESSIONAL THEMES",
        "   Solid color professional themes without special effects",
        "   ============================================================================= */",
        ""
    ]
    
    for theme_name, variants in themes.items():
        if not any(variants.values()):
            continue
            
        # Find original name for comments
        original_name = None
        for old, new in PROFESSIONAL_THEME_MAPPING.items():
            if new == theme_name:
                original_name = old
                break
        
        theme_title = theme_name.replace('-', ' ').title()
        lines.extend([
            f"/* =============================================================================",
            f"   {theme_title.upper()} THEME",
            f"   {theme_title} professional color scheme" + (f" (was {original_name})" if original_name else ""),
            f"   ============================================================================= */",
            ""
        ])
        
        # Light mode
        if variants['light']:
            converted = convert_to_standard_naming(variants['light'], original_name or theme_name, theme_name, 'professional')
            if converted:
                lines.extend([converted, ""])
        
        # Dark mode
        if variants['dark']:
            converted = convert_to_standard_naming(variants['dark'], original_name or theme_name, theme_name, 'professional')
            if converted:
                lines.extend([converted, ""])
    
    return '\n'.join(lines)


def generate_gaming_themes_css(themes):
    """Generate gaming themes CSS"""
    lines = [
        "/* =============================================================================",
        "   GAMING THEMES",
        "   Immersive gaming themes with special effects and vibrant colors",
        "   ============================================================================= */",
        ""
    ]
    
    for theme_name, variants in themes.items():
        if not any(variants.values()):
            continue
            
        theme_title = theme_name.replace('-', ' ').title()
        lines.extend([
            f"/* {theme_title} Gaming Theme */",
            ""
        ])
        
        # Dark mode (primary for gaming themes)
        if variants['dark']:
            converted = convert_to_standard_naming(variants['dark'], theme_name, theme_name, 'gaming')
            if converted:
                lines.extend([converted, ""])
        
        # Light mode
        if variants['light']:
            converted = convert_to_standard_naming(variants['light'], theme_name + '-light', theme_name + '-light', 'gaming')
            if converted:
                lines.extend([converted, ""])
    
    return '\n'.join(lines)


def generate_effects_css(utilities):
    """Generate enhanced effects CSS"""
    lines = [
        "/* =============================================================================",
        "   ENHANCED EFFECTS UTILITIES",
        "   Special effect utilities for gaming themes",
        "   ============================================================================= */",
        ""
    ]
    
    for utility in utilities:
        lines.extend([utility, ""])
    
    return '\n'.join(lines)


@click.command()
@click.option('--input', '-i', multiple=True, help='Input CSS files (can specify multiple)', required=True)
@click.option('--output-dir', '-o', help='Output directory for organized theme files', default='organized_themes')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
@click.option('--base-path', '-b', help='Base path for resolving relative paths', default='.')
def main(input, output_dir, verbose, base_path):
    """
    Organize ALL themes with consistent naming and split into manageable files.
    
    Examples:
        python theme_organizer.py -i ../src/index.css -i ../src/styles/themes.css -o organized_themes -v
    """
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Combine all CSS content
    combined_css = ""
    for input_file in input:
        if not os.path.isabs(input_file):
            input_file = os.path.join(base_path, input_file)
            
        if not os.path.exists(input_file):
            click.echo(f"Error: Input file {input_file} not found")
            continue
        
        if verbose:
            click.echo(f"📁 Processing {input_file}...")
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                combined_css += f.read() + "\n\n"
        except Exception as e:
            click.echo(f"Error reading {input_file}: {e}")
            continue
    
    if not combined_css.strip():
        click.echo("No CSS content found in input files")
        return
    
    # Extract components
    if verbose:
        click.echo("🔍 Extracting theme components...")
    
    base_vars = extract_base_variables(combined_css)
    professional_themes = extract_professional_themes(combined_css) 
    gaming_themes = extract_gaming_themes(combined_css)
    effects = extract_enhanced_effects(combined_css)
    
    if verbose:
        click.echo(f"   🏗️  Base variables: {len(base_vars)}")
        click.echo(f"   💼 Professional themes: {len([t for t in professional_themes.values() if any(t.values())])}")
        click.echo(f"   🎮 Gaming themes: {len([t for t in gaming_themes.values() if any(t.values())])}")
        click.echo(f"   ✨ Effect utilities: {len(effects)}")
    
    # Generate organized CSS files
    files_written = []
    
    # 1. Base themes
    base_css = generate_base_css()
    base_file = os.path.join(output_dir, 'themes-base.css')
    with open(base_file, 'w', encoding='utf-8') as f:
        f.write(base_css)
    files_written.append(('themes-base.css', len(base_css), 'Base theme system'))
    
    # 2. Professional themes
    if any(any(t.values()) for t in professional_themes.values()):
        prof_css = generate_professional_themes_css(professional_themes)
        prof_file = os.path.join(output_dir, 'themes-professional.css')
        with open(prof_file, 'w', encoding='utf-8') as f:
            f.write(prof_css)
        files_written.append(('themes-professional.css', len(prof_css), f'{len([t for t in professional_themes.values() if any(t.values())])} professional themes'))
    
    # 3. Gaming themes
    if any(any(t.values()) for t in gaming_themes.values()):
        gaming_css = generate_gaming_themes_css(gaming_themes)
        gaming_file = os.path.join(output_dir, 'themes-gaming.css')
        with open(gaming_file, 'w', encoding='utf-8') as f:
            f.write(gaming_css)
        files_written.append(('themes-gaming.css', len(gaming_css), f'{len([t for t in gaming_themes.values() if any(t.values())])} gaming themes'))
    
    # 4. Enhanced effects
    if effects:
        effects_css = generate_effects_css(effects)
        effects_file = os.path.join(output_dir, 'themes-effects.css')
        with open(effects_file, 'w', encoding='utf-8') as f:
            f.write(effects_css)
        files_written.append(('themes-effects.css', len(effects_css), f'{len(effects)} effect utilities'))
    
    # Summary
    click.echo(f"\n✅ Organized themes written to {output_dir}/")
    
    total_size = 0
    for filename, size, description in files_written:
        size_kb = size / 1024
        total_size += size
        click.echo(f"   📄 {filename} - {size_kb:.1f}KB ({description})")
    
    click.echo(f"\n📊 Summary:")
    click.echo(f"   📁 Files created: {len(files_written)}")
    click.echo(f"   📏 Total size: {total_size/1024:.1f}KB (was 76KB in single file)")
    click.echo(f"   🎨 All themes use consistent .theme-* naming")
    click.echo(f"   💼 Professional themes: solid colors, no effects")
    click.echo(f"   🎮 Gaming themes: vibrant colors with effects")


if __name__ == '__main__':
    main()