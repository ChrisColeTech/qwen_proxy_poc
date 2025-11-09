"""
Pages Generator
"""

from pathlib import Path
from typing import Dict, Any, Optional, List
from generators.base_generator import BaseGenerator

class PagesGenerator(BaseGenerator):
    """Generates page components with template support"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
        self.template_dir = Path(__file__).parent.parent.parent / "templates"
        self.config_dir = Path(__file__).parent.parent.parent / "config" / "pages"
        
        # Available templates
        self.templates = {
            'list': 'list_page.tsx.template',
            'layout': 'layout_page.tsx.template', 
            'mobile': 'mobile_page.tsx.template'
        }
    
    def generate(self, endpoint_name: str, endpoint_config: dict, domain: str = 'other'):
        """Generate page components from backend config"""
        print(f"📄 Generating pages: {endpoint_name} (domain: {domain})")
        
        # Check for named template first (allow for special routing entities)
        named_template = self.template_dir / "named" / "pages" / f"{endpoint_name}.tsx.template"
        if named_template.exists():
            print(f"📝 Using named template: {endpoint_name}.tsx.template")
            self._generate_from_named_template(endpoint_name, endpoint_config, domain, named_template)
            return
        
        # Skip dynamic generation for endpoints with special routing (e.g., auth)
        if endpoint_config.get('special_routing', False):
            print(f"⏭️  Skipping dynamic page generation for {endpoint_name} (special routing)")
            return

        # Generate from config using configuration-driven approach
        entity_name = endpoint_config.get('entity', endpoint_name.capitalize())
        page_config = endpoint_config.get('pages', {})

        # Generate different page variants based on config
        templates_to_generate = self._determine_templates(page_config)

        for template_type in templates_to_generate:
            page_content = self._generate_page(entity_name, endpoint_name, domain, template_type)

            # Write page file with appropriate suffix inside src
            output_dir = self.output_path / "src" / "pages" / domain
            suffix = self._get_page_suffix(template_type)
            output_file = output_dir / f"{entity_name}{suffix}.tsx"

            self.write_file(output_file, page_content)
            print(f"  ✅ Generated {template_type} page: {output_file.name}")
    
    def _determine_templates(self, page_config: Dict[str, Any]) -> List[str]:
        """Determine which templates to generate based on config"""
        templates = ['list']  # Always generate basic list page
        
        # Check config flags - default to False, only generate if explicitly enabled
        if page_config.get('enable_layout', False):
            templates.append('layout')
            
        if page_config.get('enable_mobile', False):
            templates.append('mobile')
            
        return templates
    
    def _get_page_suffix(self, template_type: str) -> str:
        """Get appropriate suffix for different template types"""
        suffixes = {
            'list': 'Page',
            'layout': 'LayoutPage', 
            'mobile': 'MobilePage'
        }
        return suffixes.get(template_type, 'Page')
    
    def _generate_page(self, entity_name: str, endpoint_name: str, domain: str = 'other', template_type: str = 'list') -> str:
        """Generate page component content from template"""
        # Get template filename
        template_filename = self.templates.get(template_type, 'list_page.tsx.template')
        template_path = self.template_dir / "dynamic" / "pages" / template_filename
        
        if template_path.exists():
            try:
                with open(template_path, 'r', encoding='utf-8') as f:
                    template_content = f.read()
                
                # Apply template substitutions
                content = template_content
                content = content.replace('{entity_name}', entity_name)
                content = content.replace('{entity_name_lower}', entity_name.lower())
                content = content.replace('{endpoint_name}', endpoint_name)
                content = content.replace('{domain}', domain)
                
                return content
            except Exception as e:
                print(f"⚠️ Error reading {template_type} template: {e}, falling back to hardcoded")
        
        # Fallback to hardcoded template based on type
        return self._get_fallback_template(entity_name, endpoint_name, domain, template_type)
    
    def _get_fallback_template(self, entity_name: str, endpoint_name: str, domain: str, template_type: str) -> str:
        """Get hardcoded fallback template for different types"""
        if template_type == 'mobile':
            return self._get_mobile_fallback(entity_name, endpoint_name, domain)
        elif template_type == 'layout':
            return self._get_layout_fallback(entity_name, endpoint_name, domain)
        else:
            return self._get_list_fallback(entity_name, endpoint_name, domain)
    
    def _get_list_fallback(self, entity_name: str, endpoint_name: str, domain: str) -> str:
        """Get fallback template for list page"""
        return f"""import React from 'react';
