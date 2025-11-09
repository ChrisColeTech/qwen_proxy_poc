"""
Components Generator - Template-based
"""

from pathlib import Path
from generators.base_generator import BaseGenerator

class ComponentsGenerator(BaseGenerator):
    """Generates React components from template files"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
        self.template_dir = Path(__file__).parent.parent.parent / "templates" / "static" / "components"
        self.config_dir = Path(__file__).parent.parent.parent / "config" / "components"
    
    def generate_all_components(self):
        """Generate all component categories from templates"""
        print("🧩 Generating components from templates...")
        
        # Generate all available component categories dynamically
        if self.template_dir.exists():
            for category_dir in sorted(self.template_dir.iterdir()):
                if category_dir.is_dir():
                    category_name = category_dir.name
                    self._generate_category(category_name)
        
        # Generate root-level architectural folders (not under components/)
        self._generate_root_level("contexts")
        self._generate_root_level("providers") 
        self._generate_root_level("stores")
        self._generate_root_level("constants")
        self._generate_root_level("utils")
        
        # Generate lib directory
        self._generate_lib()
        
        # Generate barrel exports
        self._generate_components_barrel()
    
    def _generate_lib(self):
        """Generate lib directory from templates"""
        print("📚 Generating lib...")
        
        # Look for lib templates at the root template level, not under components
        lib_template_dir = self.template_dir.parent / "lib"
        lib_output_dir = self.output_path / "lib"
        
        if lib_template_dir.exists():
            self._process_template_directory(lib_template_dir, lib_output_dir, "lib")
        else:
            print("⚠️ No lib templates found")
    
    def _generate_category(self, category: str):
        """Generate components for a specific category"""
        print(f"📁 Generating {category} components...")
        
        category_template_dir = self.template_dir / category
        category_output_dir = self.output_path / "components" / category
        
        if not category_template_dir.exists():
            print(f"⚠️ No template directory found for {category}")
            return
        
        # Process all template files in category
        self._process_template_directory(category_template_dir, category_output_dir, f"components/{category}")
    
    def _generate_root_level(self, category: str):
        """Generate root-level directories (contexts, providers, stores, etc.)"""
        print(f"📁 Generating {category}...")
        
        # Look for templates at root template level
        root_template_dir = self.template_dir.parent / category
        root_output_dir = self.output_path / category
        
        if not root_template_dir.exists():
            print(f"⚠️ No template directory found for {category}")
            return
        
        # Process all template files in category
        self._process_template_directory(root_template_dir, root_output_dir, category)
    
    
    def _process_template_directory(self, template_dir: Path, output_dir: Path, category: str):
        """Process all templates in a directory recursively"""
        if not template_dir.exists():
            return
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        for item in template_dir.iterdir():
            if item.is_file():
                self._process_template_file(item, output_dir, category)
            elif item.is_dir():
                # Recursively process subdirectories
                sub_output_dir = output_dir / item.name
                self._process_template_directory(item, sub_output_dir, f"{category}/{item.name}")
    
    def _process_template_file(self, template_file: Path, output_dir: Path, category: str):
        """Process a single template file"""
        try:
            # Read template content
            with open(template_file, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # Determine output filename
            output_filename = template_file.name
            if template_file.suffix == '.template':
                # Remove .template extension
                output_filename = template_file.stem
            
            # Apply any template processing here
            processed_content = self._apply_template_variables(template_content, template_file.name)
            
            # Write output file
            output_file = output_dir / output_filename
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(processed_content)
            
            print(f"📝 Created {category}/{output_filename}")
            
        except Exception as e:
            print(f"❌ Error processing template {template_file.name}: {e}")
    
    def _apply_template_variables(self, content: str, template_name: str) -> str:
        """Apply template variable substitution"""
        # Architectural files should be used as-is without placeholder replacement
        # They are application-wide, not entity-specific
        
        # These categories contain static files that should not have placeholder replacement
        static_categories = [
            'constants', 'stores', 'utils', 'providers', 'contexts', 
            'components', 'lib'  # Component files are also complete and static
        ]
        
        # Check if this is a static file that shouldn't have placeholder replacement
        for static_category in static_categories:
            if static_category in template_name.lower():
                return content
        
        # For other files, return as-is (no placeholder replacement needed)
        return content
    
    def _detect_export_type(self, file_path: Path) -> str:
        """Detect whether a file uses default or named exports"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Count default exports
            default_export_count = content.count('export default')
            
            # If multiple default exports, it's likely an error - treat as mixed/named
            if default_export_count > 1:
                print(f"⚠️ Warning: {file_path.name} has {default_export_count} default exports, treating as mixed exports")
                return 'mixed'
            
            # Check for default export patterns
            if 'export default' in content:
                return 'default'
            
            # Check for named exports (const/function followed by export)
            if ('export const' in content or 
                'export function' in content or 
                'export interface' in content or
                'export {' in content):
                return 'named'
            
            # Default to default export if unclear
            return 'default'
        except:
            return 'default'
    
    def _generate_components_barrel(self):
        """Generate barrel export for components"""
        print("📦 Generating components barrel exports...")
        
        components_dir = self.output_path / "components"
        if not components_dir.exists():
            return
        
        main_exports = ["// Barrel exports for components", ""]
        
        # Generate exports for each category dynamically
        for category_dir in sorted(components_dir.iterdir()):
            if category_dir.is_dir():
                category = category_dir.name
                
                # Generate category-level barrel file first
                self._generate_category_barrel(category_dir, category)
                
                # Add to main barrel file - export from category barrel
                main_exports.append(f"// {category.title()} components")
                main_exports.append(f"export * from './{category}';")
                main_exports.append("")
        
        if len(main_exports) > 2:  # More than just the header
            index_content = "\n".join(main_exports)
            index_file = components_dir / "index.ts"
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(index_content)
            
            print(f"📦 Created components/index.ts")
    
    def _generate_category_barrel(self, category_dir: Path, category: str):
        """Generate barrel export for a component category"""
        category_exports = [f"// {category.title()} barrel export", ""]
        
        # Export all TypeScript/React files in the category
        for file_path in category_dir.glob("*.tsx"):
            component_name = file_path.stem
            export_type = self._detect_export_type(file_path)
            
            if export_type == 'default':
                category_exports.append(f"export {{ default as {component_name} }} from './{component_name}';")
            elif export_type == 'mixed':
                # For mixed exports (multiple defaults), export everything
                category_exports.append(f"export * from './{component_name}';")
            else:
                # For named exports, export everything
                category_exports.append(f"export * from './{component_name}';")
        
        for file_path in category_dir.glob("*.ts"):
            if file_path.name != "index.ts":
                component_name = file_path.stem
                category_exports.append(f"export * from './{component_name}';")
        
        if len(category_exports) > 2:  # More than just the header
            index_content = "\n".join(category_exports)
            index_file = category_dir / "index.ts"
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(index_content)
            
            print(f"📦 Created components/{category}/index.ts")