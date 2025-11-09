"""
Main Frontend Generator
Orchestrates generation of all components from backend config
"""

import json
from pathlib import Path
from typing import Dict, Any

from generators.pages.pages_generator import PagesGenerator
from generators.hooks.hooks_generator import HooksGenerator
from generators.services.services_generator import ServicesGenerator
from generators.types.types_generator import TypesGenerator
from generators.components.components_generator import ComponentsGenerator
from core.advanced_barrel_generator import AdvancedBarrelGenerator


class FrontendGenerator:
    """Main generator that orchestrates all component generation"""
    
    def __init__(self, output_path: Path, config_path: Path, verbose: bool = False):
        self.output_path = output_path
        self.config_path = config_path
        self.verbose = verbose
        self.backend_config = None
        self.domain_mappings = None
        self.domain_mappings_path = Path(__file__).parent.parent / "config" / "domain-mappings.json"
        
        # Initialize generators
        self.pages_gen = PagesGenerator(output_path)
        self.hooks_gen = HooksGenerator(output_path) 
        self.services_gen = ServicesGenerator(output_path)
        self.types_gen = TypesGenerator(output_path)
        self.components_gen = ComponentsGenerator(output_path)
    
    def generate(self):
        """Generate all frontend components"""
        print("🚀 Starting frontend generation...")
        
        # Load backend config and domain mappings
        self._load_config()
        self._load_domain_mappings()
        
        # Extract endpoints
        endpoints = self.backend_config.get('endpoints', {})
        print(f"📊 Found {len(endpoints)} endpoints")
        
        # Generate components for each endpoint organized by domain
        for endpoint_name, endpoint_config in endpoints.items():
            print(f"\n🔧 Processing endpoint: {endpoint_name}")
            
            # Determine domain for this endpoint
            domain = self._get_domain_for_endpoint(endpoint_name)
            
            # Generate types
            self.types_gen.generate(endpoint_name, endpoint_config, domain)
            
            # Generate services (pass auth config)
            auth_config = self.backend_config.get('auth', {})
            self.services_gen.generate(endpoint_name, endpoint_config, domain, auth_config)
            
            # Generate hooks
            self.hooks_gen.generate(endpoint_name, endpoint_config, domain)
            
            # Generate pages
            self.pages_gen.generate(endpoint_name, endpoint_config, domain)
        
        # Generate components
        self.components_gen.generate_all_components()
        
        # Generate template-based services 
        self.services_gen.generate_template_services()
        
        # Generate static architectural files
        self._generate_static_files()
        
        # Generate barrel exports using centralized generator
        self._generate_all_barrels()
        
        print(f"\n✅ Generated frontend for {len(endpoints)} endpoints")
    
    def _load_config(self):
        """Load backend configuration file"""
        print(f"📖 Loading config from: {self.config_path}")
        
 
        
        with open(self.config_path, 'r') as f:
            self.backend_config = json.load(f)
        
        if self.verbose:
            print(f"🔍 Config loaded successfully")
    
    def _load_domain_mappings(self):
        """Load domain mappings configuration"""
        if not self.domain_mappings_path.exists():
            raise FileNotFoundError(f"Domain mappings file not found: {self.domain_mappings_path}")
        
        with open(self.domain_mappings_path, 'r') as f:
            domain_config = json.load(f)
            self.domain_mappings = domain_config.get('domain_mappings', {})
        
        if self.verbose:
            print(f"🔍 Domain mappings loaded successfully")
    
    def _get_domain_for_endpoint(self, endpoint_name: str) -> str:
        """Get domain from domain mappings config"""
        if endpoint_name not in self.domain_mappings:
            raise ValueError(f"Endpoint '{endpoint_name}' not found in domain mappings config")
            
        return self.domain_mappings[endpoint_name]
    
    def _generate_all_barrels(self):
        """Generate all barrel exports using advanced barrel generator"""
        print("🔧 Generating barrel exports with advanced system...")
        barrel_generator = AdvancedBarrelGenerator(self.output_path, verbose=self.verbose)
        
        # Analyze all TypeScript files
        self._analyze_all_files(barrel_generator)
        
        # Build comprehensive export registry
        barrel_generator.build_export_registry()
        
        # Detect and fix missing exports
        barrel_generator._detect_and_fix_missing_exports()
        
        # Fix type-only imports for verbatimModuleSyntax compatibility
        barrel_generator._fix_type_only_imports()
        
        # Generate barrels for all categories inside src
        categories = ['components', 'hooks', 'services', 'types', 'pages', 'utils', 'stores']
        for category in categories:
            category_path = self.output_path / "src" / category
            if category_path.exists():
                self._generate_category_barrels(barrel_generator, category_path, f"src/{category}")
        
        # Generate analysis report
        report = barrel_generator.generate_report()
        print(f"📊 Barrel generation complete: {report['statistics']['barrels_generated']} barrels, {report['statistics']['conflicts_detected']} conflicts")
        
        # Save detailed analysis report
        report_path = self.output_path.parent / "barrel_analysis_report.json"
        import json
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        print(f"📄 Analysis report saved to: {report_path}")
    
    def _analyze_all_files(self, barrel_generator):
        """Analyze all TypeScript files in the project"""
        print("🔍 Analyzing TypeScript files...")
        
        for ts_file in self.output_path.rglob("*.ts"):
            if ts_file.name != "index.ts":
                barrel_generator.analyze_file(ts_file)
                
        for tsx_file in self.output_path.rglob("*.tsx"):
            if tsx_file.name != "index.tsx":
                barrel_generator.analyze_file(tsx_file)
    
    def _generate_category_barrels(self, barrel_generator, category_path, category):
        """Generate barrel exports for a category using advanced generator"""
        # Generate subdirectory barrels first
        for subdir in category_path.iterdir():
            if subdir.is_dir() and not subdir.name.startswith('.'):
                barrel_content = barrel_generator.generate_barrel(subdir)
                barrel_file = subdir / "index.ts"
                with open(barrel_file, 'w', encoding='utf-8') as f:
                    f.write(barrel_content)
                print(f"📦 Created {category}/{subdir.name}/index.ts")
                
                # Recursively handle nested directories
                self._generate_nested_barrels(barrel_generator, subdir, f"{category}/{subdir.name}")
        
        # Generate main category barrel
        barrel_content = barrel_generator.generate_barrel(category_path)
        barrel_file = category_path / "index.ts"
        with open(barrel_file, 'w', encoding='utf-8') as f:
            f.write(barrel_content)
        print(f"📦 Created {category}/index.ts")
    
    def _generate_nested_barrels(self, barrel_generator, base_dir, base_path):
        """Recursively generate barrels for nested directories"""
        for subdir in base_dir.iterdir():
            if subdir.is_dir() and not subdir.name.startswith('.'):
                barrel_content = barrel_generator.generate_barrel(subdir)
                barrel_file = subdir / "index.ts"
                with open(barrel_file, 'w', encoding='utf-8') as f:
                    f.write(barrel_content)
                print(f"📦 Created {base_path}/{subdir.name}/index.ts")
                
                # Continue recursion
                self._generate_nested_barrels(barrel_generator, subdir, f"{base_path}/{subdir.name}")
    
    def _generate_static_files(self):
        """Generate static architectural files from templates"""
        print("🔧 Generating static architectural files...")

        template_base = Path(__file__).parent.parent / "templates"

        # Process root-level template files in static directory
        static_template_dir = template_base / "static"
        for template_file in static_template_dir.glob("*.template"):
            # Remove .template extension for output file
            output_filename = template_file.stem
            output_file = self.output_path / output_filename
            
            # Read template content
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Write static file (no template variable replacement needed for architectural files)
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"📝 Created {output_filename}")
                
            except Exception as e:
                print(f"❌ Error generating {template_file}: {e}")
        
        # Process static template directories (including src and public)
        static_dirs = ['src', 'public', 'types', 'hooks', 'pages', 'data', 'utils', 'services']

        for static_dir in static_dirs:
            template_dir = template_base / "static" / static_dir
            if not template_dir.exists():
                continue

            # Process all template files in the directory recursively
            for template_file in template_dir.rglob("*.template"):
                # Calculate relative path from template directory
                rel_path = template_file.relative_to(template_dir)

                # Remove .template extension for output file
                output_rel_path = rel_path.with_suffix('')
                if output_rel_path.suffix == '.template':
                    output_rel_path = output_rel_path.with_suffix('')

                # Create output file path
                output_file = self.output_path / static_dir / output_rel_path

                # Read template content
                try:
                    with open(template_file, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Write static file (no template variable replacement needed for architectural files)
                    output_file.parent.mkdir(parents=True, exist_ok=True)
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(content)

                    # Calculate relative path from base output for display
                    display_path = output_file.relative_to(self.output_path)
                    print(f"📝 Created {display_path}")

                except Exception as e:
                    print(f"❌ Error generating {template_file}: {e}")