import {{ use{entity_name} }} from '../../hooks/{domain}/use{entity_name}';

export const {entity_name}Page = () => {{
  const {{ {entity_name.lower()}s, loading, error }} = use{entity_name}();

  if (loading) {{
    return <div className="loading">Loading {entity_name.lower()}s...</div>;
  }}

  if (error) {{
    return <div className="error">Error: {{error}}</div>;
  }}

  return (
    <div className="{endpoint_name}-page">
      <h1>{entity_name} Management</h1>
      <div className="{entity_name.lower()}-list">
        {{({entity_name.lower()}s || []).map((item) => (
          <div key={{item.id}} className="{entity_name.lower()}-item">
            <h3>{{item.id}}</h3>
          </div>
        ))}}
      </div>
    </div>
  );
}};

export default {entity_name}Page;"""
    
    def _generate_from_named_template(self, endpoint_name: str, endpoint_config: dict, domain: str, template_path: Path):
        """Generate page from a named template"""
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # Write to the domain-specific pages directory
            output_dir = self.output_path / "pages" / domain
            entity_name = endpoint_config.get('entity', endpoint_name.capitalize())
            output_file = output_dir / f"{entity_name}Page.tsx"
            
            self.write_file(output_file, template_content)
            
        except Exception as e:
            print(f"❌ Error generating from named template {template_path}: {e}")
    
    def _get_layout_fallback(self, entity_name: str, endpoint_name: str, domain: str) -> str:
        """Get fallback template for layout page"""
        return f"""import React from 'react';
import {{ use{entity_name} }} from '../../hooks/{domain}/use{entity_name}';
import {{ useResponsive }} from '../../hooks/core/useResponsive';

export const {entity_name}LayoutPage = () => {{
  const {{ {entity_name.lower()}s, loading, error }} = use{entity_name}();
  const {{ isMobile }} = useResponsive();

  if (loading) {{
    return <div className="layout-loading">Loading {entity_name.lower()}s...</div>;
  }}

  if (error) {{
    return <div className="layout-error">Error: {{error}}</div>;
  }}

  return (
    <div className={{`layout-page {endpoint_name}-layout-page ${{isMobile ? 'mobile' : 'desktop'}}`}}>
      <h1>{entity_name} Layout</h1>
      <div className="{entity_name.lower()}-layout">
        {{({entity_name.lower()}s || []).map((item) => (
          <div key={{item.id}} className="{entity_name.lower()}-layout-item">
            <h3>{{item.id}}</h3>
          </div>
        ))}}
      </div>
    </div>
  );
}};

export default {entity_name}LayoutPage;"""
    
    def _get_mobile_fallback(self, entity_name: str, endpoint_name: str, domain: str) -> str:
        """Get fallback template for mobile page"""
        return f"""import React from 'react';
import {{ use{entity_name} }} from '../../hooks/{domain}/use{entity_name}';

export const {entity_name}MobilePage = () => {{
  const {{ {entity_name.lower()}s, loading, error }} = use{entity_name}();

  if (loading) {{
    return (
      <div className="mobile-loading">
        <div className="mobile-spinner">Loading {entity_name.lower()}s...</div>
      </div>
    );
  }}

  if (error) {{
    return (
      <div className="mobile-error">
        <h2>Error</h2>
        <p>{{error}}</p>
      </div>
    );
  }}

  return (
    <div className="mobile-page {endpoint_name}-mobile-page">
      <div className="mobile-header">
        <h1>{entity_name}</h1>
      </div>
      <div className="mobile-content">
        <div className="{entity_name.lower()}-mobile-list">
          {{({entity_name.lower()}s || []).map((item) => (
            <div key={{item.id}} className="{entity_name.lower()}-mobile-item">
              <h3>{{item.id}}</h3>
            </div>
          ))}}
        </div>
      </div>
    </div>
  );
}};

export default {entity_name}MobilePage;"""