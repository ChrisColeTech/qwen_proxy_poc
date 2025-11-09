#!/usr/bin/env python3
"""
Route Parser for TypeScript Express Routes
Analyzes TypeScript route files and extracts endpoint information
"""

import re
import os
import json
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class TypeScriptRouteParser:
    """Parser for TypeScript Express router files"""
    
    def __init__(self):
        self.http_methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']
        self.route_patterns = {
            # router.get('/path', handler)
            'simple': r"router\.({methods})\s*\(\s*['\"]([^'\"]+)['\"],\s*([^)]+)\)",
            # router.get('/path', middleware, handler)
            'with_middleware': r"router\.({methods})\s*\(\s*['\"]([^'\"]+)['\"],\s*[^,]+,\s*([^)]+)\)",
        }
        
    def parse_file(self, file_path: str) -> Dict:
        """Parse a single TypeScript route file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            return {
                'file_path': file_path,
                'file_name': os.path.basename(file_path),
                'routes': self._extract_routes(content),
                'imports': self._extract_imports(content),
                'exports': self._extract_exports(content)
            }
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return {'file_path': file_path, 'routes': [], 'error': str(e)}
    
    def _extract_routes(self, content: str) -> List[Dict]:
        """Extract route definitions from TypeScript content"""
        routes = []
        methods_pattern = '|'.join(self.http_methods)
        
        # Pattern for router.method('/path', handler)
        pattern = rf"router\.({methods_pattern})\s*\(\s*['\"]([^'\"]+)['\"].*?(?:,\s*([^)]+))?\)"
        
        matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
        
        for match in matches:
            method = match.group(1).upper()
            path = match.group(2)
            handler_info = match.group(3) if match.group(3) else 'unknown'
            
            # Clean up path parameters
            clean_path = self._normalize_path(path)
            
            routes.append({
                'method': method,
                'path': clean_path,
                'original_path': path,
                'handler': handler_info.strip() if handler_info else 'unknown',
                'parameters': self._extract_path_parameters(path),
                'line_number': content[:match.start()].count('\n') + 1
            })
        
        return routes
    
    def _extract_imports(self, content: str) -> List[str]:
        """Extract import statements"""
        import_pattern = r"import\s+.*?from\s+['\"]([^'\"]+)['\"]"
        matches = re.findall(import_pattern, content)
        return matches
    
    def _extract_exports(self, content: str) -> List[str]:
        """Extract export statements"""
        export_pattern = r"export\s+.*?(?:router|Router)"
        matches = re.findall(export_pattern, content)
        return matches
    
    def _normalize_path(self, path: str) -> str:
        """Normalize Express route paths to OpenAPI format"""
        # Convert Express :param to OpenAPI {param}
        normalized = re.sub(r':(\w+)', r'{\1}', path)
        return normalized
    
    def _extract_path_parameters(self, path: str) -> List[Dict]:
        """Extract path parameters from route"""
        params = []
        param_matches = re.findall(r':(\w+)', path)
        
        for param in param_matches:
            params.append({
                'name': param,
                'in': 'path',
                'required': True,
                'type': 'string'
            })
        
        return params
    
    def parse_directory(self, routes_dir: str) -> Dict:
        """Parse all TypeScript files in a directory"""
        routes_path = Path(routes_dir)
        if not routes_path.exists():
            raise FileNotFoundError(f"Routes directory not found: {routes_dir}")
        
        parsed_files = {}
        
        for ts_file in routes_path.glob('*.ts'):
            file_key = ts_file.stem  # filename without extension
            parsed_files[file_key] = self.parse_file(str(ts_file))
        
        return parsed_files


def main():
    """Main function for testing"""
    parser = TypeScriptRouteParser()
    
    # Test with backend-v2 routes
    routes_dir = '/Users/chris/Projects/llm-api-vault-v2/backend-v2/src/routes'
    
    try:
        parsed_data = parser.parse_directory(routes_dir)
        
        # Print summary
        print(f"\n📁 Parsed {len(parsed_data)} route files:")
        
        total_routes = 0
        for file_name, file_data in parsed_data.items():
            if 'error' not in file_data:
                route_count = len(file_data['routes'])
                total_routes += route_count
                print(f"  🗂️  {file_name}.ts: {route_count} routes")
            else:
                print(f"  ❌ {file_name}.ts: ERROR - {file_data['error']}")
        
        print(f"\n📊 Total routes found: {total_routes}")
        
        # Show sample routes from auth.ts
        if 'auth' in parsed_data and 'routes' in parsed_data['auth']:
            print(f"\n🔑 Sample routes from auth.ts:")
            for route in parsed_data['auth']['routes'][:5]:  # First 5 routes
                print(f"  {route['method']} {route['path']}")
        
        return parsed_data
        
    except Exception as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    main()