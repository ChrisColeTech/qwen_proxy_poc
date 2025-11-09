#!/usr/bin/env python3
"""
Theme Integrator - Updates your CSS files to use the new organized theme system
"""
import re
import click
import os
import shutil
from pathlib import Path


def backup_file(file_path):
    """Create a backup of the original file"""
    backup_path = f"{file_path}.backup"
    shutil.copy2(file_path, backup_path)
    return backup_path


def remove_theme_sections_from_css(css_content):
    """Remove existing theme sections from CSS content"""
    
    # Patterns to remove
    patterns_to_remove = [
        # Gaming theme blocks in @layer base
        r'\.theme-[a-zA-Z-]+\s*\{[^{}]*\}',
        
        # Remove theme-related :root and .dark sections (but keep base ones)
        # This is tricky - we want to keep the base :root but remove theme-specific ones
    ]
    
    # Remove gaming theme definitions
    for pattern in patterns_to_remove:
        css_content = re.sub(pattern, '', css_content, flags=re.DOTALL)
    
    # Clean up extra newlines
    css_content = re.sub(r'\n\s*\n\s*\n', '\n\n', css_content)
    
    return css_content


def add_theme_imports(css_content, themes_dir):
    """Add imports for the new organized theme files"""
    
    # Find the position after @tailwind directives
    tailwind_end = 0
    lines = css_content.split('\n')
    
    for i, line in enumerate(lines):
        if line.strip().startswith('@tailwind'):
            tailwind_end = i + 1
    
    # Create import statements
    imports = [
        f"/* Organized Theme System */",
        f"@import '{themes_dir}/themes-base.css';",
        f"@import '{themes_dir}/themes-professional.css';", 
        f"@import '{themes_dir}/themes-gaming.css';",
        f"@import '{themes_dir}/themes-effects.css';",
        ""
    ]
    
    # Insert imports after tailwind directives
    new_lines = lines[:tailwind_end] + imports + lines[tailwind_end:]
    
    return '\n'.join(new_lines)


def create_clean_index_css(original_css, themes_dir_rel_path):
    """Create a clean index.css with themes removed and imports added"""
    
    # Remove theme definitions
    clean_css = remove_theme_sections_from_css(original_css)
    
    # Add theme imports
    clean_css = add_theme_imports(clean_css, themes_dir_rel_path)
    
    return clean_css


def generate_updated_theme_switcher():
    """Generate updated TypeScript code for theme switcher"""
    return '''// Updated ThemeSwitcher.tsx types and configurations
export type ThemeId = 
  // Professional themes (solid colors, no effects)
  | 'theme-onyx' | 'theme-sage' | 'theme-amber' | 'theme-crimson'
  | 'theme-gold' | 'theme-copper' | 'theme-violet' | 'theme-matrix' 
  | 'theme-neon' | 'theme-scarlet' | 'theme-azure' | 'theme-bronze' | 'theme-teal'
  // Gaming themes (with effects) 
  | 'theme-cyber-neon' | 'theme-dragon-gold' | 'theme-shadow-knight'
  | 'theme-forest-mystique' | 'theme-royal-purple'
  // Gaming light variants
  | 'theme-cyber-neon-light' | 'theme-dragon-gold-light' | 'theme-shadow-knight-light'
  | 'theme-forest-mystique-light' | 'theme-royal-purple-light'

export type BaseTheme = 
  // Professional themes  
  | 'onyx' | 'sage' | 'amber' | 'crimson' | 'gold' | 'copper' | 'violet'
  | 'matrix' | 'neon' | 'scarlet' | 'azure' | 'bronze' | 'teal'
  // Gaming themes
  | 'cyber-neon' | 'dragon-gold' | 'shadow-knight' | 'forest-mystique' | 'royal-purple'

export const professionalThemes: BaseThemeConfig[] = [
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Classic monochrome professional',
    icon: Settings,
    category: 'professional'
  },
  {
    id: 'sage', 
    name: 'Sage',
    description: 'Professional green theme',
    icon: Leaf,
    category: 'professional'
  },
  {
    id: 'amber',
    name: 'Amber', 
    description: 'Professional orange theme',
    icon: Zap,
    category: 'professional'
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Professional red theme', 
    icon: Shield,
    category: 'professional'
  }
  // ... add the other 9 professional themes
]

export const gamingThemes: BaseThemeConfig[] = [
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    description: 'Electric neon gaming',
    icon: Zap,
    category: 'gaming'
  },
  {
    id: 'dragon-gold',
    name: 'Dragon Gold', 
    description: 'Medieval dragon power',
    icon: Crown,
    category: 'gaming'
  }
  // ... add the other gaming themes
]'''


def generate_updated_theme_context():
    """Generate updated theme context logic"""
    return '''// Updated ThemeContext.tsx logic

// Theme application logic - updated for new naming
useEffect(() => {
  const html = document.documentElement
  
  console.log('🎨 [THEME] Applying theme:', currentTheme)
  
  // Remove all theme classes (old and new)
  const allThemeClasses = [
    // Old system classes to remove
    'dark', 'theme-cyber-neon', 'theme-dragon-gold', 'theme-shadow-knight', 
    'theme-forest-mystique', 'theme-royal-purple', 'theme-cyber-neon-light',
    'theme-dragon-gold-light', 'theme-shadow-knight-light', 
    'theme-forest-mystique-light', 'theme-royal-purple-light',
    
    // New organized theme classes
    'theme-onyx', 'theme-sage', 'theme-amber', 'theme-crimson',
    'theme-gold', 'theme-copper', 'theme-violet', 'theme-matrix',
    'theme-neon', 'theme-scarlet', 'theme-azure', 'theme-bronze', 'theme-teal'
  ]
  
  allThemeClasses.forEach(cls => html.classList.remove(cls))
  
  // Add current theme class
  if (currentTheme !== 'light') {
    html.classList.add(currentTheme)
  }
  
  // Handle dark mode for professional themes
  if (currentTheme.startsWith('theme-') && isDarkMode) {
    html.classList.add('dark')
  }
  
  console.log('🎨 [THEME] Document classes:', Array.from(html.classList).join(', '))
  
  // Save to localStorage
  localStorage.setItem('chess-app-theme', currentTheme)
}, [currentTheme, isDarkMode])'''


