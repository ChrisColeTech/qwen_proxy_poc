#!/usr/bin/env python3
"""
Theme Color Generator Tool

Automatically generates and updates CSS theme variables based on existing primary/secondary colors.
Reads theme CSS files, generates color variations, and randomly assigns them to themes.

Usage:
    python theme_color_generator.py --variable "--titlebar-hover"
    python theme_color_generator.py --variable "--some-new-color" --backup
"""

import re
import argparse
import random
import colorsys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import shutil


class ColorGenerator:
    """Generates color variations based on base colors"""
    
    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 6:
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        return (0, 0, 0)
    
    @staticmethod
    def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
        """Convert RGB tuple to hex color"""
        return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
    
    @staticmethod
    def rgb_to_hsl(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
        """Convert RGB to HSL"""
        r, g, b = [x/255.0 for x in rgb]
        return colorsys.rgb_to_hls(r, g, b)
    
    @staticmethod
    def hsl_to_rgb(hsl: Tuple[float, float, float]) -> Tuple[int, int, int]:
        """Convert HSL to RGB"""
        h, l, s = hsl
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        return (int(r * 255), int(g * 255), int(b * 255))
    
    @classmethod
    def parse_color_to_rgb(cls, color: str) -> Tuple[int, int, int]:
        """Parse various color formats to RGB"""
        color = color.strip()
        
        # Handle hex colors
        if color.startswith('#'):
            return cls.hex_to_rgb(color)
        
        # Handle rgb() colors
        if color.startswith('rgb(') and color.endswith(')'):
            rgb_values = color[4:-1].split(',')
            if len(rgb_values) == 3:
                try:
                    return (int(rgb_values[0].strip()), int(rgb_values[1].strip()), int(rgb_values[2].strip()))
                except ValueError:
                    return (204, 204, 204)  # fallback
        
        # Handle rgba() colors (ignore alpha)
        if color.startswith('rgba(') and color.endswith(')'):
            rgba_values = color[5:-1].split(',')
            if len(rgba_values) >= 3:
                try:
                    return (int(float(rgba_values[0].strip())), int(float(rgba_values[1].strip())), int(float(rgba_values[2].strip())))
                except ValueError:
                    return (204, 204, 204)  # fallback
        
        # For other formats (hsl, complex values), return neutral gray
        return (204, 204, 204)
    
    @classmethod
    def generate_variations(cls, base_color: str, count: int = 2, output_format: str = 'hex', opacity: Optional[float] = None) -> List[str]:
        """Generate color variations based on a base color"""
        if not base_color:
            if opacity is not None:
                fallback = f"rgba(204, 204, 204, {opacity})"
            else:
                fallback = "#cccccc" if output_format == 'hex' else f"rgb(204, 204, 204)" if output_format == 'rgb' else "hsl(0, 0%, 80%)"
            return [fallback] * count
            
        rgb = cls.parse_color_to_rgb(base_color)
        h, l, s = cls.rgb_to_hsl(rgb)
        
        variations = []
        
        # Generate variations by adjusting lightness and saturation
        for i in range(count):
            # Vary lightness by ±0.1 to ±0.3
            lightness_delta = random.uniform(-0.3, 0.3)
            new_l = max(0.0, min(1.0, l + lightness_delta))
            
            # Vary saturation by ±0.1 to ±0.2
            saturation_delta = random.uniform(-0.2, 0.2)
            new_s = max(0.0, min(1.0, s + saturation_delta))
            
            # Keep hue similar but allow slight variation
            hue_delta = random.uniform(-0.05, 0.05)
            new_h = (h + hue_delta) % 1.0
            
            new_rgb = cls.hsl_to_rgb((new_h, new_l, new_s))
            
            # Format output based on requested format
            if output_format == 'hex':
                if opacity is not None:
                    # Convert hex to rgba for opacity
                    variations.append(f'rgba({new_rgb[0]}, {new_rgb[1]}, {new_rgb[2]}, {opacity})')
                else:
                    variations.append(cls.rgb_to_hex(new_rgb))
            elif output_format == 'rgb':
                if opacity is not None:
                    variations.append(f'rgba({new_rgb[0]}, {new_rgb[1]}, {new_rgb[2]}, {opacity})')
                else:
                    variations.append(f'rgb({new_rgb[0]}, {new_rgb[1]}, {new_rgb[2]})')
            elif output_format == 'hsl':
                if opacity is not None:
                    variations.append(f'hsla({int(new_h * 360)}, {int(new_s * 100)}%, {int(new_l * 100)}%, {opacity})')
                else:
                    variations.append(f'hsl({int(new_h * 360)}, {int(new_s * 100)}%, {int(new_l * 100)}%)')
            else:
                # Default to hex
                if opacity is not None:
                    variations.append(f'rgba({new_rgb[0]}, {new_rgb[1]}, {new_rgb[2]}, {opacity})')
                else:
                    variations.append(cls.rgb_to_hex(new_rgb))
        
        return variations


class ThemeUpdater:
    """Updates CSS theme files with new variables"""
    
    def __init__(self, professional_file: Path, gaming_file: Path, output_format: str = 'hex', opacity: Optional[float] = None, base_color: Optional[str] = None):
        self.professional_file = professional_file
        self.gaming_file = gaming_file
        self.color_gen = ColorGenerator()
        self.output_format = output_format
        self.opacity = opacity
        self.base_color = base_color
    
    def backup_files(self) -> None:
        """Create backup copies of the CSS files"""
        shutil.copy2(self.professional_file, f"{self.professional_file}.backup")
        shutil.copy2(self.gaming_file, f"{self.gaming_file}.backup")
        print(f"✅ Created backups:")
        print(f"   {self.professional_file}.backup")
        print(f"   {self.gaming_file}.backup")
    
    def extract_theme_colors(self, content: str, theme_name: str) -> Dict[str, str]:
        """Extract primary, secondary, and background colors from a theme block"""
        # Find the theme block
        theme_pattern = rf'\.{re.escape(theme_name)}\s*\{{([^}}]+)}}'
        match = re.search(theme_pattern, content, re.DOTALL)
        
        if not match:
            return {}
        
        theme_content = match.group(1)
        
        # Extract primary, secondary, and background colors
        colors = {}
        primary_match = re.search(r'--primary:\s*([^;]+);', theme_content)
        secondary_match = re.search(r'--secondary:\s*([^;]+);', theme_content)
        background_match = re.search(r'--background:\s*([^;]+);', theme_content)
        
        if primary_match:
            colors['primary'] = primary_match.group(1).strip()
        if secondary_match:
            colors['secondary'] = secondary_match.group(1).strip()
        if background_match:
            colors['background'] = background_match.group(1).strip()
            
        return colors
    
    def find_all_themes(self, content: str) -> List[str]:
        """Find all theme class names in the CSS content"""
        theme_pattern = r'\.(theme-[^{\s]+)\s*\{'
        matches = re.findall(theme_pattern, content)
        
        # Filter to actual theme classes and clean them up
        themes = []
        for match in matches:
            theme = match.strip()
            # Skip comments or any malformed matches
            if theme.startswith('theme-') and not theme.startswith('/*'):
                themes.append(theme)
        
        return list(set(themes))  # Remove duplicates
    
    def generate_color_for_theme(self, theme_colors: Dict[str, str]) -> str:
        """Generate a random color based on theme's primary/secondary colors"""
        if not theme_colors:
            # Fallback to a neutral color if no colors found
            return "#cccccc"
        
        all_variations = []
        
        # Determine which base color to use
        if self.base_color == 'primary':
            if 'primary' in theme_colors:
                primary_variations = self.color_gen.generate_variations(theme_colors['primary'], 2, self.output_format, self.opacity)
                all_variations.extend(primary_variations)
        elif self.base_color == 'secondary':
            if 'secondary' in theme_colors:
                secondary_variations = self.color_gen.generate_variations(theme_colors['secondary'], 2, self.output_format, self.opacity)
                all_variations.extend(secondary_variations)
        elif self.base_color == 'background':
            if 'background' in theme_colors:
                background_variations = self.color_gen.generate_variations(theme_colors['background'], 2, self.output_format, self.opacity)
                all_variations.extend(background_variations)
        else:
            # Default behavior: use both primary and secondary colors
            if 'primary' in theme_colors:
                primary_variations = self.color_gen.generate_variations(theme_colors['primary'], 2, self.output_format, self.opacity)
                all_variations.extend(primary_variations)
            
            if 'secondary' in theme_colors:
                secondary_variations = self.color_gen.generate_variations(theme_colors['secondary'], 2, self.output_format, self.opacity)
                all_variations.extend(secondary_variations)
        
        # If no valid variations, return a default in the requested format
        if not all_variations:
            if self.opacity is not None:
                return f"rgba(204, 204, 204, {self.opacity})"
            elif self.output_format == 'hex':
                return "#cccccc"
            elif self.output_format == 'rgb':
                return "rgb(204, 204, 204)"
            elif self.output_format == 'hsl':
                return "hsl(0, 0%, 80%)"
            else:
                return "#cccccc"
        
        # Return a random variation
        return random.choice(all_variations)
    
    def update_variable_in_theme(self, content: str, theme_name: str, 
                                variable: str, color: str) -> str:
        """Update or add a CSS variable in a specific theme"""
        variable_clean = variable.lstrip('-')
        variable_pattern = rf'(--{re.escape(variable_clean)}:\s*[^;]+;)'
        
        # Find the theme block - match properly with single closing brace
        theme_pattern = r'(\.' + re.escape(theme_name) + r'\s*\{[^}]*\})'
        theme_match = re.search(theme_pattern, content, re.DOTALL)
        
        if not theme_match:
            print(f"⚠️  Theme {theme_name} not found")
            return content
        
        theme_block = theme_match.group(1)
        
        # Check if variable already exists in this theme
        if re.search(variable_pattern, theme_block):
            # Update existing variable
            new_theme_block = re.sub(variable_pattern, f'--{variable_clean}: {color};', theme_block)
            print(f"   📝 Updated {variable} in {theme_name}: {color}")
        else:
            # Add new variable (before the closing brace)
            # Ensure proper formatting with newline and indentation
            lines = theme_block.rstrip('}').rstrip()
            new_theme_block = lines + f'\n  --{variable_clean}: {color};\n' + '}'
            print(f"   ➕ Added {variable} to {theme_name}: {color}")
        
        # Replace the theme block in the content
        return content.replace(theme_block, new_theme_block)
    
    def process_file(self, file_path: Path, variable: str) -> None:
        """Process a single CSS file to update the variable"""
        print(f"\n🔄 Processing {file_path.name}...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find all themes in the file
        themes = self.find_all_themes(content)
        print(f"   Found {len(themes)} themes: {', '.join(themes)}")
        
        updated_content = content
        
        for theme in themes:
            # Extract colors from this theme
            theme_colors = self.extract_theme_colors(content, theme)
            
            # Generate a color for this theme
            generated_color = self.generate_color_for_theme(theme_colors)
            
            # Update the theme with the new variable
            updated_content = self.update_variable_in_theme(
                updated_content, theme, variable, generated_color
            )
        
        # Ensure the content ends with a single newline
        if not updated_content.endswith('\n'):
            updated_content += '\n'
        
        # Write the updated content back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"✅ Updated {file_path.name}")
    
    def update_variable(self, variable: str, backup: bool = True) -> None:
        """Update a CSS variable across all themes in both files"""
        if backup:
            self.backup_files()
        
        print(f"\n🎨 Updating variable: {variable}")
        
        # Process both CSS files
        self.process_file(self.professional_file, variable)
        self.process_file(self.gaming_file, variable)
        
        print(f"\n🎉 Successfully updated {variable} across all themes!")
    
    def update_variables(self, variables: List[str], backup: bool = True) -> None:
        """Update multiple CSS variables across all themes in both files"""
        if backup:
            self.backup_files()
        
        print(f"\n🎨 Updating {len(variables)} variables: {', '.join(variables)}")
        
        for variable in variables:
            print(f"\n📝 Processing variable: {variable}")
            
            # Process both CSS files for this variable
            self.process_file(self.professional_file, variable)
            self.process_file(self.gaming_file, variable)
        
        print(f"\n🎉 Successfully updated all {len(variables)} variables across all themes!")


def main():
    parser = argparse.ArgumentParser(
        description="Generate and update CSS theme variables with colors based on primary/secondary colors"
    )
    parser.add_argument(
        '--variable', 
        action='append',
        help='CSS variable name to update (e.g., "--titlebar-hover"). Can be used multiple times.'
    )
    parser.add_argument(
        '--variables',
        type=str,
        help='Comma-separated list of CSS variables (e.g., "--titlebar-hover,--button-bg,--card-border")'
    )
    parser.add_argument(
        '--backup', 
        action='store_true',
        help='Create backup files before updating (recommended)'
    )
    parser.add_argument(
        '--professional-file',
        type=Path,
        default=Path('../src/styles/organized_themes/themes-professional.css'),
        help='Path to professional themes CSS file'
    )
    parser.add_argument(
        '--gaming-file', 
        type=Path,
        default=Path('../src/styles/organized_themes/themes-gaming.css'),
        help='Path to gaming themes CSS file'
    )
    parser.add_argument(
        '--output-format',
        choices=['hex', 'rgb', 'hsl'],
        default='hex',
        help='Output color format (default: hex)'
    )
    parser.add_argument(
        '--opacity',
        type=float,
        help='Opacity value between 0.0 and 1.0 (e.g., 0.5 for 50%% transparency)'
    )
    parser.add_argument(
        '--base-color',
        choices=['primary', 'secondary', 'background'],
        help='Which base color to use for variations (default: randomly choose from primary and secondary)'
    )
    
    args = parser.parse_args()
    
    # Validate opacity value
    if args.opacity is not None:
        if not 0.0 <= args.opacity <= 1.0:
            print("❌ Error: Opacity must be between 0.0 and 1.0")
            return
    
    # Collect all variables from both sources
    variables = []
    
    # Add variables from --variable flags (can be used multiple times)
    if args.variable:
        variables.extend(args.variable)
    
    # Add variables from --variables comma-separated list
    if args.variables:
        csv_variables = [v.strip() for v in args.variables.split(',') if v.strip()]
        variables.extend(csv_variables)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_variables = []
    for var in variables:
        if var not in seen:
            seen.add(var)
            unique_variables.append(var)
    
    if not unique_variables:
        print("❌ No variables specified. Use --variable or --variables.")
        return 1
    
    # Resolve paths relative to script location
    script_dir = Path(__file__).parent
    professional_file = script_dir / args.professional_file
    gaming_file = script_dir / args.gaming_file
    
    # Verify files exist
    if not professional_file.exists():
        print(f"❌ Professional themes file not found: {professional_file}")
        return 1
    
    if not gaming_file.exists():
        print(f"❌ Gaming themes file not found: {gaming_file}")
        return 1
    
    # Create updater and run
    updater = ThemeUpdater(professional_file, gaming_file, args.output_format, args.opacity, args.base_color)
    try:
        updater.update_variables(unique_variables, args.backup)
        return 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


if __name__ == '__main__':
    exit(main())