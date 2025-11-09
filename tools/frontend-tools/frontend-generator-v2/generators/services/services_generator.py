"""
Services Generator
"""

from pathlib import Path
from generators.base_generator import BaseGenerator

class ServicesGenerator(BaseGenerator):
    """Generates service classes"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
        self.template_dir = Path(__file__).parent.parent.parent / "templates"
        self.config_dir = Path(__file__).parent.parent.parent / "config" / "services"
    
    def generate(self, endpoint_name: str, endpoint_config: dict, domain: str = 'other', auth_config: dict = None):
        """Generate a service class from backend config"""
        print(f"🔧 Generating service: {endpoint_name} (domain: {domain})")

        # Default auth config
        if auth_config is None:
            auth_config = {'enabled': False}

        # Check for named template first (allow for special routing entities)
        named_template = self.template_dir / "named" / "services" / f"{endpoint_name}.ts.template"
        if named_template.exists():
            print(f"📝 Using named template: {endpoint_name}.ts.template")
            self._generate_from_named_template(endpoint_name, endpoint_config, domain, named_template)
            return

        # Skip dynamic generation for endpoints with special routing (e.g., auth)
        if endpoint_config.get('special_routing', False):
            print(f"⏭️  Skipping dynamic service generation for {endpoint_name} (special routing)")
            return

        # Generate from config using configuration-driven approach
        entity_name = endpoint_config.get('entity', endpoint_name.capitalize())
        methods = endpoint_config.get('methods', [])
        endpoints = endpoint_config.get('endpoints', [])

        # Generate service class
        service_content = self._generate_service(entity_name, endpoint_name, methods, endpoints, domain, auth_config)

        # Write service file organized by domain inside src
        output_dir = self.output_path / "src" / "services" / domain
        camel_endpoint = self._snake_to_camel(endpoint_name)
        output_file = output_dir / f"{camel_endpoint}Service.ts"

        self.write_file(output_file, service_content)
    
    def _generate_service(self, entity_name: str, endpoint_name: str, methods: list, endpoints: list, domain: str = 'other', auth_config: dict = None) -> str:
        """Generate service class content from template"""
        # Default auth config
        if auth_config is None:
            auth_config = {'enabled': False}

        # Try to read from template file
        template_path = self.template_dir / "entityService.ts.template"

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
                print(f"⚠️ Error reading service template: {e}, falling back to hardcoded")

        # Create endpoint lookup map from handler name to endpoint definition
        endpoint_map = {}
        for endpoint in endpoints:
            handler = endpoint.get('handler')
            if handler:
                endpoint_map[handler] = endpoint

        # Generate methods based on config
        method_implementations = []
        for method in methods:
            method_impl = self._generate_method_implementation(method, entity_name, endpoint_name, endpoint_map)
            if method_impl:
                method_implementations.append(method_impl)

        methods_str = "\n\n".join(method_implementations)

        # Generate getHeaders method based on auth config
        auth_enabled = auth_config.get('enabled', False)
        token_storage = auth_config.get('token_storage', 'localStorage')
        token_key = auth_config.get('token_key', 'authToken')

        if auth_enabled:
            get_headers_method = f"""  private getHeaders(): Record<string, string> {{
    const token = {token_storage}.getItem('{token_key}');
    return {{
      'Content-Type': 'application/json',
      ...(token && {{ Authorization: `Bearer ${{token}}` }})
    }};
  }}"""
        else:
            get_headers_method = """  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json'
    };
  }"""

        # Fallback to configuration-driven template
        camel_endpoint = self._snake_to_camel(endpoint_name)
        return f"""// Generated service for {entity_name}
import type {{ {entity_name} }} from '../../types/{domain}/{camel_endpoint}';

export interface ApiResponse<T> {{
  data: T;
  message?: string;
  success: boolean;
}}

class {entity_name}Service {{
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {{
    this.baseUrl = baseUrl;
  }}

  private async handleResponse<T>(response: Response): Promise<T> {{
    if (!response.ok) {{
      const error = await response.text();
      throw new Error(`HTTP ${{response.status}}: ${{error}}`);
    }}
    return response.json();
  }}

{get_headers_method}

{methods_str}
}}

