#!/usr/bin/env python3
"""
SQLite Template Engine
Separate module for SQLite-specific template processing
"""

import re
import logging
from typing import Dict, Any, Optional


class SqliteTemplateEngine:
    """SQLite-specific template processor"""

    def __init__(self):
        self.logger = logging.getLogger("sqlite_template_engine")

    def camel_to_snake(self, name: str) -> str:
        """Convert camelCase to snake_case for database columns using general algorithm"""
        # Use the camelToSnake function from database.ts
        return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()

    def process_template(self, template: str, variables: Dict[str, Any]) -> str:
        """Process a template with variable substitution"""
        try:
            processed = template

            # Process dynamic field generation if properties are available
            if 'properties' in variables:
                properties = variables['properties']

                # Generate SQLite-specific field lists and parameters
                insert_fields = self._generate_insert_fields(properties)
                insert_params = self._generate_insert_params(properties)
                destructure_fields = self._generate_destructure_fields(properties)
                update_fields = self._generate_update_fields(properties)
                param_array = self._generate_param_array(properties)
                update_param_array = self._generate_update_param_array(properties)
                boolean_conversions = self._generate_boolean_conversions(properties)

                processed = processed.replace('{INSERT_FIELDS}', insert_fields)
                processed = processed.replace('{INSERT_PARAMS}', insert_params)
                processed = processed.replace('{DESTRUCTURE_FIELDS}', destructure_fields)
                processed = processed.replace('{UPDATE_FIELDS}', update_fields)
                processed = processed.replace('{PARAM_ARRAY}', param_array)
                processed = processed.replace('{UPDATE_PARAM_ARRAY}', update_param_array)
                processed = processed.replace('{BOOLEAN_CONVERSIONS}', boolean_conversions)

            for key, value in variables.items():
                if key != 'properties':
                    processed = processed.replace(f"{{{key}}}", str(value))
                    processed = processed.replace(f"{{{{{key}}}}}", str(value))

            return processed

        except Exception as e:
            self.logger.error(f"❌ Template processing failed: {e}")
            return template

    def _generate_insert_fields(self, properties: Dict[str, str]) -> str:
        """Generate field list for INSERT statements (snake_case for database)"""
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'createdAt', 'updatedAt']]

        # Convert to snake_case for database columns
        db_fields = ['id'] + [self.camel_to_snake(f) for f in user_fields] + ['created_at', 'updated_at']
        return ', '.join(db_fields)

    def _generate_insert_params(self, properties: Dict[str, str]) -> str:
        """Generate SQLite parameter placeholders (?) for INSERT"""
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'createdAt', 'updatedAt']]

        # SQLite uses ? for all parameters
        param_count = 1 + len(user_fields) + 2  # id + user fields + timestamps
        return ', '.join(['?'] * param_count)

    def _generate_destructure_fields(self, properties: Dict[str, str]) -> str:
        """Generate destructuring assignment for input data (camelCase from request)"""
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'createdAt', 'updatedAt']]
        return ', '.join(user_fields)

    def _generate_update_fields(self, properties: Dict[str, str]) -> str:
        """Generate SET clause for UPDATE statements (snake_case for database)"""
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'createdAt', 'updatedAt']]

        # SQLite uses ? placeholders, convert field names to snake_case
        set_clauses = [f"{self.camel_to_snake(field)} = ?" for field in user_fields]

        return ', '.join(set_clauses)

    def _generate_param_array(self, properties: Dict[str, str]) -> str:
        """Generate parameter array for INSERT statements (camelCase variable names)"""
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'createdAt', 'updatedAt']]

        params = ['id'] + user_fields + ['now', 'now']
        return ', '.join(params)

    def _generate_update_param_array(self, properties: Dict[str, str]) -> str:
        """Generate parameter array for UPDATE statements (camelCase variable names)"""
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'createdAt', 'updatedAt']]

        # For UPDATE: only user fields (now and id are added in template)
        params = user_fields
        return ', '.join(params)

    def _generate_boolean_conversions(self, properties: Dict[str, str]) -> str:
        """Generate boolean to integer conversion code for SQLite"""
        user_fields = [field for field in properties.keys()
                      if field not in ['id', 'createdAt', 'updatedAt']]

        # Generate conversion for fields that might be boolean
        # Since we don't have type info, we check at runtime with convertBool
        conversions = [f"{field} = convertBool({field});" for field in user_fields]
        return '\n    '.join(conversions)

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

        # Fallback to generic method (synchronous for SQLite)
        return self._generate_generic_method(method_name, entity, table_name)

    def _generate_generic_method(self, method_name: str, entity: str, table_name: str) -> str:
        """Generate a generic SQLite method implementation"""
        return f"""  {method_name}(...args: any[]): any {{
    // Generic implementation for {method_name}
    const stmt = db.prepare('SELECT * FROM {table_name} ORDER BY created_at DESC LIMIT 50');
    const rows = stmt.all() as any[];
    return rows.map(row => this.format{entity}Response(row));
  }}"""

    def build_format_method(self, entity: str, properties: Dict[str, str], configs: Dict[str, Any]) -> str:
        """Generate format method for entity (uses runtime conversion via snakeToCamel)"""
        format_fields = []
        for prop_name in properties.keys():
            # Use transformed object which has already been converted by snakeToCamel
            format_fields.append(f"      {prop_name}: transformed.{prop_name},")

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
