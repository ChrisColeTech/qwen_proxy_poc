#!/usr/bin/env python3
"""
Template Engine
Responsible for processing templates with variable substitution
"""

import re
import logging
from typing import Dict, Any, Optional


class TemplateEngine:
    """Processes templates with variable substitution"""

    def __init__(self):
        self.logger = logging.getLogger("template_engine")
    
    def process_template(self, template: str, variables: Dict[str, Any]) -> str:
        """Process a template with variable substitution"""
        try:
            # Handle both {variable} and {{variable}} formats
            processed = template
            
            # Process dynamic field generation if properties are available
            if 'properties' in variables:
                properties = variables['properties']
                
                # Generate INSERT field list and parameters
                insert_fields = self._generate_insert_fields(properties)
                insert_params = self._generate_insert_params(properties)
                destructure_fields = self._generate_destructure_fields(properties)
                update_fields = self._generate_update_fields(properties)
                param_array = self._generate_param_array(properties)
                update_param_array = self._generate_update_param_array(properties)
                
                processed = processed.replace('{INSERT_FIELDS}', insert_fields)
                processed = processed.replace('{INSERT_PARAMS}', insert_params)
                processed = processed.replace('{DESTRUCTURE_FIELDS}', destructure_fields)
                processed = processed.replace('{UPDATE_FIELDS}', update_fields)
                processed = processed.replace('{PARAM_ARRAY}', param_array)
                processed = processed.replace('{UPDATE_PARAM_ARRAY}', update_param_array)
            
            for key, value in variables.items():
                if key != 'properties':  # Skip properties as it's handled above
                    # Replace {key} format
                    processed = processed.replace(f"{{{key}}}", str(value))
                    # Replace {{key}} format  
                    processed = processed.replace(f"{{{{{key}}}}}", str(value))
            
            return processed
            
        except Exception as e:
            self.logger.error(f"❌ Template processing failed: {e}")
            return template
    
    def get_method_template(self, method_name: str, entity_lower: str, configs: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get the appropriate template for a method"""
        method_templates = configs.get('method_templates', {})
        
        # Check for specialized methods first
        specialized = method_templates.get('specialized_methods', {})
        if entity_lower in specialized and method_name in specialized[entity_lower]:
            return specialized[entity_lower][method_name]
        
        # Use pattern-based templates
        templates = method_templates.get('method_templates', {})
        for template_name, template_config in templates.items():
            pattern = template_config['pattern']
            if re.match(pattern, method_name):
                return template_config
        
        return None
    
    def generate_method_from_template(self, method_name: str, entity: str, entity_lower: str, 
                                    table_name: str, properties: Dict[str, str], configs: Dict[str, Any]) -> str:
        """Generate a service method using templates"""
        template_config = self.get_method_template(method_name, entity_lower, configs)
        
        if template_config:
            variables = {
                'method_name': method_name,
                'entity': entity,
                'table_name': table_name,
                'properties': properties
            }
            return self.process_template(template_config['template'], variables)
        
        # Fallback to generic template
        return self._generate_generic_method(method_name, entity, table_name)
    
    def _generate_generic_method(self, method_name: str, entity: str, table_name: str) -> str:
        """Generate a generic method implementation"""
        return f"""  async {method_name}(...args: any[]): Promise<any> {{
    // Generic implementation for {method_name}
    const result = await this.db.query('SELECT * FROM {table_name} ORDER BY created_at DESC LIMIT 50');
    return result.rows.map(row => this.format{entity}Response(row));
  }}"""
    
    def build_format_method(self, entity: str, properties: Dict[str, str], configs: Dict[str, Any]) -> str:
        """Generate format method for entity"""
        entity_overrides = configs.get('entity_overrides', {})
        property_mappings = entity_overrides.get('property_mappings', {})
        
        format_fields = []
        for prop_name, prop_type in properties.items():
            if prop_name in property_mappings:
                mapping = property_mappings[prop_name]
                if mapping.get('json_parse'):
                    default = mapping.get('default_value', '[]')
                    format_fields.append(f"      {prop_name}: row.{mapping['database_column']} ? JSON.parse(row.{mapping['database_column']}) : {default},")
                else:
                    format_fields.append(f"      {prop_name}: row.{mapping['database_column']},")
            else:
                format_fields.append(f"      {prop_name}: row.{prop_name},")
        
        method_templates = configs.get('method_templates', {})
        template = method_templates.get('format_method_template', 
            'private format{entity}Response(row: any): {entity}Response {\n    return {\n{format_fields}\n    };\n  }')
        
        return self.process_template(template, {
            'entity': entity,
            'format_fields': '\n'.join(format_fields)
        })
    
    def apply_entity_overrides(self, entity_name: str, entity: str, entities: str, configs: Dict[str, Any]) -> Dict[str, str]:
        """Apply special entity overrides from configuration"""
        entity_overrides = configs.get('entity_overrides', {})
        overrides = entity_overrides.get('entity_overrides', {})
        
        if entity_name.lower() in overrides:
            override = overrides[entity_name.lower()]
            return {
                'entity': override.get('entity_name', entity),
                'entities': entities,
                'entity_lower': entity_name.lower(),
                'model_imports': override.get('model_imports', f"{entity}Response, Create{entity}Request, Update{entity}Request"),
                'special_model': override.get('special_model', False)
            }
        
        return {
            'entity': entity,
            'entities': entities, 
            'entity_lower': entity_name.lower(),
            'model_imports': f"{entity}Response, Create{entity}Request, Update{entity}Request",
            'special_model': False
        }
    
    def ensure_standard_endpoints(self, endpoints: list, entity: str, entities: str, configs: Dict[str, Any]) -> list:
        """Ensure standard CRUD endpoints are present"""
        entity_overrides = configs.get('entity_overrides', {})
        existing_patterns = {(ep.get('method', '').upper(), ep.get('path', '')) for ep in endpoints}
        
        standard_endpoints = entity_overrides.get('common_endpoints', [])
        
        for std_endpoint in standard_endpoints:
            method = std_endpoint['method']
            path = std_endpoint['path']
            
            # Replace placeholders
            handler = std_endpoint['handler'].format(Entity=entity, Entities=entities.capitalize())
            
            pattern = (method, path)
            if pattern not in existing_patterns:
                endpoints.append({
                    'method': method,
                    'path': path,
                    'handler': handler,
                    'auth_required': std_endpoint.get('auth_required', True)
                })
        
        return endpoints
    
    def get_standard_crud_methods(self, entity: str, entities: str, configs: Dict[str, Any]) -> list:
        """Get standard CRUD method names"""
        entity_overrides = configs.get('entity_overrides', {})
        standard_methods = entity_overrides.get('standard_crud_methods', [
            "getAll{Entities}",
            "get{Entity}ById",
            "create{Entity}",
            "update{Entity}",
            "delete{Entity}"
        ])
        
        # Replace placeholders
        return [
            method.format(Entity=entity, Entities=entities.capitalize())
            for method in standard_methods
        ]
    
    def _generate_insert_fields(self, properties: Dict[str, str]) -> str:
        """Generate field list for INSERT statements"""
        # Skip auto-generated fields and include user-provided fields
        user_fields = [field for field in properties.keys() 
                      if field not in ['id', 'created_at', 'updated_at']]
        
        all_fields = ['id'] + user_fields + ['created_at', 'updated_at']
        return ', '.join(all_fields)
    
    def _generate_insert_params(self, properties: Dict[str, str]) -> str:
        """Generate parameter placeholders for INSERT statements"""
        # Skip auto-generated fields and include user-provided fields
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'created_at', 'updated_at']]

        # Generate $1, $2, $3, etc. - id + user fields + created_at + updated_at
        param_count = 1 + len(user_fields) + 2
        params = [f"${i}" for i in range(1, param_count + 1)]

        # Replace timestamp parameters with NOW()
        params[-2] = 'NOW()'  # created_at
        params[-1] = 'NOW()'  # updated_at

        return ', '.join(params)
    
    def _generate_destructure_fields(self, properties: Dict[str, str]) -> str:
        """Generate destructuring assignment for input data"""
        # Only destructure fields that come from user input
        user_fields = [field for field in properties.keys() 
                      if field not in ['id', 'created_at', 'updated_at']]
        
        # Handle naming conflicts with common variable names
        conflicting_names = ['result', 'error', 'data', 'response']
        destructured_fields = []
        
        for field in user_fields:
            if field in conflicting_names:
                destructured_fields.append(f"{field}: {field}Data")
            else:
                destructured_fields.append(field)
        
        return ', '.join(destructured_fields)
    
    def _generate_update_fields(self, properties: Dict[str, str]) -> str:
        """Generate SET clause for UPDATE statements"""
        # Only update fields that come from user input
        user_fields = [field for field in properties.keys() 
                      if field not in ['id', 'created_at', 'updated_at']]
        
        # Handle naming conflicts with common variable names
        conflicting_names = ['result', 'error', 'data', 'response']
        param_vars = []
        
        for field in user_fields:
            if field in conflicting_names:
                param_vars.append(f"{field}Data")
            else:
                param_vars.append(field)
        
        set_clauses = [f"{field} = ${i+2}" for i, field in enumerate(user_fields)]  # Start at $2, $1 is for id
        set_clauses.append("updated_at = NOW()")
        
        return ', '.join(set_clauses)
    
    def _generate_param_array(self, properties: Dict[str, str]) -> str:
        """Generate parameter array for INSERT statements"""
        # Skip auto-generated fields
        user_fields = [field for field in properties.keys() 
                      if field not in ['id', 'created_at', 'updated_at']]
        
        # Handle naming conflicts with common variable names
        conflicting_names = ['result', 'error', 'data', 'response']
        param_vars = []
        
        for field in user_fields:
            if field in conflicting_names:
                param_vars.append(f"{field}Data")
            else:
                param_vars.append(field)
        
        params = ['id'] + param_vars
        return ', '.join(params)
    
    def _generate_update_param_array(self, properties: Dict[str, str]) -> str:
        """Generate parameter array for UPDATE statements"""
        # Skip auto-generated fields
        user_fields = [field for field in properties.keys() 
                      if field not in ['id', 'created_at', 'updated_at']]
        
        # Handle naming conflicts with common variable names
        conflicting_names = ['result', 'error', 'data', 'response']
        param_vars = []
        
        for field in user_fields:
            if field in conflicting_names:
                param_vars.append(f"{field}Data")
            else:
                param_vars.append(field)
        
        # For UPDATE: id comes first, then the user fields
        params = ['id'] + param_vars
        return ', '.join(params)