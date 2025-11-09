#!/usr/bin/env python3
"""
Model Generator
Responsible for generating TypeScript model files
"""

import logging
from typing import Dict, Any
from core.file_writer import FileWriter, FilePathHelper
from core.template_engine import TemplateEngine


class ModelGenerator:
    """Generates TypeScript model files"""
    
    def __init__(self, file_writer: FileWriter, template_engine: TemplateEngine, force_overwrite: bool = False):
        self.file_writer = file_writer
        self.template_engine = template_engine
        self.force_overwrite = force_overwrite
        self.logger = logging.getLogger("model_generator")
    
    def generate_model(self, entity_info: Dict[str, str], properties: Dict[str, str], configs: Dict[str, Any]) -> bool:
        """Generate TypeScript model file"""
        try:
            entity = entity_info['entity']
            
            if entity_info['special_model'] and entity.lower() == 'auth':
                # Use predefined auth model
                content = self._get_auth_model_content()
            else:
                # Generate standard model
                content = self._build_model_content(entity, properties, configs)
            
            # Write model file
            file_path = FilePathHelper.get_model_path(entity)
            success = self.file_writer.write_file(file_path, content, self.force_overwrite)
            
            if success:
                self.logger.info(f"📝 Generated model: {entity}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate model for {entity_info.get('entity', 'unknown')}: {e}")
            return False
    
    def _build_model_content(self, entity: str, properties: Dict[str, str], configs: Dict[str, Any]) -> str:
        """Build model file content"""
        response_props = []
        create_props = []
        update_props = []
        
        for prop_name, prop_type in properties.items():
            response_props.append(f"  {prop_name}: {prop_type};")
            if prop_name not in ['id', 'created_at', 'updated_at']:
                create_props.append(f"  {prop_name}: {prop_type};")
                update_props.append(f"  {prop_name}?: {prop_type};")
        
        # Get template from infrastructure config
        infrastructure_templates = configs.get('infrastructure_templates', {})
        template = infrastructure_templates.get('templates', {}).get('model_template', {}).get('template', '')
        
        if not template:
            # Fallback template
            template = """export interface {ENTITY}Response {
{RESPONSE_PROPERTIES}
}

export interface Create{ENTITY}Request {
{CREATE_PROPERTIES}
}

export interface Update{ENTITY}Request {
{UPDATE_PROPERTIES}
}"""
        
        return self.template_engine.process_template(template, {
            'ENTITY': entity,
            'RESPONSE_PROPERTIES': '\n'.join(response_props),
            'CREATE_PROPERTIES': '\n'.join(create_props),
            'UPDATE_PROPERTIES': '\n'.join(update_props)
        })
    
    def _get_auth_model_content(self) -> str:
        """Get predefined auth model content"""
        return '''export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserInfo;
  token: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  chess_elo: number;
  puzzle_rating: number;
  preferences: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAuthRequest {
  username: string;
  email: string;
}

export interface UpdateAuthRequest {
  username?: string;
  email?: string;
}'''