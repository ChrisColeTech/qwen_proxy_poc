#!/usr/bin/env python3
"""
Route Generator
Responsible for generating TypeScript route files
"""

import logging
from typing import Dict, Any, List
from core.file_writer import FileWriter, FilePathHelper
from core.template_engine import TemplateEngine
from core.config_loader import ConfigLoader


class RouteGenerator:
    """Generates TypeScript route files"""
    
    def __init__(self, file_writer: FileWriter, template_engine: TemplateEngine, config_loader: ConfigLoader, force_overwrite: bool = False):
        self.file_writer = file_writer
        self.template_engine = template_engine
        self.config_loader = config_loader
        self.force_overwrite = force_overwrite
        self.logger = logging.getLogger("route_generator")
    
    def generate_routes(self, entity_info: Dict[str, str], endpoints: List[Dict[str, Any]], configs: Dict[str, Any]) -> bool:
        """Generate TypeScript routes file"""
        try:
            entity = entity_info['entity']
            entity_lower = entity_info['entity_lower']
            entities = entity_info['entities']
            
            # Check if this is a special routing endpoint (like auth)
            is_special_routing = configs.get('special_routing', False)
            
            self.logger.info(f"🔍 Route generation for {entity}: special_routing={is_special_routing}, entity.lower()={entity.lower()}")
            
            if is_special_routing and entity.lower() == 'auth':
                # Generate auth-specific routes instead of standard CRUD
                self.logger.info(f"🔐 Using special auth routes template for {entity}")
                content = self._build_auth_routes_content(entity, entity_lower, entity_info['model_imports'], configs)
            else:
                # Add standard CRUD endpoints if missing
                endpoints = self.template_engine.ensure_standard_endpoints(endpoints, entity, entities, configs)
                
                # Generate route methods
                route_methods = []
                for endpoint in endpoints:
                    route_code = self._generate_route_method(endpoint, entity_lower, configs)
                    route_methods.append(route_code)
                
                # Build routes content
                content = self._build_routes_content(entity, entity_lower, entity_info['model_imports'], route_methods, configs)
            
            # Write routes file - use camelCase filename for consistency
            file_path = FilePathHelper.get_routes_path(entities)
            success = self.file_writer.write_file(file_path, content, self.force_overwrite)
            
            if success:
                self.logger.info(f"📝 Generated routes: {FilePathHelper.to_camel_case(entities)}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"❌ Failed to generate routes for {entity_info.get('entity', 'unknown')}: {e}")
            return False
    
    def _generate_route_method(self, endpoint: Dict[str, Any], entity_lower: str, configs: Dict[str, Any]) -> str:
        """Generate a route method"""
        method = endpoint['method'].lower()
        path = endpoint['path']
        handler = endpoint['handler']
        auth_required = endpoint.get('auth_required', True)
        
        # Get parameters for this handler
        parameters = self.config_loader.get_handler_parameters(handler, path, method, entity_lower, configs)
        
        # Generate auth middleware
        auth_middleware = 'authenticate, ' if auth_required else ''
        
        # Get route method template
        infrastructure_templates = configs.get('infrastructure_templates', {})
        route_template = infrastructure_templates.get('templates', {}).get('route_template', {}).get('route_method_template', '')
        
        if not route_template:
            # Fallback template
            route_template = """// {METHOD} {PATH}
router.{method}('{path}', {auth_middleware}async (req: any, res) => {
  try {
    const result = await {service_instance}.{handler}({parameters});
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});"""
        
        return self.template_engine.process_template(route_template, {
            'METHOD': endpoint['method'],
            'PATH': path,
            'method': method,
            'path': path,
            'auth_middleware': auth_middleware,
            'service_instance': f"{entity_lower}Service",
            'handler': handler,
            'parameters': parameters
        })
    
    def _build_routes_content(self, entity: str, entity_lower: str, model_imports: str, 
                            route_methods: List[str], configs: Dict[str, Any]) -> str:
        """Build routes file content"""
        infrastructure_templates = configs.get('infrastructure_templates', {})
        template = infrastructure_templates.get('templates', {}).get('route_template', {}).get('template', '')
        
        if not template:
            # Fallback template
            template = """import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { {SERVICE_CLASS} } from '../services/{service_name}Service';
import { {MODEL_IMPORTS} } from '../models/{MODEL_NAME}';

const router = Router();
const {service_instance} = new {SERVICE_CLASS}();

{ROUTE_METHODS}

export default router;"""
        
        return self.template_engine.process_template(template, {
            'SERVICE_CLASS': f"{entity}Service",
            'service_name': entity_lower,
            'service_instance': f"{entity_lower}Service",
            'MODEL_NAME': entity,
            'MODEL_IMPORTS': model_imports,
            'ROUTE_METHODS': '\n\n'.join(route_methods)
        })
    
    def _build_auth_routes_content(self, entity: str, entity_lower: str, model_imports: str, configs: Dict[str, Any]) -> str:
        """Build auth-specific routes file content"""
        
        auth_routes_template = """/*
 * ⚠️  WARNING: GENERATED CODE - DO NOT MODIFY ⚠️
 * 
 * This file is automatically generated by the backend code generator.
 * Any manual changes will be overwritten when the generator runs.
 * 
 * To make changes, modify the generator configuration files in:
 * /tools/backend-tools/backend-generator-v2/
 * 
 * Then re-run the generator to update this file.
 */

import { Router } from 'express';
import { validate } from '../middleware/validation';
import { {SERVICE_CLASS} } from '../services/{service_name}Service';
import { {MODEL_IMPORTS} } from '../models/{MODEL_NAME}';

const router = Router();
const {service_instance} = new {SERVICE_CLASS}();

// POST /register - Register a new user (no auth required)
router.post('/register', async (req: any, res) => {
  try {
    const result = await {service_instance}.register(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /login - User login (no auth required)
router.post('/login', async (req: any, res) => {
  try {
    const result = await {service_instance}.login(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /logout - User logout
router.post('/logout', async (req: any, res) => {
  try {
    const result = await {service_instance}.logout(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /forgot-password - Forgot password
router.post('/forgot-password', async (req: any, res) => {
  try {
    const result = await {service_instance}.forgotPassword(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /reset-password - Reset password
router.post('/reset-password', async (req: any, res) => {
  try {
    const result = await {service_instance}.resetPassword(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /verify-token - Verify JWT token
router.post('/verify-token', async (req: any, res) => {
  try {
    const result = await {service_instance}.verifyToken(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /refresh - Refresh user data
router.post('/refresh', async (req: any, res) => {
  try {
    const result = await {service_instance}.refreshUser(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /me - Get current user data
router.get('/me', async (req: any, res) => {
  try {
    const result = await {service_instance}.getCurrentUser(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;"""
        
        return self.template_engine.process_template(auth_routes_template, {
            'SERVICE_CLASS': f"{entity}Service",
            'service_name': entity_lower,
            'service_instance': f"{entity_lower}Service",
            'MODEL_NAME': entity,
            'MODEL_IMPORTS': model_imports
        })