export const {endpoint_name}Service = new {entity_name}Service();
export default {endpoint_name}Service;"""
    
    def _generate_from_named_template(self, endpoint_name: str, endpoint_config: dict, domain: str, template_path: Path):
        """Generate service from a named template"""
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # Write to the domain-specific services directory
            output_dir = self.output_path / "services" / domain
            camel_endpoint = self._snake_to_camel(endpoint_name)
            output_file = output_dir / f"{camel_endpoint}Service.ts"
            
            self.write_file(output_file, template_content)
            
        except Exception as e:
            print(f"❌ Error generating from named template {template_path}: {e}")

    def _generate_method_implementation(self, method: str, entity_name: str, endpoint_name: str, endpoint_map: dict) -> str:
        """Generate individual method implementation based on endpoint definition"""

        # Check if we have an endpoint definition for this handler
        endpoint_def = endpoint_map.get(method)

        if endpoint_def:
            # Use the endpoint definition from backend config
            http_method = endpoint_def.get('method', 'POST')
            path = endpoint_def.get('path', '')

            # Build the full URL path
            full_path = f"{endpoint_name}{path}"

            # Extract path parameters (e.g., /:id -> ['id'])
            import re
            path_params = re.findall(r':(\w+)', path)

            # Generate TypeScript parameter list
            params = []
            for param in path_params:
                params.append(f"{param}: string")

            # Determine if we need a body parameter based on HTTP method
            needs_body = http_method in ['POST', 'PUT', 'PATCH']
            if needs_body and not path_params:
                # Methods like createKey need a data parameter
                params.append(f"data: Partial<{entity_name}>")
            elif needs_body and path_params:
                # Methods like updateKey need both id and data
                params.append(f"data: Partial<{entity_name}>")

            params_str = ", ".join(params) if params else ""

            # Build URL with path parameters
            if path_params:
                # Replace :id with ${id} for template literals
                url_path = full_path
                for param in path_params:
                    url_path = url_path.replace(f":{param}", f"${{{param}}}")
                url_template = f"`${{this.baseUrl}}/{url_path}`"
            else:
                url_template = f"`${{this.baseUrl}}/{full_path}`"

            # Determine return type based on method name
            if method.startswith('delete') or method.startswith('remove'):
                return_type = 'void'
            elif method.startswith('getAll') or method.startswith('list') or method.startswith('search'):
                return_type = f"{entity_name}[]"
            else:
                return_type = entity_name

            # Generate fetch options
            fetch_options = [
                f"      method: '{http_method}'",
                "      headers: this.getHeaders()"
            ]

            if needs_body:
                fetch_options.append("      body: JSON.stringify(data)")

            fetch_options_str = ",\n".join(fetch_options)

            # Generate the method
            if return_type == 'void':
                return f"""  async {method}({params_str}): Promise<void> {{
    const response = await fetch({url_template}, {{
{fetch_options_str}
    }});
    await this.handleResponse<void>(response);
  }}"""
            else:
                return f"""  async {method}({params_str}): Promise<{return_type}> {{
    const response = await fetch({url_template}, {{
{fetch_options_str}
    }});
    return this.handleResponse<{return_type}>(response);
  }}"""

        # Fallback: If no endpoint definition, use generic method
        return self._generate_generic_method(method, entity_name, endpoint_name)

    def _generate_generic_method(self, method: str, entity_name: str, endpoint_name: str) -> str:
        """Generate generic method implementation based on naming patterns"""
        entity_lower = entity_name.lower()
        
        # Methods that return arrays
        if (method.startswith('get') and 'By' in method) or method.startswith('list') or method.startswith('search'):
            if method.endswith('s') or 'list' in method.lower() or 'search' in method.lower():
                # Returns array
                return f"""  async {method}(...args: any[]): Promise<{entity_name}[]> {{
    const response = await fetch(`${{this.baseUrl}}/{endpoint_name}/{method.lower()}`, {{
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(args),
    }});
    return this.handleResponse<{entity_name}[]>(response);
  }}"""
            else:
                # Returns single item
                return f"""  async {method}(...args: any[]): Promise<{entity_name}> {{
    const response = await fetch(`${{this.baseUrl}}/{endpoint_name}/{method.lower()}`, {{
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(args),
    }});
    return this.handleResponse<{entity_name}>(response);
  }}"""
        
        # Action methods that don't return data
        elif any(action in method.lower() for action in ['complete', 'activate', 'cleanup', 'expire', 'cancel']):
            return f"""  async {method}(...args: any[]): Promise<void> {{
    const response = await fetch(`${{this.baseUrl}}/{endpoint_name}/{method.lower()}`, {{
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(args),
    }});
    await this.handleResponse<void>(response);
  }}"""
        
        # Default: return single entity
        else:
            return f"""  async {method}(...args: any[]): Promise<{entity_name}> {{
    const response = await fetch(`${{this.baseUrl}}/{endpoint_name}/{method.lower()}`, {{
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(args),
    }});
    return this.handleResponse<{entity_name}>(response);
  }}"""

    def generate_template_services(self):
        """Services generator should not handle static templates - this is handled by the main generator"""
        # Static template processing is handled by FrontendGenerator._generate_static_files()
        # Services generator only handles named templates + dynamic generation
        pass
    
    def _snake_to_camel(self, snake_str: str) -> str:
        """Convert snake_case to camelCase"""
        components = snake_str.split('_')
        return components[0] + ''.join(word.capitalize() for word in components[1:])