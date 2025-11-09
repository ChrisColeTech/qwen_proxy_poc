"""
Hooks Generator - Configuration-driven React hooks
"""

from pathlib import Path
from generators.base_generator import BaseGenerator

class HooksGenerator(BaseGenerator):
    """Generates React hooks based on backend configuration"""
    
    def __init__(self, output_path: Path):
        super().__init__(output_path)
        self.template_dir = Path(__file__).parent.parent.parent / "templates"
        self.config_dir = Path(__file__).parent.parent.parent / "config" / "hooks"
    
    def generate(self, endpoint_name: str, endpoint_config: dict, domain: str = 'other'):
        """Generate React hooks from backend config"""
        print(f"🎣 Generating hook: {endpoint_name} (domain: {domain})")
        
        # Check for named template first (allow for special routing entities)
        named_template = self.template_dir / "named" / "hooks" / f"{endpoint_name}.ts.template"
        if named_template.exists():
            print(f"📝 Using named template: {endpoint_name}.ts.template")
            self._generate_from_named_template(endpoint_name, endpoint_config, domain, named_template)
            return
        
        # Skip dynamic generation for endpoints with special routing (e.g., auth)
        if endpoint_config.get('special_routing', False):
            print(f"⏭️  Skipping dynamic hook generation for {endpoint_name} (special routing)")
            return

        # Generate from config using configuration-driven approach
        entity_name = endpoint_config.get('entity', endpoint_name.capitalize())
        methods = endpoint_config.get('methods', [])

        # Generate hook content based on actual methods from config
        hook_content = self._generate_config_driven_hook(entity_name, endpoint_name, methods, domain)

        # Write hook file organized by domain inside src
        output_dir = self.output_path / "src" / "hooks" / domain
        output_file = output_dir / f"use{entity_name}.ts"

        # Apply automatic fixes before writing
        hook_content = self._apply_automatic_fixes(hook_content)

        self.write_file(output_file, hook_content)
    
    def _generate_from_named_template(self, endpoint_name: str, endpoint_config: dict, domain: str, template_path: Path):
        """Generate hook from a named template"""
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # Special handling for auth template - write to authentication subdirectory
            if endpoint_name == 'auth':
                output_dir = self.output_path / "hooks" / "authentication"
                output_file = output_dir / f"useAuth.ts"
            else:
                # Write to the domain-specific hooks directory
                output_dir = self.output_path / "hooks" / domain
                output_file = output_dir / f"use{endpoint_name.capitalize()}.ts"
            
            self.write_file(output_file, template_content)
            
        except Exception as e:
            print(f"❌ Error generating from named template {template_path}: {e}")
    
    def _generate_config_driven_hook(self, entity_name: str, endpoint_name: str, methods: list, domain: str) -> str:
        """Generate hook content based on actual methods from backend config"""
        
        entity_name_lower = entity_name.lower()
        
        # Generate imports
        imports = ["useState", "useCallback"]
        
        # Determine if we need list state based on methods
        needs_list = any(method.startswith('list') or method.startswith('getAll') for method in methods)
        if needs_list:
            imports.append("useEffect")
        
        imports_str = ", ".join(imports)
        
        # Generate state based on what methods actually exist
        state_vars = [
            "const [loading, setLoading] = useState(false);",
            "const [error, setError] = useState<string | null>(null);"
        ]
        
        # Add single entity state if we have methods that work with single entities
        if any(method.endswith('ById') or method.startswith('get') and not method.startswith('getAll') for method in methods):
            state_vars.append(f"const [{entity_name_lower}, set{entity_name}] = useState<{entity_name} | null>(null);")
        
        # Add list state if we have list methods
        if needs_list:
            state_vars.append(f"const [{entity_name_lower}s, set{entity_name}s] = useState<{entity_name}[]>([]);")
        
        state_str = "\n  ".join(state_vars)
        
        # Generate error handler
        error_handler = """const handleError = useCallback((err: any) => {
    const errorMessage = err?.message || 'An unexpected error occurred';
    setError(errorMessage);
    setLoading(false);
  }, []);"""
        
        # Generate methods based on actual config methods
        method_functions = []
        return_object_items = ["loading", "error"]
        generated_methods = set()  # Track generated method names to avoid duplicates
        
        for method in methods:
            func_name = method
            if func_name not in generated_methods:  # Only generate if not already created
                method_func = self._generate_method_function(method, entity_name, endpoint_name, entity_name_lower)
                if method_func:
                    method_functions.append(method_func)
                    return_object_items.append(func_name)
                    generated_methods.add(func_name)
        
        # Add state variables to return object
        if f"set{entity_name}" in "\n".join(method_functions):  # Single entity exists
            return_object_items.insert(0, entity_name_lower)
            
        if f"set{entity_name}s" in "\n".join(method_functions):  # List exists
            return_object_items.insert(-2, f"{entity_name_lower}s")  # Before loading, error
        
        # Generate useEffect for auto-loading if there's a list method
        use_effect = ""
        list_method = next((m for m in methods if m.startswith('list') or m.startswith('getAll')), None)
        if list_method:
            use_effect = f"""
  useEffect(() => {{
    {list_method}();
  }}, [{list_method}]);"""
            return_object_items.append("refresh")
            method_functions.append(f"""const refresh = useCallback(async () => {{
    await {list_method}();
  }}, [{list_method}]);""")
        
        methods_str = "\n\n  ".join(method_functions)
        return_items_str = ",\n    ".join(return_object_items)
        
        # Convert snake_case to camelCase for import paths
        camel_endpoint = self._snake_to_camel(endpoint_name)
        
        return f"""import {{ {imports_str} }} from 'react';
import type {{ {entity_name} }} from '../../types/{domain}/{camel_endpoint}';
import {camel_endpoint}Service from '../../services/{domain}/{camel_endpoint}Service';

export const use{entity_name} = () => {{
  {state_str}

  {error_handler}

  {methods_str}{use_effect}

  return {{
    {return_items_str}
  }};
}};

export default use{entity_name};
"""
    
    def _generate_method_function(self, method: str, entity_name: str, endpoint_name: str, entity_name_lower: str) -> str:
        """Generate individual method function based on method name and type"""
        
        # Convert endpoint_name to camelCase for service calls
        camel_endpoint = self._snake_to_camel(endpoint_name)
        
        # Authentication methods (special handling)
        if method == 'login':
            return f"""const login = useCallback(async (credentials: any) => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.login(credentials);
      setLoading(false);
      return response;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""
  
        elif method == 'register':
            return f"""const register = useCallback(async (userData: any) => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.register(userData);
      setLoading(false);
      return response;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""
  
        elif method == 'getCurrentUser':
            return f"""const getCurrentUser = useCallback(async () => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.getCurrentUser();
      set{entity_name}(response);
      setLoading(false);
      return response;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""
  
        elif method == 'logout':
            return f"""const logout = useCallback(async () => {{
    try {{
      setLoading(true);
      setError(null);
      await {camel_endpoint}Service.logout();
      set{entity_name}(null);
      setLoading(false);
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""
        
        # CRUD methods
        elif method.startswith('get') and method.endswith('ById'):
            return f"""const {method} = useCallback(async (id: string) => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.{method}(id);
      set{entity_name}(response);
      setLoading(false);
      return response;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""
        
        elif method.startswith('list') or method.startswith('getAll'):
            return f"""const {method} = useCallback(async () => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.{method}();
      set{entity_name}s(response);
      setLoading(false);
      return response;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""
        
        elif method.startswith('create'):
            return f"""const {method} = useCallback(async (data: any) => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.{method}(data);
      const result = response;
      set{entity_name}s(prev => [...prev, result]);
      set{entity_name}(result);
      setLoading(false);
      return result;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""
        
        elif method.startswith('update'):
            return f"""const {method} = useCallback(async (id: string, data: any) => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.{method}(id, data);
      const result = response;
      set{entity_name}s(prev => prev.map(item => 
        item.id === id ? result : item
      ));
      if ({entity_name_lower}?.id === id) {{
        set{entity_name}(result);
      }}
      setLoading(false);
      return result;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [{entity_name_lower}, handleError]);"""
        
        elif method.startswith('delete'):
            return f"""const {method} = useCallback(async (id: string) => {{
    try {{
      setLoading(true);
      setError(null);
      await {camel_endpoint}Service.{method}(id);
      set{entity_name}s(prev => prev.filter(item => item.id !== id));
      if ({entity_name_lower}?.id === id) {{
        set{entity_name}(null);
      }}
      setLoading(false);
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [{entity_name_lower}, handleError]);"""
        
        # Generic method fallback - now only for methods that don't match any pattern above
        else:
            return f"""const {method} = useCallback(async (...args: any[]) => {{
    try {{
      setLoading(true);
      setError(null);
      const response = await {camel_endpoint}Service.{method}(...args);
      setLoading(false);
      return response;
    }} catch (err) {{
      handleError(err);
      throw err;
    }}
  }}, [handleError]);"""    
    def _apply_automatic_fixes(self, content: str) -> str:
        """Apply all automatic fixes to generated content"""
        # Fix type-only imports
        content = self._fix_type_only_imports(content)
        
        # Fix property access violations  
        content = self._fix_property_access_violations(content)
        
        # Fix method signature issues
        content = self._fix_method_signatures(content)
        
        return content
    
    def _detect_type_only_import_violations(self, content: str) -> list:
        """Detect imports that should be type-only for verbatimModuleSyntax"""
        import re
        violations = []
        
        # Pattern to find type imports from types directories
        type_import_pattern = r'import\s+\{\s*([^}]+)\s*\}\s+from\s+[\'"]([^"\']*types[^"\']*)[\'"];'
        
        matches = re.findall(type_import_pattern, content)
        for imports, from_path in matches:
            import_names = [name.strip() for name in imports.split(',')]
            for import_name in import_names:
                # Check if it's used only as a type
                if self._is_used_only_as_type(content, import_name):
                    violations.append({
                        'import_name': import_name,
                        'from_path': from_path
                    })
        
        return violations
    
    def _is_used_only_as_type(self, content: str, type_name: str) -> bool:
        """Check if an import is only used as a type annotation"""
        import re
        
        # Look for usage patterns that indicate type-only usage
        type_usage_patterns = [
            rf':\s*{type_name}[\s<\|\[\]]*',  # Type annotations
            rf'<{type_name}[\s<\|\[\]]*>',     # Generic type parameters
            rf'useState<{type_name}',          # React hooks with types
        ]
        
        # Look for non-type usage patterns
        value_usage_patterns = [
            rf'new\s+{type_name}',             # Constructor calls
            rf'{type_name}\.',                 # Static method calls
            rf'{type_name}\s*\(',              # Function calls
        ]
        
        has_type_usage = any(re.search(pattern, content) for pattern in type_usage_patterns)
        has_value_usage = any(re.search(pattern, content) for pattern in value_usage_patterns)
        
        return has_type_usage and not has_value_usage
    
    def _fix_type_only_imports(self, content: str) -> str:
        """Fix type-only import violations"""
        import re
        
        violations = self._detect_type_only_import_violations(content)
        
        for violation in violations:
            # Replace regular import with type-only import
            old_pattern = rf'import\s+\{{\s*{violation["import_name"]}\s*\}}\s+from\s+[\'"]({re.escape(violation["from_path"])})[\'"];'
            new_import = f'import type {{ {violation["import_name"]} }} from \'{violation["from_path"]}\';'
            
            content = re.sub(old_pattern, new_import, content)
        
        return content
    
    def _fix_property_access_violations(self, content: str) -> str:
        """Fix invalid .data property access"""
        import re
        
        # Fix common property access patterns
        fixes = [
            (r'(\w+Service\.\w+\([^)]*\))\.data', r'\1'),  # Remove .data from service calls
            (r'set(\w+)s\(response\.data\)', r'set\1s(response)'),  # Fix setState calls
            (r'return response\.data;', r'return response;'),  # Fix return statements
        ]
        
        for pattern, replacement in fixes:
            content = re.sub(pattern, replacement, content)
        
        return content
    
    def _fix_method_signatures(self, content: str) -> str:
        """Fix method signature issues in generated hooks"""
        
        # NOTE: Method renaming removed since we now generate correct methods from config
        # The service generator now creates all methods specified in the backend config
        # so no automatic method renaming is needed
        
        return content
    
    def _snake_to_camel(self, snake_str: str) -> str:
        """Convert snake_case to camelCase"""
        components = snake_str.split('_')
        return components[0] + ''.join(word.capitalize() for word in components[1:])
