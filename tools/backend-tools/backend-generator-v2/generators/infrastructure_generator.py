#!/usr/bin/env python3
"""
Infrastructure Generator
Responsible for generating infrastructure files (database, middleware, app.ts)
"""

import logging
from typing import Dict, Any
from core.file_writer import FileWriter, FilePathHelper
from core.template_engine import TemplateEngine


class InfrastructureGenerator:
    """Generates infrastructure files"""
    
    def __init__(self, file_writer: FileWriter, template_engine: TemplateEngine, force_overwrite: bool = False):
        self.file_writer = file_writer
        self.template_engine = template_engine
        self.force_overwrite = force_overwrite
        self.logger = logging.getLogger("infrastructure_generator")
    
    def generate_infrastructure(self, configs: Dict[str, Any]) -> bool:
        """Generate all infrastructure files"""
        try:
            self.logger.info("🏗️ Generating infrastructure files...")
            
            infrastructure_templates = configs.get('infrastructure_templates', {})
            templates = infrastructure_templates.get('templates', {})
            
            success_count = 0
            total_count = 0
            
            # Generate core infrastructure files
            infrastructure_files = ['database', 'auth_middleware', 'validation_middleware', 'swagger_setup']
            
            for template_name in infrastructure_files:
                if template_name in templates:
                    success = self._generate_infrastructure_file(template_name, templates[template_name])
                    if success:
                        success_count += 1
                    total_count += 1
            
            self.logger.info(f"📊 Infrastructure generation: {success_count}/{total_count} successful")
            return success_count == total_count
            
        except Exception as e:
            self.logger.error(f"❌ Infrastructure generation failed: {e}")
            return False
    
    def generate_app_file(self, entities_config: Dict[str, Any], configs: Dict[str, Any]) -> bool:
        """Generate app.ts with dynamic route registration"""
        try:
            route_imports = []
            route_registrations = []
            schema_definitions = []

            for entity_name, entity_config in entities_config.get('endpoints', {}).items():
                entities = entity_config.get('entities', f"{entity_name}s")
                entity = entity_config.get('entity', entity_name.capitalize())
                table_name = entity_config.get('table_name', entities.lower())

                # Generate import and registration
                router_name = f"{entity}Router"
                filename = FilePathHelper.to_camel_case(entities)

                # Use kebab-case for API routes (best practice)
                kebab_route = FilePathHelper.to_kebab_case(entity_name)

                route_imports.append(f"import {router_name} from './routes/{filename}';")
                route_registrations.append(f"app.use('/api/{kebab_route}', {router_name});")

                # Generate schema definition for SQLite
                schema_definitions.append(self._generate_schema_definition(table_name, entity_config))

            # Get app template
            infrastructure_templates = configs.get('infrastructure_templates', {})
            app_template = infrastructure_templates.get('templates', {}).get('app_template', {}).get('template', '')

            if not app_template:
                self.logger.error("❌ No app template found in configuration")
                return False

            # Check if this is SQLite (schema definitions needed)
            database_type = infrastructure_templates.get('database_type', 'postgres')
            if database_type == 'sqlite':
                schema_defs_str = '{\n  ' + ',\n  '.join(schema_definitions) + '\n}'
            else:
                schema_defs_str = '{}'

            # Build app.ts content
            content = self.template_engine.process_template(app_template, {
                'ROUTE_IMPORTS': '\n'.join(route_imports),
                'ROUTE_REGISTRATIONS': '\n'.join(route_registrations),
                'SCHEMA_DEFINITIONS': schema_defs_str
            })

            # Write app.ts
            success = self.file_writer.write_file("src/app.ts", content, self.force_overwrite)

            if success:
                self.logger.info(f"📝 Generated app.ts with {len(route_imports)} routes")

            return success

        except Exception as e:
            self.logger.error(f"❌ Failed to generate app.ts: {e}")
            return False

    def _generate_schema_definition(self, table_name: str, entity_config: Dict[str, Any]) -> str:
        """Generate SQLite CREATE TABLE statement"""
        properties = entity_config.get('properties', {})

        # Detect if table has 'id' or 'key' as primary key
        has_id = 'id' in properties
        has_key = 'key' in properties

        columns = []
        for prop_name, prop_type in properties.items():
            # Convert camelCase to snake_case for column names
            column_name = ''.join(['_' + c.lower() if c.isupper() else c for c in prop_name]).lstrip('_')

            # Map TypeScript types to SQLite types
            sqlite_type = self._map_type_to_sqlite(prop_type)

            # Add PRIMARY KEY for id or key column
            if column_name == 'id' or (column_name == 'key' and not has_id):
                columns.append(f"{column_name} {sqlite_type} PRIMARY KEY")
            else:
                columns.append(f"{column_name} {sqlite_type}")

        # Add timestamps
        if 'createdAt' not in properties and not has_key:  # Don't add for key-value stores
            columns.append("created_at TEXT NOT NULL")
        if 'updatedAt' not in properties:
            columns.append("updated_at TEXT NOT NULL")

        create_statement = f"CREATE TABLE IF NOT EXISTS {table_name} (\\n      "
        create_statement += ",\\n      ".join(columns)
        create_statement += "\\n    )"

        return f'"{table_name}": `{create_statement}`'

    def _map_type_to_sqlite(self, ts_type: str) -> str:
        """Map TypeScript types to SQLite types"""
        type_mapping = {
            'string': 'TEXT',
            'number': 'INTEGER',
            'boolean': 'INTEGER',
            'any': 'TEXT'
        }
        return type_mapping.get(ts_type, 'TEXT')
    
    def _generate_infrastructure_file(self, template_name: str, template_config: Dict[str, Any]) -> bool:
        """Generate a single infrastructure file"""
        try:
            file_path = template_config.get('path', '')
            template = template_config.get('template', '')
            
            if not file_path or not template:
                self.logger.error(f"❌ Invalid template config for {template_name}")
                return False
            
            success = self.file_writer.write_file(file_path, template, self.force_overwrite)
            
            if success:
                self.logger.info(f"📝 Generated: {file_path}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate {template_name}: {e}")
            return False