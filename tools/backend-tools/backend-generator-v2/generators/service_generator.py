#!/usr/bin/env python3
"""
Service Generator
Responsible for generating TypeScript service files
"""

import logging
from typing import Dict, Any, List
from core.file_writer import FileWriter, FilePathHelper
from core.template_engine import TemplateEngine


class ServiceGenerator:
    """Generates TypeScript service files"""
    
    def __init__(self, file_writer: FileWriter, template_engine: TemplateEngine, force_overwrite: bool = False):
        self.file_writer = file_writer
        self.template_engine = template_engine
        self.force_overwrite = force_overwrite
        self.logger = logging.getLogger("service_generator")
    
    def generate_service(self, entity_info: Dict[str, str], table_name: str, 
                        methods: List[str], properties: Dict[str, str], configs: Dict[str, Any]) -> bool:
        """Generate TypeScript service file"""
        try:
            entity = entity_info['entity']
            entity_lower = entity_info['entity_lower']

            # Use only the methods specified in config (no auto-generation of standard CRUD)
            all_methods = methods

            # Generate service methods
            service_methods = []
            for method in all_methods:
                method_code = self._generate_service_method(method, entity, entity_lower, table_name, properties, configs)
                if method_code:
                    service_methods.append(method_code)
            
            # Generate format method
            format_method = self.template_engine.build_format_method(entity, properties, configs)
            service_methods.append(format_method)
            
            # Build service content
            content = self._build_service_content(entity, entity_lower, entity_info['model_imports'], service_methods, configs)
            
            # Write service file
            file_path = FilePathHelper.get_service_path(entity_lower)
            success = self.file_writer.write_file(file_path, content, self.force_overwrite)
            
            if success:
                self.logger.info(f"📝 Generated service: {entity_lower}Service")
            
            return success
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate service for {entity_info.get('entity', 'unknown')}: {e}")
            return False
    
    def _generate_service_method(self, method_name: str, entity: str, entity_lower: str, 
                               table_name: str, properties: Dict[str, str], configs: Dict[str, Any]) -> str:
        """Generate a service method using templates"""
        return self.template_engine.generate_method_from_template(
            method_name, entity, entity_lower, table_name, properties, configs
        )
    
    def _build_service_content(self, entity: str, entity_lower: str, model_imports: str, 
                             service_methods: List[str], configs: Dict[str, Any]) -> str:
        """Build service file content"""
        infrastructure_templates = configs.get('infrastructure_templates', {})
        template = infrastructure_templates.get('templates', {}).get('service_template', {}).get('template', '')
        
        if not template:
            # Fallback template
            template = """import { v4 as uuidv4 } from 'uuid';
import { Database } from '../utils/database';
import { {MODEL_IMPORTS} } from '../models/{MODEL_NAME}';

export class {SERVICE_CLASS} {
  private db = Database.getInstance();

{SERVICE_METHODS}
}"""
        
        return self.template_engine.process_template(template, {
            'MODEL_IMPORTS': model_imports,
            'MODEL_NAME': entity,
            'SERVICE_CLASS': f"{entity}Service",
            'SERVICE_METHODS': '\n\n'.join(service_methods)
        })