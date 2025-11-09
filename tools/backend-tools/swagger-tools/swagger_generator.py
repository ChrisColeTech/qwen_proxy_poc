#!/usr/bin/env python3
"""
Swagger Documentation Generator
Generates OpenAPI/Swagger documentation from parsed TypeScript routes
"""

import json
import os
from typing import Dict, List, Optional
from datetime import datetime
from route_parser import TypeScriptRouteParser


class SwaggerDocGenerator:
    """Generates Swagger/OpenAPI documentation from parsed routes"""
    
    def __init__(self):
        self.base_swagger = {
            "openapi": "3.0.0",
            "info": {
                "title": "Chessboard Vanilla V2 API",
                "version": "2.0.0",
                "description": "Comprehensive RESTful API for chess game, puzzles, learning, and user management",
                "contact": {
                    "name": "API Support",
                    "url": "https://github.com/ChrisColeTech/chessboard-vanilla-v2"
                }
            },
            "servers": [
                {
                    "url": "https://chessboard-vanilla-v2.onrender.com",
                    "description": "Production server"
                },
                {
                    "url": "http://localhost:3001",
                    "description": "Development server"
                }
            ],
            "components": {
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT",
                        "description": "JWT token obtained from login endpoint"
                    }
                },
                "schemas": self._get_common_schemas()
            },
            "security": [
                {
                    "bearerAuth": []
                }
            ],
            "paths": {}
        }
        
        # Route-specific information
        self.route_info = {
            'auth': {
                'tag': 'Authentication',
                'description': 'User authentication and account management',
                'security_required': False  # Some auth endpoints don't need auth
            },
            'users': {
                'tag': 'Users',
                'description': 'User profile and settings management',
                'security_required': True
            },
            'puzzles': {
                'tag': 'Puzzles',
                'description': 'Chess puzzle management and solving',
                'security_required': True
            },
            'games': {
                'tag': 'Games',
                'description': 'Chess game management and analysis',
                'security_required': True
            },
            'stats': {
                'tag': 'Statistics',
                'description': 'User performance and game statistics',
                'security_required': True
            },
            'learningPaths': {
                'tag': 'Learning',
                'description': 'Learning paths and educational content',
                'security_required': True
            },
            'tutorials': {
                'tag': 'Tutorials',
                'description': 'Interactive chess tutorials',
                'security_required': True
            },
            'sessions': {
                'tag': 'Sessions',
                'description': 'Session management and validation',
                'security_required': True
            },
            'achievements': {
                'tag': 'Achievements',
                'description': 'User achievements and unlockables',
                'security_required': True
            },
            'openings': {
                'tag': 'Openings',
                'description': 'Chess opening database and search',
                'security_required': False
            },
            'analysis': {
                'tag': 'Analysis',
                'description': 'Position analysis and engine evaluation',
                'security_required': True
            },
            'historicGames': {
                'tag': 'Historic Games',
                'description': 'Famous chess games database',
                'security_required': False
            }
        }
    
    def _get_common_schemas(self) -> Dict:
        """Define common data schemas"""
        return {
            "ApiResponse": {
                "type": "object",
                "properties": {
                    "success": {
                        "type": "boolean",
                        "description": "Whether the request was successful"
                    },
                    "data": {
                        "description": "Response data (varies by endpoint)"
                    },
                    "error": {
                        "type": "string",
                        "description": "Error message if success is false"
                    }
                }
            },
            "User": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "format": "uuid"},
                    "username": {"type": "string"},
                    "email": {"type": "string", "format": "email"},
                    "chess_elo": {"type": "integer"},
                    "puzzle_rating": {"type": "integer"},
                    "created_at": {"type": "string", "format": "date-time"},
                    "updated_at": {"type": "string", "format": "date-time"}
                }
            },
            "LoginRequest": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                    "email": {"type": "string", "format": "email"},
                    "password": {"type": "string", "minLength": 6}
                }
            },
            "RegisterRequest": {
                "type": "object",
                "required": ["username", "email", "password"],
                "properties": {
                    "username": {"type": "string", "minLength": 3, "maxLength": 20},
                    "email": {"type": "string", "format": "email"},
                    "password": {"type": "string", "minLength": 6}
                }
            },
            "Error": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean", "example": False},
                    "error": {"type": "string"}
                }
            }
        }
    
    def generate_documentation(self, parsed_routes: Dict) -> Dict:
        """Generate complete Swagger documentation from parsed routes"""
        swagger_doc = self.base_swagger.copy()
        tags = []
        
        for file_name, file_data in parsed_routes.items():
            if 'error' in file_data:
                continue
                
            # Add tag for this route group
            route_config = self.route_info.get(file_name, {
                'tag': file_name.capitalize(),
                'description': f'{file_name.capitalize()} endpoints',
                'security_required': True
            })
            
            tags.append({
                "name": route_config['tag'],
                "description": route_config['description']
            })
            
            # Process routes
            for route in file_data['routes']:
                path_key = f"/api/{file_name}{route['path']}"
                method_key = route['method'].lower()
                
                if path_key not in swagger_doc['paths']:
                    swagger_doc['paths'][path_key] = {}
                
                swagger_doc['paths'][path_key][method_key] = self._generate_endpoint_doc(
                    route, file_name, route_config
                )
        
        swagger_doc['tags'] = tags
        return swagger_doc
    
    def _generate_endpoint_doc(self, route: Dict, file_name: str, route_config: Dict) -> Dict:
        """Generate documentation for a single endpoint"""
        method = route['method'].upper()
        path = route['path']
        
        # Generate summary and description
        summary = self._generate_summary(method, path, file_name)
        description = self._generate_description(method, path, file_name)
        
        endpoint_doc = {
            "tags": [route_config['tag']],
            "summary": summary,
            "description": description,
            "responses": {
                "200": {
                    "description": "Success",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ApiResponse"}
                        }
                    }
                },
                "400": {
                    "description": "Bad Request",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/Error"}
                        }
                    }
                },
                "401": {
                    "description": "Unauthorized",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/Error"}
                        }
                    }
                },
                "500": {
                    "description": "Internal Server Error",
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/Error"}
                        }
                    }
                }
            }
        }
        
        # Add parameters
        if route['parameters']:
            endpoint_doc['parameters'] = [
                {
                    "name": param['name'],
                    "in": param['in'],
                    "required": param['required'],
                    "schema": {"type": param['type']},
                    "description": f"{param['name'].capitalize()} parameter"
                }
                for param in route['parameters']
            ]
        
        # Add request body for POST/PUT/PATCH
        if method in ['POST', 'PUT', 'PATCH']:
            endpoint_doc['requestBody'] = self._generate_request_body(method, path, file_name)
        
        # Add security requirement
        if route_config.get('security_required', True):
            # Some auth endpoints (login, register) don't need auth
            if not (file_name == 'auth' and path in ['/', '/login', '/register', '/forgot-password', '/check-email', '/check-username']):
                endpoint_doc['security'] = [{"bearerAuth": []}]
        
        return endpoint_doc
    
    def _generate_summary(self, method: str, path: str, file_name: str) -> str:
        """Generate endpoint summary"""
        if file_name == 'auth':
            if path == '/login': return "User login"
            if path == '/register': return "User registration"
            if path == '/logout': return "User logout"
            if path == '/me': return "Get current user"
            if path == '/forgot-password': return "Request password reset"
            if path == '/verify-token': return "Verify JWT token"
            if path == '/change-password': return "Change user password"
        
        # Generic summary generation
        action_map = {
            'GET': 'Get' if path.endswith('/') or '{' in path else 'List',
            'POST': 'Create',
            'PUT': 'Update',
            'DELETE': 'Delete',
            'PATCH': 'Modify'
        }
        
        action = action_map.get(method, method.lower())
        resource = file_name.replace('_', ' ')
        
        if '{' in path:
            return f"{action} {resource} by ID"
        elif path == '/' or path == '':
            return f"{action} {resource}"
        else:
            clean_path = path.replace('/', ' ').strip()
            return f"{action} {resource} {clean_path}"
    
    def _generate_description(self, method: str, path: str, file_name: str) -> str:
        """Generate endpoint description"""
        return f"{method} {path} - {file_name} endpoint"
    
    def _generate_request_body(self, method: str, path: str, file_name: str) -> Dict:
        """Generate request body schema"""
        if file_name == 'auth':
            if path == '/login':
                return {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/LoginRequest"}
                        }
                    }
                }
            elif path == '/register':
                return {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/RegisterRequest"}
                        }
                    }
                }
        
        # Generic request body
        return {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "description": f"Request body for {method} {path}"
                    }
                }
            }
        }
    
    def save_swagger_file(self, swagger_doc: Dict, output_path: str):
        """Save Swagger documentation to JSON file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(swagger_doc, f, indent=2, ensure_ascii=False)
    
    def generate_jsdoc_comments(self, swagger_doc: Dict, output_path: str):
        """Generate JSDoc comments for inserting into TypeScript files"""
        comments = []
        
        for path, methods in swagger_doc['paths'].items():
            for method, spec in methods.items():
                comment = self._generate_jsdoc_comment(path, method, spec)
                comments.append(comment)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(comments))
    
    def _generate_jsdoc_comment(self, path: str, method: str, spec: Dict) -> str:
        """Generate a single JSDoc comment block"""
        lines = [
            "/**",
            f" * @swagger",
            f" * {path}:",
            f" *   {method}:",
            f" *     tags: {json.dumps(spec.get('tags', []))}",
            f" *     summary: {spec.get('summary', '')}",
            f" *     description: {spec.get('description', '')}",
        ]
        
        if 'parameters' in spec:
            lines.append(" *     parameters:")
            for param in spec['parameters']:
                lines.extend([
                    f" *       - name: {param['name']}",
                    f" *         in: {param['in']}",
                    f" *         required: {str(param['required']).lower()}",
                    f" *         schema:",
                    f" *           type: {param['schema']['type']}"
                ])
        
        if 'requestBody' in spec:
            lines.append(" *     requestBody:")
            lines.append(" *       required: true")
            lines.append(" *       content:")
            lines.append(" *         application/json:")
            lines.append(" *           schema:")
            lines.append(" *             type: object")
        
        lines.append(" *     responses:")
        for status, response in spec.get('responses', {}).items():
            lines.append(f" *       {status}:")
            lines.append(f" *         description: {response.get('description', '')}")
        
        lines.append(" */")
        return '\n'.join(lines)


def main():
    """Main function"""
    print("🚀 Swagger Documentation Generator")
    
    # Initialize components
    parser = TypeScriptRouteParser()
    generator = SwaggerDocGenerator()
    
    # Parse routes
    routes_dir = '/Users/chris/Projects/llm-api-vault-v2/backend-v2/src/routes'
    print(f"📂 Parsing routes from: {routes_dir}")
    
    try:
        parsed_routes = parser.parse_directory(routes_dir)
        print(f"✅ Parsed {len(parsed_routes)} route files")
        
        # Generate Swagger documentation
        swagger_doc = generator.generate_documentation(parsed_routes)
        print(f"📝 Generated documentation for {len(swagger_doc['paths'])} endpoints")
        
        # Save files
        output_dir = '/Users/chris/Projects/llm-api-vault-v2/tools/backend-tools/swagger-tools'
        swagger_path = f"{output_dir}/generated_swagger.json"
        jsdoc_path = f"{output_dir}/generated_jsdoc_comments.js"
        
        generator.save_swagger_file(swagger_doc, swagger_path)
        generator.generate_jsdoc_comments(swagger_doc, jsdoc_path)
        
        print(f"💾 Saved Swagger JSON: {swagger_path}")
        print(f"💾 Saved JSDoc comments: {jsdoc_path}")
        
        # Summary
        print(f"\n📊 Documentation Summary:")
        print(f"  - Total endpoints: {len(swagger_doc['paths'])}")
        print(f"  - Tags: {len(swagger_doc.get('tags', []))}")
        print(f"  - Schemas: {len(swagger_doc['components']['schemas'])}")
        
        return swagger_doc
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()