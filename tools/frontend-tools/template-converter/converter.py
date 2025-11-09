#!/usr/bin/env python3
"""
Template Converter
Converts existing frontend files into template format with placeholders
"""

import os
import re
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse
import json


class TemplateConverter:
    """Converts frontend files to template format"""
    
    def __init__(self, source_dir: Path, output_dir: Path):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        
        # Placeholder mappings
        self.placeholder_mappings = {
            # Entity names (case variations)
            r'\bUser\b': '{entity_name}',
            r'\buser\b': '{entity_name_lower}',
            r'\bUSER\b': '{ENTITY_NAME_UPPER}',
            r'\busers\b': '{endpoint_name}',
            
            # Domain mappings
            r'user-management': '{domain}',
            r'authentication': '{domain}',
            r'gameplay': '{domain}',
            r'puzzles': '{domain}',
            r'learning': '{domain}',
            r'chess-theory': '{domain}',
            
            # Service names
            r'\buserService\b': '{endpoint_name}Service',
            r'\bUserService\b': '{entity_name}Service',
            
            # Hook names
            r'\buseUser\b': 'use{entity_name}',
            r'\buseAuth\b': 'use{entity_name}',
            
            # API endpoints
            r'/api/users': '/api/{endpoint_name}',
            r'/api/auth': '/api/{endpoint_name}',
            
            # File imports (relative paths)
            r'from [\'"]../types/user[\'"]': 'from \'../types/{domain}/{endpoint_name}\'',
            r'from [\'"]../services/userService[\'"]': 'from \'../services/{domain}/{endpoint_name}Service\'',
            r'from [\'"]../hooks/useUser[\'"]': 'from \'../hooks/{domain}/use{entity_name}\'',
        }
        
        # Files to skip (not suitable for templating)
        self.skip_files = {
            'index.css',
            'index.html',
            'vite.config.ts',
            'package.json',
            'package-lock.json',
            'tsconfig.json',
            'tailwind.config.js',
            '.gitignore',
            'README.md'
        }
        
        # Static architectural files that should NOT be converted to entity templates
        # These files are application-wide and not entity-specific
        self.static_files = {
            # Constants - application-wide configurations
            'apiConstants.ts',
            'appConstants.ts', 
            'routeConstants.ts',
            'themeConstants.ts',
            'validationConstants.ts',
            
            # Stores - global application state
            'appStore.ts',
            'authStore.ts',
            'themeStore.ts',
            'configStore.ts',
            'notificationStore.ts',
            
            # Utils - general utility functions
            'apiUtils.ts',
            'authUtils.ts', 
            'dateUtils.ts',
            'stringUtils.ts',
            'validationUtils.ts',
            'formatUtils.ts',
            'storageUtils.ts',
            
            # Providers - application-wide context providers
            'AppProvider.tsx',
            'AuthProvider.tsx',
            'ThemeProvider.tsx',
            'NotificationProvider.tsx',
            
            # Contexts - global contexts
            'AppContext.tsx',
            'AuthContext.tsx',
            'ThemeContext.tsx',
            
            # Action sheets and global UI
            'ActionSheetContainer.tsx',
            'ActionSheet.tsx',
            
            # Page action constants
            'page-actions.constants.ts',
            
            # App-level components
            'App.tsx',
            'Layout.tsx',
            'Router.tsx',
        }
        
        # Entity-specific patterns that SHOULD be converted to templates
        # These patterns indicate files that are specific to entities
        self.entity_specific_patterns = [
            # Entity management files
            r'.*Entity.*\.tsx?$',
            r'.*Manager.*\.tsx?$', 
            r'.*List.*\.tsx?$',
            r'.*Form.*\.tsx?$',
            r'.*Details?\.tsx?$',
            r'.*Card.*\.tsx?$',
            r'.*Item.*\.tsx?$',
            
            # Service files for specific entities
            r'.*Service\.ts$',
            r'.*Api\.ts$',
            
            # Entity-specific hooks
            r'use.*\.ts$',
            
            # Entity-specific types
            r'.*\.types?\.ts$',
            
            # Entity-specific components in domain folders
            r'.*/(?:user|product|order|game|puzzle|lesson)/.*\.tsx?$',
        ]
        
        # Directories to skip
        self.skip_dirs = {
            'node_modules',
            '.git',
            'dist',
            'build',
            '.next',
            'coverage'
        }
    
    def convert_all(self) -> None:
        """Convert all files in source directory"""
        print(f"🔄 Converting files from {self.source_dir} to {self.output_dir}")

        if not self.source_dir.exists():
            raise ValueError(f"Source directory does not exist: {self.source_dir}")

        # Clear output directory if it exists
        if self.output_dir.exists():
            print(f"🧹 Clearing existing templates directory...")
            shutil.rmtree(self.output_dir)

        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Process all files
        for root, dirs, files in os.walk(self.source_dir):
            # Skip certain directories
            dirs[:] = [d for d in dirs if d not in self.skip_dirs]
            
            root_path = Path(root)
            relative_root = root_path.relative_to(self.source_dir)
            
            for file in files:
                if file in self.skip_files:
                    continue
                
                source_file = root_path / file
                self.convert_file(source_file, relative_root)
    
    def convert_file(self, source_file: Path, relative_dir: Path) -> None:
        """Convert a single file to template format"""
        try:
            # Determine output path
            output_dir = self.output_dir / relative_dir
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Check if this file should be converted to entity template
            should_convert_to_entity = self.should_convert_to_entity_template(source_file)
            
            # Determine output filename
            output_filename = self.get_template_filename(source_file.name)
            output_file = output_dir / output_filename
            
            # Read source content
            with open(source_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Convert content based on file type
            if should_convert_to_entity:
                converted_content = self.convert_content(content, source_file)
                print(f"📝 Entity template: {relative_dir}/{source_file.name} -> {relative_dir}/{output_filename}")
            else:
                # Static file - minimal conversion, no entity placeholders
                converted_content = self.convert_static_content(content, source_file)
                print(f"📄 Static template: {relative_dir}/{source_file.name} -> {relative_dir}/{output_filename}")
            
            # Write template file
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(converted_content)
            
        except Exception as e:
            print(f"❌ Error converting {source_file}: {e}")
    
    def should_convert_to_entity_template(self, source_file: Path) -> bool:
        """Determine if file should be converted to entity template or remain static"""
        filename = source_file.name
        relative_path = str(source_file).replace(str(self.source_dir), "")
        
        # Static files are never converted to entity templates
        if filename in self.static_files:
            return False
        
        # Check if file matches entity-specific patterns
        for pattern in self.entity_specific_patterns:
            if re.match(pattern, filename) or re.search(pattern, relative_path):
                return True
        
        # Default: don't convert to entity template
        return False
    
    def convert_static_content(self, content: str, source_file: Path) -> str:
        """Convert static file content - minimal changes, no entity placeholders"""
        # For static files, we only do minimal conversions
        # Remove any specific entity references that might exist
        converted = content
        
        # Only convert actual hardcoded domain references to be more generic
        # But don't use entity placeholders
        converted = re.sub(r'user-management', 'authentication', converted)
        
        return converted
    
    def get_template_filename(self, filename: str) -> str:
        """Convert filename to template format"""
        # For TypeScript/React files, add .template extension
        if filename.endswith(('.ts', '.tsx', '.js', '.jsx')):
            return f"{filename}.template"
        
        # For other files (CSS, etc.), keep as-is but might add .template
        return f"{filename}.template"
    
    def convert_content(self, content: str, source_file: Path) -> str:
        """Convert file content with placeholders"""
        converted = content
        
        # Apply placeholder mappings
        for pattern, replacement in self.placeholder_mappings.items():
            converted = re.sub(pattern, replacement, converted)
        
        # Special handling for specific file types
        if source_file.suffix in ['.tsx', '.ts']:
            converted = self.convert_typescript_content(converted)
        elif source_file.suffix in ['.js', '.jsx']:
            converted = self.convert_javascript_content(converted)
        elif source_file.suffix == '.css':
            converted = self.convert_css_content(converted)
        
        return converted
    
    def convert_typescript_content(self, content: str) -> str:
        """Convert TypeScript-specific patterns"""
        # Convert interface names
        content = re.sub(r'interface\s+User(\w*)', r'interface {entity_name}\1', content)
        content = re.sub(r'interface\s+(\w*)User(\w*)', r'interface \1{entity_name}\2', content)
        
        # Convert type names
        content = re.sub(r':\s*User\b', r': {entity_name}', content)
        content = re.sub(r'<User>', r'<{entity_name}>', content)
        content = re.sub(r'User\[\]', r'{entity_name}[]', content)
        
        # Convert import statements
        content = re.sub(
            r'import\s*{([^}]+)}\s*from\s*[\'"]([^\'\"]*)/user[\'"]',
            r'import {\1} from \'\2/{domain}/{endpoint_name}\'',
            content
        )
        
        # Convert component names
        content = re.sub(r'const\s+User(\w+)', r'const {entity_name}\1', content)
        content = re.sub(r'function\s+User(\w+)', r'function {entity_name}\1', content)
        
        return content
    
    def convert_javascript_content(self, content: str) -> str:
        """Convert JavaScript-specific patterns"""
        # Similar to TypeScript but without type annotations
        content = re.sub(r'const\s+User(\w+)', r'const {entity_name}\1', content)
        content = re.sub(r'function\s+User(\w+)', r'function {entity_name}\1', content)
        
        return content
    
    def convert_css_content(self, content: str) -> str:
        """Convert CSS-specific patterns"""
        # Convert CSS class names
        content = re.sub(r'\.user-(\w+)', r'.{entity_name_lower}-\1', content)
        content = re.sub(r'#user-(\w+)', r'#{entity_name_lower}-\1', content)
        
        return content
    
    def create_conversion_map(self) -> Dict[str, str]:
        """Create a map of what was converted"""
        conversion_map = {
            "source_directory": str(self.source_dir),
            "output_directory": str(self.output_dir),
            "placeholder_mappings": self.placeholder_mappings,
            "converted_files": []
        }
        
        # This would be populated during conversion
        return conversion_map
    
    def generate_documentation(self) -> str:
        """Generate documentation for the conversion"""
        doc = f"""# Template Conversion Documentation

## Source Directory
{self.source_dir}

## Output Directory  
{self.output_dir}

## Placeholder Mappings
The following placeholders are used in the templates:

"""
        
        for pattern, replacement in self.placeholder_mappings.items():
            doc += f"- `{pattern}` → `{replacement}`\n"
        
        doc += """
## Usage
To use these templates with the frontend generator:

1. Place the template files in the appropriate template directories
2. Run the frontend generator with your entity configuration
3. The generator will replace placeholders with actual values

## Placeholder Variables
- `{entity_name}` - Pascal case entity name (e.g., "User", "Product")
- `{entity_name_lower}` - Lower case entity name (e.g., "user", "product")  
- `{ENTITY_NAME_UPPER}` - Upper case entity name (e.g., "USER", "PRODUCT")
- `{endpoint_name}` - API endpoint name (e.g., "users", "products")
- `{domain}` - Domain/category name (e.g., "user-management", "inventory")
"""
        
        return doc


def main():
    parser = argparse.ArgumentParser(description='Convert frontend files to templates')
    parser.add_argument('--source', type=str, required=True, help='Source directory path')
    parser.add_argument('--output', type=str, required=True, help='Output directory path')
    parser.add_argument('--docs', action='store_true', help='Generate documentation')
    
    args = parser.parse_args()
    
    try:
        converter = TemplateConverter(args.source, args.output)
        converter.convert_all()
        
        if args.docs:
            doc_content = converter.generate_documentation()
            doc_file = Path(args.output) / "CONVERSION_GUIDE.md"
            with open(doc_file, 'w', encoding='utf-8') as f:
                f.write(doc_content)
            print(f"📖 Documentation created: {doc_file}")
        
        print("✅ Conversion completed successfully!")
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())