@click.command()
@click.option('--src-dir', '-s', help='Source directory containing CSS files', 
              default='../src')
@click.option('--themes-dir', '-t', help='Directory containing organized theme files',
              default='organized_themes') 
@click.option('--backup/--no-backup', default=True, help='Create backup of original files')
@click.option('--dry-run', is_flag=True, help='Show what would be done without making changes')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
def main(src_dir, themes_dir, backup, dry_run, verbose):
    """
    Integrate organized theme files into your existing CSS structure.
    
    This will:
    1. Remove theme definitions from index.css
    2. Add imports to organized theme files  
    3. Generate updated TypeScript code for theme switching
    4. Create backup files (unless --no-backup)
    
    Examples:
        python theme_integrator.py --dry-run -v
        python theme_integrator.py --backup
    """
    
    if not os.path.exists(src_dir):
        click.echo(f"❌ Source directory {src_dir} not found")
        return
    
    if not os.path.exists(themes_dir):
        click.echo(f"❌ Themes directory {themes_dir} not found")
        return
    
    # Files to process
    index_css_path = os.path.join(src_dir, 'index.css')
    themes_css_path = os.path.join(src_dir, 'styles', 'themes.css')
    
    if not os.path.exists(index_css_path):
        click.echo(f"❌ index.css not found at {index_css_path}")
        return
    
    click.echo("🔄 Theme Integration Plan:")
    click.echo(f"   📁 Source: {src_dir}")
    click.echo(f"   🎨 Themes: {themes_dir}")
    click.echo(f"   💾 Backup: {'Yes' if backup else 'No'}")
    click.echo(f"   🧪 Dry run: {'Yes' if dry_run else 'No'}")
    
    if dry_run:
        click.echo("\n🧪 DRY RUN - No files will be modified")
    
    # Process index.css
    try:
        with open(index_css_path, 'r', encoding='utf-8') as f:
            original_index_css = f.read()
    except Exception as e:
        click.echo(f"❌ Error reading index.css: {e}")
        return
    
    if verbose:
        click.echo(f"📄 Original index.css: {len(original_index_css)} chars, {len(original_index_css.splitlines())} lines")
    
    # Calculate relative path from index.css to themes directory
    themes_rel_path = os.path.relpath(themes_dir, src_dir)
    
    # Create updated index.css
    updated_index_css = create_clean_index_css(original_index_css, themes_rel_path)
    
    if verbose:
        click.echo(f"📄 Updated index.css: {len(updated_index_css)} chars, {len(updated_index_css.splitlines())} lines")
        reduction = len(original_index_css) - len(updated_index_css)
        click.echo(f"   📉 Size reduction: {reduction} chars ({reduction/len(original_index_css)*100:.1f}%)")
    
    # Show what will be done
    click.echo(f"\n📋 Changes to make:")
    click.echo(f"   🗂️  Remove theme definitions from index.css")
    click.echo(f"   📥 Add imports to organized theme files")
    if os.path.exists(themes_css_path):
        click.echo(f"   🗑️  themes.css can be removed (themes now organized)")
    
    if not dry_run:
        # Create backups
        if backup:
            backup_index = backup_file(index_css_path)
            click.echo(f"   💾 Backed up index.css → {os.path.basename(backup_index)}")
            
            if os.path.exists(themes_css_path):
                backup_themes = backup_file(themes_css_path) 
                click.echo(f"   💾 Backed up themes.css → {os.path.basename(backup_themes)}")
        
        # Write updated index.css
        try:
            with open(index_css_path, 'w', encoding='utf-8') as f:
                f.write(updated_index_css)
            click.echo(f"   ✅ Updated index.css")
        except Exception as e:
            click.echo(f"   ❌ Error writing index.css: {e}")
            return
    
    # Generate TypeScript updates
    ts_output_dir = 'theme_integration_updates'
    os.makedirs(ts_output_dir, exist_ok=True)
    
    # Theme switcher updates
    switcher_updates = generate_updated_theme_switcher()
    switcher_file = os.path.join(ts_output_dir, 'theme_switcher_updates.ts')
    
    if not dry_run:
        with open(switcher_file, 'w', encoding='utf-8') as f:
            f.write(switcher_updates)
    
    # Theme context updates  
    context_updates = generate_updated_theme_context()
    context_file = os.path.join(ts_output_dir, 'theme_context_updates.tsx')
    
    if not dry_run:
        with open(context_file, 'w', encoding='utf-8') as f:
            f.write(context_updates)
    
    click.echo(f"\n📝 Generated TypeScript updates:")
    click.echo(f"   📄 {switcher_file}")
    click.echo(f"   📄 {context_file}")
    
    click.echo(f"\n✅ Integration {'planned' if dry_run else 'completed'}!")
    
    if not dry_run:
        click.echo(f"\n📋 Next steps:")
        click.echo(f"   1. Copy organized theme files to your project")
        click.echo(f"   2. Update ThemeSwitcher.tsx with new theme definitions")  
        click.echo(f"   3. Update ThemeContext.tsx with new theme logic")
        click.echo(f"   4. Set 'theme-onyx' as your default theme")
        click.echo(f"   5. Test theme switching functionality")


if __name__ == '__main__':
    main()