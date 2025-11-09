"""
Types Generator
"""

from pathlib import Path
from generators.base_generator import BaseGenerator

class TypesGenerator(BaseGenerator):
    """Generates TypeScript type definitions"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
        self.template_dir = Path(__file__).parent.parent.parent / "templates"
        self.config_dir = Path(__file__).parent.parent.parent / "config" / "types"
        
    def generate_barrel_exports(self):
        """Generate barrel export files for types"""
        print("📦 Generating types barrel exports...")
        
        types_dir = self.output_path / "types"
        if not types_dir.exists():
            return
            
        # Generate main types index
        self._generate_main_types_barrel()
        
        # Generate domain-specific barrel exports
        for domain_dir in types_dir.iterdir():
            if domain_dir.is_dir() and domain_dir.name != "__pycache__":
                self._generate_domain_barrel(domain_dir)
    
    def _generate_main_types_barrel(self):
        """Generate main types/index.ts barrel export"""
        types_dir = self.output_path / "types"
        exports = ["// Barrel exports for types", ""]
        
        # Export from domain directories
        for domain_dir in sorted(types_dir.iterdir()):
            if domain_dir.is_dir() and domain_dir.name != "__pycache__":
                domain = domain_dir.name
                exports.append(f"// {domain.title()} types")
                exports.append(f"export * from './{domain}';")
                exports.append("")
        
        # Export common/shared types that might be in root
        for type_file in types_dir.glob("*.ts"):
            if type_file.name != "index.ts":
                type_name = type_file.stem
                exports.append(f"export * from './{type_name}';")
        
        if len(exports) > 2:  # More than just header
            index_content = "\n".join(exports)
            index_file = types_dir / "index.ts"
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(index_content)
            
            print(f"📦 Created types/index.ts")
    
    def _generate_domain_barrel(self, domain_dir: Path):
        """Generate barrel export for a domain directory"""
        domain = domain_dir.name
        exports = [f"// {domain.title()} types barrel export", ""]
        
        # Export all TypeScript files in the domain
        for type_file in domain_dir.glob("*.ts"):
            if type_file.name != "index.ts":
                type_name = type_file.stem
                exports.append(f"export * from './{type_name}';")
        
        if len(exports) > 2:  # More than just header
            index_content = "\n".join(exports)
            index_file = domain_dir / "index.ts"
            
            with open(index_file, 'w', encoding='utf-8') as f:
                f.write(index_content)
            
            print(f"📦 Created types/{domain}/index.ts")
    
    def generate(self, endpoint_name: str, endpoint_config: dict, domain: str = 'other'):
        """Generate TypeScript types from backend config"""
        print(f"📋 Generating types: {endpoint_name} (domain: {domain})")
        
        # Check for named template first
        named_template = self.template_dir / "named" / "types" / f"{endpoint_name}.ts.template"
        if named_template.exists():
            print(f"📝 Using named template: {endpoint_name}.ts.template")
            self._generate_from_named_template(endpoint_name, endpoint_config, domain, named_template)
        else:
            # Generate from config using configuration-driven approach
            entity_name = endpoint_config.get('entity', endpoint_name.capitalize())
            properties = endpoint_config.get('properties', {})
            
            # Generate type definitions
            type_content = self._generate_types(entity_name, properties)
            
            # Write types file organized by domain inside src
            output_dir = self.output_path / "src" / "types" / domain
            camel_endpoint = self._snake_to_camel(endpoint_name)
            output_file = output_dir / f"{camel_endpoint}.ts"
            
            self.write_file(output_file, type_content)
    
    def _generate_types(self, entity_name: str, properties: dict) -> str:
        """Generate TypeScript type definitions from template"""
        # Try to read from template file
        template_path = self.template_dir / "entityTypes.ts.template"
        
        if template_path.exists():
            try:
                with open(template_path, 'r', encoding='utf-8') as f:
                    template_content = f.read()
                
                # Apply template substitutions
                content = template_content
                content = content.replace('{entity_name}', entity_name)
                content = content.replace('{entity_name_lower}', entity_name.lower())
                content = content.replace('{ENTITY_NAME_UPPER}', entity_name.upper())
                
                return content
            except Exception as e:
                print(f"⚠️ Error reading types template: {e}, falling back to hardcoded")
        
        # Fallback to hardcoded template
        # Convert properties to TypeScript types - use ONLY what's in the config
        ts_properties = []
        
        for prop_name, prop_type in properties.items():
            ts_type = self._map_type(prop_type)
            ts_properties.append(f"  {prop_name}: {ts_type};")
        
        properties_str = "\n".join(ts_properties)
        
        return f"""// Generated types for {entity_name}

export interface {entity_name} {{
{properties_str}
}}

export interface {entity_name}Create {{
  // Properties needed for creating new {entity_name}
{properties_str}
}}

export interface {entity_name}Update {{
  // Properties that can be updated
{properties_str}
}}

export interface {entity_name}Filter {{
  // Properties for filtering/searching
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}}

export default {entity_name};"""
    
    def _generate_from_named_template(self, endpoint_name: str, endpoint_config: dict, domain: str, template_path: Path):
        """Generate types from a named template"""
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # Write to the domain-specific types directory
            output_dir = self.output_path / "types" / domain
            camel_endpoint = self._snake_to_camel(endpoint_name)
            output_file = output_dir / f"{camel_endpoint}.ts"
            
            self.write_file(output_file, template_content)
            
        except Exception as e:
            print(f"❌ Error generating from named template {template_path}: {e}")
    
    def _map_type(self, backend_type: str) -> str:
        """Map backend types to TypeScript types"""
        type_mapping = {
            'string': 'string',
            'number': 'number', 
            'boolean': 'boolean',
            'object': 'any',
            'array': 'any[]'
        }
        return type_mapping.get(backend_type, 'any')
    
    def _snake_to_camel(self, snake_str: str) -> str:
        """Convert snake_case to camelCase"""
        components = snake_str.split('_')
        return components[0] + ''.join(word.capitalize() for word in components[1:])